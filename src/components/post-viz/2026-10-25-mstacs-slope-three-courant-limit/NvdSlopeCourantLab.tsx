'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const KEYS = ['hc', 'sb', 'bd', 'ms'] as const
type Key = typeof KEYS[number]
const COL: Record<Key, string> = { hc: '#38bdf8', sb: '#22c55e', bd: '#a78bfa', ms: '#f59e0b' }
const NAME: Record<Key, string> = { hc: 'HYPER-C (CICSAM)', sb: 'SUPERBEE (STACS)', bd: 'BD 4C̃ (SAISH)', ms: 'MSTACS eq.(18)' }

// normalized face value of each compressive scheme, same as the Python cds_face()
function cds(k: Key, t: number, co: number) {
  if (t <= 0 || t >= 1) return t
  if (k === 'hc') return Math.min(t / co, 1)
  if (k === 'sb') return t < 1 / 3 ? 2 * t : t < 0.5 ? 0.5 + 0.5 * t : t < 2 / 3 ? 1.5 * t : 1
  if (k === 'bd') return Math.min(4 * t, 1)
  return co <= 1 / 3 ? Math.min(t / co, 1) : Math.min(3 * t, 1)
}
const slope = (k: Key, co: number) => (k === 'hc' ? 1 / co : k === 'sb' ? 2 : k === 'bd' ? 4 : co <= 1 / 3 ? 1 / co : 3)

export function NvdSlopeCourantLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [co, setCo] = useState(0.5)
  const [sel, setSel] = useState<Key>('ms')
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ t: 0.1, cf: 0, out: 0 })
  const tRef = useRef(0.1), playRef = useRef(playing)
  playRef.current = playing

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0, dir = 1
    const P = { x: 50, y: 20, w: 380, h: 360 }
    const X = (v: number) => P.x + (v / 1.2) * P.w, Y = (v: number) => P.y + P.h - (v / 1.2) * P.h
    const grey = 'rgba(127,127,127,0.9)'

    const draw = () => {
      const t = tRef.current
      ctx.clearRect(0, 0, W, H); ctx.font = '12px ui-monospace, monospace'
      // TVD region: between C~f = C~D and min(2C~D, 1)
      ctx.fillStyle = 'rgba(34,197,94,0.10)'; ctx.beginPath(); ctx.moveTo(X(0), Y(0))
      for (let i = 0; i <= 100; i++) { const v = i / 100; ctx.lineTo(X(v), Y(Math.min(2 * v, 1))) }
      for (let i = 100; i >= 0; i--) { const v = i / 100; ctx.lineTo(X(v), Y(v)) }
      ctx.fill()
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(P.x, P.y, P.w, P.h)
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1.2), Y(1.2)); ctx.stroke()
      // explicit boundedness bound C~f <= C~D / Co
      ctx.setLineDash([6, 4]); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.beginPath()
      ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(Math.min(1.2, 1.2 * co)), Y(Math.min(1.2, 1.2 * co) / co)); ctx.stroke(); ctx.setLineDash([])
      for (const k of KEYS) {
        ctx.strokeStyle = COL[k]; ctx.lineWidth = k === sel ? 3.2 : 1.4; ctx.globalAlpha = k === sel ? 1 : 0.55; ctx.beginPath()
        for (let i = 0; i <= 240; i++) { const v = (i / 240) * 1.2, f = cds(k, v, co); i ? ctx.lineTo(X(v), Y(f)) : ctx.moveTo(X(v), Y(f)) }
        ctx.stroke(); ctx.globalAlpha = 1
      }
      const cf = cds(sel, t, co)
      ctx.fillStyle = COL[sel]; ctx.beginPath(); ctx.arc(X(t), Y(cf), 6, 0, 2 * Math.PI); ctx.fill()
      ctx.fillStyle = grey
      ctx.fillText('C̃_D (normalized donor) →', P.x + P.w - 190, P.y + P.h + 16); ctx.fillText('C̃_f', P.x - 34, P.y + 12)
      ctx.fillText('0', X(0) - 4, Y(0) + 14); ctx.fillText('1', X(1) - 4, Y(0) + 14); ctx.fillText('1', P.x - 14, Y(1) + 4)
      ctx.fillStyle = '#ef4444'; ctx.fillText(`bound C̃_D/Co, slope ${(1 / co).toFixed(2)}`, X(0.02), Y(1.14))
      ctx.fillStyle = 'rgba(34,197,94,0.9)'; ctx.fillText('TVD region', X(0.62), Y(0.8))

      // donor cell bucket: what it holds above upwind vs what one step sends out
      const B = { x: 500, y: 60, w: 90, h: 260 }, out = co * cf
      ctx.strokeStyle = grey; ctx.strokeRect(B.x, B.y, B.w, B.h)
      ctx.fillStyle = 'rgba(56,189,248,0.35)'; ctx.fillRect(B.x, B.y + B.h * (1 - t), B.w, B.h * t)
      const bad = out > t + 1e-9
      ctx.fillStyle = bad ? 'rgba(239,68,68,0.75)' : COL[sel]
      ctx.fillRect(B.x + B.w + 30, B.y + B.h * (1 - Math.min(out, 1)), 40, B.h * Math.min(out, 1))
      ctx.strokeStyle = grey; ctx.strokeRect(B.x + B.w + 30, B.y, 40, B.h)
      ctx.fillStyle = grey
      ctx.fillText('donor holds', B.x, B.y - 22); ctx.fillText(`C̃_D = ${t.toFixed(3)}`, B.x, B.y - 8)
      ctx.fillText('sends', B.x + B.w + 30, B.y - 22); ctx.fillText(`Co·C̃_f = ${out.toFixed(3)}`, B.x + B.w + 10, B.y - 8)
      ctx.fillStyle = bad ? '#ef4444' : '#22c55e'
      ctx.fillText(bad ? 'sends MORE than it holds' : 'bounded: sends ≤ holds', B.x, B.y + B.h + 22)
      ctx.fillText(`k·Co = ${(slope(sel, co) * co).toFixed(2)} ${slope(sel, co) * co > 1 + 1e-9 ? '> 1' : '≤ 1'}`, B.x, B.y + B.h + 40)
      let ly = 20
      for (const k of KEYS) { ctx.fillStyle = COL[k]; ctx.fillRect(P.x + 10, P.y + 26 + ly, 12, 4); ctx.fillText(NAME[k], P.x + 28, P.y + 31 + ly); ly += 16 }
      return { cf, out }
    }
    const loop = () => {
      if (playRef.current) {
        tRef.current += dir * 0.004
        if (tRef.current > 0.98) dir = -1
        if (tRef.current < 0.02) dir = 1
      }
      const r = draw()
      if (++frame % 12 === 0) setRead({ t: tRef.current, ...r })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [co, sel])

  const btn = (on: boolean) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(245,158,11,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>Courant Co = {co.toFixed(2)} <input type="range" min={0.1} max={1} step={0.01} value={co} onChange={(e) => setCo(+e.target.value)} /></label>
        <label>C̃_D = <input type="range" min={0.01} max={0.99} step={0.01} value={read.t} onChange={(e) => { setPlaying(false); tRef.current = +e.target.value; setRead((r) => ({ ...r, t: +e.target.value })) }} /></label>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause scan' : 'Play scan'}</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {KEYS.map((k) => (
          <button key={k} style={{ ...btn(k === sel), color: COL[k] }} onClick={() => setSel(k)}>{NAME[k]}</button>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        {NAME[sel]} · slope k = {slope(sel, co).toFixed(2)} · C̃_D = {read.t.toFixed(3)} → C̃_f = {read.cf.toFixed(3)} · outflow Co·C̃_f = {read.out.toFixed(3)}
      </div>
    </div>
  )
}
