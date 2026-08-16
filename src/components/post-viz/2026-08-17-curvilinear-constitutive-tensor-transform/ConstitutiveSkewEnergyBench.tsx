'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// What it costs to feed covariant strain components into a Cartesian C matrix.
//
// One physical strain state eps (Cartesian components) never changes here.
// The parameterisation does: J = [g1 | g2] with an adjustable skew and |g2|.
//
//   covariant strain components   eps~_ij = (J^T eps J)_ij
//   correct energy                U = 1/2 C~^ijkl eps~_ij eps~_kl  == Cartesian U
//   forgotten transform           U_bad = 1/2 C^pqrs eps~_pq eps~_rs
//
// For isotropic plane stress the double contraction collapses to
//   1/2 [ lambda (tr e)^2 + 2 mu e_pq e_pq ]
// so both energies are two lines of arithmetic, and the gap is pure bookkeeping
// error - the deformation drawn on the left is identical in every case.
// ---------------------------------------------------------------------------

const W = 726
const H = 430

const E0 = 2.1e6
const NU = 0.3
const LAM = (E0 * NU) / (1 - NU * NU)
const MU = E0 / (2 * (1 + NU))

type Mode = 'stretch' | 'shear' | 'mixed'

function strainOf(mode: Mode, amp: number) {
  if (mode === 'stretch') return [[1.0 * amp, 0], [0, -0.6 * amp]]
  if (mode === 'shear') return [[0, 1.0 * amp], [1.0 * amp, 0]]
  return [[1.0 * amp, 0.4 * amp], [0.4 * amp, -0.6 * amp]]
}

function isoEnergy(e: number[][]) {
  const tr = e[0][0] + e[1][1]
  const dd = e[0][0] * e[0][0] + 2 * e[0][1] * e[0][1] + e[1][1] * e[1][1]
  return 0.5 * (LAM * tr * tr + 2 * MU * dd)
}

function jacobian(skewDeg: number, stretch: number) {
  const a = (skewDeg * Math.PI) / 180
  return [
    [1, stretch * Math.sin(a)],
    [0, stretch * Math.cos(a)],
  ]
}

function covariantStrain(J: number[][], e: number[][]) {
  // J^T e J
  const t = [
    [J[0][0] * e[0][0] + J[1][0] * e[1][0], J[0][0] * e[0][1] + J[1][0] * e[1][1]],
    [J[0][1] * e[0][0] + J[1][1] * e[1][0], J[0][1] * e[0][1] + J[1][1] * e[1][1]],
  ]
  return [
    [t[0][0] * J[0][0] + t[0][1] * J[1][0], t[0][0] * J[0][1] + t[0][1] * J[1][1]],
    [t[1][0] * J[0][0] + t[1][1] * J[1][0], t[1][0] * J[0][1] + t[1][1] * J[1][1]],
  ]
}

function errorPercent(mode: Mode, skewDeg: number, stretch: number) {
  const e = strainOf(mode, 1e-3)
  const J = jacobian(skewDeg, stretch)
  const ok = isoEnergy(e)
  const bad = isoEnergy(covariantStrain(J, e))
  return (100 * (bad - ok)) / ok
}

export function ConstitutiveSkewEnergyBench() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [skew, setSkew] = useState(30)
  const [stretch, setStretch] = useState(1.0)
  const [mode, setMode] = useState<Mode>('mixed')
  const [running, setRunning] = useState(true)

  const cfg = useRef({ skew, stretch, mode, running })
  cfg.current = { skew, stretch, mode, running }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let phase = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const c = cfg.current
      if (c.running) phase += dt * 1.4

      const wave = c.running ? Math.sin(phase) : 1
      const J = jacobian(c.skew, c.stretch)
      const eUnit = strainOf(c.mode, 1e-3)
      const eDraw = strainOf(c.mode, 0.30 * wave)

      const Uok = isoEnergy(eUnit)
      const Ubad = isoEnergy(covariantStrain(J, eUnit))
      const err = (100 * (Ubad - Uok)) / Uok

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- left: the element, reference and deformed ----------------------
      const OX = 132
      const OY = 300
      const S = 118
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.strokeRect(18, 30, 336, H - 62)
      text('THE ELEMENT (same physical strain, always)', 28, 48, '#cbd5e1', 'bold 11px ui-monospace, monospace')

      const corners = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]
      const toXY = (r: number[]) => [J[0][0] * r[0] + J[0][1] * r[1], J[1][0] * r[0] + J[1][1] * r[1]]
      const deform = (p: number[]) => [
        p[0] + eDraw[0][0] * p[0] + eDraw[0][1] * p[1],
        p[1] + eDraw[1][0] * p[0] + eDraw[1][1] * p[1],
      ]
      const poly = (pts: number[][], stroke: string, fill: string | null, dash: number[]) => {
        ctx.setLineDash(dash)
        ctx.strokeStyle = stroke
        ctx.lineWidth = 2
        ctx.beginPath()
        pts.forEach((p, i) => {
          const X = OX + p[0] * S
          const Y = OY - p[1] * S
          i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y)
        })
        ctx.closePath()
        if (fill) {
          ctx.fillStyle = fill
          ctx.fill()
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      const ref0 = corners.map(toXY)
      poly(ref0, 'rgba(148,163,184,0.5)', null, [4, 4])
      poly(ref0.map(deform), '#38bdf8', 'rgba(56,189,248,0.14)', [])

      // interior fibres so the strain mode is readable
      ctx.strokeStyle = 'rgba(56,189,248,0.35)'
      ctx.lineWidth = 1
      for (let k = 1; k < 4; k++) {
        const t = k / 4
        const aP = deform(toXY([t, 0]))
        const bP = deform(toXY([t, 1]))
        const cP = deform(toXY([0, t]))
        const dP = deform(toXY([1, t]))
        ctx.beginPath()
        ctx.moveTo(OX + aP[0] * S, OY - aP[1] * S)
        ctx.lineTo(OX + bP[0] * S, OY - bP[1] * S)
        ctx.moveTo(OX + cP[0] * S, OY - cP[1] * S)
        ctx.lineTo(OX + dP[0] * S, OY - dP[1] * S)
        ctx.stroke()
      }

      const gArrow = (vx: number, vy: number, lbl: string) => {
        ctx.strokeStyle = '#34d399'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(OX, OY)
        ctx.lineTo(OX + vx * S, OY - vy * S)
        ctx.stroke()
        text(lbl, OX + vx * S + 6, OY - vy * S + 4, '#34d399', 'bold 11px ui-monospace, monospace')
      }
      gArrow(J[0][0], J[1][0], 'g_1')
      gArrow(J[0][1], J[1][1], 'g_2')

      text('dashed = undeformed element', 28, H - 62, '#94a3b8')
      text('blue = deformed by the same eps', 28, H - 46, '#38bdf8')

      // ---- right top: err% vs skew ----------------------------------------
      const PX = 400
      const PY = 62
      const PW = 292
      const PH = 132
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.strokeRect(PX - 14, PY - 32, PW + 34, PH + 66)
      text('ENERGY ERROR vs SKEW', PX - 6, PY - 14, '#cbd5e1', 'bold 11px ui-monospace, monospace')

      let emax = 10
      for (let d = -60; d <= 60; d += 2) emax = Math.max(emax, Math.abs(errorPercent(c.mode, d, c.stretch)))
      const ex = (d: number) => PX + ((d + 60) / 120) * PW
      const ey = (e: number) => PY + PH - (Math.abs(e) / (1.12 * emax)) * PH

      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PX, PY + PH)
      ctx.lineTo(PX + PW, PY + PH)
      ctx.moveTo(ex(0), PY)
      ctx.lineTo(ex(0), PY + PH)
      ctx.stroke()

      ctx.strokeStyle = '#f87171'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let d = -60; d <= 60; d += 1) {
        const X = ex(d)
        const Y = ey(errorPercent(c.mode, d, c.stretch))
        d === -60 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y)
      }
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(ex(c.skew), ey(err), 5.5, 0, 6.2832)
      ctx.fill()

      text('-60', PX - 6, PY + PH + 16, '#64748b')
      text('0', ex(0) - 4, PY + PH + 16, '#64748b')
      text('+60 deg', PX + PW - 40, PY + PH + 16, '#64748b')
      text(`peak ${emax.toFixed(0)} %`, PX + 4, PY + 14, '#94a3b8')

      // ---- right bottom: two energy bars -----------------------------------
      const BX = 400
      const BY = 266
      const BW = 292
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.strokeRect(BX - 14, BY - 32, BW + 34, 130)
      text('STRAIN ENERGY OF THE ELEMENT', BX - 6, BY - 14, '#cbd5e1', 'bold 11px ui-monospace, monospace')

      const scale = Math.max(1, Ubad / Uok)
      const bar = (lbl: string, val: number, y: number, col: string) => {
        const w = (val / Uok / (1.15 * scale)) * BW
        ctx.fillStyle = 'rgba(148,163,184,0.10)'
        ctx.fillRect(BX, y, BW, 20)
        ctx.fillStyle = col
        ctx.fillRect(BX, y, Math.max(2, w), 20)
        text(lbl, BX + 6, y + 14, '#08111f', 'bold 11px ui-monospace, monospace')
        text(`${(val / Uok).toFixed(3)} x`, BX + BW + 4, y + 14, col, 'bold 11px ui-monospace, monospace')
      }
      bar('C transformed  (correct)', Uok, BY, '#34d399')
      bar('C as-is on eps~_ij', Ubad, BY + 32, '#f87171')

      text('overshoot', BX, BY + 82, '#94a3b8')
      text(`${err >= 0 ? '+' : ''}${err.toFixed(1)} %`, BX + 76, BY + 84, Math.abs(err) < 0.5 ? '#34d399' : '#f87171', 'bold 17px ui-monospace, monospace')
      text(`g_22 = ${(J[0][1] * J[0][1] + J[1][1] * J[1][1]).toFixed(3)}   g_12 = ${(J[0][0] * J[0][1] + J[1][0] * J[1][1]).toFixed(3)}`, BX + 168, BY + 84, '#64748b', '10px ui-monospace, monospace')

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 44 }
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
        {(['stretch', 'shear', 'mixed'] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={btn(mode === m, '#38bdf8')}>
            {m}
          </button>
        ))}
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
      </div>

      <div style={row}>
        <label style={label}>
          <span style={name}>skew of g_2 [deg]</span>
          <input type="range" min={-60} max={60} step={1} value={skew} onChange={(e) => setSkew(parseInt(e.target.value, 10))} />
          <span style={mono}>{skew}</span>
        </label>
        <label style={label}>
          <span style={name}>| g_2 |</span>
          <input type="range" min={0.5} max={2} step={0.05} value={stretch} onChange={(e) => setStretch(parseFloat(e.target.value))} />
          <span style={mono}>{stretch.toFixed(2)}</span>
        </label>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        The blue element on the left never changes its physics &mdash; only the coordinate lines you measure it with do. Drag the
        skew slider away from 0, or push |g<sub>2</sub>| off 1.00, and watch the red bar climb while the green one stays put.
        Bring both back to the orthonormal setting and the two bars lock together: that is the only configuration where skipping
        the transform is free.
      </div>
    </div>
  )
}
