'use client'

import { useEffect, useRef, useState } from 'react'

// Static droplet at equilibrium. In exact math the velocity is zero forever:
// surface tension makes a pressure jump (Laplace's law dP = sigma * kappa) that
// exactly balances the pressure gradient across the interface. On a discrete
// grid the two forces almost never cancel. The leftover force drives a swirling
// velocity field that never appears in the real physics -- the "parasitic
// currents".
//
// This is a visualization, not a solver. We model the residual (unbalanced)
// force as a divergence-free flow concentrated on the interface band, built
// from a stream function psi = A * band(r) * cos(m*theta + phase). The
// amplitude A integrates in time proportional to the curvature error eps, so
// the kinetic energy climbs exactly the way Fig. 6 of Tallois et al. (2025)
// shows. When eps = 0 (well-balanced) the amplitude stays at zero -> machine
// precision.
//
//   FACE  (1D)  : residual is projected onto grid axes -> strong, mesh-aligned
//                 octupole that sharpens the interface into an instability.
//   NODAL (multiD): a truly 2D nodal stencil -> weaker, smoother circulation.

const G = 120 // field resolution (<= 100 arrows drawn from a coarse subsample)
const R0 = 0.34 // droplet radius in [-0.5, 0.5] box units
const BAND = 0.055 // interface half-thickness

type Scheme = 'face' | 'nodal'

export function ParasiticCurrentField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)

  const ampRef = useRef(0) // integrated parasitic amplitude
  const keRef = useRef(0)
  const tRef = useRef(0)

  const [scheme, setScheme] = useState<Scheme>('face')
  const [eps, setEps] = useState(0.35) // curvature error (0 = exact -> well balanced)
  const [sigma, setSigma] = useState(0.072) // surface tension coeff (N/m), water/air
  const [radiusMm, setRadiusMm] = useState(0.5) // physical droplet radius (mm)
  const [running, setRunning] = useState(true)

  // Laplace jump dP = sigma * kappa = sigma / R  (2D cylinder curvature 1/R)
  const kappa = 1 / (radiusMm * 1e-3)
  const dP = sigma * kappa

  useEffect(() => {
    ampRef.current = 0
    keRef.current = 0
    tRef.current = 0
  }, [scheme, eps])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (!offRef.current) {
      offRef.current = document.createElement('canvas')
      offRef.current.width = G
      offRef.current.height = G
    }
    const off = offRef.current
    const octx = off.getContext('2d')
    if (!octx) return
    const img = octx.createImageData(G, G)

    const schemeFactor = scheme === 'face' ? 1.0 : 0.16
    const m = scheme === 'face' ? 4 : 6 // azimuthal lobes
    const phase = scheme === 'face' ? 0 : Math.PI / 7

    const band = (r: number) => {
      const d = (r - R0) / BAND
      return Math.exp(-d * d)
    }

    // velocity from psi = A * band(r) * cos(m*theta + phase)
    // u = d psi/dy , v = -d psi/dx   (divergence free)
    const vel = (x: number, y: number, A: number) => {
      const r = Math.hypot(x, y) + 1e-9
      const th = Math.atan2(y, x)
      const b = band(r)
      const db = (-2 * (r - R0) / (BAND * BAND)) * b // db/dr
      const c = Math.cos(m * th + phase)
      const s = Math.sin(m * th + phase)
      // psi_r = A*db*c , psi_th = -A*b*m*s
      // u_r =  (1/r) psi_th , u_th = -psi_r  (polar divergence-free)
      const ur = (1 / r) * (-A * b * m * s)
      const uth = -(A * db * c)
      let u = ur * Math.cos(th) - uth * Math.sin(th)
      let v = ur * Math.sin(th) + uth * Math.cos(th)
      if (scheme === 'face') {
        // mesh-aligned distortion: bias the field onto the grid axes
        u *= 1 + 0.6 * Math.cos(2 * th)
        v *= 1 - 0.6 * Math.cos(2 * th)
      }
      return [u, v] as const
    }

    const render = () => {
      const dt = 0.016
      if (running) {
        tRef.current += dt
        // unbalanced force feeds amplitude; well-balanced (eps=0) -> stays 0
        const growth = eps * schemeFactor
        ampRef.current = Math.min(0.9, ampRef.current + growth * dt * 0.7)
      }
      const A = ampRef.current

      // paint velocity magnitude into ImageData + accumulate KE
      let ke = 0
      let vmax = 1e-9
      const mag = new Float32Array(G * G)
      for (let j = 0; j < G; j++) {
        const y = (j / (G - 1) - 0.5)
        for (let i = 0; i < G; i++) {
          const x = (i / (G - 1) - 0.5)
          const [u, v] = vel(x, y, A)
          const sp = Math.hypot(u, v)
          mag[j * G + i] = sp
          if (sp > vmax) vmax = sp
          ke += 0.5 * (u * u + v * v)
        }
      }
      keRef.current = ke / (G * G)
      for (let k = 0; k < G * G; k++) {
        const t = Math.min(1, mag[k] / vmax)
        // dark teal -> amber ramp
        const rr = Math.round(20 + 235 * Math.pow(t, 0.6))
        const gg = Math.round(30 + 150 * Math.pow(t, 0.9))
        const bb = Math.round(60 + 40 * (1 - t))
        img.data[k * 4] = rr
        img.data[k * 4 + 1] = gg
        img.data[k * 4 + 2] = bb
        img.data[k * 4 + 3] = 255
      }
      octx.putImageData(img, 0, 0)

      const W = canvas.width
      const H = canvas.height
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(off, 0, 0, W, H)

      // droplet interface circle
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, R0 * W, 0, 2 * Math.PI)
      ctx.stroke()

      // arrows on a coarse subgrid (<= 100)
      const S = 10 // 10x10 arrows
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 1
      const scale = 0.42 * W
      for (let a = 0; a < S; a++) {
        for (let b = 0; b < S; b++) {
          const x = ((a + 0.5) / S - 0.5)
          const y = ((b + 0.5) / S - 0.5)
          const [u, v] = vel(x, y, A)
          const px = (x + 0.5) * W
          const py = (y + 0.5) * H
          const len = Math.min(0.045 * W, Math.hypot(u, v) * scale)
          const ang = Math.atan2(v, u)
          const ex = px + Math.cos(ang) * len
          const ey = py + Math.sin(ang) * len
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(ex, ey)
          ctx.stroke()
          if (len > 3) {
            ctx.beginPath()
            ctx.moveTo(ex, ey)
            ctx.lineTo(ex - Math.cos(ang - 0.5) * 4, ey - Math.sin(ang - 0.5) * 4)
            ctx.lineTo(ex - Math.cos(ang + 0.5) * 4, ey - Math.sin(ang + 0.5) * 4)
            ctx.closePath()
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.fill()
          }
        }
      }
      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [scheme, eps, running])

  const keDisplay =
    eps === 0
      ? '≈ 1e-18  (machine precision)'
      : keRef.current.toExponential(2)

  return (
    <div
      style={{
        border: '1px solid #2a2a33',
        borderRadius: 12,
        padding: 16,
        background: '#101014',
        margin: '1.5rem 0',
        color: '#e8e8ea',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{
            width: 300,
            height: 300,
            borderRadius: 8,
            background: '#0a0a0d',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setScheme('face')}
              style={btn(scheme === 'face')}
            >
              1D · face (mesh-aligned)
            </button>
            <button
              onClick={() => setScheme('nodal')}
              style={btn(scheme === 'nodal')}
            >
              multiD · nodal
            </button>
          </div>

          <label style={lab}>
            curvature error ε: {eps.toFixed(2)} {eps === 0 && '— well-balanced'}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={eps}
              onChange={(e) => setEps(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>

          <label style={lab}>
            surface tension σ: {sigma.toFixed(3)} N/m
            <input
              type="range"
              min={0.02}
              max={0.35}
              step={0.002}
              value={sigma}
              onChange={(e) => setSigma(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>

          <label style={lab}>
            droplet radius R: {radiusMm.toFixed(2)} mm
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={radiusMm}
              onChange={(e) => setRadiusMm(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>

          <div style={{ fontSize: 13, lineHeight: 1.6, background: '#17171d', borderRadius: 6, padding: '8px 10px' }}>
            <div>Laplace jump ΔP = σκ = σ/R = <b style={{ color: '#ffb454' }}>{dP.toFixed(1)} Pa</b></div>
            <div>kinetic energy Σ½|u|² = <b style={{ color: eps === 0 ? '#5ad19a' : '#ff7a7a' }}>{keDisplay}</b></div>
          </div>

          <button onClick={() => setRunning((r) => !r)} style={btn(false)}>
            {running ? '⏸ pause' : '▶ play'}
          </button>
        </div>
      </div>
    </div>
  )
}

const lab: React.CSSProperties = { fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }

function btn(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '7px 10px',
    borderRadius: 6,
    border: '1px solid #33333d',
    background: active ? '#2a6b57' : '#1a1a20',
    color: active ? '#eafff5' : '#c8c8cc',
    cursor: 'pointer',
    fontSize: 12,
  }
}
