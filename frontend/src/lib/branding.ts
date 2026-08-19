import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { QK } from "@/lib/queryKeys";

export type Branding = {
  companyName: string;
  logo: string;
  brandColor: string;
};

/** Platform defaults, used on our own domain and whenever a tenant omits a field. */
const DEFAULTS: Branding = {
  companyName: "WhatsApp Campaign Manager",
  logo: "",
  brandColor: "#16a34a",
};

/**
 * Paint the tenant's accent colour over the theme's brand tokens. The lighter
 * and darker shades are derived by the browser via color-mix, so a tenant only
 * ever supplies one hex and we never ship colour maths.
 */
function applyBranding(b: Branding): void {
  const root = document.documentElement.style;
  const c = b.brandColor;
  root.setProperty("--color-brand", c);
  root.setProperty("--color-brand-light", `color-mix(in oklab, ${c} 65%, white)`);
  root.setProperty("--color-brand-hover", `color-mix(in oklab, ${c} 80%, black)`);
  root.setProperty("--color-brand-dim", `color-mix(in oklab, ${c} 12%, transparent)`);
  root.setProperty("--color-brand-border", `color-mix(in oklab, ${c} 30%, transparent)`);
  // shadcn tokens share the accent.
  root.setProperty("--primary", c);
  root.setProperty("--ring", c);
  root.setProperty("--sidebar-primary", c);
  root.setProperty("--sidebar-ring", c);

  document.title = b.companyName;
  if (b.logo) {
    const icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (icon) icon.href = b.logo;
  }
}

/**
 * Resolves white-label branding for the host the SPA is served from. Shared
 * across components via React Query's cache, so the request happens once.
 */
export function useBranding(): Branding {
  const { data } = useQuery({
    queryKey: QK.branding(),
    queryFn: async (): Promise<Branding> => {
      const res = await api.get("/api/branding");
      const tenant: Partial<Branding> = res.data?.data ?? {};
      // Unset tenant fields come back as "" — drop them so DEFAULTS survive.
      const set = Object.fromEntries(
        Object.entries(tenant).filter(([, v]) => v !== "" && v != null),
      );
      return { ...DEFAULTS, ...set };
    },
    staleTime: Infinity,
    retry: false,
  });

  const branding = data ?? DEFAULTS;
  useEffect(() => {
    applyBranding(branding);
  }, [branding]);

  return branding;
}
