import type { Channel } from "amqplib";

export const CAMPAIGN_EXCHANGE = "campaign.exchange";
export const CAMPAIGN_DLX = "campaign.dlx";

export const CAMPAIGN_SEND_QUEUE = "campaign.send.queue";
export const CAMPAIGN_DLQ = "campaign.dlq";

export const ROUTING_KEY_SEND = "campaign.send";
export const ROUTING_KEY_DLQ = "campaign.dlq";

/**
 * Asserts the campaign exchange + queue + dead-letter chain.
 * Idempotent — safe to call on every (re)connect.
 */
export async function assertCampaignTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(CAMPAIGN_EXCHANGE, "direct", { durable: true });
  await channel.assertExchange(CAMPAIGN_DLX, "direct", { durable: true });

  await channel.assertQueue(CAMPAIGN_DLQ, { durable: true });
  await channel.bindQueue(CAMPAIGN_DLQ, CAMPAIGN_DLX, ROUTING_KEY_DLQ);

  await channel.assertQueue(CAMPAIGN_SEND_QUEUE, {
    durable: true,
    deadLetterExchange: CAMPAIGN_DLX,
    deadLetterRoutingKey: ROUTING_KEY_DLQ,
  });
  await channel.bindQueue(
    CAMPAIGN_SEND_QUEUE,
    CAMPAIGN_EXCHANGE,
    ROUTING_KEY_SEND,
  );
}
