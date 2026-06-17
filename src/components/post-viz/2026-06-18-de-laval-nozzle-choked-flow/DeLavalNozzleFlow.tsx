'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// De Laval (converging-diverging) nozzle solver.
// Drop the back-pressure ratio pb/p0 and watch the internal flow switch between
// venturi (subsonic), choked-with-internal-shock, overexpanded, design, and
// underexpanded regimes. Everything is 1-D isentropic flow plus a normal-shock
// jump, computed from the area-Mach relation.

const N = 121
const THROAT = 60 // index of the minimum area
const AR_IN = 2.5 // inlet area / throat area
const AR_OUT = 4.0 // exit area / throat area

// area ratio A/A* as a function of Mach number (isentropic)
function arFromM(M: number, g: number): number {
  const t = 1 + ((g - 1) / 2) * M * M
  return (1 / M) * Math.pow((2 / (g + 1)) * t, (g + 1) / (2 * (g - 1)))
}

// isentropic static/stagnation pressure ratio p/p0
function press(M: number, g: number): number {
  return Math.pow(1 + ((g - 1) / 2) * M * M, -g / (g - 1))
}

// subsonic Mach root of A/A* = AR
function machSub(AR: number, g: number): number {
  if (AR <= 1) return 1
  let lo = 1e-4
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    if (arFromM(mid, g) > AR) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

// supersonic Mach root of A/A* = AR
function machSup(AR: number, g: number): number {
  if (AR <= 1) return 1
  let lo = 1
  let hi = 8
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    if (arFromM(mid, g) < AR) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

// post-shock subsonic Mach from upstream supersonic Mach M1
function machBehindShock(M1: number, g: number): number {
  return Math.sqrt((1 + ((g - 1) / 2) * M1 * M1) / (g * M1 * M1 - (g - 1) / 2))
}

// stagnation pressure ratio p02/p01 across a normal shock
function totalPressureRatio(M1: number, g: number): number {
  const a = Math.pow(((g + 1) * M1 * M1) / ((g - 1) * M1 * M1 + 2), g / (g - 1))
  const b = Math.pow((g + 1) / (2 * g * M1 * M1 - (g - 1)), 1 / (g - 1))
  return a * b
}

interface Solution {
  area: number[]
  mach: number[]
  pratio: number[]
  shockX: number | null
  regime: string
}

function solveNozzle(pr: number, g: number): Solution {
  const area: number[] = []
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1)
    if (i <= THROAT) {
      const s = (THROAT - i) / THROAT
      area.push(1 + (AR_IN - 1) * s * s)
    } else {
      const s = (i - THROAT) / (N - 1 - THROAT)
      area.push(1 + (AR_OUT - 1) * s * s)
    }
  }

  const meSup = machSup(AR_OUT, g)
  const pDesign = press(meSup, g)
  const meSub = machSub(AR_OUT, g)
  const prSubCrit = press(meSub, g) // throat just chokes, exit subsonic
  const prShockExit = press(meSup, g) * (1 + ((2 * g) / (g + 1)) * (meSup * meSup - 1))

  const mach = new Array(N).fill(0)
  const pratio = new Array(N).fill(0)
  let shockX: number | null = null
  let regime = ''

  if (pr >= prSubCrit) {
    // venturi: subsonic everywhere, not choked
    const meVent = Math.sqrt((Math.pow(pr, -(g - 1) / g) - 1) * (2 / (g - 1)))
    const aStar = AR_OUT / arFromM(meVent, g) // virtual sonic area in throat units
    for (let i = 0; i < N; i++) {
      mach[i] = machSub(area[i] / aStar, g)
      pratio[i] = press(mach[i], g)
    }
    regime = 'subsonic venturi (not choked)'
  } else {
    // choked: throat at M=1
    for (let i = 0; i <= THROAT; i++) {
      mach[i] = machSub(area[i], g)
      pratio[i] = press(mach[i], g)
    }
    if (pr <= prShockExit) {
      // fully supersonic inside; shock/expansion happens outside
      for (let i = THROAT; i < N; i++) {
        mach[i] = machSup(area[i], g)
        pratio[i] = press(mach[i], g)
      }
      if (pr > pDesign * 1.02) regime = 'overexpanded (oblique shocks outside)'
      else if (pr < pDesign * 0.98) regime = 'underexpanded (expansion fans outside)'
      else regime = 'design condition (perfect expansion)'
    } else {
      // normal shock stands inside the diverging section
      let best = THROAT + 2
      let bestErr = Infinity
      let bestStar2 = 1
      let bestP02 = 1
      for (let s = THROAT + 2; s < N - 1; s++) {
        const m1 = machSup(area[s], g)
        const m2 = machBehindShock(m1, g)
        const p02 = totalPressureRatio(m1, g)
        const star2 = area[s] / arFromM(m2, g)
        const meExit = machSub(AR_OUT / star2, g)
        const pe = p02 * press(meExit, g)
        const err = Math.abs(pe - pr)
        if (err < bestErr) {
          bestErr = err
          best = s
          bestStar2 = star2
          bestP02 = p02
        }
      }
      for (let i = THROAT; i < best; i++) {
        mach[i] = machSup(area[i], g)
        pratio[i] = press(mach[i], g)
      }
      for (let i = best; i < N; i++) {
        mach[i] = machSub(area[i] / bestStar2, g)
        pratio[i] = bestP02 * press(mach[i], g)
      }
      shockX = best / (N - 1)
      regime = 'choked with normal shock inside nozzle'
    }
  }

  return { area, mach, pratio, shockX, regime }
}

function machColor(M: number): string {
  // blue (slow) -> cyan -> yellow -> red (fast)
  const t = Math.min(1, M / 3)
  if (t < 0.33) {
    const u = t / 0.33
    return `rgb(${Math.round(40 + 0 * u)}, ${Math.round(90 + 121 * u)}, ${Math.round(160 + 78 * u)})`
  } else if (t < 0.66) {
    const u = (t - 0.33) / 0.33
    return `rgb(${Math.round(40 + 211 * u)}, ${Math.round(211 + 0 * u)}, ${Math.round(238 - 198 * u)})`
  }
  const u = (t - 0.66) / 0.34
  return `rgb(${Math.round(251)}, ${Math.round(211 - 140 * u)}, ${Math.round(40 - 40 * u)})`
}

export function DeLavalNozzleFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [prPct, setPrPct] = useState(85) // pb/p0 in percent
  const [gammaX100, setGammaX100] = useState(140) // gamma * 100
  const phaseRef = useRef(0)
  const rafRef = useRef<number>(0)

  const sol = useMemo(() => solveNozzle(prPct / 100, gammaX100 / 100), [prPct, gammaX100])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const nozTop = 16
    const nozH = 190
    const nozMid = nozTop + nozH / 2
    const plotTop = nozTop + nozH + 34
    const plotH = H - plotTop - 26
    const plotBot = plotTop + plotH
    const left = 46
    const plotW = W - left - 12

    const maxR = Math.sqrt(AR_OUT)
    const xpix = (i: number) => left + (i / (N - 1)) * plotW

    const draw = () => {
      phaseRef.current += 0.012

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // ---- nozzle body, colored by local Mach ----
      for (let i = 0; i < N - 1; i++) {
        const r0 = (Math.sqrt(sol.area[i]) / maxR) * (nozH / 2 - 4)
        const x0 = xpix(i)
        const x1 = xpix(i + 1)
        ctx.fillStyle = machColor(sol.mach[i])
        ctx.fillRect(x0, nozMid - r0, x1 - x0 + 1, 2 * r0)
      }
      // nozzle outline
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const r = (Math.sqrt(sol.area[i]) / maxR) * (nozH / 2 - 4)
        const x = xpix(i)
        if (i === 0) ctx.moveTo(x, nozMid - r)
        else ctx.lineTo(x, nozMid - r)
      }
      for (let i = N - 1; i >= 0; i--) {
        const r = (Math.sqrt(sol.area[i]) / maxR) * (nozH / 2 - 4)
        const x = xpix(i)
        ctx.lineTo(x, nozMid + r)
      }
      ctx.closePath()
      ctx.stroke()

      // throat marker
      const xt = xpix(THROAT)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.setLineDash([3, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(xt, nozTop)
      ctx.lineTo(xt, nozTop + nozH)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px monospace'
      ctx.fillText('throat', xt - 18, nozTop + nozH + 14)

      // internal shock
      if (sol.shockX !== null) {
        const xs = left + sol.shockX * plotW
        const rs = (Math.sqrt(sol.area[Math.round(sol.shockX * (N - 1))]) / maxR) * (nozH / 2 - 4)
        ctx.strokeStyle = '#f87171'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(xs, nozMid - rs)
        ctx.lineTo(xs, nozMid + rs)
        ctx.stroke()
        ctx.fillStyle = '#f87171'
        ctx.fillText('shock', xs - 14, nozMid - rs - 4)
      }

      // flowing particles, speed proportional to local Mach
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      const rows = [-0.5, 0, 0.5]
      for (let p = 0; p < 26; p++) {
        const base = (p / 26 + phaseRef.current) % 1
        const i = Math.min(N - 2, Math.floor(base * (N - 1)))
        // advance faster where Mach is high
        const speedShift = (phaseRef.current * (0.3 + sol.mach[i])) % 1
        const frac = (p / 26 + speedShift) % 1
        const idx = Math.min(N - 1, Math.floor(frac * (N - 1)))
        const r = (Math.sqrt(sol.area[idx]) / maxR) * (nozH / 2 - 4)
        const x = xpix(idx)
        const yoff = rows[p % 3] * r * 0.9
        ctx.beginPath()
        ctx.arc(x, nozMid + yoff, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      // ---- profiles plot: Mach and p/p0 ----
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      ctx.strokeRect(left, plotTop, plotW, plotH)

      // M = 1 reference line (Mach axis scaled 0..3)
      const machMax = 3
      const yMach = (m: number) => plotBot - (Math.min(m, machMax) / machMax) * plotH
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(left, yMach(1))
      ctx.lineTo(left + plotW, yMach(1))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('M=1', left + 2, yMach(1) - 3)

      // Mach curve (cyan)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = xpix(i)
        const y = yMach(sol.mach[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // p/p0 curve (amber), scaled 0..1
      const yP = (p: number) => plotBot - Math.min(1, p) * plotH
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = xpix(i)
        const y = yP(sol.pratio[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // back-pressure target line
      ctx.strokeStyle = 'rgba(251,191,36,0.45)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(left, yP(prPct / 100))
      ctx.lineTo(left + plotW, yP(prPct / 100))
      ctx.stroke()
      ctx.setLineDash([])

      // legend
      ctx.font = '11px monospace'
      ctx.fillStyle = '#22d3ee'
      ctx.fillText('Mach', left + plotW - 96, plotTop + 12)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('p/p0', left + plotW - 44, plotTop + 12)

      // regime label
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px monospace'
      ctx.fillText(sol.regime, left, H - 8)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [sol, prPct])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0b1626', borderRadius: 12 }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={440}
        style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto', borderRadius: 8 }}
      />
      <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 13 }}>
        <label>
          back pressure pb/p0: {(prPct / 100).toFixed(2)}
          <input
            type="range"
            min={5}
            max={99}
            value={prPct}
            onChange={(e) => setPrPct(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <label style={{ display: 'block', marginTop: 10 }}>
          specific heat ratio gamma: {(gammaX100 / 100).toFixed(2)}
          <input
            type="range"
            min={110}
            max={167}
            value={gammaX100}
            onChange={(e) => setGammaX100(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
      </div>
    </div>
  )
}
