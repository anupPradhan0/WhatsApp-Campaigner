import { z } from "zod";

const objectIdString = z.string().min(24).max(24);

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Public self-registration. `role` and `balance` are intentionally NOT accepted
// from the client — they are forced to USER / 0 server-side. Privileged accounts
// and credit assignment go through admin/reseller-only flows.
export const registrationBodySchema = z.object({
  companyName: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(1),
  number: z.coerce.number().int().positive(),
});

export const bootstrapAdminBodySchema = z.object({
  companyName: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(1),
  number: z.coerce.number().int().positive(),
});

export const updateProfileBodySchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  number: z.coerce.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegistrationBody = z.infer<typeof registrationBodySchema>;
export type BootstrapAdminBody = z.infer<typeof bootstrapAdminBodySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

export const userIdParamSchema = z.object({
  userId: objectIdString,
});

export const newsIdParamSchema = z.object({
  newsId: objectIdString,
});

export const complaintIdParamSchema = z.object({
  complaintId: objectIdString,
});

export const campaignIdParamSchema = z.object({
  campaignId: objectIdString,
});
