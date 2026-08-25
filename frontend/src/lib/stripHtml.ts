/**
 * Rich-text HTML → plain text, preserving line breaks.
 *
 * Reading `textContent` alone concatenates block elements ("<p>A</p><p>B</p>"
 * becomes "AB"), so block-closing tags and <br> are turned into newlines first.
 * Parsing happens on a detached node — no scripts run and no images load — so
 * this is safe for rendering another user's stored message.
 */
export const stripHtml = (h: string): string => {
  if (!h) return '';
  const el = document.createElement('div');
  el.innerHTML = h
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n');
  return (el.textContent ?? '')
    .replace(/\n{3,}/g, '\n\n') // collapse runaway blank lines
    .trim();
};
