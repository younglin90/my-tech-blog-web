'use client'

import { useEffect, useRef, useState } from 'react'

// Reduced van der Waals equation of state:
//   P_r = 8 T_r / (3 v_r - 1) - 3 / v_r^2      (valid for v_r > 1/3)
// Critical point sits at (v_r, P_r, T_r) = (1, 1, 1), with Z_c = 3/8.
function reducedPressure(vr: number, Tr: number): number {
  return (8 * Tr) / (3 * vr - 1) - 3 / (vr * vr)
}

// Indefinite integral of P_r with respect to v_r — used for the equal-area rule.
//   ∫ P_r dv_r = (8 T_r / 3) ln(3 v_r - 1) + 3 / v_r
function pressureAntideriv(vr: number, Tr: number): number {
  return (8 * Tr / 3) * Math.log(3 * vr - 1) + 3 / vr
}

// Compressibility factor in reduced variables: Z = (3/8) · P_r · v_r / T_r.
function compressibility(Pr: number, vr: number, Tr: number): number {
  return (3 / 8) * Pr * vr / Tr
}

// Find every volume root of P_r(v_r) = Ptarget by scanning and bracketing.
function volumeRoots(Ptarget: number, Tr: number): number[] {
  const roots: number[] = []
  const vMin = 0.36
  const vMax = 30
  const N = 4000
  let vPrev = vMin
  let fPrev = reducedPressure(vPrev, Tr) - Ptarget
  for (let i = 1; i <= N; i++) {
    // logarithmic sampling so both liquid (small v) and gas (large v) resolve well
    const t = i / N
    const v = vMin * Math.pow(vMax / vMin, t)
    const f = reducedPressure(v, Tr) - Ptarget
    if (fPrev === 0) roots.push(vPrev)
    else if (fPrev * f < 0) {
      // bisection refine
      let a = vPrev
      let b = v
      for (let k = 0; k < 40; k++) {
        const m = 0.5 * (a + b)
        const fm = reducedPressure(m, Tr) - Ptarget
        if ((reducedPressure(a, Tr) - Ptarget) * fm <= 0) b = m
        else a = m
      }
      roots.push(0.5 * (a + b))
    }
    vPrev = v
    fPrev = f
  }
  return roots
}

// Maxwell construction: the saturation pressure P_sat that cuts equal areas off
// the van der Waals loop. Returns null when T_r >= 1 (no loop, supercritical).
function maxwellPressure(Tr: number): { Psat: number; vl: number; vg: number; vm: number } | null {
  if (Tr >= 1) return null
  // Spinodal extrema bracket the saturation pressure.
  let pMin = Infinity
  let pMax = -Infinity
  const M = 3000
  const vMin = 0.36
  const vMax = 30
  for (let i = 0; i <= M; i++) {
    const v = vMin * Math.pow(vMax / vMin, i / M)
    const p = reducedPressure(v, Tr)
    if (v > 0.5 && v < 12) {
      if (p < pMin) pMin = p
      if (p > pMax) pMax = p
    }
  }
  let lo = Math.max(pMin, 1e-4)
  let hi = pMax
  if (!(hi > lo)) return null

  const areaResidual = (Psat: number): number | null => {
    const r = volumeRoots(Psat, Tr)
    if (r.length < 3) return null
    const vl = r[0]
    const vg = r[r.length - 1]
    const integral = pressureAntideriv(vg, Tr) - pressureAntideriv(vl, Tr)
    return integral - Psat * (vg - vl)
  }

  // Bisection on the equal-area residual.
  let Psat = 0.5 * (lo + hi)
  for (let k = 0; k < 60; k++) {
    Psat = 0.5 * (lo + hi)
    const res = areaResidual(Psat)
    if (res === null) {
      // shrink toward the interior where three roots exist
      hi = Psat
      continue
    }
    if (res > 0) lo = Psat
    else hi = Psat
  }
  const roots = volumeRoots(Psat, Tr)
  if (roots.length < 3) return null
  return {
    Psat,
    vl: roots[0],
    vm: roots[Math.floor(roots.length / 2)],
    vg: roots[roots.length - 1],
  }
}

export function VanDerWaalsIsotherm() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [Tr, setTr] = useState(0.90)
  const [showMaxwell, setShowMaxwell] = useState(true)

  // Plot window
  const VMIN = 0.4
  const VMAX = 8
  const PMIN = 0
  const PMAX = 1.8

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const W = 640
    const H = 420
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    canvas.style.height = 'auto'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const padL = 56
    const padR = 16
    const padT = 18
    const padB = 44
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    // log scale on v_r (x), linear on P_r (y)
    const xOf = (vr: number) =>
      padL + (Math.log(vr / VMIN) / Math.log(VMAX / VMIN)) * plotW
    const yOf = (Pr: number) =>
      padT + plotH - ((Pr - PMIN) / (PMAX - PMIN)) * plotH

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1626'
    ctx.fillRect(0, 0, W, H)

    // grid
    ctx.strokeStyle = 'rgba(120,150,180,0.13)'
    ctx.lineWidth = 1
    ctx.fillStyle = '#7a90a8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'center'
    const xticks = [0.5, 1, 2, 4, 8]
    for (const xt of xticks) {
      if (xt < VMIN || xt > VMAX) continue
      const x = xOf(xt)
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
      ctx.stroke()
      ctx.fillText(String(xt), x, padT + plotH + 16)
    }
    ctx.textAlign = 'right'
    for (let pt = 0; pt <= PMAX + 1e-9; pt += 0.3) {
      const y = yOf(pt)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
      ctx.fillText(pt.toFixed(1), padL - 8, y + 4)
    }

    // axis labels
    ctx.fillStyle = '#9fb3c8'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('reduced volume  v_r = v / v_c   (log)', padL + plotW / 2, H - 8)
    ctx.save()
    ctx.translate(14, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('reduced pressure  P_r = P / P_c', 0, 0)
    ctx.restore()

    // background reference isotherms
    const bgTrs = [0.85, 0.95, 1.0, 1.1, 1.25]
    for (const bt of bgTrs) {
      ctx.strokeStyle = bt === 1.0 ? 'rgba(34,211,238,0.30)' : 'rgba(120,150,180,0.18)'
      ctx.lineWidth = bt === 1.0 ? 1.6 : 1
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= 600; i++) {
        const vr = VMIN * Math.pow(VMAX / VMIN, i / 600)
        const pr = reducedPressure(vr, bt)
        if (pr < PMIN - 0.2 || pr > PMAX + 0.5) {
          started = false
          continue
        }
        const x = xOf(vr)
        const y = yOf(pr)
        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // Maxwell construction shading (equal areas) when subcritical
    const maxwell = Tr < 1 ? maxwellPressure(Tr) : null
    if (showMaxwell && maxwell) {
      const { Psat, vl, vg, vm } = maxwell
      const yLine = yOf(Psat)

      // shade the two lobes between the curve and the coexistence line
      const shade = (vStart: number, vEnd: number, color: string) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(xOf(vStart), yLine)
        const steps = 120
        for (let i = 0; i <= steps; i++) {
          const vr = vStart * Math.pow(vEnd / vStart, i / steps)
          ctx.lineTo(xOf(vr), yOf(reducedPressure(vr, Tr)))
        }
        ctx.lineTo(xOf(vEnd), yLine)
        ctx.closePath()
        ctx.fill()
      }
      shade(vl, vm, 'rgba(244,114,182,0.28)')
      shade(vm, vg, 'rgba(34,211,238,0.26)')

      // coexistence (saturation) line
      ctx.strokeStyle = '#f9a8d4'
      ctx.lineWidth = 1.6
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(xOf(vl), yLine)
      ctx.lineTo(xOf(vg), yLine)
      ctx.stroke()
      ctx.setLineDash([])

      // saturation endpoints
      for (const [vp, label] of [[vl, 'liquid'], [vg, 'vapor']] as [number, string][]) {
        ctx.fillStyle = '#f9a8d4'
        ctx.beginPath()
        ctx.arc(xOf(vp), yLine, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    // current isotherm (bold)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    let started = false
    for (let i = 0; i <= 900; i++) {
      const vr = VMIN * Math.pow(VMAX / VMIN, i / 900)
      const pr = reducedPressure(vr, Tr)
      if (pr < PMIN - 0.2 || pr > PMAX + 0.5) {
        started = false
        continue
      }
      const x = xOf(vr)
      const y = yOf(pr)
      if (!started) {
        ctx.moveTo(x, y)
        started = true
      } else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // critical point marker
    ctx.fillStyle = '#22d3ee'
    ctx.beginPath()
    ctx.arc(xOf(1), yOf(1), 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = '#22d3ee'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillText('critical point (1,1)', xOf(1) + 8, yOf(1) - 8)
  }, [Tr, showMaxwell])

  const maxwell = Tr < 1 ? maxwellPressure(Tr) : null
  const Zgas = maxwell ? compressibility(maxwell.Psat, maxwell.vg, Tr) : null
  const Zliq = maxwell ? compressibility(maxwell.Psat, maxwell.vl, Tr) : null

  return (
    <div
      style={{
        border: '1px solid var(--border, #1e293b)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface, #0b1626)',
        margin: '1.5rem 0',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />

      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
        <label style={{ flex: '1 1 280px', fontSize: 13, color: 'var(--text-muted, #9fb3c8)' }}>
          reduced temperature&nbsp;
          <strong style={{ color: '#fbbf24', fontFamily: 'ui-monospace, monospace' }}>
            T_r = {Tr.toFixed(3)}
          </strong>
          <input
            type="range"
            min={0.80}
            max={1.20}
            step={0.005}
            value={Tr}
            onChange={(e) => setTr(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: 6, accentColor: '#22d3ee' }}
          />
        </label>

        <label style={{ fontSize: 13, color: 'var(--text-muted, #9fb3c8)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={showMaxwell}
            onChange={(e) => setShowMaxwell(e.target.checked)}
            style={{ accentColor: '#f472b6' }}
          />
          Maxwell construction
        </label>
      </div>

      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', color: 'var(--text-muted, #9fb3c8)', lineHeight: 1.7 }}>
        {Tr >= 1 ? (
          <span>T_r ≥ 1 — supercritical: one smooth branch, no liquid/vapor split.</span>
        ) : maxwell ? (
          <>
            <span>saturation pressure&nbsp;P_r,sat = <strong style={{ color: '#f9a8d4' }}>{maxwell.Psat.toFixed(3)}</strong></span>
            <br />
            <span>
              Z(sat. vapor) = <strong style={{ color: '#22d3ee' }}>{Zgas?.toFixed(3)}</strong>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              Z(sat. liquid) = <strong style={{ color: '#f472b6' }}>{Zliq?.toFixed(3)}</strong>
            </span>
          </>
        ) : (
          <span>loop too shallow to resolve at this T_r.</span>
        )}
      </div>
    </div>
  )
}
