'use client'

import { useEffect, useRef, useState } from 'react'

// Why a fully explicit solver dies in the low Mach regime.
//
// The Euler characteristics travel at u, u + c/sqrt(eps), u - c/sqrt(eps) with
// eps = Mach^2. An explicit scheme must resolve the fastest one:
//
//   dt_explicit = CFL dx / (u + c/sqrt(eps))   ->  0   as eps -> 0,
//
// while the IMEX scheme of Dimarco et al. (2017) treats the acoustic part
// implicitly and keeps the material time step
//
//   dt_IMEX = CFL dx / (2u),
//
// which does not move when eps shrinks. This x-t diagram draws the three
// characteristics (periodic domain, so they wrap) and the stack of time levels
// each scheme has to climb to reach t = 1.

const U = 1 // material speed
const C = 1 // reference sound speed
const NCELL = 40
const DXC = 1 / NCELL
const TFINAL = 1
const X0 = 0.5
const MAX_LINES = 400
const MAX_SEG = 400

const CW = 660
const CH = 340

type Mode = 'explicit' | 'imex'

export function AcousticCFLBudget() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const markerRef = useRef<number>(0) // marker time along the acoustic ray
  const lastRef = useRef<number>(0)

  const [epsExp, setEpsExp] = useState<number>(-4)
  const [mode, setMode] = useState<Mode>('explicit')
  const [cfl, setCfl] = useState<number>(0.9)

  const eps = Math.pow(10, epsExp)
  const cs = C / Math.sqrt(eps) // acoustic speed
  const dtExplicit = (cfl * DXC) / (U + cs)
  const dtImex = (cfl * DXC) / (2 * U)
  const stepsExplicit = Math.ceil(TFINAL / dtExplicit)
  const stepsImex = Math.ceil(TFINAL / dtImex)
  const dtSel = mode === 'explicit' ? dtExplicit : dtImex
  const stepsSel = mode === 'explicit' ? stepsExplicit : stepsImex
  const clipped = stepsSel > MAX_LINES

  const epsRef = useRef<number>(eps)
  const modeRef = useRef<Mode>(mode)
  const cflRef = useRef<number>(cfl)
  epsRef.current = eps
  modeRef.current = mode
  cflRef.current = cfl

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = Math.round(CW * dpr)
    canvas.height = Math.round(CH * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const padL = 54
    const padR = 16
    const padT = 20
    const padB = 34
    const plotW = CW - padL - padR
    const plotH = CH - padT - padB
    const X = (x: number) => padL + x * plotW
    const Y = (t: number) => padT + (1 - t / TFINAL) * plotH // t upward

    // one characteristic ray from (X0, 0), wrapped on the periodic domain
    const drawRay = (v: number, color: string, width: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      let t = 0
      let x = X0
      let seg = 0
      while (t < TFINAL && seg < MAX_SEG) {
        const speed = Math.abs(v)
        const dir = v >= 0 ? 1 : -1
        const dist = dir > 0 ? 1 - x : x
        const dtEdge = speed > 1e-12 ? dist / speed : Infinity
        const tEnd = Math.min(TFINAL, t + dtEdge)
        const xEnd = x + v * (tEnd - t)
        ctx.moveTo(X(x), Y(t))
        ctx.lineTo(X(Math.max(0, Math.min(1, xEnd))), Y(tEnd))
        if (tEnd >= TFINAL) break
        t = tEnd
        x = dir > 0 ? 0 : 1
        seg++
      }
      ctx.stroke()
    }

    const render = (now: number) => {
      const dtFrame = lastRef.current === 0 ? 16 : Math.min(50, now - lastRef.current)
      lastRef.current = now
      markerRef.current += (dtFrame / 1000) * (TFINAL / 6) // 6 s sweep
      if (markerRef.current > TFINAL) markerRef.current = 0
      const tm = markerRef.current

      const e = epsRef.current
      const cLocal = C / Math.sqrt(e)
      const cflLocal = cflRef.current
      const isExp = modeRef.current === 'explicit'
      const dtStep = isExp ? (cflLocal * DXC) / (U + cLocal) : (cflLocal * DXC) / (2 * U)
      const nSteps = Math.ceil(TFINAL / dtStep)

      // ---- background ----
      ctx.clearRect(0, 0, CW, CH)
      const bg = ctx.createLinearGradient(0, 0, 0, CH)
      bg.addColorStop(0, '#0b1524')
      bg.addColorStop(1, '#080f1c')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, CW, CH)

      // ---- time-level stack ----
      const drawn = Math.min(nSteps, MAX_LINES)
      const stride = nSteps / drawn
      ctx.strokeStyle = isExp ? 'rgba(248,113,113,0.45)' : 'rgba(56,225,200,0.55)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let k = 1; k <= drawn; k++) {
        const t = Math.min(TFINAL, k * stride * dtStep)
        const y = Math.round(Y(t)) + 0.5
        ctx.moveTo(padL, y)
        ctx.lineTo(padL + plotW, y)
      }
      ctx.stroke()

      // ---- acoustic reach of the current time level ----
      const reach = Math.min(1, cLocal * tm)
      ctx.fillStyle = 'rgba(96,165,250,0.10)'
      ctx.fillRect(X(Math.max(0, X0 - reach)), Y(tm), (Math.min(1, X0 + reach) - Math.max(0, X0 - reach)) * plotW, Y(0) - Y(tm))

      // ---- characteristics ----
      drawRay(U + cLocal, 'rgba(96,165,250,0.85)', 1.6) // u + c/sqrt(eps)
      drawRay(U - cLocal, 'rgba(167,139,250,0.75)', 1.6) // u - c/sqrt(eps)
      drawRay(U, '#fbbf24', 2.4) // u (material)

      // ---- animated markers ----
      const wrap = (x: number) => ((x % 1) + 1) % 1
      const xa = wrap(X0 + (U + cLocal) * tm)
      const xu = wrap(X0 + U * tm)
      // comet tail along the fast acoustic ray
      const tail = Math.min(0.14, (U + cLocal) * 0.008)
      ctx.strokeStyle = 'rgba(96,165,250,0.55)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(X(Math.max(0, xa - tail)), Y(tm))
      ctx.lineTo(X(xa), Y(tm))
      ctx.stroke()
      ctx.fillStyle = '#60a5fa'
      ctx.beginPath()
      ctx.arc(X(xa), Y(tm), 4.2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(X(xu), Y(tm), 4.2, 0, 2 * Math.PI)
      ctx.fill()
      // sweep line at the current time
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(padL, Y(tm))
      ctx.lineTo(padL + plotW, Y(tm))
      ctx.stroke()
      ctx.setLineDash([])

      // ---- axes ----
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, padT)
      ctx.lineTo(padL, padT + plotH)
      ctx.lineTo(padL + plotW, padT + plotH)
      ctx.stroke()

      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.fillStyle = 'rgba(226,232,240,0.72)'
      ctx.textAlign = 'right'
      for (const tt of [0, 0.5, 1]) ctx.fillText('t=' + tt.toFixed(1), padL - 7, Y(tt) + 4)
      ctx.textAlign = 'center'
      for (const xt of [0, 0.5, 1]) ctx.fillText(xt.toFixed(1), X(xt), padT + plotH + 17)
      ctx.fillStyle = 'rgba(226,232,240,0.9)'
      ctx.fillText('x  (periodic domain — rays wrap around)', padL + plotW / 2, CH - 6)
      ctx.save()
      ctx.translate(14, padT + plotH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('t', 0, 0)
      ctx.restore()

      // ---- legend ----
      ctx.textAlign = 'left'
      let ly = padT + 13
      const legend: [string, string][] = [
        ['#fbbf24', 'material  u = 1'],
        ['#60a5fa', 'acoustic  u + c/√ε = ' + (U + cLocal).toFixed(1)],
        ['#a78bfa', 'acoustic  u − c/√ε = ' + (U - cLocal).toFixed(1)],
        [
          isExp ? '#f87171' : '#38e1c8',
          (isExp ? 'explicit' : 'IMEX') + ' time levels: ' + nSteps + (nSteps > MAX_LINES ? ' (showing ' + MAX_LINES + ')' : ''),
        ],
      ]
      for (const [col, text] of legend) {
        ctx.fillStyle = col
        ctx.fillRect(padL + 8, ly - 7, 14, 3)
        ctx.fillStyle = 'rgba(226,232,240,0.82)'
        ctx.fillText(text, padL + 28, ly)
        ly += 15
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={shell}>
      <div style={caption}>
        Acoustic CFL budget — explicit vs IMEX time step, x–t diagram (Δx = 1/{NCELL})
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: CW, height: 'auto', display: 'block', borderRadius: 8 }}
      />

      <div style={controlGrid}>
        <label style={lab}>
          <span>
            Mach² ε = <b style={{ color: '#fbbf24' }}>{eps.toExponential(2)}</b>
            <span style={faint}>{'  ·  Mach = ' + Math.sqrt(eps).toExponential(1)}</span>
          </span>
          <input
            type="range"
            min={-4}
            max={0}
            step={0.05}
            value={epsExp}
            onChange={(e) => setEpsExp(parseFloat(e.target.value))}
            style={slider}
          />
        </label>

        <label style={lab}>
          <span>
            CFL = <b style={{ color: '#fbbf24' }}>{cfl.toFixed(2)}</b>
          </span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={cfl}
            onChange={(e) => setCfl(parseFloat(e.target.value))}
            style={slider}
          />
        </label>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setMode('explicit')} style={btn(mode === 'explicit', '#f87171')}>
            Explicit — Δt = CFL·Δx/(u + c/√ε)
          </button>
          <button onClick={() => setMode('imex')} style={btn(mode === 'imex', '#38e1c8')}>
            IMEX — Δt = CFL·Δx/(2u)
          </button>
        </div>
      </div>

      <div style={readoutRow}>
        <div style={cell}>
          <div style={cellKey}>acoustic speed c/√ε</div>
          <div style={{ ...cellVal, color: '#60a5fa' }}>{cs.toFixed(1)}</div>
        </div>
        <div style={cell}>
          <div style={cellKey}>Δt ({mode === 'explicit' ? 'explicit' : 'IMEX'})</div>
          <div style={{ ...cellVal, color: mode === 'explicit' ? '#f87171' : '#38e1c8' }}>
            {dtSel.toExponential(2)}
          </div>
        </div>
        <div style={cell}>
          <div style={cellKey}>steps to t = 1</div>
          <div style={cellVal}>
            <span style={{ color: '#f87171' }}>{stepsExplicit}</span>
            <span style={faint}> explicit vs </span>
            <span style={{ color: '#38e1c8' }}>{stepsImex}</span>
            <span style={faint}> IMEX</span>
          </div>
        </div>
        <div style={cell}>
          <div style={cellKey}>speed-up</div>
          <div style={{ ...cellVal, color: '#fbbf24' }}>
            ×{(stepsExplicit / stepsImex).toFixed(1)}
          </div>
        </div>
      </div>

      {clipped && (
        <div style={{ ...faint, marginTop: 8, fontSize: 12 }}>
          Time levels clipped: {stepsSel} levels needed, only {MAX_LINES} drawn (evenly subsampled).
        </div>
      )}

      <div style={hint}>
        Drag ε down to 1e-4 and compare the two step counts — the acoustic rays flatten toward
        horizontal while the explicit stack collapses into a solid block, yet the IMEX spacing never
        moves.
      </div>
    </div>
  )
}

const shell: React.CSSProperties = {
  border: '1px solid #1e2a3d',
  borderRadius: 12,
  padding: 16,
  background: '#0a1220',
  margin: '1.5rem 0',
  color: '#dbe4f0',
  fontFamily: 'system-ui, sans-serif',
}
const caption: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 0.3,
  color: '#9fb0c6',
  marginBottom: 10,
}
const controlGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
  marginTop: 14,
}
const lab: React.CSSProperties = {
  fontSize: 13,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const slider: React.CSSProperties = { width: '100%', accentColor: '#fbbf24' }
const faint: React.CSSProperties = { color: '#7a8599', fontSize: 12 }
const readoutRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 8,
  marginTop: 14,
}
const cell: React.CSSProperties = {
  background: '#0f1a2c',
  borderRadius: 6,
  padding: '8px 10px',
}
const cellKey: React.CSSProperties = { fontSize: 11, color: '#7a8599' }
const cellVal: React.CSSProperties = {
  fontSize: 14,
  fontVariantNumeric: 'tabular-nums',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}
const hint: React.CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  lineHeight: 1.6,
  color: '#9fb0c6',
  borderLeft: '2px solid #fbbf24',
  paddingLeft: 10,
}
function btn(active: boolean, accent: string): React.CSSProperties {
  return {
    padding: '7px 10px',
    borderRadius: 6,
    border: `1px solid ${active ? accent : '#26344a'}`,
    background: active ? 'rgba(251,191,36,0.10)' : '#101a2b',
    color: active ? accent : '#9fb0c6',
    cursor: 'pointer',
    fontSize: 12,
  }
}
