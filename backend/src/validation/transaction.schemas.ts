import { z } from "zod";

export const creditBalanceBodySchema = z.object({
  receiverId: z.string().min(24).max(24),
  amount: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const debitBalanceBodySchema = z.object({
  userId: z.string().min(24).max(24),
  amount: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export type CreditBalanceBody = z.infer<typeof creditBalanceBodySchema>;
export type DebitBalanceBody = z.infer<typeof debitBalanceBodySchema>;
