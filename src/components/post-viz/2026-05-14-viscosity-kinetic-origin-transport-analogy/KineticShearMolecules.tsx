'use client'

import { useEffect, useRef, useState } from 'react'

type Mol = { x: number; y: number; vx: number; vy: number }

const W = 520
const H = 280
const BOX_X0 = 16
const BOX_X1 = 340
const BOX_Y0 = 24
const BOX_Y1 = 256
const BOX_W = BOX_X1 - BOX_X0
const BOX_H = BOX_Y1 - BOX_Y0
const N_BINS = 12
const N_MOL = 90

function init(thermal: number, uTop: number): Mol[] {
  const arr: Mol[] = []
  for (let i = 0; i < N_MOL; i++) {
    const x = BOX_X0 + Math.random() * BOX_W
    const y = BOX_Y0 + Math.random() * BOX_H
    const angle = Math.random() * Math.PI * 2
    const drift = ((y - BOX_Y1) / (BOX_Y0 - BOX_Y1)) * uTop
    arr.push({
      x,
      y,
      vx: drift + Math.cos(angle) * thermal,
      vy: Math.sin(angle) * thermal,
    })
  }
  return arr
}

function thermalize(thermal: number): number {
  const u1 = Math.max(1e-6, Math.random())
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * thermal
}

export function KineticShearMolecules() {
  const [uTop, setUTop] = useState(1.2)
  const [thermal, setThermal] = useState(0.9)
  const [running, setRunning] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const molsRef = useRef<Mol[]>(init(0.9, 1.2))
  const profileRef = useRef<Float64Array>(new Float64Array(N_BINS))
  const countRef = useRef<Float64Array>(new Float64Array(N_BINS))
  const stressAccRef = useRef(0)
  const stressSamplesRef = useRef(0)
  const tParamsRef = useRef({ uTop: 1.2, thermal: 0.9 })

  useEffect(() => {
    tParamsRef.current = { uTop, thermal }
  }, [uTop, thermal])

  const reset = () => {
    molsRef.current = init(thermal, uTop)
    profileRef.current = new Float64Array(N_BINS)
    countRef.current = new Float64Array(N_BINS)
    stressAccRef.current = 0
    stressSamplesRef.current = 0
  }

  useEffect(() => {
    if (!running) return
    let raf = 0
    const dt = 0.45
    const decay = 0.985

    const tick = () => {
      const mols = molsRef.current
      const { uTop: U, thermal: T } = tParamsRef.current

      for (let i = 0; i < N_BINS; i++) {
        profileRef.current[i] *= decay
        countRef.current[i] *= decay
      }

      let stressSum = 0
      for (const m of mols) {
        m.x += m.vx * dt
        m.y += m.vy * dt

        if (m.x < BOX_X0) m.x += BOX_W
        if (m.x >= BOX_X1) m.x -= BOX_W

        if (m.y <= BOX_Y0) {
          m.y = BOX_Y0 + (BOX_Y0 - m.y)
          m.vy = Math.abs(thermalize(T))
          m.vx = U + thermalize(T) * 0.3
        } else if (m.y >= BOX_Y1) {
          m.y = BOX_Y1 - (m.y - BOX_Y1)
          m.vy = -Math.abs(thermalize(T))
          m.vx = 0 + thermalize(T) * 0.3
        }

        const yNorm = (BOX_Y1 - m.y) / BOX_H
        const bin = Math.min(N_BINS - 1, Math.max(0, Math.floor(yNorm * N_BINS)))
        profileRef.current[bin] += m.vx
        countRef.current[bin] += 1

        stressSum += m.vx * m.vy
      }
      stressAccRef.current = stressAccRef.current * 0.97 + stressSum * 0.03
      stressSamplesRef.current = stressSamplesRef.current * 0.97 + 1

      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1
    ctx.strokeRect(BOX_X0, BOX_Y0, BOX_W, BOX_H)

    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(BOX_X0, BOX_Y0 - 6, BOX_W, 4)
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(BOX_X0, BOX_Y1 + 2, BOX_W, 4)

    const arrowLen = Math.min(28, 14 + uTop * 14)
    ctx.strokeStyle = '#22d3ee'
    ctx.beginPath()
    ctx.moveTo(BOX_X0 + 20, BOX_Y0 - 12)
    ctx.lineTo(BOX_X0 + 20 + arrowLen, BOX_Y0 - 12)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(BOX_X0 + 20 + arrowLen, BOX_Y0 - 12)
    ctx.lineTo(BOX_X0 + 16 + arrowLen, BOX_Y0 - 15)
    ctx.lineTo(BOX_X0 + 16 + arrowLen, BOX_Y0 - 9)
    ctx.closePath()
    ctx.fillStyle = '#22d3ee'
    ctx.fill()

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '11px system-ui'
    ctx.fillText('top plate u = U', BOX_X0 + 20 + arrowLen + 6, BOX_Y0 - 8)
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('bottom plate u = 0', BOX_X0 + 6, BOX_Y1 + 18)

    const mols = molsRef.current
    for (const m of mols) {
      const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy)
      const hue = 200 - Math.min(180, speed * 60)
      ctx.fillStyle = `hsl(${hue}, 80%, 65%)`
      ctx.beginPath()
      ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }

    const PX0 = 360
    const PX1 = W - 16
    const PW = PX1 - PX0
    ctx.strokeStyle = '#334155'
    ctx.strokeRect(PX0, BOX_Y0, PW, BOX_H)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px system-ui'
    ctx.fillText('u(y)', PX0 + 4, BOX_Y0 - 6)
    ctx.fillText('U', PX1 - 8, BOX_Y0 + 10)
    ctx.fillText('0', PX0 + 2, BOX_Y1 - 2)

    const idealColor = '#475569'
    ctx.strokeStyle = idealColor
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(PX0, BOX_Y1)
    ctx.lineTo(PX0 + PW * (uTop / 2.5), BOX_Y0)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < N_BINS; i++) {
      const cnt = countRef.current[i]
      const u = cnt > 0.1 ? profileRef.current[i] / cnt : 0
      const px = PX0 + PW * (u / 2.5)
      const py = BOX_Y1 - ((i + 0.5) / N_BINS) * BOX_H
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.lineWidth = 1

    const stressMean = -stressAccRef.current / N_MOL
    const muEffective = uTop > 0.05 ? stressMean / (uTop / BOX_H) : 0
    ctx.fillStyle = '#f59e0b'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText(`<v_x v_y> = ${stressMean.toFixed(3)}`, PX0 + 4, BOX_Y1 + 16)
    ctx.fillText(`μ_eff ≈ ${muEffective.toFixed(3)}`, PX0 + 4, BOX_Y1 + 30)

    ctx.fillStyle = '#64748b'
    ctx.font = '10px system-ui'
    ctx.fillText(`thermal v_th = ${thermal.toFixed(2)}    N = ${N_MOL}`, BOX_X0, H - 4)
  }

  return (
    <div
      style={{
        background: '#0e1a2e',
        padding: 16,
        borderRadius: 8,
        margin: '24px 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }}
      />
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          flexWrap: 'wrap',
          color: '#cbd5e1',
          fontSize: 13,
          justifyContent: 'center',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
          <span>top plate U = {uTop.toFixed(2)}</span>
          <input
            type="range"
            min="0"
            max="2.4"
            step="0.05"
            value={uTop}
            onChange={(e) => setUTop(Number(e.target.value))}
            style={{ accentColor: '#22d3ee' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
          <span>thermal v_th = {thermal.toFixed(2)}</span>
          <input
            type="range"
            min="0.2"
            max="1.8"
            step="0.05"
            value={thermal}
            onChange={(e) => setThermal(Number(e.target.value))}
            style={{ accentColor: '#22d3ee' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              padding: '6px 14px',
              background: '#22d3ee',
              color: '#08111f',
              border: 0,
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {running ? 'pause' : 'play'}
          </button>
          <button
            onClick={reset}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            reset
          </button>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        Couette layer with discrete molecules. Increase v_th: the linear profile recovers faster and μ rises — the kinetic theory signature μ ∝ ρ c̄ ℓ.
      </div>
    </div>
  )
}
