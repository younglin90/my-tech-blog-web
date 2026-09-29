'use client'

import { useEffect, useRef, useState } from 'react'

const NY = 16
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
/** Zero density, zero momentum, zero stress; unit third moment cx*cy*cy. */
const V_XYY = [0, -0.5, 0, 0.5, 0, 0.25, -0.25, -0.25, 0.25]

const wrap = (j: number) => ((j % NY) + NY) % NY

function shape(kind: 'uniform' | 'wave', nodesPerWave: number, amp: number) {
  const d = new Float64Array(NY)
  for (let j = 0; j < NY; j++) {
    d[j] = kind === 'uniform' ? amp : amp * Math.sin((2 * Math.PI * j) / nodesPerWave)
  }
  return d
}

/** x-momentum landing on each node after one streaming step. */
function kickProfile(d: Float64Array) {
  const k = new Float64Array(NY)
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < 9; i++) {
      if (CX[i] === 0) continue
      k[j] += CX[i] * V_XYY[i] * d[wrap(j - CY[i])]
    }
  }
  return k
}

export function ThirdMomentLeakStreamer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [kind, setKind] = useState<'uniform' | 'wave'>('wave')
  const [nodesPerWave, setNodesPerWave] = useState(8)
  const [amp, setAmp] = useState(1)
  const [running, setRunning] = useState(true)
  const st = useRef({ kind, nodesPerWave, amp, running })
  const [readout, setReadout] = useState({ peak: 0, net: 0, second: 0 })

  useEffect(() => {
    st.current = { kind, nodesPerWave, amp, running }
  }, [kind, nodesPerWave, amp, running])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let phase = 0

    const draw = () => {
      frame++
      const p = st.current
      if (p.running) phase = (phase + 0.006) % 1
      const d = shape(p.kind, p.nodesPerWave, p.amp)
      const kick = kickProfile(d)

      const pad = 44
      const dx = (cv.width - 2 * pad) / (NY - 1)
      const rowY = 132
      const barY = 330

      ctx.fillStyle = '#0d1420'
      ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(
        'one streaming step of a correction that carries no mass, no momentum, no stress',
        pad,
        26,
      )
      ctx.fillStyle = '#8b98a9'
      ctx.fillText('injected amount d(y) = Fx * uy^2  (grey line)', pad, 46)

      // d(y) profile
      let dmax = 1e-9
      for (let j = 0; j < NY; j++) dmax = Math.max(dmax, Math.abs(d[j]))
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let j = 0; j < NY; j++) {
        const x = pad + j * dx
        const y = 78 - (d[j] / dmax) * 22
        if (j === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      // lattice row
      ctx.strokeStyle = '#26313f'
      ctx.beginPath()
      ctx.moveTo(pad - 12, rowY)
      ctx.lineTo(cv.width - pad + 12, rowY)
      ctx.stroke()
      for (let j = 0; j < NY; j++) {
        const x = pad + j * dx
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.arc(x, rowY, 5, 0, 2 * Math.PI)
        ctx.fill()
        if (j % 4 === 0) {
          ctx.fillStyle = '#8b98a9'
          ctx.fillText(`${j}`, x - 4, rowY + 22)
        }
      }
      ctx.fillStyle = '#8b98a9'
      ctx.fillText('y', cv.width - pad + 16, rowY + 4)

      // flying populations, offset above/below by the sign of cx
      for (let j = 0; j < NY; j++) {
        for (let i = 1; i < 9; i++) {
          if (CX[i] === 0) continue
          const q = V_XYY[i] * d[j]
          if (Math.abs(q) < 1e-9) continue
          const x0 = pad + j * dx
          const x1 = x0 + CY[i] * dx * phase
          const lift = CX[i] > 0 ? -1 : 1
          const y = rowY + lift * (16 + 10 * Math.abs(CY[i]))
          const r = 2 + 6 * Math.min(1, Math.abs(q) / (0.5 * dmax))
          ctx.fillStyle = q * CX[i] > 0 ? 'rgba(56,189,248,0.85)' : 'rgba(251,146,60,0.85)'
          ctx.beginPath()
          ctx.arc(x1, y, r, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
      ctx.fillStyle = '#38bdf8'
      ctx.fillText('carries +x momentum', pad, rowY - 42)
      ctx.fillStyle = '#fb923c'
      ctx.fillText('carries -x momentum', pad, rowY + 58)

      // landed x-momentum
      let kmax = 1e-12
      let net = 0
      for (let j = 0; j < NY; j++) {
        kmax = Math.max(kmax, Math.abs(kick[j]))
        net += kick[j]
      }
      const ref = 0.5 * dmax * (2 - 2 * Math.cos((2 * Math.PI) / p.nodesPerWave))
      const scale = 58 / Math.max(kmax, 1e-12)
      ctx.strokeStyle = '#26313f'
      ctx.beginPath()
      ctx.moveTo(pad - 12, barY)
      ctx.lineTo(cv.width - pad + 12, barY)
      ctx.stroke()
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('x-momentum delivered to each node after the step', pad, barY - 76)
      for (let j = 0; j < NY; j++) {
        const x = pad + j * dx
        const h = kick[j] * scale * phase
        ctx.fillStyle = kick[j] >= 0 ? 'rgba(74,222,128,0.85)' : 'rgba(244,114,182,0.85)'
        ctx.fillRect(x - 7, barY - Math.max(h, 0), 14, Math.abs(h))
        if (h < 0) ctx.fillRect(x - 7, barY, 14, -h)
      }
      // analytic second difference overlay
      ctx.strokeStyle = '#fbbf24'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      for (let j = 0; j < NY; j++) {
        const x = pad + j * dx
        const sd = 0.5 * (d[wrap(j - 1)] - 2 * d[j] + d[wrap(j + 1)])
        const y = barY - sd * scale
        if (j === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('dashed: 0.5 * second difference of d(y)', pad + 330, barY - 76)

      if (frame % 12 === 0) setReadout({ peak: kmax, net, second: ref })
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
        height={380}
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
          d(y) ={' '}
          <select value={kind} onChange={(e) => setKind(e.target.value as 'uniform' | 'wave')}>
            <option value="wave">sine</option>
            <option value="uniform">uniform</option>
          </select>
        </label>
        <label>
          nodes per wave = {nodesPerWave}{' '}
          <input
            type="range"
            min={4}
            max={16}
            step={1}
            value={nodesPerWave}
            onChange={(e) => setNodesPerWave(parseInt(e.target.value, 10))}
          />
        </label>
        <label>
          amplitude = {amp.toFixed(2)}{' '}
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.05}
            value={amp}
            onChange={(e) => setAmp(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <input type="checkbox" checked={running} onChange={(e) => setRunning(e.target.checked)} />{' '}
          stream
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        Switch d(y) to uniform: the dots still fly, the green bars all collapse to zero. Switch back
        to sine and shorten the wavelength: the bars grow like the second difference. Peak delivered
        momentum {readout.peak.toExponential(2)}, total over the column{' '}
        {Math.abs(readout.net) < 1e-14 ? '0 (exactly)' : readout.net.toExponential(2)}, predicted
        peak 0.5*|d&apos;&apos;| = {readout.second.toExponential(2)}.
      </p>
    </div>
  )
}
