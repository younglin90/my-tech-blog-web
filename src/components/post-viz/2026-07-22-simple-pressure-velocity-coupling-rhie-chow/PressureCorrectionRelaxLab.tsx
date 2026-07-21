'use client'

import { useEffect, useRef, useState } from 'react'

// The pressure-correction step of SIMPLE is, at heart, a relaxed sweep of the
// discrete pressure-Poisson equation. This lab solves
//
//     laplacian(p) = b            (b fixed, from a divergent trial velocity)
//
// with a relaxed Gauss-Seidel update
//
//     p_k <- (1 - w) p_k + w * p_k^GS
//
// w is the relaxation factor. In SIMPLE the pressure under-relaxation alpha_p
// plays exactly this role. Too small -> the residual crawls down. Too large
// -> it overshoots and, past the stability limit, blows up. Between them sits
// a sweet spot. Drag the slider and watch the residual curve on the right.

const N = 34

function buildRHS() {
  const b = new Float64Array(N * N)
  for (let j = 1; j < N - 1; j++) {
    for (let i = 1; i < N - 1; i++) {
      const x = i / (N - 1)
      const y = j / (N - 1)
      b[j * N + i] = Math.sin(3 * Math.PI * x) * Math.sin(2 * Math.PI * y)
    }
  }
  return b
}

function residual(p: Float64Array, b: Float64Array) {
  let r = 0
  for (let j = 1; j < N - 1; j++) {
    for (let i = 1; i < N - 1; i++) {
      const k = j * N + i
      const lap = p[k - 1] + p[k + 1] + p[k - N] + p[k + N] - 4 * p[k]
      const d = lap - b[k]
      r += d * d
    }
  }
  return Math.sqrt(r)
}

export function PressureCorrectionRelaxLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [w, setW] = useState(1.5)
  const [iter, setIter] = useState(0)
  const [res, setRes] = useState(0)
  const [status, setStatus] = useState<'converging' | 'converged' | 'diverged'>('converging')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const b = buildRHS()
    const p = new Float64Array(N * N)
    const hist: number[] = [residual(p, b)]
    const r0 = hist[0]
    let count = 0
    let dead = false
    let raf = 0

    const W = canvas.width
    const H = canvas.height

    const draw = () => {
      if (!dead) {
        for (let s = 0; s < 2; s++) {
          for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
              const k = j * N + i
              const gs = 0.25 * (p[k - 1] + p[k + 1] + p[k - N] + p[k + N] - b[k])
              p[k] = (1 - w) * p[k] + w * gs
            }
          }
          count++
          const r = residual(p, b)
          hist.push(r)
          if (hist.length > 260) hist.shift()
          if (!isFinite(r) || r > 1e6) { dead = true; setStatus('diverged'); break }
          if (r < 1e-4 * r0) { dead = true; setStatus('converged'); break }
        }
        const rNow = hist[hist.length - 1]
        if (count % 4 === 0 || dead) {
          setIter(count)
          setRes(rNow)
          if (!dead) setStatus('converging')
        }
      }

      ctx.fillStyle = '#0e141d'
      ctx.fillRect(0, 0, W, H)

      // --- left: pressure heatmap ---
      const mapSize = 250
      const mx = 12
      const my = 15
      let pmax = 1e-9
      for (let k = 0; k < N * N; k++) pmax = Math.max(pmax, Math.abs(p[k]))
      const cell = mapSize / N
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const v = p[j * N + i] / pmax // -1..1
          const t = (v + 1) / 2
          const rC = Math.round(40 + 215 * Math.max(0, t - 0.5) * 2)
          const bC = Math.round(40 + 215 * Math.max(0, 0.5 - t) * 2)
          const gC = Math.round(30 + 120 * (1 - Math.abs(v)))
          ctx.fillStyle = `rgb(${rC},${gC},${bC})`
          ctx.fillRect(mx + i * cell, my + (N - 1 - j) * cell, cell + 1, cell + 1)
        }
      }
      ctx.fillStyle = '#8b97a8'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('pressure-correction field', mx, my + mapSize + 16)

      // --- right: residual history (log scale) ---
      const gx = mx + mapSize + 40
      const gy = my
      const gw = W - gx - 14
      const gh = mapSize
      ctx.strokeStyle = '#2a3547'
      ctx.lineWidth = 1
      ctx.strokeRect(gx, gy, gw, gh)

      const logMax = Math.log10(Math.max(r0, 1e-12)) + 0.5
      const logMin = logMax - 7 // 7 decades
      const yOf = (r: number) => {
        const lr = Math.log10(Math.max(r, 1e-12))
        return gy + gh - ((lr - logMin) / (logMax - logMin)) * gh
      }
      // decade gridlines
      ctx.strokeStyle = '#1c2836'
      ctx.fillStyle = '#586577'
      for (let d = Math.ceil(logMin); d <= logMax; d++) {
        const y = yOf(Math.pow(10, d))
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke()
        ctx.fillText(`1e${d}`, gx + 3, y - 2)
      }

      ctx.strokeStyle = status === 'diverged' ? '#ff6b6b' : status === 'converged' ? '#6fd08c' : '#5aa9ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      const nH = hist.length
      for (let n = 0; n < nH; n++) {
        const x = gx + (n / Math.max(1, nH - 1)) * gw
        const y = yOf(hist[n])
        if (n === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.fillStyle = '#8b97a8'
      ctx.fillText('||residual|| vs sweep', gx, gy + gh + 16)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [w])

  const color = status === 'diverged' ? '#ff6b6b' : status === 'converged' ? '#6fd08c' : '#5aa9ff'
  const msg =
    status === 'diverged'
      ? 'DIVERGED — relaxation factor past the stability limit; the correction overshoots every sweep.'
      : status === 'converged'
        ? `CONVERGED in ${iter} sweeps — residual ${res.toExponential(1)}.`
        : `converging — sweep ${iter}, residual ${res.toExponential(1)}.`

  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'system-ui, sans-serif' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={300}
        style={{ width: '100%', maxWidth: 640, height: 'auto', borderRadius: 10, display: 'block' }}
      />
      <div style={{ marginTop: 8, fontSize: 13, color }}>{msg}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.7rem', fontSize: 13, color: '#c9d3e0' }}>
        <label style={lab}>
          Relaxation factor w (≈ SIMPLE α_p): {w.toFixed(2)}
          <input type="range" min={0.2} max={1.99} step={0.01} value={w} onChange={(e) => setW(+e.target.value)} />
        </label>
      </div>
    </div>
  )
}

const lab: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 260,
}
