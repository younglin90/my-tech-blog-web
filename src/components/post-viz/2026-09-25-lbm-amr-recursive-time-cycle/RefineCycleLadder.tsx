'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Op = {
  lev: number
  t: number
  span: number
  kind: 'collision' | 'stream' | 'refine' | 'unrefine'
  to?: number
}

const COLOUR: Record<Op['kind'], string> = {
  collision: '#fb923c',
  stream: '#38bdf8',
  refine: '#4ade80',
  unrefine: '#a78bfa',
}

function buildTrace(lev: number, t0: number, dt: number, maxLev: number, subcycle: boolean, out: Op[]) {
  out.push({ lev, t: t0, span: 0, kind: 'collision' })
  if (lev < maxLev) out.push({ lev, t: t0, span: 0, kind: 'refine', to: lev + 1 })
  out.push({ lev, t: t0, span: dt, kind: 'stream' })
  if (lev < maxLev) {
    const child = subcycle ? dt / 2 : dt
    buildTrace(lev + 1, t0, child, maxLev, subcycle, out)
    if (subcycle) {
      out.push({ lev, t: t0 + dt / 2, span: 0, kind: 'refine', to: lev + 1 })
      buildTrace(lev + 1, t0 + dt / 2, child, maxLev, subcycle, out)
    }
    out.push({ lev: lev + 1, t: t0 + dt, span: 0, kind: 'unrefine', to: lev })
  }
}

export function RefineCycleLadder() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [maxLev, setMaxLev] = useState(3)
  const [subcycle, setSubcycle] = useState(true)
  const [speed, setSpeed] = useState(6)
  const [running, setRunning] = useState(true)
  const [cursor, setCursor] = useState(0)
  const cursorRef = useRef(0)

  const trace = useMemo(() => {
    const out: Op[] = []
    buildTrace(1, 0, 1, maxLev, subcycle, out)
    return out
  }, [maxLev, subcycle])

  useEffect(() => {
    cursorRef.current = 0
    setCursor(0)
  }, [maxLev, subcycle])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const draw = () => {
      const W = cv.width
      const H = cv.height
      const left = 74
      const right = W - 24
      const top = 46
      const laneH = Math.min(64, (H - top - 64) / maxLev)
      const xOf = (t: number) => left + (right - left) * t

      ctx.fillStyle = '#0d1520'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '13px ui-monospace, monospace'

      ctx.fillStyle = '#8b98a9'
      ctx.fillText('one root step  (t = 0 -> dt_1)', left, 22)

      for (let lev = 1; lev <= maxLev; lev++) {
        const y = top + (lev - 1) * laneH + laneH / 2
        const n = subcycle ? 2 ** (lev - 1) : 1
        ctx.strokeStyle = '#26313f'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(left, y)
        ctx.lineTo(right, y)
        ctx.stroke()
        for (let k = 0; k <= n; k++) {
          const x = xOf(k / n)
          ctx.beginPath()
          ctx.moveTo(x, y - 13)
          ctx.lineTo(x, y + 13)
          ctx.stroke()
        }
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(`L${lev}`, 16, y + 4)
        ctx.fillStyle = '#64748b'
        ctx.fillText(`dt/${n}`, 40, y + 4)
      }

      const cur = cursorRef.current
      for (let i = 0; i <= cur && i < trace.length; i++) {
        const op = trace[i]
        const y = top + (op.lev - 1) * laneH + laneH / 2
        const active = i === cur
        ctx.globalAlpha = active ? 1 : 0.42
        ctx.strokeStyle = COLOUR[op.kind]
        ctx.fillStyle = COLOUR[op.kind]
        ctx.lineWidth = active ? 3 : 2
        if (op.kind === 'stream') {
          ctx.beginPath()
          ctx.moveTo(xOf(op.t), y - 7)
          ctx.lineTo(xOf(op.t + op.span), y - 7)
          ctx.stroke()
        } else if (op.kind === 'collision') {
          ctx.beginPath()
          ctx.arc(xOf(op.t) + 4, y + 7, active ? 6 : 4, 0, Math.PI * 2)
          ctx.fill()
        } else {
          const y2 = top + ((op.to ?? op.lev) - 1) * laneH + laneH / 2
          const x = xOf(op.t) + (op.kind === 'refine' ? 2 : -2)
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x, y2)
          ctx.stroke()
          const dir = Math.sign(y2 - y)
          ctx.beginPath()
          ctx.moveTo(x, y2)
          ctx.lineTo(x - 4, y2 - 7 * dir)
          ctx.lineTo(x + 4, y2 - 7 * dir)
          ctx.closePath()
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      const op = trace[Math.min(cur, trace.length - 1)]
      ctx.fillStyle = COLOUR[op.kind]
      ctx.font = '14px ui-monospace, monospace'
      ctx.fillText(
        `${String(cur + 1).padStart(2, '0')}/${trace.length}  L${op.lev} ${op.kind}` +
          (op.to ? ` -> L${op.to}` : ''),
        left,
        H - 34
      )
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#8b98a9'
      const legend: Op['kind'][] = ['collision', 'refine', 'stream', 'unrefine']
      legend.forEach((k, i) => {
        ctx.fillStyle = COLOUR[k]
        ctx.fillRect(left + i * 150, H - 20, 10, 10)
        ctx.fillStyle = '#8b98a9'
        ctx.fillText(k, left + 16 + i * 150, H - 11)
      })
    }

    const tick = () => {
      if (running) {
        frame += 1
        if (frame >= 31 - speed * 3) {
          frame = 0
          cursorRef.current = (cursorRef.current + 1) % trace.length
          setCursor(cursorRef.current)
        }
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [trace, running, speed, maxLev, subcycle])

  const finest = subcycle ? 2 ** (maxLev - 1) : 1

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={360}
        style={{ width: '100%', borderRadius: 8, border: '1px solid #26313f', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
          alignItems: 'center',
        }}
      >
        <label>
          deepest level = {maxLev}{' '}
          <input
            type="range"
            min={2}
            max={4}
            step={1}
            value={maxLev}
            onChange={(e) => setMaxLev(parseInt(e.target.value, 10))}
          />
        </label>
        <label>
          speed = {speed}{' '}
          <input
            type="range"
            min={1}
            max={9}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={subcycle}
            onChange={(e) => setSubcycle(e.target.checked)}
          />{' '}
          sub-cycling
        </label>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
        <button
          onClick={() => {
            cursorRef.current = (cursorRef.current + 1) % trace.length
            setCursor(cursorRef.current)
            setRunning(false)
          }}
        >
          step
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        {trace.length} operations per root step; level {maxLev} runs {finest} of them. Watch the
        order inside one lane: the orange dot (collision) always fires before the green arrow
        (refine) that feeds the child ghosts, and the child only streams afterwards. Untick
        sub-cycling and every lane collapses to one step per root step — the ladder gets short, and
        the fine level silently runs with the wrong dt.
      </p>
    </div>
  )
}
