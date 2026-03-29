import c from 'ansi-colors';

export function table(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length))
  );

  const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - s.length));
  const separator = widths.map(w => '-'.repeat(w)).join('  ');

  console.log(c.bold(headers.map((h, i) => pad(h, widths[i]!)).join('  ')));
  console.log(c.dim(separator));
  for (const row of rows) {
    console.log(row.map((cell, i) => pad(cell, widths[i] ?? 0)).join('  '));
  }
}

export function statusBadge(state: string): string {
  if (state === 'Booted' || state === 'Running') return c.green(state);
  return c.dim(state);
}

