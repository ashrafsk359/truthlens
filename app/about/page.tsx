import { Shield, Scale, Eye, Database, Brain, AlertCircle } from 'lucide-react'

const verdictGuide = [
  { label: 'Verified',              range: '80–100', signal: 'verified',  desc: 'Strong evidence from trusted sources confirms the claim.' },
  { label: 'Likely True',           range: '65–79',  signal: 'likely',    desc: 'Evidence leans toward truth but is not fully conclusive.' },
  { label: 'Mixed / Context Needed',range: '40–64',  signal: 'mixed',     desc: 'Some aspects are true, others false, or important context is missing.' },
  { label: 'Misleading',            range: '30–49',  signal: 'mislead',   desc: 'Technically true but framed in a way that misleads.' },
  { label: 'Unverified',            range: '—',      signal: 'unverified',desc: 'Insufficient evidence available to make a determination.' },
  { label: 'Likely False',          range: '15–29',  signal: 'false',     desc: 'Evidence leans against the claim being true.' },
  { label: 'Disputed',              range: '0–29',   signal: 'disputed',  desc: 'Credible sources directly contradict each other.' },
]

const scoringFactors = [
  { label: 'Trusted source confirmations', weight: '30%' },
  { label: 'Evidence quality and quantity', weight: '25%' },
  { label: 'Contradicting sources',         weight: '20%' },
  { label: 'Domain reputation signals',     weight: '15%' },
  { label: 'Language sensationalism',       weight: '10%' },
]

const principles = [
  { icon: Scale,       title: 'Strict neutrality',      desc: 'No political, cultural, or ideological lean. Evidence only.' },
  { icon: Eye,         title: 'Full transparency',       desc: 'Every verdict shows its reasoning, sources, and confidence level.' },
  { icon: Database,    title: 'Source-first analysis',   desc: 'Claims are matched against real-world news and official sources.' },
  { icon: Brain,       title: 'AI + human logic',        desc: 'Smart reasoning engine analyzes evidence using journalism-inspired prompts.' },
  { icon: AlertCircle, title: 'Uncertainty is honest',   desc: 'When evidence is insufficient, we say Unverified — not guess.' },
  { icon: Shield,      title: 'No assumptions',          desc: 'The AI is instructed never to assume beyond what evidence shows.' },
]

// Signal dot colours reusing CSS variables already defined in globals.css
const SIGNAL_STYLE: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  verified:   { dot: 'var(--signal-verified)', bg: 'rgba(16,217,141,0.08)',  border: 'rgba(16,217,141,0.22)', text: '#10D98D' },
  likely:     { dot: '#50C89B',               bg: 'rgba(16,217,141,0.06)',  border: 'rgba(16,217,141,0.14)', text: '#50C89B' },
  mixed:      { dot: 'var(--signal-mixed)',    bg: 'rgba(244,161,24,0.08)',  border: 'rgba(244,161,24,0.22)', text: 'var(--signal-mixed)' },
  mislead:    { dot: '#E06060',               bg: 'rgba(240,71,71,0.07)',   border: 'rgba(240,71,71,0.18)',  text: '#E06060' },
  unverified: { dot: 'var(--text-muted)',      bg: 'rgba(139,144,167,0.08)', border: 'rgba(139,144,167,0.2)', text: 'var(--text-muted)' },
  false:      { dot: 'var(--signal-false)',    bg: 'rgba(240,71,71,0.10)',   border: 'rgba(240,71,71,0.22)', text: 'var(--signal-false)' },
  disputed:   { dot: '#D06060',               bg: 'rgba(240,71,71,0.07)',   border: 'rgba(240,71,71,0.16)',  text: '#D06060' },
}

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(32px,5vw,56px) 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p className="label-mono" style={{ marginBottom: 10 }}>Methodology</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 12 }}>
          How TruthLens works
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          TruthLens uses a multi-step, evidence-first approach. We never make assumptions — every verdict is grounded in retrievable evidence, and uncertainty is always disclosed.
        </p>
      </div>

      {/* Core principles */}
      <section style={{ marginBottom: 44 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.01em' }}>
          Core principles
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {principles.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="surface" style={{ padding: '16px 18px', display: 'flex', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(108,142,255,0.12)', border: '1px solid rgba(108,142,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 15, height: 15, color: 'var(--signal-indigo)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontFamily: 'var(--font-display)' }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verdict levels */}
      <section style={{ marginBottom: 44 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.01em' }}>
          Verdict levels explained
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {verdictGuide.map(({ label, range, signal, desc }) => {
            const s = SIGNAL_STYLE[signal] || SIGNAL_STYLE.unverified
            return (
              <div key={label} className="surface" style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.text, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</span>
                </span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{desc}</p>
                {range !== '—' && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {range}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Scoring weights */}
      <section style={{ marginBottom: 44 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.01em' }}>
          Credibility score weights
        </h2>
        <div className="surface" style={{ overflow: 'hidden' }}>
          {scoringFactors.map(({ label, weight }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: i < scoringFactors.length - 1 ? '1px solid var(--bg-border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--signal-indigo)', fontFamily: 'var(--font-display)' }}>{weight}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div style={{ padding: '16px 20px', background: 'rgba(244,161,24,0.07)', border: '1px solid rgba(244,161,24,0.2)', borderRadius: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--signal-mixed)', marginBottom: 5 }}>Important disclaimer</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          TruthLens is an AI-powered tool designed to assist research. Results are not infallible. For high-stakes decisions, always consult primary sources, official publications, and qualified experts.
        </p>
      </div>

    </div>
  )
}
