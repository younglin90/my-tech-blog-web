'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// Browser port of the post's jacobi_sweeps() + roofline_time().
// -lap(u) = 1 on the unit square, u = 0 on walls, Jacobi until max|du| < 1e-6.
// The Jacobi solve really runs here; each sweep charges a modeled time to two clocks:
//   t_sweep = cells * max(FLOPS/peak, bytes/BW) (+ cells * pcie/PCIE on the GPU).
// Default N=64, cached kernel: 3720 sweeps, CPU 8.580 ms, GPU 1.907 ms, 4.50x.
const W = 760
const H = 400
const BG = '#0f172a'
const TXT = '#cbd5e1'
const GRID = 'rgba(148,163,184,0.2)'
const C_CPU = '#38bdf8'
const C_GPU = '#f97316'
const TOL = 1e-6
const FLOPS = 6
const PEAK_CPU = 300e9
const PEAK_GPU = 4500e9
const PCIE = 12e9

const KERNELS = [
  { name: 'naive', bytes: 48 },
  { name: 'cached', bytes: 24 },
  { name: 'block k=4', bytes: 6 },
  { name: 'block k=32', bytes: 0.75 },
  { name: 'block k=128', bytes: 0.1875 },
]

type Sim = { n: number; u: Float64Array; nw: Float64Array; sweeps: number; du: number; done: boolean; hist: number[]; tc: number; tg: number }

function makeSim(n: number): Sim {
  return { n, u: new Float64Array(n * n), nw: new Float64Array(n * n), sweeps: 0, du: 1, done: false, hist: [], tc: 0, tg: 0 }
}

function sweep(S: Sim) {
  const { n, u, nw } = S
  const h2 = 1 / ((n - 1) * (n - 1))
  let du = 0
  for (let i = 1; i < n - 1; i++) {
    for (let j = 1; j < n - 1; j++) {
      const k = i * n + j
      const v = 0.25 * (u[k - n] + u[k + n] + u[k - 1] + u[k + 1] + h2)
      const d = Math.abs(v - u[k])
      if (d > du) du = d
      nw[k] = v
    }
  }
  for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) u[i * n + j] = nw[i * n + j]
  S.sweeps++
  S.du = du
  if (S.sweeps % 4 === 0 || du < TOL) S.hist.push(du)
  if (du < TOL) S.done = true
}

function color(t: number) {
  // dark blue -> teal -> yellow
  const r = Math.round(20 + 235 * Math.max(0, t * 1.4 - 0.4))
  const g = Math.round(30 + 200 * Math.min(1, t * 1.3))
  const b = Math.round(90 + 120 * (1 - t))
  return `rgb(${r},${g},${b})`
}

export function JacobiRooflineClockRace() {
  const cvs = useRef<HTMLCanvasElement>(null)
  const [n, setN] = useState(64)
  const [kern, setKern] = useState(1)
  const [pcie, setPcie] = useState(false)
  const [bwCpu, setBwCpu] = useState(40)
  const [bwGpu, setBwGpu] = useState(180)
  const [speed, setSpeed] = useState(20)
  const [playing, setPlaying] = useState(false)
  const [ro, setRo] = useState({ sweeps: 0, du: 1, tc: 0, tg: 0, done: false })
  const sim = useRef<Sim>(makeSim(64))
  const cfg = useRef({ kern, pcie, bwCpu, bwGpu, speed, playing, step: 0 })
  cfg.current = { ...cfg.current, kern, pcie, bwCpu, bwGpu, speed, playing }

  const reset = (nn = n) => { sim.current = makeSim(nn); setRo({ sweeps: 0, du: 1, tc: 0, tg: 0, done: false }) }

  useEffect(() => {
    const c = cvs.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const charge = (S: Sim) => {
      const C = cfg.current
      const cells = (S.n - 2) * (S.n - 2)
      const b = KERNELS[C.kern].bytes
      S.tc += cells * Math.max(FLOPS / PEAK_CPU, b / (C.bwCpu * 1e9))
      S.tg += cells * Math.max(FLOPS / PEAK_GPU, b / (C.bwGpu * 1e9)) + (C.pcie ? cells * 16 / PCIE : 0)
    }

    const draw = () => {
      const S = sim.current
      const C = cfg.current
      let todo = C.playing ? C.speed : 0
      if (C.step > 0) { todo += C.step; C.step = 0 }
      for (let s = 0; s < todo && !S.done; s++) { sweep(S); charge(S) }

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      ctx.font = '11px monospace'

      // field
      const fx = 20, fy = 30, fs = 230
      const cell = fs / S.n
      for (let i = 0; i < S.n; i++) for (let j = 0; j < S.n; j++) {
        ctx.fillStyle = color(Math.min(1, S.u[i * S.n + j] / 0.0737))
        ctx.fillRect(fx + j * cell, fy + (S.n - 1 - i) * cell, cell + 0.6, cell + 0.6)
      }
      ctx.fillStyle = TXT
      ctx.fillText(`u(x,y), N=${S.n}  (colour max 0.0737)`, fx, fy - 10)

      // residual history
      const hx = 290, hy = 30, hw = 450, hh = 150
      ctx.strokeStyle = GRID
      for (let e = 0; e >= -7; e--) {
        const yy = hy + (-e / 7) * hh
        ctx.beginPath(); ctx.moveTo(hx, yy); ctx.lineTo(hx + hw, yy); ctx.stroke()
        if (e % 2 === 0 || e === -7) { ctx.fillStyle = TXT; ctx.fillText(`1e${e}`, hx - 34, yy + 4) }
      }
      const yT = hy + (6 / 7) * hh
      ctx.strokeStyle = '#4ade80'; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(hx, yT); ctx.lineTo(hx + hw, yT); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = '#4ade80'; ctx.fillText('tol 1e-6', hx + hw - 60, yT - 4)
      const est = Math.max(400, Math.round(3720 * Math.pow((S.n - 1) / 63, 1.6)))
      const xmax = Math.max(est, S.sweeps)
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5
      ctx.beginPath()
      S.hist.forEach((d, k) => {
        const it = Math.min(S.sweeps, (k + 1) * 4)
        const xx = hx + (it / xmax) * hw
        const yy = hy + Math.min(1, -Math.log10(Math.max(d, 1e-7)) / 7) * hh
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy)
      })
      ctx.stroke(); ctx.lineWidth = 1
      ctx.fillStyle = TXT
      ctx.fillText(`max|du| vs sweep (0..${xmax})`, hx, hy - 10)

      // modeled clocks
      const bx = 290, by = 220, bw = 450
      const tmax = Math.max(S.tc, S.tg, 1e-9)
      const bars: [string, number, string][] = [['CPU', S.tc, C_CPU], ['GPU', S.tg, C_GPU]]
      bars.forEach(([lab, t, col], i) => {
        const yy = by + i * 46
        ctx.fillStyle = '#1e293b'; ctx.fillRect(bx, yy, bw, 26)
        ctx.fillStyle = col; ctx.fillRect(bx, yy, (t / tmax) * bw, 26)
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px monospace'
        ctx.fillText(`${lab} ${(t * 1e3).toFixed(3)} ms`, bx + 6, yy + 17)
        ctx.font = '11px monospace'
      })
      const k = KERNELS[C.kern]
      const ai = FLOPS / k.bytes
      const gBound = C.pcie ? 'PCIe' : ai < PEAK_GPU / (C.bwGpu * 1e9) ? 'memory' : 'compute'
      const cBound = ai < PEAK_CPU / (C.bwCpu * 1e9) ? 'memory' : 'compute'
      ctx.fillStyle = TXT
      ctx.fillText(`modeled time  kernel=${k.name}  AI=${ai.toFixed(3)} FLOP/B  CPU:${cBound}-bound  GPU:${gBound}-bound`, bx, by - 10)
      ctx.fillText(`cells=${(S.n - 2) ** 2}  bytes/cell=${k.bytes}  ${C.pcie ? '+16 B/cell over PCIe 12 GB/s each sweep' : 'field stays on device'}`, bx, by + 110)
      ctx.fillStyle = S.done ? '#4ade80' : '#facc15'
      ctx.font = 'bold 13px monospace'
      ctx.fillText(S.done ? `CONVERGED at sweep ${S.sweeps}` : `sweep ${S.sweeps}  running`, fx, fy + fs + 26)
      ctx.fillStyle = TXT
      ctx.fillText(`speedup GPU/CPU = ${S.tg > 0 ? (S.tc / S.tg).toFixed(2) : '-'}x`, fx, fy + fs + 48)
      ctx.font = '11px monospace'

      if (++frame % 12 === 0 || S.done) setRo(r => (r.sweeps === S.sweeps && r.done === S.done ? r : { sweeps: S.sweeps, du: S.du, tc: S.tc, tg: S.tg, done: S.done }))
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ background: BG, color: TXT, padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 13 }}>
      <canvas ref={cvs} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button style={btn} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => { cfg.current.step += 1 }}>Step</button>
        <button style={btn} onClick={() => { setPlaying(false); reset() }}>Reset</button>
        <span>kernel:</span>
        {KERNELS.map((k, i) => (
          <button key={k.name} style={{ ...btn, borderColor: i === kern ? '#4ade80' : '#475569', color: i === kern ? '#4ade80' : '#e2e8f0' }}
            onClick={() => { setKern(i); setPlaying(false); reset() }}>{k.name}</button>
        ))}
        <label><input type="checkbox" checked={pcie} onChange={e => { setPcie(e.target.checked); setPlaying(false); reset() }} /> copy field over PCIe each sweep</label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginTop: 6 }}>
        <label>grid N = {n}
          <input type="range" min={16} max={64} step={4} value={n} onChange={e => { const v = +e.target.value; setN(v); setPlaying(false); reset(v) }} style={{ width: '100%' }} />
        </label>
        <label style={{ color: C_CPU }}>CPU BW {bwCpu} GB/s
          <input type="range" min={10} max={200} step={5} value={bwCpu} onChange={e => { setBwCpu(+e.target.value); setPlaying(false); reset() }} style={{ width: '100%' }} />
        </label>
        <label style={{ color: C_GPU }}>GPU BW {bwGpu} GB/s
          <input type="range" min={40} max={1000} step={10} value={bwGpu} onChange={e => { setBwGpu(+e.target.value); setPlaying(false); reset() }} style={{ width: '100%' }} />
        </label>
        <label>sweeps/frame {speed}
          <input type="range" min={1} max={100} step={1} value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginTop: 6 }}>
        sweeps {ro.sweeps} · max|du| {ro.du.toExponential(2)} · CPU {(ro.tc * 1e3).toFixed(3)} ms · GPU {(ro.tg * 1e3).toFixed(3)} ms ·{' '}
        <b style={{ color: '#4ade80' }}>{ro.tg > 0 ? (ro.tc / ro.tg).toFixed(2) : '-'}x</b>{ro.done ? ' (converged)' : ''}
      </div>
    </div>
  )
}

const btn: CSSProperties = { background: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
