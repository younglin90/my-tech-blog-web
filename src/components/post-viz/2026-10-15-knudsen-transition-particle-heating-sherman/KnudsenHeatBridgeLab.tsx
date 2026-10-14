'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 380
const LAM = 0.336e-6 // mean free path of air at 1500 K, 1 atm [m]
const A = 2.79 / 10e-6 // Qfm/Qc per (alpha * d) for the post's gas data [1/m]
const NMOL = 70
const RP = 34 // particle radius in px (left panel)
const CX = 180
const CY = 190

type Mol = { x: number; y: number; vx: number; vy: number; left: number; cool: number }

function qRatio(d: number, alpha: number) {
  const r = A * alpha * d // Qfm / Qc
  return 1 / (1 + 1 / r) // Qsherman / Qc
}

function spawn(): Mol {
  let x = 0
  let y = 0
  do {
    x = 10 + Math.random() * 340
    y = 30 + Math.random() * 330
  } while (Math.hypot(x - CX, y - CY) < RP + 4)
  const a = Math.random() * Math.PI * 2
  return { x, y, vx: Math.cos(a), vy: Math.sin(a), left: 0, cool: 0 }
}

export function KnudsenHeatBridgeLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logD, setLogD] = useState(0) // log10(d / um)
  const [alpha, setAlpha] = useState(1)
  const [run, setRun] = useState(0)
  const [read, setRead] = useState({ ts: 1, Tc: 300, Ts: 300 })
  const par = useRef({ d: 1e-6, alpha: 1 })
  par.current = { d: 10 ** logD * 1e-6, alpha }

  const d = 10 ** logD * 1e-6
  const kn = (2 * LAM) / d
  const s = qRatio(d, alpha)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const mols: Mol[] = Array.from({ length: NMOL }, spawn)
    let raf = 0
    let frame = 0
    let tau = 0 // time in units of the continuum melt time t_c
    const T0 = 300
    const TG = 1500
    const TM = 933
    const tMeltTau = Math.log((TG - T0) / (TG - TM)) // t_c / tau_c
    const tempAt = (t: number, rate: number) => TG - (TG - T0) * Math.exp(-t * tMeltTau * rate)

    const draw = () => {
      const { d: dd, alpha: al } = par.current
      const knNow = (2 * LAM) / dd
      const sNow = qRatio(dd, al)
      const flight = Math.min(600, Math.max(2, ((LAM / dd) * 2 * RP))) // lambda in px
      // molecules
      for (const m of mols) {
        const sp = 2.2
        let nx = m.x + m.vx * sp
        let ny = m.y + m.vy * sp
        m.left -= sp
        if (Math.hypot(nx - CX, ny - CY) < RP) {
          const nX = (nx - CX) / RP
          const nY = (ny - CY) / RP
          if (Math.random() < al) {
            // accommodated: leaves with wall temperature, diffuse direction
            const a = Math.atan2(nY, nX) + (Math.random() - 0.5) * Math.PI
            m.vx = Math.cos(a)
            m.vy = Math.sin(a)
            m.cool = 1
          } else {
            const dot = m.vx * nX + m.vy * nY
            m.vx -= 2 * dot * nX
            m.vy -= 2 * dot * nY
          }
          nx = m.x
          ny = m.y
        }
        if (m.left <= 0) {
          // gas-gas collision: new direction, partial re-heating
          const a = Math.random() * Math.PI * 2
          m.vx = Math.cos(a)
          m.vy = Math.sin(a)
          m.left = -flight * Math.log(Math.random() + 1e-9)
          m.cool *= 0.55
        }
        m.x = nx
        m.y = ny
        if (m.x < 8 || m.x > 352 || m.y < 28 || m.y > 372) {
          Object.assign(m, spawn())
          m.left = -flight * Math.log(Math.random() + 1e-9)
        }
      }
      tau += 1 / 120
      const Tc = tempAt(tau, 1)
      const Ts = tempAt(tau, sNow)

      const dark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      const fg = dark ? '#e5e7eb' : '#1f2937'
      const mute = dark ? 'rgba(229,231,235,0.45)' : 'rgba(31,41,55,0.45)'
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      // left panel
      ctx.strokeStyle = mute
      ctx.strokeRect(8, 28, 344, 344)
      ctx.fillStyle = fg
      ctx.fillText(`gas molecules around one particle   Kn = 2λ/d = ${knNow.toFixed(3)}`, 8, 18)
      const heat = Math.min(1, (Ts - 300) / 633)
      ctx.fillStyle = `rgb(${Math.round(90 + 165 * heat)},${Math.round(110 + 40 * heat)},${Math.round(200 - 160 * heat)})`
      ctx.beginPath()
      ctx.arc(CX, CY, RP, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillText('Al', CX - 7, CY + 4)
      for (const m of mols) {
        const c = m.cool
        ctx.fillStyle = `rgb(${Math.round(249 - 190 * c)},${Math.round(115 + 15 * c)},${Math.round(22 + 220 * c)})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = mute
      ctx.fillText(`λ ≈ ${flight >= 600 ? '>600' : flight.toFixed(0)} px   d = ${2 * RP} px`, 14, 364)

      // right top: Q/Qc vs Kn (log-log)
      const px0 = 420
      const px1 = 740
      const py0 = 40
      const py1 = 190
      const kx = (k: number) => px0 + ((Math.log10(k) + 2.5) / 4) * (px1 - px0) // Kn 10^-2.5..10^1.5
      const qy = (q: number) => py0 + ((0 - Math.log10(q)) / 3) * (py1 - py0) // 1 .. 1e-3
      ctx.strokeStyle = mute
      ctx.strokeRect(px0, py0, px1 - px0, py1 - py0)
      ctx.fillStyle = fg
      ctx.fillText('Q / Q_continuum  vs  Kn  (log-log)', px0, py0 - 10)
      ctx.fillStyle = mute
      for (const k of [0.01, 0.1, 1, 10]) ctx.fillText(String(k), kx(k) - 8, py1 + 14)
      for (const q of [1, 0.1, 0.01]) ctx.fillText(String(q), px0 - 34, qy(q) + 4)
      const curve = (f: (k: number) => number, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.setLineDash(dash)
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 120; i++) {
          const k = 10 ** (-2.5 + (4 * i) / 120)
          const q = Math.max(1e-3, Math.min(1.6, f(k)))
          const X = kx(k)
          const Y = Math.max(py0 - 6, qy(q))
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = 1
      }
      curve(() => 1, '#60a5fa', [5, 4])
      curve((k) => A * al * ((2 * LAM) / k), '#a78bfa', [5, 4])
      curve((k) => qRatio((2 * LAM) / k, al), '#f97316', [])
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(kx(knNow), qy(sNow), 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = '#60a5fa'
      ctx.fillText('continuum', px0 + 6, qy(1) - 5)
      ctx.fillStyle = '#a78bfa'
      ctx.fillText('free molecular', px0 + 6, py1 - 8)
      ctx.fillStyle = '#f97316'
      ctx.fillText('Sherman harmonic', px1 - 120, qy(0.01) + 4)

      // right bottom: heating race
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = fg
      ctx.fillText('heat-up race 300 K → 933 K (melting), time in units of t_c', 420, 228)
      const bar = (y: number, T: number, label: string, col: string) => {
        const frac = Math.min(1, (T - 300) / 633)
        ctx.strokeStyle = mute
        ctx.strokeRect(520, y, 220, 22)
        ctx.fillStyle = col
        ctx.fillRect(520, y, 220 * frac, 22)
        ctx.fillStyle = fg
        ctx.fillText(label, 420, y + 15)
        ctx.fillText(`${T.toFixed(0)} K${frac >= 1 ? ' melted' : ''}`, 526, y + 15)
      }
      bar(244, Tc, 'continuum', '#60a5fa')
      bar(278, Ts, 'Sherman', '#f97316')
      ctx.fillStyle = mute
      ctx.fillText(`t / t_c = ${tau.toFixed(2)}   predicted t_sh / t_c = ${(1 / sNow).toFixed(2)}`, 420, 324)

      frame++
      if (frame % 12 === 0) setRead({ ts: 1 / sNow, Tc, Ts })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [run])

  const btn: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.45)',
    background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  }
  const regime = kn < 0.01 ? 'continuum' : kn < 10 ? 'transition' : 'free molecular'

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
        <label>particle d = {(d * 1e6).toPrecision(3)} um{' '}
          <input type="range" min={-1.3} max={2} step={0.01} value={logD} onChange={(e) => setLogD(+e.target.value)} />
        </label>
        <label>accommodation alpha = {alpha.toFixed(2)}{' '}
          <input type="range" min={0.02} max={1} step={0.02} value={alpha} onChange={(e) => setAlpha(+e.target.value)} />
        </label>
        <button style={btn} onClick={() => setRun((r) => r + 1)}>restart race</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <span style={{ color: regime === 'continuum' ? '#34d399' : regime === 'transition' ? '#fbbf24' : '#f87171' }}>{regime}</span>
        {' '}| Kn = {kn.toFixed(3)} | Q_sh/Q_c = {s.toFixed(3)} | t_sh/t_c = {read.ts.toFixed(2)}
        {' '}| T_c = {read.Tc.toFixed(0)} K | T_sh = {read.Ts.toFixed(0)} K
      </div>
    </div>
  )
}
