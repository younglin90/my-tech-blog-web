'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One face, two answers.
//
// The coarse cell sitting just outside the patch was updated with the coarse
// flux F_c through the interface. The r fine cells on the other side of that
// same face were updated, r substeps in a row, with their own fluxes. Those two
// numbers do not agree, and the difference
//
//   dF = (1/r) sum_s F_f^s  -  F_c
//
// is mass that was created or destroyed at the coarse-fine boundary. A flux
// register stores dF for every interface face and pays it back to the coarse
// neighbor at the end of the coarse step.
//
// Both worlds below run the same two-level solve. The top one throws dF away.
// The bottom one cashes it in. Watch the drift trace on the right.
// ---------------------------------------------------------------------------

const W = 726
const H = 452

const NC = 24 // coarse cells, periodic
const I0 = 9 // patch covers coarse cells [I0, I1)
const I1 = 15
const U = 1.0

const GX = 18
const GW = W - 2 * GX
const ROW_A = 62
const ROW_B = 168
const ROW_H = 74

type World = { c: Float64Array; f: Float64Array; dlo: number; dhi: number }

export function FluxRegisterLedger() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [ratio, setRatio] = useState(4)
  const [cfl, setCfl] = useState(0.6)
  const [width, setWidth] = useState(0.05)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [stepKey, setStepKey] = useState(0)
  const [read, setRead] = useState({ step: 0, dlo: 0, dhi: 0, da: 0, db: 0 })

  const cfg = useRef({ ratio, cfl, width, running, resetKey, stepKey })
  cfg.current = { ratio, cfl, width, running, resetKey, stepKey }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const dx = 1 / NC
    const bump = (x: number, w: number) => Math.exp(-(((x - 0.22) / w) ** 2))

    const mkWorld = (w: number, rr: number): World => {
      const c = new Float64Array(NC)
      for (let i = 0; i < NC; i++) c[i] = bump((i + 0.5) * dx, w)
      const f = new Float64Array(rr * (I1 - I0))
      for (let k = 0; k < f.length; k++) f[k] = bump((I0 + (k + 0.5) / rr) * dx, w)
      return { c, f, dlo: 0, dhi: 0 }
    }

    const mass = (w: World) => {
      let m = 0
      for (let i = 0; i < NC; i++) if (i < I0 || i >= I1) m += w.c[i] * dx
      for (let k = 0; k < nf; k++) m += w.f[k] * (dx / r)
      return m
    }

    let r = cfg.current.ratio
    let nf = r * (I1 - I0)
    let A = mkWorld(cfg.current.width, r)
    let B = mkWorld(cfg.current.width, r)
    let m0 = mass(A)
    let step = 0
    let hist: Array<[number, number]> = []
    let lastReset = cfg.current.resetKey
    let lastStep = cfg.current.stepKey
    let acc = 0
    let frame = 0

    const build = () => {
      r = cfg.current.ratio
      nf = r * (I1 - I0)
      A = mkWorld(cfg.current.width, r)
      B = mkWorld(cfg.current.width, r)
      m0 = mass(A)
      step = 0
      hist = []
    }

    const advance = (w: World, reflux: boolean) => {
      const dt = (cfg.current.cfl * dx) / U
      const dtf = dt / r
      const dxf = dx / r
      // coarse: donor-cell flux on the face left of cell i
      const Fc = new Float64Array(NC + 1)
      for (let i = 0; i <= NC; i++) Fc[i] = U * w.c[(i - 1 + NC) % NC]
      const FcLo = Fc[I0]
      const FcHi = Fc[I1]
      const cn = new Float64Array(NC)
      for (let i = 0; i < NC; i++) cn[i] = w.c[i] - (dt / dx) * (Fc[(i + 1) % (NC + 1)] - Fc[i])

      // fine: r substeps, ghost cell injected from the coarse neighbor
      let FfLo = 0
      let FfHi = 0
      for (let s = 0; s < r; s++) {
        const Ff = new Float64Array(nf + 1)
        Ff[0] = U * cn[I0 - 1]
        for (let k = 1; k <= nf; k++) Ff[k] = U * w.f[k - 1]
        FfLo += Ff[0] / r
        FfHi += Ff[nf] / r
        for (let k = 0; k < nf; k++) w.f[k] -= (dtf / dxf) * (Ff[k + 1] - Ff[k])
      }
      // average down onto the covered coarse cells
      for (let i = I0; i < I1; i++) {
        let s = 0
        for (let k = 0; k < r; k++) s += w.f[(i - I0) * r + k]
        cn[i] = s / r
      }
      w.dlo = FfLo - FcLo
      w.dhi = FfHi - FcHi
      if (reflux) {
        cn[I0 - 1] -= (dt / dx) * w.dlo
        cn[I1] += (dt / dx) * w.dhi
      }
      w.c = cn
    }

    const doStep = () => {
      advance(A, false)
      advance(B, true)
      step++
      hist.push([(mass(A) - m0) / m0, (mass(B) - m0) / m0])
      if (hist.length > 420) hist.shift()
    }

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const drawRow = (w: World, y: number, title: string, col: string) => {
      const cw = GW / NC
      const base = y + ROW_H
      const scale = ROW_H - 12
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.beginPath()
      ctx.moveTo(GX, base)
      ctx.lineTo(GX + GW, base)
      ctx.stroke()

      // coarse leaf cells
      ctx.fillStyle = 'rgba(100,116,139,0.55)'
      ctx.beginPath()
      for (let i = 0; i < NC; i++) {
        if (i >= I0 && i < I1) continue
        const h = Math.max(0, w.c[i]) * scale
        ctx.rect(GX + i * cw + 1, base - h, cw - 2, h)
      }
      ctx.fill()

      // fine leaf cells
      const fw = cw / r
      ctx.fillStyle = col
      ctx.beginPath()
      for (let k = 0; k < nf; k++) {
        const h = Math.max(0, w.f[k]) * scale
        ctx.rect(GX + I0 * cw + k * fw + 0.4, base - h, fw - 0.8, h)
      }
      ctx.fill()

      // patch outline + the two interface faces
      ctx.strokeStyle = 'rgba(56,189,248,0.5)'
      ctx.setLineDash([3, 3])
      ctx.strokeRect(GX + I0 * cw, y + 4, (I1 - I0) * cw, ROW_H - 4)
      ctx.setLineDash([])
      for (const fx of [GX + I0 * cw, GX + I1 * cw]) {
        ctx.strokeStyle = '#f472b6'
        ctx.beginPath()
        ctx.moveTo(fx, y + 2)
        ctx.lineTo(fx, base + 6)
        ctx.stroke()
      }
      text(title, GX, y - 6, col, 'bold 12px ui-monospace, monospace')
      text('coarse leaf', GX + 150, y - 6, '#64748b')
      text(`fine leaf (r = ${r})`, GX + 236, y - 6, col)
    }

    const draw = () => {
      const { running: run, resetKey: rk, stepKey: sk, ratio: rr, width: ww, cfl: cc } = cfg.current
      if (rk !== lastReset || rr !== r) {
        lastReset = rk
        build()
      }
      if (sk !== lastStep) {
        lastStep = sk
        doStep()
      }
      if (run) {
        acc += 1
        if (acc >= 2) {
          acc = 0
          doStep()
        }
      }

      ctx.fillStyle = '#080f1b'
      ctx.fillRect(0, 0, W, H)

      text('two-level AMR advection, same solve, one difference', GX, 24, '#e2e8f0', 'bold 13px ui-monospace, monospace')
      text(`CFL ${cc.toFixed(2)}  ·  sigma ${ww.toFixed(3)}  ·  coarse step ${step}`, GX + 400, 24, '#64748b')

      drawRow(A, ROW_A, 'flux register discarded', '#f87171')
      drawRow(B, ROW_B, 'flux register applied', '#34d399')

      // ---- ledger ---------------------------------------------------------
      const LY = 282
      text('FLUX REGISTER  dF = <F_fine> - F_coarse', GX, LY - 8, '#94a3b8', 'bold 11px ui-monospace, monospace')
      const rows: Array<[string, number]> = [
        ['left face  i = ' + I0, B.dlo],
        ['right face i = ' + I1, B.dhi],
      ]
      let ly = LY + 12
      const maxd = Math.max(1e-9, Math.abs(B.dlo), Math.abs(B.dhi))
      for (const [nm, d] of rows) {
        text(nm, GX, ly + 10, '#cbd5e1')
        const bx = GX + 150
        const bw = 150
        ctx.fillStyle = 'rgba(148,163,184,0.15)'
        ctx.fillRect(bx, ly, bw, 13)
        ctx.fillStyle = d >= 0 ? '#fbbf24' : '#38bdf8'
        const l = (bw / 2) * Math.min(1, Math.abs(d) / maxd)
        ctx.fillRect(d >= 0 ? bx + bw / 2 : bx + bw / 2 - l, ly, l, 13)
        ctx.strokeStyle = 'rgba(226,232,240,0.4)'
        ctx.beginPath()
        ctx.moveTo(bx + bw / 2, ly - 2)
        ctx.lineTo(bx + bw / 2, ly + 15)
        ctx.stroke()
        text(d.toExponential(2), bx + bw + 10, ly + 11, '#e2e8f0')
        ly += 24
      }
      text('this is the mass the interface invented last step', GX, ly + 12, '#64748b')

      // ---- drift plot ------------------------------------------------------
      const PX2 = 396
      const PY2 = 292
      const PW = W - PX2 - GX
      const PH = 128
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(PX2, PY2, PW, PH)
      let m = 4e-4
      for (const [a, b] of hist) m = Math.max(m, Math.abs(a), Math.abs(b))
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.beginPath()
      ctx.moveTo(PX2, PY2 + PH / 2)
      ctx.lineTo(PX2 + PW, PY2 + PH / 2)
      ctx.stroke()
      const plot = (idx: 0 | 1, col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 1.6
        ctx.beginPath()
        hist.forEach((h, k) => {
          const x = PX2 + (PW * k) / Math.max(hist.length - 1, 1)
          const y = PY2 + PH / 2 - (PH / 2 - 4) * (h[idx] / m)
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.lineWidth = 1
      }
      plot(0, '#f87171')
      plot(1, '#34d399')
      text('total mass drift  (M - M0) / M0', PX2, PY2 - 8, '#94a3b8', 'bold 11px ui-monospace, monospace')
      text(`+${m.toExponential(1)}`, PX2 + PW - 62, PY2 + 12, '#64748b', '10px ui-monospace, monospace')
      text(`-${m.toExponential(1)}`, PX2 + PW - 62, PY2 + PH - 5, '#64748b', '10px ui-monospace, monospace')
      const da = hist.length ? hist[hist.length - 1][0] : 0
      const db = hist.length ? hist[hist.length - 1][1] : 0
      text(`discarded  ${da >= 0 ? '+' : ''}${da.toExponential(3)}`, PX2, PY2 + PH + 18, '#f87171')
      text(`applied    ${db >= 0 ? '+' : ''}${db.toExponential(3)}`, PX2, PY2 + PH + 34, '#34d399')

      if (frame++ % 12 === 0) setRead({ step, dlo: B.dlo, dhi: B.dhi, da, db })
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.8rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }
  const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 38 }
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
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>ratio r</span>
          <input type="range" min={2} max={8} step={2} value={ratio} onChange={(e) => setRatio(parseInt(e.target.value))} />
          <span style={mono}>{ratio}</span>
        </label>
        <label style={label}>
          <span style={name}>CFL</span>
          <input type="range" min={0.1} max={0.9} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
          <span style={mono}>{cfl.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>pulse sigma</span>
          <input
            type="range"
            min={0.02}
            max={0.14}
            step={0.005}
            value={width}
            onChange={(e) => {
              setWidth(parseFloat(e.target.value))
              setResetKey((v) => v + 1)
            }}
          />
          <span style={mono}>{width.toFixed(3)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={() => setStepKey((v) => v + 1)} style={btn(false, '#fbbf24')}>
          single step
        </button>
        <button onClick={() => setResetKey((v) => v + 1)} style={btn(false, '#a78bfa')}>
          reset
        </button>
        <span style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
          step {read.step} &nbsp;·&nbsp; drift {read.da.toExponential(2)} vs {read.db.toExponential(2)}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        the pulse is harmless until it reaches the pink face. From that step on the red trace walks away from zero and never
        comes back, while the green one stays pinned at machine zero. Sharpen the pulse (sigma down) or raise r and the red
        excursion grows &mdash; the register grows with it, because it is exactly the same number with the opposite sign.
      </div>
    </div>
  )
}
