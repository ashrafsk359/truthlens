import HomeCTA from '@/components/ui/HomeCTA'

const VERDICTS = [
  { label: 'Verified',         cls: 'badge-verified' },
  { label: 'Likely True',      cls: 'badge-likely' },
  { label: 'Mixed Context',    cls: 'badge-mixed' },
  { label: 'Misleading',       cls: 'badge-mislead' },
  { label: 'Developing Story', cls: 'badge-developing' },
  { label: 'Likely False',     cls: 'badge-false' },
  { label: 'Disputed',         cls: 'badge-disputed' },
]

const HOW = [
  { n: '01', title: 'Submit',      desc: 'Paste a claim, URL, headline, or upload a screenshot' },
  { n: '02', title: 'Retrieve',    desc: 'Engine searches recent sources from trusted outlets' },
  { n: '03', title: 'Cross-check', desc: 'AI reasons over evidence — no guesswork, no assumptions' },
  { n: '04', title: 'Verdict',     desc: 'Scored report with sourced reasoning and discovery links' },
]

const WHY = [
  { signal: 'verified',  title: 'Evidence-first',      desc: 'Every verdict traces back to real sources. Never fabricated.' },
  { signal: 'live',      title: 'Time-aware',           desc: 'Breaking claims treated differently. Freshness signals surfaced.' },
  { signal: 'gold',      title: 'Transparent scoring',  desc: '0–100 credibility score with full weighted reasoning shown.' },
  { signal: 'indigo',    title: 'Neutral by design',    desc: 'No political lean. No editorial opinion. Evidence only.' },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(70px, 11vw, 130px) 24px clamp(55px, 7vw, 90px)',
        textAlign: 'center',
      }}>
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(108,142,255,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108,142,255,0.045) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 560, height: 280, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(108,142,255,0.09) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          {/* Live pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', marginBottom: 26,
            border: '1px solid rgba(34,211,238,0.22)',
            background: 'rgba(34,211,238,0.06)',
            borderRadius: 99,
          }}>
            <span className="live-dot" />
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--signal-live)', textTransform: 'uppercase' }}>
              Live verification engine active
            </span>
          </div>

          <h1 className="headline-xl" style={{ marginBottom: 18 }}>
            Verify claims<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--signal-indigo) 0%, var(--signal-live) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>before they spread.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: 'var(--text-secondary)', lineHeight: 1.75,
            maxWidth: 520, margin: '0 auto 36px',
          }}>
            TruthLens analyzes news, screenshots, and viral claims using
            evidence-backed AI reasoning — sourced, scored, and transparent.
          </p>

          {/* Auth-aware CTAs — client component */}
          <div style={{ marginBottom: 48 }}>
            <HomeCTA />
          </div>

          {/* Verdict badges */}
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', flexWrap: 'wrap' }}>
            {VERDICTS.map(({ label, cls }) => (
              <span key={label} className={`badge ${cls}`}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ marginBottom: 32 }}>
          <p className="label-mono" style={{ marginBottom: 10 }}>How it works</p>
          <h2 className="headline-lg">From claim to verdict in seconds.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 2 }}>
          {HOW.map(({ n, title, desc }, i) => (
            <div key={n} style={{
              padding: '26px 22px',
              background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
              borderRadius: i === 0 ? '16px 4px 4px 16px' : i === HOW.length - 1 ? '4px 16px 16px 4px' : 4,
              border: '1px solid var(--bg-border)',
              position: 'relative',
            }}>
              <span style={{ position: 'absolute', top: 12, right: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{n}</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, marginBottom: 14, background: 'rgba(108,142,255,0.1)', border: '1px solid rgba(108,142,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--signal-indigo)', fontSize: 15 }}>{['⤵','⊛','⊟','◈'][i]}</span>
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5, fontFamily: 'var(--font-display)' }}>{title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY TRUTHLENS ────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ marginBottom: 32 }}>
          <p className="label-mono" style={{ marginBottom: 10 }}>Why TruthLens</p>
          <h2 className="headline-lg">Built for serious verification.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {WHY.map(({ signal, title, desc }) => (
            <div key={title} className="surface card-lift" style={{ padding: '22px', cursor: 'default' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', marginBottom: 14, background: `var(--signal-${signal})`, boxShadow: `0 0 8px var(--signal-${signal})` }} />
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 7, fontFamily: 'var(--font-display)' }}>{title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, border: '1px solid var(--bg-border)', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { val: '8',     label: 'Verdict levels',    sub: 'From Verified to Disputed' },
            { val: '0–100', label: 'Credibility score', sub: 'Weighted multi-factor' },
            { val: '50+',   label: 'Trusted domains',   sub: 'Signal-ranked sources' },
          ].map(({ val, label, sub }, i) => (
            <div key={label} style={{
              padding: '28px 24px', textAlign: 'center',
              background: i === 1 ? 'var(--bg-elevated)' : 'var(--bg-surface)',
              borderRight: i < 2 ? '1px solid var(--bg-border)' : 'none',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 700, color: 'var(--signal-indigo)', letterSpacing: '-0.02em', marginBottom: 5 }}>{val}</p>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 90px' }}>
        <div style={{
          padding: 'clamp(36px, 5vw, 56px)',
          background: 'linear-gradient(135deg, rgba(108,142,255,0.07) 0%, rgba(34,211,238,0.05) 100%)',
          border: '1px solid rgba(108,142,255,0.2)',
          borderRadius: 22, textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(108,142,255,0.08), transparent)', pointerEvents: 'none' }} />
          <p className="label-mono" style={{ marginBottom: 14 }}>Start verifying</p>
          <h2 className="headline-lg" style={{ marginBottom: 10 }}>Intelligence at your fingertips.</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
            Free to use. Create an account for full history and personalized insights.
          </p>
          <HomeCTA />
        </div>
      </section>

    </div>
  )
}
