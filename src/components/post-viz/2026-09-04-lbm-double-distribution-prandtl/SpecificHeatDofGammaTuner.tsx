'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The second constant the lattice locks.
//
// If internal energy lives only in the D translational directions of the
// lattice, then  c_v = (D + n0) R / 2  with n0 = 0, hence
//
//     gamma = 1 + 2 / (D + n0)
//
// D2Q9 -> gamma = 2, D3Q19 -> gamma = 5/3.  Neither is air.  Adding n0 extra
// internal degrees of freedom to the energy distribution buys gamma back.
//
// The strip below fires two acoustic pulses at once: the lattice one at
// sqrt(gamma_lattice) and the real gas one at sqrt(gamma_target).  A wrong
// gamma is a wrong sound speed, and the gap opens as they travel.
// ---------------------------------------------------------------------------

const W = 760
const H = 400

const XL = 46
const XR = 716
const DUCT_T = 74
const DUCT_B = 172

const BAR_T = 250
const BAR_B = 292
const G_MIN = 1.2
const G_MAX = 2.1

const COL_LAT = '#38bdf8'
const COL_TGT = '#4ade80'
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.30)'

const GASES: Array<{ name: string; gamma: number }> = [
  { name: 'steam', gamma: 4 / 3 },
  { name: 'air', gamma: 1.4 },
  { name: 'argon', gamma: 5 / 3 },
]

export function SpecificHeatDofGammaTuner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dim, setDim] = useState(2)
  const [n0, setN0] = useState(0)
  const [gasIdx, setGasIdx] = useState(1)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [read, setRead] = useState({ gamma: 2, cv: 1, gap: 0 })

  const st = useRef({ dim, n0, gasIdx, running, speed })
  st.current = { dim, n0, gasIdx, running, speed }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let phase = 0 // travel parameter of the target pulse, 0..1

    const pulse = (x: number, color: string, label: string, up: boolean) => {
      const g = ctx.createLinearGradient(x - 26, 0, x + 26, 0)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(0.5, color)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.globalAlpha = 0.55
      ctx.fillRect(x - 26, DUCT_T + 2, 52, DUCT_B - DUCT_T - 4)
      ctx.globalAlpha = 1

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, DUCT_T + 2)
      ctx.lineTo(x, DUCT_B - 2)
      ctx.stroke()

      ctx.fillStyle = color
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(label, x - 14, up ? DUCT_T - 8 : DUCT_B + 16)
    }

    const draw = () => {
      const s = st.current
      const gLat = 1 + 2 / (s.dim + s.n0)
      const gTgt = GASES[s.gasIdx].gamma
      const aLat = Math.sqrt(gLat)
      const aTgt = Math.sqrt(gTgt)

      if (s.running) phase += 0.0034 * s.speed
      if (phase > 1) phase = 0

      const xT = XL + phase * (XR - XL)
      const xL = XL + phase * (aLat / aTgt) * (XR - XL)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      // duct
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(XL, DUCT_T, XR - XL, DUCT_B - DUCT_T)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('acoustic pulse launched at x = 0, t = 0', XL, DUCT_T - 26)

      pulse(xT, COL_TGT, `real ${GASES[s.gasIdx].name}`, true)
      pulse(Math.min(xL, XR + 40), COL_LAT, 'lattice', false)

      // gap ruler
      const gapPx = xL - xT
      if (Math.abs(gapPx) > 2) {
        const y = (DUCT_T + DUCT_B) / 2
        ctx.strokeStyle = '#f87171'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(xT, y)
        ctx.lineTo(Math.min(xL, XR), y)
        ctx.stroke()
        ctx.fillStyle = '#f87171'
        ctx.fillText(`${(100 * (aLat / aTgt - 1)).toFixed(1)}% sound speed error`, Math.min(xT + 6, XR - 170), y - 8)
      }

      // gamma bar
      const gx = (g: number) => XL + ((g - G_MIN) / (G_MAX - G_MIN)) * (XR - XL)
      ctx.strokeStyle = COL_AX
      ctx.beginPath()
      ctx.moveTo(XL, BAR_B)
      ctx.lineTo(XR, BAR_B)
      ctx.stroke()
      ctx.fillStyle = COL_TXT
      ctx.fillText('gamma  =  1 + 2 / (D + n0)', XL, BAR_T - 12)
      for (let g = 1.2; g <= 2.101; g += 0.1) {
        ctx.strokeStyle = COL_AX
        ctx.beginPath()
        ctx.moveTo(gx(g), BAR_B)
        ctx.lineTo(gx(g), BAR_B + 5)
        ctx.stroke()
        ctx.fillStyle = COL_TXT
        ctx.fillText(g.toFixed(1), gx(g) - 9, BAR_B + 18)
      }
      for (const gas of GASES) {
        ctx.strokeStyle = COL_TGT
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(gx(gas.gamma), BAR_T)
        ctx.lineTo(gx(gas.gamma), BAR_B)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = COL_TGT
        ctx.fillText(gas.name, gx(gas.gamma) - 12, BAR_T - 26)
      }
      ctx.fillStyle = COL_LAT
      ctx.beginPath()
      ctx.moveTo(gx(gLat), BAR_T - 4)
      ctx.lineTo(gx(gLat) - 7, BAR_T - 16)
      ctx.lineTo(gx(gLat) + 7, BAR_T - 16)
      ctx.closePath()
      ctx.fill()
      ctx.fillRect(gx(gLat) - 2, BAR_T - 4, 4, BAR_B - BAR_T + 4)

      // readout block
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(`D = ${s.dim}   n0 = ${s.n0.toFixed(1)}`, XL, BAR_B + 46)
      ctx.fillStyle = COL_LAT
      ctx.fillText(`c_v = ${((s.dim + s.n0) / 2).toFixed(2)} R`, XL + 150, BAR_B + 46)
      ctx.fillText(`gamma = ${gLat.toFixed(3)}`, XL + 290, BAR_B + 46)
      ctx.fillStyle = COL_TGT
      ctx.fillText(`target = ${gTgt.toFixed(3)}`, XL + 430, BAR_B + 46)
      ctx.fillStyle = Math.abs(gLat - gTgt) < 0.005 ? COL_TGT : '#f87171'
      ctx.fillText(`${(100 * (gLat / gTgt - 1)).toFixed(1)}%`, XL + 580, BAR_B + 46)

      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('n0 = 0 is what a bare velocity lattice gives you', XL, BAR_B + 68)

      if (frame % 14 === 0) {
        setReadRef.current({ gamma: gLat, cv: (s.dim + s.n0) / 2, gap: 100 * (aLat / aTgt - 1) })
      }
      frame += 1
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const snap = () => {
    const need = 2 / (GASES[gasIdx].gamma - 1) - dim
    setN0(Math.max(0, Math.min(8, Math.round(need * 2) / 2)))
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
        <button style={btn(dim === 2)} onClick={() => setDim(2)}>
          D2Q9
        </button>
        <button style={btn(dim === 3)} onClick={() => setDim(3)}>
          D3Q19
        </button>
        {GASES.map((g, i) => (
          <button key={g.name} style={btn(gasIdx === i)} onClick={() => setGasIdx(i)}>
            {g.name}
          </button>
        ))}
        <button style={btn(false)} onClick={snap}>
          → n0 that matches
        </button>
      </div>
      <div style={rowS}>
        <label style={label}>
          <span style={nameS}>n0 extra DOF</span>
          <input type="range" min={0} max={8} step={0.5} value={n0} onChange={(e) => setN0(parseFloat(e.target.value))} />
          <span style={mono}>{n0.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>speed</span>
          <input type="range" min={0.3} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={mono}>{speed.toFixed(1)}x</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span style={{ color: COL_LAT }}>gamma {read.gamma.toFixed(3)}</span>
        <span style={{ color: COL_LAT }}>c_v {read.cv.toFixed(2)} R</span>
        <span style={{ color: Math.abs(read.gap) < 0.3 ? COL_TGT : '#f87171' }}>sound speed {read.gap.toFixed(1)}%</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Start at n0 = 0 with D2Q9: gamma = 2, and the blue pulse runs 19% fast against air. Drag n0 until the blue marker lands on
        the dashed line — the number you land on is how many internal degrees of freedom the energy distribution has to carry.
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
