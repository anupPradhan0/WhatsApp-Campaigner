import { api } from '../api/client';

/** Excel flavours offered on download: legacy 97-2003 (.xls) or modern (.xlsx). */
export type ExcelFormat = 'xlsx' | 'xls';

/**
 * Filename out of a Content-Disposition header.
 *
 * The capture must EXCLUDE the closing quote: a greedy `.+` swallows it into
 * the name, so the browser sees an illegal `"` in the filename, rewrites it to
 * `_`, and saves `campaign_….xlsx_` — which has no real extension and won't
 * open in Excel.
 */
const filenameFrom = (cd: string): string | undefined =>
  cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)?.[1]?.trim();

/**
 * Fetch a campaign export and hand it to the browser as a download.
 * Shared by the campaign list and the campaign detail page so the header
 * parsing above only has to be right once.
 */
export async function downloadCampaignExcel(
  id: string,
  fileFormat: ExcelFormat = 'xlsx',
): Promise<void> {
  const res = await api.get(`/api/dashboard/export-campaign/${id}?format=${fileFormat}`, {
    responseType: 'blob',
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    const body = await (res.data as Blob).text();
    let msg = 'Failed to download campaign';
    try { msg = JSON.parse(body)?.message || msg; } catch { /* non-JSON error body — keep fallback */ }
    throw new Error(msg);
  }

  const name = filenameFrom(res.headers['content-disposition'] || '')
    || `Campaign_${id}.${fileFormat}`;

  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
