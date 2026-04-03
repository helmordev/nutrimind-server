import { redis } from '@/config/redis';

// Excludes visually ambiguous characters: 0, O, I, 1, l
// Charset length = 32 (24 letters + 8 digits). 256 % 32 === 0 → no modulo bias.
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const KEY_PREFIX = 'server_code';

export function generateServerCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_CHARSET[b % CODE_CHARSET.length]).join('');
}

export async function cacheServerCode(
  code: string,
  hubId: string,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(`${KEY_PREFIX}:${code}`, hubId, 'EX', ttlSeconds);
}

export async function getHubIdByCode(code: string): Promise<string | null> {
  return redis.get(`${KEY_PREFIX}:${code}`);
}

export async function invalidateServerCode(code: string): Promise<void> {
  await redis.del(`${KEY_PREFIX}:${code}`);
}
