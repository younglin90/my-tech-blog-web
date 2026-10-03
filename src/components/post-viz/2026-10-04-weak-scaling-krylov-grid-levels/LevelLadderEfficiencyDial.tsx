'use client'

import { useEffect, useRef, useState } from 'react'

// measured with the Python driver in this post (PCG, rtol 1e-8, 2048 cells/process)
const PROCS = [1, 4, 16, 64]
const GRIDS = ['64×32', '128×64', '256×128', '512×256']
const DATA: { id: string; label: string; colour: string; iters: number[] }[] = [
  { id: 'jacobi', label: 'point Jacobi (1 level)', colour: '#f87171', iters: [210, 407, 754, 1285] },
  { id: 'mg3', label: 'multigrid, 3 levels fixed', colour: '#fbbf24', iters: [10, 16, 28, 47] },
  { id: 'mgg', label: 'multigrid, levels grown', colour: '#34d399', iters: [9, 9, 10, 10] },
]

function matchedId(levels: number, k: number) {
  if (levels === 1) return 'jacobi'
  if (levels === k + 3) return 'mgg'
  if (levels === 3) return 'mg3'
  return ''
}

export function LevelLadderEfficiencyDial() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [levels, setLevels] = useState(3)
  const [k, setK] = useState(2)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ coarse: '64×32', eff: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ny = 32 * Math.pow(2, k)
    const nx = 2 * ny
    const maxLev = Math.max(1, Math.min(levels, Math.floor(Math.log2(ny / 4)) + 1))
    const id = matchedId(maxLev, k)
    let t = 0
    let frame = 0
    let raf = 0

    const draw = () => {
      if (running) t += 0.016
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'

      // ---- left: grid hierarchy ladder + V-cycle walker ----------------
      const lx = 40
      const ly = 36
      const rowH = Math.min(30, 170 / maxLev)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('grid hierarchy  (one V-cycle)', lx, ly - 12)
      // V-cycle position: down 0->maxLev-1 then back up
      const span = 2 * (maxLev - 1) || 1
      const phase = (t * 1.6) % (span + 0.8)
      const walker = phase <= maxLev - 1 ? phase : Math.max(0, span - phase)
      for (let l = 0; l < maxLev; l++) {
        const cnx = Math.round(nx / Math.pow(2, l))
        const cny = Math.round(ny / Math.pow(2, l))
        const w = 150 * Math.pow(0.82, l)
        const y = ly + l * rowH
        const hot = Math.abs(walker - l) < 0.5
        ctx.strokeStyle = hot ? '#34d399' : '#475569'
        ctx.fillStyle = hot ? 'rgba(52,211,153,0.18)' : 'rgba(148,163,184,0.06)'
        ctx.fillRect(lx, y, w, rowH - 6)
        ctx.strokeRect(lx, y, w, rowH - 6)
        ctx.fillStyle = hot ? '#34d399' : '#94a3b8'
        ctx.fillText(`L${l}  ${cnx}×${cny}`, lx + 6, y + rowH / 2 + 1)
        // wavelength band this level smooths, on a log axis
        const bx = lx + 170
        const bw = 120
        const fHi = Math.log2(nx) - l // longest wavelength this level sees, in log2 cells
        const x0 = bx + (bw * Math.max(0, fHi - 3)) / Math.log2(nx)
        ctx.fillStyle = hot ? '#34d399' : '#64748b'
        ctx.fillRect(bx, y + 4, Math.max(4, x0 - bx), rowH - 14)
      }
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('wavelengths damped →', lx + 170, ly - 12)
      const deepest = Math.round(nx / Math.pow(2, maxLev - 1))
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(
        `coarsest grid ${deepest}×${Math.round(ny / Math.pow(2, maxLev - 1))} cells — the longest error wave is ${
          deepest <= 16 ? 'resolved there' : `still ${deepest} cells wide`
        }`,
        lx,
        ly + maxLev * rowH + 16,
      )

      // ---- right: measured weak-scaling efficiency ---------------------
      const gx = 420
      const gy = 46
      const gw = 240
      const gh = 170
      ctx.strokeStyle = '#334155'
      ctx.strokeRect(gx, gy, gw, gh)
      const X = (i: number) => gx + (gw * i) / 3
      const Y = (e: number) => gy + gh * (1 - e)
      ctx.strokeStyle = '#475569'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(gx, Y(1))
      ctx.lineTo(gx + gw, Y(1))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#64748b'
      ctx.fillText('ideal E = 1', gx + 4, Y(1) + 12)
      for (let e = 0; e <= 1.0001; e += 0.25) ctx.fillText(e.toFixed(2), gx - 30, Y(e) + 4)
      PROCS.forEach((p, i) => ctx.fillText(`${p}`, X(i) - 4, gy + gh + 14))
      ctx.fillText('processes  (2048 cells each)', gx + 60, gy + gh + 28)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('weak-scaling efficiency E', gx, gy - 24)

      DATA.forEach((d, di) => {
        const on = d.id === id
        ctx.strokeStyle = on ? d.colour : 'rgba(100,116,139,0.55)'
        ctx.lineWidth = on ? 2.2 : 1
        ctx.beginPath()
        d.iters.forEach((it, i) => {
          const e = d.iters[0] / it
          i === 0 ? ctx.moveTo(X(i), Y(e)) : ctx.lineTo(X(i), Y(e))
        })
        ctx.stroke()
        ctx.lineWidth = 1
        d.iters.forEach((it, i) => {
          const e = d.iters[0] / it
          ctx.fillStyle = on ? d.colour : '#64748b'
          ctx.beginPath()
          ctx.arc(X(i), Y(e), i === k && on ? 5 : 2.5, 0, 7)
          ctx.fill()
        })
        ctx.fillStyle = on ? d.colour : '#64748b'
        ctx.fillText(d.label, gx, gy + gh + 44 + di * 14)
        ctx.fillText(`${d.iters[k]} it`, gx + gw - 46, gy + gh + 44 + di * 14)
      })

      const cur = DATA.find((d) => d.id === id)
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(
        cur
          ? `${maxLev} levels → ${cur.label}:  E = ${(cur.iters[0] / cur.iters[k]).toFixed(3)} at ${PROCS[k]} processes`
          : `${maxLev} levels — between the measured cases (${GRIDS[k]} grid)`,
        lx,
        gy + gh + 72,
      )

      frame++
      if (frame % 12 === 0)
        setReadout({
          coarse: `${deepest}×${Math.round(ny / Math.pow(2, maxLev - 1))}`,
          eff: cur ? cur.iters[0] / cur.iters[k] : 0,
        })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [levels, k, running])

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <canvas
        ref={canvasRef}
        width={700}
        height={340}
        style={{ width: '100%', maxWidth: 700, borderRadius: 8, background: '#0b1220' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 8, fontSize: 12 }}>
        <label>
          multigrid levels = {levels}
          <input type="range" min={1} max={6} step={1} value={levels} onChange={(e) => setLevels(+e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          grid = {GRIDS[k]} on {PROCS[k]} processes
          <input type="range" min={0} max={3} step={1} value={k} onChange={(e) => setK(+e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={() => setRunning((v) => !v)}
          style={{ padding: '4px 9px', fontSize: 12, borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          {running ? 'pause V-cycle' : 'play V-cycle'}
        </button>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          coarsest grid {readout.coarse}{readout.eff > 0 ? `, E = ${readout.eff.toFixed(3)}` : ''}
        </span>
      </div>
    </div>
  )
}
