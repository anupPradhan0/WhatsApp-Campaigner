/**
 * Shared Tailwind class strings for the recurring UI patterns across pages.
 * Pages compose these (optionally with `cn`) instead of re-declaring inline
 * style objects. Colors come from the brand palette registered in index.css
 * (bg-surface, text-fg-muted, border-line, bg-brand, …).
 */

/** Standard form control (input / select / textarea). Replaces the old `inp` object. */
export const fieldCls =
  "w-full px-3 py-[9px] bg-surface2 border border-line rounded-lg text-[13px] text-fg outline-none transition-colors focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed";

/** Field label (small uppercase). */
export const labelCls =
  "block text-[11px] font-semibold text-fg-muted uppercase tracking-[0.07em] mb-1.5";

/** Section / content card. */
export const cardCls = "bg-surface border border-line rounded-xl px-6 py-5";

/** Primary (green) action button. */
export const btnPrimaryCls =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-semibold text-sm rounded-lg cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

/** Neutral / secondary button. */
export const btnGhostCls =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface2 hover:bg-line border border-line text-fg font-medium text-sm rounded-lg cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

/** Destructive button. */
export const btnDangerCls =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-danger-dim hover:bg-danger/20 border border-danger-border text-danger font-medium text-sm rounded-lg cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

/** Modal overlay + panel. */
export const modalOverlayCls =
  "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70";
export const modalPanelCls =
  "w-full max-w-md bg-surface border border-line rounded-2xl p-8";
