'use client'

import { useEffect, useRef, useState } from 'react'

const CS2 = 1 / 3
const N = 64
const K = (2 * Math.PI) / N
const STEPS_PER_SEC = 220
const TMAX = 2200

/** measured law: the cubic defect removes u²/(2c_s²) of the viscosity for a 45° mode */
const nuEffective = (nu: number, u: number) => nu * (1 - (u * u) / (2 * CS2))

export function GalileanDriftVortexRacer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const u0Ref = useRef(0.18)
  const tauRef = useRef(0.8)
  const playRef = useRef(true)
  const tRef = useRef(0)
  const histRef = useRef<{ t: number; a: number; b: number }[]>([])
  const [u0, setU0] = useState(0.18)
  const [tau, setTau] = useState(0.8)
  const [playing, setPlaying] = useState(true)
  const [readout, setReadout] = useState({ t: 0, ratio: 1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const off = document.createElement('canvas')
    off.width = N
    off.height = N
    const octx = off.getContext('2d')
    if (!octx) return
    const img = octx.createImageData(N, N)

    const BG = '#0d1117'
    const TXT = '#c9d1d9'
    const MUTED = '#8b949e'
    const AMBER = [251, 191, 36]
    const BLUE = [91, 155, 213]
    const PW = 250
    const PH = 170
    const PY = 40
    const LX = 25
    const RX = 295
    const HX = 25
    const HY = 252
    const HW = 520
    const HH = 118

    let raf = 0
    let frame = 0
    let last = performance.now()

    const paint = (amp: number, shift: number) => {
      const d = img.data
      for (let j = 0; j < N; j++) {
        const cy = Math.cos(K * j)
        for (let i = 0; i < N; i++) {
          const w = amp * Math.cos(K * (i - shift)) * cy
          const s = Math.max(-1, Math.min(1, w * 1.15))
          const c = s >= 0 ? AMBER : BLUE
          const a = Math.abs(s)
          const n = 4 * (j * N + i)
          d[n] = 13 + (c[0] - 13) * a
          d[n + 1] = 17 + (c[1] - 17) * a
          d[n + 2] = 23 + (c[2] - 23) * a
          d[n + 3] = 255
        }
      }
      octx.putImageData(img, 0, 0)
    }

    const draw = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const u = u0Ref.current
      const nu = CS2 * (tauRef.current - 0.5)
      const nuE = nuEffective(nu, u)
      if (playRef.current) {
        tRef.current += dt * STEPS_PER_SEC
        if (tRef.current > TMAX) {
          tRef.current = 0
          histRef.current = []
        }
      }
      const t = tRef.current
      const aRest = Math.exp(-2 * nu * K * K * t)
      const aMove = Math.exp(-2 * nuE * K * K * t)
      if (playRef.current && frame % 3 === 0) {
        histRef.current.push({ t, a: aRest, b: aMove })
        if (histRef.current.length > 900) histRef.current.shift()
      }

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = '11px ui-monospace, monospace'
      ctx.imageSmoothingEnabled = true

      ctx.fillStyle = TXT
      ctx.fillText('rest frame   U = 0', LX, 22)
      ctx.fillText('moving frame   U = ' + u.toFixed(2), RX, 22)

      paint(aRest, 0)
      ctx.drawImage(off, 0, 0, N, N, LX, PY, PW, PH)
      paint(aMove, (u * t) % N)
      ctx.drawImage(off, 0, 0, N, N, RX, PY, PW, PH)

      ctx.strokeStyle = '#30363d'
      ctx.strokeRect(LX, PY, PW, PH)
      ctx.strokeRect(RX, PY, PW, PH)
      ctx.fillStyle = MUTED
      ctx.fillText('|ω| = ' + aRest.toFixed(3), LX + 6, PY + PH - 8)
      ctx.fillStyle = aMove > aRest ? '#e06c4f' : MUTED
      ctx.fillText('|ω| = ' + aMove.toFixed(3), RX + 6, PY + PH - 8)
      ctx.fillStyle = MUTED
      ctx.fillText('same fluid, same τ — only the frame differs', LX, PY + PH + 16)

      /* ---- history ---- */
      ctx.strokeStyle = '#21262d'
      ctx.beginPath()
      for (let g = 0; g <= 4; g++) {
        const y = HY + (HH * g) / 4
        ctx.moveTo(HX, y)
        ctx.lineTo(HX + HW, y)
      }
      ctx.stroke()
      const hx = (tt: number) => HX + (tt / TMAX) * HW
      const hy = (aa: number) => HY + HH - aa * HH
      const h = histRef.current
      ctx.lineWidth = 1.8
      for (const [key, col] of [
        ['a', '#8b949e'],
        ['b', '#e06c4f'],
      ] as const) {
        ctx.strokeStyle = col
        ctx.beginPath()
        h.forEach((p, i) => {
          const y = hy(key === 'a' ? p.a : p.b)
          i === 0 ? ctx.moveTo(hx(p.t), y) : ctx.lineTo(hx(p.t), y)
        })
        ctx.stroke()
      }
      ctx.lineWidth = 1
      ctx.fillStyle = MUTED
      ctx.fillText('amplitude  1.0', HX + 4, HY + 12)
      ctx.fillText('0', HX + 4, HY + HH - 4)
      ctx.fillText('lattice steps →  ' + Math.round(t), HX + HW - 150, HY + HH - 4)
      ctx.fillStyle = '#8b949e'
      ctx.fillText('— rest', HX + 120, HY + 12)
      ctx.fillStyle = '#e06c4f'
      ctx.fillText('— moving (decays slower)', HX + 180, HY + 12)

      frame++
      if (frame % 12 === 0) setReadout({ t: Math.round(t), ratio: aMove / aRest })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const nu = CS2 * (tau - 0.5)
  const nuE = nuEffective(nu, u0)

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={570}
        height={382}
        style={{ width: '100%', borderRadius: 8, background: '#0d1117', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 205 }}>
          <span>
            frame velocity U : <b style={{ color: '#e06c4f' }}>{u0.toFixed(2)}</b> (Ma ={' '}
            {(u0 / Math.sqrt(CS2)).toFixed(2)})
          </span>
          <input
            type="range"
            min={0}
            max={0.25}
            step={0.01}
            value={u0}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              u0Ref.current = v
              setU0(v)
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 205 }}>
          <span>
            relaxation τ : <b style={{ color: '#fbbf24' }}>{tau.toFixed(2)}</b>
          </span>
          <input
            type="range"
            min={0.55}
            max={1.2}
            step={0.05}
            value={tau}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              tauRef.current = v
              setTau(v)
            }}
          />
        </label>
        <button
          onClick={() => {
            const n = !playing
            playRef.current = n
            setPlaying(n)
          }}
          style={{
            padding: '0.35rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#c9d1d9',
            cursor: 'pointer',
          }}
        >
          {playing ? 'pause' : 'play'}
        </button>
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          fontSize: 12.5,
          fontFamily: 'ui-monospace, monospace',
          color: '#8b949e',
        }}
      >
        ν = <b style={{ color: '#fbbf24' }}>{nu.toFixed(5)}</b> &nbsp;|&nbsp; ν<sub>eff</sub> ={' '}
        <b style={{ color: '#e06c4f' }}>{nuE.toFixed(5)}</b> &nbsp;|&nbsp; error{' '}
        <b style={{ color: '#e06c4f' }}>{((nuE / nu - 1) * 100).toFixed(2)} %</b> &nbsp;|&nbsp; step{' '}
        {readout.t} &nbsp;|&nbsp; amplitude ratio{' '}
        <b style={{ color: '#c9d1d9' }}>{readout.ratio.toFixed(3)}</b>
      </div>
    </div>
  )
}

export default GalileanDriftVortexRacer
