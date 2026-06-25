/**
 * Tiny CSV importer for the customers page. Intentionally dependency-free.
 * Expected header columns (case/space-insensitive):
 *   name,email,phone,service_date,service_type,consent_email,consent_sms
 */
export interface CsvCustomerRow {
  name: string;
  email?: string;
  phone?: string;
  service_date?: string;
  service_type?: string;
  consent_email?: string;
  consent_sms?: string;
}

export function truthy(v?: string): boolean {
  if (!v) return false;
  return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
}

/** Split a single CSV line, honoring double-quoted fields with "" escaping. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Parse CSV text into customer rows. Rows without a name are skipped. */
export function parseCustomersCsv(text: string): CsvCustomerRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_"),
  );
  const rows: CsvCustomerRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const rec: Record<string, string> = {};
    header.forEach((h, i) => (rec[h] = cells[i] ?? ""));
    if (!rec.name) continue;
    rows.push(rec as unknown as CsvCustomerRow);
  }
  return rows;
}
