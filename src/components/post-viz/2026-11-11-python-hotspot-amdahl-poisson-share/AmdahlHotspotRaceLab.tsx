'use client'

import { useEffect, useRef, useState } from 'react'

// Amdahl's law for "port only the hotspot": a run of length 1 splits into
// a hotspot fraction p and the rest (1 - p). Porting the hotspot with kernel
// speedup s gives total time (1 - p) + p / s, so speedup S = 1 / ((1 - p) + p / s),
// which can never exceed 1 / (1 - p).
const W = 760
const H = 500
const BG = '#0f172a'
const HOT = '#f97316'
const REST = '#64748b'
const ACC = '#38bdf8'
const OK = '#4ade80'
const TXT = '#cbd5e1'
const GRID = 'rgba(148,163,184,0.22)'
// p values measured in the post (tol = 1e-3 ... 1e-6)
const TABLE = [
  { tol: '1e-3', p: 0.292 },
  { tol: '1e-4', p: 0.748 },
  { tol: '1e-5', p: 0.955 },
  { tol: '1e-6', p: 0.989 },
]

export function AmdahlHotspotRaceLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [p, setP] = useState(0.748)
  const [logS, setLogS] = useState(Math.log10(59))
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const clock = useRef(0)
  const s = Math.pow(10, logS)
  const S = 1 / (1 - p + p / s)
  const ceil = 1 / (1 - p)

  useEffect(() => { clock.current = 0 }, [nonce, p, logS])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    const RUN = 4.0 // seconds of animation for the original run
    let last = performance.now()
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (playing) {
        clock.current += dt
        if (clock.current > RUN + 1.2) clock.current = 0
      }
      const tau = Math.min(1, clock.current / RUN) // elapsed wall-clock as fraction of original run
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      ctx.font = '13px ui-sans-serif, system-ui'

      // --- race bars ---
      const X0 = 150, X1 = W - 30, BW = X1 - X0
      const rows = [
        { name: 'all Python', rest: 1 - p, hot: p },
        { name: 'hotspot ported', rest: 1 - p, hot: p / s },
      ]
      ctx.fillStyle = TXT
      ctx.fillText('wall-clock race (same work, same answer)', 20, 24)
      rows.forEach((r, k) => {
        const y = 44 + k * 58
        const total = r.rest + r.hot
        ctx.fillStyle = TXT
        ctx.fillText(r.name, 20, y + 20)
        // outline of total time
        ctx.strokeStyle = GRID
        ctx.strokeRect(X0, y, BW * total, 28)
        // filled portion = progress
        const done = Math.min(total, tau)
        const restDone = Math.min(done, r.rest)
        const hotDone = Math.max(0, done - r.rest)
        ctx.fillStyle = REST
        ctx.fillRect(X0, y, BW * restDone, 28)
        ctx.fillStyle = HOT
        ctx.fillRect(X0 + BW * r.rest, y, BW * hotDone, 28)
        // ghost segments
        ctx.globalAlpha = 0.25
        ctx.fillStyle = REST
        ctx.fillRect(X0, y, BW * r.rest, 28)
        ctx.fillStyle = HOT
        ctx.fillRect(X0 + BW * r.rest, y, BW * r.hot, 28)
        ctx.globalAlpha = 1
        const finished = tau >= total
        ctx.fillStyle = finished ? OK : TXT
        ctx.fillText(finished ? `done at ${total.toFixed(3)}` : `${(done / total * 100).toFixed(0)}%`, X0 + Math.min(BW * total + 8, BW - 60), y + 20)
      })
      // time cursor
      ctx.strokeStyle = '#e2e8f0'
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(X0 + BW * tau, 36); ctx.lineTo(X0 + BW * tau, 166); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = REST; ctx.fillRect(X0, 172, 12, 10)
      ctx.fillStyle = TXT; ctx.fillText('rest (1 − p): stays Python', X0 + 18, 182)
      ctx.fillStyle = HOT; ctx.fillRect(X0 + 230, 172, 12, 10)
      ctx.fillStyle = TXT; ctx.fillText('hotspot p → p / s', X0 + 248, 182)

      // --- speedup curve S(s) ---
      const PX0 = 70, PX1 = W - 30, PY0 = 215, PY1 = H - 40
      const sx = (ls: number) => PX0 + (ls / 3) * (PX1 - PX0) // s from 1 to 1000
      const ymax = 2.2 // log10 of 160
      const sy = (S: number) => PY1 - (Math.log10(S) / ymax) * (PY1 - PY0)
      ctx.strokeStyle = GRID
      ctx.lineWidth = 1
      for (let e = 0; e <= 3; e++) {
        ctx.beginPath(); ctx.moveTo(sx(e), PY0); ctx.lineTo(sx(e), PY1); ctx.stroke()
        ctx.fillStyle = TXT; ctx.fillText(`${Math.pow(10, e)}`, sx(e) - 8, PY1 + 16)
      }
      for (const v of [1, 2, 5, 10, 20, 50, 100]) {
        ctx.beginPath(); ctx.moveTo(PX0, sy(v)); ctx.lineTo(PX1, sy(v)); ctx.stroke()
        ctx.fillStyle = TXT; ctx.fillText(`${v}×`, 30, sy(v) + 4)
      }
      ctx.fillStyle = TXT
      ctx.fillText('kernel speedup s (log)', PX1 - 150, PY1 + 32)
      ctx.fillText('total speedup S (log)', PX0 + 6, PY0 - 6)
      // faint curves for the measured p values
      TABLE.forEach((t) => {
        ctx.strokeStyle = 'rgba(148,163,184,0.45)'
        ctx.beginPath()
        for (let i = 0; i <= 120; i++) {
          const ls = (i / 120) * 3
          const v = 1 / (1 - t.p + t.p / Math.pow(10, ls))
          i ? ctx.lineTo(sx(ls), sy(v)) : ctx.moveTo(sx(ls), sy(v))
        }
        ctx.stroke()
        const vEnd = 1 / (1 - t.p + t.p / 1000)
        ctx.fillStyle = 'rgba(203,213,225,0.7)'
        ctx.fillText(`tol ${t.tol}`, PX1 - 60, sy(vEnd) - 4)
      })
      // ceiling
      ctx.strokeStyle = HOT
      ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(PX0, sy(ceil)); ctx.lineTo(PX1, sy(ceil)); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = HOT
      ctx.fillText(`ceiling 1/(1−p) = ${ceil.toFixed(1)}×`, PX0 + 8, sy(ceil) - 6)
      // current curve
      ctx.strokeStyle = ACC
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= 160; i++) {
        const ls = (i / 160) * 3
        const v = 1 / (1 - p + p / Math.pow(10, ls))
        i ? ctx.lineTo(sx(ls), sy(v)) : ctx.moveTo(sx(ls), sy(v))
      }
      ctx.stroke()
      ctx.lineWidth = 1
      ctx.fillStyle = OK
      ctx.beginPath(); ctx.arc(sx(logS), sy(S), 6, 0, 2 * Math.PI); ctx.fill()
      ctx.fillText(`S = ${S.toFixed(1)}×`, sx(logS) + 10, sy(S) + 18)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [p, logS, s, S, ceil, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>hotspot share p = {p.toFixed(3)}{' '}
          <input type="range" min={0.2} max={0.995} step={0.001} value={p} onChange={(e) => setP(+e.target.value)} />
        </label>
        <label>kernel speedup s = {s.toFixed(0)}×{' '}
          <input type="range" min={0} max={3} step={0.01} value={logS} onChange={(e) => setLogS(+e.target.value)} />
        </label>
        {TABLE.map((t) => (
          <button key={t.tol} style={btn(Math.abs(p - t.p) < 0.0005)} onClick={() => setP(t.p)}>p @ tol {t.tol}</button>
        ))}
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
        <div>S = 1 / ((1 − p) + p/s) = 1 / ({(1 - p).toFixed(3)} + {(p / s).toFixed(4)}) = <b style={{ color: OK }}>{S.toFixed(2)}×</b></div>
        <div style={{ color: S / ceil > 0.8 ? OK : HOT }}>reached {(100 * S / ceil).toFixed(0)}% of the ceiling {ceil.toFixed(1)}× — {S / ceil > 0.8 ? 'the Python part now dominates' : 'a faster kernel still pays'}</div>
      </div>
    </div>
  )
}
