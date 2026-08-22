import type { SubscriptionTierId } from '../constants/pricing';
import { getCoachToken, getDeviceId } from './ai-access';

const TOKEN_KEY = 'fla_subscription_token';
const TIER_KEY = 'fla_subscription_tier';
const EXPIRES_KEY = 'fla_subscription_expires';

export interface ClientSubscription {
  token: string;
  tier: SubscriptionTierId;
  expiresAt: number;
}

export function getSubscription(): ClientSubscription | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const tier = localStorage.getItem(TIER_KEY) as SubscriptionTierId | null;
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (!token || !tier || !expires) return null;
  if (Date.now() > Number(expires)) {
    clearSubscription();
    return null;
  }
  return { token, tier, expiresAt: Number(expires) };
}

export function saveSubscription(sub: ClientSubscription): void {
  localStorage.setItem(TOKEN_KEY, sub.token);
  localStorage.setItem(TIER_KEY, sub.tier);
  localStorage.setItem(EXPIRES_KEY, String(sub.expiresAt));
}

export function clearSubscription(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TIER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export async function activateSubscription(tier: SubscriptionTierId, months = 1): Promise<ClientSubscription> {
  const res = await fetch('/api/subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-coach-token': getCoachToken(),
      'x-allin-device-id': getDeviceId(),
    },
    body: JSON.stringify({ tier, deviceId: getDeviceId(), months }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not activate subscription');
  }
  const data = await res.json();
  const sub: ClientSubscription = { token: data.token, tier: data.tier, expiresAt: data.expiresAt };
  saveSubscription(sub);
  return sub;
}

export function subscriptionHeaders(): Record<string, string> {
  const sub = getSubscription();
  if (!sub) return {};
  return { 'x-subscription-token': sub.token };
}
