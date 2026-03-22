'use client';

import { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Opus 320kbps streaming',
      'All canvas modes',
      'Curated sponsor intervals (SDD-normalized)',
      'Standard recommendations',
    ],
    cta: 'Current Plan',
    active: true,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    features: [
      '24-bit FLAC lossless streaming',
      'Zero ads — ever',
      'Offline downloads',
      'Early access to new features',
      'Priority recommendations',
    ],
    cta: 'Upgrade to Premium',
    active: false,
    priceId: 'price_XXX', // Replace with actual Stripe Price ID
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">
        Choose Your<span className="text-accent">.</span>Sound
      </h1>
      <p className="text-text-secondary text-center max-w-lg mb-12">
        Every plan respects dynamic range. Premium unlocks lossless audio
        and removes all interruptions.
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-8 transition-all ${
              plan.name === 'Premium'
                ? 'border-accent bg-accent/5 scale-[1.02]'
                : 'border-border bg-surface'
            }`}
          >
            <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
            <div className="mb-6">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-text-secondary text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5">✓</span>
                  <span className="text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>
            {plan.priceId ? (
              <button
                onClick={() => handleUpgrade(plan.priceId!)}
                disabled={loading}
                className="w-full bg-accent text-background font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : plan.cta}
              </button>
            ) : (
              <div className="w-full text-center py-2.5 text-text-tertiary text-sm">
                {plan.cta}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
