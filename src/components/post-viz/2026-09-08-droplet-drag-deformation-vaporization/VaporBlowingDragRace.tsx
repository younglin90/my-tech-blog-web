'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Four droplets leave the same nozzle at the same speed. Only the drag law
// differs:
//
//   A  C_D = 24/Re (1 + Re^(2/3)/6)                      rigid sphere
//   B  A x (1 + 2.632 y)                                 TAB distortion
//   C  24/Re (1 + 0.2 Re^0.63) (1 + B_M)^-0.2            Renksizbulut-Yuen
//   D  C plus the d^2-law:  d^2 = d0^2 - K t             blowing + shrinking
//
// C has the LOWEST drag coefficient of the four. D uses that same coefficient
// and still dies first, because deceleration goes as C_D / d and d is falling.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const RHO_L = 620
const SIG = 0.0145
const MU_L = 3.0e-4
const MU_G = 3.3e-5
const RHO_G = 4.98

const CF = 1 / 3
const CK = 8
const CDT = 5
const CB = 0.5

const T_END = 1.0e-3
const DT_PHYS = 5e-8
const SUB = 84 // physical steps per animation frame

const LANE_X0 = 56
const LANE_X1 = 700
const LANE_Y0 = 44
const LANE_DY = 62
const X_MAX_MM = 11

const COLS = ['#94a3b8', '#fbbf24', '#4ade80', '#38bdf8']
const NAMES = ['A  sphere', 'B  sphere x TAB', 'C  blowing only', 'D  blowing + d2-law']
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.28)'

function cdSphere(re: number) {
  if (re < 1e-8) return 0
  return re < 1000 ? (24 / re) * (1 + Math.pow(re, 2 / 3) / 6) : 0.424
}

function cdBlowing(re: number, bm: number) {
  if (re < 1e-8) return 0
  return (24 / re) * (1 + 0.2 * Math.pow(re, 0.63)) * Math.pow(1 + bm, -0.2)
}

type Drop = { u: number; x: number; d: number; y: number; ydot: number; cd: number }

type S = { u0: number; d0Um: number; bm: number; kEvap: number; run: boolean }

export function VaporBlowingDragRace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [u0, setU0] = useState(25)
  const [d0Um, setD0Um] = useState(40)
  const [bm, setBm] = useState(0.6)
  const [kEvap, setKEvap] = useState(1.0)
  const [run, setRun] = useState(true)
  const [read, setRead] = useState({ t: 0, x: [0, 0, 0, 0], u: [0, 0, 0, 0], cd: [0, 0, 0, 0], d: [0, 0, 0, 0] })

  const st = useRef<S>({ u0, d0Um, bm, kEvap, run })
  st.current = { u0, d0Um, bm, kEvap, run }

  const resetRef = useRef(0)
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let drops: Drop[] = []
    let t = 0
    let trails: number[][] = []
    let lastKey = ''
    let lastReset = -1

    const init = () => {
      const s = st.current
      const d0 = s.d0Um * 1e-6
      drops = [0, 1, 2, 3].map(() => ({ u: s.u0, x: 0, d: d0, y: 0, ydot: 0, cd: 0 }))
      trails = [[], [], [], []]
      t = 0
    }

    const step = () => {
      const s = st.current
      const k = s.kEvap * 1e-6
      for (let n = 0; n < SUB; n++) {
        if (t >= T_END) return
        for (let i = 0; i < 4; i++) {
          const dr = drops[i]
          if (dr.u <= 1e-6 || dr.d <= 2e-6) continue
          const re = (RHO_G * dr.u * dr.d) / MU_G
          let cd: number
          if (i === 0) {
            cd = cdSphere(re)
          } else if (i === 1) {
            const r = 0.5 * dr.d
            const acc =
              (CF / CB) * (RHO_G * dr.u * dr.u) / (RHO_L * r * r) -
              ((CK * SIG) / (RHO_L * r * r * r)) * dr.y -
              ((CDT * MU_L) / (RHO_L * r * r)) * dr.ydot
            dr.ydot += acc * DT_PHYS
            dr.y = Math.max(0, Math.min(1, dr.y + dr.ydot * DT_PHYS))
            cd = cdSphere(re) * (1 + 2.632 * dr.y)
          } else {
            cd = cdBlowing(re, s.bm)
          }
          dr.cd = cd
          dr.u += (-0.75 * RHO_G * cd * dr.u * dr.u) / (RHO_L * dr.d) * DT_PHYS
          dr.x += dr.u * DT_PHYS
          if (i === 3) dr.d = Math.sqrt(Math.max(4e-12, dr.d * dr.d - k * DT_PHYS))
        }
        t += DT_PHYS
      }
    }

    const draw = () => {
      const s = st.current
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      const px = (xm: number) => LANE_X0 + (LANE_X1 - LANE_X0) * Math.min(1, xm / X_MAX_MM)

      // ruler
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.fillStyle = COL_TXT
      ctx.font = '10px ui-monospace, monospace'
      for (let mm = 0; mm <= X_MAX_MM; mm++) {
        const X = px(mm)
        ctx.beginPath()
        ctx.moveTo(X, LANE_Y0 - 16)
        ctx.lineTo(X, LANE_Y0 - 10)
        ctx.stroke()
        if (mm % 2 === 0) ctx.fillText(String(mm), X - 3, LANE_Y0 - 20)
      }
      ctx.fillText('penetration [mm]', LANE_X0, 18)
      ctx.fillText(`t = ${(t * 1e3).toFixed(3)} ms`, LANE_X1 - 70, 18)

      for (let i = 0; i < 4; i++) {
        const yLane = LANE_Y0 + i * LANE_DY + 22
        ctx.strokeStyle = 'rgba(148,163,184,0.16)'
        ctx.beginPath()
        ctx.moveTo(LANE_X0, yLane)
        ctx.lineTo(LANE_X1, yLane)
        ctx.stroke()

        ctx.fillStyle = COLS[i]
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(NAMES[i], LANE_X0, yLane - 22)

        // trail: one dot every stored sample
        const tr = trails[i]
        for (let j = 0; j < tr.length; j++) {
          ctx.beginPath()
          ctx.arc(px(tr[j]), yLane, 1.4, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(148,163,184,0.35)'
          ctx.fill()
        }

        const dr = drops[i]
        const rPix = Math.max(3, (dr.d / (s.d0Um * 1e-6)) * 11)
        ctx.beginPath()
        ctx.arc(px(dr.x * 1e3), yLane, rPix, 0, Math.PI * 2)
        ctx.fillStyle = COLS[i] + '55'
        ctx.fill()
        ctx.strokeStyle = COLS[i]
        ctx.lineWidth = 1.6
        ctx.stroke()

        // velocity as a short arrow scaled by u / u0
        const arrow = 34 * (dr.u / Math.max(1e-6, s.u0))
        if (arrow > 2) {
          const X = px(dr.x * 1e3)
          ctx.beginPath()
          ctx.moveTo(X + rPix + 3, yLane)
          ctx.lineTo(X + rPix + 3 + arrow, yLane)
          ctx.moveTo(X + rPix + 3 + arrow, yLane)
          ctx.lineTo(X + rPix - 2 + arrow, yLane - 3)
          ctx.moveTo(X + rPix + 3 + arrow, yLane)
          ctx.lineTo(X + rPix - 2 + arrow, yLane + 3)
          ctx.strokeStyle = COLS[i]
          ctx.lineWidth = 1.2
          ctx.stroke()
        }

        ctx.textAlign = 'right'
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(
          `x ${(dr.x * 1e3).toFixed(3)} mm   u ${dr.u.toFixed(2)} m/s   C_D ${dr.cd.toFixed(3)}   d ${(dr.d * 1e6).toFixed(1)} um`,
          LANE_X1,
          yLane - 22,
        )
        ctx.textAlign = 'left'
      }

      // finish marker at the sphere's own final position, for reference
      ctx.fillStyle = '#64748b'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(
        t >= T_END
          ? 'race over at t = 1 ms.  C has the smallest C_D and wins; D uses the same C_D and comes back short.'
          : 'each lane integrates m du/dt = -1/2 rho_g C_D A u|u| with its own C_D',
        LANE_X0,
        H - 16,
      )
    }

    let raf = 0
    let frame = 0
    init()
    const loop = () => {
      frame++
      if (resetRef.current !== lastReset) {
        lastReset = resetRef.current
        init()
      }
      const s = st.current
      const key = `${s.u0}|${s.d0Um}|${s.bm}|${s.kEvap}`
      if (key !== lastKey) {
        lastKey = key
        init()
      }
      if (s.run && t < T_END) {
        step()
        if (frame % 2 === 0) for (let i = 0; i < 4; i++) trails[i].push(drops[i].x * 1e3)
      }
      draw()
      if (frame % 8 === 0) {
        setReadRef.current({
          t,
          x: drops.map((d) => d.x * 1e3),
          u: drops.map((d) => d.u),
          cd: drops.map((d) => d.cd),
          d: drops.map((d) => d.d * 1e6),
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const base = read.x[0] || 1

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(run)} onClick={() => setRun((v) => !v)}>{run ? 'running' : 'paused'}</button>
        <button
          style={btn(false)}
          onClick={() => {
            resetRef.current += 1
            setRun(true)
          }}
        >
          restart
        </button>
        <label style={label}>
          <span style={nameS}>injection u0</span>
          <input type="range" min={8} max={45} step={1} value={u0} onChange={(e) => setU0(parseInt(e.target.value, 10))} />
          <span style={mono}>{u0} m/s</span>
        </label>
        <label style={label}>
          <span style={nameS}>d0</span>
          <input type="range" min={15} max={90} step={1} value={d0Um} onChange={(e) => setD0Um(parseInt(e.target.value, 10))} />
          <span style={mono}>{d0Um} um</span>
        </label>
        <label style={label}>
          <span style={nameS}>B_M</span>
          <input type="range" min={0} max={2.5} step={0.05} value={bm} onChange={(e) => setBm(parseFloat(e.target.value))} />
          <span style={mono}>{bm.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>K</span>
          <input type="range" min={0} max={3} step={0.05} value={kEvap} onChange={(e) => setKEvap(parseFloat(e.target.value))} />
          <span style={mono}>{kEvap.toFixed(2)} mm2/s</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ color: COLS[i] }}>
            {NAMES[i].slice(0, 1)} {read.x[i].toFixed(2)} mm ({i === 0 ? '--' : `${(100 * (read.x[i] / base - 1)).toFixed(1)}%`})
          </span>
        ))}
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Push B_M up: lane C&apos;s drag coefficient drops and it pulls ahead of the grey sphere. Now push K up and lane D uses
        that same reduced coefficient yet falls behind &mdash; the shrinking diameter multiplies the deceleration faster than
        blowing removes it. Setting K to 0 collapses D onto C, which is the cleanest way to see which of the two effects is
        doing the work.
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
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 58 }

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
