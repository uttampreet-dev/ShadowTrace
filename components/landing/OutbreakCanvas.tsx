'use client'

import { useEffect, useRef } from 'react'

/**
 * Live 3D simulation of the product thesis: misinformation spreads through an
 * account network, then ShadowTrace's detection sweep locks onto the bots.
 *
 * True perspective projection — nodes live in a rotating 3D field with depth
 * fog and mouse parallax. Pure canvas: no 3D runtime, no assets, instant paint.
 */

type State = 'clean' | 'infected' | 'detected'

interface Node {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  r: number
  state: State
  /** 0→1 progress since entering the current state (drives reticle snap) */
  t: number
  seed: number
  // per-frame projection cache
  sx: number
  sy: number
  scale: number
}

const INFECTED = '#EF4444'
const DETECTED = '#00D4AA'

const CAMERA = 900        // focal distance — smaller = more dramatic perspective
const LINK_3D = 165       // world-space link distance
const DEPTH = 720         // z spread of the field

export default function OutbreakCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let nodes: Node[] = []
    let raf = 0
    let running = true

    // Camera orientation — slow auto-yaw plus eased mouse parallax
    let yaw = 0
    let pitch = 0
    let targetYawOffset = 0
    let targetPitchOffset = 0
    let yawOffset = 0
    let pitchOffset = 0

    // Detection sweep (3D radius from world origin)
    let sweepRadius = -1

    // Outbreak phase timing
    let phaseClock = 0
    let spreadClock = 0

    function build() {
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.floor(width * dpr)
      canvas!.height = Math.floor(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(46, Math.min(130, Math.round((width * height) / 10000)))
      const spreadX = width * 0.62
      const spreadY = height * 0.56
      nodes = Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 2 * spreadX,
        y: (Math.random() - 0.5) * 2 * spreadY,
        z: (Math.random() - 0.5) * DEPTH,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        vz: (Math.random() - 0.5) * 0.18,
        r: 1.5 + Math.random() * 2.4,
        state: 'clean' as State,
        t: 0,
        seed: Math.random() * Math.PI * 2,
        sx: 0,
        sy: 0,
        scale: 1,
      }))
      seedOutbreak()
    }

    function seedOutbreak() {
      const zero = nodes[Math.floor(Math.random() * nodes.length)]
      if (zero) {
        zero.state = 'infected'
        zero.t = 0
        zero.r = Math.max(zero.r, 3.2)
      }
    }

    function reset() {
      nodes.forEach(n => {
        n.state = 'clean'
        n.t = 0
      })
      sweepRadius = -1
      phaseClock = 0
      seedOutbreak()
    }

    function project(n: Node) {
      // rotate around Y (yaw), then X (pitch)
      const cy = Math.cos(yaw + yawOffset)
      const sy = Math.sin(yaw + yawOffset)
      const cx = Math.cos(pitch + pitchOffset)
      const sx = Math.sin(pitch + pitchOffset)

      const x1 = n.x * cy - n.z * sy
      const z1 = n.x * sy + n.z * cy
      const y2 = n.y * cx - z1 * sx
      const z2 = n.y * sx + z1 * cx

      const s = CAMERA / (CAMERA + z2 + DEPTH * 0.4)
      n.scale = s
      n.sx = width / 2 + x1 * s
      n.sy = height / 2 + y2 * s
      return z2
    }

    function dist3d(a: Node, b: Node) {
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      return dx * dx + dy * dy + dz * dz
    }

    function step(dt: number) {
      phaseClock += dt
      spreadClock += dt
      yaw += dt * 0.000055
      yawOffset += (targetYawOffset - yawOffset) * 0.04
      pitchOffset += (targetPitchOffset - pitchOffset) * 0.04

      const bx = width * 0.62
      const by = height * 0.56
      const bz = DEPTH / 2

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.z += n.vz
        if (Math.abs(n.x) > bx) n.vx *= -1
        if (Math.abs(n.y) > by) n.vy *= -1
        if (Math.abs(n.z) > bz) n.vz *= -1
        n.t = Math.min(1, n.t + dt * 0.0018)
      }

      // Contagion: infected accounts amplify to 3D neighbours
      if (spreadClock > 200) {
        spreadClock = 0
        const fresh: Node[] = []
        for (const a of nodes) {
          if (a.state !== 'infected') continue
          for (const b of nodes) {
            if (b.state !== 'clean') continue
            if (dist3d(a, b) < LINK_3D * LINK_3D && Math.random() < 0.17) fresh.push(b)
          }
        }
        fresh.forEach(n => {
          n.state = 'infected'
          n.t = 0
        })
      }

      // Detection sweep launches once the campaign has visibly spread
      const infectedCount = nodes.filter(n => n.state === 'infected').length
      if (sweepRadius < 0 && (infectedCount > nodes.length * 0.24 || phaseClock > 9500)) {
        sweepRadius = 0
      }

      if (sweepRadius >= 0) {
        sweepRadius += dt * 0.62
        for (const n of nodes) {
          if (n.state !== 'infected') continue
          if (n.x * n.x + n.y * n.y + n.z * n.z < sweepRadius * sweepRadius) {
            n.state = 'detected'
            n.t = 0
          }
        }
        const maxR = Math.sqrt(bx * bx + by * by + bz * bz)
        if (sweepRadius > maxR) {
          if (phaseClock > 0) phaseClock = -2800 // hold the all-clear frame
          sweepRadius = -1
        }
      }

      if (phaseClock < 0 && phaseClock + dt >= 0) reset()
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)

      // Project all nodes, then sort far→near so overlap reads as depth
      for (const n of nodes) project(n)
      const order = [...nodes].sort((a, b) => a.scale - b.scale)

      // Edges (3D-linked, alpha carries depth fog)
      ctx!.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const d2 = dist3d(a, b)
          if (d2 > LINK_3D * LINK_3D) continue
          const fade = (1 - Math.sqrt(d2) / LINK_3D) * Math.min(a.scale, b.scale)

          let stroke = `rgba(84, 118, 165, ${fade * 0.8})`
          if (a.state === 'detected' || b.state === 'detected') {
            stroke = `rgba(0, 212, 170, ${fade * 0.55})`
          } else if (a.state === 'infected' && b.state === 'infected') {
            stroke = `rgba(239, 68, 68, ${fade * 0.6})`
          } else if (a.state === 'infected' || b.state === 'infected') {
            stroke = `rgba(245, 158, 11, ${fade * 0.65})`
          }
          ctx!.strokeStyle = stroke
          ctx!.beginPath()
          ctx!.moveTo(a.sx, a.sy)
          ctx!.lineTo(b.sx, b.sy)
          ctx!.stroke()
        }
      }

      // Sweep ring — projected at the z=0 plane
      if (sweepRadius > 0) {
        const s = CAMERA / (CAMERA + DEPTH * 0.4)
        const r = sweepRadius * s
        const cx = width / 2
        const cy = height / 2
        const grad = ctx!.createRadialGradient(cx, cy, Math.max(0, r - 80), cx, cy, r)
        grad.addColorStop(0, 'rgba(0, 212, 170, 0)')
        grad.addColorStop(0.82, 'rgba(0, 212, 170, 0.08)')
        grad.addColorStop(1, 'rgba(0, 212, 170, 0)')
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.arc(cx, cy, r, 0, Math.PI * 2)
        ctx!.fill()

        ctx!.strokeStyle = 'rgba(0, 212, 170, 0.5)'
        ctx!.lineWidth = 1.4
        ctx!.beginPath()
        ctx!.arc(cx, cy, r, 0, Math.PI * 2)
        ctx!.stroke()
      }

      // Nodes, far first
      const now = performance.now()
      for (const n of order) {
        const depthAlpha = 0.5 + 0.5 * Math.min(1, (n.scale - 0.55) / 0.9)
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.0022 + n.seed)

        if (n.state === 'infected') {
          const r = (n.r + 1.0 + pulse * 1.2) * n.scale
          ctx!.globalAlpha = depthAlpha
          ctx!.shadowBlur = 14 * n.scale
          ctx!.shadowColor = INFECTED
          ctx!.fillStyle = INFECTED
          ctx!.beginPath()
          ctx!.arc(n.sx, n.sy, r, 0, Math.PI * 2)
          ctx!.fill()
          ctx!.shadowBlur = 0
        } else if (n.state === 'detected') {
          const r = (n.r + 0.8) * n.scale
          ctx!.globalAlpha = depthAlpha
          ctx!.shadowBlur = 12 * n.scale
          ctx!.shadowColor = DETECTED
          ctx!.fillStyle = DETECTED
          ctx!.beginPath()
          ctx!.arc(n.sx, n.sy, r, 0, Math.PI * 2)
          ctx!.fill()
          ctx!.shadowBlur = 0

          // Lock-on reticle snaps closed on detection
          const ease = 1 - Math.pow(1 - Math.min(1, n.t * 3.2), 3)
          const box = (16 - 8 * ease) * n.scale
          const alpha = 0.9 * (1 - Math.max(0, n.t * 1.4 - 0.5)) * depthAlpha
          if (alpha > 0.02) {
            ctx!.strokeStyle = `rgba(0, 212, 170, ${alpha})`
            ctx!.lineWidth = 1.2
            const c = 4 * n.scale
            const corners: [number, number, number, number][] = [
              [-box, -box, 1, 1], [box, -box, -1, 1], [-box, box, 1, -1], [box, box, -1, -1],
            ]
            for (const [ox, oy, sxx, syy] of corners) {
              ctx!.beginPath()
              ctx!.moveTo(n.sx + ox, n.sy + oy + syy * c)
              ctx!.lineTo(n.sx + ox, n.sy + oy)
              ctx!.lineTo(n.sx + ox + sxx * c, n.sy + oy)
              ctx!.stroke()
            }
          }
        } else {
          const r = (n.r + 0.5) * n.scale
          ctx!.globalAlpha = depthAlpha
          ctx!.fillStyle = 'rgba(88, 122, 168, 0.95)'
          ctx!.beginPath()
          ctx!.arc(n.sx, n.sy, r, 0, Math.PI * 2)
          ctx!.fill()
          ctx!.strokeStyle = 'rgba(140, 172, 214, 0.6)'
          ctx!.lineWidth = 0.8
          ctx!.stroke()
        }
        ctx!.globalAlpha = 1
      }
    }

    let last = performance.now()
    function frame(now: number) {
      if (!running) return
      const dt = Math.min(48, now - last)
      last = now
      step(dt)
      draw()
      raf = requestAnimationFrame(frame)
    }

    function onMove(e: PointerEvent) {
      // Parallax: the whole field tilts toward the cursor
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      targetYawOffset = nx * 0.42
      targetPitchOffset = ny * 0.3
    }
    function onLeave() {
      targetYawOffset = 0
      targetPitchOffset = 0
    }

    build()
    if (reduced) {
      nodes.forEach((n, i) => { n.state = i % 3 === 0 ? 'detected' : 'clean' })
      for (const n of nodes) project(n)
      draw()
    } else {
      raf = requestAnimationFrame(frame)
    }

    const onResize = () => build()
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
