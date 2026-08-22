/**
 * All In coaching tiers — AI COGS built into subscription price (Whoop model).
 * Assumes ~$0.03 avg per AI message (Sonnet, typical coach exchange).
 */

export type SubscriptionTierId = 'program' | 'all_in' | 'concierge';

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  priceMonthly: number;
  /** Daily AI coach messages included in subscription */
  aiMessagesPerDay: number;
  /** Estimated monthly API cost for AI at typical usage */
  aiCogsMonthly: number;
  /** Apple IAP product id (configure in App Store Connect) */
  iapProductId: string;
  features: string[];
  highlighted?: boolean;
}

const COST_PER_MESSAGE = 0.03;
const DAYS_PER_MONTH = 30;

function aiCogs(dailyLimit: number): number {
  return Math.round(dailyLimit * DAYS_PER_MONTH * COST_PER_MESSAGE * 100) / 100;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'program',
    name: 'Program',
    priceMonthly: 197,
    aiMessagesPerDay: 0,
    aiCogsMonthly: 0,
    iapProductId: 'com.allin.coaching.program.monthly',
    features: [
      'Custom programming & auto-progression',
      'Workout logging & exercise library',
      'Habit tracking & readiness scores',
      'Direct coach messaging',
    ],
  },
  {
    id: 'all_in',
    name: 'All In',
    priceMonthly: 297,
    aiMessagesPerDay: 20,
    aiCogsMonthly: aiCogs(20),
    iapProductId: 'com.allin.coaching.allin.monthly',
    highlighted: true,
    features: [
      'Everything in Program',
      'AI coach — 20 questions/day included',
      'Screenshot nutrition parsing',
      'Weekly progress review cards',
    ],
  },
  {
    id: 'concierge',
    name: 'Concierge',
    priceMonthly: 497,
    aiMessagesPerDay: 50,
    aiCogsMonthly: aiCogs(50),
    iapProductId: 'com.allin.coaching.concierge.monthly',
    features: [
      'Everything in All In',
      'AI coach — 50 questions/day included',
      'Priority coach responses',
      'Quarterly deep-dive review',
    ],
  },
];

export const COACH_AI_DAILY_LIMIT = 100;

export function getTier(id: SubscriptionTierId | string | null | undefined): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(t => t.id === id);
}

export function tierAiDailyLimit(id: SubscriptionTierId | string | null | undefined): number {
  return getTier(id)?.aiMessagesPerDay ?? 0;
}

export function aiCogsPercentOfPrice(tier: SubscriptionTier): number {
  if (tier.priceMonthly === 0) return 0;
  return Math.round((tier.aiCogsMonthly / tier.priceMonthly) * 1000) / 10;
}
