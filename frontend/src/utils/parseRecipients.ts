import * as XLSX from 'xlsx';

/**
 * Normalize a single cell/token into a phone number, or return null if it
 * doesn't look like one. Keeps an optional leading "+" and digits only;
 * accepts 7–15 digits (covers local numbers and full international format).
 */
function cleanNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return (hasPlus ? '+' : '') + digits;
}

function extractFromText(text: string): string[] {
  return text
    .split(/[\n,;\t]+/)
    .map(cleanNumber)
    .filter((n): n is string => n !== null);
}

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('ms-excel')
  );
}

/**
 * Parse a CSV or Excel (.xlsx/.xls) file and return a de-duplicated list of
 * phone numbers found in it. Scans every cell of every sheet, so it works
 * regardless of which column the numbers live in.
 */
export async function parseRecipientsFile(file: File): Promise<string[]> {
  const found: string[] = [];

  if (isExcelFile(file)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    for (const sheetName of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
        header: 1,
        blankrows: false,
      });
      for (const row of rows) {
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          if (cell === null || cell === undefined) continue;
          const n = cleanNumber(String(cell));
          if (n) found.push(n);
        }
      }
    }
  } else {
    const text = await file.text();
    found.push(...extractFromText(text));
  }

  // De-duplicate while preserving the order they appeared.
  return Array.from(new Set(found));
}
