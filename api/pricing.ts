export default async function handler(_req: any, res: any) {
  const tiers = [
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
      highlighted: false,
    },
    {
      id: 'all_in',
      name: 'All In',
      priceMonthly: 297,
      aiMessagesPerDay: 20,
      aiCogsMonthly: 18,
      iapProductId: 'com.allin.coaching.allin.monthly',
      features: [
        'Everything in Program',
        'AI coach — 20 questions/day included',
        'Screenshot nutrition parsing',
        'Weekly progress review cards',
      ],
      highlighted: true,
    },
    {
      id: 'concierge',
      name: 'Concierge',
      priceMonthly: 497,
      aiMessagesPerDay: 50,
      aiCogsMonthly: 45,
      iapProductId: 'com.allin.coaching.concierge.monthly',
      features: [
        'Everything in All In',
        'AI coach — 50 questions/day included',
        'Priority coach responses',
        'Quarterly deep-dive review',
      ],
      highlighted: false,
    },
  ];

  return res.json({
    tiers,
    model: 'AI usage is included in subscription price with daily caps — same as Whoop Coach.',
  });
}
