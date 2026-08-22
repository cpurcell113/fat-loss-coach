/**
 * Server-side AI access control — subscription tier limits + coach override.
 */

import { subscriptionAiDailyLimit, verifySubscriptionToken } from './subscription-crypto';

export interface AiGuardResult {
  allowed: boolean;
  status: number;
  error?: string;
  remaining?: number;
  limit?: number;
  tier?: string;
}

type RateEntry = { count: number; date: string };

const store = globalThis as typeof globalThis & {
  __allinAiRateLimits?: Map<string, RateEntry>;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const val = headers[name];
  return Array.isArray(val) ? val[0] : val;
}

function getDeviceId(req: { headers: Record<string, string | string[] | undefined> }): string {
  return headerValue(req.headers, 'x-allin-device-id') || 'unknown';
}

function getClientKey(deviceId: string, req: { headers: Record<string, string | string[] | undefined> }): string {
  if (deviceId && deviceId !== 'unknown') return `device:${deviceId}`;
  const ip = headerValue(req.headers, 'x-forwarded-for')?.split(',')[0]?.trim();
  return `ip:${ip || 'unknown'}`;
}

function checkDailyLimit(key: string, limit: number): AiGuardResult {
  if (limit <= 0) {
    return {
      allowed: false,
      status: 403,
      error: 'AI coach is not included in your plan. Upgrade to All In or Concierge.',
      remaining: 0,
      limit: 0,
    };
  }

  if (!store.__allinAiRateLimits) store.__allinAiRateLimits = new Map();

  const day = todayUtc();
  const entry = store.__allinAiRateLimits.get(key);

  if (!entry || entry.date !== day) {
    store.__allinAiRateLimits.set(key, { count: 1, date: day });
    return { allowed: true, remaining: limit - 1, limit };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      status: 429,
      error: `Daily AI limit reached (${limit} included in your subscription). Resets at midnight UTC.`,
      remaining: 0,
      limit,
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, limit };
}

export function checkAiAccess(req: {
  headers: Record<string, string | string[] | undefined>;
}): AiGuardResult {
  if (process.env.AI_CHAT_DISABLED === 'true') {
    return {
      allowed: false,
      status: 503,
      error: 'AI coach is temporarily unavailable.',
    };
  }

  const deviceId = getDeviceId(req);
  const key = getClientKey(deviceId, req);

  // Coach override — your personal use, not billed against client tiers
  const coachTokenEnv = process.env.AI_COACH_ACCESS_TOKEN?.trim();
  const clientCoachToken = headerValue(req.headers, 'x-coach-token');
  if (coachTokenEnv && clientCoachToken === coachTokenEnv) {
    const coachLimit = parseInt(process.env.AI_COACH_DAILY_LIMIT || '100', 10);
    const result = checkDailyLimit(`coach:${key}`, coachLimit);
    return { ...result, tier: 'coach' };
  }

  // Active subscription — AI allowance built into tier price
  const subToken = headerValue(req.headers, 'x-subscription-token');
  const subscription = verifySubscriptionToken(subToken, deviceId);
  if (subscription) {
    const limit = subscriptionAiDailyLimit(subscription.tier);
    const result = checkDailyLimit(`sub:${subscription.tier}:${key}`, limit);
    return { ...result, tier: subscription.tier };
  }

  // No subscription — no AI cost to coach
  return {
    allowed: false,
    status: 403,
    error: 'AI coach is included with your All In subscription. View plans to subscribe.',
  };
}
