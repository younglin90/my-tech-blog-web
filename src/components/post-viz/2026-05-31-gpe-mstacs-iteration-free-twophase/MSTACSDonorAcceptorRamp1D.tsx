'use client'

import { useEffect, useRef, useState } from 'react'

const N = 100
const dx = 1 / N
const U = 0.5

type Mode = 'CDS' | 'HR' | 'MSTACS'

function initC() {
  const C = new Float64Array(N + 4)
  for (let i = 2; i <= N + 1; i++) {
    const x = (i - 1.5) * dx
    C[i] = x > 0.2 && x < 0.4 ? 1 : 0
  }
  return C
}

function applyPeriodic(C: Float64Array) {
  C[0] = C[N]
  C[1] = C[N + 1]
  C[N + 2] = C[2]
  C[N + 3] = C[3]
}

function cdsTilde(Cd: number, Cou: number): number {
  if (Cd < 0 || Cd > 1) return Cd
  if (Cou <= 1 / 3) return Math.min(Cd / Math.max(Cou, 1e-6), 1)
  return Math.min(3 * Cd, 1)
}

function hrTilde(Cd: number): number {
  if (Cd < 0 || Cd > 1) return Cd
  if (Cd < 1 / 5) return 3 * Cd
  if (Cd < 1 / 2) return 0.5 + 0.5 * Cd
  if (Cd < 5 / 6) return 3 / 8 + 0.75 * Cd
  return 1
}

function faceValue(Cd: number, Ca: number, Cu: number, Cou: number, mode: Mode, gamma: number): number {
  const denom = Ca - Cu
  if (Math.abs(denom) < 1e-10) return Cd
  const CdT = (Cd - Cu) / denom
  const tildeCDS = cdsTilde(CdT, Cou)
  const tildeHR = hrTilde(CdT)
  let tildeF: number
  if (mode === 'CDS') tildeF = tildeCDS
  else if (mode === 'HR') tildeF = tildeHR
  else tildeF = gamma * tildeCDS + (1 - gamma) * tildeHR
  return tildeF * denom + Cu
}

function step(C: Float64Array, Cou: number, mode: Mode, gamma: number) {
  applyPeriodic(C)
  const Cf = new Float64Array(N + 3)
  for (let i = 1; i <= N + 1; i++) {
    const Cd = C[i]
    const Ca = C[i + 1]
    const Cu = C[i - 1]
    Cf[i] = faceValue(Cd, Ca, Cu, Cou, mode, gamma)
  }
  const newC = new Float64Array(N + 4)
  for (let i = 2; i <= N + 1; i++) {
    newC[i] = C[i] - Cou * (Cf[i] - Cf[i - 1])
  }
  applyPeriodic(newC)
  for (let i = 0; i < N + 4; i++) C[i] = newC[i]
}

export function MSTACSDonorAcceptorRamp1D() {
  const [cou, setCou] = useState(0.3)
  const [theta, setTheta] = useState(30)
  const [mode, setMode] = useState<Mode>('MSTACS')
  const [nSteps, setNSteps] = useState(120)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const gamma = Math.pow(Math.cos((theta * Math.PI) / 180), 4)

  useEffect(() => {
    const C = initC()
    for (let s = 0; s < nSteps; s++) step(C, cou, mode, gamma)

    // L1 error vs exact shifted top-hat
    const shift = (U * nSteps * (cou * dx) / U) % 1
    const Cexact = new Float64Array(N + 4)
    for (let i = 2; i <= N + 1; i++) {
      const x = ((i - 1.5) * dx - shift + 2) % 1
      Cexact[i] = x > 0.2 && x < 0.4 ? 1 : 0
    }
    let l1 = 0
    for (let i = 2; i <= N + 1; i++) l1 += Math.abs(C[i] - Cexact[i]) * dx

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)

    // axes
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let y = 0; y <= 1; y += 0.25) {
      ctx.beginPath()
      const py = H - 30 - y * (H - 50)
      ctx.moveTo(40, py)
      ctx.lineTo(W - 10, py)
      ctx.stroke()
    }

    // exact profile (faint white)
    ctx.strokeStyle = '#475569'
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 2; i <= N + 1; i++) {
      const x = 40 + ((i - 1.5) / N) * (W - 50)
      const y = H - 30 - Cexact[i] * (H - 50)
      if (i === 2) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // computed (cyan)
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 2; i <= N + 1; i++) {
      const x = 40 + ((i - 1.5) / N) * (W - 50)
      const y = H - 30 - C[i] * (H - 50)
      if (i === 2) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px sans-serif'
    ctx.fillText('C = 1', 6, H - 30 - (H - 50) + 4)
    ctx.fillText('C = 0', 6, H - 26)
    ctx.fillText('exact (dashed)', W - 130, 18)
    ctx.fillStyle = '#22d3ee'
    ctx.fillText(`${mode}  L₁ = ${l1.toFixed(4)}`, 50, 20)
  }, [cou, theta, mode, nSteps, gamma])

  return (
    <div style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={640} height={260} style={{ width: '100%', display: 'block', borderRadius: 4 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {(['CDS', 'HR', 'MSTACS'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: mode === m ? '#22d3ee' : 'var(--bg)',
              color: mode === m ? '#08111f' : 'var(--text)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 13 }}>
        <label>
          Courant Cou<sub>adv</sub>: {cou.toFixed(2)}
        </label>
        <input type="range" min={0.05} max={0.95} step={0.05} value={cou} onChange={(e) => setCou(+e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ fontSize: 13 }}>
        <label>
          interface angle θ: {theta}° → γ = cos⁴θ = {gamma.toFixed(3)}
        </label>
        <input type="range" min={0} max={90} step={5} value={theta} onChange={(e) => setTheta(+e.target.value)} style={{ width: '100%' }} disabled={mode !== 'MSTACS'} />
      </div>
      <div style={{ fontSize: 13 }}>
        <label>steps: {nSteps}</label>
        <input type="range" min={10} max={400} step={10} value={nSteps} onChange={(e) => setNSteps(+e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
        Top-hat advected by U=0.5 with periodic BC. CDS = compressive (sharp but can wrinkle), HR = high-resolution (smoother), MSTACS = γ·CDS + (1−γ)·HR.
      </div>
    </div>
  )
}
