import crypto from 'crypto';

export type SubscriptionTierId = 'program' | 'all_in' | 'concierge';

const TIER_AI_LIMITS: Record<SubscriptionTierId, number> = {
  program: 0,
  all_in: 20,
  concierge: 50,
};

export interface SubscriptionPayload {
  tier: SubscriptionTierId;
  deviceId: string;
  expiresAt: number;
}

function getSecret(): string | null {
  return process.env.SUBSCRIPTION_SIGNING_SECRET?.trim() || null;
}

export function signSubscription(payload: SubscriptionPayload): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const body = JSON.stringify({
    tier: payload.tier,
    deviceId: payload.deviceId,
    expiresAt: payload.expiresAt,
  });
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return Buffer.from(JSON.stringify({ ...JSON.parse(body), sig })).toString('base64url');
}

export function verifySubscriptionToken(
  token: string | undefined,
  deviceId: string,
): SubscriptionPayload | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as SubscriptionPayload & { sig: string };
    const { sig, ...payload } = parsed;
    const body = JSON.stringify({
      tier: payload.tier,
      deviceId: payload.deviceId,
      expiresAt: payload.expiresAt,
    });
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (sig !== expected) return null;
    if (payload.deviceId !== deviceId) return null;
    if (Date.now() > payload.expiresAt) return null;
    if (!TIER_AI_LIMITS[payload.tier] && payload.tier !== 'program') return null;
    return payload;
  } catch {
    return null;
  }
}

export function subscriptionAiDailyLimit(tier: SubscriptionTierId): number {
  return TIER_AI_LIMITS[tier] ?? 0;
}
