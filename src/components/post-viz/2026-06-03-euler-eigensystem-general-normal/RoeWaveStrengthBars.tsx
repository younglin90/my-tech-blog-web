'use client'

import { useMemo, useState } from 'react'

// Bar chart of wave strengths alpha_k from a 1D Roe-average decomposition
// of the jump deltaU = U_R - U_L. Three families:
//   alpha_1 acoustic-  (lambda = u - a)
//   alpha_2 entropy    (lambda = u)        carries density / contact
//   alpha_3 acoustic+  (lambda = u + a)
// Formula (1D Euler, Roe avg):
//   alpha_2 = drho - dp / a2
//   alpha_1 = ( dp - rho_avg * a * du ) / (2 a2)
//   alpha_3 = ( dp + rho_avg * a * du ) / (2 a2)

const GAMMA = 1.4
const W = 620
const H = 230

function roeAverage(rhoL: number, uL: number, pL: number, rhoR: number, uR: number, pR: number) {
  const HL = GAMMA / (GAMMA - 1) * pL / rhoL + 0.5 * uL * uL
  const HR = GAMMA / (GAMMA - 1) * pR / rhoR + 0.5 * uR * uR
  const sL = Math.sqrt(rhoL)
  const sR = Math.sqrt(rhoR)
  const u = (sL * uL + sR * uR) / (sL + sR)
  const H_ = (sL * HL + sR * HR) / (sL + sR)
  const a2 = (GAMMA - 1) * (H_ - 0.5 * u * u)
  const a = Math.sqrt(Math.max(a2, 1e-9))
  const rho = sL * sR
  return { rho, u, a }
}

function waveStrengths(rhoL: number, uL: number, pL: number, rhoR: number, uR: number, pR: number) {
  const { rho, u, a } = roeAverage(rhoL, uL, pL, rhoR, uR, pR)
  const drho = rhoR - rhoL
  const du = uR - uL
  const dp = pR - pL
  const a2 = a * a
  const alphaContact = drho - dp / a2
  const alphaMinus = (dp - rho * a * du) / (2 * a2)
  const alphaPlus = (dp + rho * a * du) / (2 * a2)
  return { alphaMinus, alphaContact, alphaPlus, u, a }
}

export function RoeWaveStrengthBars() {
  const [rhoL, setRhoL] = useState(1.0)
  const [uL, setUL] = useState(0.0)
  const [pL, setPL] = useState(1.0)
  const [rhoR, setRhoR] = useState(0.125)
  const [uR, setUR] = useState(0.0)
  const [pR, setPR] = useState(0.1)

  const result = useMemo(() => waveStrengths(rhoL, uL, pL, rhoR, uR, pR), [rhoL, uL, pL, rhoR, uR, pR])
  const { alphaMinus, alphaContact, alphaPlus, u, a } = result

  const lambdas = [u - a, u, u + a]
  const alphas = [alphaMinus, alphaContact, alphaPlus]
  const labels = ['α₁ (u − a)', 'α₂ (u, contact)', 'α₃ (u + a)']
  const colors = ['#60a5fa', '#94a3b8', '#f87171']

  const absMax = Math.max(1e-3, ...alphas.map((v) => Math.abs(v)))

  const presets = [
    { name: 'Sod', L: [1.0, 0.0, 1.0], R: [0.125, 0.0, 0.1] },
    { name: '123 problem', L: [1.0, -2.0, 0.4], R: [1.0, 2.0, 0.4] },
    { name: 'Lax', L: [0.445, 0.698, 3.528], R: [0.5, 0.0, 0.571] },
    { name: 'no jump', L: [1.0, 0.0, 1.0], R: [1.0, 0.0, 1.0] },
  ]

  function loadPreset(p: number[][]) {
    setRhoL(p[0][0]); setUL(p[0][1]); setPL(p[0][2])
    setRhoR(p[1][0]); setUR(p[1][1]); setPR(p[1][2])
  }

  const barAreaTop = 28
  const barAreaH = H - 70
  const zeroY = barAreaTop + barAreaH * 0.55
  const barW = 90
  const gap = 80

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', borderRadius: 12, background: 'var(--surface, #0f172a)', border: '1px solid var(--border, #1e293b)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 620, display: 'block' }}>
        <rect x={0} y={0} width={W} height={H} fill='#0b1322' rx={8} />
        <line x1={40} y1={zeroY} x2={W - 12} y2={zeroY} stroke='#37495f' strokeWidth={1} />
        <text x={48} y={20} fill='#cbd5e1' fontFamily='JetBrains Mono, monospace' fontSize={12}>
          wave strength α (Roe-averaged decomposition of ΔU)
        </text>
        {alphas.map((al, i) => {
          const cx = 90 + i * (barW + gap)
          const norm = al / absMax
          const h = Math.abs(norm) * (barAreaH * 0.4)
          const y = norm >= 0 ? zeroY - h : zeroY
          return (
            <g key={i}>
              <rect x={cx} y={y} width={barW} height={h} fill={colors[i]} opacity={0.85} />
              <text x={cx + barW / 2} y={H - 36} fill='#cbd5e1' fontFamily='JetBrains Mono, monospace' fontSize={11} textAnchor='middle'>
                {labels[i]}
              </text>
              <text x={cx + barW / 2} y={H - 22} fill='#94a3b8' fontFamily='JetBrains Mono, monospace' fontSize={11} textAnchor='middle'>
                λ = {lambdas[i].toFixed(3)}
              </text>
              <text x={cx + barW / 2} y={H - 8} fill={colors[i]} fontFamily='JetBrains Mono, monospace' fontSize={11} textAnchor='middle'>
                α = {al.toFixed(3)}
              </text>
            </g>
          )
        })}
        <text x={W - 12} y={zeroY - 4} fill='#7a90a8' fontFamily='JetBrains Mono, monospace' fontSize={10} textAnchor='end'>
          0
        </text>
      </svg>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text, #cbd5e1)' }}>Left state</div>
          <label>ρL <input type='range' min={0.1} max={2.5} step={0.025} value={rhoL} onChange={(e) => setRhoL(parseFloat(e.target.value))} style={{ width: 140 }} /> {rhoL.toFixed(3)}</label>
          <br />
          <label>uL <input type='range' min={-3} max={3} step={0.05} value={uL} onChange={(e) => setUL(parseFloat(e.target.value))} style={{ width: 140 }} /> {uL.toFixed(2)}</label>
          <br />
          <label>pL <input type='range' min={0.05} max={5} step={0.05} value={pL} onChange={(e) => setPL(parseFloat(e.target.value))} style={{ width: 140 }} /> {pL.toFixed(3)}</label>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text, #cbd5e1)' }}>Right state</div>
          <label>ρR <input type='range' min={0.1} max={2.5} step={0.025} value={rhoR} onChange={(e) => setRhoR(parseFloat(e.target.value))} style={{ width: 140 }} /> {rhoR.toFixed(3)}</label>
          <br />
          <label>uR <input type='range' min={-3} max={3} step={0.05} value={uR} onChange={(e) => setUR(parseFloat(e.target.value))} style={{ width: 140 }} /> {uR.toFixed(2)}</label>
          <br />
          <label>pR <input type='range' min={0.05} max={5} step={0.05} value={pR} onChange={(e) => setPR(parseFloat(e.target.value))} style={{ width: 140 }} /> {pR.toFixed(3)}</label>
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {presets.map((p) => (
          <button key={p.name} onClick={() => loadPreset([p.L, p.R])} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border, #334155)', background: 'transparent', color: 'var(--text, #cbd5e1)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
            {p.name}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
        Roe-averaged speeds: u = {u.toFixed(3)}, a = {a.toFixed(3)}. The contact bar (α₂) flips sign with Δρ at fixed Δp — pull only ρR to see it. Switch to "123 problem" and the two acoustic bars become symmetric while the contact stays near zero: that is the rarefaction-rarefaction signature.
      </p>
    </div>
  )
}
