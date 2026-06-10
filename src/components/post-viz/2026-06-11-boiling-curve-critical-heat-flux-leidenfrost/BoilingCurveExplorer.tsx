'use client'

import { useEffect, useRef, useState } from 'react'

// Pool boiling curve for water at 1 atm.
// Returns wall heat flux q" (W/m^2) as a function of the wall excess
// temperature dTe = Ts - Tsat (degrees C).
function boilingFlux(dTe: number): number {
  if (dTe <= 0) return 0
  if (dTe < 5) {
    // Free convection regime ~ dTe^1.25
    return 780 * Math.pow(dTe, 1.25)
  }
  if (dTe < 30) {
    // Nucleate boiling, Rohsenow-like ~ dTe^3, reaching CHF at dTe ~ 30
    return 46.7 * Math.pow(dTe, 3)
  }
  if (dTe < 120) {
    // Transition boiling: q" falls log-linearly from CHF to the Leidenfrost minimum
    const t = (dTe - 30) / (120 - 30)
    const logq = Math.log10(1.26e6) * (1 - t) + Math.log10(1.9e4) * t
    return Math.pow(10, logq)
  }
  // Film boiling: q" climbs again (conduction + radiation through the vapor film)
  const t = Math.min((dTe - 120) / (1000 - 120), 1)
  const logq = Math.log10(1.9e4) * (1 - t) + Math.log10(1.2e6) * t
  return Math.pow(10, logq)
}

const CHF = 1.26e6 // critical heat flux, point C
const Q_MIN = 1.9e4 // Leidenfrost minimum, point D

function regimeOf(dTe: number): { name: string; color: string } {
  if (dTe < 5) return { name: 'Free convection', color: '#7a90a8' }
  if (dTe < 30) return { name: 'Nucleate boiling', color: '#22d3ee' }
  if (dTe < 120) return { name: 'Transition boiling', color: '#f59e0b' }
  return { name: 'Film boiling', color: '#ef4444' }
}

// Map data to canvas using log-log axes.
const DTE_MIN = 1
const DTE_MAX = 1000
const Q_LO = 1e3
const Q_HI = 1e7

export function BoilingCurveExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [control, setControl] = useState<'temp' | 'flux'>('temp')
  // Slider position 0..1000 mapped to dTe (temp mode) directly.
  const [dTe, setDTe] = useState(20)
  // In flux mode the user sets q" directly (log slider 0..100 -> Q_LO..CHF*1.05)
  const [fluxPos, setFluxPos] = useState(50)

  // Resolve the operating point.
  let opDTe = dTe
  let opQ = boilingFlux(dTe)
  let burnout = false
  if (control === 'flux') {
    const logq = Math.log10(Q_LO) + (fluxPos / 100) * (Math.log10(CHF * 1.04) - Math.log10(Q_LO))
    const qSet = Math.pow(10, logq)
    opQ = qSet
    if (qSet <= CHF) {
      // On the nucleate branch: invert q" = 46.7 dTe^3 (or free-conv below 5)
      if (qSet < boilingFlux(5)) {
        opDTe = Math.pow(qSet / 780, 1 / 1.25)
      } else {
        opDTe = Math.pow(qSet / 46.7, 1 / 3)
      }
    } else {
      // Flux exceeds CHF: the heater jumps to the film-boiling branch.
      burnout = true
      // Find dTe on the film branch matching qSet (>120)
      const t =
        (Math.log10(Math.max(qSet, Q_MIN)) - Math.log10(Q_MIN)) /
        (Math.log10(1.2e6) - Math.log10(Q_MIN))
      opDTe = 120 + Math.min(Math.max(t, 0), 1) * (1000 - 120)
    }
  }

  const regime = burnout ? { name: 'BURNOUT → Film boiling', color: '#ef4444' } : regimeOf(opDTe)
  const hCoeff = opDTe > 0 ? opQ / opDTe : 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const padL = 56
    const padR = 16
    const padT = 16
    const padB = 40
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const xOf = (d: number) =>
      padL + ((Math.log10(d) - Math.log10(DTE_MIN)) / (Math.log10(DTE_MAX) - Math.log10(DTE_MIN))) * plotW
    const yOf = (q: number) =>
      padT + (1 - (Math.log10(q) - Math.log10(Q_LO)) / (Math.log10(Q_HI) - Math.log10(Q_LO))) * plotH

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1626'
    ctx.fillRect(0, 0, W, H)

    // Grid (log decades)
    ctx.strokeStyle = 'rgba(122,144,168,0.18)'
    ctx.fillStyle = '#7a90a8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.lineWidth = 1
    for (let e = 0; e <= 3; e++) {
      const d = Math.pow(10, e)
      const x = xOf(d)
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
      ctx.stroke()
      ctx.fillText(`${d}`, x - 6, H - 22)
    }
    for (let e = 3; e <= 7; e++) {
      const q = Math.pow(10, e)
      const y = yOf(q)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
      ctx.fillText(`10^${e}`, 6, y + 4)
    }
    ctx.fillText('ΔTe = Ts − Tsat  (°C)', padL + plotW / 2 - 60, H - 6)
    ctx.save()
    ctx.translate(14, padT + plotH / 2 + 50)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('q″  (W/m²)', 0, 0)
    ctx.restore()

    // The boiling curve, colored by regime.
    let prevX = 0
    let prevY = 0
    let first = true
    for (let i = 0; i <= 400; i++) {
      const d = Math.pow(10, Math.log10(DTE_MIN) + (i / 400) * (Math.log10(DTE_MAX) - Math.log10(DTE_MIN)))
      const q = boilingFlux(d)
      const x = xOf(d)
      const y = yOf(q)
      if (!first) {
        ctx.strokeStyle = regimeOf(d).color
        ctx.lineWidth = 2.4
        ctx.beginPath()
        ctx.moveTo(prevX, prevY)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      prevX = x
      prevY = y
      first = false
    }

    // Mark CHF (C) and Leidenfrost (D)
    const markPoint = (d: number, q: number, label: string, color: string) => {
      const x = xOf(d)
      const y = yOf(q)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(label, x + 7, y - 6)
    }
    markPoint(30, CHF, 'C: CHF', '#22d3ee')
    markPoint(120, Q_MIN, 'D: Leidenfrost', '#ef4444')

    // Burnout jump arrow (flux mode beyond CHF)
    if (burnout) {
      const x1 = xOf(30)
      const y1 = yOf(CHF)
      const x2 = xOf(opDTe)
      const y2 = yOf(opQ)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1.6
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Operating point marker
    const ox = xOf(Math.max(opDTe, DTE_MIN))
    const oy = yOf(Math.max(opQ, Q_LO))
    ctx.strokeStyle = '#fafaf9'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ox, padT)
    ctx.lineTo(ox, padT + plotH)
    ctx.stroke()
    ctx.fillStyle = burnout ? '#ef4444' : '#fafaf9'
    ctx.beginPath()
    ctx.arc(ox, oy, 6, 0, Math.PI * 2)
    ctx.fill()
  }, [opDTe, opQ, burnout])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setControl('temp')}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: control === 'temp' ? '#22d3ee' : 'transparent',
            color: control === 'temp' ? '#08111f' : 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Temperature control
        </button>
        <button
          onClick={() => setControl('flux')}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: control === 'flux' ? '#f59e0b' : 'transparent',
            color: control === 'flux' ? '#08111f' : 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Heat-flux control
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={620}
        height={360}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />

      <div style={{ marginTop: 14 }}>
        {control === 'temp' ? (
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)' }}>
            Wall excess temperature ΔTe = {dTe.toFixed(0)} °C
            <input
              type="range"
              min={1}
              max={1000}
              step={1}
              value={dTe}
              onChange={(e) => setDTe(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#22d3ee' }}
            />
          </label>
        ) : (
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)' }}>
            Applied heat flux q″ = {(opQ / 1e6).toFixed(2)} MW/m²
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={fluxPos}
              onChange={(e) => setFluxPos(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
          </label>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 8,
          fontSize: 13,
        }}
      >
        <Stat label="Regime" value={regime.name} color={regime.color} />
        <Stat label="ΔTe" value={`${opDTe.toFixed(0)} °C`} />
        <Stat label="q″" value={`${(opQ / 1e6).toFixed(2)} MW/m²`} />
        <Stat label="h = q″/ΔTe" value={`${(hCoeff / 1e3).toFixed(1)} kW/m²K`} />
      </div>

      {burnout && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          🔥 BURNOUT — q″ exceeded the critical heat flux. The operating point jumps across to the
          film-boiling branch (ΔTe ≈ {opDTe.toFixed(0)} °C). A real heater wire melts here.
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  )
}
