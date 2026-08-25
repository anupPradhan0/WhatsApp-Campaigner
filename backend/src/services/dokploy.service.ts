import { env } from "../config/env.js";

/**
 * Attach a verified white-label host to the Dokploy applications so Traefik
 * routes it and issues its Let's Encrypt certificate. Two entries per domain:
 * "/" to the SPA, "/api" to the backend (stripPath off — Express expects the
 * prefix).
 *
 * Best-effort by design: a verified domain stays verified even if Dokploy is
 * unreachable, and the caller reports the routing state separately.
 */
export async function registerDomainWithDokploy(host: string): Promise<boolean> {
  const { DOKPLOY_URL, DOKPLOY_API_KEY, DOKPLOY_FRONTEND_APP_ID, DOKPLOY_BACKEND_APP_ID } = env;

  if (!DOKPLOY_URL || !DOKPLOY_API_KEY || !DOKPLOY_FRONTEND_APP_ID || !DOKPLOY_BACKEND_APP_ID) {
    console.warn(
      `[domain] Dokploy not configured — ${host} verified but not routed. ` +
        "Add the domain manually or set DOKPLOY_URL/API_KEY/FRONTEND_APP_ID/BACKEND_APP_ID."
    );
    return false;
  }

  const entries = [
    { applicationId: DOKPLOY_FRONTEND_APP_ID, path: "/", port: 80 },
    { applicationId: DOKPLOY_BACKEND_APP_ID, path: "/api", port: env.PORT },
  ];

  for (const entry of entries) {
    const res = await fetch(`${DOKPLOY_URL.replace(/\/+$/, "")}/api/domain.create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": DOKPLOY_API_KEY,
      },
      body: JSON.stringify({
        host,
        https: true,
        certificateType: "letsencrypt",
        stripPath: false,
        // Dokploy requires these — omitting domainType fails schema validation.
        domainType: "application",
        internalPath: "/",
        ...entry,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Dokploy domain.create failed for ${host} (${entry.path}): ${res.status} ${await res.text()}`
      );
    }
  }

  return true;
}
