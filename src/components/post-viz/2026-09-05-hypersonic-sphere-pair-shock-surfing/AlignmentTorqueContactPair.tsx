'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Two equal spheres, touching, in a Mach-20 stream.
//
// Surface pressure from modified Newtonian theory,
//     Cp = Cp_max * (n_x)^2   on windward faces (n_x < 0),  Cp = 0 elsewhere,
// with a purely geometric shadow: a face hidden behind the other sphere sees
// nothing.  Integrating over both spheres gives the moment C_M about the
// common centre of mass, and C_M(theta) is the whole story: it crosses zero
// with a restoring slope near 144 deg, so a contacting pair released anywhere
// in between swings to that skew angle and oscillates about it.
//
// theta is measured between the free-stream vector and the secondary->primary
// line, so 180 deg means the secondary sits directly in the primary's wake.
// ---------------------------------------------------------------------------

const W = 760
const H = 452

const CP_MAX = 1.8394 // gamma = 1.4, M -> infinity
const N_PANEL = 6000

const TH_LO = 90
const TH_HI = 180

const SCX = 226 // scene centre
const SCY = 232
const SCALE = 56 // px per sphere radius

const GX0 = 512 // C_M chart
const GX1 = 742
const GY0 = 76
const GY1 = 396
const CM_SPAN = 0.016

const COL_BG = '#0b1220'
const COL_AX = 'rgba(148,163,184,0.28)'
const COL_TXT = '#94a3b8'
const COL_HOT = '#fbbf24'
const COL_EQ = '#4ade80'

type Loads = { cd: number; cl: number; cm: number }

function panelGrid(n: number) {
  const px = new Float64Array(n)
  const py = new Float64Array(n)
  const pz = new Float64Array(n)
  const ga = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const z = 1 - (2 * (i + 0.5)) / n
    const r = Math.sqrt(Math.max(0, 1 - z * z))
    const a = ga * i
    px[i] = r * Math.cos(a)
    py[i] = r * Math.sin(a)
    pz[i] = z
  }
  return { px, py, pz, da: (4 * Math.PI) / n }
}

// Loads on the pair at alignment angle theta, non-dimensionalised by
// q_inf * pi * R^2 (force) and q_inf * pi * R^2 * 2R (moment).
function integratePair(thDeg: number, g: ReturnType<typeof panelGrid>): Loads {
  const t = (thDeg * Math.PI) / 180
  const nx = Math.cos(t)
  const ny = Math.sin(t)
  // secondary at the origin, primary 2R along n_hat, CoM halfway
  const cx = [0, 2 * nx]
  const cy = [0, 2 * ny]
  const mx = nx
  const my = ny
  let fx = 0
  let fy = 0
  let mz = 0
  for (let s = 0; s < 2; s++) {
    const ox = cx[1 - s]
    const oy = cy[1 - s]
    for (let i = 0; i < N_PANEL; i++) {
      const ux = g.px[i]
      if (ux >= 0) continue
      const x = cx[s] + ux
      const y = cy[s] + g.py[i]
      const z = g.pz[i]
      if (ox < x && (y - oy) * (y - oy) + z * z < 1) continue // in the shadow
      const cp = CP_MAX * ux * ux
      const dfx = -cp * ux * g.da
      const dfy = -cp * g.py[i] * g.da
      fx += dfx
      fy += dfy
      mz += (x - mx) * dfy - (y - my) * dfx
    }
  }
  return { cd: fx / Math.PI, cl: fy / Math.PI, cm: mz / (2 * Math.PI) }
}

// The pair is two identical spheres, so the loads have period 180 deg in
// theta and flip sign under reflection.  That folds any orientation back
// onto the tabulated 90..180 range.
function foldAngle(deg: number) {
  const a = ((deg % 180) + 180) % 180
  return a < TH_LO ? { th: 180 - a, flip: true } : { th: a, flip: false }
}

function sampleTable(tab: Loads[], deg: number): Loads {
  const { th, flip } = foldAngle(deg)
  const u = Math.min(TH_HI - TH_LO - 1e-9, Math.max(0, th - TH_LO))
  const i = Math.floor(u)
  const f = u - i
  const a = tab[i]
  const b = tab[Math.min(tab.length - 1, i + 1)]
  const s = flip ? -1 : 1
  return {
    cd: a.cd + (b.cd - a.cd) * f,
    cl: s * (a.cl + (b.cl - a.cl) * f),
    cm: s * (a.cm + (b.cm - a.cm) * f),
  }
}

function pressColor(cp: number) {
  const u = Math.max(0, Math.min(1, cp / CP_MAX))
  const r = Math.round(30 + 220 * u)
  const gg = Math.round(58 + 133 * u)
  const b = Math.round(138 - 100 * u)
  return `rgb(${r},${gg},${b})`
}

const TORQUE_GAIN = 2.5
const DT = 0.02
const SUB = 4

export function AlignmentTorqueContactPair() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [theta0, setTheta0] = useState(170)
  const [damping, setDamping] = useState(0.08)
  const [running, setRunning] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [read, setRead] = useState({ th: 170, cm: 0, cd: 0, ld: 0, w: 0, eq: 0 })

  const st = useRef({ theta0, damping, running })
  st.current = { theta0, damping, running }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const grid = panelGrid(N_PANEL)
    const tab: Loads[] = []
    for (let d = TH_LO; d <= TH_HI; d++) tab.push(integratePair(d, grid))

    // the restoring zero of C_M
    let eq = 0
    for (let i = 0; i + 1 < tab.length; i++) {
      const m0 = tab[i].cm
      const m1 = tab[i + 1].cm
      if (m0 * m1 < 0 && m1 < m0 && Math.abs(m1 - m0) > 5e-5) {
        eq = TH_LO + i + (-m0) / (m1 - m0)
      }
    }

    let raf = 0
    let frame = 0
    let th = st.current.theta0
    let w = 0
    let lastSeed = st.current.theta0

    const arrow = (x0: number, y0: number, x1: number, y1: number, col: string, head = 7) => {
      if (Math.hypot(x1 - x0, y1 - y0) < 2) return
      const a = Math.atan2(y1 - y0, x1 - x0)
      ctx.strokeStyle = col
      ctx.fillStyle = col
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 - head * Math.cos(a - 0.4), y1 - head * Math.sin(a - 0.4))
      ctx.lineTo(x1 - head * Math.cos(a + 0.4), y1 - head * Math.sin(a + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    const draw = () => {
      ctx.fillStyle = COL_BG
      ctx.fillRect(0, 0, W, H)

      const L = sampleTable(tab, th)
      const t = (th * Math.PI) / 180
      const nx = Math.cos(t)
      const ny = Math.sin(t)
      // world coords with the CoM at the origin
      const ax = -nx
      const ay = -ny // secondary
      const bx = nx
      const by = ny // primary

      // free-stream rakes
      ctx.strokeStyle = 'rgba(56,189,248,0.30)'
      ctx.lineWidth = 1
      for (let k = -3; k <= 3; k++) {
        const y = SCY + k * 34
        ctx.beginPath()
        ctx.moveTo(12, y)
        ctx.lineTo(74, y)
        ctx.stroke()
      }
      arrow(12, SCY, 78, SCY, 'rgba(56,189,248,0.8)', 6)
      ctx.fillStyle = '#38bdf8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('M = 20', 12, SCY - 12)

      // geometric shadow of the upstream sphere
      const upX = ax < bx ? ax : bx
      const upY = ax < bx ? ay : by
      ctx.fillStyle = 'rgba(148,163,184,0.10)'
      ctx.fillRect(SCX + upX * SCALE, SCY - upY * SCALE - SCALE, 470 - (SCX + upX * SCALE), 2 * SCALE)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(SCX + upX * SCALE, SCY - upY * SCALE - SCALE)
      ctx.lineTo(470, SCY - upY * SCALE - SCALE)
      ctx.moveTo(SCX + upX * SCALE, SCY - upY * SCALE + SCALE)
      ctx.lineTo(470, SCY - upY * SCALE + SCALE)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(148,163,184,0.55)'
      ctx.fillText('geometric shadow', 330, SCY - upY * SCALE - SCALE - 6)

      // spheres: windward arcs coloured by Cp, shadowed arcs left grey
      const drawOne = (cxw: number, cyw: number, oxw: number, oyw: number, label: string) => {
        const sx = SCX + cxw * SCALE
        const sy = SCY - cyw * SCALE
        const seg = 150
        for (let i = 0; i < seg; i++) {
          const a0 = (2 * Math.PI * i) / seg
          const a1 = (2 * Math.PI * (i + 1)) / seg
          const am = 0.5 * (a0 + a1)
          const ux = Math.cos(am)
          const uy = Math.sin(am)
          let cp = 0
          if (ux < 0) {
            const pxw = cxw + ux
            const pyw = cyw + uy
            const hidden = oxw < pxw && Math.abs(pyw - oyw) < 1
            if (!hidden) cp = CP_MAX * ux * ux
          }
          ctx.strokeStyle = cp > 0 ? pressColor(cp) : 'rgba(148,163,184,0.30)'
          ctx.lineWidth = cp > 0 ? 7 : 1.5
          ctx.beginPath()
          ctx.arc(sx, sy, SCALE, -a1, -a0)
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(11,18,32,0.82)'
        ctx.beginPath()
        ctx.arc(sx, sy, SCALE - 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = COL_TXT
        ctx.font = '11px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(label, sx, sy + 4)
        ctx.textAlign = 'left'
      }
      drawOne(ax, ay, bx, by, 'secondary')
      drawOne(bx, by, ax, ay, 'primary')

      // centre of mass, lift/drag and the torque that drives the rotation
      ctx.fillStyle = COL_EQ
      ctx.beginPath()
      ctx.arc(SCX, SCY, 3.5, 0, 2 * Math.PI)
      ctx.fill()
      arrow(SCX, SCY, SCX + L.cd * 46, SCY, '#38bdf8')
      arrow(SCX, SCY, SCX, SCY - L.cl * 190, COL_HOT)
      ctx.fillStyle = '#38bdf8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('C_D', SCX + L.cd * 46 + 6, SCY + 4)
      ctx.fillStyle = COL_HOT
      ctx.fillText('C_L', SCX + 6, SCY - L.cl * 190 - 6)

      const tq = Math.max(-1, Math.min(1, L.cm / 0.012))
      if (Math.abs(tq) > 0.01) {
        const rr = 96
        const a0 = -0.5
        const a1 = a0 - tq * 1.5
        ctx.strokeStyle = tq > 0 ? COL_EQ : '#f87171'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(SCX, SCY, rr, a0, a1, tq > 0)
        ctx.stroke()
        const ex = SCX + rr * Math.cos(a1)
        const ey = SCY + rr * Math.sin(a1)
        const tang = a1 + (tq > 0 ? -Math.PI / 2 : Math.PI / 2)
        arrow(ex - 0.1 * Math.cos(tang), ey - 0.1 * Math.sin(tang), ex + 11 * Math.cos(tang), ey + 11 * Math.sin(tang), tq > 0 ? COL_EQ : '#f87171', 8)
      }

      // ---- C_M(theta) chart -------------------------------------------------
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(GX0, GY0, GX1 - GX0, GY1 - GY0)
      const yOf = (cm: number) => GY0 + ((CM_SPAN - cm) / (2 * CM_SPAN)) * (GY1 - GY0)
      const xOf = (d: number) => GX0 + ((d - TH_LO) / (TH_HI - TH_LO)) * (GX1 - GX0)
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.beginPath()
      ctx.moveTo(GX0, yOf(0))
      ctx.lineTo(GX1, yOf(0))
      ctx.stroke()

      ctx.strokeStyle = COL_HOT
      ctx.lineWidth = 2
      ctx.beginPath()
      tab.forEach((v, i) => {
        const x = xOf(TH_LO + i)
        const y = yOf(v.cm)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      ctx.strokeStyle = COL_EQ
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(xOf(eq), GY0)
      ctx.lineTo(xOf(eq), GY1)
      ctx.stroke()
      ctx.setLineDash([])

      const folded = foldAngle(th)
      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.arc(xOf(folded.th), yOf(sampleTable(tab, th).cm * (folded.flip ? -1 : 1)), 4.5, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('C_M about the pair CoM', GX0, GY0 - 22)
      ctx.fillStyle = COL_EQ
      ctx.fillText(`stable at ${eq.toFixed(1)}°`, GX0 + 4, GY0 - 8)
      ctx.fillStyle = COL_TXT
      ctx.fillText('90°', GX0 - 4, GY1 + 15)
      ctx.fillText('135°', xOf(135) - 12, GY1 + 15)
      ctx.fillText('180°', GX1 - 22, GY1 + 15)
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.fillText('+ opens the pair', GX0 + 4, yOf(0) - 8)
      ctx.fillText('− closes it', GX0 + 4, yOf(0) + 18)

      // colour key
      ctx.fillStyle = COL_TXT
      ctx.fillText('Cp', 14, H - 30)
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = pressColor((i / 59) * CP_MAX)
        ctx.fillRect(34 + i * 2, H - 40, 2, 10)
      }
      ctx.fillStyle = COL_TXT
      ctx.fillText('0', 34, H - 16)
      ctx.fillText('1.84', 138, H - 16)
      ctx.fillText('theta = angle between the free stream and the secondary→primary line', 200, H - 22)
    }

    const step = () => {
      const s = st.current
      if (s.theta0 !== lastSeed && !s.running) {
        lastSeed = s.theta0
        th = s.theta0
        w = 0
      }
      if (s.running) {
        for (let k = 0; k < SUB; k++) {
          const cm = sampleTable(tab, th).cm
          w += (TORQUE_GAIN * cm - s.damping * w) * DT
          th += ((w * DT) * 180) / Math.PI
        }
      }
      draw()
      if (frame % 12 === 0) {
        const L = sampleTable(tab, th)
        setReadRef.current({
          th: foldAngle(th).th,
          cm: L.cm,
          cd: L.cd,
          ld: L.cd === 0 ? 0 : L.cl / L.cd,
          w: (w * 180) / Math.PI,
          eq,
        })
      }
      frame++
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [resetKey])

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
          {running ? '❙❙ hold' : '▶ release the pair'}
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            setRunning(false)
            setResetKey((k) => k + 1)
          }}
        >
          ↺ reset
        </button>
        <button style={btn(false)} onClick={() => { setRunning(false); setTheta0(180) }}>
          tandem 180°
        </button>
        <button style={btn(false)} onClick={() => { setRunning(false); setTheta0(90) }}>
          side by side 90°
        </button>
      </div>
      <div style={rowS}>
        <label style={label}>
          <span style={nameS}>theta_0</span>
          <input
            type="range"
            min={90}
            max={180}
            step={1}
            value={theta0}
            disabled={running}
            onChange={(e) => setTheta0(parseInt(e.target.value, 10))}
          />
          <span style={mono}>{theta0}&deg;</span>
        </label>
        <label style={label}>
          <span style={nameS}>contact damping</span>
          <input type="range" min={0} max={0.4} step={0.01} value={damping} onChange={(e) => setDamping(parseFloat(e.target.value))} />
          <span style={mono}>{damping.toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span>theta {read.th.toFixed(1)}&deg;</span>
        <span style={{ color: read.cm > 0 ? COL_EQ : '#f87171' }}>C_M {read.cm.toFixed(4)}</span>
        <span style={{ color: COL_HOT }}>L/D {read.ld.toFixed(3)}</span>
        <span style={{ color: '#38bdf8' }}>C_D {read.cd.toFixed(3)}</span>
        <span>omega {read.w.toFixed(2)}&deg;/t</span>
        <span style={{ color: COL_EQ }}>equilibrium {read.eq.toFixed(1)}&deg;</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Set theta_0 anywhere and press release. Watch the curved torque arrow: it is green wherever the pair is being opened and
        red wherever it is being closed, and it vanishes only on the dashed line. Drop damping to zero and the pair never settles
        &mdash; it swings through the equilibrium angle forever. Start at exactly 180&deg; and nothing happens at all, until you
        nudge it.
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
    background: active ? 'rgba(251,191,36,0.16)' : 'transparent',
    color: active ? '#fbbf24' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
