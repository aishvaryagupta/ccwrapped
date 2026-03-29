import { formatCost, formatTokens } from '@ccwrapped/core';

const ESC = '\x1b[';

export const bold = (s: string) => `${ESC}1m${s}${ESC}0m`;
export const dim = (s: string) => `${ESC}2m${s}${ESC}0m`;
export const green = (s: string) => `${ESC}32m${s}${ESC}0m`;
export const yellow = (s: string) => `${ESC}33m${s}${ESC}0m`;
export const red = (s: string) => `${ESC}31m${s}${ESC}0m`;

export { formatCost, formatTokens };

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
