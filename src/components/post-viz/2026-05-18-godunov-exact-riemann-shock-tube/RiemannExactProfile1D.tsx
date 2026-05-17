'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const GAMMA = 1.4
const G1 = (GAMMA - 1) / (2 * GAMMA)
const G2 = (GAMMA + 1) / (2 * GAMMA)
const G3 = (2 * GAMMA) / (GAMMA - 1)
const G4 = 2 / (GAMMA - 1)
const G5 = 2 / (GAMMA + 1)
const G6 = (GAMMA - 1) / (GAMMA + 1)
const G7 = (GAMMA - 1) / 2

function fK(p: number, rhoK: number, pK: number, cK: number) {
  if (p > pK) {
    const AK = 2 / ((GAMMA + 1) * rhoK)
    const BK = G6 * pK
    return (p - pK) * Math.sqrt(AK / (p + BK))
  }
  return G4 * cK * (Math.pow(p / pK, G1) - 1)
}

function dfK(p: number, rhoK: number, pK: number, cK: number) {
  if (p > pK) {
    const AK = 2 / ((GAMMA + 1) * rhoK)
    const BK = G6 * pK
    return Math.sqrt(AK / (p + BK)) * (1 - (p - pK) / (2 * (p + BK)))
  }
  return (1 / (rhoK * cK)) * Math.pow(p / pK, -G2)
}

function findStar(rhoL: number, uL: number, pL: number, rhoR: number, uR: number, pR: number) {
  const cL = Math.sqrt((GAMMA * pL) / rhoL)
  const cR = Math.sqrt((GAMMA * pR) / rhoR)
  let p = Math.max(1e-6, 0.5 * (pL + pR) - 0.125 * (uR - uL) * (rhoL + rhoR) * (cL + cR))
  for (let i = 0; i < 60; i++) {
    const f = fK(p, rhoL, pL, cL) + fK(p, rhoR, pR, cR) + (uR - uL)
    const df = dfK(p, rhoL, pL, cL) + dfK(p, rhoR, pR, cR)
    const dp = f / df
    const pNew = Math.max(1e-6, p - dp)
    if (Math.abs(2 * (pNew - p)) / (pNew + p) < 1e-9) {
      p = pNew
      break
    }
    p = pNew
  }
  const uStar = 0.5 * (uL + uR) + 0.5 * (fK(p, rhoR, pR, cR) - fK(p, rhoL, pL, cL))
  return { pStar: p, uStar, cL, cR }
}

type State = { rho: number; u: number; p: number }

function sample(
  s: number,
  rhoL: number, uL: number, pL: number, cL: number,
  rhoR: number, uR: number, pR: number, cR: number,
  pStar: number, uStar: number,
): State {
  if (s < uStar) {
    if (pStar > pL) {
      const PML = pStar / pL
      const SL = uL - cL * Math.sqrt(G2 * PML + G1)
      if (s < SL) return { rho: rhoL, u: uL, p: pL }
      const rhoSL = rhoL * (PML + G6) / (G6 * PML + 1)
      return { rho: rhoSL, u: uStar, p: pStar }
    }
    const SHL = uL - cL
    if (s < SHL) return { rho: rhoL, u: uL, p: pL }
    const cSL = cL * Math.pow(pStar / pL, G1)
    const STL = uStar - cSL
    if (s > STL) {
      const rhoSL = rhoL * Math.pow(pStar / pL, 1 / GAMMA)
      return { rho: rhoSL, u: uStar, p: pStar }
    }
    const factor = G5 + (G6 / cL) * (uL - s)
    return {
      rho: rhoL * Math.pow(factor, G4),
      u: G5 * (cL + G7 * uL + s),
      p: pL * Math.pow(factor, G3),
    }
  }
  if (pStar > pR) {
    const PMR = pStar / pR
    const SR = uR + cR * Math.sqrt(G2 * PMR + G1)
    if (s > SR) return { rho: rhoR, u: uR, p: pR }
    const rhoSR = rhoR * (PMR + G6) / (G6 * PMR + 1)
    return { rho: rhoSR, u: uStar, p: pStar }
  }
  const SHR = uR + cR
  if (s > SHR) return { rho: rhoR, u: uR, p: pR }
  const cSR = cR * Math.pow(pStar / pR, G1)
  const STR = uStar + cSR
  if (s < STR) {
    const rhoSR = rhoR * Math.pow(pStar / pR, 1 / GAMMA)
    return { rho: rhoSR, u: uStar, p: pStar }
  }
  const factor = G5 - (G6 / cR) * (uR - s)
  return {
    rho: rhoR * Math.pow(factor, G4),
    u: G5 * (-cR + G7 * uR + s),
    p: pR * Math.pow(factor, G3),
  }
}

const PRESETS: Record<string, { rhoL: number; uL: number; pL: number; rhoR: number; uR: number; pR: number }> = {
  Lax: { rhoL: 0.445, uL: 0.698, pL: 3.528, rhoR: 0.5, uR: 0, pR: 0.571 },
  '123': { rhoL: 1.0, uL: -2.0, pL: 0.4, rhoR: 1.0, uR: 2.0, pR: 0.4 },
  'Strong-blast': { rhoL: 1.0, uL: 0.0, pL: 1000.0, rhoR: 1.0, uR: 0.0, pR: 0.01 },
}

export function RiemannExactProfile1D() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [preset, setPreset] = useState<keyof typeof PRESETS>('Lax')
  const [t, setT] = useState(0.14)
  const init = PRESETS[preset]

  const solution = useMemo(() => {
    const star = findStar(init.rhoL, init.uL, init.pL, init.rhoR, init.uR, init.pR)
    const N = 360
    const xs = new Float64Array(N)
    const rhos = new Float64Array(N)
    const us = new Float64Array(N)
    const ps = new Float64Array(N)
    const xMin = -0.5, xMax = 0.5
    for (let i = 0; i < N; i++) {
      const x = xMin + ((xMax - xMin) * i) / (N - 1)
      const s = t > 1e-6 ? x / t : x > 0 ? 1e9 : -1e9
      const st = sample(
        s,
        init.rhoL, init.uL, init.pL, star.cL,
        init.rhoR, init.uR, init.pR, star.cR,
        star.pStar, star.uStar,
      )
      xs[i] = x
      rhos[i] = st.rho
      us[i] = st.u
      ps[i] = st.p
    }
    return { xs, rhos, us, ps, star }
  }, [init, t])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width
    const H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.95)'
    ctx.fillRect(0, 0, W, H)

    const PAD = 36
    const innerH = (H - PAD * 4) / 3
    const labels = ['density  rho', 'velocity  u', 'pressure  p']
    const arrays = [solution.rhos, solution.us, solution.ps]
    const colors = ['#22d3ee', '#f59e0b', '#a78bfa']
    const N = solution.xs.length
    const xMin = -0.5, xMax = 0.5

    for (let panel = 0; panel < 3; panel++) {
      const data = arrays[panel]
      const top = PAD + panel * (innerH + PAD / 2)
      const bottom = top + innerH
      let lo = Infinity, hi = -Infinity
      for (let i = 0; i < N; i++) {
        if (data[i] < lo) lo = data[i]
        if (data[i] > hi) hi = data[i]
      }
      const pad = Math.max((hi - lo) * 0.1, 0.05)
      lo -= pad
      hi += pad
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      ctx.strokeRect(PAD, top, W - PAD * 2, innerH)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px ui-monospace,monospace'
      ctx.fillText(labels[panel], PAD + 6, top + 14)
      ctx.fillText(hi.toFixed(2), W - PAD - 36, top + 12)
      ctx.fillText(lo.toFixed(2), W - PAD - 36, bottom - 2)

      ctx.strokeStyle = colors[panel]
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const xPx = PAD + ((solution.xs[i] - xMin) / (xMax - xMin)) * (W - PAD * 2)
        const yPx = bottom - ((data[i] - lo) / (hi - lo)) * innerH
        if (i === 0) ctx.moveTo(xPx, yPx)
        else ctx.lineTo(xPx, yPx)
      }
      ctx.stroke()

      const xMidPx = PAD + (0.5) * (W - PAD * 2)
      ctx.strokeStyle = 'rgba(244,114,182,0.5)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(xMidPx, top)
      ctx.lineTo(xMidPx, bottom)
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '12px ui-sans-serif,system-ui'
    ctx.fillText(`t = ${t.toFixed(3)},  p* = ${solution.star.pStar.toFixed(3)},  u* = ${solution.star.uStar.toFixed(3)}`, PAD, H - 10)
  }, [solution, t])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={720}
        height={460}
        style={{ width: '100%', maxWidth: 720, borderRadius: 8, border: '1px solid var(--border)' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: 13, color: 'var(--text)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
          <span style={{ marginBottom: 4 }}>preset</span>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as keyof typeof PRESETS)}
            style={{ padding: '4px 8px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }}
          >
            {Object.keys(PRESETS).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 200 }}>
          <span style={{ marginBottom: 4 }}>time t = {t.toFixed(3)}</span>
          <input
            type="range"
            min={0.001}
            max={0.3}
            step={0.001}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Three waves emerge from the origin: a left-going rarefaction or shock, a contact discontinuity at u*, and a right-going wave.
        The vertical pink dashed line marks the initial diaphragm at x = 0.
      </p>
    </div>
  )
}
