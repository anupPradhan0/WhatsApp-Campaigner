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
 * Returns `true` if the message was handed to the broker, `false` if the channel
 * is not currently available (caller decides whether to mark the campaign failed).
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

  const ok = channel.publish(
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

  if (!ok) {
    console.warn(
      "[producer] publish returned false (back-pressure) for campaign:",
      campaignId,
    );
  }

  return ok;
}
