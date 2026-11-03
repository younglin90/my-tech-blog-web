'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 400
const NX = 21
const DX = Math.PI / (NX - 1)
const ALPHA = 2
const NMAX = 60

type C = { re: number; im: number }
const COL = { exact: '#94a3b8', phys: '#22c55e', comp: '#a855f7', ftcs: '#f97316' }

// DuFort-Frankel: (1+2r)G^2 - 4r cos(th) G - (1-2r) = 0
function dfRoots(r: number, th: number): [C, C] {
  const a = 2 * r * Math.cos(th) / (1 + 2 * r)
  const disc = 1 - 4 * r * r * Math.sin(th) ** 2
  if (disc >= 0) {
    const s = Math.sqrt(disc) / (1 + 2 * r)
    return [{ re: a + s, im: 0 }, { re: a - s, im: 0 }]
  }
  const s = Math.sqrt(-disc) / (1 + 2 * r)
  return [{ re: a, im: s }, { re: a, im: -s }]
}
const cabs = (z: C) => Math.hypot(z.re, z.im)

export function DufortRootLocusLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [r, setR] = useState(5)
  const [k, setK] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, ex: 1, df: 1, ft: 1 })
  const playRef = useRef(playing)
  playRef.current = playing

  const th = k * DX
  const dt = r * DX * DX / ALPHA
  const [gp, gm] = dfRoots(r, th)
  const gEx = Math.exp(-ALPHA * k * k * dt)
  const gFt = 1 - 4 * r * Math.sin(th / 2) ** 2
  const rStar = 1 / (2 * Math.sin(th))

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    let n = 0, acc = 0, raf = 0, frame = 0, last = performance.now()
    // the real three-level recurrence (both roots), first step taken exactly
    const seq = new Float64Array(NMAX + 1)
    seq[0] = 1; seq[1] = gEx
    for (let i = 1; i < NMAX; i++) seq[i + 1] = (4 * r * Math.cos(th) * seq[i] + (1 - 2 * r) * seq[i - 1]) / (1 + 2 * r)
    const grey = 'rgba(140,140,140,0.95)'

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // complex plane
      const cx = 190, cy = 200, R = 150
      ctx.strokeStyle = 'rgba(127,127,127,0.35)'
      ctx.beginPath(); ctx.moveTo(cx - R - 20, cy); ctx.lineTo(cx + R + 20, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy - R - 20); ctx.lineTo(cx, cy + R + 20); ctx.stroke()
      ctx.strokeStyle = 'rgba(127,127,127,0.7)'; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = grey
      ctx.fillText('|G| = 1', cx + R * 0.72, cy - R * 0.74)
      ctx.fillText('Re G', cx + R + 2, cy - 6); ctx.fillText('Im G', cx + 6, cy - R - 10)
      // locus of physical root over all wavenumbers
      for (const which of [0, 1]) {
        ctx.strokeStyle = which === 0 ? 'rgba(34,197,94,0.35)' : 'rgba(168,85,247,0.35)'
        ctx.beginPath()
        for (let j = 0; j <= 200; j++) {
          const t = (j / 200) * Math.PI
          const z = dfRoots(r, t)[which]
          const X = cx + z.re * R, Y = cy - z.im * R
          if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.beginPath()
        for (let j = 0; j <= 200; j++) {
          const t = (j / 200) * Math.PI
          const z = dfRoots(r, t)[which]
          const X = cx + z.re * R, Y = cy + z.im * R
          if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y)
        }
        ctx.stroke()
      }
      const dot = (z: C, c: string, lab: string) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + z.re * R, cy - z.im * R, 6, 0, 2 * Math.PI); ctx.fill()
        ctx.fillText(lab, cx + z.re * R + 9, cy - z.im * R - 8)
      }
      const ftShow = Math.max(-1.25, Math.min(1.25, gFt))
      dot({ re: ftShow, im: 0 }, COL.ftcs, gFt < -1 ? 'FTCS (outside)' : 'FTCS')
      dot({ re: gEx, im: 0 }, COL.exact, 'exact')
      dot(gp, COL.phys, 'G+')
      dot(gm, COL.comp, 'G-')

      // amplitude history panel
      const px = 410, py = 30, pw = 330, ph = 320
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(px, py, pw, ph)
      const ymap = (a: number) => py + ph / 2 - (a / 1.1) * (ph / 2)
      const xmap = (i: number) => px + (i / NMAX) * pw
      ctx.strokeStyle = 'rgba(127,127,127,0.35)'
      ctx.beginPath(); ctx.moveTo(px, ymap(0)); ctx.lineTo(px + pw, ymap(0)); ctx.stroke()
      ctx.fillStyle = grey
      ctx.fillText('+1', px - 24, ymap(1) + 4); ctx.fillText(' 0', px - 24, ymap(0) + 4); ctx.fillText('-1', px - 24, ymap(-1) + 4)
      ctx.fillText('mode amplitude a_n / a_0  vs  step n', px + 4, py - 10)
      ctx.fillText(`n = ${n}`, px + pw - 60, py + ph + 16)
      const series = (f: (i: number) => number, c: string) => {
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath()
        for (let i = 0; i <= n; i++) {
          const v = Math.max(-1.1, Math.min(1.1, f(i)))
          if (i === 0) ctx.moveTo(xmap(i), ymap(v)); else ctx.lineTo(xmap(i), ymap(v))
        }
        ctx.stroke(); ctx.lineWidth = 1
      }
      series((i) => Math.pow(gEx, i), COL.exact)
      series((i) => Math.pow(gFt, i), COL.ftcs)
      series((i) => seq[i], COL.phys)
      // legend
      const lg: [string, string][] = [['exact e^(-αk²nΔt)', COL.exact], ['DuFort-Frankel', COL.phys], ['FTCS', COL.ftcs]]
      lg.forEach(([s, c], i) => { ctx.fillStyle = c; ctx.fillText('■ ' + s, px + [0, 140, 260][i] - 10, py + ph + 36) })
    }

    const loop = (now: number) => {
      const dtm = Math.min(0.1, (now - last) / 1000); last = now
      if (playRef.current && n < NMAX) {
        acc += dtm * 8
        while (acc >= 1 && n < NMAX) { n++; acc -= 1 }
      }
      draw()
      if (++frame % 12 === 0) {
        setRead({ n, ex: Math.pow(gEx, n), df: seq[n], ft: Math.pow(gFt, n) })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, k, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const complex = r > rStar
  const fmt = (v: number) => (Math.abs(v) > 999 ? v.toExponential(1) : v.toFixed(4))

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          r = αΔt/Δx² = {r.toFixed(1)}{' '}
          <input type="range" min={0.1} max={20} step={0.1} value={r} onChange={(e) => { setR(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
        <label>
          mode k = {k} (θ = kΔx){' '}
          <input type="range" min={1} max={19} step={1} value={k} onChange={(e) => { setK(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: 'rgba(140,140,140,0.95)' }}>
          Δt = {dt.toFixed(4)} · exact factor/step = {gEx.toFixed(4)} · r* = 1/(2 sin θ) = {rStar.toFixed(2)}
        </div>
        <div style={{ color: COL.phys }}>
          |G+| = {cabs(gp).toFixed(4)} · arg G+ = {(Math.atan2(gp.im, gp.re) * 180 / Math.PI).toFixed(2)}° {complex ? '→ oscillates in time (r > r*)' : '→ real, monotone decay'}
        </div>
        <div style={{ color: COL.comp }}>|G-| = {cabs(gm).toFixed(4)} (computational mode, ≤ 1)</div>
        <div style={{ color: COL.ftcs }}>FTCS factor = {gFt.toFixed(4)} {Math.abs(gFt) > 1 ? '→ unstable' : ''}</div>
        <div>n = {read.n}: exact {fmt(read.ex)} · DF {fmt(read.df)} · FTCS {fmt(read.ft)}</div>
      </div>
    </div>
  )
}
