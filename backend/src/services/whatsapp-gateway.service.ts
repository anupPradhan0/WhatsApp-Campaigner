import { env } from "../config/env.js";
import type { ICampaign } from "../models/campaign.model.js";

/**
 * Stub WhatsApp gateway. Today: sleeps for WORKER_SEND_DELAY_MS to simulate work.
 *
 * Swap this single function with a real provider call (Meta Cloud API, Twilio,
 * Gupshup, etc.) when wiring in a live gateway. The rest of the pipeline
 * (queue → consumer → status update) does not need to change.
 *
 * Returns `true` on accepted send, `false` on permanent failure for that number.
 * Throw to signal a transient error (the consumer will retry the whole campaign).
 */
export async function sendOneMessage(
  _campaign: Pick<ICampaign, "message" | "media" | "phoneButton" | "linkButton" | "countryCode">,
  _number: string,
): Promise<boolean> {
  if (env.WORKER_SEND_DELAY_MS > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, env.WORKER_SEND_DELAY_MS),
    );
  }
  return true;
}
