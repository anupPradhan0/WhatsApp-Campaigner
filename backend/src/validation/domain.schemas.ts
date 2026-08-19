import { z } from "zod";

export const setDomainBodySchema = z.object({
  host: z
    .string()
    .trim()
    .toLowerCase()
    .max(253)
    // A dotted hostname; at least one label plus a TLD. Rejects schemes,
    // ports, paths and IPs, which Traefik would never match anyway.
    .regex(
      /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
      "Enter a hostname such as panel.yourbrand.com"
    ),
});

export type SetDomainBody = z.infer<typeof setDomainBodySchema>;
