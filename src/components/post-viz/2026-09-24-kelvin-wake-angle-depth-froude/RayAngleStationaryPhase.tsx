'use client'

import { useEffect, useRef, useState } from 'react'

// Normalised units: g = 1, h = 1, so sqrt(g h) = 1 and V equals Fr_h directly.
function cPhaseN(k: number) {
  return Math.sqrt(Math.tanh(k) / k)
}

function solveKN(v: number): number | null {
  if (v <= 1e-9 || v >= 1) return null
  let lo = 1e-7
  let hi = 1
  while (cPhaseN(hi) > v) {
    hi *= 2
    if (hi > 1e7) return null
  }
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi)
    if (cPhaseN(mid) > v) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

function groupVelN(k: number) {
  const f = k > 20 ? 1 : 1 + (2 * k) / Math.sinh(2 * k)
  return 0.5 * cPhaseN(k) * f
}

function curve(frh: number) {
  const pts: { theta: number; alpha: number }[] = []
  const n = 420
  for (let i = 1; i < n; i++) {
    const theta = (0.5 * Math.PI * i) / n
    const k = solveKN(frh * Math.cos(theta))
    if (k === null) continue
    const cg = groupVelN(k)
    const den = frh - cg * Math.cos(theta)
    const alpha = den <= 0 ? 0.5 * Math.PI : Math.atan2(cg * Math.sin(theta), den)
    pts.push({ theta: (theta * 180) / Math.PI, alpha: (alpha * 180) / Math.PI })
  }
  return pts
}

export function RayAngleStationaryPhase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [frh, setFrh] = useState(0.45)
  const [sweeping, setSweeping] = useState(false)
  const [peak, setPeak] = useState({ alpha: 19.47, theta: 35.27 })

  const ref = useRef({ frh: 0.45, sweeping: false })
  ref.current = { frh, sweeping }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let dir = 1
    let local = 0.45

    const draw = () => {
      if (ref.current.sweeping) {
        local += dir * 0.0035
        if (local > 1.9) { local = 1.9; dir = -1 }
        if (local < 0.1) { local = 0.1; dir = 1 }
        if (frame % 8 === 0) setFrh(parseFloat(local.toFixed(3)))
      } else {
        local = ref.current.frh
      }
      const f = local

      const W = canvas.width
      const H = canvas.height
      const L = 52
      const R = W - 18
      const T = 18
      const B = H - 38
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#081420'
      ctx.fillRect(0, 0, W, H)

      const xOf = (t: number) => L + (t / 90) * (R - L)
      const yOf = (a: number) => B - (a / 90) * (B - T)

      ctx.strokeStyle = 'rgba(255,255,255,0.10)'
      ctx.lineWidth = 1
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = '11px ui-monospace, monospace'
      for (let a = 0; a <= 90; a += 15) {
        ctx.beginPath(); ctx.moveTo(L, yOf(a)); ctx.lineTo(R, yOf(a)); ctx.stroke()
        ctx.fillText(String(a).padStart(2, ' '), 22, yOf(a) + 4)
      }
      for (let t = 0; t <= 90; t += 15) {
        ctx.beginPath(); ctx.moveTo(xOf(t), T); ctx.lineTo(xOf(t), B); ctx.stroke()
        ctx.fillText(String(t), xOf(t) - 8, B + 16)
      }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('wavenumber direction  θ [deg]', W / 2 - 80, H - 6)
      ctx.save()
      ctx.translate(13, H / 2 + 46); ctx.rotate(-Math.PI / 2)
      ctx.fillText('ray angle  α [deg]', 0, 0)
      ctx.restore()

      // deep-water reference 19.47
      ctx.strokeStyle = 'rgba(154,230,110,0.55)'
      ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.moveTo(L, yOf(19.47)); ctx.lineTo(R, yOf(19.47)); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#9ae66e'
      ctx.fillText('19.47° deep-water Kelvin limit', L + 8, yOf(19.47) - 6)

      const pts = curve(f)
      ctx.strokeStyle = '#60c8ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(xOf(p.theta), yOf(p.alpha)) : ctx.lineTo(xOf(p.theta), yOf(p.alpha))))
      ctx.stroke()

      let best = { theta: 0, alpha: 0 }
      for (const p of pts) if (p.alpha > best.alpha) best = p

      // cut-off region for supercritical
      if (f > 1) {
        const cut = (Math.acos(1 / f) * 180) / Math.PI
        ctx.fillStyle = 'rgba(255,123,107,0.13)'
        ctx.fillRect(xOf(0), T, xOf(cut) - xOf(0), B - T)
        ctx.fillStyle = '#ff7b6b'
        ctx.fillText('no steady wave here', xOf(0) + 6, T + 16)
      }

      ctx.fillStyle = '#ffd166'
      ctx.beginPath(); ctx.arc(xOf(best.theta), yOf(best.alpha), 5, 0, 2 * Math.PI); ctx.fill()
      ctx.strokeStyle = 'rgba(255,209,102,0.5)'
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(L, yOf(best.alpha)); ctx.lineTo(xOf(best.theta), yOf(best.alpha)); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillText(`max α = ${best.alpha.toFixed(2)}°`, xOf(best.theta) + 9, yOf(best.alpha) - 8)

      frame++
      if (frame % 10 === 0) setPeak({ alpha: best.alpha, theta: best.theta })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const mach = frh > 1 ? (Math.asin(1 / frh) * 180) / Math.PI : null

  return (
    <div style={{ border: '1px solid #1e3245', borderRadius: 10, padding: 14, background: '#0b1622' }}>
      <canvas ref={canvasRef} width={720} height={360}
        style={{ width: '100%', height: 'auto', borderRadius: 6, display: 'block' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14, marginTop: 14 }}>
        <label style={{ color: '#cfe3f2', fontSize: 13 }}>
          Depth Froude number Fr_h = {frh.toFixed(3)}
          <input type="range" min={0.1} max={1.9} step={0.005} value={frh}
            onChange={(e) => { setSweeping(false); setFrh(parseFloat(e.target.value)) }}
            style={{ width: '100%' }} />
        </label>
        <button onClick={() => setSweeping((s) => !s)}
          style={{ alignSelf: 'end', padding: '6px 12px', borderRadius: 6, border: '1px solid #2a4a66',
            background: sweeping ? '#24455f' : '#16304a', color: '#cfe3f2', cursor: 'pointer', fontSize: 13 }}>
          {sweeping ? 'Stop sweep' : 'Auto sweep Fr_h'}
        </button>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        <span style={{ color: '#ffd166' }}>peak α = {peak.alpha.toFixed(2)}&deg; at &theta;* = {peak.theta.toFixed(2)}&deg;</span>
        <span style={{ color: '#9ae66e' }}>
          {mach === null ? 'subcritical branch' : `asin(1/Fr_h) = ${mach.toFixed(2)}°`}
        </span>
      </div>
      <p style={{ color: '#8ba6bd', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
        Below Fr_h &asymp; 0.7 the peak sits fixed at &theta;* = 35.27&deg;, &alpha; = 19.47&deg;.
        Drag Fr_h toward 1 and watch &theta;* slide to zero while &alpha; climbs to 90&deg;.
        Past 1 a forbidden band opens on the left and the peak tracks asin(1/Fr_h).
      </p>
    </div>
  )
}
