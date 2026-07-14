/**
 * Minimal CSV serialization helper for admin data exports.
 * Escapes values per RFC 4180 (quotes doubled, wrapped when they contain
 * a comma, quote, or newline) so exports open cleanly in Excel/Sheets.
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(escapeCsvValue).join(",");
  const lines = rows.map((row) => columns.map((col) => escapeCsvValue(row[col])).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}

export function sendCsv(res: { setHeader: (k: string, v: string) => void; send: (body: string) => void }, filename: string, csv: string): void {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // Prepend a UTF-8 BOM so Excel detects accented characters (é, à…) correctly.
  res.send(`\uFEFF${csv}`);
}
