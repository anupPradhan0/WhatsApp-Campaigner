import { z } from "zod";
import {
  CampaignStats,
  MediaType,
  MobileNumberEntryType,
} from "../models/campaign.model.js";

const mobileNumbersField = z.union([
  z.string(),
  z.array(z.string()),
]);

export const createCampaignBodySchema = z.object({
  campaignName: z.string().min(1).max(100),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "You have reached the message length limit of 4000 characters."),
  phoneButtonText: z.string().max(20).optional(),
  phoneButtonNumber: z.string().optional(),
  linkButtonText: z.string().max(20).optional(),
  linkButtonUrl: z.string().optional(),
  mobileNumberEntryType: z.nativeEnum(MobileNumberEntryType),
  mobileNumbers: mobileNumbersField,
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  fileUrl: z.string().url().optional(),
  mediaType: z.nativeEnum(MediaType).optional(),
  profileImageUrl: z.string().url().optional(),
  // When the balance can't cover every number, the client re-submits with this
  // flag set to explicitly confirm a partial send (only the affordable count).
  allowPartial: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
  // Save the campaign as a draft instead of sending it — no credits are charged
  // and it is not enqueued until the owner explicitly sends it later.
  saveAsDraft: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export const campaignStatsBodySchema = z.object({
  status: z.nativeEnum(CampaignStats),
  statusMessage: z.string().max(200).optional(),
});

export type CreateCampaignBody = z.infer<typeof createCampaignBodySchema>;
export type CampaignStatsBody = z.infer<typeof campaignStatsBodySchema>;
