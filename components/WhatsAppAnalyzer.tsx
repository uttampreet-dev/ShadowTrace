'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppResult {
  is_forward:           boolean
  forward_depth:        number
  misinformation_score: number
  risk_level:           'HIGH' | 'MED' | 'LOW'
  language_detected:    string
  red_flags:            string[]
  forward_signals:      string[]
  claim_extracted:      string
  verdict:              string
  content_score:        number
  wa_pattern_score:     number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT: React.CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono, "Fira Code", monospace)',
}
const BORDER = '1px solid #1E2D4A'

const RISK_COLOR: Record<string, string> = {
  HIGH: '#EF4444',
  MED:  '#F59E0B',
  LOW:  '#22C55E',
}

const QUICK_TESTS = [
  {
    label: 'Test: Health Forward',
    text:  '🚨 URGENT! Doctors ne confirm kiya hai ki nimbu paani subah peene se cancer 100% theek ho jata hai. Ye baat government chupa rahi hai. Abhi share karo sabko! 🙏',
  },
  {
    label: 'Test: Political Forward',
    text:  "FWD: Breaking - Sources say EVMs were hacked in last election. Mainstream media won't show this. Share before deleted! Wake up India 🇮🇳",
  },
  {
    label: 'Test: Benign Message',
    text:  'Good morning! Hope you have a wonderful day. Please drink enough water today. Stay healthy! 😊',
  },
]

function scoreColor(score: number): string {
  if (score < 40) return '#22C55E'
  if (score <= 70) return '#F59E0B'
  return '#EF4444'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBlock({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '18px 8px' }}>
      <div style={{ ...FONT, fontSize: '34px', fontWeight: 700, color: scoreColor(score), lineHeight: 1 }}>
        {score}
      </div>
      <div style={{ ...FONT, fontSize: '9px', letterSpacing: '0.1em', color: '#4A5568', marginTop: '8px' }}>
        {label}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhatsAppAnalyzer() {
  const [text,    setText]    = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<WhatsAppResult | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  async function analyze() {
    if (text.trim().length < 10 || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/whatsapp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('request failed')
      setResult((await res.json()) as WhatsAppResult)
    } catch {
      setError('Analysis failed. Check API configuration.')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = result ? (RISK_COLOR[result.risk_level] ?? '#F59E0B') : '#1E2D4A'

  return (
    <div style={{ border: BORDER, backgroundColor: '#0D1526' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          ...FONT,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          height:         '36px',
          padding:        '0 16px',
          borderBottom:   BORDER,
          fontSize:       '10px',
          letterSpacing:  '0.1em',
        }}
      >
        <span style={{ color: '#8B9AB5' }}>WHATSAPP FORWARD ANALYZER</span>
        <span style={{ color: '#4A5568' }}>🇮🇳 India-specific detection</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* ── Input ──────────────────────────────────────────────────────────── */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste a WhatsApp forward message here... (Hindi, Hinglish, or English)"
          rows={5}
          style={{
            ...FONT,
            width:           '100%',
            fontSize:        '12px',
            lineHeight:      1.6,
            color:           '#E2E8F0',
            backgroundColor: '#080E1A',
            border:          BORDER,
            padding:         '12px',
            resize:          'vertical',
            outline:         'none',
          }}
        />

        {/* Quick tests */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0 14px' }}>
          {QUICK_TESTS.map(qt => (
            <button
              key={qt.label}
              onClick={() => { setText(qt.text); setResult(null); setError(null) }}
              style={{
                ...FONT,
                fontSize:        '10px',
                letterSpacing:   '0.06em',
                color:           '#8B9AB5',
                backgroundColor: 'transparent',
                border:          BORDER,
                padding:         '6px 12px',
                cursor:          'pointer',
              }}
            >
              {qt.label}
            </button>
          ))}
        </div>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={text.trim().length < 10 || loading}
          style={{
            ...FONT,
            width:           '100%',
            fontSize:        '12px',
            fontWeight:      700,
            letterSpacing:   '0.12em',
            color:           text.trim().length >= 10 ? '#080E1A' : '#4A5568',
            backgroundColor: text.trim().length >= 10 ? '#00D4AA' : '#111D35',
            border:          'none',
            padding:         '12px',
            cursor:          text.trim().length >= 10 && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'ANALYZING...' : 'ANALYZE FORWARD →'}
        </button>

        {error && (
          <div style={{ ...FONT, fontSize: '11px', color: '#EF4444', marginTop: '10px' }}>{error}</div>
        )}

        {/* ── Results ────────────────────────────────────────────────────────── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>

            {/* Row 1 — forward detection strip */}
            <div
              style={{
                ...FONT,
                display:       'flex',
                gap:           '28px',
                flexWrap:      'wrap',
                border:        BORDER,
                borderLeft:    `2px solid ${result.is_forward ? '#EF4444' : '#22C55E'}`,
                padding:       '10px 14px',
                fontSize:      '11px',
                letterSpacing: '0.1em',
                color:         result.is_forward ? '#EF4444' : '#22C55E',
              }}
            >
              <span>{result.is_forward ? 'FORWARD DETECTED' : 'NOT A FORWARD'}</span>
              <span>DEPTH: {result.forward_depth}x</span>
              <span>LANGUAGE: {result.language_detected.toUpperCase()}</span>
            </div>

            {/* Row 2 — dual scores + combined */}
            <div style={{ display: 'flex', alignItems: 'stretch', border: BORDER }}>
              <ScoreBlock label="WA PATTERN SCORE" score={result.wa_pattern_score} />
              <div
                style={{
                  flex:           1.4,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  borderLeft:     BORDER,
                  borderRight:    BORDER,
                  padding:        '18px 8px',
                }}
              >
                <div style={{ ...FONT, fontSize: '9px', letterSpacing: '0.12em', color: '#4A5568', marginBottom: '8px' }}>
                  COMBINED
                </div>
                <div style={{ ...FONT, fontSize: '26px', fontWeight: 700, color: riskColor, lineHeight: 1 }}>
                  {result.misinformation_score}/100 — {result.risk_level}
                </div>
              </div>
              <ScoreBlock label="CONTENT AI SCORE" score={result.content_score} />
            </div>

            {/* Row 3 — red flags */}
            {result.red_flags.length > 0 && (
              <div>
                <div style={{ ...FONT, fontSize: '10px', letterSpacing: '0.12em', color: '#4A5568', marginBottom: '8px' }}>
                  RED FLAGS DETECTED
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.red_flags.map(flag => (
                    <div
                      key={flag}
                      style={{
                        ...FONT,
                        fontSize:        '11px',
                        color:           '#E2E8F0',
                        backgroundColor: '#111D35',
                        border:          BORDER,
                        borderLeft:      '2px solid #EF4444',
                        padding:         '8px 12px',
                      }}
                    >
                      ⚠ {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 4 — extracted claim */}
            <div style={{ border: BORDER, backgroundColor: '#111D35', padding: '12px 14px' }}>
              <div style={{ ...FONT, fontSize: '10px', letterSpacing: '0.12em', color: '#4A5568', marginBottom: '6px' }}>
                CORE CLAIM EXTRACTED
              </div>
              <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.6, fontStyle: 'italic' }}>
                &ldquo;{result.claim_extracted}&rdquo;
              </div>
            </div>

            {/* Row 5 — verdict banner */}
            <div
              style={{
                display:         'flex',
                alignItems:      'baseline',
                gap:             '18px',
                border:          `1px solid ${riskColor}`,
                backgroundColor: `${riskColor}26`, // ~15% opacity
                padding:         '14px 16px',
              }}
            >
              <span style={{ ...FONT, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: riskColor, flexShrink: 0 }}>
                VERDICT
              </span>
              <span style={{ ...FONT, fontSize: '12px', color: '#E2E8F0' }}>
                {result.verdict}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
