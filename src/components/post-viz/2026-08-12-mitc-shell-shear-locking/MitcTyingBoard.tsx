'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// What a tying point actually ties, on a 4-node MITC shell element.
//
// Transverse shear is the angle between the director (the fibre through the
// thickness) and the normal of the deformed mid-surface:
//
//     gamma_r(r,s) = dw/dr - phi_r
//
// Three modes are imposed on the nodes and then interpolated bilinearly, the
// way the element actually sees them:
//
//   bending   w_i = A r_i^2 / 2 -> w_h = A/2 (constant!),  phi_r = A r
//             => gamma = -A r. Pure spurious shear: the real Kirchhoff mode
//                has gamma = 0 everywhere.
//   twist     w_h = A r s (bilinear, reproduced exactly), phi_r = A s
//             => gamma = 0. This mode never locked in the first place.
//   shear     w_h = A r, phi_r = 0 => gamma = A. Physically real shear that a
//             correct scheme must keep.
//
// MITC4 does not differentiate the displacement field for gamma_r. It reads
// gamma_r at the tying points A(r=0,s=-1) and C(r=0,s=+1) and interpolates
// linearly in s:
//
//     gamma_r^MITC(r,s) = (1-s)/2 gamma_r(0,-1) + (1+s)/2 gamma_r(0,+1)
//
// Look at where r = 0 sits in the bending mode: it is the one place where the
// fanned-out directors are still perpendicular to the flat surface.
// ---------------------------------------------------------------------------

const W = 726
const H = 452

const LX = 26 // cross-section panel
const LY = 46
const LW = 340
const LH = 250

const PX = 404 // gamma profile panel
const PY = 62
const PW = 288
const PH = 150

const NU = 0.3
const KS = 5 / 6

type Mode = 'bending' | 'twist' | 'shear'

// w_h and phi_r as the bilinear element sees them, per mode
function fieldW(mode: Mode, A: number, r: number, s: number) {
  if (mode === 'bending') return A / 2 // nodal A r_i^2/2 = A/2 everywhere
  if (mode === 'twist') return A * r * s
  return A * r
}
function fieldDwDr(mode: Mode, A: number, _r: number, s: number) {
  if (mode === 'bending') return 0
  if (mode === 'twist') return A * s
  return A
}
function fieldPhi(mode: Mode, A: number, r: number, s: number) {
  if (mode === 'bending') return A * r
  if (mode === 'twist') return A * s
  return 0
}
function gammaDirect(mode: Mode, A: number, r: number, s: number) {
  return fieldDwDr(mode, A, r, s) - fieldPhi(mode, A, r, s)
}
function gammaMitc(mode: Mode, A: number, _r: number, s: number) {
  const gA = gammaDirect(mode, A, 0, -1)
  const gC = gammaDirect(mode, A, 0, 1)
  return ((1 - s) / 2) * gA + ((1 + s) / 2) * gC
}

// Shear energy of the imposed mode divided by one fixed reference: the bending
// energy of the pure-bending mode at the same amplitude, D * integral(kappa^2).
// Using one denominator for all three modes keeps the numbers comparable.
// t is the thickness in units of the element half-length.
function energyRatio(mode: Mode, A: number, t: number, mitc: boolean) {
  const n = 21
  const h = 2 / n
  let gg = 0
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const r = -1 + (i + 0.5) * h
      const s = -1 + (j + 0.5) * h
      const g = mitc ? gammaMitc(mode, A, r, s) : gammaDirect(mode, A, r, s)
      gg += g * g * h * h
    }
  const G = 1 / (2 * (1 + NU))
  const D = (t * t * t) / (12 * (1 - NU * NU))
  const bendRef = D * 4 * A * A // kappa = A over the 2x2 element
  return (KS * G * t * gg) / bendRef
}

export function MitcTyingBoard() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('bending')
  const [sCut, setSCut] = useState(0.5)
  const [aspect, setAspect] = useState(20) // element half-length / thickness
  const [showMitc, setShowMitc] = useState(true)
  const [running, setRunning] = useState(true)

  const cfg = useRef({ mode, sCut, aspect, showMitc, running })
  cfg.current = { mode, sCut, aspect, showMitc, running }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let phase = 0
    let last = 0

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const { mode: md, sCut: s0, aspect: ar, showMitc: sm, running: run } = cfg.current
      if (run) phase += dt * 1.2
      const A = 0.7 * Math.sin(phase) + (run ? 0 : 0.7)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- left: r-z cross-section at s = s0 ------------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      ctx.strokeRect(LX, LY - 24, LW, LH + 46)
      text(`CROSS-SECTION  s = ${s0.toFixed(2)}`, LX + 8, LY - 8, '#cbd5e1', 'bold 11px ui-monospace, monospace')

      const cx = (r: number) => LX + 34 + ((r + 1) / 2) * (LW - 72)
      const cy = (z: number) => LY + LH / 2 - z * 62

      // undeformed reference
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.beginPath()
      ctx.moveTo(cx(-1), cy(0))
      ctx.lineTo(cx(1), cy(0))
      ctx.stroke()
      ctx.setLineDash([])

      // deformed mid-surface as the element interpolates it
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const r = -1 + (2 * i) / 60
        const X = cx(r)
        const Y = cy(fieldW(md, A, r, s0))
        i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // directors + the normal they should have been parallel to
      const half = 30
      for (let i = 0; i <= 8; i++) {
        const r = -1 + (2 * i) / 8
        const X = cx(r)
        const Y = cy(fieldW(md, A, r, s0))
        const phi = fieldPhi(md, A, r, s0)
        const slope = fieldDwDr(md, A, r, s0)
        const gdir = gammaDirect(md, A, r, s0)

        // true normal to the deformed mid-surface (dashed grey)
        const an = Math.atan(slope * 0.4)
        ctx.strokeStyle = 'rgba(148,163,184,0.5)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(X - half * Math.sin(an), Y - half * Math.cos(an))
        ctx.lineTo(X + half * Math.sin(an), Y + half * Math.cos(an))
        ctx.stroke()
        ctx.setLineDash([])

        // the director the element actually carries
        const ad = Math.atan(phi * 0.4)
        const col = Math.abs(gdir) < 1e-6 ? '#34d399' : '#f87171'
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(X - half * Math.sin(ad), Y - half * Math.cos(ad))
        ctx.lineTo(X + half * Math.sin(ad), Y + half * Math.cos(ad))
        ctx.stroke()

        // wedge between them = the shear strain being carried
        if (Math.abs(gdir) > 1e-6) {
          ctx.fillStyle = 'rgba(248,113,113,0.18)'
          ctx.beginPath()
          ctx.moveTo(X, Y)
          ctx.lineTo(X - half * Math.sin(an), Y - half * Math.cos(an))
          ctx.lineTo(X - half * Math.sin(ad), Y - half * Math.cos(ad))
          ctx.closePath()
          ctx.fill()
        }

        if (i === 4) {
          ctx.fillStyle = '#38bdf8'
          ctx.beginPath()
          ctx.arc(X, Y, 5, 0, 6.2832)
          ctx.fill()
          text('tying point r = 0', X - 46, Y + 54, '#38bdf8')
        }
      }

      text('grey dashed = surface normal', LX + 8, LY + LH + 4, '#94a3b8')
      text('solid = director carried by the element', LX + 8, LY + LH + 18, '#f87171')
      text('the wedge between them is gamma_r', LX + 8, LY + LH + 32, '#64748b')

      // ---- right top: gamma_r profile along r ------------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.strokeRect(PX - 22, PY - 24, PW + 60, PH + 52)
      text('gamma_r  ALONG  r', PX - 14, PY - 8, '#cbd5e1', 'bold 11px ui-monospace, monospace')

      let gmax = 0.05
      for (let i = 0; i <= 40; i++) {
        const r = -1 + (2 * i) / 40
        gmax = Math.max(gmax, Math.abs(gammaDirect(md, A, r, s0)), Math.abs(gammaMitc(md, A, r, s0)))
      }
      gmax = Math.max(gmax, 0.2)

      const gx = (r: number) => PX + ((r + 1) / 2) * PW
      const gy = (g: number) => PY + PH / 2 - (g / (1.25 * gmax)) * (PH / 2)

      ctx.strokeStyle = 'rgba(148,163,184,0.30)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(gx(-1), gy(0))
      ctx.lineTo(gx(1), gy(0))
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(gx(0), PY)
      ctx.lineTo(gx(0), PY + PH)
      ctx.stroke()

      const curve = (fn: (r: number) => number, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2.5
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 0; i <= 60; i++) {
          const r = -1 + (2 * i) / 60
          const X = gx(r)
          const Y = gy(fn(r))
          i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      curve((r) => gammaDirect(md, A, r, s0), '#f87171', [])
      if (sm) curve((r) => gammaMitc(md, A, r, s0), '#38bdf8', [7, 4])

      ctx.fillStyle = '#38bdf8'
      ctx.beginPath()
      ctx.arc(gx(0), gy(gammaDirect(md, A, 0, s0)), 5, 0, 6.2832)
      ctx.fill()

      text('r = -1', PX - 4, PY + PH + 16, '#64748b')
      text('r = +1', PX + PW - 34, PY + PH + 16, '#64748b')
      text('direct  dw/dr - phi', PX + 4, PY + 14, '#f87171')
      if (sm) text('MITC tied at r = 0', PX + 4, PY + 30, '#38bdf8')

      // ---- right bottom: the tying-point map and the penalty ---------------
      const MX = PX + 8
      const MY = PY + PH + 58
      const ms = 92
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(MX, MY, ms, ms)
      const mp = (r: number, s: number) => [MX + ((r + 1) / 2) * ms, MY + ((1 - s) / 2) * ms]
      const dot = (r: number, s: number, col: string, lbl: string) => {
        const [x, y] = mp(r, s)
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(x, y, 4.5, 0, 6.2832)
        ctx.fill()
        text(lbl, x + 7, y + 4, col, '10px ui-monospace, monospace')
      }
      dot(0, -1, '#38bdf8', 'A')
      dot(0, 1, '#38bdf8', 'C')
      dot(1, 0, '#fbbf24', 'B')
      dot(-1, 0, '#fbbf24', 'D')
      const scy = mp(0, s0)[1]
      ctx.strokeStyle = 'rgba(226,232,240,0.55)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(MX, scy)
      ctx.lineTo(MX + ms, scy)
      ctx.stroke()
      ctx.setLineDash([])
      text('MITC4 tying points', MX, MY - 8, '#94a3b8')
      text('A,C -> gamma_r', MX, MY + ms + 14, '#38bdf8')
      text('B,D -> gamma_s', MX, MY + ms + 28, '#fbbf24')

      const rd = energyRatio(md, 1, 1 / ar, false)
      const rm = energyRatio(md, 1, 1 / ar, true)
      const EX = MX + 130
      text('SHEAR / BENDING ENERGY', EX, MY - 8, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      const showRatio = (lbl: string, v: number, y: number) => {
        text(lbl, EX, y, '#94a3b8')
        const col = md === 'shear' ? '#fbbf24' : v > 1 ? '#f87171' : '#34d399'
        text(v > 999 ? v.toExponential(2) : v.toFixed(3), EX + 4, y + 20, col, 'bold 15px ui-monospace, monospace')
      }
      showRatio('direct differentiation', rd, MY + 16)
      showRatio('MITC tying', rm, MY + 62)
      text(`element half-length / thickness = ${ar}`, EX, MY + ms + 14, '#64748b')

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }
  const btn = (active: boolean, col: string): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? col : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={row}>
        {(['bending', 'twist', 'shear'] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={btn(mode === m, m === 'bending' ? '#f87171' : '#34d399')}>
            {m === 'bending' ? 'pure bending' : m === 'twist' ? 'twist' : 'true shear'}
          </button>
        ))}
        <button onClick={() => setShowMitc(!showMitc)} style={btn(showMitc, '#38bdf8')}>
          MITC curve {showMitc ? 'on' : 'off'}
        </button>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
      </div>

      <div style={row}>
        <label style={label}>
          <span style={name}>section s</span>
          <input type="range" min={-1} max={1} step={0.05} value={sCut} onChange={(e) => setSCut(parseFloat(e.target.value))} />
          <span style={mono}>{sCut.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>half-length / thickness</span>
          <input type="range" min={2} max={100} step={1} value={aspect} onChange={(e) => setAspect(parseInt(e.target.value, 10))} />
          <span style={mono}>{aspect}</span>
        </label>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Start in <em>pure bending</em>: the mid-surface stays flat while the directors fan out, and every red wedge is shear
        strain the element invented. Only at r = 0 does the wedge close &mdash; that is why the tying point sits there. Switch to{' '}
        <em>true shear</em> and watch the blue MITC curve sit exactly on the red one: tying removes the spurious strain without
        touching the real one. Then drag the aspect-ratio slider and read the energy numbers.
      </div>
    </div>
  )
}
