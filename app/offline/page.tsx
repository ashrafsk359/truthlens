export default function OfflinePage() {
  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(108,142,255,0.1)', border: '1px solid rgba(108,142,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2 6l9 9 9-9" stroke="var(--signal-indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>You're offline</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>TruthLens needs a connection to verify claims. Please check your network and try again.</p>
    </div>
  )
}
