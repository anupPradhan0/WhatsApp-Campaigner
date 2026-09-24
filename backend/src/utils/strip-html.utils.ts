/**
 * Rich-text HTML → plain text for Excel (and anything else that can't render HTML).
 * Mirrors frontend/src/lib/stripHtml.ts without a DOM.
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );

  return text.replace(/\n{3,}/g, "\n\n").trim();
}
