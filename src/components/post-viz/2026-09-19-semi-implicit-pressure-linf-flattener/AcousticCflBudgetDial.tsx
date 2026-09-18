'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 360
const PAD_L = 54
const PAD_R = 14
const PAD_T = 26
const GAP = 34
const PANEL_H = (H - PAD_T - GAP - 30) / 2
const CELLS = 40
const C0 = 1
const WINDOW_STEPS = 8 // semi-implicit steps that fill the time window

type Panel = { y0: number; label: string; dt: number; color: string }

function drawPanel(
  ctx: CanvasRenderingContext2D,
  p: Panel,
  tNow: number,
  tWin: number,
  mach: number,
  acoustic: boolean,
) {
  const x0 = PAD_L
  const x1 = W - PAD_R
  const yTop = p.y0
  const yBot = p.y0 + PANEL_H
  const tx = (x: number) => x0 + x * (x1 - x0)
  const ty = (t: number) => yBot - (t / tWin) * PANEL_H

  ctx.fillStyle = '#0d1117'
  ctx.fillRect(x0, yTop, x1 - x0, PANEL_H)

  // cell edges
  ctx.strokeStyle = '#1b222c'
  ctx.lineWidth = 1
  for (let i = 0; i <= CELLS; i++) {
    ctx.beginPath()
    ctx.moveTo(tx(i / CELLS), yTop)
    ctx.lineTo(tx(i / CELLS), yBot)
    ctx.stroke()
  }

  // characteristics through x = 0.5
  const lines: [number, string, number][] = acoustic
    ? [
        [mach, '#58a6ff', 2],
        [mach + C0, '#f85149', 1.4],
        [mach - C0, '#f85149', 1.4],
      ]
    : [[mach, '#58a6ff', 2]]
  for (const [speed, col, lw] of lines) {
    ctx.strokeStyle = col
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(tx(0.5), ty(0))
    ctx.lineTo(tx(0.5 + speed * tWin), ty(tWin))
    ctx.stroke()
  }

  // discrete time levels actually taken so far
  const taken = Math.min(Math.floor(tNow / p.dt), 4000)
  ctx.strokeStyle = p.color
  ctx.lineWidth = 1
  ctx.globalAlpha = taken > 120 ? 0.35 : 0.85
  ctx.beginPath()
  for (let k = 1; k <= taken; k++) {
    const y = ty(k * p.dt)
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1

  // current time
  ctx.strokeStyle = '#d29922'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x0, ty(tNow))
  ctx.lineTo(x1, ty(tNow))
  ctx.stroke()

  ctx.strokeStyle = '#30363d'
  ctx.lineWidth = 1
  ctx.strokeRect(x0, yTop, x1 - x0, PANEL_H)

  ctx.fillStyle = '#c9d1d9'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText(p.label, x0 + 6, yTop + 14)
  ctx.fillStyle = p.color
  ctx.fillText(`${taken} steps`, x1 - 74, yTop + 14)
  ctx.fillStyle = '#8b949e'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText('t', 10, yTop + 12)
  ctx.fillText('0', 34, yBot)
  return taken
}

export function AcousticCflBudgetDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [mach, setMach] = useState(0.1)
  const [cfl, setCfl] = useState(0.5)
  const [acoustic, setAcoustic] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [taken, setTaken] = useState({ exp: 0, si: 0 })
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let last = performance.now()

    const dx = 1 / CELLS
    const dtExp = (cfl * dx) / (mach + C0)
    const dtSi = (cfl * dx) / mach
    const tWin = WINDOW_STEPS * dtSi

    const loop = (now: number) => {
      const ms = Math.min(now - last, 50)
      last = now
      if (playing) tRef.current += (ms / 1000) * (tWin / 6)
      if (tRef.current > tWin) tRef.current = 0

      ctx.fillStyle = '#010409'
      ctx.fillRect(0, 0, W, H)
      const a = drawPanel(
        ctx,
        { y0: PAD_T, label: 'explicit  —  dt from |u| + c', dt: dtExp, color: '#f85149' },
        tRef.current,
        tWin,
        mach,
        acoustic,
      )
      const b = drawPanel(
        ctx,
        {
          y0: PAD_T + PANEL_H + GAP,
          label: 'semi-implicit  —  dt from |u| only',
          dt: dtSi,
          color: '#3fb950',
        },
        tRef.current,
        tWin,
        mach,
        acoustic,
      )
      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('x  (40 cells, one period)', PAD_L, H - 8)
      if (acoustic) {
        ctx.fillStyle = '#f85149'
        ctx.fillText('red: u ± c', W - 210, H - 8)
      }
      ctx.fillStyle = '#58a6ff'
      ctx.fillText('blue: material speed u', W - 140, H - 8)

      if (frame++ % 12 === 0) setTaken({ exp: a, si: b })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [mach, cfl, acoustic, playing])

  const dx = 1 / CELLS
  const dtExp = (cfl * dx) / (mach + C0)
  const dtSi = (cfl * dx) / mach

  const btn = (on: boolean) => ({
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: on ? '#1f6feb' : '#161b22',
    color: '#c9d1d9',
    fontSize: 12,
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0d1117', borderRadius: 10 }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', borderRadius: 6 }}
      />
      <div
        style={{
          display: 'flex',
          gap: '1.1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginTop: '0.8rem',
          fontSize: 12,
          color: '#c9d1d9',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label>
          Mach {mach.toFixed(3)}
          <input
            type="range"
            min={-1.7}
            max={-0.22}
            step={0.01}
            value={Math.log10(mach)}
            onChange={(e) => setMach(10 ** Number(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <label>
          CFL {cfl.toFixed(2)}
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={cfl}
            onChange={(e) => setCfl(Number(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <button onClick={() => setPlaying(!playing)} style={btn(playing)}>
          {playing ? 'pause' : 'play'}
        </button>
        <button onClick={() => setAcoustic(!acoustic)} style={btn(acoustic)}>
          acoustic characteristics
        </button>
      </div>
      <div
        style={{
          marginTop: '0.7rem',
          fontSize: 12,
          fontFamily: 'ui-monospace, monospace',
          color: '#8b949e',
        }}
      >
        dt_explicit = <b style={{ color: '#f85149' }}>{dtExp.toExponential(3)}</b> &nbsp; dt_semi =
        <b style={{ color: '#3fb950' }}> {dtSi.toExponential(3)}</b> &nbsp; gain =
        <b style={{ color: '#d29922' }}> {(dtSi / dtExp).toFixed(1)}x</b> &nbsp; steps so far:
        <b style={{ color: '#f85149' }}> {taken.exp}</b> vs
        <b style={{ color: '#3fb950' }}> {taken.si}</b>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        Both panels cover the same physical time and the same 40 cells. Pull the Mach slider down and
        the red acoustic characteristics tilt until they are nearly horizontal — the explicit panel
        has to slice that window into ever thinner layers to keep them inside one cell, while the
        green panel keeps taking the same eight steps. The step counter is the whole argument for
        treating pressure implicitly.
      </p>
    </div>
  )
}
