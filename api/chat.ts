import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

export const maxDuration = 30;

type RateEntry = { count: number; date: string };

const store = globalThis as typeof globalThis & {
  __allinAiRateLimits?: Map<string, RateEntry>;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function header(req: any, name: string): string | undefined {
  const val = req.headers?.[name];
  return Array.isArray(val) ? val[0] : val;
}

function checkDailyLimit(key: string, limit: number) {
  if (!store.__allinAiRateLimits) store.__allinAiRateLimits = new Map();
  const day = todayUtc();
  const entry = store.__allinAiRateLimits.get(key);
  if (!entry || entry.date !== day) {
    store.__allinAiRateLimits.set(key, { count: 1, date: day });
    return { allowed: true as const, remaining: limit - 1, limit };
  }
  if (entry.count >= limit) {
    return {
      allowed: false as const,
      status: 429,
      error: `Daily AI limit reached (${limit}/day). Resets at midnight UTC.`,
      remaining: 0,
      limit,
    };
  }
  entry.count += 1;
  return { allowed: true as const, remaining: limit - entry.count, limit };
}

function verifySubscriptionToken(token: string | undefined, deviceId: string) {
  if (!token) return null;
  const secret = process.env.SUBSCRIPTION_SIGNING_SECRET?.trim();
  if (!secret) return null;
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      tier: string;
      deviceId: string;
      expiresAt: number;
      sig: string;
    };
    const body = JSON.stringify({
      tier: parsed.tier,
      deviceId: parsed.deviceId,
      expiresAt: parsed.expiresAt,
    });
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (parsed.sig !== expected) return null;
    if (parsed.deviceId !== deviceId) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function checkAiAccess(req: any) {
  if (process.env.AI_CHAT_DISABLED === 'true') {
    return { allowed: false as const, status: 503, error: 'AI coach is temporarily unavailable.' };
  }

  const deviceId = header(req, 'x-allin-device-id') || 'unknown';
  const ip = header(req, 'x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = deviceId !== 'unknown' ? `device:${deviceId}` : `ip:${ip}`;

  const coachTokenEnv = process.env.AI_COACH_ACCESS_TOKEN?.trim();
  const clientCoachToken = header(req, 'x-coach-token');

  if (coachTokenEnv && clientCoachToken === coachTokenEnv) {
    const coachLimit = parseInt(process.env.AI_COACH_DAILY_LIMIT || '100', 10);
    return { ...checkDailyLimit(`coach:${key}`, coachLimit), tier: 'coach' };
  }

  const sub = verifySubscriptionToken(header(req, 'x-subscription-token'), deviceId);
  if (sub) {
    const limits: Record<string, number> = { program: 0, all_in: 20, concierge: 50 };
    const limit = limits[sub.tier] ?? 0;
    return { ...checkDailyLimit(`sub:${sub.tier}:${key}`, limit), tier: sub.tier };
  }

  if (coachTokenEnv) {
    return {
      allowed: false as const,
      status: 403,
      error: 'AI coach is included with your All In subscription. View plans to subscribe.',
    };
  }

  // Solo mode — only ANTHROPIC_API_KEY required
  const soloLimit = parseInt(process.env.AI_DAILY_MESSAGE_LIMIT || '30', 10);
  return { ...checkDailyLimit(`solo:${key}`, soloLimit), tier: 'solo' };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const guard = checkAiAccess(req);
    if (!guard.allowed) {
      return res.status(guard.status).json({ error: guard.error });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server API key not configured. Set ANTHROPIC_API_KEY in Vercel.' });
    }

    if (guard.remaining != null) res.setHeader('X-AI-Remaining', String(guard.remaining));
    if (guard.limit != null) res.setHeader('X-AI-Limit', String(guard.limit));

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create(req.body);
    return res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('chat api error:', message);
    return res.status(500).json({ error: message });
  }
}
