'use client'

import { useEffect, useRef, useState } from 'react'

const N = 64
const LX = 1
const DX = LX / N
const RHO = 1
const CHI = 0.5
const M0 = CHI * RHO
const S = M0 * (1 - M0 / RHO)
const U_MAT = 0.2
const AMP0 = 1e-3

const W = 720
const H = 360

function solveCyclic(diag: number, off: number, rhs: number[]): number[] {
  // Sherman-Morrison on a constant-coefficient periodic tridiagonal matrix
  const n = rhs.length
  const gam = -diag
  const b0 = diag - gam
  const bn = diag - (off * off) / gam
  const thomas = (r: number[]) => {
    const cp = new Array<number>(n).fill(0)
    const dp = new Array<number>(n).fill(0)
    cp[0] = off / b0
    dp[0] = r[0] / b0
    for (let i = 1; i < n; i += 1) {
      const bi = i === n - 1 ? bn : diag
      const den = bi - off * cp[i - 1]
      cp[i] = off / den
      dp[i] = (r[i] - off * dp[i - 1]) / den
    }
    const x = new Array<number>(n).fill(0)
    x[n - 1] = dp[n - 1]
    for (let i = n - 2; i >= 0; i -= 1) x[i] = dp[i] - cp[i] * x[i + 1]
    return x
  }
  const u = new Array<number>(n).fill(0)
  u[0] = gam
  u[n - 1] = off
  const y = thomas(rhs)
  const z = thomas(u)
  const fac = (y[0] + (off * y[n - 1]) / gam) / (1 + z[0] + (off * z[n - 1]) / gam)
  return y.map((v, i) => v - fac * z[i])
}

export function RelativeVelocityBlowupLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logMach, setLogMach] = useState(-1)
  const [cflFactor, setCfl] = useState(0.5)
  const [implicit, setImplicit] = useState(true)
  const [running, setRunning] = useState(true)
  const [resetKey, setReset] = useState(0)
  const [stat, setStat] = useState({ step: 0, amp: AMP0, dead: false })

  const mach = Math.pow(10, logMach)
  const kStiff = 1 / (mach * mach * 0.5) + 1 / (mach * mach * 0.5)
  const lambdaC = Math.sqrt(S * kStiff)
  const dt = (cflFactor * DX) / U_MAT
  const acousticCfl = (lambdaC * dt) / DX

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const m = new Array<number>(N)
    const w = new Array<number>(N).fill(0)
    for (let i = 0; i < N; i += 1) m[i] = M0 + AMP0 * Math.sin(2 * Math.PI * (i + 0.5) * DX)
    const hist: number[] = []
    let step = 0
    let dead = false
    let raf = 0
    let frame = 0

    const beta = (dt * dt * S * kStiff) / (DX * DX)

    const advance = () => {
      if (dead) return
      if (implicit) {
        const rhs = new Array<number>(N)
        for (let i = 0; i < N; i += 1) {
          const ip = (i + 1) % N
          const im = (i - 1 + N) % N
          rhs[i] = m[i] - ((dt * S) / (2 * DX)) * (w[ip] - w[im])
        }
        const next = solveCyclic(1 + 2 * beta, -beta, rhs)
        for (let i = 0; i < N; i += 1) m[i] = next[i]
        const mc = m.slice()
        for (let i = 0; i < N; i += 1) {
          const ip = (i + 1) % N
          const im = (i - 1 + N) % N
          w[i] -= ((dt * kStiff) / (2 * DX)) * (mc[ip] - mc[im])
        }
      } else {
        const fm = new Array<number>(N)
        const fw = new Array<number>(N)
        for (let i = 0; i < N; i += 1) {
          const j = (i + 1) % N
          fm[i] = 0.5 * S * (w[i] + w[j]) - 0.5 * lambdaC * (m[j] - m[i])
          fw[i] = 0.5 * kStiff * (m[i] + m[j]) - 0.5 * lambdaC * (w[j] - w[i])
        }
        const mo = m.slice()
        const wo = w.slice()
        for (let i = 0; i < N; i += 1) {
          const im = (i - 1 + N) % N
          m[i] = mo[i] - (dt / DX) * (fm[i] - fm[im])
          w[i] = wo[i] - (dt / DX) * (fw[i] - fw[im])
        }
      }
      step += 1
      let amp = 0
      for (let i = 0; i < N; i += 1) amp = Math.max(amp, Math.abs(m[i] - M0))
      if (!Number.isFinite(amp) || amp > 1e10) dead = true
      hist.push(Math.max(amp, 1e-20))
      if (hist.length > 320) hist.shift()
      return amp
    }

    const draw = () => {
      if (running) for (let k = 0; k < 2; k += 1) advance()

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1120'
      ctx.fillRect(0, 0, W, H)

      // --- top panel: alpha*rho_1 perturbation profile
      const p1t = 22
      const p1h = 150
      ctx.strokeStyle = '#334155'
      ctx.beginPath()
      ctx.moveTo(44, p1t + p1h / 2)
      ctx.lineTo(W - 16, p1t + p1h / 2)
      ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('(αρ₁)ⁿ − (αρ₁)⁰   [clipped at ±3×10⁻³]', 48, p1t + 12)
      ctx.fillText('x', W - 24, p1t + p1h / 2 + 16)

      const clip = 3 * AMP0
      ctx.strokeStyle = dead ? '#f87171' : '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i += 1) {
        const dv = Math.max(-clip, Math.min(clip, (m[i] ?? 0) - M0))
        const x = 44 + (i / (N - 1)) * (W - 60)
        const y = p1t + p1h / 2 - (dv / clip) * (p1h / 2 - 8)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // relative velocity, scaled to its own peak
      let wmax = 1e-20
      for (let i = 0; i < N; i += 1) wmax = Math.max(wmax, Math.abs(w[i] ?? 0))
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let i = 0; i < N; i += 1) {
        const x = 44 + (i / (N - 1)) * (W - 60)
        const y = p1t + p1h / 2 - ((w[i] ?? 0) / wmax) * (p1h / 2 - 8)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.fillStyle = '#f472b6'
      ctx.fillText(`u₁−u₂  (rescaled, peak ${wmax.toExponential(1)})`, 48, p1t + 26)

      // --- bottom panel: amplitude history on a log axis
      const p2t = 208
      const p2h = 118
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      ctx.strokeRect(44, p2t, W - 60, p2h)
      const logTop = 2
      const logBot = -18
      const yLog = (v: number) => p2t + ((logTop - Math.log10(v)) / (logTop - logBot)) * p2h
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = '#475569'
      ctx.beginPath()
      ctx.moveTo(44, yLog(AMP0))
      ctx.lineTo(W - 16, yLog(AMP0))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('max|δ(αρ₁)|  (log₁₀, initial 10⁻³ dashed)', 48, p2t + 13)
      ctx.strokeStyle = dead ? '#f87171' : '#4ade80'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      hist.forEach((v, i) => {
        const x = 44 + (i / 320) * (W - 60)
        const y = Math.max(p2t, Math.min(p2t + p2h, yLog(v)))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      ctx.fillStyle = dead ? '#f87171' : '#e2e8f0'
      ctx.font = '12px ui-monospace, monospace'
      const last = hist.length > 0 ? hist[hist.length - 1] : AMP0
      ctx.fillText(
        `${implicit ? 'implicit ĥ' : 'explicit ĥ'}   step ${step}   CFL_c = λ_c Δt/Δx = ${acousticCfl.toFixed(1)}   ` +
          (dead ? 'BLOW-UP' : `max|δ| = ${last.toExponential(2)}`),
        48,
        H - 12,
      )

      frame += 1
      if (frame % 12 === 0) {
        setStat({ step, amp: last ?? AMP0, dead })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [implicit, running, dt, kStiff, lambdaC, acousticCfl, resetKey])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.9rem',
          alignItems: 'center',
          marginTop: '0.7rem',
          fontSize: '0.82rem',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label>
          log₁₀M = {logMach.toFixed(2)} → λ_c = {lambdaC.toFixed(1)}
          <input
            type="range"
            min={-2.5}
            max={0}
            step={0.05}
            value={logMach}
            onChange={(e) => setLogMach(Number(e.target.value))}
            style={{ display: 'block', width: 200 }}
          />
        </label>
        <label>
          material CFL = {cflFactor.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.05}
            value={cflFactor}
            onChange={(e) => setCfl(Number(e.target.value))}
            style={{ display: 'block', width: 160 }}
          />
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={implicit} onChange={(e) => setImplicit(e.target.checked)} />
          enthalpy implicit
        </label>
        <button type="button" onClick={() => setRunning((r) => !r)}>
          {running ? 'pause' : 'play'}
        </button>
        <button type="button" onClick={() => setReset((k) => k + 1)}>
          restart
        </button>
        <span style={{ opacity: 0.65 }}>
          {stat.dead ? 'diverged' : `step ${stat.step}, |δ| ${stat.amp.toExponential(1)}`}
        </span>
      </div>
    </div>
  )
}
