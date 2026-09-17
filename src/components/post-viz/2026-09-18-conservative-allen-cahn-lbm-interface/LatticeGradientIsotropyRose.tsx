'use client'

import { useEffect, useRef, useState } from 'react'

const G = 72
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const WQ = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const BINS = 48

type Sample = { theta: number; err: number }
type Result = { bins: number[]; anis: number; meanAbs: number }

const idx = (i: number, j: number) => ((i + G) % G) * G + ((j + G) % G)

function buildField(radius: number, width: number) {
  const phi = new Float64Array(G * G)
  const exact = new Float64Array(G * G)
  for (let i = 0; i < G; i++) {
    for (let j = 0; j < G; j++) {
      const x = i - G / 2 + 0.5
      const y = j - G / 2 + 0.5
      const s = (2 * (radius - Math.hypot(x, y))) / width
      phi[idx(i, j)] = 0.5 * (1 + Math.tanh(s))
      exact[idx(i, j)] = 1 / width / Math.cosh(s) ** 2
    }
  }
  return { phi, exact }
}

/** plain 2nd-order central difference: only the four axis neighbours */
function gradCentral(phi: Float64Array, i: number, j: number) {
  const gx = (phi[idx(i + 1, j)] - phi[idx(i - 1, j)]) / 2
  const gy = (phi[idx(i, j + 1)] - phi[idx(i, j - 1)]) / 2
  return Math.hypot(gx, gy)
}

/** lattice-weighted stencil: grad phi = (1/cs^2) * sum_i w_i c_i phi(x + c_i) */
function gradLattice(phi: Float64Array, i: number, j: number) {
  let gx = 0
  let gy = 0
  for (let k = 0; k < 9; k++) {
    const v = phi[idx(i + CX[k], j + CY[k])]
    gx += WQ[k] * CX[k] * v
    gy += WQ[k] * CY[k] * v
  }
  return Math.hypot(3 * gx, 3 * gy)
}

function analyse(radius: number, width: number, lattice: boolean): Result {
  const { phi, exact } = buildField(radius, width)
  const samples: Sample[] = []
  for (let i = 2; i < G - 2; i++) {
    for (let j = 2; j < G - 2; j++) {
      const x = i - G / 2 + 0.5
      const y = j - G / 2 + 0.5
      if (Math.abs(Math.hypot(x, y) - radius) > 0.6) continue
      const g = lattice ? gradLattice(phi, i, j) : gradCentral(phi, i, j)
      samples.push({ theta: Math.atan2(y, x), err: ((g - exact[idx(i, j)]) / exact[idx(i, j)]) * 100 })
    }
  }
  const sum = new Array<number>(BINS).fill(0)
  const cnt = new Array<number>(BINS).fill(0)
  let meanAbs = 0
  for (const s of samples) {
    const b = Math.min(BINS - 1, Math.floor(((s.theta + Math.PI) / (2 * Math.PI)) * BINS))
    sum[b] += s.err
    cnt[b] += 1
    meanAbs += Math.abs(s.err)
  }
  meanAbs = samples.length ? meanAbs / samples.length : 0
  const bins = new Array<number>(BINS).fill(0)
  let lastGood = 0
  for (let b = 0; b < BINS; b++) {
    bins[b] = cnt[b] ? sum[b] / cnt[b] : lastGood
    lastGood = bins[b]
  }
  const filled = bins.filter((_, b) => cnt[b] > 0)
  const anis = filled.length ? Math.max(...filled) - Math.min(...filled) : 0
  return { bins, anis, meanAbs }
}

export function LatticeGradientIsotropyRose() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [width, setWidth] = useState(4)
  const [radius, setRadius] = useState(20)
  const [lattice, setLattice] = useState(false)
  const [spin, setSpin] = useState(true)
  const [stats, setStats] = useState({ anis: 0, meanAbs: 0, probe: 0 })

  const wRef = useRef(width)
  const rRef = useRef(radius)
  const lRef = useRef(lattice)
  const spinRef = useRef(spin)
  wRef.current = width
  rRef.current = radius
  lRef.current = lattice
  spinRef.current = spin

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const FX = 20
    const FY = 26
    const FS = 250
    const RCX = 430
    const RCY = 152
    const R0 = 52

    let raf = 0
    let frame = 0
    let theta = 0
    let last = performance.now()
    let cache = { key: '', cen: null as Result | null, lat: null as Result | null, phi: new Float64Array(0) }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (spinRef.current) theta += dt * 0.8

      const key = `${wRef.current}|${rRef.current}`
      if (cache.key !== key) {
        cache = {
          key,
          cen: analyse(rRef.current, wRef.current, false),
          lat: analyse(rRef.current, wRef.current, true),
          phi: buildField(rRef.current, wRef.current).phi,
        }
      }
      const cen = cache.cen as Result
      const lat = cache.lat as Result
      const active = lRef.current ? lat : cen

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, cv.width, cv.height)

      // ---- left: the droplet on the lattice ----
      const cell = FS / G
      for (let i = 0; i < G; i++) {
        for (let j = 0; j < G; j++) {
          const v = cache.phi[idx(i, j)]
          if (v < 0.02) continue
          const g = Math.round(40 + v * 110)
          ctx.fillStyle = `rgb(${Math.round(g * 0.45)},${Math.round(g * 0.75)},${g + 60})`
          ctx.fillRect(FX + i * cell, FY + (G - 1 - j) * cell, cell + 0.6, cell + 0.6)
        }
      }
      const fcx = FX + FS / 2
      const fcy = FY + FS / 2
      ctx.strokeStyle = '#f0f6fc'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(fcx, fcy, rRef.current * cell, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = '#d29922'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fcx, fcy)
      ctx.lineTo(fcx + Math.cos(theta) * FS * 0.46, fcy - Math.sin(theta) * FS * 0.46)
      ctx.stroke()
      ctx.lineWidth = 1

      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText('tanh droplet on a D2Q9 lattice', FX, FY - 10)
      const deg = (((theta * 180) / Math.PI) % 360 + 360) % 360
      ctx.fillText(`probe theta = ${deg.toFixed(0)} deg`, FX, FY + FS + 16)

      // ---- right: error rose ----
      const scale = Math.max(2, Math.max(cen.meanAbs + cen.anis, lat.meanAbs + lat.anis) * 1.25)
      const rr = (v: number) => R0 + (v / scale) * 42

      ctx.strokeStyle = '#30363d'
      for (const ref of [0, scale / 2, scale]) {
        ctx.beginPath()
        ctx.arc(RCX, RCY, rr(ref), 0, Math.PI * 2)
        ctx.stroke()
      }

      const rose = (res: Result, color: string, lw: number) => {
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.beginPath()
        for (let b = 0; b <= BINS; b++) {
          const a = ((b % BINS) / BINS) * 2 * Math.PI - Math.PI
          const rad = rr(res.bins[b % BINS])
          const xx = RCX + Math.cos(a) * rad
          const yy = RCY - Math.sin(a) * rad
          if (b === 0) ctx.moveTo(xx, yy)
          else ctx.lineTo(xx, yy)
        }
        ctx.stroke()
        ctx.lineWidth = 1
      }
      rose(cen, lRef.current ? '#484f58' : '#f85149', lRef.current ? 1 : 2.4)
      rose(lat, lRef.current ? '#58a6ff' : '#484f58', lRef.current ? 2.4 : 1)

      const pb = Math.min(BINS - 1, Math.floor(((theta % (2 * Math.PI)) / (2 * Math.PI)) * BINS))
      const pa = (pb / BINS) * 2 * Math.PI - Math.PI
      ctx.fillStyle = '#d29922'
      ctx.beginPath()
      ctx.arc(RCX + Math.cos(pa) * rr(active.bins[pb]), RCY - Math.sin(pa) * rr(active.bins[pb]), 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#8b949e'
      ctx.textAlign = 'center'
      ctx.fillText('relative error of |grad phi| vs angle', RCX, FY - 10)
      ctx.fillText(`ring = ${scale.toFixed(1)}%`, RCX, RCY + 112)
      ctx.fillStyle = '#f85149'
      ctx.fillText('central difference', RCX, RCY + 128)
      ctx.fillStyle = '#58a6ff'
      ctx.fillText('D2Q9 weighted', RCX, RCY + 144)

      frame += 1
      if (frame % 12 === 0) {
        setStats({ anis: active.anis, meanAbs: active.meanAbs, probe: active.bins[pb] })
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean) => ({
    padding: '0.35rem 0.9rem',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: active ? '#238636' : '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={580}
        height={300}
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190 }}>
          <span>
            interface width W : <b style={{ color: '#7ee787' }}>{width.toFixed(1)}</b>
          </span>
          <input
            type="range"
            min={2}
            max={7}
            step={0.5}
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190 }}>
          <span>
            droplet radius R : <b style={{ color: '#7ee787' }}>{radius}</b>
          </span>
          <input
            type="range"
            min={10}
            max={28}
            step={1}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          />
        </label>
        <button onClick={() => setLattice((v) => !v)} style={btn(lattice)}>
          {lattice ? 'stencil: D2Q9' : 'stencil: central'}
        </button>
        <button onClick={() => setSpin((v) => !v)} style={btn(spin)}>
          {spin ? 'pause probe' : 'spin probe'}
        </button>
        <span style={{ color: '#d29922' }}>
          anisotropy = <b>{stats.anis.toFixed(3)}%</b>
        </span>
        <span style={{ color: '#8b949e' }}>
          mean |err| = <b>{stats.meanAbs.toFixed(3)}%</b>
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        Switch the stencil and watch the rose, not the readout beside it. The central-difference rose
        is a four-lobed flower whose petals point along the lattice axes; the D2Q9 rose is almost a
        circle even though its mean error is the larger of the two. Shrink W towards 2 to see both
        get worse, but only one of them get lopsided.
      </p>
    </div>
  )
}
