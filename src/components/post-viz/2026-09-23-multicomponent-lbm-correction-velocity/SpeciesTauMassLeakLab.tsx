'use client'

import { useEffect, useRef, useState } from 'react'

const CS2 = 1 / 3
const N = 160
const W3 = [2 / 3, 1 / 6, 1 / 6] // D1Q3 weights for c = 0, +1, -1
const C3 = [0, 1, -1]
const COL = ['#38bdf8', '#fb923c', '#a78bfa']
const NAME = ['A', 'B', 'C']

type Pops = Float64Array[][] // [species][direction] -> node array

function initialComposition(): Float64Array[] {
  const a = new Float64Array(N)
  const b = new Float64Array(N)
  const c = new Float64Array(N)
  for (let x = 0; x < N; x++) {
    a[x] = 0.3 + 0.2 * Math.sin((2 * Math.PI * x) / N)
    b[x] = 0.45 + 0.15 * Math.cos((4 * Math.PI * x) / N)
    c[x] = 1 - a[x] - b[x]
  }
  return [a, b, c]
}

function seedPops(): Pops {
  const rho = initialComposition()
  const h: Pops = []
  for (let k = 0; k < 3; k++) {
    const dirs: Float64Array[] = []
    for (let i = 0; i < 3; i++) {
      const arr = new Float64Array(N)
      for (let x = 0; x < N; x++) arr[x] = rho[k][x] * W3[i] // u = 0 at t = 0
      dirs.push(arr)
    }
    h.push(dirs)
  }
  return h
}

/** one collide-and-stream sweep of the three species populations */
function sweepSpecies(h: Pops, D: number[], correct: boolean) {
  const rho: Float64Array[] = []
  for (let k = 0; k < 3; k++) {
    const r = new Float64Array(N)
    for (let x = 0; x < N; x++) r[x] = h[k][0][x] + h[k][1][x] + h[k][2][x]
    rho.push(r)
  }

  // correction velocity V_c = sum_k D_k * grad Y_k  (rho = 1 here, so Y_k = rho_k)
  const u = new Float64Array(N)
  if (correct) {
    for (let x = 0; x < N; x++) {
      const xp = (x + 1) % N
      const xm = (x - 1 + N) % N
      let s = 0
      for (let k = 0; k < 3; k++) s += D[k] * (rho[k][xp] - rho[k][xm]) * 0.5
      u[x] = s
    }
  }

  const buf = new Float64Array(N)
  for (let k = 0; k < 3; k++) {
    const tau = D[k] / CS2 + 0.5
    for (let i = 0; i < 3; i++) {
      const f = h[k][i]
      for (let x = 0; x < N; x++) {
        const eq = rho[k][x] * W3[i] * (1 + (C3[i] * u[x]) / CS2)
        f[x] += (eq - f[x]) / tau
      }
      // stream by c_i
      if (C3[i] !== 0) {
        for (let x = 0; x < N; x++) buf[x] = f[(x - C3[i] + N) % N]
        f.set(buf)
      }
    }
  }
  return rho
}

export function SpeciesTauMassLeakLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dA, setDA] = useState(0.005)
  const [dB, setDB] = useState(0.1)
  const [dC, setDC] = useState(0.5)
  const [correct, setCorrect] = useState(false)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [readout, setReadout] = useState({ step: 0, now: 0, peak: 0 })

  const dRef = useRef([dA, dB, dC])
  const corrRef = useRef(correct)
  const runRef = useRef(running)
  dRef.current = [dA, dB, dC]
  corrRef.current = correct
  runRef.current = running

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let h = seedPops()
    let step = 0
    let peak = 0
    let frame = 0
    let raf = 0

    const draw = () => {
      if (runRef.current) {
        for (let s = 0; s < 3; s++) {
          sweepSpecies(h, dRef.current, corrRef.current)
          step++
        }
      }

      const rho: Float64Array[] = []
      for (let k = 0; k < 3; k++) {
        const r = new Float64Array(N)
        for (let x = 0; x < N; x++) r[x] = h[k][0][x] + h[k][1][x] + h[k][2][x]
        rho.push(r)
      }
      const err = new Float64Array(N)
      let now = 0
      for (let x = 0; x < N; x++) {
        err[x] = rho[0][x] + rho[1][x] + rho[2][x] - 1
        if (Math.abs(err[x]) > now) now = Math.abs(err[x])
      }
      if (now > peak) peak = now

      const Wc = canvas.width
      const Hc = canvas.height
      ctx.clearRect(0, 0, Wc, Hc)
      ctx.fillStyle = '#0c1118'
      ctx.fillRect(0, 0, Wc, Hc)
      ctx.font = '12px ui-monospace, monospace'

      const L = 64
      const R = Wc - 150
      const xOf = (x: number) => L + (x / (N - 1)) * (R - L)

      // ---- panel A: mass fractions ------------------------------------
      const aT = 30
      const aB = 208
      const yOfY = (v: number) => aB - (v / 0.75) * (aB - aT)
      ctx.strokeStyle = '#1d2733'
      ctx.lineWidth = 1
      ctx.fillStyle = '#6d7b8d'
      for (const g of [0, 0.25, 0.5, 0.75]) {
        ctx.beginPath()
        ctx.moveTo(L, yOfY(g))
        ctx.lineTo(R, yOfY(g))
        ctx.stroke()
        ctx.fillText(g.toFixed(2), 22, yOfY(g) + 4)
      }
      ctx.fillStyle = '#9fb0c4'
      ctx.fillText('mass fraction  Y_k(x)', L, 20)
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = COL[k]
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let x = 0; x < N; x++) {
          const px = xOf(x)
          const py = yOfY(Math.max(-0.05, Math.min(0.8, rho[k][x])))
          if (x === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      // legend
      const tau = dRef.current.map((d) => d / CS2 + 0.5)
      for (let k = 0; k < 3; k++) {
        const ly = 44 + k * 22
        ctx.fillStyle = COL[k]
        ctx.fillRect(R + 18, ly - 8, 14, 4)
        ctx.fillStyle = '#c3d0de'
        ctx.fillText(
          `${NAME[k]}  D=${dRef.current[k].toFixed(3)}`,
          R + 38,
          ly - 2,
        )
        ctx.fillStyle = '#7d8b9c'
        ctx.fillText(`   tau=${tau[k].toFixed(3)}`, R + 38, ly + 12)
      }

      // ---- panel B: closure error -------------------------------------
      const bT = 254
      const bB = 372
      const mid = (bT + bB) / 2
      const scale = Math.max(2e-4, now * 1.25)
      const yOfE = (v: number) => mid - (v / scale) * ((bB - bT) / 2)
      ctx.strokeStyle = '#2b3745'
      ctx.beginPath()
      ctx.moveTo(L, mid)
      ctx.lineTo(R, mid)
      ctx.stroke()
      ctx.fillStyle = '#9fb0c4'
      ctx.fillText('closure error   sum_k Y_k(x) - 1', L, bT - 12)
      ctx.fillStyle = '#6d7b8d'
      ctx.fillText(`+${scale.toExponential(1)}`, 8, bT + 10)
      ctx.fillText(`-${scale.toExponential(1)}`, 8, bB + 2)
      ctx.strokeStyle = correctColour(corrRef.current)
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x < N; x++) {
        const px = xOf(x)
        const py = yOfE(Math.max(-scale, Math.min(scale, err[x])))
        if (x === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      ctx.fillStyle = corrRef.current ? '#4ade80' : '#f43f5e'
      ctx.fillText(
        corrRef.current ? 'correction velocity ON' : 'correction velocity OFF',
        R + 18,
        bT + 8,
      )
      ctx.fillStyle = '#c3d0de'
      ctx.fillText(`peak |err|`, R + 18, bT + 30)
      ctx.fillText(peak.toExponential(2), R + 18, bT + 46)
      ctx.fillStyle = '#7d8b9c'
      ctx.fillText(`step ${step}`, R + 18, bT + 68)

      ctx.fillStyle = '#4b5665'
      ctx.fillText('x  (periodic, 160 nodes)', L, Hc - 8)

      frame++
      if (frame % 12 === 0) setReadout({ step, now, peak })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [resetKey])

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
        {([
          ['D_A', dA, setDA],
          ['D_B', dB, setDB],
          ['D_C', dC, setDC],
        ] as [string, number, (v: number) => void][]).map(([label, val, set]) => (
          <label key={label}>
            {label} = {val.toFixed(3)}{' '}
            <input
              type="range"
              min={Math.log10(0.005)}
              max={Math.log10(0.5)}
              step={0.01}
              value={Math.log10(val)}
              onChange={(e) => set(Math.pow(10, parseFloat(e.target.value)))}
            />
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={correct}
            onChange={(e) => setCorrect(e.target.checked)}
          />{' '}
          correction velocity
        </label>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
        <button onClick={() => setResetKey((k) => k + 1)}>reset</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        step {readout.step} — current |sum Y_k - 1| = {readout.now.toExponential(2)}, peak ={' '}
        {readout.peak.toExponential(2)}. Drag the three sliders to the same value and the lower
        panel flattens to round-off. Spread them apart and the error grows every step: each species
        relaxes with its own tau, so the three Fickian fluxes no longer cancel. Tick the checkbox to
        inject the correction velocity and the growth stops on the spot.
      </p>
    </div>
  )
}

function correctColour(on: boolean) {
  return on ? '#4ade80' : '#f43f5e'
}
