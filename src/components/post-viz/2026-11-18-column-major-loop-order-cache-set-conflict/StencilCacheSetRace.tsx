'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// Browser port of the post's stencil_misses(): a 5-point stencil reads u(i,j) from a
// column-major array (byte address = (i + j*ld)*8) over a 64-row strip, through a
// set-associative LRU cache. Two loop orders run side by side on identical caches.
// Default (32 KiB, 8-way, 64 B lines, N = ld = 256): 0.142 vs 1.258 misses/point.
const W = 760
const H = 430
const BG = '#0f172a'
const TXT = '#cbd5e1'
const GRID = 'rgba(148,163,184,0.2)'
const C_A = '#38bdf8'
const C_B = '#f97316'
const LINE = 64
const STRIP = 64
const OFF: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]

type Run = { p: number; miss: number; sets: number[][]; hot: Float32Array; hist: number[] }

function mkRun(nsets: number): Run {
  return { p: 0, miss: 0, sets: Array.from({ length: nsets }, () => []), hot: new Float32Array(nsets), hist: [] }
}

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a }

export function StencilCacheSetRace() {
  const cvs = useRef<HTMLCanvasElement>(null)
  const [n, setN] = useState(256)
  const [pad, setPad] = useState(false)
  const [kib, setKib] = useState(32)
  const [ways, setWays] = useState(8)
  const [speed, setSpeed] = useState(200)
  const [playing, setPlaying] = useState(true)
  const [ro, setRo] = useState({ pa: 0, ma: 0, mb: 0, tot: 1 })
  const ld = pad ? n + 1 : n
  const nsets = Math.max(1, (kib * 1024) / (LINE * ways))
  const cfg = useRef({ n, ld, ways, nsets, speed, playing, step: 0 })
  cfg.current = { ...cfg.current, n, ld, ways, nsets, speed, playing }
  const sim = useRef({ A: mkRun(64), B: mkRun(64) })

  const reset = (ns = cfg.current.nsets) => { sim.current = { A: mkRun(ns), B: mkRun(ns) } }

  useEffect(() => {
    const ctx = cvs.current?.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const touch = (r: Run, line: number) => {
      const c = cfg.current
      const si = line % c.nsets
      const s = r.sets[si]
      const k = s.indexOf(line)
      if (k >= 0) s.splice(k, 1)
      else {
        r.miss++
        r.hot[si] = 1
        if (s.length >= c.ways) s.shift()
      }
      s.push(line)
    }
    const point = (r: Run, iInner: boolean) => {
      const { n, ld } = cfg.current
      const tot = STRIP * (n - 2)
      if (r.p >= tot) return
      const i = iInner ? 1 + (r.p % STRIP) : 1 + Math.floor(r.p / (n - 2))
      const j = iInner ? 1 + Math.floor(r.p / STRIP) : 1 + (r.p % (n - 2))
      for (const [di, dj] of OFF) touch(r, Math.floor(((i + di) + (j + dj) * ld) * 8 / LINE))
      r.p++
      if (r.p % 64 === 0 || r.p === tot) r.hist.push(r.miss / r.p)
    }
    const drawSets = (r: Run, y0: number, col: string, label: string) => {
      const { nsets, ways } = cfg.current
      const x0 = 20
      const cw = Math.min(10, 720 / nsets)
      const ch = Math.min(6, 56 / ways)
      ctx.fillStyle = col
      ctx.font = 'bold 12px monospace'
      ctx.fillText(label, x0, y0 - 6)
      let used = 0
      for (let s = 0; s < nsets; s++) {
        const occ = r.sets[s].length
        if (occ) used++
        for (let w = 0; w < ways; w++) {
          ctx.fillStyle = w < occ ? col : '#1e293b'
          ctx.globalAlpha = w < occ ? 0.35 + 0.65 * r.hot[s] : 1
          ctx.fillRect(x0 + s * cw, y0 + (ways - 1 - w) * ch, cw - 1, ch - 1)
        }
        r.hot[s] *= 0.9
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = TXT
      ctx.font = '11px monospace'
      ctx.fillText(`sets touched ${used}/${nsets}  (bright = recent miss)`, x0 + 420, y0 - 6)
    }
    const loop = () => {
      const c = cfg.current
      const S = sim.current
      let k = c.playing ? c.speed : 0
      if (c.step > 0) { k += c.step * (c.n - 2); c.step = 0 }
      for (let s = 0; s < k; s++) { point(S.A, true); point(S.B, false) }
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      drawSets(S.A, 28, C_A, 'i innermost — cache sets x ways')
      drawSets(S.B, 118, C_B, 'j innermost — cache sets x ways')
      // progress of both sweeps over the strip
      const tot = STRIP * (c.n - 2)
      const py = 192
      ctx.fillStyle = TXT
      ctx.font = '11px monospace'
      ctx.fillText(`strip progress (64 rows x ${c.n - 2} columns)`, 20, py - 4)
      for (const [r, col, yy] of [[S.A, C_A, py], [S.B, C_B, py + 12]] as [Run, string, number][]) {
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(20, yy, 720, 8)
        ctx.fillStyle = col
        ctx.fillRect(20, yy, 720 * (r.p / tot), 8)
      }
      // miss/point history
      const gx = 60, gy = 228, gw = 680, gh = 170
      ctx.strokeStyle = GRID
      ctx.lineWidth = 1
      const ymax = 1.5
      for (let v = 0; v <= ymax + 1e-9; v += 0.25) {
        const y = gy + gh - (v / ymax) * gh
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke()
        ctx.fillStyle = TXT
        ctx.fillText(v.toFixed(2), 20, y + 4)
      }
      ctx.fillText('misses / grid point (cumulative)  vs  points swept', gx, gy - 6)
      const maxLen = Math.ceil(tot / 64)
      for (const [r, col] of [[S.A, C_A], [S.B, C_B]] as [Run, string][]) {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        r.hist.forEach((v, idx) => {
          const x = gx + (idx / Math.max(1, maxLen - 1)) * gw
          const y = gy + gh - Math.min(v, ymax) / ymax * gh
          if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }
      const ma = S.A.p ? S.A.miss / S.A.p : 0
      const mb = S.B.p ? S.B.miss / S.B.p : 0
      ctx.font = 'bold 13px monospace'
      ctx.fillStyle = C_A
      ctx.fillText(`i-inner ${ma.toFixed(3)}`, gx + 10, gy + gh + 22)
      ctx.fillStyle = C_B
      ctx.fillText(`j-inner ${mb.toFixed(3)}`, gx + 190, gy + gh + 22)
      ctx.fillStyle = '#4ade80'
      ctx.fillText(`ratio ${ma > 0 ? (mb / ma).toFixed(1) : '-'}x`, gx + 370, gy + gh + 22)
      if (++frame % 12 === 0) setRo({ pa: S.A.p, ma: S.A.miss, mb: S.B.miss, tot })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const bytes = ld * 8
  const used = bytes % LINE === 0 ? nsets / gcd(bytes / LINE, nsets) : nsets
  const live = used * ways
  const restart = () => { setPlaying(true) }
  return (
    <div style={{ background: BG, color: TXT, padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 13 }}>
      <canvas ref={cvs} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button style={btn} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => { cfg.current.step += 1 }}>Step (1 row)</button>
        <button style={btn} onClick={() => { setPlaying(false); reset() }}>Reset</button>
        <label><input type="checkbox" checked={pad} onChange={e => { setPad(e.target.checked); reset(); restart() }} /> pad leading dim: ld = N + 1</label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginTop: 6 }}>
        <label>grid N = {n} (ld = {ld})
          <input type="range" min={32} max={640} step={1} value={n} onChange={e => { setN(+e.target.value); reset(); restart() }} style={{ width: '100%' }} />
        </label>
        <label>L1 size {kib} KiB
          <input type="range" min={3} max={6} step={1} value={Math.log2(kib)} onChange={e => { const v = 2 ** +e.target.value; setKib(v); reset((v * 1024) / (LINE * ways)); restart() }} style={{ width: '100%' }} />
        </label>
        <label>associativity {ways}-way
          <input type="range" min={0} max={4} step={1} value={Math.log2(ways)} onChange={e => { const v = 2 ** +e.target.value; setWays(v); reset((kib * 1024) / (LINE * v)); restart() }} style={{ width: '100%' }} />
        </label>
        <label>points/frame {speed}
          <input type="range" min={10} max={2000} step={10} value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginTop: 6 }}>
        column stride {bytes} B → j-inner walk can use {used}/{nsets} sets = {live} lines; it needs ≈ N = {n} lines →{' '}
        <b style={{ color: live >= n * 1.1 ? '#4ade80' : '#f87171' }}>{live >= n * 1.1 ? 'fits' : 'thrashes'}</b>
        {' '}· swept {ro.pa}/{ro.tot} points · misses {ro.ma} vs {ro.mb}
      </div>
    </div>
  )
}

const btn: CSSProperties = { background: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
