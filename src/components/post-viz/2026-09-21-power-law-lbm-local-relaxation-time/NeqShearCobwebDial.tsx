'use client'

import { useEffect, useRef, useState } from 'react'

const CS2 = 1 / 3
// D2Q9: only the four diagonals carry c_x c_y = +-1, so only they feed Pi_xy
const DIAG = [
  { cx: 1, cy: 1, s: 1 },
  { cx: -1, cy: 1, s: -1 },
  { cx: -1, cy: -1, s: 1 },
  { cx: 1, cy: -1, s: -1 },
]
const AXIS = [
  { cx: 1, cy: 0 },
  { cx: 0, cy: 1 },
  { cx: -1, cy: 0 },
  { cx: 0, cy: -1 },
]

/** m = cs2 * tau. Fixed point of  m = cs2/2 + B m^(1-n). */
const gOf = (m: number, B: number, n: number) => CS2 / 2 + B * Math.pow(Math.max(m, 1e-12), 1 - n)

function converged(B: number, n: number): number {
  let m = 1
  for (let i = 0; i < 400; i++) m = gOf(m, B, n)
  return m
}

export function NeqShearCobwebDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pxy, setPxy] = useState(4e-4)
  const [n, setN] = useState(0.6)
  const [K, setK] = useState(2.5e-3)
  const [auto, setAuto] = useState(true)
  const [iters, setIters] = useState(0)

  const st = useRef({ pxy, n, K, auto, path: [] as number[], m: 1, frame: 0 })
  st.current.pxy = pxy
  st.current.n = n
  st.current.K = K
  st.current.auto = auto

  const resetIter = () => {
    st.current.path = [1]
    st.current.m = 1
    st.current.frame = 0
    setIters(0)
  }
  useEffect(resetIter, [pxy, n, K])

  const B = K * Math.pow(Math.abs(pxy), n - 1)
  const mStar = converged(B, n)
  const tauStar = mStar / CS2
  const gammaStar = Math.abs(pxy) / mStar // gamma = Q/(2 rho cs2 tau) = |Pi_xy| / m
  const nuStar = CS2 * (tauStar - 0.5)
  // one-shot "lagged tau" answer, starting from the usual seed tau = 0.8
  const tauLag = 0.5 + (K * Math.pow(Math.abs(pxy) / (0.8 * CS2), n - 1)) / CS2

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = () => {
      const s = st.current
      const W = canvas.width
      const H = canvas.height
      const Bl = s.K * Math.pow(Math.abs(s.pxy), s.n - 1)
      const root = converged(Bl, s.n)

      if (s.path.length === 0) s.path = [1]
      s.frame++
      if (s.auto && s.frame % 14 === 0 && s.path.length < 26) {
        const next = gOf(s.path[s.path.length - 1], Bl, s.n)
        s.path.push(next)
        setIters(s.path.length - 1)
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0c1118'
      ctx.fillRect(0, 0, W, H)

      // ================= left: D2Q9 rosette ==========================
      const cx = 140
      const cy = H / 2 - 6
      const R = 92
      ctx.strokeStyle = '#2b3746'
      ctx.lineWidth = 1
      ctx.strokeRect(cx - R - 24, cy - R - 24, 2 * (R + 24), 2 * (R + 24))

      ctx.fillStyle = '#93a3b8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('D2Q9 non-equilibrium, Pi_xy', cx, cy - R - 34)

      ctx.fillStyle = '#3a4757'
      for (const a of AXIS) {
        ctx.beginPath()
        ctx.arc(cx + a.cx * R * 0.72, cy - a.cy * R * 0.72, 5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fill()

      const amp = Math.min(1, Math.abs(s.pxy) / 4e-3)
      for (const d of DIAG) {
        const px = cx + d.cx * R * 0.72
        const py = cy - d.cy * R * 0.72
        const val = d.s * s.pxy
        ctx.strokeStyle = val > 0 ? 'rgba(127,212,255,0.85)' : 'rgba(255,140,120,0.85)'
        ctx.lineWidth = 1 + 5 * amp
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(px, py)
        ctx.stroke()
        ctx.fillStyle = val > 0 ? '#7fd4ff' : '#ff8c78'
        ctx.beginPath()
        ctx.arc(px, py, 4 + 7 * amp, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#c7d3e0'
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText(`${d.s > 0 ? '+' : '-'}`, px, py - 12 - 7 * amp)
      }
      ctx.fillStyle = '#6b7a8d'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('c_x c_y = +1 blue,  -1 red', cx, cy + R + 16)
      ctx.fillText('axis links contribute nothing', cx, cy + R + 30)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#e6edf5'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`Pi_xy = ${s.pxy.toExponential(2)}`, 24, H - 40)
      ctx.fillText(`Q = 2|Pi_xy| = ${(2 * Math.abs(s.pxy)).toExponential(2)}`, 24, H - 24)

      // ================= right: cobweb ===============================
      const gl = 330
      const gr = W - 150
      const gt = 46
      const gb = H - 54
      const mMax = Math.max(root * 1.9, CS2)
      const X = (m: number) => gl + (m / mMax) * (gr - gl)
      const Y = (v: number) => gb - (v / mMax) * (gb - gt)

      ctx.strokeStyle = '#2b3746'
      ctx.lineWidth = 1
      ctx.strokeRect(gl, gt, gr - gl, gb - gt)
      ctx.fillStyle = '#93a3b8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('m  =  cs2 * tau', (gl + gr) / 2, gb + 30)
      ctx.save()
      ctx.translate(gl - 28, (gt + gb) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('g(m) = cs2/2 + B m^(1-n)', 0, 0)
      ctx.restore()
      ctx.textAlign = 'left'

      // identity line
      ctx.strokeStyle = 'rgba(150,160,175,0.55)'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(X(0), Y(0))
      ctx.lineTo(X(mMax), Y(mMax))
      ctx.stroke()
      ctx.setLineDash([])

      // the map
      ctx.strokeStyle = '#4ade80'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const m = (i / 200) * mMax
        const v = gOf(m, Bl, s.n)
        const px = X(m)
        const py = Y(Math.min(v, mMax))
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()

      // cobweb staircase
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let i = 0; i < s.path.length - 1; i++) {
        const a = s.path[i]
        const b = s.path[i + 1]
        ctx.moveTo(X(a), Y(a))
        ctx.lineTo(X(a), Y(b))
        ctx.lineTo(X(b), Y(b))
      }
      ctx.stroke()
      const last = s.path[s.path.length - 1]
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(X(last), Y(last), 5, 0, Math.PI * 2)
      ctx.fill()

      // fixed point marker
      ctx.strokeStyle = '#7fd4ff'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(X(root), Y(0))
      ctx.lineTo(X(root), Y(root))
      ctx.stroke()
      ctx.setLineDash([])

      const err = Math.abs(last - root) / root
      ctx.fillStyle = '#e6edf5'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`iteration ${s.path.length - 1}`, gr + 12, gt + 16)
      ctx.fillText(`tau = ${(last / CS2).toFixed(4)}`, gr + 12, gt + 34)
      ctx.fillText(`fixed pt ${(root / CS2).toFixed(4)}`, gr + 12, gt + 52)
      ctx.fillStyle = err < 1e-6 ? '#4ade80' : '#fbbf24'
      ctx.fillText(`rel err ${err.toExponential(1)}`, gr + 12, gt + 70)
      ctx.fillStyle = '#6b7a8d'
      ctx.fillText(`slope at`, gr + 12, gt + 96)
      ctx.fillText(`fixed pt`, gr + 12, gt + 110)
      const slope = Bl * (1 - s.n) * Math.pow(root, -s.n)
      ctx.fillStyle = Math.abs(slope) < 1 ? '#4ade80' : '#ff5d5d'
      ctx.fillText(`${slope.toFixed(3)}`, gr + 12, gt + 126)
      ctx.fillStyle = '#6b7a8d'
      ctx.fillText(Math.abs(slope) < 1 ? '|slope|<1' : '|slope|>1', gr + 12, gt + 142)
      ctx.fillText('contracts' , gr + 12, gt + 156)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
          Pi_xy = {pxy.toExponential(2)}{' '}
          <input
            type="range"
            min={-6}
            max={-2}
            step={0.02}
            value={Math.log10(pxy)}
            onChange={(e) => setPxy(Math.pow(10, parseFloat(e.target.value)))}
          />
        </label>
        <label>
          n = {n.toFixed(2)}{' '}
          <input
            type="range"
            min={0.3}
            max={1.4}
            step={0.02}
            value={n}
            onChange={(e) => setN(parseFloat(e.target.value))}
          />
        </label>
        <label>
          K = {K.toExponential(1)}{' '}
          <input
            type="range"
            min={-4}
            max={-1}
            step={0.02}
            value={Math.log10(K)}
            onChange={(e) => setK(Math.pow(10, parseFloat(e.target.value)))}
          />
        </label>
        <button onClick={resetIter}>restart from tau = 3</button>
        <label>
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> run
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        The staircase is the whole solver: {iters} steps of m &rarr; cs2/2 + B m^(1-n) land on tau ={' '}
        {tauStar.toFixed(4)} (gamma = {gammaStar.toExponential(2)}, nu = {nuStar.toExponential(2)}).
        Freezing tau at the previous step instead would answer {tauLag.toFixed(4)}. No neighbour
        node is read at any point.
      </p>
    </div>
  )
}
