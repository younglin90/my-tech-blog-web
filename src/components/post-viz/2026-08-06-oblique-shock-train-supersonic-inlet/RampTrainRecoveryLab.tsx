'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The whole argument for an external-compression inlet in one picture.
//
// One normal shock at M = 3 keeps 32.8% of the stagnation pressure. Four 8-deg
// ramps ahead of the same terminal shock keep 82.4% -- 2.5x more -- and no
// extra energy was spent. Nothing was added: the deceleration was merely
// chopped into pieces.
//
// The reason is that the loss is a very steep function of the normal Mach
// number. p02/p01 - 1 ~ -(Mn^2 - 1)^3 near Mn = 1, so N shocks each doing 1/N
// of the work lose roughly 1/N^2 of what one shock loses. Cubic penalty,
// linear splitting -- the split always wins.
// ---------------------------------------------------------------------------

const W = 700
const H = 430
const GAM = 1.4
const DEG = Math.PI / 180

function p0Ratio(mn: number): number {
  if (mn <= 1) return 1
  const m2 = mn * mn
  const a = ((GAM + 1) * m2 * 0.5) / (1 + ((GAM - 1) * m2) / 2)
  const b = (GAM + 1) / (2 * GAM * m2 - (GAM - 1))
  return Math.pow(a, GAM / (GAM - 1)) * Math.pow(b, 1 / (GAM - 1))
}

function machNormalAfter(mn: number): number {
  const m2 = mn * mn
  return Math.sqrt((1 + ((GAM - 1) / 2) * m2) / (GAM * m2 - (GAM - 1) / 2))
}

function thetaOfBeta(M: number, beta: number): number {
  const s = Math.sin(beta)
  const num = 2 * (Math.cos(beta) / s) * (M * M * s * s - 1)
  const den = M * M * (GAM + Math.cos(2 * beta)) + 2
  return Math.atan2(num, den)
}

function detachLimit(M: number): { thMax: number; betaStar: number } {
  let lo = Math.asin(1 / M)
  let hi = Math.PI / 2
  for (let i = 0; i < 90; i++) {
    const a = lo + (hi - lo) / 3
    const b = hi - (hi - lo) / 3
    if (thetaOfBeta(M, a) < thetaOfBeta(M, b)) lo = a
    else hi = b
  }
  const betaStar = (lo + hi) / 2
  return { thMax: thetaOfBeta(M, betaStar), betaStar }
}

// weak branch only -- that is what an attached ramp produces
function solveBetaWeak(M: number, theta: number): number | null {
  if (M <= 1.0000001) return null
  const { thMax, betaStar } = detachLimit(M)
  if (theta > thMax) return null
  let lo = Math.asin(1 / M)
  let hi = betaStar
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2
    if (thetaOfBeta(M, mid) < theta) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

type Step = {
  kind: 'oblique' | 'normal'
  Mbefore: number
  Mafter: number
  beta: number // wave angle relative to the local incoming flow
  f: number // p02/p01 of this single shock
}

type Chain = {
  steps: Step[]
  total: number
  failAt: number // -1 = fine, else the 1-based ramp index that cannot turn
  Mexit: number
}

function buildChain(Minf: number, N: number, delta: number, terminal: boolean): Chain {
  let M = Minf
  let total = 1
  const steps: Step[] = []
  let failAt = -1
  for (let k = 0; k < N; k++) {
    const beta = solveBetaWeak(M, delta)
    if (beta === null) {
      failAt = k + 1
      break
    }
    const mn1 = M * Math.sin(beta)
    const f = p0Ratio(mn1)
    const Mafter = machNormalAfter(mn1) / Math.sin(beta - delta)
    total *= f
    steps.push({ kind: 'oblique', Mbefore: M, Mafter, beta, f })
    M = Mafter
  }
  if (terminal && failAt < 0) {
    const f = p0Ratio(M)
    const Mafter = M > 1 ? machNormalAfter(M) : M
    total *= f
    steps.push({ kind: 'normal', Mbefore: M, Mafter, beta: Math.PI / 2, f })
    M = Mafter
  }
  return { steps, total, failAt, Mexit: M }
}

function lossColor(f: number): string {
  if (f > 0.97) return '#34d399'
  if (f >= 0.85) return '#fbbf24'
  return '#f87171'
}

// ---- panel frames -------------------------------------------------------

const GX = 46
const GY = 28
const GW = 620
const GH = 158

const WX = 66
const WY = 208
const WW = 578
const WHt = 110

export function RampTrainRecoveryLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [minf, setMinf] = useState(3.0)
  const [nramp, setNramp] = useState(3)
  const [delta, setDelta] = useState(8)
  const [terminal, setTerminal] = useState(true)

  const cfg = useRef({ minf, nramp, delta, terminal })
  cfg.current = { minf, nramp, delta, terminal }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    let frame = 0

    const draw = () => {
      frame++
      const Minf = cfg.current.minf
      const N = cfg.current.nramp
      const dDeg = cfg.current.delta
      const d = dDeg * DEG
      const term = cfg.current.terminal

      const chain = buildChain(Minf, N, d, term)
      const baseline = p0Ratio(Minf)
      const gain = chain.total / baseline

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // ============ TOP: ramp geometry, drawn to scale ============
      const nOK = chain.steps.filter((s) => s.kind === 'oblique').length
      const nSeg = nOK + 1 // wall segments: freestream + one per successful ramp
      // unit polyline (y up), one unit per segment
      const pts: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }]
      for (let k = 0; k < nSeg; k++) {
        const a = k * d
        const p = pts[pts.length - 1]
        pts.push({ x: p.x + Math.cos(a), y: p.y + Math.sin(a) })
      }
      const spanX = pts[pts.length - 1].x
      const spanY = pts[pts.length - 1].y
      const scale = Math.min(96, (GW - 130) / Math.max(spanX, 0.001), (GH * 0.62) / Math.max(spanY, 0.001))
      const ox = GX + 22
      const oy = GY + GH - 26
      const PX_ = (p: { x: number; y: number }) => ox + p.x * scale
      const PY_ = (p: { x: number; y: number }) => oy - p.y * scale

      ctx.save()
      ctx.beginPath()
      ctx.rect(GX, GY, GW, GH)
      ctx.clip()

      // freestream arrows
      for (let i = 0; i < 3; i++) {
        const yy = oy - 18 - i * 24
        const xx = GX + 4 + ((frame * 2.2 + i * 30) % 40)
        ctx.strokeStyle = 'rgba(56,189,248,0.55)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(xx, yy)
        ctx.lineTo(xx + 12, yy)
        ctx.stroke()
      }
      text(`M inf = ${Minf.toFixed(2)}`, GX + 2, oy - 96, '#38bdf8', 'bold 10px ui-monospace, monospace')

      // wall
      ctx.strokeStyle = 'rgba(203,213,225,0.85)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(PX_(pts[0]), PY_(pts[0]))
      for (let i = 1; i < pts.length; i++) ctx.lineTo(PX_(pts[i]), PY_(pts[i]))
      ctx.stroke()
      ctx.fillStyle = 'rgba(148,163,184,0.14)'
      ctx.beginPath()
      ctx.moveTo(PX_(pts[0]), PY_(pts[0]))
      for (let i = 1; i < pts.length; i++) ctx.lineTo(PX_(pts[i]), PY_(pts[i]))
      ctx.lineTo(PX_(pts[pts.length - 1]), GY + GH)
      ctx.lineTo(PX_(pts[0]), GY + GH)
      ctx.closePath()
      ctx.fill()

      // oblique shock lines from each ramp corner
      for (let k = 0; k < nOK; k++) {
        const st = chain.steps[k]
        const corner = pts[k + 1]
        const abs = k * d + st.beta // absolute wave angle from horizontal
        const cx0 = PX_(corner)
        const cy0 = PY_(corner)
        // extend until it leaves the panel
        let len = 900
        if (Math.cos(abs) > 1e-4) len = Math.min(len, (GX + GW - cx0) / Math.cos(abs))
        if (Math.sin(abs) > 1e-4) len = Math.min(len, (cy0 - GY) / Math.sin(abs))
        ctx.strokeStyle = lossColor(st.f)
        ctx.lineWidth = 1.4 + 14 * (1 - st.f)
        ctx.beginPath()
        ctx.moveTo(cx0, cy0)
        ctx.lineTo(cx0 + len * Math.cos(abs), cy0 - len * Math.sin(abs))
        ctx.stroke()
        text(
          `${(st.beta / DEG).toFixed(0)}`,
          cx0 + Math.min(len, 46) * Math.cos(abs) + 3,
          cy0 - Math.min(len, 46) * Math.sin(abs),
          lossColor(st.f),
          '9px ui-monospace, monospace'
        )
      }

      // terminal normal shock
      const tail = pts[pts.length - 1]
      if (term && chain.failAt < 0) {
        const st = chain.steps[chain.steps.length - 1]
        const tx = PX_(tail) + 14
        ctx.strokeStyle = lossColor(st.f)
        ctx.lineWidth = 1.4 + 14 * (1 - st.f)
        ctx.beginPath()
        ctx.moveTo(tx, PY_(tail) + 4)
        ctx.lineTo(tx, GY + 6)
        ctx.stroke()
        text('terminal normal shock', tx + 6, GY + 18, lossColor(st.f), '9.5px ui-monospace, monospace')
      }

      // particles crawling along the wall, slower after every kink
      {
        const machSeq: number[] = [Minf]
        for (let k = 0; k < nOK; k++) machSeq.push(chain.steps[k].Mafter)
        const segLen: number[] = []
        const segT: number[] = []
        let T = 0
        for (let k = 0; k < nSeg; k++) {
          const L = scale
          const v = Math.max(machSeq[Math.min(k, machSeq.length - 1)], 0.4) * 0.55
          segLen.push(L)
          segT.push(L / v)
          T += L / v
        }
        const NP = 7
        for (let p = 0; p < NP; p++) {
          const u = ((frame * 1.5 + (T * p) / NP) % T + T) % T
          let acc = 0
          let k = 0
          while (k < nSeg - 1 && acc + segT[k] < u) {
            acc += segT[k]
            k++
          }
          const fr = Math.min((u - acc) / segT[k], 1)
          const a = k * d
          const base = pts[k]
          const px = PX_(base) + fr * segLen[k] * Math.cos(a)
          const py = PY_(base) - fr * segLen[k] * Math.sin(a)
          const mLoc = machSeq[Math.min(k, machSeq.length - 1)]
          ctx.fillStyle = mLoc > 2 ? '#38bdf8' : mLoc > 1 ? '#a5b4fc' : '#f87171'
          ctx.beginPath()
          ctx.arc(px, py - 4, 2.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (chain.failAt > 0) {
        text(
          `ramp ${chain.failAt} cannot turn ${dDeg.toFixed(1)} deg - flow has slowed too much`,
          GX + 8,
          GY + 16,
          '#f87171',
          'bold 11px ui-monospace, monospace'
        )
      }
      ctx.restore()

      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.lineWidth = 1
      ctx.strokeRect(GX, GY, GW, GH)
      text(`${N} ramp(s) x ${dDeg.toFixed(1)} deg${term ? ' + terminal normal shock' : ''}`, GX + 2, GY - 8, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text('line thickness = loss of that shock', GX + GW - 214, GY - 8, '#64748b', '10px ui-monospace, monospace')

      // ============ MIDDLE: stagnation-pressure waterfall ============
      const yv = (v: number) => WY + WHt - v * WHt
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (const g of [0, 0.25, 0.5, 0.75, 1]) {
        ctx.beginPath()
        ctx.moveTo(WX, yv(g))
        ctx.lineTo(WX + WW, yv(g))
        ctx.stroke()
        text(g.toFixed(2), WX - 34, yv(g) + 4, '#64748b', '9px ui-monospace, monospace')
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.beginPath()
      ctx.moveTo(WX, WY)
      ctx.lineTo(WX, WY + WHt)
      ctx.lineTo(WX + WW, WY + WHt)
      ctx.stroke()
      ctx.save()
      ctx.translate(WX - 44, WY + WHt / 2 + 34)
      ctx.rotate(-Math.PI / 2)
      text('running p0 / p0,inf  [-]', 0, 0, '#94a3b8', '9.5px ui-monospace, monospace')
      ctx.restore()

      const S = chain.steps.length
      const cols = S + 1
      const cwid = WW / cols
      let level = 1
      // freestream column
      ctx.fillStyle = 'rgba(56,189,248,0.35)'
      ctx.fillRect(WX + 6, yv(1), cwid - 12, 5)
      text('1.0000', WX + 8, yv(1) - 7, '#38bdf8', 'bold 10px ui-monospace, monospace')
      text('freestream', WX + 8, WY + WHt + 14, '#64748b', '9px ui-monospace, monospace')
      text(`M=${Minf.toFixed(2)}`, WX + 8, WY + WHt + 26, '#38bdf8', '9px ui-monospace, monospace')

      for (let i = 0; i < S; i++) {
        const st = chain.steps[i]
        const next = level * st.f
        const x0 = WX + (i + 1) * cwid + 6
        const bw = cwid - 12
        ctx.strokeStyle = 'rgba(148,163,184,0.35)'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(x0 - cwid + 6, yv(level))
        ctx.lineTo(x0, yv(level))
        ctx.stroke()
        ctx.setLineDash([])

        const col = lossColor(st.f)
        ctx.fillStyle = col
        ctx.globalAlpha = 0.75
        ctx.fillRect(x0, yv(level), bw, Math.max(yv(next) - yv(level), 2))
        ctx.globalAlpha = 1
        ctx.strokeStyle = col
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x0, yv(next))
        ctx.lineTo(x0 + bw, yv(next))
        ctx.stroke()

        text(st.f.toFixed(4), x0, yv(level) - 6, col, 'bold 10px ui-monospace, monospace')
        text(st.kind === 'normal' ? 'normal' : `obl ${i + 1}`, x0, WY + WHt + 14, '#94a3b8', '9px ui-monospace, monospace')
        text(`M=${st.Mbefore.toFixed(2)}`, x0, WY + WHt + 26, st.kind === 'normal' ? '#f87171' : '#a5b4fc', '9px ui-monospace, monospace')
        level = next
      }
      text('each bar = one shock. bar height = the piece of p0 it eats.', WX, WY - 10, '#e2e8f0', 'bold 11px ui-monospace, monospace')

      // baseline reference line
      ctx.strokeStyle = 'rgba(248,113,113,0.75)'
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(WX, yv(baseline))
      ctx.lineTo(WX + WW, yv(baseline))
      ctx.stroke()
      ctx.setLineDash([])
      text('single normal shock', WX + WW - 118, yv(baseline) - 5, '#f87171', '9px ui-monospace, monospace')

      // ============ BOTTOM: comparison ============
      const BY = 358
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(GX, BY, GW, 58)

      text('shock train p02/p01', GX + 14, BY + 20, '#94a3b8', '10px ui-monospace, monospace')
      text(chain.total.toFixed(4), GX + 14, BY + 46, lossColor(chain.total > 0.9 ? 0.99 : chain.total > 0.6 ? 0.9 : 0.5), 'bold 22px ui-monospace, monospace')

      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.beginPath()
      ctx.moveTo(GX + 200, BY + 8)
      ctx.lineTo(GX + 200, BY + 50)
      ctx.stroke()
      text(`single normal shock at M inf = ${Minf.toFixed(2)}`, GX + 214, BY + 20, '#94a3b8', '10px ui-monospace, monospace')
      text(baseline.toFixed(4), GX + 214, BY + 46, '#f87171', 'bold 22px ui-monospace, monospace')

      ctx.beginPath()
      ctx.moveTo(GX + 424, BY + 8)
      ctx.lineTo(GX + 424, BY + 50)
      ctx.stroke()
      const glow = 0.6 + 0.4 * Math.sin(frame / 20)
      text('recovery gain', GX + 438, BY + 20, '#94a3b8', '10px ui-monospace, monospace')
      text(`${gain.toFixed(2)}x better`, GX + 438, BY + 46, `rgba(251,191,36,${0.55 + 0.45 * glow})`, 'bold 22px ui-monospace, monospace')

      text(`exit Mach = ${chain.Mexit.toFixed(3)}`, GX + GW - 150, BY - 8, '#94a3b8', '10px ui-monospace, monospace')
      text('gamma = 1.4', GX + 2, BY - 8, '#64748b', '10px ui-monospace, monospace')
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

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

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.7rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }
  const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }

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
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>M inf</span>
          <input type="range" min={1.8} max={4} step={0.05} value={minf} onChange={(e) => setMinf(parseFloat(e.target.value))} />
          <span style={mono}>{minf.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>ramps N</span>
          <input type="range" min={0} max={5} step={1} value={nramp} onChange={(e) => setNramp(parseInt(e.target.value, 10))} />
          <span style={mono}>{nramp}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>delta [deg]</span>
          <input type="range" min={2} max={14} step={0.5} value={delta} onChange={(e) => setDelta(parseFloat(e.target.value))} />
          <span style={mono}>{delta.toFixed(1)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setTerminal(!terminal)} style={btn(terminal, '#f87171')}>
          terminal normal shock: {terminal ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        keep M inf = 3.00 and delta = 8 deg, then drag <strong>N</strong> from 0 to 4 and watch the bottom number climb
        0.3283 &rarr; 0.8235 while the red terminal shock bar gets visibly thinner. now push <strong>delta</strong> up:
        each ramp bites harder, the chain runs out of Mach, and it turns red.
      </div>
    </div>
  )
}
