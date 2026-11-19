'use client'

import { useEffect, useRef, useState } from 'react'

const W = 680
const H = 260
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const PRESETS: [string, number][] = [
  ['nu', 0.07], ['mu', 1.8e-5], ['kappa', 0.026], ['lambda', 0.41], ['k_turb', 0.375],
  ['rho', 1.2], ['gamma', 1.4], ['dt', 0.0126], ['visc', 0.07], ['re', 2000.5],
]
const isInt = (name: string) => 'ijklmn'.includes(name[0]?.toLowerCase() ?? 'a')
const fmt = (v: number) => (Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(2) : String(+v.toPrecision(4)))

export function ImplicitTypingNameSorter() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [name, setName] = useState('nu')
  const [val, setVal] = useState(0.07)
  const [strict, setStrict] = useState(false)
  const [playing, setPlaying] = useState(true)
  const anim = useRef({ t: 0, playing: true, step: false })
  anim.current.playing = playing

  useEffect(() => { anim.current.t = 0 }, [name, val, strict])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let raf = 0
    const draw = () => {
      const a = anim.current
      if (a.playing || a.step) { a.t = a.t >= 1.6 ? 0 : a.t + (a.step ? 0.1 : 1 / 120); a.step = false }
      const t = Math.min(a.t, 1)
      const dark = document.documentElement.classList.contains('dark')
      const fg = dark ? '#e5e7eb' : '#111827'
      const mut = dark ? '#6b7280' : '#9ca3af'
      ctx.clearRect(0, 0, W, H)
      ctx.font = '13px monospace'
      // alphabet strip
      const cw = (W - 40) / 26
      const first = name[0]?.toUpperCase() ?? 'A'
      for (let i = 0; i < 26; i++) {
        const ch = ALPHA[i]
        const x = 20 + i * cw
        const intZone = 'IJKLMN'.includes(ch)
        ctx.fillStyle = intZone ? (dark ? '#7f1d1d' : '#fee2e2') : (dark ? '#1e3a8a' : '#dbeafe')
        ctx.fillRect(x + 1, 18, cw - 2, 26)
        if (ch === first) { ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.strokeRect(x + 1, 18, cw - 2, 26) }
        ctx.fillStyle = fg
        ctx.fillText(ch, x + cw / 2 - 4, 36)
      }
      ctx.fillStyle = mut
      ctx.fillText('I–N → INTEGER (red)   others → REAL (blue)   first letter decides', 20, 62)

      const integer = isInt(name)
      const stored = integer ? Math.trunc(val) : val
      // source literal box
      const sx = 40, sy = 110, bx = 430, by = 110
      ctx.strokeStyle = mut; ctx.lineWidth = 1
      ctx.strokeRect(sx, sy, 190, 50)
      ctx.fillStyle = fg
      ctx.fillText(`${name} = ${fmt(val)}`, sx + 12, sy + 30)
      ctx.fillStyle = mut
      ctx.fillText('source line', sx, sy - 8)
      // memory box
      const boxCol = strict && integer ? '#f59e0b' : integer ? '#ef4444' : '#2563eb'
      ctx.strokeStyle = boxCol; ctx.lineWidth = 2
      ctx.strokeRect(bx, by, 210, 50)
      ctx.fillStyle = boxCol
      ctx.fillText(strict ? `declared? ${name}` : `${integer ? 'INTEGER' : 'REAL'} :: ${name}`, bx, by - 8)

      if (strict) {
        // implicit none: compiler refuses undeclared name
        ctx.fillStyle = '#f59e0b'
        ctx.font = 'bold 14px monospace'
        if (t > 0.3) ctx.fillText('Error: Symbol has no IMPLICIT type', 150, 210)
        ctx.font = '13px monospace'
        ctx.fillStyle = fg
        ctx.fillText('(compile stops — bug caught)', bx + 14, by + 30)
      } else {
        // flying literal
        const lit = fmt(val)
        const px = sx + 190 + (bx - sx - 190) * Math.min(t / 0.6, 1)
        if (t < 0.6) {
          ctx.fillStyle = '#f59e0b'
          ctx.fillText(lit, px - 20, sy + 30 + Math.sin(t * 10) * 4)
        } else {
          const chop = Math.min((t - 0.6) / 0.4, 1)
          if (integer) {
            const s = lit
            const dot = s.indexOf('.') >= 0 ? s.indexOf('.') : s.length
            const keep = String(stored)
            ctx.fillStyle = fg
            ctx.fillText(keep, bx + 14, by + 30)
            // fractional part falling away
            ctx.globalAlpha = 1 - chop
            ctx.fillStyle = '#ef4444'
            ctx.fillText(s.slice(dot), bx + 14 + 9 * keep.length, by + 30 + chop * 60)
            ctx.globalAlpha = 1
          } else {
            ctx.fillStyle = fg
            ctx.fillText(lit, bx + 14, by + 30)
          }
        }
        if (t >= 1) {
          const lost = val === 0 ? 0 : Math.abs((val - stored) / val) * 100
          ctx.fillStyle = integer && lost > 0 ? '#ef4444' : '#16a34a'
          ctx.font = 'bold 14px monospace'
          ctx.fillText(integer ? `stored ${stored}  (${lost.toFixed(1)}% of value lost, no warning)` : `stored ${fmt(stored)}  (exact)`, 150, 210)
          ctx.font = '13px monospace'
        }
      }
      ctx.fillStyle = mut
      ctx.fillText('no IMPLICIT NONE: the compiler silently picks the type', 20, 245)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [name, val, strict])

  const integer = isInt(name)
  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={ref} width={W} height={H} className="w-full" />
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {PRESETS.map(([n, v]) => (
          <button key={n} className={`rounded border px-2 py-1 font-mono ${name === n ? (isInt(n) ? 'border-red-500 text-red-600' : 'border-blue-500 text-blue-600') : ''}`}
            onClick={() => { setName(n); setVal(v) }}>{n}</button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-24">name</span>
          <input value={name} maxLength={10} onChange={(e) => setName(e.target.value.replace(/[^A-Za-z0-9_]/g, '') || 'x')} className="flex-1 rounded border px-2 py-1 font-mono dark:bg-gray-900" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-24">value: {fmt(val)}</span>
          <input type="range" min={0} max={3} step={0.01} value={Math.min(val, 3)} onChange={(e) => setVal(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="rounded border px-3 py-1" onClick={() => { setPlaying(false); anim.current.step = true }}>Step</button>
        <button className="rounded border px-3 py-1" onClick={() => { anim.current.t = 0 }}>Reset</button>
        <label className="flex items-center gap-1"><input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} /> IMPLICIT NONE</label>
        <span className="font-mono text-xs">{name} → {strict ? 'must be declared' : integer ? `INTEGER, stores ${Math.trunc(val)}` : `REAL, stores ${fmt(val)}`}</span>
      </div>
    </div>
  )
}
