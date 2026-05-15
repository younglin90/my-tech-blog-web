'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const N = 60
const L = 1000 // meters
const dx = L / (N - 1)
const a0 = 0.3 // porosity
const kappa = 1.0 // hydraulic conductivity (m/s)

// Bottom z = -h(x), ceiling z = c(x)
// Symmetric: h(x) = c(x) = h0 * (1 - (x-L/2)^2 / (L/2)^2)
const h0 = 10
const xs = Array.from({ length: N }, (_, i) => i * dx)
const hArr = xs.map((x) => h0 * Math.max(0, 1 - ((x - L / 2) / (L / 2)) ** 2))
const cArr = hArr // symmetric

// V(eta) at cell i: V_i(eta) = integrate a_i(z)dz from -inf to eta
// a_i(z) = a0 if -h_i <= z <= c_i else 0
function vCell(eta: number, i: number) {
  const ceil = cArr[i]
  const floor = -hArr[i]
  if (eta <= floor) return 0
  if (eta >= ceil) return a0 * (ceil - floor)
  return a0 * (eta - floor)
}
function pCell(eta: number, i: number) {
  // derivative of V1 = int_-inf^eta p(z)dz, where p = a0 if z >= -h_i else 0
  return eta >= -hArr[i] ? a0 : 0
}
function qCell(eta: number, i: number) {
  // q = a0 if z > c_i else 0
  return eta > cArr[i] ? a0 : 0
}
function v1Cell(eta: number, i: number) {
  return eta <= -hArr[i] ? 0 : a0 * (eta - -hArr[i])
}
function v2Cell(eta: number, i: number) {
  return eta <= cArr[i] ? 0 : a0 * (eta - cArr[i])
}

function classify(eta: number, i: number): 'dry' | 'phreatic' | 'pressurized' {
  if (eta <= -hArr[i] + 1e-6) return 'dry'
  if (eta >= cArr[i] - 1e-6) return 'pressurized'
  return 'phreatic'
}

// Thomas algorithm for 1D tri-diagonal: a[i]*x[i-1] + b[i]*x[i] + c[i]*x[i+1] = d[i]
function thomas(a: number[], b: number[], c: number[], d: number[]) {
  const n = b.length
  const cp = new Array(n).fill(0)
  const dp = new Array(n).fill(0)
  cp[0] = c[0] / b[0]
  dp[0] = d[0] / b[0]
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1]
    cp[i] = i < n - 1 ? c[i] / m : 0
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m
  }
  const x = new Array(n).fill(0)
  x[n - 1] = dp[n - 1]
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
  return x
}

// Solve one timestep of the wet/dry FV: V_i(eta_new) = V_i(eta_old) + dt*[Lap eta_new] + dt*phi_i
// where Lap is the standard 5-point operator (1D here). Pumping at center cell.
function nestedNewtonSolve(etaPrev: number[], dt: number, pumpFlux: number) {
  const Vprev = etaPrev.map((e, i) => vCell(e, i))
  // build T = -dt * Lap (so we solve V(eta) + T eta = Vprev + dt*phi)
  // Boundary: zero-flux ends
  // T eta_i ~ -dt * kappa * (eta_{i+1} - 2 eta_i + eta_{i-1}) / dx^2
  const Tdiag: number[] = []
  const Tsub: number[] = []
  const Tsup: number[] = []
  for (let i = 0; i < N; i++) {
    const alpha = (dt * kappa) / (dx * dx)
    Tsub.push(-alpha)
    Tdiag.push(2 * alpha)
    Tsup.push(-alpha)
  }
  // zero-flux: drop off-diagonal at ends
  Tsub[0] = 0
  Tdiag[0] = (dt * kappa) / (dx * dx)
  Tsup[N - 1] = 0
  Tdiag[N - 1] = (dt * kappa) / (dx * dx)
  // rhs
  const phi = new Array(N).fill(0)
  const center = Math.floor(N / 2)
  phi[center] = -pumpFlux // negative source = sink
  const rhs0 = Vprev.map((vv, i) => vv + dt * phi[i])

  // outer iterations
  let eta = etaPrev.map((_e, i) => -hArr[i] - 0.1) // start below ell
  for (let n = 0; n < 8; n++) {
    const Qn = eta.map((e, i) => qCell(e, i))
    const V2n = eta.map((e, i) => v2Cell(e, i))
    const d = rhs0.map((r, i) => r + V2n[i] - Qn[i] * eta[i])
    // inner iterations (Newton on V1)
    let etaInner = eta.map((_e, i) => cArr[i] + 0.5) // start above u
    for (let m = 0; m < 12; m++) {
      const Pnm = etaInner.map((e, i) => pCell(e, i))
      const V1nm = etaInner.map((e, i) => v1Cell(e, i))
      const f = etaInner.map((e, i) => Pnm[i] * e - V1nm[i] + d[i])
      const Adiag = Tdiag.map((t, i) => t + Pnm[i] - Qn[i])
      // Use Thomas (sub/sup unchanged)
      etaInner = thomas(Tsub, Adiag, Tsup, f)
      // inner residual check
      let rmax = 0
      for (let i = 0; i < N; i++) {
        const r = v1Cell(etaInner[i], i) + (Tdiag[i] - Qn[i]) * etaInner[i] - d[i]
        // also account for off-diagonal contribution
        const off = (i > 0 ? Tsub[i] * etaInner[i - 1] : 0) + (i < N - 1 ? Tsup[i] * etaInner[i + 1] : 0)
        rmax = Math.max(rmax, Math.abs(r + off))
      }
      if (rmax < 1e-8) break
    }
    eta = etaInner
    // outer residual
    let rmax = 0
    for (let i = 0; i < N; i++) {
      const off = (i > 0 ? Tsub[i] * eta[i - 1] : 0) + (i < N - 1 ? Tsup[i] * eta[i + 1] : 0)
      const r = vCell(eta[i], i) + Tdiag[i] * eta[i] + off - rhs0[i]
      rmax = Math.max(rmax, Math.abs(r))
    }
    if (rmax < 1e-6) break
  }
  return eta
}

export function WetDryAquifer1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pump, setPump] = useState(0.0008)
  const [day, setDay] = useState(0)
  const [eta, setEta] = useState<number[]>(() => xs.map((_x, i) => cArr[i] - 0.0)) // initially pressurized at ceiling
  const dt = 86400 // 1 day in seconds

  const stats = useMemo(() => {
    let dry = 0
    let phr = 0
    let pre = 0
    for (let i = 0; i < N; i++) {
      const k = classify(eta[i], i)
      if (k === 'dry') dry++
      else if (k === 'phreatic') phr++
      else pre++
    }
    const totalV = eta.reduce((acc, e, i) => acc + vCell(e, i) * dx, 0)
    return { dry, phr, pre, totalV }
  }, [eta])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const M = { l: 36, r: 12, t: 18, b: 30 }
    const pw = W - M.l - M.r
    const ph = H - M.t - M.b

    const zMin = -h0 - 2
    const zMax = h0 + 2
    const xPix = (x: number) => M.l + (x / L) * pw
    const yPix = (z: number) => M.t + (1 - (z - zMin) / (zMax - zMin)) * ph

    ctx.fillStyle = '#0b1424'
    ctx.fillRect(0, 0, W, H)

    // bedrock band (below bottom)
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.moveTo(M.l, M.t + ph)
    for (let i = 0; i < N; i++) ctx.lineTo(xPix(xs[i]), yPix(-hArr[i]))
    ctx.lineTo(M.l + pw, M.t + ph)
    ctx.closePath()
    ctx.fill()

    // ceiling band (above ceiling — impermeable cap)
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.moveTo(M.l, M.t)
    for (let i = 0; i < N; i++) ctx.lineTo(xPix(xs[i]), yPix(cArr[i]))
    ctx.lineTo(M.l + pw, M.t)
    ctx.closePath()
    ctx.fill()

    // water region
    ctx.beginPath()
    let opened = false
    for (let i = 0; i < N; i++) {
      const z = Math.min(eta[i], cArr[i])
      const floor = -hArr[i]
      if (z > floor + 1e-3) {
        if (!opened) {
          ctx.moveTo(xPix(xs[i]), yPix(floor))
          opened = true
        }
        ctx.lineTo(xPix(xs[i]), yPix(floor))
      }
    }
    for (let i = N - 1; i >= 0; i--) {
      const z = Math.min(eta[i], cArr[i])
      const floor = -hArr[i]
      if (z > floor + 1e-3) {
        ctx.lineTo(xPix(xs[i]), yPix(z))
      }
    }
    ctx.closePath()
    ctx.fillStyle = '#1e6f8c'
    ctx.fill()

    // pressurized region (where eta > ceiling)
    ctx.fillStyle = '#22d3ee'
    for (let i = 0; i < N - 1; i++) {
      if (eta[i] >= cArr[i] - 1e-3) {
        const x0 = xPix(xs[i])
        const x1 = xPix(xs[i + 1])
        const y0 = yPix(cArr[i])
        const y1 = yPix(-hArr[i])
        ctx.fillRect(x0, y0, Math.max(1, x1 - x0), y1 - y0)
      }
    }

    // piezometric head line eta(x)
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const py = yPix(eta[i])
      const px = xPix(xs[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // bottom line
    ctx.strokeStyle = '#7a8a9f'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const py = yPix(-hArr[i])
      const px = xPix(xs[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const py = yPix(cArr[i])
      const px = xPix(xs[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // pump arrow at center
    const cx = xPix(L / 2)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, M.t + 4)
    ctx.lineTo(cx, M.t + 26)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - 4, M.t + 10)
    ctx.lineTo(cx, M.t + 4)
    ctx.lineTo(cx + 4, M.t + 10)
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText('pump', cx + 6, M.t + 16)

    // labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText('x (m)', M.l + pw - 36, M.t + ph + 20)
    ctx.fillText('z (m)', 2, M.t + 10)
    ctx.fillText('0', M.l - 12, yPix(0) + 3)
    ctx.fillText(`-h(x)`, M.l + 4, yPix(-h0 / 2) - 4)
    ctx.fillText(`c(x)`, M.l + 4, yPix(h0 / 2) + 12)
  }, [eta])

  const stepDay = () => {
    const newEta = nestedNewtonSolve(eta, dt, pump)
    setEta(newEta)
    setDay((d) => d + 1)
  }
  const reset = () => {
    setEta(xs.map((_x, i) => cArr[i] - 0.0))
    setDay(0)
  }

  return (
    <div style={{ margin: '1.4rem 0', padding: '0.9rem', border: '1px solid var(--border)', borderRadius: 8 }}>
      <canvas ref={canvasRef} width={640} height={260} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} />
      <div style={{ marginTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          pump flux phi = {pump.toFixed(4)} (m/s per cell)
          <input
            type="range"
            min={0.0001}
            max={0.003}
            step={0.0001}
            value={pump}
            onChange={(e) => setPump(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <button
            onClick={stepDay}
            style={{ padding: '0.3rem 0.7rem', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
          >
            +1 day
          </button>
          <button
            onClick={reset}
            style={{ padding: '0.3rem 0.7rem', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
          >
            Reset
          </button>
        </div>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
        day = {day} &middot; pressurized cells = {stats.pre} &middot; phreatic = {stats.phr} &middot; dry = {stats.dry} &middot; total water V = {stats.totalV.toFixed(1)} m
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '0.3rem', marginBottom: 0 }}>
        Cyan = pressurized (confined) region; teal = phreatic; black = dry. Yellow line is piezometric head eta(x). Pump near the center steadily drains the aquifer; the wet/dry boundary advances inward as days pass.
      </p>
    </div>
  )
}
