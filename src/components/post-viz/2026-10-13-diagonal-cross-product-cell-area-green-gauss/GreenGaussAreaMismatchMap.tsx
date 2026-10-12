'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 380
const BOX = 340
const X0 = 24
const Y0 = 20
const TP = 2 * Math.PI

type Method = 'diag' | 'jcentre' | 'curved'

const METHOD_LABEL: Record<Method, string> = {
  diag: '½ (BD × CA)  polygon area',
  jcentre: 'J(cell centre) · h²',
  curved: 'true curved area ∫J dξdη',
}

function map(a: number, xi: number, eta: number) {
  const w = a * Math.sin(TP * xi) * Math.sin(TP * eta)
  return [xi + w, eta + w]
}

function jac(a: number, xi: number, eta: number) {
  const wx = a * TP * Math.cos(TP * xi) * Math.sin(TP * eta)
  const we = a * TP * Math.sin(TP * xi) * Math.cos(TP * eta)
  return (1 + wx) * (1 + we) - we * wx
}

const GL = [
  [-0.8611363115940526, 0.3478548451374538],
  [-0.3399810435848563, 0.6521451548625461],
  [0.3399810435848563, 0.6521451548625461],
  [0.8611363115940526, 0.3478548451374538],
]

function cellError(a: number, n: number, i: number, j: number, method: Method) {
  const h = 1 / n
  const c = [
    map(a, i * h, j * h),
    map(a, (i + 1) * h, j * h),
    map(a, (i + 1) * h, (j + 1) * h),
    map(a, i * h, (j + 1) * h),
  ]
  let flux = 0
  for (let k = 0; k < 4; k++) {
    const p = c[k]
    const q = c[(k + 1) % 4]
    flux += 0.5 * (p[0] + q[0]) * (q[1] - p[1])
  }
  let vol: number
  if (method === 'diag') {
    vol = 0.5 * ((c[2][0] - c[0][0]) * (c[3][1] - c[1][1]) - (c[2][1] - c[0][1]) * (c[3][0] - c[1][0]))
  } else if (method === 'jcentre') {
    vol = jac(a, (i + 0.5) * h, (j + 0.5) * h) * h * h
  } else {
    vol = 0
    for (const [s, ws] of GL) for (const [t, wt] of GL) vol += ws * wt * jac(a, (i + (1 + s) / 2) * h, (j + (1 + t) / 2) * h)
    vol *= (h * h) / 4
  }
  return Math.abs(flux / vol - 1)
}

function errColor(e: number) {
  // log10 error from -15 (green) to -1 (red)
  const l = Math.log10(Math.max(e, 1e-16))
  const t = Math.min(1, Math.max(0, (l + 15) / 14))
  const r = Math.round(52 + t * (248 - 52))
  const g = Math.round(211 - t * (211 - 113))
  const b = Math.round(153 - t * (153 - 113))
  return `rgb(${r},${g},${b})`
}

export function GreenGaussAreaMismatchMap() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [n, setN] = useState(12)
  const [amp, setAmp] = useState(0.06)
  const [method, setMethod] = useState<Method>('jcentre')
  const [breathe, setBreathe] = useState(true)
  const [read, setRead] = useState({ maxE: 0, a: 0.06 })
  const cfg = useRef({ n, amp, method, breathe })

  useEffect(() => {
    cfg.current = { n, amp, method, breathe }
  }, [n, amp, method, breathe])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return
    let raf = 0
    let frame = 0
    let tt = 0

    const draw = () => {
      frame++
      const { n, amp, method, breathe } = cfg.current
      if (breathe) tt += 0.02
      const a = breathe ? amp * (0.5 + 0.5 * Math.sin(tt)) : amp
      const h = 1 / n
      const sx = (v: number) => X0 + v * BOX
      const sy = (v: number) => Y0 + BOX - v * BOX

      g.fillStyle = '#0f172a'
      g.fillRect(0, 0, W, H)

      let maxE = 0
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const e = cellError(a, n, i, j, method)
          if (e > maxE) maxE = e
          const c = [map(a, i * h, j * h), map(a, (i + 1) * h, j * h), map(a, (i + 1) * h, (j + 1) * h), map(a, i * h, (j + 1) * h)]
          g.fillStyle = errColor(e)
          g.beginPath()
          g.moveTo(sx(c[0][0]), sy(c[0][1]))
          for (let k = 1; k < 4; k++) g.lineTo(sx(c[k][0]), sy(c[k][1]))
          g.closePath()
          g.fill()
          g.strokeStyle = 'rgba(15,23,42,0.85)'
          g.lineWidth = 1
          g.stroke()
        }
      }
      // true curved grid lines (thin white) on top of the straight-edged cells
      g.strokeStyle = 'rgba(255,255,255,0.55)'
      g.lineWidth = 0.8
      const M = 40
      for (let i = 0; i <= n; i++) {
        g.beginPath()
        for (let m = 0; m <= M; m++) {
          const eta = m / M
          const p = map(a, i * h, eta)
          if (m === 0) g.moveTo(sx(p[0]), sy(p[1]))
          else g.lineTo(sx(p[0]), sy(p[1]))
        }
        g.stroke()
        g.beginPath()
        for (let m = 0; m <= M; m++) {
          const xi = m / M
          const p = map(a, xi, i * h)
          if (m === 0) g.moveTo(sx(p[0]), sy(p[1]))
          else g.lineTo(sx(p[0]), sy(p[1]))
        }
        g.stroke()
      }

      // legend
      const lx = 420
      g.font = '13px ui-monospace, monospace'
      g.fillStyle = '#e2e8f0'
      g.fillText('Green–Gauss  ∂x/∂x  per cell', lx, 40)
      g.fillStyle = '#94a3b8'
      g.fillText('V = ' + METHOD_LABEL[method], lx, 62)
      for (let k = 0; k <= 200; k++) {
        const e = Math.pow(10, -15 + (14 * k) / 200)
        g.fillStyle = errColor(e)
        g.fillRect(lx + k * 1.5, 84, 2, 16)
      }
      g.fillStyle = '#94a3b8'
      g.font = '11px ui-monospace, monospace'
      g.fillText('1e-15', lx, 116)
      g.fillText('1e-8', lx + 135, 116)
      g.fillText('1e-1', lx + 272, 116)
      g.fillText('|∂x/∂x − 1|  (log scale)', lx, 134)
      g.font = '13px ui-monospace, monospace'
      g.fillStyle = maxE < 1e-10 ? '#34d399' : '#f87171'
      g.fillText(`max error = ${maxE.toExponential(2)}`, lx, 170)
      g.fillStyle = '#94a3b8'
      g.fillText(`A = ${a.toFixed(3)}   N = ${n}   h = ${h.toFixed(4)}`, lx, 192)
      g.fillText('white curves: true mapped grid lines', lx, 222)
      g.fillText('coloured quads: straight-edged FV cells', lx, 242)
      g.fillText('faces see the straight edges only,', lx, 272)
      g.fillText('so V must be the same polygon.', lx, 290)

      if (frame % 12 === 0) setRead({ maxE, a })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const lab: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, minWidth: 170, flex: 1 }
  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.45)', cursor: 'pointer', fontSize: 12,
    background: on ? 'rgba(56,189,248,0.2)' : 'transparent', color: 'inherit',
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {(['diag', 'jcentre', 'curved'] as Method[]).map((m) => (
          <button key={m} style={btn(method === m)} onClick={() => setMethod(m)}>{METHOD_LABEL[m]}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
        <label style={lab}>
          cells per side N = {n}
          <input type="range" min={4} max={32} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label style={lab}>
          waviness A = {amp.toFixed(3)}
          <input type="range" min={0} max={0.1} step={0.005} value={amp} onChange={(e) => setAmp(Number(e.target.value))} />
        </label>
        <button style={btn(breathe)} onClick={() => setBreathe((b) => !b)}>{breathe ? 'pause breathing' : 'breathe grid'}</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <span style={{ color: read.maxE < 1e-10 ? '#34d399' : '#f87171' }}>max |∂x/∂x − 1| = {read.maxE.toExponential(2)}</span>
        {' '}at A = {read.a.toFixed(3)} | double N and the J-based errors drop ×4; the polygon area stays at round-off.
      </div>
    </div>
  )
}
