import dns from "dns/promises";
import type mongoose from "mongoose";
import { env } from "../config/env.js";
import type { IUser } from "../models/user.model.js";
import { canManageAccounts } from "../utils/role-hierarchy.utils.js";
import { findOneUser, updateUserById } from "../repositories/user.repository.js";
import { registerDomainWithDokploy } from "./dokploy.service.js";

function fail(code: string): Error & { code: string } {
  const err = new Error(code) as Error & { code: string };
  err.code = code;
  return err;
}

/** Only account managers run a white-label panel; plain users never do. */
function ensureCanWhiteLabel(actor: IUser): void {
  if (!canManageAccounts(actor.role)) throw fail("FORBIDDEN_DOMAIN");
}

export type DomainState = {
  domain: string | null;
  verified: boolean;
  /** What the customer must put in DNS. */
  cnameTarget: string | null;
};

export function domainState(user: IUser): DomainState {
  return {
    domain: user.domain ?? null,
    verified: Boolean(user.domainVerifiedAt),
    cnameTarget: env.PLATFORM_DOMAIN ?? null,
  };
}

/**
 * Claim a host. Stored unverified — it only starts resolving once the CNAME
 * check passes, so an unverified claim grants nothing but the name reservation
 * enforced by the unique index.
 */
export async function setDomain(actor: IUser, host: string): Promise<DomainState> {
  ensureCanWhiteLabel(actor);

  const domain = host.toLowerCase().trim().replace(/\.$/, "");
  if (domain === env.PLATFORM_DOMAIN?.toLowerCase()) throw fail("DOMAIN_RESERVED");

  const taken = await findOneUser({ domain });
  if (taken && taken._id.toString() !== actor._id.toString()) throw fail("DOMAIN_TAKEN");

  await updateUserById(actor._id as mongoose.Types.ObjectId, {
    $set: { domain, domainVerifiedAt: null },
  });

  return { domain, verified: false, cnameTarget: env.PLATFORM_DOMAIN ?? null };
}

export async function clearDomain(actor: IUser): Promise<DomainState> {
  ensureCanWhiteLabel(actor);
  await updateUserById(actor._id as mongoose.Types.ObjectId, {
    $unset: { domain: "", domainVerifiedAt: "" },
  });
  return { domain: null, verified: false, cnameTarget: env.PLATFORM_DOMAIN ?? null };
}

/**
 * Confirm the customer pointed their host at us, then ask Dokploy to route it.
 * CNAME only: a root domain can't hold one, so tenants must use a subdomain.
 */
export async function verifyDomain(
  actor: IUser
): Promise<DomainState & { routed: boolean }> {
  ensureCanWhiteLabel(actor);

  const domain = actor.domain;
  if (!domain) throw fail("NO_DOMAIN");
  if (!env.PLATFORM_DOMAIN) throw fail("PLATFORM_DOMAIN_UNSET");

  const expected = env.PLATFORM_DOMAIN.toLowerCase().replace(/\.$/, "");
  let targets: string[];
  try {
    targets = await dns.resolveCname(domain);
  } catch {
    // ENOTFOUND / ENODATA — no CNAME published (yet), or an A record instead.
    throw fail("CNAME_NOT_FOUND");
  }

  const points = targets.some(
    (t) => t.toLowerCase().replace(/\.$/, "") === expected
  );
  if (!points) throw fail("CNAME_MISMATCH");

  await updateUserById(actor._id as mongoose.Types.ObjectId, {
    $set: { domainVerifiedAt: new Date() },
  });

  // Routing failure must not undo verification — the DNS half is done, and
  // registration can be retried by hitting verify again.
  let routed = false;
  try {
    routed = await registerDomainWithDokploy(domain);
  } catch (error) {
    console.error("[domain] Dokploy registration failed:", error);
  }

  return { domain, verified: true, cnameTarget: expected, routed };
}
