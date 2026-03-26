const ESC = '\x1b[';

export const bold = (s: string) => `${ESC}1m${s}${ESC}0m`;
export const dim = (s: string) => `${ESC}2m${s}${ESC}0m`;
export const green = (s: string) => `${ESC}32m${s}${ESC}0m`;
export const yellow = (s: string) => `${ESC}33m${s}${ESC}0m`;
export const red = (s: string) => `${ESC}31m${s}${ESC}0m`;
export const cyan = (s: string) => `${ESC}36m${s}${ESC}0m`;

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function padRight(s: string, len: number): string {
  return s + ' '.repeat(Math.max(0, len - s.length));
}

export function printTable(
  headers: string[],
  rows: string[][],
  colWidths: number[],
): void {
  const headerLine = headers
    .map((h, i) => padRight(h, colWidths[i]))
    .join('  ');
  console.log(bold(headerLine));
  console.log(dim('─'.repeat(headerLine.length)));
  for (const row of rows) {
    console.log(row.map((c, i) => padRight(c, colWidths[i])).join('  '));
  }
}
