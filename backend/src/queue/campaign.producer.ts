import { getChannel } from "../config/rabbitmq.js";
import {
  CAMPAIGN_EXCHANGE,
  ROUTING_KEY_SEND,
} from "./topology.js";

export interface CampaignJobPayload {
  campaignId: string;
  enqueuedAt: string;
}

/**
 * Publish a campaign-send job. The worker reloads the campaign from Mongo by ID,
 * so we keep the payload minimal.
 *
 * Returns `true` when the message has been handed to the channel (the broker
 * will pick it up — note that without publisher confirms there's a tiny
 * window where a broker crash mid-flight could lose it).
 * Returns `false` only when no channel is available, in which case the caller
 * should mark the campaign failed.
 */
export function publishCampaignJob(campaignId: string): boolean {
  const channel = getChannel();
  if (!channel) {
    console.warn(
      "[producer] no RabbitMQ channel available; campaign not enqueued:",
      campaignId,
    );
    return false;
  }

  const payload: CampaignJobPayload = {
    campaignId,
    enqueuedAt: new Date().toISOString(),
  };

  try {
    const drained = channel.publish(
      CAMPAIGN_EXCHANGE,
      ROUTING_KEY_SEND,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: "application/json",
        messageId: campaignId,
        timestamp: Date.now(),
      },
    );

    // `drained === false` is back-pressure, NOT a publish failure. The message
    // was still queued into the channel's write buffer; the broker will pick
    // it up. We just log so ops can spot sustained back-pressure.
    if (!drained) {
      console.warn(
        "[producer] channel back-pressure for campaign:",
        campaignId,
      );
    }
    return true;
  } catch (err) {
    console.error(
      "[producer] publish threw for campaign",
      campaignId,
      "—",
      (err as Error).message,
    );
    return false;
  }
}
