const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

/** Strips spaces and punctuation. Returns null when nothing is left. */
export function normaliseAbn(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  return digits.length ? digits : null;
}

/**
 * ATO checksum: subtract 1 from the first digit, weight the eleven digits,
 * and the sum must divide by 89.
 */
export function isValidAbn(input: string | null | undefined): boolean {
  const abn = normaliseAbn(input);
  if (!abn || abn.length !== 11) return false;
  const d = abn.split('').map(Number);
  d[0] -= 1;
  const sum = d.reduce((acc, n, i) => acc + n * WEIGHTS[i], 0);
  return sum % 89 === 0;
}

export function formatAbn(abn: string | null | undefined): string {
  const n = normaliseAbn(abn);
  if (!n || n.length !== 11) return abn ?? '';
  return `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
}
