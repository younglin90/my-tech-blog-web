'use client'

import { useEffect, useRef, useState } from 'react'

// A minimal stable-fluids solver on a periodic NxN grid.
// Each frame: semi-Lagrangian advection of (u, v) and a passive dye, then an
// optional pressure projection (Jacobi Poisson solve) that removes the
// divergence. Toggle the projection off to watch the incompressibility
// constraint break: divergence piles up and the vorticity field goes to mush.
// Initial condition is a doubly-periodic double shear layer that rolls up
// into a Kelvin-Helmholtz vortex pair -- the classic projection-method test.

const N = 64 // interior grid size (<= 100 per guideline)
const JACOBI_ITERS = 24

function idx(i: number, j: number) {
  return j * N + i
}
function wrap(a: number) {
  // periodic wrap into [0, N)
  return ((a % N) + N) % N
}

// bilinear sample of field q at continuous (x, y) with periodic wrap
function sample(q: Float32Array, x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const i0 = wrap(x0)
  const j0 = wrap(y0)
  const i1 = wrap(x0 + 1)
  const j1 = wrap(y0 + 1)
  const a = q[idx(i0, j0)]
  const b = q[idx(i1, j0)]
  const c = q[idx(i0, j1)]
  const d = q[idx(i1, j1)]
  return (
    a * (1 - fx) * (1 - fy) +
    b * fx * (1 - fy) +
    c * (1 - fx) * fy +
    d * fx * fy
  )
}

function makeShearLayer() {
  const u = new Float32Array(N * N)
  const v = new Float32Array(N * N)
  const dye = new Float32Array(N * N)
  const rho = 28 / N // shear-layer thickness (in grid units, normalized)
  const delta = 0.05 // perturbation amplitude
  for (let j = 0; j < N; j++) {
    const y = j / N
    for (let i = 0; i < N; i++) {
      const x = i / N
      // double shear layer: two opposing jets
      const uu = y <= 0.5 ? Math.tanh((y - 0.25) / rho) : Math.tanh((0.75 - y) / rho)
      u[idx(i, j)] = uu
      v[idx(i, j)] = delta * Math.sin(2 * Math.PI * x)
      // dye stripes so the roll-up is visible
      dye[idx(i, j)] = y <= 0.5 ? 1 : 0
    }
  }
  return { u, v, dye }
}

export function ProjectionFluidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [project, setProject] = useState(true)
  const [dt, setDt] = useState(0.6)
  const [field, setField] = useState<'vorticity' | 'dye'>('vorticity')
  const [maxDiv, setMaxDiv] = useState(0)
  const [resetKey, setResetKey] = useState(0)

  // keep latest control values in refs so the rAF loop reads fresh state
  const projRef = useRef(project)
  const dtRef = useRef(dt)
  const fieldRef = useRef(field)
  projRef.current = project
  dtRef.current = dt
  fieldRef.current = field

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g2d = ctx // non-null reference safe to use inside closures

    const CELL = 6
    const W = N * CELL
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = W * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    canvas.style.height = 'auto'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let { u, v, dye } = makeShearLayer()
    let u0 = new Float32Array(N * N)
    let v0 = new Float32Array(N * N)
    let dye0 = new Float32Array(N * N)
    const div = new Float32Array(N * N)
    let p = new Float32Array(N * N)
    let p1 = new Float32Array(N * N)

    const img = ctx.createImageData(W, W)
    let raf = 0
    let frame = 0

    function advect(dst: Float32Array, src: Float32Array, h: number) {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const x = i - h * u[idx(i, j)]
          const y = j - h * v[idx(i, j)]
          dst[idx(i, j)] = sample(src, x, y)
        }
      }
    }

    function projectStep() {
      let dmax = 0
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const du = u[idx(wrap(i + 1), j)] - u[idx(wrap(i - 1), j)]
          const dv = v[idx(i, wrap(j + 1))] - v[idx(i, wrap(j - 1))]
          const d = 0.5 * (du + dv)
          div[idx(i, j)] = d
          if (Math.abs(d) > dmax) dmax = Math.abs(d)
        }
      }
      if (!projRef.current) return dmax
      p.fill(0)
      for (let k = 0; k < JACOBI_ITERS; k++) {
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            p1[idx(i, j)] =
              (p[idx(wrap(i + 1), j)] +
                p[idx(wrap(i - 1), j)] +
                p[idx(i, wrap(j + 1))] +
                p[idx(i, wrap(j - 1))] -
                div[idx(i, j)]) *
              0.25
          }
        }
        const tmp = p
        p = p1
        p1 = tmp
      }
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          u[idx(i, j)] -= 0.5 * (p[idx(wrap(i + 1), j)] - p[idx(wrap(i - 1), j)])
          v[idx(i, j)] -= 0.5 * (p[idx(i, wrap(j + 1))] - p[idx(i, wrap(j - 1))])
        }
      }
      return dmax
    }

    function step() {
      const h = dtRef.current
      // advect velocity (self-advection) using the current field
      advect(u0, u, h)
      advect(v0, v, h)
      advect(dye0, dye, h)
      const tu = u; u = u0; u0 = tu
      const tv = v; v = v0; v0 = tv
      const td = dye; dye = dye0; dye0 = td
      const dmax = projectStep()
      return dmax
    }

    function draw() {
      const data = img.data
      const useVort = fieldRef.current === 'vorticity'
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          let r: number, g: number, b: number
          if (useVort) {
            const w =
              0.5 * (v[idx(wrap(i + 1), j)] - v[idx(wrap(i - 1), j)]) -
              0.5 * (u[idx(i, wrap(j + 1))] - u[idx(i, wrap(j - 1))])
            const t = Math.max(-1, Math.min(1, w * 6))
            if (t >= 0) {
              r = 255
              g = 255 - t * 200
              b = 255 - t * 235
            } else {
              const s = -t
              r = 255 - s * 235
              g = 255 - s * 150
              b = 255
            }
          } else {
            const c = Math.max(0, Math.min(1, dye[idx(i, j)]))
            // teal-on-dark ramp
            r = Math.round(8 + c * 20)
            g = Math.round(17 + c * 194)
            b = Math.round(31 + c * 207)
          }
          // paint a CELL x CELL block
          for (let dy = 0; dy < CELL; dy++) {
            const py = j * CELL + dy
            for (let dx = 0; dx < CELL; dx++) {
              const px = i * CELL + dx
              const o = (py * W + px) * 4
              data[o] = r
              data[o + 1] = g
              data[o + 2] = b
              data[o + 3] = 255
            }
          }
        }
      }
      g2d.putImageData(img, 0, 0)
    }

    let acc = 0
    function loop() {
      const dmax = step()
      frame++
      acc = Math.max(acc, dmax)
      if (frame % 6 === 0) {
        setMaxDiv(acc)
        acc = 0
      }
      draw()
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginBottom: 12 }}>
        <button
          onClick={() => setProject((p) => !p)}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: project ? '#22d3ee' : 'transparent',
            color: project ? '#08111f' : 'var(--text)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Projection: {project ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setField((f) => (f === 'vorticity' ? 'dye' : 'vorticity'))}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Show: {field === 'vorticity' ? 'vorticity' : 'dye'}
        </button>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          dt
          <input
            type="range"
            min={0.2}
            max={1.2}
            step={0.05}
            value={dt}
            onChange={(e) => setDt(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', width: 34 }}>{dt.toFixed(2)}</span>
        </label>
        <button
          onClick={() => setResetKey((k) => k + 1)}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Reset
        </button>
        <span
          style={{
            fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            color: maxDiv > 0.15 ? '#f87171' : 'var(--text-muted)',
            marginLeft: 'auto',
          }}
        >
          max|∇·u| = {maxDiv.toFixed(3)}
        </span>
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 6 }} />
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '10px 0 0' }}>
        Double shear layer rolling up. Red/blue = vorticity sign. Turn projection OFF and
        max|∇·u| climbs while the vortices dissolve into noise.
      </p>
    </div>
  )
}
