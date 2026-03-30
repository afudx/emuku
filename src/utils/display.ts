import c from 'ansi-colors';

export function tableLines(headers: string[], rows: string[][]): string[] {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length))
  );

  const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - s.length));
  const separator = widths.map(w => '-'.repeat(w)).join('  ');

  const lines: string[] = [];
  lines.push(c.bold(headers.map((h, i) => pad(h, widths[i]!)).join('  ')));
  lines.push(c.dim(separator));
  for (const row of rows) {
    lines.push(row.map((cell, i) => pad(cell, widths[i] ?? 0)).join('  '));
  }
  return lines;
}

export function table(headers: string[], rows: string[][]): void {
  for (const line of tableLines(headers, rows)) {
    console.log(line);
  }
}

export function statusBadge(state: string): string {
  if (state === 'Booted' || state === 'Running') return c.green(state);
  return c.dim(state);
}

