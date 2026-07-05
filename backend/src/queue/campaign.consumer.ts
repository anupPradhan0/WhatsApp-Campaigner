import type { Channel, ConsumeMessage } from "amqplib";
import { env } from "../config/env.js";
import {
  CampaignStats,
  DeliveryStatus,
  type ICampaign,
  type IDeliveryResult,
} from "../models/campaign.model.js";
import { findCampaignById } from "../repositories/campaign.repository.js";
import { sendOneMessage } from "../services/whatsapp-gateway.service.js";
import {
  CAMPAIGN_EXCHANGE,
  CAMPAIGN_SEND_QUEUE,
  ROUTING_KEY_SEND,
} from "./topology.js";
import type { CampaignJobPayload } from "./campaign.producer.js";

const RETRY_HEADER = "x-retry-count";

interface ConsumerState {
  channel: Channel | null;
  consumerTag: string | null;
}

const state: ConsumerState = { channel: null, consumerTag: null };

function readRetryCount(msg: ConsumeMessage): number {
  const raw = msg.properties.headers?.[RETRY_HEADER];
  if (typeof raw === "number") return raw;
  return 0;
}

/**
 * Channel can be closed between message-arrival and our reply, in which case
 * ack/nack/publish will throw "channel closed". The broker auto-redelivers
 * unacked messages on next connect, so swallowing the throw is safe.
 */
function safeAck(channel: Channel, msg: ConsumeMessage): void {
  try {
    channel.ack(msg);
  } catch (err) {
    console.warn("[consumer] ack failed:", (err as Error).message);
  }
}

function safeNack(channel: Channel, msg: ConsumeMessage): void {
  try {
    channel.nack(msg, false, false);
  } catch (err) {
    console.warn("[consumer] nack failed:", (err as Error).message);
  }
}

function safeRepublish(
  channel: Channel,
  msg: ConsumeMessage,
  retryCount: number,
): boolean {
  try {
    channel.publish(CAMPAIGN_EXCHANGE, ROUTING_KEY_SEND, msg.content, {
      persistent: true,
      contentType: msg.properties.contentType ?? "application/json",
      messageId: msg.properties.messageId,
      timestamp: Date.now(),
      headers: {
        ...msg.properties.headers,
        [RETRY_HEADER]: retryCount,
      },
    });
    return true;
  } catch (err) {
    console.warn(
      "[consumer] retry republish failed:",
      (err as Error).message,
    );
    return false;
  }
}

/**
 * Process a single campaign job: load by ID, send each number, record per-number
 * results. Status is left PENDING (never auto-progressed). Throws on transient
 * errors (caller handles retry).
 */
async function processCampaignJob(payload: CampaignJobPayload): Promise<void> {
  const campaign = await findCampaignById(payload.campaignId);
  if (!campaign) {
    console.warn(
      "[consumer] campaign not found, dropping job:",
      payload.campaignId,
    );
    return;
  }

  // Idempotency: skip any terminal state. Re-injected DLQ messages or
  // duplicate publishes should not re-run the send.
  if (
    campaign.status === CampaignStats.DELIVERED ||
    campaign.status === CampaignStats.FAILED
  ) {
    console.log(
      `[consumer] campaign in terminal state (${campaign.status}), skipping:`,
      payload.campaignId,
    );
    return;
  }

  // NOTE: we intentionally do NOT change the campaign status here. Campaigns
  // stay PENDING by default until an admin/super admin sets the final status
  // manually — the worker never auto-progresses status.

  let sent = 0;
  let failed = 0;
  // Record the per-recipient outcome so the report page can show delivered/failed
  // for each number. Order mirrors campaign.mobileNumbers.
  const results: IDeliveryResult[] = [];
  for (const number of campaign.mobileNumbers) {
    try {
      const ok = await sendOneMessage(campaign, number);
      if (ok) {
        sent += 1;
        results.push({
          number,
          status: DeliveryStatus.DELIVERED,
          sentAt: new Date(),
        });
      } else {
        failed += 1;
        results.push({
          number,
          status: DeliveryStatus.FAILED,
          sentAt: new Date(),
        });
      }
    } catch (err) {
      // Transient: propagate so the whole job retries.
      console.error(
        `[consumer] transient send error for ${payload.campaignId} → ${number}:`,
        (err as Error).message,
      );
      throw err;
    }
  }

  // Record the per-recipient outcome for audit, but DO NOT change the campaign
  // status — it stays PENDING until an admin/super admin sets it manually.
  campaign.deliveryResults = results;
  await campaign.save();

  console.log(
    `[consumer] campaign ${payload.campaignId} processed (left pending): sent=${sent} failed=${failed}`,
  );
}

async function handleMessage(
  channel: Channel,
  msg: ConsumeMessage,
): Promise<void> {
  let payload: CampaignJobPayload;
  try {
    payload = JSON.parse(msg.content.toString()) as CampaignJobPayload;
  } catch (err) {
    console.error(
      "[consumer] malformed payload, sending to DLQ:",
      (err as Error).message,
    );
    safeNack(channel, msg);
    return;
  }

  const retryCount = readRetryCount(msg);
  try {
    await processCampaignJob(payload);
    safeAck(channel, msg);
  } catch (err) {
    const errMsg = (err as Error).message;
    if (retryCount < env.WORKER_MAX_RETRIES) {
      console.warn(
        `[consumer] retry ${retryCount + 1}/${env.WORKER_MAX_RETRIES} for campaign ${payload.campaignId}: ${errMsg}`,
      );
      const republished = safeRepublish(channel, msg, retryCount + 1);
      if (republished) {
        safeAck(channel, msg);
        return;
      }
      // Republish failed (channel closed). Don't ack — broker will redeliver
      // on next connect; existing retry count stays so we still progress.
      return;
    }

    console.error(
      `[consumer] giving up on campaign ${payload.campaignId} after ${retryCount} retries: ${errMsg}`,
    );
    // Leave the campaign PENDING — we never auto-mark it failed. An admin/super
    // admin decides the final status manually.
    // nack without requeue → DLQ via DLX.
    safeNack(channel, msg);
  }
}

/**
 * Start consuming campaign-send jobs. Idempotent — safe to call on reconnect.
 */
export async function startCampaignConsumer(channel: Channel): Promise<void> {
  // If we previously had a consumer on a now-dead channel, drop the stale tag.
  state.channel = channel;
  state.consumerTag = null;

  await channel.prefetch(1);
  const { consumerTag } = await channel.consume(
    CAMPAIGN_SEND_QUEUE,
    (msg) => {
      if (!msg) return;
      void handleMessage(channel, msg);
    },
    { noAck: false },
  );

  state.consumerTag = consumerTag;
  console.log(
    `[consumer] subscribed to ${CAMPAIGN_SEND_QUEUE} (prefetch=1, tag=${consumerTag})`,
  );
}

export async function stopCampaignConsumer(): Promise<void> {
  if (state.channel && state.consumerTag) {
    try {
      await state.channel.cancel(state.consumerTag);
    } catch (err) {
      console.warn(
        "[consumer] cancel failed (likely channel closed):",
        (err as Error).message,
      );
    }
  }
  state.channel = null;
  state.consumerTag = null;
}
