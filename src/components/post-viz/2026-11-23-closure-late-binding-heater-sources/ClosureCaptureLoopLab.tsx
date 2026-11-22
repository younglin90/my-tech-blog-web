'use client'

import { useEffect, useRef, useState } from 'react'

// Concept: a for-loop builds one heater closure per iteration.
// "capture name" (Python lambda / C++ [&]): every closure reads the loop variable when CALLED,
//   so all lamps on the rod follow the variable as the loop advances.
// "capture value" (default-arg / factory / C++ [=]): each closure keeps its own snapshot.

const W = 680
const H = 360
const ITER_FRAMES = 50

type Mode = 'name' | 'value'

function heaters(n: number) {
  const w = 0.5 / (n + 1)
  return Array.from({ length: n }, (_, k) => ({ c: (k + 1) / (n + 1), q: 10 * (k + 1), w }))
}

export function ClosureCaptureLoopLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('name')
  const [n, setN] = useState(4)
  const [playing, setPlaying] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [info, setInfo] = useState({ iter: 0, intended: 0, actual: 0, distinct: 0 })
  const st = useRef({ t: 0, step: false })

  useEffect(() => {
    st.current = { t: 0, step: false }
    setPlaying(false)
  }, [n, mode, resetKey])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const dark = document.documentElement.classList.contains('dark')
    const fg = dark ? 'rgba(230,230,230,0.92)' : 'rgba(30,30,30,0.92)'
    const dim = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'
    const shared = 'rgb(220,70,60)'
    const own = 'rgb(40,150,90)'
    const hs = heaters(n)
    const tEnd = n * ITER_FRAMES
    let raf = 0
    let frame = 0

    const draw = () => {
      const S = st.current
      frame++
      if (playing && S.t < tEnd) S.t++
      if (S.step) {
        S.t = Math.min(tEnd, (Math.floor(S.t / ITER_FRAMES) + 1) * ITER_FRAMES)
        S.step = false
      }
      // iteration index whose body has executed: created = closures that exist
      const created = Math.min(n, Math.floor(S.t / ITER_FRAMES) + (S.t > 0 ? 1 : 0))
      const cur = Math.max(0, created - 1)
      const phase = (S.t % ITER_FRAMES) / ITER_FRAMES
      const done = S.t >= tEnd

      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px monospace'
      // --- loop variable box (shared) ---
      ctx.strokeStyle = shared
      ctx.lineWidth = 2
      ctx.strokeRect(20, 20, 180, 56)
      ctx.fillStyle = shared
      ctx.fillText('loop variables (one slot)', 24, 14)
      ctx.fillStyle = fg
      if (created > 0) {
        ctx.fillText(`c = ${hs[cur].c.toFixed(2)}`, 32, 44)
        ctx.fillText(`q = ${hs[cur].q.toFixed(0)}`, 32, 64)
      } else ctx.fillText('(loop not started)', 32, 52)
      ctx.fillText(done ? 'loop finished' : created > 0 ? `iteration k = ${cur}` : '', 110, 52)

      // --- closures ---
      const cw = Math.min(100, (W - 260) / n - 8)
      for (let k = 0; k < n; k++) {
        const x0 = 240 + k * (cw + 8)
        const y0 = 20
        const exists = k < created
        ctx.strokeStyle = exists ? fg : dim
        ctx.lineWidth = 1
        ctx.strokeRect(x0, y0, cw, 56)
        ctx.fillStyle = exists ? fg : dim
        ctx.fillText(`f${k}(x)`, x0 + 6, y0 + 16)
        if (!exists) continue
        if (mode === 'value') {
          ctx.fillStyle = own
          ctx.fillText(`c=${hs[k].c.toFixed(2)}`, x0 + 6, y0 + 34)
          ctx.fillText(`q=${hs[k].q}`, x0 + 6, y0 + 50)
        } else {
          ctx.fillStyle = shared
          ctx.fillText('reads c, q', x0 + 6, y0 + 34)
          ctx.fillText('at call', x0 + 6, y0 + 50)
          // arrow back to the shared slot
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin((frame / 20) + k))
          ctx.strokeStyle = `rgba(220,70,60,${pulse.toFixed(2)})`
          ctx.beginPath()
          ctx.moveTo(x0 + cw / 2, y0 + 56)
          ctx.quadraticCurveTo(x0 + cw / 2, 110, 200, 60)
          ctx.stroke()
        }
      }

      // --- rod: evaluate every existing closure NOW ---
      const rl = 40
      const rr = W - 40
      const ry = 220
      const px = (v: number) => rl + v * (rr - rl)
      ctx.fillStyle = dim
      ctx.fillRect(rl, ry, rr - rl, 18)
      ctx.fillStyle = fg
      ctx.fillText('rod  x = 0', rl - 4, ry + 36)
      ctx.fillText('x = 1', rr - 34, ry + 36)
      ctx.fillText('calling f0..f' + Math.max(0, created - 1) + ' right now:', rl, ry - 70)
      // ghost = intended positions
      hs.forEach((h) => {
        ctx.strokeStyle = dim
        ctx.setLineDash([3, 3])
        ctx.strokeRect(px(h.c - h.w / 2), ry - 50, px(h.w) - rl, 50)
      })
      ctx.setLineDash([])
      const evals: { c: number; q: number }[] = []
      for (let k = 0; k < created; k++) {
        const src = mode === 'value' ? hs[k] : hs[cur]
        evals.push({ c: src.c, q: src.q })
      }
      // stack lamps that land on the same spot
      const stack = new Map<string, number>()
      evals.forEach((e, k) => {
        const key = e.c.toFixed(3)
        const lvl = stack.get(key) ?? 0
        stack.set(key, lvl + 1)
        const hgt = (e.q / (10 * n)) * 46
        const y = ry - 2 - hgt - lvl * 4
        const glow = mode === 'name' && k < created - 1 ? 0.55 + 0.35 * Math.sin(phase * Math.PI) : 0.85
        ctx.fillStyle = mode === 'name' ? `rgba(220,70,60,${glow.toFixed(2)})` : `rgba(40,150,90,${glow.toFixed(2)})`
        ctx.fillRect(px(e.c - hs[0].w / 2) + lvl * 3, y, px(hs[0].w) - rl, hgt)
        ctx.fillStyle = fg
        ctx.fillText(`f${k}`, px(e.c) - 8 + lvl * 3, y - 4)
      })
      // power bars
      const intended = hs.reduce((a, h) => a + h.q * h.w, 0)
      const actual = evals.reduce((a, e) => a + e.q * hs[0].w, 0)
      const by = 300
      const scale = (W - 240) / (Math.max(intended, n * hs[n - 1].q * hs[0].w) * 1.05)
      ctx.fillStyle = fg
      ctx.fillText('intended power Σ q·w', 20, by + 10)
      ctx.fillText('power the solver sees', 20, by + 34)
      ctx.fillStyle = dim
      ctx.fillRect(200, by, intended * scale, 14)
      ctx.fillStyle = mode === 'name' ? shared : own
      ctx.fillRect(200, by + 24, actual * scale, 14)
      ctx.fillStyle = fg
      ctx.fillText(intended.toFixed(2), 206 + intended * scale, by + 11)
      ctx.fillText(actual.toFixed(2), 206 + actual * scale, by + 35)

      if (frame % 12 === 0) {
        setInfo({ iter: created, intended, actual, distinct: new Set(evals.map((e) => e.c)).size })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [n, mode, playing, resetKey])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-40">heaters in loop: {n}</span>
          <input type="range" min={2} max={6} step={1} value={n} onChange={(e) => setN(+e.target.value)} className="flex-1" />
        </label>
        <div className="flex items-center gap-2">
          <span>capture:</span>
          <button className={`rounded border px-3 py-1 ${mode === 'name' ? 'bg-red-600 text-white' : ''}`} onClick={() => setMode('name')}>
            by name (late)
          </button>
          <button className={`rounded border px-3 py-1 ${mode === 'value' ? 'bg-green-700 text-white' : ''}`} onClick={() => setMode('value')}>
            by value
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (st.current.step = true)}>
          Step (1 iteration)
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setResetKey((v) => v + 1)}>
          Reset
        </button>
        <span className="font-mono text-xs">
          closures {info.iter}/{n} · distinct heaters {info.distinct} · power {info.actual.toFixed(2)} / {info.intended.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
