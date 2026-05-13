'use client'

import { useEffect, useRef, useState } from 'react'

type Mode = 'momentum' | 'heat' | 'mass'

type Spec = {
  label: string
  fieldName: string
  fluxName: string
  coefName: string
  coefSym: string
  coefValue: number
  topLabel: string
  bottomLabel: string
  color: string
  units: string
}

const MODES: Record<Mode, Spec> = {
  momentum: {
    label: "Newton's law of viscosity",
    fieldName: 'u(y)',
    fluxName: 'τ',
    coefName: 'dynamic viscosity',
    coefSym: 'μ',
    coefValue: 1.8e-5,
    topLabel: 'u_top',
    bottomLabel: 'u = 0',
    color: '#22d3ee',
    units: 'Pa',
  },
  heat: {
    label: "Fourier's law of conduction",
    fieldName: 'T(y)',
    fluxName: 'q',
    coefName: 'thermal conductivity',
    coefSym: 'λ',
    coefValue: 0.026,
    topLabel: 'T_top',
    bottomLabel: 'T = 0',
    color: '#f97316',
    units: 'W/m²',
  },
  mass: {
    label: "Fick's law of diffusion",
    fieldName: 'C(y)',
    fluxName: 'j',
    coefName: 'mass diffusivity',
    coefSym: 'D',
    coefValue: 2e-5,
    topLabel: 'C_top',
    bottomLabel: 'C = 0',
    color: '#a78bfa',
    units: 'mol/m²·s',
  },
}

const W = 520
const H = 280

export function TransportTriadGradients() {
  const [mode, setMode] = useState<Mode>('momentum')
  const [topValue, setTopValue] = useState(1.0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const spec = MODES[mode]
    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)

    const X0 = 50
    const X1 = 280
    const Y0 = 30
    const Y1 = 240
    const PW = X1 - X0
    const PH = Y1 - Y0

    ctx.strokeStyle = '#334155'
    ctx.strokeRect(X0, Y0, PW, PH)

    ctx.fillStyle = spec.color
    ctx.fillRect(X0, Y0 - 6, PW, 4)
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(X0, Y1 + 2, PW, 4)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '11px system-ui'
    ctx.fillText(spec.topLabel + ' = ' + topValue.toFixed(2), X1 + 6, Y0 + 4)
    ctx.fillText(spec.bottomLabel, X1 + 6, Y1 + 4)

    ctx.strokeStyle = spec.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(X0, Y1)
    ctx.lineTo(X0 + PW * (topValue / 2.0), Y0)
    ctx.stroke()
    ctx.lineWidth = 1

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText(spec.fieldName, X0 + 6, Y0 - 8)
    ctx.fillText('y →', X0 - 24, Y0 + 12)

    const arrowX = X1 + 60
    const arrowYs = [Y0 + 30, Y0 + 70, Y0 + 110, Y0 + 150, Y0 + 190]
    ctx.strokeStyle = spec.color
    ctx.fillStyle = spec.color
    for (const y of arrowYs) {
      const len = 22 + topValue * 12
      ctx.beginPath()
      ctx.moveTo(arrowX, y)
      ctx.lineTo(arrowX + len, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(arrowX + len, y)
      ctx.lineTo(arrowX + len - 4, y - 3)
      ctx.lineTo(arrowX + len - 4, y + 3)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '12px system-ui'
    ctx.fillText('flux ' + spec.fluxName + ' →', arrowX, Y0 + 16)

    const grad = topValue / 1.0
    const flux = spec.coefValue * grad
    ctx.fillStyle = '#f59e0b'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText(spec.fluxName + ' = ' + spec.coefSym + ' · d' + spec.fieldName.split('(')[0] + '/dy', X0, H - 22)
    ctx.fillText(spec.coefSym + ' = ' + spec.coefValue.toExponential(1) + '   gradient = ' + grad.toFixed(2), X0, H - 6)

    ctx.fillStyle = '#64748b'
    ctx.font = '11px system-ui'
    ctx.fillText(spec.label, X0, Y0 + PH + 28)
  }, [mode, topValue])

  const modes: { id: Mode; label: string }[] = [
    { id: 'momentum', label: 'Newton (τ)' },
    { id: 'heat', label: 'Fourier (q)' },
    { id: 'mass', label: 'Fick (j)' },
  ]

  return (
    <div
      style={{
        background: '#0e1a2e',
        padding: 16,
        borderRadius: 8,
        margin: '24px 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}
      />
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          flexWrap: 'wrap',
          color: '#cbd5e1',
          fontSize: 13,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: '6px 12px',
                background: mode === m.id ? '#22d3ee' : 'transparent',
                color: mode === m.id ? '#08111f' : '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', minWidth: 200 }}>
          <span>boundary value = {topValue.toFixed(2)}</span>
          <input
            type="range"
            min="0"
            max="2.0"
            step="0.05"
            value={topValue}
            onChange={(e) => setTopValue(Number(e.target.value))}
            style={{ accentColor: '#22d3ee' }}
          />
        </label>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        Same linear profile, three different fields. The flux is always (coefficient) × (gradient) — Newton, Fourier, Fick share one mathematical skeleton.
      </div>
    </div>
  )
}
