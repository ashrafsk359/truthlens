export default function PrivacyPage() {
  const sections = [
    {
      title: 'Data we collect',
      content: 'TruthLens may store user account details (if registered), claim history (for signed-in users), and usage data to improve performance. Guest users may use limited features without persistent history. Claims are temporarily processed server-side to generate fact-check results.',
    },
    {
      title: 'AI infrastructure',
      content: 'TruthLens uses its own managed AI infrastructure. No user-supplied AI API keys are required or stored. Analysis runs entirely server-side.',
    },
    {
      title: 'Analytics',
      content: 'We may collect anonymized usage analytics (page views, feature usage) via privacy-respecting tools. No personally identifiable information is associated with analytics data.',
    },
    {
      title: 'Supabase & authentication',
      content: 'If you create an account, your email and hashed password are stored securely via Supabase. We do not share this data. You can request deletion of your account and data at any time.',
    },
    {
      title: 'Third-party services',
      content: 'We use OpenRouter for AI analysis and optionally NewsAPI or GNews for evidence retrieval. Claims submitted to these services are subject to their respective privacy policies.',
    },
    {
      title: 'Contact',
      content: 'For privacy-related requests, contact us at privacy@truthlens.app.',
    },
  ]

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(36px,5vw,60px) 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p className="label-mono" style={{ marginBottom: 10 }}>Legal</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Privacy policy
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          Last updated: June 2025
        </p>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sections.map(({ title, content }, i) => (
          <section key={title} style={{
            padding: '22px 0',
            borderBottom: i < sections.length - 1 ? '1px solid var(--bg-border)' : 'none',
          }}>
            <h2 style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.005em',
            }}>
              {title}
            </h2>
            <p style={{
              fontSize: 13.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
            }}>
              {content}
            </p>
          </section>
        ))}
      </div>

    </div>
  )
}
