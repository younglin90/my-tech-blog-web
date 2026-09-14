'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One Poisson problem, two engineering constants.
//
//   torsion (Prandtl) :  lap(Phi) = -2 G theta ,  Phi = 0 on the boundary
//   duct flow         :  lap(u)   = -(-dp/dx)/mu ,  u = 0 on the wall
//
// Solve the normalised problem  lap(w) = -1,  w = 0 on the boundary, once.
// Then
//   J     = 4 * integral(w)                      (torsion constant)
//   f*Re  = 2 * Dh^2 / mean(w)                   (laminar friction group)
//
// The strip relaxes w by SOR in front of you and reads the SAME field twice.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const PAD_L = 44
const PAD_T = 52
const BOX_W = 430
const BOX_H = 250

const PANEL_X = 510

const COL_TOR = '#f0abfc'
const COL_DUCT = '#38bdf8'
const COL_TXT = '#94a3b8'
const COL_DIM = '#64748b'
const COL_OK = '#4ade80'

const NY = 28 // cells across the short side

/** exact integral of w over the section, from the classical odd series */
function exactIntegral(w: number, h: number): number {
  const s = Math.min(w, h)
  const lg = Math.max(w, h)
  let acc = 0
  for (let m = 1; m < 160; m += 2) acc += Math.tanh((m * Math.PI * lg) / (2 * s)) / m ** 5
  const j = (1 / 3) * lg * s ** 3 * (1 - (192 / Math.PI ** 5) * (s / lg) * acc)
  return j / 4
}

function ramp(t: number): string {
  // 0 -> deep blue, 1 -> warm yellow
  const r = Math.round(255 * Math.min(1, Math.max(0, 1.6 * t - 0.35)))
  const g = Math.round(255 * Math.min(1, Math.max(0, 1.25 * t)))
  const b = Math.round(255 * Math.min(1, Math.max(0, 1.0 - 1.3 * t)))
  return `rgb(${r},${40 + g * 0.75},${60 + b * 0.75})`
}

export function TorsionDuctPoissonTwin() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ar, setAr] = useState(1)
  const [mode, setMode] = useState<'torsion' | 'duct'>('torsion')
  const [running, setRunning] = useState(true)
  const [read, setRead] = useState({ sweeps: 0, jc: 0, fre: 0, exJ: 0, exF: 0, res: 1 })

  const st = useRef({ ar, mode, running })
  st.current = { ar, mode, running }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let builtFor = -1
    let nx = 0
    let ny = 0
    let dx = 0
    let field: Float64Array = new Float64Array(0)
    let sweeps = 0
    let residual = 1

    const build = (aspect: number) => {
      ny = NY
      nx = Math.min(200, Math.max(NY, Math.round(NY * aspect)))
      dx = 1 / ny
      field = new Float64Array((nx + 1) * (ny + 1))
      sweeps = 0
      residual = 1
      builtFor = aspect
    }

    const at = (i: number, j: number) => field[j * (nx + 1) + i]

    const sor = (omega: number) => {
      let rmax = 0
      for (let j = 1; j < ny; j++) {
        for (let i = 1; i < nx; i++) {
          const k = j * (nx + 1) + i
          const target =
            0.25 * (field[k - 1] + field[k + 1] + field[k - nx - 1] + field[k + nx + 1] + dx * dx)
          const d = target - field[k]
          if (Math.abs(d) > rmax) rmax = Math.abs(d)
          field[k] += omega * d
        }
      }
      sweeps += 1
      residual = rmax
    }

    const draw = () => {
      const s = st.current
      if (builtFor !== s.ar) build(s.ar)

      const omega = 2 / (1 + Math.PI / Math.max(nx, ny))
      if (s.running && residual > 1e-11) for (let n = 0; n < 4; n++) sor(omega)

      // ---- measurements on the current iterate
      let sum = 0
      let umax = 0
      for (let j = 1; j < ny; j++) {
        for (let i = 1; i < nx; i++) {
          sum += at(i, j)
          if (at(i, j) > umax) umax = at(i, j)
        }
      }
      const wid = nx * dx
      const hei = ny * dx
      const integral = sum * dx * dx
      const area = wid * hei
      const dh = (4 * area) / (2 * (wid + hei))
      const jc = (4 * integral) / (wid * hei ** 3)
      const fre = integral > 0 ? (2 * dh * dh) / (integral / area) : 0
      const exI = exactIntegral(wid, hei)
      const exJ = (4 * exI) / (wid * hei ** 3)
      const exF = (2 * dh * dh) / (exI / area)

      // ---- paint
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      const scale = Math.min(BOX_W / wid, BOX_H / hei)
      const pw = wid * scale
      const ph = hei * scale
      const ox = PAD_L + (BOX_W - pw) / 2
      const oy = PAD_T + (BOX_H - ph) / 2
      const cw = pw / nx
      const ch = ph / ny
      const norm = umax > 0 ? umax : 1

      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const v = 0.25 * (at(i, j) + at(i + 1, j) + at(i, j + 1) + at(i + 1, j + 1))
          ctx.fillStyle = ramp(v / norm)
          ctx.fillRect(ox + i * cw, oy + j * ch, cw + 0.9, ch + 0.9)
        }
      }

      // contour lines at 8 levels
      ctx.strokeStyle = 'rgba(15,23,42,0.55)'
      ctx.lineWidth = 1
      for (let l = 1; l <= 8; l++) {
        const lev = (l / 9) * norm
        ctx.beginPath()
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            const a = at(i, j)
            const b = at(i + 1, j)
            const c = at(i, j + 1)
            if ((a - lev) * (b - lev) < 0) {
              const t = (lev - a) / (b - a)
              ctx.moveTo(ox + (i + t) * cw, oy + j * ch)
              ctx.lineTo(ox + (i + t) * cw, oy + (j + 1) * ch)
            }
            if ((a - lev) * (c - lev) < 0) {
              const t = (lev - a) / (c - a)
              ctx.moveTo(ox + i * cw, oy + (j + t) * ch)
              ctx.lineTo(ox + (i + 1) * cw, oy + (j + t) * ch)
            }
          }
        }
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(226,232,240,0.75)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(ox, oy, pw, ph)

      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = COL_TXT
      ctx.fillText(`w / h = ${wid.toFixed(2)} : ${hei.toFixed(2)}`, ox, oy + ph + 20)
      ctx.fillText(`grid ${nx} x ${ny}`, ox, oy + ph + 36)
      ctx.save()
      ctx.translate(PAD_L - 14, oy + ph / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = COL_DIM
      ctx.fillText('h', 0, 0)
      ctx.restore()

      const accent = s.mode === 'torsion' ? COL_TOR : COL_DUCT
      ctx.fillStyle = accent
      ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(
        s.mode === 'torsion'
          ? 'stress function  Φ / 2Gθ   (zero on the free surface)'
          : 'axial velocity  u μ / (−dp/dx)   (no slip on the wall)',
        PAD_L,
        30,
      )

      // colour bar
      const cbx = PAD_L
      const cby = PAD_T + BOX_H + 48
      for (let p = 0; p < 180; p++) {
        ctx.fillStyle = ramp(p / 179)
        ctx.fillRect(cbx + p, cby, 1.4, 12)
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.strokeRect(cbx, cby, 180, 12)
      ctx.fillStyle = COL_DIM
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('0', cbx - 2, cby + 26)
      ctx.fillText(umax.toFixed(4), cbx + 150, cby + 26)
      ctx.fillText(s.mode === 'torsion' ? 'peak Φ' : 'peak u', cbx + 195, cby + 10)

      // ---- readout panel
      const rows: Array<[string, string, string, boolean]> = [
        ['SOR sweeps', String(sweeps), '', false],
        ['max update', residual.toExponential(1), 'converged < 1e-11', residual < 1e-11],
      ]
      ctx.font = '12px ui-monospace, monospace'
      let y = 78
      ctx.fillStyle = COL_TXT
      ctx.fillText('relaxation', PANEL_X, 58)
      for (const [k, v, note, ok] of rows) {
        ctx.fillStyle = COL_DIM
        ctx.fillText(k, PANEL_X, y)
        ctx.fillStyle = ok ? COL_OK : '#cbd5e1'
        ctx.fillText(v, PANEL_X + 118, y)
        if (note) {
          ctx.fillStyle = COL_DIM
          ctx.font = '10px ui-monospace, monospace'
          ctx.fillText(note, PANEL_X, y + 14)
          ctx.font = '12px ui-monospace, monospace'
          y += 14
        }
        y += 20
      }

      const card = (
        title: string,
        colour: string,
        expr: string,
        val: number,
        ex: number,
        digits: number,
        top: number,
      ) => {
        ctx.fillStyle = 'rgba(148,163,184,0.08)'
        ctx.fillRect(PANEL_X - 10, top, 236, 94)
        ctx.fillStyle = colour
        ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(title, PANEL_X, top + 20)
        ctx.fillStyle = COL_DIM
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(expr, PANEL_X, top + 38)
        ctx.fillStyle = '#e2e8f0'
        ctx.font = '20px ui-monospace, monospace'
        ctx.fillText(val.toFixed(digits), PANEL_X, top + 64)
        const err = ex !== 0 ? (100 * (val - ex)) / ex : 0
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillStyle = COL_DIM
        ctx.fillText(`series ${ex.toFixed(digits)}`, PANEL_X + 104, top + 58)
        ctx.fillStyle = Math.abs(err) < 1.5 ? COL_OK : '#fbbf24'
        ctx.fillText(`${err >= 0 ? '+' : ''}${err.toFixed(2)} %`, PANEL_X + 104, top + 74)
      }

      card('torsion constant', COL_TOR, 'J / (w h³) = 4∫w dA', jc, exJ, 5, 150)
      card('laminar friction group', COL_DUCT, 'f·Re = 2 Dh² / mean(w)', fre, exF, 3, 262)

      ctx.fillStyle = COL_DIM
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('both cards read the same field', PANEL_X, 374)

      frame += 1
      if (frame % 12 === 0) {
        setReadRef.current({ sweeps, jc, fre, exJ, exF, res: residual })
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ relax'}
        </button>
        <button style={btn(mode === 'torsion', COL_TOR)} onClick={() => setMode('torsion')}>
          read as torsion
        </button>
        <button style={btn(mode === 'duct', COL_DUCT)} onClick={() => setMode('duct')}>
          read as duct flow
        </button>
        <label style={label}>
          <span style={nameS}>aspect ratio w/h</span>
          <input
            type="range"
            min={1}
            max={7}
            step={0.5}
            value={ar}
            onChange={(e) => setAr(parseFloat(e.target.value))}
          />
          <span style={mono}>{ar.toFixed(1)}</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span style={{ color: COL_TOR }}>J/(w h³) {read.jc.toFixed(5)}</span>
        <span style={{ color: COL_DUCT }}>f·Re {read.fre.toFixed(3)}</span>
        <span style={{ color: COL_DIM }}>sweeps {read.sweeps}</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag the aspect ratio: the solve restarts and both cards refill from the one field. Watch that the two numbers move in
        opposite directions — J/(w h³) climbs toward 1/3 while f·Re climbs toward 96 — and that neither card ever needs a second
        matrix.
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
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 40 }

function btn(active: boolean, colour = '#38bdf8'): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(148,163,184,0.16)' : 'transparent',
    color: active ? colour : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
