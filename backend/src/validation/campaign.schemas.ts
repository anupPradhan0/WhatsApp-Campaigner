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
  message: z.string().min(1).max(1000),
  phoneButtonText: z.string().max(20).optional(),
  phoneButtonNumber: z.string().optional(),
  linkButtonText: z.string().max(20).optional(),
  linkButtonUrl: z.string().optional(),
  mobileNumberEntryType: z.nativeEnum(MobileNumberEntryType),
  mobileNumbers: mobileNumbersField,
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  fileUrl: z.string().url().optional(),
  mediaType: z.nativeEnum(MediaType).optional(),
});

export const campaignStatsBodySchema = z.object({
  status: z.nativeEnum(CampaignStats),
  statusMessage: z.string().max(200).optional(),
});

export type CreateCampaignBody = z.infer<typeof createCampaignBodySchema>;
export type CampaignStatsBody = z.infer<typeof campaignStatsBodySchema>;
