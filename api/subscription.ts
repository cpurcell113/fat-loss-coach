import { signSubscription, type SubscriptionTierId } from './subscription-crypto';

export const maxDuration = 15;

/** Mint a subscription token — coach/dev only until Apple IAP webhook replaces this */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const coachTokenEnv = process.env.AI_COACH_ACCESS_TOKEN?.trim();
  const clientCoachToken = req.headers['x-coach-token'];
  const isCoach =
    coachTokenEnv &&
    (Array.isArray(clientCoachToken) ? clientCoachToken[0] : clientCoachToken) === coachTokenEnv;

  // Allow unauthenticated mint only in dev when no coach token configured
  const devMintAllowed = process.env.ALLOW_DEV_SUBSCRIPTION_MINT === 'true' && !coachTokenEnv;
  if (!isCoach && !devMintAllowed) {
    return res.status(403).json({ error: 'Coach authorization required' });
  }

  const { tier, deviceId, months = 1 } = req.body ?? {};
  if (!tier || !deviceId) {
    return res.status(400).json({ error: 'tier and deviceId required' });
  }

  const validTiers: SubscriptionTierId[] = ['program', 'all_in', 'concierge'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const expiresAt = Date.now() + months * 30 * 24 * 60 * 60 * 1000;
  const token = signSubscription({ tier, deviceId, expiresAt });
  if (!token) {
    return res.status(500).json({ error: 'SUBSCRIPTION_SIGNING_SECRET not configured' });
  }

  return res.json({ token, tier, expiresAt });
}
