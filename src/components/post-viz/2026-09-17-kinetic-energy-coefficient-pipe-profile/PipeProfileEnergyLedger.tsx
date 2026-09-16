'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Mode = 'laminar' | 'power' | 'defect'

const NR = 400 // radial samples used for the area integrals

/** u(r)/U_c on r/R = 0..1 for each profile family */
function shape(mode: Mode, n: number, ustar: number): number[] {
  const out: number[] = []
  for (let i = 0; i <= NR; i++) {
    const s = i / NR // r/R
    const y = Math.max(1 - s, 1e-6) // wall distance y/R
    if (mode === 'laminar') out.push(1 - s * s)
    else if (mode === 'power') out.push(Math.pow(y, 1 / n))
    else out.push(Math.max(1 + ustar * (3.75 - 2.5 * Math.log(1 / y)), 0))
  }
  return out
}

/** area averages: ∫ f · 2πr dr / A by trapezoid on r/R */
function areaAvg(f: number[]): number {
  let s = 0
  for (let i = 0; i < NR; i++) {
    const r0 = i / NR
    const r1 = (i + 1) / NR
    s += 0.5 * (f[i] * 2 * r0 + f[i + 1] * 2 * r1) * (r1 - r0)
  }
  return s
}

function ledger(u: number[]) {
  const vbar = areaAvg(u)
  const alpha = areaAvg(u.map((x) => x ** 3)) / vbar ** 3
  const beta = areaAvg(u.map((x) => x ** 2)) / vbar ** 2
  return { vbar, alpha, beta }
}

export function PipeProfileEnergyLedger() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mode, setMode] = useState<Mode>('laminar')
  const [n, setN] = useState(7)
  const [logRe, setLogRe] = useState(5)
  const [running, setRunning] = useState(true)

  const f = useMemo(() => (0.79 * Math.log(Math.pow(10, logRe)) - 1.64) ** -2, [logRe])
  const ustar = useMemo(() => Math.sqrt(f / 8), [f])
  const prof = useMemo(() => shape(mode, n, ustar), [mode, n, ustar])
  const stat = useMemo(() => ledger(prof), [prof])

  // refs so the animation loop always sees the current profile
  const profRef = useRef(prof)
  const statRef = useRef(stat)
  const runRef = useRef(running)
  profRef.current = prof
  statRef.current = stat
  runRef.current = running

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const PX0 = 48
    const PX1 = 296
    const YC = 118
    const HH = 80

    const dots = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      s: Math.random() * 2 - 1,
    }))

    let raf = 0
    let last = performance.now()

    const uAt = (absS: number) => {
      const p = profRef.current
      const i = Math.min(NR, Math.max(0, Math.round(absS * NR)))
      return p[i]
    }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { vbar, alpha, beta } = statRef.current

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, cv.width, cv.height)

      // ---- pipe walls -------------------------------------------------
      ctx.strokeStyle = '#8b949e'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(PX0 - 6, YC - HH)
      ctx.lineTo(PX1 + 10, YC - HH)
      ctx.moveTo(PX0 - 6, YC + HH)
      ctx.lineTo(PX1 + 10, YC + HH)
      ctx.stroke()
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.strokeStyle = '#30363d'
      ctx.beginPath()
      ctx.moveTo(PX0 - 6, YC)
      ctx.lineTo(PX1 + 10, YC)
      ctx.stroke()
      ctx.setLineDash([])

      // ---- profile envelope (scaled so V̄ maps to a fixed length) -------
      const LEN = 150 / Math.max(vbar, 0.3)
      ctx.beginPath()
      for (let i = NR; i >= 0; i--) {
        const s = i / NR
        const y = YC - s * HH
        const x = PX0 + uAt(s) * LEN
        i === NR ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      for (let i = 0; i <= NR; i++) {
        const s = i / NR
        ctx.lineTo(PX0 + uAt(s) * LEN, YC + s * HH)
      }
      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 2
      ctx.stroke()

      // mean-velocity reference line
      ctx.strokeStyle = '#f97316'
      ctx.setLineDash([5, 3])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(PX0 + vbar * LEN, YC - HH)
      ctx.lineTo(PX0 + vbar * LEN, YC + HH)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f97316'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('mean V', PX0 + vbar * LEN - 18, YC - HH - 7)

      // ---- tracers: each moves at its own local speed ------------------
      for (const d of dots) {
        const local = uAt(Math.abs(d.s)) / Math.max(vbar, 1e-6)
        if (runRef.current) {
          d.x += dt * 0.28 * local
          if (d.x > 1) {
            d.x -= 1
            d.s = Math.random() * 2 - 1
          }
        }
        const px = PX0 - 4 + d.x * (PX1 - PX0 + 12)
        const py = YC + d.s * HH
        const hot = local > 1
        ctx.fillStyle = hot ? '#7ee787' : '#4a8fd4'
        ctx.beginPath()
        ctx.arc(px, py, hot ? 2.2 : 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#7ee787'
      ctx.fillText('faster than mean', PX0, YC + HH + 18)
      ctx.fillStyle = '#4a8fd4'
      ctx.fillText('slower than mean', PX0 + 130, YC + HH + 18)

      // ---- energy ledger ----------------------------------------------
      const BX = 336
      const BW = 96
      const BBASE = 196
      const BMAX = 138
      const h1 = BMAX / 2.1
      const h2 = (BMAX / 2.1) * alpha

      ctx.fillStyle = '#c9d1d9'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText('kinetic energy flux per unit weight', BX, 30)

      ctx.fillStyle = '#484f58'
      ctx.fillRect(BX, BBASE - h1, BW, h1)
      ctx.fillStyle = '#d29922'
      ctx.fillRect(BX + BW + 22, BBASE - h2, BW, h2)
      ctx.strokeStyle = '#f85149'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(BX, BBASE - h1)
      ctx.lineTo(BX + 2 * BW + 22, BBASE - h1)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('V²/2g', BX + 26, BBASE + 16)
      ctx.fillText('(α = 1)', BX + 22, BBASE + 30)
      ctx.fillStyle = '#d29922'
      ctx.fillText('α V²/2g', BX + BW + 40, BBASE + 16)
      ctx.fillText('(true)', BX + BW + 48, BBASE + 30)
      ctx.fillStyle = '#f85149'
      ctx.fillText(`missing ${((alpha - 1) * 100).toFixed(1)}%`, BX + BW + 26, BBASE - h2 - 8)

      // ---- numeric strip ----------------------------------------------
      ctx.fillStyle = '#c9d1d9'
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillText(`α = ${alpha.toFixed(4)}`, 48, 248)
      ctx.fillText(`β = ${beta.toFixed(4)}`, 168, 248)
      ctx.fillText(`Uc/V = ${(uAt(0) / vbar).toFixed(3)}`, 288, 248)

      // α scale bar 1.0 .. 2.1
      const SX = 48
      const SW = 484
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(SX, 272)
      ctx.lineTo(SX + SW, 272)
      ctx.stroke()
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      for (const t of [1.0, 1.25, 1.5, 1.75, 2.0]) {
        const px = SX + ((t - 1) / 1.1) * SW
        ctx.fillRect(px, 268, 1, 8)
        ctx.fillText(t.toFixed(2), px - 10, 288)
      }
      const ax = SX + ((alpha - 1) / 1.1) * SW
      const bx = SX + ((beta - 1) / 1.1) * SW
      ctx.fillStyle = '#d29922'
      ctx.beginPath()
      ctx.arc(ax, 272, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7ee787'
      ctx.beginPath()
      ctx.arc(bx, 272, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d29922'
      ctx.fillText('α', ax - 3, 262)
      ctx.fillStyle = '#7ee787'
      ctx.fillText('β', bx - 3, 262)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean) => ({
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: active ? '#238636' : '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: 12,
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={580}
        height={300}
        style={{ width: '100%', borderRadius: 8, background: '#0d1117', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.9rem',
          alignItems: 'center',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => setMode('laminar')} style={btn(mode === 'laminar')}>
            laminar
          </button>
          <button onClick={() => setMode('power')} style={btn(mode === 'power')}>
            power law
          </button>
          <button onClick={() => setMode('defect')} style={btn(mode === 'defect')}>
            defect law
          </button>
        </div>
        {mode === 'power' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190 }}>
            <span>
              exponent 1/n : n = <b style={{ color: '#58a6ff' }}>{n}</b>
            </span>
            <input
              type="range"
              min={3}
              max={12}
              step={1}
              value={n}
              onChange={(e) => setN(parseInt(e.target.value, 10))}
            />
          </label>
        )}
        {mode === 'defect' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 210 }}>
            <span>
              Re = <b style={{ color: '#58a6ff' }}>{Math.pow(10, logRe).toExponential(1)}</b> (f ={' '}
              {f.toFixed(4)})
            </span>
            <input
              type="range"
              min={3.5}
              max={7.5}
              step={0.1}
              value={logRe}
              onChange={(e) => setLogRe(parseFloat(e.target.value))}
            />
          </label>
        )}
        <button onClick={() => setRunning((v) => !v)} style={btn(false)}>
          {running ? 'pause tracers' : 'run tracers'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        Tracers move at the local velocity, so the parabola stretches far more than the blunt
        turbulent profile. The yellow bar is the kinetic energy the flow actually carries; the grey
        bar is what V²/2g alone would claim.
      </p>
    </div>
  )
}
