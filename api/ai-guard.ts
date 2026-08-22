/**
 * Server-side AI access control — prevents unbounded client usage on coach's API key.
 *
 * Modes (via env):
 *   AI_CHAT_DISABLED=true          — kill switch, no AI calls
 *   AI_COACH_ACCESS_TOKEN=<secret> — only requests with matching x-coach-token header
 *   AI_DAILY_MESSAGE_LIMIT=15      — per-device daily cap (default 15)
 *   AI_COACH_DAILY_LIMIT=100       — higher cap when coach token matches (default 100)
 */

export interface AiGuardResult {
  allowed: boolean;
  status: number;
  error?: string;
  remaining?: number;
  limit?: number;
}

type RateEntry = { count: number; date: string };

const store = globalThis as typeof globalThis & {
  __allinAiRateLimits?: Map<string, RateEntry>;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function getClientKey(req: { headers: Record<string, string | string[] | undefined> }): string {
  const deviceId = req.headers['x-allin-device-id'];
  const id = Array.isArray(deviceId) ? deviceId[0] : deviceId;
  if (id) return `device:${id}`;

  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
  return `ip:${ip || 'unknown'}`;
}

function checkDailyLimit(key: string, limit: number): AiGuardResult {
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
      error: `Daily AI limit reached (${limit} messages/day). Resets at midnight UTC.`,
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
      error: 'AI coach is currently unavailable.',
    };
  }

  const coachTokenEnv = process.env.AI_COACH_ACCESS_TOKEN?.trim();
  const clientToken = req.headers['x-coach-token'];
  const clientTokenStr = Array.isArray(clientToken) ? clientToken[0] : clientToken;
  const key = getClientKey(req);

  // Coach-only: clients without the secret never hit Anthropic (no cost to you)
  if (coachTokenEnv) {
    if (clientTokenStr !== coachTokenEnv) {
      return {
        allowed: false,
        status: 403,
        error: 'AI coach is included with coaching — message your coach directly for now.',
      };
    }
    const coachLimit = parseInt(process.env.AI_COACH_DAILY_LIMIT || '100', 10);
    return checkDailyLimit(`coach:${key}`, coachLimit);
  }

  // No coach token configured — apply conservative default cap for any caller
  const limit = parseInt(process.env.AI_DAILY_MESSAGE_LIMIT || '15', 10);
  return checkDailyLimit(key, limit);
}
