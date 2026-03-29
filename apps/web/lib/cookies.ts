import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error('Missing COOKIE_SECRET env var');
  return secret;
}

export function signValue(value: string): string {
  const hmac = createHmac('sha256', getSecret()).update(value).digest('hex');
  return `${value}.${hmac}`;
}

export function verifySignedValue(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.');
  if (lastDot === -1) return null;

  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = createHmac('sha256', getSecret()).update(value).digest('hex');

  if (sig.length !== expected.length) return null;

  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length) return null;

  return timingSafeEqual(sigBuf, expectedBuf) ? value : null;
}

export function generateNonce(): string {
  return randomUUID();
}
