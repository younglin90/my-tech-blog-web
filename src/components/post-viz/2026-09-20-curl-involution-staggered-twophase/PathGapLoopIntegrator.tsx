'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 380
const MAP = 300
const MX = 40
const MY = 36
const SIG = 0.18
const SAMPLES = 400

const phi = (x: number, y: number) =>
  Math.exp(-((x - 0.5) ** 2 + (y - 0.5) ** 2) / (2 * SIG * SIG))

// b = grad(phi) + kappa * rot(phi); curl b = kappa * laplacian(phi)
function field(x: number, y: number, kappa: number) {
  const p = phi(x, y)
  const gx = (-(x - 0.5) / (SIG * SIG)) * p
  const gy = (-(y - 0.5) / (SIG * SIG)) * p
  return [gx - kappa * gy, gy + kappa * gx]
}

const curlZ = (x: number, y: number, kappa: number) => {
  const r2 = (x - 0.5) ** 2 + (y - 0.5) ** 2
  return kappa * phi(x, y) * (r2 / SIG ** 4 - 2 / SIG ** 2)
}

// integral of b.dl along the two legs, evaluated up to arc fraction s in [0, 1]
function legWalk(
  kappa: number,
  s: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  xFirst: boolean,
) {
  const lx = Math.abs(x1 - x0)
  const ly = Math.abs(y1 - y0)
  const total = lx + ly
  const done = s * total
  let acc = 0
  let px = x0
  let py = y0
  const legs: [number, number, number, number][] = xFirst
    ? [
        [x0, y0, x1, y0],
        [x1, y0, x1, y1],
      ]
    : [
        [x0, y0, x0, y1],
        [x0, y1, x1, y1],
      ]
  let walked = 0
  for (const [ax, ay, bx2, by2] of legs) {
    const len = Math.hypot(bx2 - ax, by2 - ay)
    const take = Math.max(0, Math.min(len, done - walked))
    const n = Math.max(1, Math.round((SAMPLES * take) / Math.max(1e-9, total)))
    for (let k = 0; k < n; k++) {
      const t0 = (k / n) * (take / len)
      const t1 = ((k + 1) / n) * (take / len)
      const xm = ax + ((t0 + t1) / 2) * (bx2 - ax)
      const ym = ay + ((t0 + t1) / 2) * (by2 - ay)
      const [fx, fy] = field(xm, ym, kappa)
      acc += fx * (bx2 - ax) * (t1 - t0) + fy * (by2 - ay) * (t1 - t0)
    }
    if (take > 0) {
      px = ax + (take / len) * (bx2 - ax)
      py = ay + (take / len) * (by2 - ay)
    }
    walked += len
    if (walked >= done) break
  }
  return { acc, px, py }
}

function areaIntegral(kappa: number, x0: number, y0: number, x1: number, y1: number) {
  const n = 60
  let s = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = x0 + ((i + 0.5) / n) * (x1 - x0)
      const y = y0 + ((j + 0.5) / n) * (y1 - y0)
      s += curlZ(x, y, kappa)
    }
  }
  return (s * (x1 - x0) * (y1 - y0)) / (n * n)
}

export function PathGapLoopIntegrator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prog = useRef(0)
  const [playing, setPlaying] = useState(true)
  const [kappa, setKappa] = useState(0.45)
  const [box, setBox] = useState(0.52)
  const [out, setOut] = useState({ a: 0, b: 0, gap: 0, area: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const x0 = 0.5 - box / 2
    const y0 = 0.5 - box / 2
    const x1 = 0.5 + box / 2
    const y1 = 0.5 + box / 2
    const sx = (x: number) => MX + x * MAP
    const sy = (y: number) => MY + (1 - y) * MAP

    const draw = () => {
      const s = prog.current
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      // curl density inside the loop
      const cells = 30
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          const x = x0 + ((i + 0.5) / cells) * (x1 - x0)
          const y = y0 + ((j + 0.5) / cells) * (y1 - y0)
          const c = curlZ(x, y, kappa)
          const t = Math.max(-1, Math.min(1, c / 40))
          ctx.fillStyle =
            t >= 0 ? `rgba(248, 81, 73, ${t * 0.7})` : `rgba(88, 166, 255, ${-t * 0.7})`
          ctx.fillRect(
            sx(x0 + (i / cells) * (x1 - x0)),
            sy(y0 + ((j + 1) / cells) * (y1 - y0)),
            (MAP * (x1 - x0)) / cells + 1,
            (MAP * (y1 - y0)) / cells + 1,
          )
        }
      }

      // vector field b
      ctx.strokeStyle = '#586069'
      ctx.lineWidth = 1
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          const x = (i + 0.5) / 15
          const y = (j + 0.5) / 15
          const [fx, fy] = field(x, y, kappa)
          const m = Math.hypot(fx, fy)
          const sc = (0.016 * Math.min(m, 3)) / (m + 1e-9)
          ctx.beginPath()
          ctx.moveTo(sx(x), sy(y))
          ctx.lineTo(sx(x + fx * sc), sy(y + fy * sc))
          ctx.stroke()
        }
      }

      ctx.strokeStyle = '#30363d'
      ctx.strokeRect(MX + 0.5, MY + 0.5, MAP, MAP)

      const A = legWalk(kappa, s, x0, y0, x1, y1, true)
      const B = legWalk(kappa, s, x0, y0, x1, y1, false)
      const paths: [typeof A, string, boolean][] = [
        [A, '#f85149', true],
        [B, '#58a6ff', false],
      ]
      for (const [res, col, xFirst] of paths) {
        ctx.strokeStyle = col
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(sx(x0), sy(y0))
        if (xFirst) {
          ctx.lineTo(sx(Math.min(res.px, x1)), sy(y0))
          if (res.py > y0) ctx.lineTo(sx(x1), sy(res.py))
        } else {
          ctx.lineTo(sx(x0), sy(Math.min(res.py, y1)))
          if (res.px > x0) ctx.lineTo(sx(res.px), sy(y1))
        }
        ctx.stroke()
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(sx(res.px), sy(res.py), 4.5, 0, 2 * Math.PI)
        ctx.fill()
      }

      // bar chart of the two accumulated integrals
      const bx = 400
      const scale = 110
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#c9d1d9'
      ctx.fillText('accumulated  ∫ b·dl', bx, MY + 4)
      const rows: [string, number, string][] = [
        ['path A  (x then y)', A.acc, '#f85149'],
        ['path B  (y then x)', B.acc, '#58a6ff'],
      ]
      rows.forEach(([label, v, col], k) => {
        const yy = MY + 34 + k * 46
        ctx.fillStyle = '#8b949e'
        ctx.fillText(label, bx, yy - 6)
        ctx.fillStyle = '#161b22'
        ctx.fillRect(bx, yy, 240, 16)
        ctx.fillStyle = col
        ctx.fillRect(bx + 120, yy, Math.max(-120, Math.min(120, v * scale)), 16)
        ctx.fillStyle = '#c9d1d9'
        ctx.fillText(v.toFixed(4), bx + 248, yy + 13)
      })
      ctx.strokeStyle = '#30363d'
      ctx.beginPath()
      ctx.moveTo(bx + 120, MY + 28)
      ctx.lineTo(bx + 120, MY + 124)
      ctx.stroke()

      const gap = A.acc - B.acc
      const area = areaIntegral(kappa, x0, y0, x1, y1)
      ctx.fillStyle = '#8b949e'
      ctx.fillText('gap  A − B', bx, MY + 150)
      ctx.fillStyle = '#161b22'
      ctx.fillRect(bx, MY + 158, 240, 18)
      ctx.fillStyle = Math.abs(gap) < 1e-9 ? '#3fb950' : '#d29922'
      ctx.fillRect(bx + 120, MY + 158, Math.max(-120, Math.min(120, gap * scale)), 18)
      ctx.fillStyle = '#c9d1d9'
      ctx.fillText(gap.toExponential(3), bx + 248, MY + 172)
      ctx.fillStyle = '#8b949e'
      ctx.fillText('Stokes check  ∬ curl b dA', bx, MY + 206)
      ctx.fillStyle = '#c9d1d9'
      ctx.fillText(areaIntegral(kappa, x0, y0, x1, y1).toFixed(4), bx, MY + 224)

      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('red = curl > 0   blue = curl < 0   grey arrows = b', MX, MY + MAP + 18)
      ctx.fillText(`loop ${box.toFixed(2)} x ${box.toFixed(2)}`, MX, MY + MAP + 34)

      if (frame % 12 === 0) setOut({ a: A.acc, b: B.acc, gap, area })
    }

    const loop = () => {
      if (playing) prog.current = Math.min(1, prog.current + 0.006)
      if (prog.current >= 1 && playing) prog.current = 0
      draw()
      frame++
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, kappa, box])

  const btn = (on: boolean) => ({
    padding: '3px 10px',
    fontSize: 12,
    fontFamily: 'ui-monospace, monospace',
    color: on ? '#0d1117' : '#c9d1d9',
    background: on ? '#3fb950' : '#21262d',
    border: '1px solid #30363d',
    borderRadius: 4,
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.6rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', borderRadius: 6, background: '#0d1117' }}
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
          curl content κ {kappa.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={kappa}
            onChange={(e) => setKappa(Number(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <label>
          loop size {box.toFixed(2)}
          <input
            type="range"
            min={0.12}
            max={0.86}
            step={0.02}
            value={box}
            onChange={(e) => setBox(Number(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <button onClick={() => setPlaying(!playing)} style={btn(playing)}>
          {playing ? 'pause' : 'play'}
        </button>
        <button
          onClick={() => {
            prog.current = 0
          }}
          style={btn(false)}
        >
          restart walk
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
        A = <b style={{ color: '#f85149' }}>{out.a.toFixed(4)}</b> &nbsp; B =
        <b style={{ color: '#58a6ff' }}> {out.b.toFixed(4)}</b> &nbsp; gap =
        <b style={{ color: Math.abs(out.gap) < 1e-9 ? '#3fb950' : '#d29922' }}>
          {' '}
          {out.gap.toExponential(3)}
        </b>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        Two walkers start at the same corner and end at the same corner, one going x first and the
        other y first, each summing b along the way. Drag the curl content to zero and the two bars
        land on the identical number — the field has a potential, so the endpoint value is the
        potential and nothing else. Any nonzero curl splits the bars, and the gap always equals the
        shaded curl integral enclosed by the loop.
      </p>
    </div>
  )
}
