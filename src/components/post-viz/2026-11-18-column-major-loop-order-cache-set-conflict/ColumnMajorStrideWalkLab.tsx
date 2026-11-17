'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// Concept: the same column-major array u(i,j) (address = i + j*N) walked in two loop orders.
// Left: i innermost (Fortran order) -> consecutive addresses, one miss per cache line.
// Right: j innermost (C habit carried into Fortran) -> stride N, a new line on almost every access
// once the N lines touched per inner loop no longer fit in the cache.
// Cache: fully associative, LRU, `cap` lines of `lineLen` elements.
const W = 760
const H = 420
const BG = '#0f172a'
const TXT = '#cbd5e1'
const C_HIT = '#4ade80'
const C_MISS = '#f87171'
const C_CACHE = 'rgba(56,189,248,0.35)'
const C_GOOD = '#38bdf8'
const C_BAD = '#f97316'

type Walk = { p: number; cache: number[]; miss: number; acc: number; mark: Int8Array; last: number; lastHit: boolean }

function mkWalk(n: number): Walk {
  return { p: 0, cache: [], miss: 0, acc: 0, mark: new Int8Array(n * n), last: -1, lastHit: false }
}

function stepWalk(w: Walk, n: number, iInner: boolean, lineLen: number, cap: number) {
  if (w.p >= n * n) return
  const i = iInner ? w.p % n : Math.floor(w.p / n)
  const j = iInner ? Math.floor(w.p / n) : w.p % n
  const addr = i + j * n
  const line = Math.floor(addr / lineLen)
  const k = w.cache.indexOf(line)
  if (k >= 0) {
    w.cache.splice(k, 1)
    w.lastHit = true
  } else {
    w.miss++
    w.lastHit = false
    if (w.cache.length >= cap) w.cache.shift()
  }
  w.cache.push(line)
  w.mark[addr] = w.lastHit ? 1 : 2
  w.last = addr
  w.acc++
  w.p++
}

export function ColumnMajorStrideWalkLab() {
  const cvs = useRef<HTMLCanvasElement>(null)
  const [n, setN] = useState(10)
  const [lineLen, setLineLen] = useState(4)
  const [cap, setCap] = useState(6)
  const [speed, setSpeed] = useState(6)
  const [playing, setPlaying] = useState(true)
  const [ro, setRo] = useState({ a: 0, ma: 0, mb: 0 })
  const cfg = useRef({ n, lineLen, cap, speed, playing, step: 0 })
  cfg.current = { ...cfg.current, n, lineLen, cap, speed, playing }
  const sim = useRef({ A: mkWalk(10), B: mkWalk(10) })

  const reset = (nn = cfg.current.n) => { sim.current = { A: mkWalk(nn), B: mkWalk(nn) } }

  useEffect(() => {
    const ctx = cvs.current?.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let acc = 0
    const panel = (w: Walk, x0: number, title: string, col: string, iInner: boolean) => {
      const { n, lineLen } = cfg.current
      const cs = Math.min(18, Math.floor(200 / n))
      const gx = x0 + (370 - cs * n) / 2
      const gy = 46
      ctx.fillStyle = col
      ctx.font = 'bold 13px monospace'
      ctx.fillText(title, x0 + 8, 20)
      ctx.font = '11px monospace'
      ctx.fillStyle = TXT
      ctx.fillText(iInner ? 'do j; do i  ->  u(i,j)  (stride 1)' : 'do i; do j  ->  u(i,j)  (stride N)', x0 + 8, 36)
      const cached = new Set(w.cache)
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const a = i + j * n
        // draw with i down (rows), j across (columns)
        const x = gx + j * cs
        const y = gy + i * cs
        ctx.fillStyle = cached.has(Math.floor(a / lineLen)) ? C_CACHE : '#1e293b'
        ctx.fillRect(x, y, cs - 1, cs - 1)
        if (w.mark[a]) {
          ctx.fillStyle = w.mark[a] === 1 ? C_HIT : C_MISS
          ctx.fillRect(x + cs * 0.3, y + cs * 0.3, cs * 0.4, cs * 0.4)
        }
        if (a === w.last) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, cs - 1, cs - 1) }
      }
      ctx.fillStyle = TXT
      ctx.fillText('i ↓  j →', gx, gy + cs * n + 12)
      // linear memory, wrapped every 32 elements
      const my = 270
      ctx.fillText('memory (address = i + j·N), cache lines boxed', x0 + 8, my - 6)
      const ms = 11
      const tot = n * n
      for (let a = 0; a < tot; a++) {
        const r = Math.floor(a / 32)
        const c = a % 32
        const x = x0 + 8 + c * ms
        const y = my + r * ms
        ctx.fillStyle = cached.has(Math.floor(a / lineLen)) ? C_CACHE : '#1e293b'
        ctx.fillRect(x, y, ms - 1, ms - 1)
        if (w.mark[a]) { ctx.fillStyle = w.mark[a] === 1 ? C_HIT : C_MISS; ctx.fillRect(x + 3, y + 3, ms - 7, ms - 7) }
        if (a === w.last) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, ms - 1, ms - 1) }
        if (a % lineLen === 0) { ctx.fillStyle = '#64748b'; ctx.fillRect(x - 1, y, 1, ms - 1) }
      }
      const rate = w.acc ? w.miss / w.acc : 0
      ctx.fillStyle = col
      ctx.font = 'bold 12px monospace'
      ctx.fillText(`accesses ${w.acc}  misses ${w.miss}  miss rate ${rate.toFixed(3)}`, x0 + 8, H - 10)
    }
    const loop = () => {
      const c = cfg.current
      const S = sim.current
      let k = 0
      if (c.playing) { acc += c.speed / 60; k = Math.floor(acc); acc -= k }
      if (c.step > 0) { k += c.step; c.step = 0 }
      for (let s = 0; s < k; s++) {
        stepWalk(S.A, c.n, true, c.lineLen, c.cap)
        stepWalk(S.B, c.n, false, c.lineLen, c.cap)
      }
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      panel(S.A, 0, 'i innermost (Fortran order)', C_GOOD, true)
      panel(S.B, 390, 'j innermost (C habit)', C_BAD, false)
      ctx.fillStyle = '#334155'
      ctx.fillRect(380, 8, 1, H - 16)
      if (++frame % 12 === 0) setRo({ a: S.A.acc, ma: S.A.miss, mb: S.B.miss })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const ideal = (1 / lineLen).toFixed(3)
  const fits = n <= cap
  return (
    <div style={{ background: BG, color: TXT, padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 13 }}>
      <canvas ref={cvs} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button style={btn} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => { cfg.current.step += 1 }}>Step</button>
        <button style={btn} onClick={() => { setPlaying(false); reset() }}>Reset</button>
        <span><b style={{ color: C_HIT }}>■</b> hit <b style={{ color: C_MISS }}>■</b> miss <b style={{ color: '#38bdf8' }}>■</b> line in cache</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginTop: 6 }}>
        <label>grid N = {n}
          <input type="range" min={4} max={16} step={1} value={n} onChange={e => { const v = +e.target.value; setN(v); reset(v) }} style={{ width: '100%' }} />
        </label>
        <label>line = {lineLen} elements
          <input type="range" min={2} max={8} step={1} value={lineLen} onChange={e => { setLineLen(+e.target.value); reset() }} style={{ width: '100%' }} />
        </label>
        <label>cache = {cap} lines
          <input type="range" min={2} max={20} step={1} value={cap} onChange={e => { setCap(+e.target.value); reset() }} style={{ width: '100%' }} />
        </label>
        <label>accesses/s {speed}
          <input type="range" min={1} max={120} step={1} value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginTop: 6 }}>
        ideal stride-1 miss rate 1/line = {ideal} · stride-N needs N = {n} lines live, cache holds {cap} →{' '}
        <b style={{ color: fits ? C_HIT : C_MISS }}>{fits ? 'fits: reuse survives' : 'does not fit: every access misses'}</b>
        {' '}· after {ro.a} accesses: {ro.ma} vs {ro.mb} misses
      </div>
    </div>
  )
}

const btn: CSSProperties = { background: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
