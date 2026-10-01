'use client'

import { useEffect, useRef, useState } from 'react'

const W = 680
const H = 358
const D = 4
const COLORS = ['#38bdf8', '#fbbf24', '#f87171']
const LABEL = ['phase 1', 'phase 2', 'phase 3']

function kappas(s12: number, s13: number, s23: number) {
  const f = 0.75 * D
  return [f * (s12 + s13 - s23), f * (s12 + s23 - s13), f * (s13 + s23 - s12)]
}

function wedges(s12: number, s13: number, s23: number) {
  const a = [
    (s23 * s23 - s12 * s12 - s13 * s13) / (2 * s12 * s13),
    (s13 * s13 - s12 * s12 - s23 * s23) / (2 * s12 * s23),
    (s12 * s12 - s13 * s13 - s23 * s23) / (2 * s13 * s23),
  ]
  if (a.some((v) => Math.abs(v) > 1)) return null
  return a.map((v) => (Math.acos(v) * 180) / Math.PI)
}

export function NeumannTriangleKappaDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [s12, setS12] = useState(1)
  const [s13, setS13] = useState(0.8)
  const [s23, setS23] = useState(0.6)
  const [readout, setReadout] = useState({ closed: true, theta: [143.1, 126.9, 90] })
  const angRef = useRef<[number, number, number]>([120, 120, 120])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0

    const draw = () => {
      const kap = kappas(s12, s13, s23)
      const th = wedges(s12, s13, s23)
      const open = th === null
      // open triangle: the phase whose kappa went negative is wetted away to a film
      const worst = kap.indexOf(Math.min(...kap))
      const target: [number, number, number] = th
        ? [th[0], th[1], th[2]]
        : worst === 2
          ? [90, 90, 180]
          : worst === 1
            ? [90, 180, 90]
            : [180, 90, 90]
      const cur = angRef.current
      for (let k = 0; k < 3; k += 1) cur[k] += (target[k] - cur[k]) * 0.06

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#f8fafc'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Triple junction: Neumann wedges from the pairwise sigma_ij', 16, 20)

      // left: the junction
      const cx = 160
      const cy = 180
      const R = 112
      let a0 = -90
      const norm = cur[0] + cur[1] + cur[2]
      for (let k = 0; k < 3; k += 1) {
        const span = (cur[k] / norm) * 360
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, (a0 * Math.PI) / 180, ((a0 + span) * Math.PI) / 180)
        ctx.closePath()
        ctx.fillStyle = COLORS[k].replace(')', ', 0.3)').replace('#', 'rgba(')
        ctx.fillStyle =
          k === 0 ? 'rgba(56,189,248,0.26)' : k === 1 ? 'rgba(251,191,36,0.26)' : 'rgba(248,113,113,0.26)'
        ctx.fill()
        const mid = ((a0 + span / 2) * Math.PI) / 180
        ctx.fillStyle = COLORS[k]
        ctx.font = '11px ui-sans-serif, system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(LABEL[k], cx + Math.cos(mid) * R * 0.66, cy + Math.sin(mid) * R * 0.66)
        ctx.fillText(`${cur[k].toFixed(0)} deg`, cx + Math.cos(mid) * R * 0.66, cy + Math.sin(mid) * R * 0.66 + 14)
        a0 += span
      }
      a0 = -90
      const edgeNames = ['1-2', '1-3', '2-3']
      const edgeOf = [0, 2, 1] // boundary after phase k wedge
      for (let k = 0; k < 3; k += 1) {
        const ang = (a0 * Math.PI) / 180
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R)
        ctx.stroke()
        ctx.fillStyle = '#94a3b8'
        ctx.font = '10px ui-sans-serif, system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(edgeNames[edgeOf[k]], cx + Math.cos(ang) * (R + 14), cy + Math.sin(ang) * (R + 14))
        a0 += (cur[k] / norm) * 360
      }
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
      ctx.fill()

      // right: force triangle + kappa bars
      const bx = 350
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('force triangle  sigma_12 + sigma_13 + sigma_23 = 0', bx, 52)
      const sc = 86 / Math.max(s12, s13, s23)
      if (th) {
        // build the closed triangle from the three magnitudes
        const pts: [number, number][] = [[0, 0]]
        let dir = 0
        const mags = [s12, s13, s23]
        const ex = [180 - th[2], 180 - th[0], 180 - th[1]]
        for (let k = 0; k < 3; k += 1) {
          const p = pts[pts.length - 1]
          pts.push([p[0] + Math.cos((dir * Math.PI) / 180) * mags[k] * sc, p[1] + Math.sin((dir * Math.PI) / 180) * mags[k] * sc])
          dir += 180 - ex[k]
        }
        let minx = Infinity
        let miny = Infinity
        pts.forEach((p) => {
          minx = Math.min(minx, p[0])
          miny = Math.min(miny, p[1])
        })
        const ox = bx + 18 - minx
        const oy = 78 - miny
        const names = ['sigma_12', 'sigma_13', 'sigma_23']
        for (let k = 0; k < 3; k += 1) {
          const p = pts[k]
          const q = pts[k + 1]
          ctx.strokeStyle = ['#38bdf8', '#fbbf24', '#f87171'][k]
          ctx.lineWidth = 2.4
          ctx.beginPath()
          ctx.moveTo(ox + p[0], oy + p[1])
          ctx.lineTo(ox + q[0], oy + q[1])
          ctx.stroke()
          ctx.fillStyle = ['#38bdf8', '#fbbf24', '#f87171'][k]
          ctx.font = '10px ui-sans-serif, system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(names[k], ox + (p[0] + q[0]) / 2, oy + (p[1] + q[1]) / 2 - 5)
        }
      } else {
        ctx.fillStyle = '#fca5a5'
        ctx.font = '12px ui-sans-serif, system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('triangle does not close -> total wetting', bx + 18, 96)
        ctx.fillText(`sigma exceeds the sum of the other two`, bx + 18, 114)
      }

      ctx.textAlign = 'left'
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('kappa_i = (3D/4)(sigma_ij + sigma_ik - sigma_jk)', bx, 196)
      const base = bx + 74
      for (let k = 0; k < 3; k += 1) {
        const y = 214 + k * 30
        ctx.fillStyle = '#94a3b8'
        ctx.textAlign = 'right'
        ctx.fillText(`kappa_${k + 1}`, base - 10, y + 10)
        ctx.strokeStyle = 'rgba(148,163,184,0.5)'
        ctx.beginPath()
        ctx.moveTo(base, y - 4)
        ctx.lineTo(base, y + 16)
        ctx.stroke()
        const len = (kap[k] / 6) * 150
        ctx.fillStyle = kap[k] > 0 ? COLORS[k] : '#ef4444'
        ctx.fillRect(base + Math.min(0, len), y, Math.abs(len), 11)
        ctx.fillStyle = kap[k] > 0 ? '#e2e8f0' : '#fca5a5'
        ctx.textAlign = 'left'
        ctx.fillText(`${kap[k] >= 0 ? '+' : ''}${kap[k].toFixed(2)}`, base + Math.max(len, 0) + 8, y + 10)
      }
      ctx.fillStyle = open ? '#fca5a5' : '#86efac'
      ctx.textAlign = 'left'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText(
        open ? 'kappa < 0: gradient energy unbounded below' : `wedge sum ${(cur[0] + cur[1] + cur[2]).toFixed(1)} deg`,
        bx,
        326,
      )

      frame += 1
      if (frame % 14 === 0) setReadout({ closed: !open, theta: th ?? [0, 0, 0] })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [s12, s13, s23])

  const sliders: [string, number, (v: number) => void][] = [
    ['sigma_12', s12, setS12],
    ['sigma_13', s13, setS13],
    ['sigma_23', s23, setS23],
  ]

  return (
    <div className="my-6 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded" style={{ maxWidth: '100%' }} />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
        {sliders.map(([name, val, set]) => (
          <label key={name} className="flex items-center gap-2">
            <span>
              {name} {val.toFixed(2)}
            </span>
            <input
              type="range"
              min={0.2}
              max={1.4}
              step={0.05}
              value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="w-24"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={() => {
            setS12(1)
            setS13(0.8)
            setS23(0.6)
          }}
          className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        >
          reset to 1.0 / 0.8 / 0.6
        </button>
        <span className={readout.closed ? 'text-slate-400' : 'text-rose-300'}>
          {readout.closed
            ? `wedges ${readout.theta.map((t) => t.toFixed(0)).join(' / ')} deg`
            : 'no equilibrium junction'}
        </span>
      </div>
    </div>
  )
}
