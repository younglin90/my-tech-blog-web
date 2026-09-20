'use client'

import { useEffect, useRef, useState } from 'react'

const CS2 = 1 / 3
const NU_WALL = 0.05 // kinematic viscosity at the wall, lattice units -> tau_wall = 0.65
const G = 2e-6 // body force per unit mass, lattice units

type Profile = {
  y: number[]
  tau: number[]
  tauRaw: number[]
  gamma: number[]
  u: number[]
  uRef: number[]
  clamped: number
  h: number
}

/**
 * Fully developed channel flow, driven by a constant body force.
 * Momentum balance fixes the kinematic shear stress exactly: sigma(y) = G * y.
 * The power law sigma = K * gamma^n then gives gamma without any iteration.
 */
function buildProfile(n: number, ny: number, tauMax: number, clampOn: boolean): Profile {
  const h = ny / 2
  // pick K so that the wall node always lands on tau = 0.65, whatever n is
  const gammaWall = (G * (h - 0.5)) / NU_WALL
  const K = NU_WALL * Math.pow(gammaWall, 1 - n)

  const y: number[] = []
  const tau: number[] = []
  const tauRaw: number[] = []
  const gamma: number[] = []
  let clamped = 0

  for (let j = 0; j < ny; j++) {
    const yj = j - (ny - 1) / 2
    const sigma = Math.abs(G * yj)
    const gRaw = Math.pow(sigma / K, 1 / n)
    const nuRaw = sigma === 0 ? Infinity : sigma / gRaw
    const tRaw = 0.5 + nuRaw / CS2
    let t = tRaw
    if (clampOn && (t > tauMax || !Number.isFinite(t))) {
      t = tauMax
      clamped++
    }
    if (!Number.isFinite(t)) t = 1e9
    y.push(yj)
    tauRaw.push(tRaw)
    tau.push(t)
    gamma.push(sigma / (CS2 * (t - 0.5)))
  }

  // integrate du/dy = -gamma * sign(y) inward from each wall
  const u = new Array(ny).fill(0)
  // u[0] sits half a node from the wall; sweep up, then sweep down, average
  u[0] = gamma[0] * 0.5
  for (let j = 1; j < ny; j++) u[j] = u[j - 1] + 0.5 * (gamma[j - 1] + gamma[j])
  // mirror: integrate from the top wall too, average the two sweeps
  const u2 = new Array(ny).fill(0)
  u2[ny - 1] = gamma[ny - 1] * 0.5
  for (let j = ny - 2; j >= 0; j--) u2[j] = u2[j + 1] + 0.5 * (gamma[j + 1] + gamma[j])
  for (let j = 0; j < ny; j++) u[j] = 0.5 * (u[j] + u2[j])

  // Newtonian reference at the same wall viscosity
  const uRef = y.map((yj) => (G / (2 * NU_WALL)) * (h * h - yj * yj))
  return { y, tau, tauRaw, gamma, u, uRef, clamped, h }
}

export function PowerLawTauLadder() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [n, setN] = useState(0.6)
  const [ny, setNy] = useState(41)
  const [tauMax, setTauMax] = useState(5)
  const [clampOn, setClampOn] = useState(true)
  const [running, setRunning] = useState(true)

  const nRef = useRef(n)
  const nyRef = useRef(ny)
  const tauMaxRef = useRef(tauMax)
  const clampRef = useRef(clampOn)
  const runRef = useRef(running)
  nRef.current = n
  nyRef.current = ny
  tauMaxRef.current = tauMax
  clampRef.current = clampOn
  runRef.current = running

  const prof = buildProfile(n, ny, tauMax, clampOn)
  const tauMid = prof.tauRaw[(ny - 1) / 2]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const tracers: { x: number; y: number }[] = []
    for (let i = 0; i < 140; i++) tracers.push({ x: Math.random(), y: Math.random() })

    let raf = 0
    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const p = buildProfile(nRef.current, nyRef.current, tauMaxRef.current, clampRef.current)
      const uMax = Math.max(...p.u, 1e-12)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0c1118'
      ctx.fillRect(0, 0, W, H)

      const split = Math.round(W * 0.54)
      const padT = 30
      const padB = 34
      const chL = 52
      const chR = split - 18
      const yTop = padT
      const yBot = H - padB
      const yOf = (yy: number) => yTop + ((yy + p.h) / (2 * p.h)) * (yBot - yTop)
      const xOf = (uu: number) => chL + (uu / uMax) * (chR - chL) * 0.94

      // ---- left: channel + profile -------------------------------------
      ctx.fillStyle = '#121a24'
      ctx.fillRect(chL, yTop, chR - chL, yBot - yTop)
      ctx.strokeStyle = '#5a6b80'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(chL, yTop)
      ctx.lineTo(chR, yTop)
      ctx.moveTo(chL, yBot)
      ctx.lineTo(chR, yBot)
      ctx.stroke()

      if (runRef.current) {
        for (const t of tracers) {
          const yy = (t.y - 0.5) * 2 * p.h
          const idx = Math.min(p.u.length - 1, Math.max(0, Math.round(yy + (p.u.length - 1) / 2)))
          t.x += (p.u[idx] / uMax) * 0.013
          if (t.x > 1) t.x -= 1
        }
      }
      ctx.fillStyle = 'rgba(120,200,255,0.55)'
      for (const t of tracers) {
        const px = chL + t.x * (chR - chL)
        const py = yTop + t.y * (yBot - yTop)
        ctx.fillRect(px, py, 2, 2)
      }

      // Newtonian reference (same wall viscosity)
      const uRefMax = Math.max(...p.uRef)
      ctx.strokeStyle = 'rgba(160,170,185,0.55)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      p.uRef.forEach((uu, j) => {
        const px = chL + (uu / uRefMax) * (chR - chL) * 0.94
        const py = yOf(p.y[j])
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // power-law profile, nodes coloured by local tau
      ctx.strokeStyle = '#7fd4ff'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      p.u.forEach((uu, j) => {
        const px = xOf(uu)
        const py = yOf(p.y[j])
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.stroke()

      const tauColor = (t: number) => {
        if (t < 0.55) return '#ff5d5d'
        if (t < 2) return '#4ade80'
        if (t < 10) return '#fbbf24'
        return '#ff5d5d'
      }
      p.u.forEach((uu, j) => {
        ctx.fillStyle = tauColor(p.tau[j])
        ctx.beginPath()
        ctx.arc(xOf(uu), yOf(p.y[j]), p.u.length > 60 ? 2 : 3, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.fillStyle = '#93a3b8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('u(y)   lattice units', chL, yBot + 20)
      ctx.save()
      ctx.translate(16, (yTop + yBot) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText('y  (wall to wall)', 0, 0)
      ctx.restore()
      ctx.textAlign = 'left'
      ctx.fillStyle = '#6b7a8d'
      ctx.fillText('dashed = Newtonian, same wall viscosity', chL, yTop - 12)

      // ---- right: tau ladder (log axis) --------------------------------
      const lL = split + 46
      const lR = W - 16
      const TMIN = 0.5
      const TMAXAX = 1e4
      const lx = (t: number) => {
        const v = Math.max(t - TMIN, 1e-4)
        const a = Math.log10(1e-4)
        const b = Math.log10(TMAXAX)
        return lL + ((Math.log10(v) - a) / (b - a)) * (lR - lL)
      }

      const bands: [number, number, string][] = [
        [0.5, 0.55, 'rgba(255,93,93,0.16)'],
        [0.55, 2, 'rgba(74,222,128,0.13)'],
        [2, 10, 'rgba(251,191,36,0.13)'],
        [10, TMAXAX, 'rgba(255,93,93,0.16)'],
      ]
      for (const [a, b, c] of bands) {
        ctx.fillStyle = c
        ctx.fillRect(lx(a), yTop, lx(b) - lx(a), yBot - yTop)
      }
      ctx.strokeStyle = '#2b3746'
      ctx.lineWidth = 1
      for (const t of [0.51, 0.6, 1, 2, 10, 100, 1000]) {
        ctx.beginPath()
        ctx.moveTo(lx(t), yTop)
        ctx.lineTo(lx(t), yBot)
        ctx.stroke()
        ctx.fillStyle = '#6b7a8d'
        ctx.font = '10px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(t), lx(t), yBot + 14)
      }
      ctx.textAlign = 'left'

      ctx.strokeStyle = 'rgba(127,212,255,0.7)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      p.tau.forEach((t, j) => {
        const px = lx(Math.min(t, TMAXAX * 0.999))
        const py = yOf(p.y[j])
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.stroke()
      p.tau.forEach((t, j) => {
        ctx.fillStyle = tauColor(t)
        ctx.beginPath()
        ctx.arc(lx(Math.min(t, TMAXAX * 0.999)), yOf(p.y[j]), p.u.length > 60 ? 2 : 3, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.fillStyle = '#93a3b8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('local relaxation time  tau(y)   (log)', lL, yTop - 12)
      ctx.fillText('tau - 0.5', lL, yBot + 30)

      ctx.fillStyle = '#e6edf5'
      ctx.font = '11px ui-monospace, monospace'
      const mid = (p.u.length - 1) / 2
      const tMidRaw = p.tauRaw[mid]
      ctx.fillText(`tau wall ${p.tau[0].toFixed(3)}`, lL, yTop + 14)
      ctx.fillText(
        `tau centre ${Number.isFinite(tMidRaw) ? tMidRaw.toExponential(2) : 'infinity'}`,
        lL,
        yTop + 30,
      )
      ctx.fillStyle = p.clamped > 0 ? '#fbbf24' : '#6b7a8d'
      ctx.fillText(`clamped nodes ${p.clamped} / ${p.u.length}`, lL, yTop + 46)

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
        height={400}
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
          power-law index n = {n.toFixed(2)}{' '}
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
          tau cap = {tauMax.toFixed(2)}{' '}
          <input
            type="range"
            min={0.55}
            max={2}
            step={0.01}
            value={Math.log10(tauMax)}
            onChange={(e) => setTauMax(Math.pow(10, parseFloat(e.target.value)))}
          />
        </label>
        <label>
          nodes{' '}
          <select value={ny} onChange={(e) => setNy(parseInt(e.target.value, 10))}>
            {[11, 21, 41, 81].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={clampOn} onChange={(e) => setClampOn(e.target.checked)} />{' '}
          cap tau
        </label>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        Uncapped, the centre node reads tau ={' '}
        {Number.isFinite(tauMid) ? tauMid.toExponential(2) : 'infinity'} — the shear rate vanishes
        there, so a shear-thinning fluid asks for infinite viscosity. Green band 0.55 &lt; tau &lt;
        2 is the usable range; red on the left is the stability edge, red on the right is where
        bounce-back walls start leaking.
      </p>
    </div>
  )
}
