'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// Concept viz: roofline model. Attainable FLOP/s = min(peak, AI * bandwidth).
// Left: log-log roofline for CPU (40 GB/s, 300 GFLOP/s) and GPU (180 GB/s, 4500 GFLOP/s).
// Right: data "pipe" from DRAM to ALUs. Byte packets flow at the device bandwidth;
// each packet feeds AI*8 FLOPs. If the pipe is too thin, ALUs sit idle (grey).
const W = 760
const H = 420
const BG = '#0f172a'
const TXT = '#cbd5e1'
const GRID = 'rgba(148,163,184,0.2)'
const C_CPU = '#38bdf8'
const C_GPU = '#f97316'
const IDLE = '#334155'

const AI_MIN = 1 / 16
const AI_MAX = 128
const P_MIN = 1
const P_MAX = 10000

type Dev = { name: string; bw: number; peak: number; col: string }

function attain(d: Dev, ai: number) {
  return Math.min(d.peak, ai * d.bw)
}

export function RooflineBandwidthPipeLab() {
  const cvs = useRef<HTMLCanvasElement>(null)
  const [logAI, setLogAI] = useState(Math.log2(0.25))
  const [bwCpu, setBwCpu] = useState(40)
  const [bwGpu, setBwGpu] = useState(180)
  const [playing, setPlaying] = useState(true)
  const [readout, setReadout] = useState({ c: 0, g: 0 })
  const st = useRef({ logAI, bwCpu, bwGpu, playing, t: 0 })
  st.current.logAI = logAI
  st.current.bwCpu = bwCpu
  st.current.bwGpu = bwGpu
  st.current.playing = playing

  useEffect(() => {
    const c = cvs.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    // packets: phase in [0,1) along the pipe for each device
    const packets: number[][] = [[], []]
    const spawnAcc = [0, 0]
    const work = [0, 0] // ALU busy fraction (smoothed)

    const draw = () => {
      const S = st.current
      const ai = Math.pow(2, S.logAI)
      const devs: Dev[] = [
        { name: 'CPU', bw: S.bwCpu, peak: 300, col: C_CPU },
        { name: 'GPU', bw: S.bwGpu, peak: 4500, col: C_GPU },
      ]
      if (S.playing) S.t += 1 / 60
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      // ---- roofline plot ----
      const px0 = 60, py0 = 30, pw = 330, ph = 330
      const X = (a: number) => px0 + (Math.log(a / AI_MIN) / Math.log(AI_MAX / AI_MIN)) * pw
      const Y = (p: number) => py0 + ph - (Math.log(p / P_MIN) / Math.log(P_MAX / P_MIN)) * ph
      ctx.strokeStyle = GRID
      ctx.lineWidth = 1
      ctx.font = '11px monospace'
      ctx.fillStyle = TXT
      for (let e = -4; e <= 7; e++) {
        const a = Math.pow(2, e)
        ctx.beginPath(); ctx.moveTo(X(a), py0); ctx.lineTo(X(a), py0 + ph); ctx.stroke()
        if (e % 2 === 0) ctx.fillText(a >= 1 ? String(a) : `1/${1 / a}`, X(a) - 8, py0 + ph + 14)
      }
      for (let e = 0; e <= 4; e++) {
        const p = Math.pow(10, e)
        ctx.beginPath(); ctx.moveTo(px0, Y(p)); ctx.lineTo(px0 + pw, Y(p)); ctx.stroke()
        ctx.fillText(String(p), px0 - 42, Y(p) + 4)
      }
      ctx.fillText('arithmetic intensity AI [FLOP/byte]', px0 + 50, py0 + ph + 30)
      ctx.save(); ctx.translate(14, py0 + ph / 2 + 50); ctx.rotate(-Math.PI / 2)
      ctx.fillText('attainable GFLOP/s', 0, 0); ctx.restore()

      for (const d of devs) {
        ctx.strokeStyle = d.col
        ctx.lineWidth = 2.5
        ctx.beginPath()
        for (let k = 0; k <= 200; k++) {
          const a = AI_MIN * Math.pow(AI_MAX / AI_MIN, k / 200)
          const yy = Y(Math.max(P_MIN, attain(d, a)))
          if (k === 0) ctx.moveTo(X(a), yy); else ctx.lineTo(X(a), yy)
        }
        ctx.stroke()
        const ridge = d.peak / d.bw
        ctx.setLineDash([3, 4]); ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(X(ridge), Y(d.peak)); ctx.lineTo(X(ridge), py0 + ph); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = d.col
        ctx.fillText(`${d.name} ridge ${ridge.toFixed(1)}`, Math.min(X(ridge) + 4, px0 + pw - 110), Y(d.peak) - 6)
      }
      // current AI marker
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(X(ai), py0); ctx.lineTo(X(ai), py0 + ph); ctx.stroke()
      for (const d of devs) {
        ctx.fillStyle = d.col
        ctx.beginPath(); ctx.arc(X(ai), Y(attain(d, ai)), 6, 0, 2 * Math.PI); ctx.fill()
      }
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('Jacobi 0.25', X(0.25) + 3, py0 + 12)

      // ---- pipe view ----
      const qx = 430, qw = 300
      devs.forEach((d, i) => {
        const y0 = 50 + i * 175
        const perf = attain(d, ai)
        const busy = perf / d.peak
        work[i] += (busy - work[i]) * 0.08
        ctx.fillStyle = d.col
        ctx.font = 'bold 13px monospace'
        ctx.fillText(`${d.name}  ${d.bw} GB/s  peak ${d.peak} GFLOP/s`, qx, y0 - 14)
        ctx.font = '11px monospace'
        // DRAM block
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(qx, y0, 56, 90)
        ctx.fillStyle = TXT
        ctx.fillText('DRAM', qx + 12, y0 + 50)
        // pipe: thickness ~ bandwidth
        const thick = 6 + (d.bw / 400) * 60
        const pyc = y0 + 45
        const pX0 = qx + 56, pX1 = qx + 170
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(pX0, pyc - thick / 2, pX1 - pX0, thick)
        // packets: spawn rate ~ bw, speed constant
        if (S.playing) {
          spawnAcc[i] += d.bw / 400
          while (spawnAcc[i] >= 1) { spawnAcc[i] -= 1; packets[i].push(0) }
          packets[i] = packets[i].map(p => p + 0.02).filter(p => p < 1)
        }
        ctx.fillStyle = d.col
        packets[i].forEach((p, k) => {
          const off = ((k * 37) % 11) / 11 - 0.5
          ctx.fillRect(pX0 + p * (pX1 - pX0) - 2, pyc + off * (thick - 6) - 2, 4, 4)
        })
        // ALU grid: 4x6 cells, number lit = busy fraction
        const nA = 24
        const lit = Math.round(work[i] * nA)
        for (let k = 0; k < nA; k++) {
          const cx = pX1 + 12 + (k % 6) * 20
          const cy = y0 + 6 + Math.floor(k / 6) * 20
          const flick = S.playing && k < lit ? 0.75 + 0.25 * Math.sin(S.t * 20 + k) : 1
          ctx.globalAlpha = k < lit ? flick : 1
          ctx.fillStyle = k < lit ? d.col : IDLE
          ctx.fillRect(cx, cy, 16, 16)
          ctx.globalAlpha = 1
        }
        ctx.fillStyle = TXT
        ctx.fillText(`ALUs busy ${(busy * 100).toFixed(busy < 0.1 ? 1 : 0)}%`, pX1 + 12, y0 + 102)
        ctx.fillText(`${perf.toFixed(perf < 100 ? 1 : 0)} GFLOP/s  ${ai * d.bw < d.peak ? 'MEMORY-bound' : 'COMPUTE-bound'}`, qx, y0 + 122)
      })

      if (++frame % 12 === 0) setReadout({ c: attain(devs[0], ai), g: attain(devs[1], ai) })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const ai = Math.pow(2, logAI)
  const sp = readout.c > 0 ? readout.g / readout.c : 0
  return (
    <div style={{ background: BG, color: TXT, padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 13 }}>
      <canvas ref={cvs} width={W} height={H} style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, marginTop: 8 }}>
        <label>AI = {ai >= 1 ? ai.toFixed(ai < 10 ? 2 : 0) : ai.toFixed(3)} FLOP/B
          <input type="range" min={-4} max={7} step={0.05} value={logAI} onChange={e => setLogAI(+e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ color: C_CPU }}>CPU bandwidth {bwCpu} GB/s
          <input type="range" min={10} max={400} step={5} value={bwCpu} onChange={e => setBwCpu(+e.target.value)} style={{ width: '100%' }} />
        </label>
        <label style={{ color: C_GPU }}>GPU bandwidth {bwGpu} GB/s
          <input type="range" min={20} max={400} step={5} value={bwGpu} onChange={e => setBwGpu(+e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <button onClick={() => setPlaying(p => !p)} style={btn}>{playing ? 'Pause' : 'Play'}</button>
        <button onClick={() => setLogAI(Math.log2(0.25))} style={btn}>Jacobi (0.25)</button>
        <button onClick={() => setLogAI(Math.log2(32))} style={btn}>Dense kernel (32)</button>
        <button onClick={() => { setBwCpu(40); setBwGpu(180); setLogAI(Math.log2(0.25)) }} style={btn}>Reset</button>
        <span>GPU/CPU speedup = <b style={{ color: '#4ade80' }}>{sp.toFixed(2)}x</b> (bandwidth ratio {(bwGpu / bwCpu).toFixed(2)}, peak ratio 15.00)</span>
      </div>
    </div>
  )
}

const btn: CSSProperties = { background: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
