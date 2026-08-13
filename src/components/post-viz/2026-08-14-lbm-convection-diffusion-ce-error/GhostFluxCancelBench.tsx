'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The first moment of g^(1) carries three fluxes, not one:
//
//   sum_i c_i g_i^(1) = -tau dt [ d_t(phi u) + cs^2 grad phi - sum_i c_i S_i ]
//
// Written as  d_t phi + d_x(phi u) = -d_x J,  the pieces are
//
//   J_phys  = -D d_x phi                        the diffusion you asked for
//   J_ghost = -(tau - 1/2) dt d_t(phi u)        the one CE hands you for free
//   J_src   = +alpha (tau - 1/2) dt d_t(phi u)  the source term, at strength alpha
//
// With a uniform u, d_t phi ~ -u d_x phi, so J_ghost ~ -(u^2/cs^2) J_phys:
// it points against the physical flux and eats a fixed fraction of it. Slide
// alpha from 0 to 1 and watch the rose curve get cancelled site by site.
// ---------------------------------------------------------------------------

const W = 744
const H = 424

const CS2 = 1 / 3
const XL = 260 // plotted lattice length
const SIG0 = 9

const PX0 = 22
const PX1 = 722
const AY0 = 32
const AY1 = 150
const BY0 = 214
const BY1 = 380

export function GhostFluxCancelBench() {
  const [u, setU] = useState(0.32)
  const [tau, setTau] = useState(1.1)
  const [alpha, setAlpha] = useState(0)
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)

  const cfg = useRef({ u, tau, alpha, running })
  cfg.current = { u, tau, alpha, running }
  const st = useRef({ t: 0, x: XL * 0.3 })
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let last = 0

    const text = (s: string, x: number, y: number, col: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const c = cfg.current
      const D = CS2 * (c.tau - 0.5)
      const dEff = D * (1 - (1 - c.alpha) * (c.u * c.u) / CS2)

      if (c.running) {
        const steps = dt * 260 // lattice time steps per second
        st.current.t += steps
        st.current.x += c.u * steps
      }
      if (st.current.t > 1500) {
        st.current.t = 0
        st.current.x = XL * 0.3
      }
      const t = st.current.t
      const varr = SIG0 * SIG0 + 2 * Math.max(dEff, 1e-4) * t
      const sig = Math.sqrt(varr)
      const amp = SIG0 / sig
      const xc = (st.current.x % XL + XL) % XL

      const sx = (x: number) => PX0 + ((PX1 - PX0) * x) / XL

      // sample the three fluxes across the line
      const N = XL
      const phi = new Float64Array(N)
      const jPhys = new Float64Array(N)
      const jGhost = new Float64Array(N)
      const jSrc = new Float64Array(N)
      const jNet = new Float64Array(N)
      let fmax = 1e-9
      let pPhys = 0
      let pNet = 0
      for (let i = 0; i < N; i++) {
        let d = i - xc
        if (d > XL / 2) d -= XL
        if (d < -XL / 2) d += XL
        const p = amp * Math.exp(-(d * d) / (2 * varr))
        const dx = -(d / varr) * p
        const dxx = ((d * d) / (varr * varr) - 1 / varr) * p
        phi[i] = p
        jPhys[i] = -D * dx
        // d_t(phi u) = u (-u d_x phi + D_eff d_xx phi)
        const dtPhiU = c.u * (-c.u * dx + dEff * dxx)
        jGhost[i] = -(c.tau - 0.5) * dtPhiU
        jSrc[i] = c.alpha * (c.tau - 0.5) * dtPhiU
        jNet[i] = jPhys[i] + jGhost[i] + jSrc[i]
        fmax = Math.max(fmax, Math.abs(jPhys[i]), Math.abs(jNet[i]))
        if (Math.abs(jPhys[i]) > Math.abs(pPhys)) pPhys = jPhys[i]
        if (Math.abs(jNet[i]) > Math.abs(pNet)) pNet = jNet[i]
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ================= panel A : the scalar packet ======================
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PX0, AY1)
      ctx.lineTo(PX1, AY1)
      ctx.stroke()

      const hs = (AY1 - AY0) / 1.05
      ctx.beginPath()
      ctx.moveTo(sx(0), AY1)
      for (let i = 0; i < N; i++) ctx.lineTo(sx(i), AY1 - phi[i] * hs)
      ctx.lineTo(sx(N - 1), AY1)
      ctx.closePath()
      ctx.fillStyle = 'rgba(148,163,184,0.16)'
      ctx.fill()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const y = AY1 - phi[i] * hs
        if (i === 0) ctx.moveTo(sx(i), y)
        else ctx.lineTo(sx(i), y)
      }
      ctx.stroke()

      // drift arrow
      const ax = sx(xc)
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(ax, AY0 + 12)
      ctx.lineTo(ax + 46, AY0 + 12)
      ctx.lineTo(ax + 38, AY0 + 7)
      ctx.moveTo(ax + 46, AY0 + 12)
      ctx.lineTo(ax + 38, AY0 + 17)
      ctx.stroke()
      text(`u = ${c.u.toFixed(2)}`, ax + 52, AY0 + 16, '#38bdf8')
      text('phi(x)  drifting and spreading', PX0, AY0 - 12, '#94a3b8')

      // ================= panel B : the flux ledger ========================
      const my = (BY0 + BY1) / 2
      const fs = (BY1 - BY0) / 2 / (fmax * 1.15)
      const fy = (v: number) => my - v * fs

      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PX0, my)
      ctx.lineTo(PX1, my)
      ctx.stroke()

      const band = (arr: Float64Array, fill: string, stroke: string) => {
        ctx.beginPath()
        ctx.moveTo(sx(0), my)
        for (let i = 0; i < N; i++) ctx.lineTo(sx(i), fy(arr[i]))
        ctx.lineTo(sx(N - 1), my)
        ctx.closePath()
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = stroke
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const y = fy(arr[i])
          if (i === 0) ctx.moveTo(sx(i), y)
          else ctx.lineTo(sx(i), y)
        }
        ctx.stroke()
      }

      band(jPhys, 'rgba(56,189,248,0.20)', '#38bdf8')
      band(jGhost, 'rgba(251,113,133,0.22)', '#fb7185')
      if (c.alpha > 0.001) band(jSrc, 'rgba(52,211,153,0.20)', '#34d399')

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const y = fy(jNet[i])
        if (i === 0) ctx.moveTo(sx(i), y)
        else ctx.lineTo(sx(i), y)
      }
      ctx.stroke()

      text('flux J   (d_t phi + d_x(phi u) = -d_x J)', PX0, BY0 - 14, '#94a3b8')
      text('J_phys = -D dphi/dx', PX0 + 6, BY0 + 4, '#38bdf8')
      text('J_ghost = -(tau-1/2) dt(phi u)', PX0 + 150, BY0 + 4, '#fb7185')
      text('J_src = +alpha (tau-1/2) dt(phi u)', PX0 + 362, BY0 + 4, '#34d399')
      text('J_net', PX0 + 610, BY0 + 4, '#fbbf24', 'bold 11px ui-monospace, monospace')
      text('x', PX1 - 10, BY1 + 16, '#64748b')

      const ratio = pPhys !== 0 ? pNet / pPhys : 1
      text(
        `peak J_net / peak J_phys = ${ratio.toFixed(3)}`,
        PX0 + 6,
        BY1 - 6,
        Math.abs(ratio - 1) < 0.02 ? '#34d399' : '#fb7185',
        'bold 12px ui-monospace, monospace',
      )
      text(`1 - (1-alpha) u^2/cs^2 = ${(1 - (1 - c.alpha) * (c.u * c.u) / CS2).toFixed(3)}`, PX0 + 262, BY1 - 6, '#a78bfa', 'bold 12px ui-monospace, monospace')

      if (++frame % 10 === 0) setTick((t2) => t2 + 1)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const D = CS2 * (tau - 0.5)
  const dEff = D * (1 - (1 - alpha) * (u * u) / CS2)

  const row: CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>alpha (source strength)</span>
          <input type="range" min={0} max={1} step={0.02} value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} />
          <span style={mono}>{alpha.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>u</span>
          <input type="range" min={0.05} max={0.45} step={0.01} value={u} onChange={(e) => setU(parseFloat(e.target.value))} />
          <span style={mono}>{u.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>tau</span>
          <input type="range" min={0.6} max={1.8} step={0.05} value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} />
          <span style={mono}>{tau.toFixed(2)}</span>
        </label>
      </div>

      <div style={row}>
        <button
          onClick={() => setRunning(!running)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            border: '1px solid rgba(148,163,184,0.35)',
            background: running ? 'transparent' : '#fbbf24',
            color: running ? '#cbd5e1' : '#08111f',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {running ? 'freeze' : 'let it drift'}
        </button>
        <span data-tick={tick} style={{ ...label, color: '#94a3b8' }}>
          <span style={name}>D_eff / D =</span>
          <span style={mono}>{(dEff / D).toFixed(3)}</span>
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        At alpha = 0 the rose lobe sits mirror-imaged under the blue one: the ghost flux points the wrong way everywhere, so the
        amber net curve is visibly shorter than the blue physical flux. Raise u and the rose lobe grows as u&sup2; while blue
        stays put. Then drag alpha to 1 &mdash; green fills in exactly on top of rose, and amber lands back on blue at every x.
      </div>
    </div>
  )
}
