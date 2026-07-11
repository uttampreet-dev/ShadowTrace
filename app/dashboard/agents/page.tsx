'use client'

import { useState, useEffect } from 'react'

// ─── Types & data ─────────────────────────────────────────────────────────────

const FONT: React.CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono, "Fira Code", monospace)',
}
const BORDER = '1px solid #1E2D4A'

interface Agent {
  number:      string
  name:        string
  color:       string
  status:      'ONLINE' | 'STANDBY'
  description: string
  tasks:       number
  load:        number
  lastActive:  string
}

const AGENTS: Agent[] = [
  {
    number:      '01',
    name:        'ContentAnalyzer',
    color:       '#00D4AA',
    status:      'ONLINE',
    description: 'NLP model analyzing content authenticity using fact-check databases and semantic similarity scoring.',
    tasks:       1847,
    load:        73,
    lastActive:  'Just now',
  },
  {
    number:      '02',
    name:        'DeepfakeDetector',
    color:       '#7C3AED',
    status:      'ONLINE',
    description: 'ELA forensics + EXIF metadata analysis. Detects image manipulation in misinformation campaigns.',
    tasks:       203,
    load:        12,
    lastActive:  '5m ago',
  },
  {
    number:      '03',
    name:        'NetworkMapper',
    color:       '#F59E0B',
    status:      'ONLINE',
    description: 'Graph algorithm mapping account interaction networks and detecting bot behavior patterns.',
    tasks:       892,
    load:        45,
    lastActive:  'Just now',
  },
  {
    number:      '04',
    name:        'CampaignDetector',
    color:       '#3B82F6',
    status:      'ONLINE',
    description: 'Community detection identifying coordinated narrative bursts across account clusters.',
    tasks:       445,
    load:        28,
    lastActive:  '3m ago',
  },
  {
    number:      '05',
    name:        'ThreatClassifier',
    color:       '#EF4444',
    status:      'ONLINE',
    description: 'Scoring engine classifying campaigns: organic vs coordinated vs state-level operations.',
    tasks:       1247,
    load:        61,
    lastActive:  'Just now',
  },
]

// ─── Per-card component (needs hooks, so must be a real component) ────────────

function AgentCard({ agent, idx }: { agent: Agent; idx: number }) {
  const [count,    setCount]    = useState(0)
  const [barWidth, setBarWidth] = useState(0)

  // Count-up animation
  useEffect(() => {
    const duration = 1000 + idx * 80
    const step = agent.tasks / (duration / 16)
    let cur = 0
    const timer = setInterval(() => {
      cur += step
      if (cur >= agent.tasks) {
        setCount(agent.tasks)
        clearInterval(timer)
      } else {
        setCount(Math.floor(cur))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [agent.tasks, idx])

  // Bar fill animation — mount at 0, then animate
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(agent.load), 120 + idx * 60)
    return () => clearTimeout(t)
  }, [agent.load, idx])

  const isOnline = agent.status === 'ONLINE'
  const statusColor = isOnline ? '#22C55E' : '#F59E0B'

  return (
    <div
      style={{
        border:          `1px solid ${agent.color}`,
        backgroundColor: '#111D35',
        padding:         '20px',
        display:         'flex',
        flexDirection:   'column',
        gap:             '14px',
      }}
    >
      {/* Number badge */}
      <span
        style={{
          ...FONT,
          fontSize:      '11px',
          fontWeight:    700,
          color:         agent.color,
          letterSpacing: '0.12em',
        }}
      >
        {agent.number}
      </span>

      {/* Name + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ ...FONT, fontSize: '15px', fontWeight: 700, color: '#E2E8F0' }}>
          {agent.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className={isOnline ? 'st-pulse-dot' : undefined}
            style={{
              display:         'inline-block',
              width:           '6px',
              height:          '6px',
              borderRadius:    '50%',
              backgroundColor: statusColor,
              flexShrink:      0,
            }}
          />
          <span style={{ ...FONT, fontSize: '9px', color: statusColor, letterSpacing: '0.12em' }}>
            {agent.status}
          </span>
        </div>
      </div>

      {/* Description */}
      <div style={{ ...FONT, fontSize: '11px', color: '#4A5568', lineHeight: 1.65 }}>
        {agent.description}
      </div>

      {/* Tasks processed */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ ...FONT, fontSize: '10px', color: '#4A5568', letterSpacing: '0.1em' }}>
          TASKS PROCESSED
        </span>
        <span style={{ ...FONT, fontSize: '22px', fontWeight: 700, color: agent.color, lineHeight: 1 }}>
          {count.toLocaleString()}
        </span>
      </div>

      {/* Load bar */}
      <div>
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginBottom:   '6px',
          }}
        >
          <span style={{ ...FONT, fontSize: '10px', color: '#4A5568', letterSpacing: '0.08em' }}>
            AGENT LOAD
          </span>
          <span style={{ ...FONT, fontSize: '10px', color: '#E2E8F0' }}>
            {`${agent.load}%`}
          </span>
        </div>
        <div style={{ height: '4px', backgroundColor: '#0D1526', border: BORDER }}>
          <div
            style={{
              height:          '100%',
              width:           `${barWidth}%`,
              backgroundColor: agent.color,
              opacity:         0.85,
              transition:      'width 0.9s ease',
            }}
          />
        </div>
      </div>

      {/* Last active */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: BORDER, paddingTop: '10px' }}>
        <span style={{ ...FONT, fontSize: '10px', color: '#4A5568', letterSpacing: '0.08em' }}>
          LAST ACTIVE
        </span>
        <span style={{ ...FONT, fontSize: '10px', color: isOnline ? '#22C55E' : '#8B9AB5' }}>
          {agent.lastActive}
        </span>
      </div>
    </div>
  )
}

// ─── System summary strip ─────────────────────────────────────────────────────

function SystemStrip() {
  const online  = AGENTS.filter(a => a.status === 'ONLINE').length
  const total   = AGENTS.length
  const totalTasks = AGENTS.reduce((s, a) => s + a.tasks, 0)

  return (
    <div
      style={{
        display:      'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: BORDER,
      }}
    >
      {[
        { label: 'AGENTS ONLINE',    value: `${online} / ${total}`,             valueColor: '#22C55E' },
        { label: 'TOTAL TASKS',      value: totalTasks.toLocaleString(),         valueColor: '#E2E8F0' },
        { label: 'PIPELINE LATENCY', value: '47ms',                             valueColor: '#E2E8F0' },
        { label: 'SYSTEM STATUS',    value: 'NOMINAL',                          valueColor: '#22C55E' },
      ].map((cell, i) => (
        <div
          key={cell.label}
          style={{
            padding:     '14px 24px',
            borderRight: i < 3 ? BORDER : 'none',
          }}
        >
          <div style={{ ...FONT, fontSize: '10px', color: '#4A5568', letterSpacing: '0.1em', marginBottom: '8px' }}>
            {cell.label}
          </div>
          <div style={{ ...FONT, fontSize: '28px', fontWeight: 700, color: cell.valueColor, lineHeight: 1 }}>
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <div style={{ borderTop: BORDER }}>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <SystemStrip />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ ...FONT, fontSize: '18px', fontWeight: 700, color: '#E2E8F0', marginBottom: '4px' }}>
          Agent Intelligence Network
        </div>
        <div style={{ ...FONT, fontSize: '11px', color: '#4A5568' }}>
          5 specialized AI agents operating in parallel
        </div>
      </div>

      {/* ── Agent card grid ───────────────────────────────────────────────── */}
      <div
        style={{
          display:               'grid',
          gridTemplateColumns:   'repeat(2, 1fr)',
          gap:                   '16px',
          padding:               '20px 24px 24px',
        }}
      >
        {/* First 4 cards — fill the 2-col grid */}
        {AGENTS.slice(0, 4).map((agent, i) => (
          <AgentCard key={agent.number} agent={agent} idx={i} />
        ))}

        {/* 5th card — centered, matching single-column width */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 'calc(50% - 8px)' }}>
            <AgentCard agent={AGENTS[4]} idx={4} />
          </div>
        </div>
      </div>

    </div>
  )
}
