import Link from 'next/link'

// ─── Static data ─────────────────────────────────────────────────────────────

const LOGS = [
  {
    level: 'CRITICAL' as const,
    time: '14:23:07',
    campaign: 'Operation Pulse',
    accounts: '847',
    message: 'Coordinated burst detected',
  },
  {
    level: 'WARNING' as const,
    time: '14:11:42',
    campaign: 'MedFear',
    accounts: '312',
    message: 'Network expansion +23%',
  },
  {
    level: 'INFO' as const,
    time: '13:58:19',
    campaign: 'ReviewStorm',
    accounts: '156',
    message: 'Monitoring active',
  },
]

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: '#EF4444',
  WARNING:  '#F59E0B',
  INFO:     '#3B82F6',
}

const STATS = [
  { label: 'THREATS DETECTED',        value: '18,429' },
  { label: 'CAMPAIGNS MONITORED',     value: '47'     },
  { label: 'BOT ACCOUNTS IDENTIFIED', value: '94,201' },
  { label: 'CONFIDENCE RATE',         value: '91.3%'  },
]

// ─── SVG network graph ────────────────────────────────────────────────────────
// Static force-layout-inspired bot network: origin → clusters → amplifiers.
// Three cluster hubs (CLU-1/2/3) fan out from the C2 command node.
// Highlighted nodes indicate live detections (critical / warning).

function NetworkGraph() {
  // fmt: node coordinates, grouped by cluster
  const C2  = { cx: 65,  cy: 125 }
  const CLU = [
    { cx: 178, cy: 52  },
    { cx: 185, cy: 125 },
    { cx: 178, cy: 198 },
  ]

  const AMP1 = [ // standard amplifiers for CLU-1
    [270, 18], [300, 12], [328, 26], [345, 50], [340, 75], [312, 86], [282, 78],
  ]
  const AMP2 = [ // standard amplifiers for CLU-2
    [288, 106], [318, 112], [340, 128], [332, 150], [305, 158],
  ]
  const AMP3 = [ // standard amplifiers for CLU-3
    [270, 178], [298, 170], [328, 178], [348, 200], [344, 224], [314, 236], [285, 232],
  ]

  const CRIT = { cx: 322, cy: 48 }   // critical node in CLU-1 fan
  const WARN = { cx: 310, cy: 98 }   // warning node in CLU-2 fan

  return (
    <svg
      viewBox="0 0 540 250"
      className="w-full"
      style={{ maxHeight: '220px' }}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bot network topology graph"
    >
      {/* Faint coordinate grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E2D4A" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="540" height="250" fill="url(#grid)" opacity="0.5" />

      {/* ── Edges: origin → clusters ─────────────────────────────────── */}
      {CLU.map((c, i) => (
        <line key={i} x1={C2.cx} y1={C2.cy} x2={c.cx} y2={c.cy}
          stroke="#2A3F5F" strokeWidth="1.5" />
      ))}

      {/* ── Edges: CLU-1 → standard amps ───────────────────────────── */}
      {AMP1.map(([x, y], i) => (
        <line key={i} x1={CLU[0].cx} y1={CLU[0].cy} x2={x} y2={y}
          stroke="#1A2840" strokeWidth="0.75" />
      ))}
      <line x1={CLU[0].cx} y1={CLU[0].cy} x2={CRIT.cx} y2={CRIT.cy}
        stroke="#EF4444" strokeWidth="1" opacity="0.45" />

      {/* ── Edges: CLU-2 → standard amps ───────────────────────────── */}
      {AMP2.map(([x, y], i) => (
        <line key={i} x1={CLU[1].cx} y1={CLU[1].cy} x2={x} y2={y}
          stroke="#1A2840" strokeWidth="0.75" />
      ))}
      <line x1={CLU[1].cx} y1={CLU[1].cy} x2={WARN.cx} y2={WARN.cy}
        stroke="#F59E0B" strokeWidth="1" opacity="0.45" />

      {/* ── Edges: CLU-3 → standard amps ───────────────────────────── */}
      {AMP3.map(([x, y], i) => (
        <line key={i} x1={CLU[2].cx} y1={CLU[2].cy} x2={x} y2={y}
          stroke="#1A2840" strokeWidth="0.75" />
      ))}

      {/* ── Signal overlays: animated dashes flowing origin → outward ── */}
      {CLU.map((c, i) => (
        <line key={i} x1={C2.cx} y1={C2.cy} x2={c.cx} y2={c.cy}
          stroke="#00D4AA" strokeWidth="0.7"
          className="lp-signal-edge"
          style={{ animationDelay: `${i * 0.8}s` }} />
      ))}
      <line x1={CLU[0].cx} y1={CLU[0].cy} x2={CRIT.cx} y2={CRIT.cy}
        stroke="#EF4444" strokeWidth="0.6"
        className="lp-signal-edge"
        style={{ animationDelay: '1.2s' }} />
      <line x1={CLU[1].cx} y1={CLU[1].cy} x2={WARN.cx} y2={WARN.cy}
        stroke="#F59E0B" strokeWidth="0.6"
        className="lp-signal-edge"
        style={{ animationDelay: '0.6s' }} />

      {/* ── Amplifier nodes: CLU-1 ─────────────────────────────────── */}
      {AMP1.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5"
          fill="#1A2840" stroke="#2A3F5F" strokeWidth="0.75"
          className="lp-node-pulse"
          style={{ animationDelay: `${i * 0.28}s` }} />
      ))}

      {/* Critical node (CLU-1) — pulses as a group */}
      <g className="lp-node-pulse" style={{ animationDelay: '0.45s' }}>
        <circle cx={CRIT.cx} cy={CRIT.cy} r="6"
          fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.35" />
        <circle cx={CRIT.cx} cy={CRIT.cy} r="4.5"
          fill="#1A2840" stroke="#EF4444" strokeWidth="1.5" />
        <circle cx={CRIT.cx} cy={CRIT.cy} r="2"
          fill="#EF4444" />
      </g>

      {/* ── Amplifier nodes: CLU-2 ─────────────────────────────────── */}
      {AMP2.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5"
          fill="#1A2840" stroke="#2A3F5F" strokeWidth="0.75"
          className="lp-node-pulse"
          style={{ animationDelay: `${0.15 + i * 0.35}s` }} />
      ))}

      {/* Warning node (CLU-2) — pulses as a group */}
      <g className="lp-node-pulse" style={{ animationDelay: '1.3s' }}>
        <circle cx={WARN.cx} cy={WARN.cy} r="5.5"
          fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.35" />
        <circle cx={WARN.cx} cy={WARN.cy} r="4"
          fill="#1A2840" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx={WARN.cx} cy={WARN.cy} r="1.8"
          fill="#F59E0B" />
      </g>

      {/* ── Amplifier nodes: CLU-3 ─────────────────────────────────── */}
      {AMP3.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5"
          fill="#1A2840" stroke="#2A3F5F" strokeWidth="0.75"
          className="lp-node-pulse"
          style={{ animationDelay: `${0.2 + i * 0.3}s` }} />
      ))}

      {/* ── Cluster nodes ──────────────────────────────────────────── */}
      {CLU.map((c, i) => (
        <g key={i} className="lp-node-pulse" style={{ animationDelay: `${i * 0.9}s` }}>
          <circle cx={c.cx} cy={c.cy} r="6"
            fill="#111D35" stroke="#7C3AED" strokeWidth="1.5" />
          <text x={c.cx + 9} y={c.cy + 3}
            fill="#7C3AED" fontSize="7" fontFamily="monospace">
            {`CLU-${i + 1}`}
          </text>
        </g>
      ))}

      {/* ── Origin / C2 node — persistent slow glow ────────────────── */}
      <circle cx={C2.cx} cy={C2.cy} r="15"
        fill="none" stroke="#00D4AA" strokeWidth="0.75"
        className="lp-c2-glow" />
      <circle cx={C2.cx} cy={C2.cy} r="9"
        fill="#00D4AA" />
      <text x={C2.cx - 20} y={C2.cy + 22}
        fill="#00D4AA" fontSize="7" fontFamily="monospace">
        C2-NODE
      </text>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <g transform="translate(0, 238)" fontFamily="monospace" fontSize="7.5">
        <circle cx="8"   cy="5" r="4"   fill="#00D4AA" />
        <text   x="16"  y="9"  fill="#4A5568">C2 NODE</text>

        <circle cx="80"  cy="5" r="3.5" fill="#111D35" stroke="#7C3AED" strokeWidth="1" />
        <text   x="88"  y="9"  fill="#4A5568">CLUSTER</text>

        <circle cx="152" cy="5" r="3.5" fill="#1A2840" stroke="#2A3F5F" strokeWidth="0.75" />
        <text   x="160" y="9"  fill="#4A5568">AMPLIFIER</text>

        <circle cx="238" cy="5" r="3.5" fill="#1A2840" stroke="#EF4444" strokeWidth="1.25" />
        <text   x="246" y="9"  fill="#4A5568">CRITICAL</text>

        <circle cx="310" cy="5" r="3.5" fill="#1A2840" stroke="#F59E0B" strokeWidth="1.25" />
        <text   x="318" y="9"  fill="#4A5568">WARNING</text>
      </g>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#080E1A', color: '#E2E8F0' }}
    >
      {/* ── System status bar ──────────────────────────────────────────── */}
      <header
        className="flex items-center gap-0 px-6 py-2.5 font-mono text-xs shrink-0"
        style={{ backgroundColor: '#0D1526', borderBottom: '1px solid #1E2D4A' }}
      >
        <span className="font-semibold tracking-wider" style={{ color: '#00D4AA' }}>
          SHADOWTRACE v1.0.0
        </span>
        <Pipe />
        <span style={{ color: '#E2E8F0' }}>
          SYSTEM STATUS:{' '}
          <span style={{ color: '#00D4AA' }}>OPERATIONAL</span>
        </span>
        <Pipe />
        <span style={{ color: '#E2E8F0' }}>3 ACTIVE CAMPAIGNS</span>
        <Pipe />
        <span style={{ color: '#E2E8F0' }}>1,247 THREATS DETECTED</span>
      </header>

      {/* ── Two-column section ─────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* Left column — product preview (desktop only, 55%) */}
        <div
          className="hidden lg:flex flex-col shrink-0"
          style={{
            width: '55%',
            backgroundColor: '#0D1526',
            borderRight: '1px solid #1E2D4A',
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-5 py-2.5 font-mono text-xs shrink-0"
            style={{ borderBottom: '1px solid #1E2D4A', color: '#4A5568' }}
          >
            <span className="tracking-widest">
              NETWORK TOPOLOGY
              <span style={{ color: '#1E2D4A' }}> · </span>
              <span style={{ color: '#8B9AB5' }}>OPERATION PULSE</span>
              <span style={{ color: '#1E2D4A' }}> [CAMPAIGN-001]</span>
            </span>
            <span>85 NODES · 84 EDGES</span>
          </div>

          {/* Network graph */}
          <div className="flex-1 flex items-center justify-center px-6 py-4 min-h-0">
            <NetworkGraph />
          </div>

          {/* Log feed */}
          <div className="shrink-0" style={{ borderTop: '1px solid #1E2D4A' }}>
            <div
              className="flex items-center justify-between px-5 py-2 font-mono text-xs"
              style={{ borderBottom: '1px solid #1E2D4A', color: '#4A5568' }}
            >
              <span className="tracking-widest">THREAT LOG</span>
              <span>LAST UPDATE 14:23:07 UTC</span>
            </div>
            <div className="px-5 py-3.5 space-y-3">
              {LOGS.map((log, i) => (
                <div
                  key={log.time}
                  className="font-mono text-xs flex items-baseline lp-log-line"
                  style={{ animationDelay: `${0.8 + i * 0.5}s` }}
                >
                  <span
                    className="shrink-0 font-semibold"
                    style={{ color: LEVEL_COLOR[log.level], width: '76px' }}
                  >
                    [{log.level}]
                  </span>
                  <span
                    className="shrink-0 tabular-nums"
                    style={{ color: '#4A5568', width: '68px', paddingLeft: '8px' }}
                  >
                    {log.time}
                  </span>
                  <span
                    className="shrink-0"
                    style={{ color: '#E2E8F0', width: '144px', paddingLeft: '12px' }}
                  >
                    {log.campaign}
                  </span>
                  <span
                    className="shrink-0"
                    style={{ color: '#4A5568', width: '96px', paddingLeft: '8px' }}
                  >
                    {log.accounts} accounts
                  </span>
                  <span
                    className="truncate"
                    style={{ color: '#8B9AB5', paddingLeft: '8px' }}
                  >
                    {log.message}
                  </span>
                  {i === LOGS.length - 1 && (
                    <span className="lp-cursor shrink-0" style={{ color: '#00D4AA', paddingLeft: '5px' }}>▋</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — copy + CTA */}
        <div
          className="flex flex-col justify-center px-10 lg:px-20 py-12 w-full"
          style={{
            flex: 1,
            background: 'radial-gradient(ellipse 70% 60% at 100% 20%, rgba(0,212,170,0.06) 0%, transparent 70%)',
          }}
        >
          <h1
            className="leading-tight mb-2"
            style={{
              fontFamily: 'var(--font-inter, system-ui, sans-serif)',
              fontSize: '48px',
              fontWeight: 800,
              color: '#E2E8F0',
              letterSpacing: '-0.02em',
            }}
          >
            ShadowTrace
          </h1>

          {/* Brand tagline */}
          <p
            className="mb-4"
            style={{
              fontFamily: 'var(--font-inter, system-ui, sans-serif)',
              fontSize: '18px',
              fontWeight: 500,
              color: '#CBD5E1',
              letterSpacing: '-0.01em',
            }}
          >
            An AI that fights AI.
          </p>

          {/* Technical description */}
          <p
            className="mb-8 leading-relaxed"
            style={{
              fontFamily: 'var(--font-inter, system-ui, sans-serif)',
              fontSize: '14px',
              color: '#4A5568',
              maxWidth: '340px',
            }}
          >
            AI-powered detection of coordinated misinformation campaigns.
          </p>

          {/* Operational tagline */}
          <p
            className="font-mono mb-5 tracking-widest"
            style={{ fontSize: '11px', color: '#00D4AA' }}
          >
            DETECT.&nbsp;&nbsp;TRACE.&nbsp;&nbsp;NEUTRALIZE.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['Multi-Agent AI', 'Graph Analytics', 'Real-Time Alerts', 'Evidence Export'].map((f) => (
              <span
                key={f}
                className="font-mono"
                style={{
                  fontSize: '10px',
                  padding: '4px 10px',
                  border: '1px solid #1E4A3A',
                  color: '#00D4AA',
                  letterSpacing: '0.04em',
                  backgroundColor: 'rgba(0,212,170,0.04)',
                }}
              >
                {f}
              </span>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 font-semibold text-sm hover:bg-[#009E7F]"
            style={{
              backgroundColor: '#00D4AA',
              color: '#0A0F1E',
              padding: '12px 28px',
              borderRadius: '4px',
              fontFamily: 'var(--font-inter, system-ui, sans-serif)',
              alignSelf: 'flex-start',
              fontWeight: 600,
            }}
          >
            Access Dashboard →
          </Link>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div
        className="shrink-0"
        style={{ borderTop: '1px solid #1E2D4A', backgroundColor: '#0D1526' }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="px-8 py-6"
              style={{
                borderRight:
                  i < STATS.length - 1 ? '1px solid #1E2D4A' : 'none',
              }}
            >
              <div
                className="font-mono text-xs tracking-widest uppercase mb-2"
                style={{ color: '#4A5568' }}
              >
                {stat.label}
              </div>
              <div
                className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: '#E2E8F0' }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function Pipe() {
  return (
    <span className="mx-4" style={{ color: '#1E2D4A' }}>
      |
    </span>
  )
}
