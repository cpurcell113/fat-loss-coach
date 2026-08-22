import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import {
  SUBSCRIPTION_TIERS,
  aiCogsPercentOfPrice,
  type SubscriptionTier,
  type SubscriptionTierId,
} from '../constants/pricing';
import { activateSubscription, getSubscription, clearSubscription } from '../lib/subscription';
import { getCoachToken } from '../lib/ai-access';
import { Check } from 'lucide-react';

export function PricingPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(getSubscription());
  const [activating, setActivating] = useState<SubscriptionTierId | null>(null);
  const [error, setError] = useState('');
  const isCoach = Boolean(getCoachToken());

  useEffect(() => {
    setActive(getSubscription());
  }, []);

  const handleSelect = async (tier: SubscriptionTier) => {
    if (tier.aiMessagesPerDay === 0 && tier.id === 'program') {
      setError('Program tier has no AI coach. Choose All In or Concierge for AI access.');
      return;
    }
    setError('');
    setActivating(tier.id);
    try {
      // Until Apple IAP: coach activates for beta clients, or coach activates own test sub
      const sub = await activateSubscription(tier.id);
      setActive(sub);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activation failed');
    } finally {
      setActivating(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Plans"
        right={
          <button onClick={() => navigate(-1)} className="text-sm text-gold">Done</button>
        }
      />
      <p className="px-4 text-sm text-muted -mt-2 mb-2">AI coach included in subscription — no surprise API bills</p>

      <div className="px-4 py-4 space-y-4">
        {active && (
          <Card className="border-gold/30">
            <p className="text-xs text-gold uppercase tracking-wider mb-1">Active plan</p>
            <p className="font-display font-bold text-lg capitalize">{active.tier.replace('_', ' ')}</p>
            <p className="text-xs text-muted mt-1">
              Renews {new Date(active.expiresAt).toLocaleDateString()}
            </p>
            {isCoach && (
              <button onClick={() => { clearSubscription(); setActive(null); }} className="text-xs text-muted mt-2 underline">
                Clear (coach testing)
              </button>
            )}
          </Card>
        )}

        {error && (
          <p className="text-sm px-1" style={{ color: '#8b3a3a' }}>{error}</p>
        )}

        {!isCoach && !active && (
          <p className="text-sm text-muted px-1">
            Subscriptions via Apple In-App Purchase at launch. Your coach will activate your plan when you enroll.
          </p>
        )}

        {SUBSCRIPTION_TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            isActive={active?.tier === tier.id}
            activating={activating === tier.id}
            onSelect={() => handleSelect(tier)}
            showCoachActivate={isCoach}
          />
        ))}

        <Card>
          <p className="text-xs text-muted leading-relaxed">
            <strong className="text-text-primary">How pricing works:</strong> Each tier bakes in AI cost at ~$0.03/message.
            All In at ${SUBSCRIPTION_TIERS[1].priceMonthly}/mo includes {SUBSCRIPTION_TIERS[1].aiMessagesPerDay} AI messages/day
            (~${SUBSCRIPTION_TIERS[1].aiCogsMonthly}/mo API cost, {aiCogsPercentOfPrice(SUBSCRIPTION_TIERS[1])}% of subscription).
            Same model as Whoop — you pay one price, AI is included with caps.
          </p>
        </Card>
      </div>
    </div>
  );
}

function TierCard({
  tier,
  isActive,
  activating,
  onSelect,
  showCoachActivate,
}: {
  tier: SubscriptionTier;
  isActive: boolean;
  activating: boolean;
  onSelect: () => void;
  showCoachActivate: boolean;
}) {
  const cogsPct = aiCogsPercentOfPrice(tier);

  return (
    <Card className={tier.highlighted ? 'border-gold/40 bg-gold/5' : ''}>
      {tier.highlighted && (
        <p className="text-[10px] font-bold tracking-widest text-gold mb-2">MOST POPULAR</p>
      )}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-display font-bold text-xl">{tier.name}</h3>
          <p className="font-number text-2xl font-bold mt-1">
            ${tier.priceMonthly}<span className="text-sm text-muted font-sans">/mo</span>
          </p>
        </div>
        {tier.aiMessagesPerDay > 0 ? (
          <div className="text-right">
            <p className="text-xs text-gold font-medium">AI included</p>
            <p className="text-[10px] text-muted">{tier.aiMessagesPerDay}/day · ~{cogsPct}% COGS</p>
          </div>
        ) : (
          <p className="text-xs text-muted">No AI — coach chat only</p>
        )}
      </div>

      <ul className="space-y-2 mb-4">
        {tier.features.map(f => (
          <li key={f} className="flex gap-2 text-sm text-muted">
            <Check size={14} className="text-gold shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {isActive ? (
        <div className="py-2.5 text-center text-sm font-medium text-success">Current plan</div>
      ) : showCoachActivate ? (
        <button
          onClick={onSelect}
          disabled={activating}
          className="w-full py-3 rounded-xl font-display font-bold tracking-wide text-black disabled:opacity-60"
          style={{ background: '#c9963a' }}
        >
          {activating ? 'Activating…' : `Activate ${tier.name} (beta)`}
        </button>
      ) : (
        <div className="py-2.5 text-center text-xs text-muted">
          {tier.aiMessagesPerDay > 0
            ? 'Included when your coach enrolls you'
            : 'Direct coaching — message your coach'}
        </div>
      )}
    </Card>
  );
}
