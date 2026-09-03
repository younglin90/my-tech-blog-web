'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One relaxation time or two.
//
//   top    : a shear wave  u_x(y) = A_u sin(k y),  decays at rate  nu * k^2
//   bottom : a thermal wave T(y)  = A_T sin(k y),  decays at rate  alpha * k^2
//
//   nu    = cs2 * (tau_f - 1/2)
//   alpha = cs2 * (tau_g - 1/2)
//
// With a single distribution function the same tau does both jobs, so the two
// envelopes are the same curve and Pr = nu/alpha is pinned at 1.  Unlock tau_g
// and the two curves separate.  The right-hand chart is where you see it.
// ---------------------------------------------------------------------------

const W = 760
const H = 436

const CS2 = 1 / 3
const KK = 0.01 // k^2 in lattice units
const WAVES = 1.5

const XL = 44
const XR = 470
const CXL = 528 // envelope chart
const CXR = 744
const CYT = 60
const CYB = 372

const A_MID = 128
const A_H = 62
const B_MID = 300
const B_H = 62

const T_MAX = 1400 // lattice steps shown on the chart

const COL_U = '#38bdf8'
const COL_T = '#fb923c'
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.30)'

function tempColor(v: number) {
  // v in [-1, 1] : cold blue -> neutral -> hot orange
  const c = Math.max(-1, Math.min(1, v))
  if (c >= 0) return `rgba(251,146,60,${0.10 + 0.75 * c})`
  return `rgba(56,189,248,${0.10 + 0.75 * -c})`
}

export function PrandtlLockTwinDecay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tauF, setTauF] = useState(0.8)
  const [tauG, setTauG] = useState(0.8)
  const [locked, setLocked] = useState(true)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [read, setRead] = useState({ t: 0, au: 1, at: 1, pr: 1 })

  const st = useRef({ tauF, tauG, locked, running, speed })
  st.current = { tauF, tauG, locked, running, speed }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let t = 0
    let hist: Array<[number, number, number]> = []

    const drawWave = (mid: number, half: number, amp: number, color: string, paint: boolean) => {
      if (paint) {
        const cols = 48
        for (let i = 0; i < cols; i++) {
          const xn = i / cols
          const v = amp * Math.sin(2 * Math.PI * WAVES * (xn + 0.5 / cols))
          ctx.fillStyle = tempColor(v)
          ctx.fillRect(XL + xn * (XR - XL), mid - half, (XR - XL) / cols + 0.6, 2 * half)
        }
      }
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(XL, mid)
      ctx.lineTo(XR, mid)
      ctx.stroke()

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 160; i++) {
        const xn = i / 160
        const y = mid - amp * half * Math.sin(2 * Math.PI * WAVES * xn)
        if (i === 0) ctx.moveTo(XL + xn * (XR - XL), y)
        else ctx.lineTo(XL + xn * (XR - XL), y)
      }
      ctx.stroke()

      // faint envelope of the initial amplitude
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.setLineDash([3, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(XL, mid - half)
      ctx.lineTo(XR, mid - half)
      ctx.moveTo(XL, mid + half)
      ctx.lineTo(XR, mid + half)
      ctx.stroke()
      ctx.setLineDash([])
    }

    const draw = () => {
      const s = st.current
      const tf = s.tauF
      const tg = s.locked ? s.tauF : s.tauG
      const nu = CS2 * (tf - 0.5)
      const al = CS2 * (tg - 0.5)

      if (s.running) t += 7 * s.speed
      if (t > T_MAX) {
        t = 0
        hist = []
      }

      const au = Math.exp(-nu * KK * t)
      const at = Math.exp(-al * KK * t)
      hist.push([t, au, at])
      if (hist.length > 1600) hist.shift()

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = COL_U
      ctx.fillText('shear wave  u_x(y)   decay rate = nu k^2', XL, A_MID - A_H - 14)
      drawWave(A_MID, A_H, au, COL_U, false)

      // velocity arrows so the top panel reads as momentum, not just a curve
      ctx.strokeStyle = COL_U
      ctx.lineWidth = 1.4
      for (let i = 0; i < 14; i++) {
        const xn = (i + 0.5) / 14
        const x = XL + xn * (XR - XL)
        const v = au * Math.sin(2 * Math.PI * WAVES * xn)
        const len = v * A_H * 0.78
        ctx.beginPath()
        ctx.moveTo(x, A_MID)
        ctx.lineTo(x, A_MID - len)
        ctx.stroke()
        if (Math.abs(len) > 4) {
          const d = len > 0 ? 1 : -1
          ctx.beginPath()
          ctx.moveTo(x, A_MID - len)
          ctx.lineTo(x - 3, A_MID - len + 4 * d)
          ctx.lineTo(x + 3, A_MID - len + 4 * d)
          ctx.closePath()
          ctx.fillStyle = COL_U
          ctx.fill()
        }
      }

      ctx.fillStyle = COL_T
      ctx.fillText('thermal wave  T(y)   decay rate = alpha k^2', XL, B_MID - B_H - 14)
      drawWave(B_MID, B_H, at, COL_T, true)

      ctx.fillStyle = COL_TXT
      ctx.fillText('y  (one wavelength = 2pi/k)', XL, H - 12)
      ctx.fillText(`step ${Math.round(t)}`, XR - 74, H - 12)

      // ---- envelope chart ----
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(CXL, CYT)
      ctx.lineTo(CXL, CYB)
      ctx.lineTo(CXR, CYB)
      ctx.stroke()

      ctx.fillStyle = COL_TXT
      ctx.fillText('amplitude', CXL - 4, CYT - 26)
      ctx.fillText('1.0', CXL - 26, CYT + 4)
      ctx.fillText('0.0', CXL - 26, CYB + 4)
      ctx.fillText('0    lattice steps    ' + T_MAX, CXL - 2, CYB + 18)

      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.setLineDash([2, 4])
      for (const f of [0.25, 0.5, 0.75]) {
        const y = CYB - f * (CYB - CYT)
        ctx.beginPath()
        ctx.moveTo(CXL, y)
        ctx.lineTo(CXR, y)
        ctx.stroke()
      }
      ctx.setLineDash([])

      const px = (tt: number) => CXL + (tt / T_MAX) * (CXR - CXL)
      const py = (a: number) => CYB - a * (CYB - CYT)
      for (const [idx, col] of [[1, COL_T], [2, COL_U]] as Array<[number, string]>) {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        hist.forEach((h, i) => {
          const y = py(idx === 2 ? h[1] : h[2])
          if (i === 0) ctx.moveTo(px(h[0]), y)
          else ctx.lineTo(px(h[0]), y)
        })
        ctx.stroke()
      }

      ctx.fillStyle = COL_U
      ctx.fillText('u_x', CXR - 60, CYT + 16)
      ctx.fillStyle = COL_T
      ctx.fillText('T', CXR - 24, CYT + 16)

      const pr = al > 1e-9 ? nu / al : 99
      ctx.fillStyle = s.locked ? '#f87171' : '#4ade80'
      ctx.font = 'bold 13px ui-monospace, monospace'
      ctx.fillText(`Pr = ${pr.toFixed(3)}`, CXL, CYT - 8)
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = COL_TXT
      ctx.fillText(s.locked ? 'single f : tau_g = tau_f' : 'f and g : tau_g free', CXL, CYT - 42)

      if (frame % 12 === 0) {
        setReadRef.current({ t: Math.round(t), au, at, pr })
      }
      frame += 1
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const tgEff = locked ? tauF : tauG
  const nu = CS2 * (tauF - 0.5)
  const al = CS2 * (tgEff - 0.5)

  const setTarget = (pr: number) => {
    setLocked(false)
    setTauG(Math.max(0.51, Math.min(2.4, 0.5 + nu / (pr * CS2))))
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        <button style={btn(locked)} onClick={() => setLocked((p) => !p)}>
          {locked ? '🔒 single distribution' : '🔓 double distribution'}
        </button>
        <button style={btn(false)} onClick={() => setTarget(0.71)}>
          air  Pr = 0.71
        </button>
        <button style={btn(false)} onClick={() => setTarget(7)}>
          water  Pr = 7
        </button>
      </div>
      <div style={rowS}>
        <label style={label}>
          <span style={nameS}>tau_f (momentum)</span>
          <input type="range" min={0.55} max={1.6} step={0.01} value={tauF} onChange={(e) => setTauF(parseFloat(e.target.value))} />
          <span style={mono}>{tauF.toFixed(2)}</span>
        </label>
        <label style={{ ...label, opacity: locked ? 0.4 : 1 }}>
          <span style={nameS}>tau_g (energy)</span>
          <input
            type="range"
            min={0.51}
            max={2.4}
            step={0.01}
            value={tgEff}
            disabled={locked}
            onChange={(e) => setTauG(parseFloat(e.target.value))}
          />
          <span style={mono}>{tgEff.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>speed</span>
          <input type="range" min={0.3} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={mono}>{speed.toFixed(1)}x</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span style={{ color: COL_U }}>nu {nu.toFixed(4)}</span>
        <span style={{ color: COL_T }}>alpha {al.toFixed(4)}</span>
        <span style={{ color: locked ? '#f87171' : '#4ade80' }}>Pr {read.pr.toFixed(3)}</span>
        <span>step {read.t}</span>
        <span style={{ color: COL_U }}>A_u {read.au.toFixed(3)}</span>
        <span style={{ color: COL_T }}>A_T {read.at.toFixed(3)}</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Locked, the orange curve hides underneath the blue one at every tau_f you try — one relaxation time cannot hold two
        transport coefficients apart. Unlock it and drag tau_g: the thermal wave now outlives the shear wave (Pr &gt; 1) or dies
        first (Pr &lt; 1).
      </div>
    </div>
  )
}

const rowS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
  marginTop: '0.6rem',
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 12 }
const nameS: CSSProperties = { color: '#94a3b8' }
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 44 }

function btn(active: boolean): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
