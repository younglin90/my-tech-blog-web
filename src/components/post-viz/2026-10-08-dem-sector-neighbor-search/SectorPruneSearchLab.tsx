'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Grain = { x: number; y: number; r: number; vx: number; vy: number }

const DOM = 392
const OX = 12
const OY = 14
const PANEL = 232
const W = OX + DOM + PANEL
const H = OY + DOM + 14

function seedGrains(n: number): Grain[] {
  let s = 20261008
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  const gauss = () => {
    const u = Math.max(1e-9, rnd())
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
  }
  const out: Grain[] = []
  for (let i = 0; i < n; i++) {
    const r = 0.5 * (0.016 + 0.018 * rnd() * rnd())
    out.push({
      x: Math.min(0.95, Math.max(0.05, 0.5 + 0.13 * gauss())),
      y: Math.min(0.95, Math.max(0.05, 0.5 + 0.13 * gauss())),
      r,
      vx: 0.0016 * gauss(),
      vy: 0.0016 * gauss(),
    })
  }
  out[0] = { x: 0.5, y: 0.5, r: 0.05, vx: 0, vy: 0 }
  return out
}

function brutePairs(g: Grain[]) {
  const pairs = new Set<number>()
  let ev = 0
  for (let i = 0; i < g.length; i++) {
    for (let j = i + 1; j < g.length; j++) {
      ev++
      const dx = g[i].x - g[j].x
      const dy = g[i].y - g[j].y
      const rr = g[i].r + g[j].r
      if (dx * dx + dy * dy < rr * rr) pairs.add(i * 4096 + j)
    }
  }
  return { pairs, ev }
}

function binnedPairs(g: Grain[], s: number, shell: number, splitBig: boolean) {
  const bins = new Map<number, number[]>()
  const start = splitBig ? 1 : 0
  for (let i = start; i < g.length; i++) {
    const k = (Math.floor(g[i].x / s) + 64) * 4096 + Math.floor(g[i].y / s) + 64
    const b = bins.get(k)
    if (b) b.push(i)
    else bins.set(k, [i])
  }
  const pairs = new Set<number>()
  let ev = 0
  let look = 0
  for (let i = start; i < g.length; i++) {
    const cx = Math.floor(g[i].x / s)
    const cy = Math.floor(g[i].y / s)
    for (let a = -shell; a <= shell; a++) {
      for (let b = -shell; b <= shell; b++) {
        look++
        const cell = bins.get((cx + a + 64) * 4096 + cy + b + 64)
        if (!cell) continue
        for (const j of cell) {
          if (j <= i) continue
          ev++
          const dx = g[i].x - g[j].x
          const dy = g[i].y - g[j].y
          const rr = g[i].r + g[j].r
          if (dx * dx + dy * dy < rr * rr) pairs.add(i * 4096 + j)
        }
      }
    }
  }
  if (splitBig) {
    for (let j = 1; j < g.length; j++) {
      ev++
      const dx = g[0].x - g[j].x
      const dy = g[0].y - g[j].y
      const rr = g[0].r + g[j].r
      if (dx * dx + dy * dy < rr * rr) pairs.add(j)
    }
  }
  return { pairs, ev, look }
}

export function SectorPruneSearchLab() {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [count, setCount] = useState(220)
  const [sMul, setSMul] = useState(1)
  const [shell, setShell] = useState(1)
  const [splitBig, setSplitBig] = useState(false)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ truth: 0, found: 0, miss: 0, ev: 0, look: 0, bruteEv: 0, cellPx: 0 })

  const grains = useMemo(() => seedGrains(count), [count])

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const draw = () => {
      frame++
      if (running) {
        for (let i = 1; i < grains.length; i++) {
          const g = grains[i]
          const dx = 0.5 - g.x
          const dy = 0.5 - g.y
          const d = Math.max(0.02, Math.hypot(dx, dy))
          g.vx = 0.97 * g.vx + 0.000055 * (dx / d)
          g.vy = 0.97 * g.vy + 0.000055 * (dy / d)
          g.x += g.vx
          g.y += g.vy
          if (g.x < g.r || g.x > 1 - g.r) g.vx *= -1
          if (g.y < g.r || g.y > 1 - g.r) g.vy *= -1
          g.x = Math.min(1 - g.r, Math.max(g.r, g.x))
          g.y = Math.min(1 - g.r, Math.max(g.r, g.y))
        }
      }

      const dmaxAll = 2 * grains.reduce((m, g) => Math.max(m, g.r), 0)
      const dmaxSub = 2 * grains.slice(1).reduce((m, g) => Math.max(m, g.r), 0)
      const s = sMul * (splitBig ? dmaxSub : dmaxAll)
      const truth = brutePairs(grains)
      const got = binnedPairs(grains, s, shell, splitBig)
      const missed: number[] = []
      truth.pairs.forEach((k) => {
        if (!got.pairs.has(k)) missed.push(k)
      })

      const px = (u: number) => OX + u * DOM
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      // sector grid
      ctx.strokeStyle = '#263041'
      ctx.lineWidth = 1
      for (let t = 0; t <= 1 / s + 1; t++) {
        const p = px(t * s)
        if (p > OX + DOM) break
        ctx.beginPath()
        ctx.moveTo(p, OY)
        ctx.lineTo(p, OY + DOM)
        ctx.moveTo(OX, OY + p - OX)
        ctx.lineTo(OX + DOM, OY + p - OX)
        ctx.stroke()
      }

      // scanned stencil of the probe particle
      const probe = missed.length ? Math.floor(missed[0] / 4096) : 0
      const pcx = Math.floor(grains[probe].x / s)
      const pcy = Math.floor(grains[probe].y / s)
      ctx.fillStyle = 'rgba(56,139,253,0.17)'
      for (let a = -shell; a <= shell; a++) {
        for (let b = -shell; b <= shell; b++) {
          const x0 = px((pcx + a) * s)
          const y0 = OY + (pcy + b) * s * DOM
          ctx.fillRect(x0, y0, s * DOM, s * DOM)
        }
      }
      ctx.strokeStyle = '#388bfd'
      ctx.lineWidth = 1.4
      ctx.strokeRect(px((pcx - shell) * s), OY + (pcy - shell) * s * DOM, (2 * shell + 1) * s * DOM, (2 * shell + 1) * s * DOM)

      // domain border
      ctx.strokeStyle = '#4b5666'
      ctx.lineWidth = 1.5
      ctx.strokeRect(OX, OY, DOM, DOM)

      // contacts
      ctx.lineWidth = 1.4
      ctx.strokeStyle = 'rgba(63,185,80,0.85)'
      ctx.beginPath()
      got.pairs.forEach((k) => {
        const i = Math.floor(k / 4096)
        const j = k % 4096
        ctx.moveTo(px(grains[i].x), OY + grains[i].y * DOM)
        ctx.lineTo(px(grains[j].x), OY + grains[j].y * DOM)
      })
      ctx.stroke()

      // particles
      for (let i = 0; i < grains.length; i++) {
        const g = grains[i]
        ctx.beginPath()
        ctx.arc(px(g.x), OY + g.y * DOM, g.r * DOM, 0, 2 * Math.PI)
        ctx.fillStyle = i === 0 ? '#d29922' : i === probe ? '#58a6ff' : '#546478'
        ctx.fill()
      }

      // missed contacts on top
      const pulse = 0.55 + 0.45 * Math.sin(frame * 0.14)
      ctx.strokeStyle = `rgba(248,81,73,${pulse})`
      ctx.lineWidth = 3
      ctx.beginPath()
      for (const k of missed) {
        const i = Math.floor(k / 4096)
        const j = k % 4096
        ctx.moveTo(px(grains[i].x), OY + grains[i].y * DOM)
        ctx.lineTo(px(grains[j].x), OY + grains[j].y * DOM)
      }
      ctx.stroke()

      // ---- panel ----
      const bx = OX + DOM + 16
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#8b949e'
      ctx.fillText('distance evaluations / step', bx, OY + 14)

      const barMax = Math.max(truth.ev, got.ev, 1)
      const bar = (y: number, v: number, col: string, lab: string) => {
        const w = Math.max(2, (v / barMax) * 196)
        ctx.fillStyle = col
        ctx.fillRect(bx, y, w, 14)
        ctx.fillStyle = '#c9d1d9'
        ctx.fillText(`${lab} ${v.toLocaleString('en-US')}`, bx, y - 4)
      }
      bar(OY + 40, truth.ev, '#6e7681', 'all-pairs')
      bar(OY + 86, got.ev, '#388bfd', `sector ${(2 * shell + 1) ** 2}cell`)

      ctx.fillStyle = '#8b949e'
      ctx.fillText(`speedup  ${(truth.ev / Math.max(1, got.ev)).toFixed(1)}x`, bx, OY + 128)
      ctx.fillText(`cell lookups  ${got.look.toLocaleString('en-US')}`, bx, OY + 148)
      ctx.fillStyle = '#d29922'
      ctx.fillText(`sector size s = ${s.toFixed(3)} L`, bx, OY + 176)
      ctx.fillText(`reach  shell*s = ${(shell * s).toFixed(3)}`, bx, OY + 196)
      ctx.fillStyle = shell * s >= dmaxAll - 1e-9 || splitBig ? '#3fb950' : '#f85149'
      ctx.fillText(`d_max = ${dmaxAll.toFixed(3)}  ${shell * s >= dmaxAll - 1e-9 || splitBig ? 'SAFE' : 'TOO SHORT'}`, bx, OY + 216)

      ctx.fillStyle = '#c9d1d9'
      ctx.fillText(`true contacts   ${truth.pairs.size}`, bx, OY + 252)
      ctx.fillStyle = '#3fb950'
      ctx.fillText(`found           ${got.pairs.size}`, bx, OY + 272)
      ctx.fillStyle = missed.length ? '#f85149' : '#8b949e'
      ctx.fillText(`missed          ${missed.length}`, bx, OY + 292)

      ctx.fillStyle = '#6e7681'
      ctx.fillText('yellow = largest grain', bx, OY + 330)
      ctx.fillText('blue box = scanned sectors', bx, OY + 348)
      ctx.fillText('red line = missed contact', bx, OY + 366)

      if (frame % 12 === 0) {
        setStat({
          truth: truth.pairs.size,
          found: got.pairs.size,
          miss: missed.length,
          ev: got.ev,
          look: got.look,
          bruteEv: truth.ev,
          cellPx: s,
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [grains, sMul, shell, splitBig, running])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas ref={canvas} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', marginTop: '0.7rem', fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          s / d_max
          <input type="range" min={0.25} max={2} step={0.05} value={sMul} onChange={(e) => setSMul(Number(e.target.value))} />
          <b>{sMul.toFixed(2)}</b>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          shell
          <input type="range" min={1} max={4} step={1} value={shell} onChange={(e) => setShell(Number(e.target.value))} />
          <b>{shell}</b>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          grains
          <input type="range" min={80} max={340} step={20} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          <b>{count}</b>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={splitBig} onChange={(e) => setSplitBig(e.target.checked)} />
          split largest grain
        </label>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '2px 10px' }}>
          {running ? 'pause' : 'run'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace' }}>
        {stat.miss > 0
          ? `missing ${stat.miss} of ${stat.truth} contacts — reach ${(shell * stat.cellPx).toFixed(3)} L is shorter than d_max`
          : `all ${stat.truth} contacts found with ${stat.ev.toLocaleString('en-US')} of ${stat.bruteEv.toLocaleString('en-US')} distance checks`}
      </p>
    </div>
  )
}
