import { api } from '../api/client';
import { toast } from 'sonner';

/** Content included in a modern Excel campaign download. */
export type CampaignExportType = 'all' | 'numbers';

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
  exportType: CampaignExportType = 'all',
  recipientCount?: number,
): Promise<void> {
  const statusMessage = recipientCount && recipientCount >= 10_000
    ? `Preparing Excel for ${recipientCount.toLocaleString()} recipients. This large file may take a little while…`
    : 'Preparing your Excel file…';
  const toastId = toast.loading(statusMessage, { duration: Infinity });

  try {
    const numbersOnly = exportType === 'numbers';
    const res = await api.get(`/api/dashboard/export-campaign/${id}?numbersOnly=${numbersOnly}`, {
      responseType: 'blob',
      // Large campaigns can take longer than the API client's normal 30 second
      // timeout while ExcelJS builds the workbook.
      timeout: 180_000,
      validateStatus: () => true,
    });

    if (res.status >= 400) {
      const body = await (res.data as Blob).text();
      let msg = 'Failed to download campaign';
      try {
        msg = JSON.parse(body)?.message || msg;
      } catch {
        if (body.trim()) msg = body.slice(0, 240);
      }
      throw new Error(msg);
    }

    const name = filenameFrom(res.headers['content-disposition'] || '')
      || `Campaign_${id}${numbersOnly ? '_numbers' : ''}.xlsx`;

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Your Excel download is ready.', { id: toastId, duration: 4000 });
  } catch (error) {
    toast.dismiss(toastId);
    throw error;
  }
}
