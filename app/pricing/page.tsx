import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For individuals checking occasional claims',
    features: [
      'Free to use — no account required',
      '10 verifications per day',
      'All 8 verdict levels',
      'Credibility score',
      'Source evidence cards',
    ],
    cta: 'Get started free',
    href: '/check',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For journalists, researchers, and power users',
    features: [
      'Everything in Free',
      'Unlimited verifications',
      'Saved history (30 days)',
      'Bookmark claims',
      'Priority analysis queue',
      'Export results as PDF',
    ],
    cta: 'Coming soon',
    href: '#',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: 'per month',
    description: 'For newsrooms and fact-checking organizations',
    features: [
      'Everything in Pro',
      'Up to 10 seats',
      'Shared claim library',
      'Admin panel',
      'API access',
      'Custom trusted domains',
      'Priority support',
    ],
    cta: 'Coming soon',
    href: '#',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px,6vw,72px) 24px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p className="label-mono" style={{ marginBottom: 12 }}>Pricing</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 10 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto' }}>
          Start verifying claims for free. Upgrade for history, saved claims, and analytics.
        </p>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 36 }}>
        {plans.map((plan) => {
          const isHigh = plan.highlighted
          return (
            <div key={plan.name} style={{
              borderRadius: 18,
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              background: isHigh
                ? 'linear-gradient(160deg, rgba(108,142,255,0.18) 0%, rgba(34,211,238,0.10) 100%)'
                : 'var(--bg-surface)',
              border: isHigh
                ? '1px solid rgba(108,142,255,0.35)'
                : '1px solid var(--bg-border)',
              boxShadow: isHigh ? '0 0 40px rgba(108,142,255,0.12)' : 'none',
              position: 'relative',
            }}>

              {/* Popular badge */}
              {isHigh && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content',
                  padding: '3px 10px', borderRadius: 99, marginBottom: 14,
                  background: 'rgba(108,142,255,0.2)', border: '1px solid rgba(108,142,255,0.3)',
                  fontSize: 10, fontWeight: 700, color: 'var(--signal-indigo)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  ★ Most popular
                </span>
              )}

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                {plan.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: isHigh ? 'var(--signal-indigo)' : 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/{plan.period}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                {plan.description}
              </p>

              {/* Features */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, flex: 1, marginBottom: 24 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: isHigh ? 'rgba(108,142,255,0.2)' : 'rgba(16,217,141,0.12)',
                      border: `1px solid ${isHigh ? 'rgba(108,142,255,0.3)' : 'rgba(16,217,141,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                        <path d="M1 2.5l1.5 1.5L6 1" stroke={isHigh ? 'var(--signal-indigo)' : 'var(--signal-verified)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={plan.href} style={{
                display: 'block', textAlign: 'center',
                padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                textDecoration: 'none', transition: 'opacity 0.15s',
                ...(isHigh
                  ? { background: 'var(--signal-indigo)', color: 'white', boxShadow: '0 0 18px rgba(108,142,255,0.3)' }
                  : plan.name === 'Free'
                  ? { background: 'rgba(108,142,255,0.1)', color: 'var(--signal-indigo)', border: '1px solid rgba(108,142,255,0.22)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)', cursor: 'not-allowed' }
                ),
              }}>
                {plan.cta}
              </Link>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Paid plans coming soon · All prices in USD · Cancel anytime
      </p>
    </div>
  )
}
