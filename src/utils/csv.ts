/**
 * Minimal CSV parser for OpenFlights `.dat` files. Handles double-quoted fields
 * (with escaped `""`) and the OpenFlights null marker `\N`.
 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** Parse a whole `.dat` document into rows of string cells (blank lines skipped). */
export function parseDat(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().length === 0) continue;
    rows.push(parseCsvLine(line));
  }
  return rows;
}

/** OpenFlights uses the literal `\N` for null; normalise empty/`\N` to null. */
export function nullable(value: string | undefined): string | null {
  if (value === undefined) return null;
  const v = value.trim();
  return v === '' || v === '\\N' ? null : v;
}
