'use client'

import { useEffect, useRef, useState } from 'react'

const N = 48
const NN = N * N
const H = (2 * Math.PI) / N
const GRID_W = 3
const TEST_W = 5
const DELTA = GRID_W * H
const DELTA_T = Math.sqrt((GRID_W * H) ** 2 + (TEST_W * H) ** 2)

type Mode = { kx: number; ky: number; a: number; ph: number; w: number }

function buildModes(count: number): Mode[] {
  const out: Mode[] = []
  let seed = 9161
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  for (let i = 0; i < count; i++) {
    const kx = Math.round(rnd() * 10) - 5
    const ky = Math.round(rnd() * 10) - 5
    const km = Math.hypot(kx, ky)
    if (km < 1) continue
    out.push({ kx, ky, a: Math.pow(km, -11 / 6), ph: rnd() * 2 * Math.PI, w: 0.2 * km })
  }
  return out
}

/** u = dpsi/dy, v = -dpsi/dx : divergence free by construction */
function velocity(modes: Mode[], t: number): [Float64Array, Float64Array] {
  const u = new Float64Array(NN)
  const v = new Float64Array(NN)
  for (const m of modes) {
    for (let j = 0; j < N; j++) {
      const ky = m.ky * j * H
      for (let i = 0; i < N; i++) {
        const s = Math.sin(m.kx * i * H + ky - m.w * t + m.ph)
        const n = j * N + i
        u[n] += m.a * m.ky * s
        v[n] -= m.a * m.kx * s
      }
    }
  }
  let e = 0
  for (let n = 0; n < NN; n++) e += u[n] * u[n] + v[n] * v[n]
  const rms = Math.sqrt(e / NN) || 1
  for (let n = 0; n < NN; n++) {
    u[n] /= rms
    v[n] /= rms
  }
  return [u, v]
}

function boxFilter(f: Float64Array, w: number): Float64Array {
  const r = (w - 1) / 2
  const tmp = new Float64Array(NN)
  const out = new Float64Array(NN)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      let s = 0
      for (let o = -r; o <= r; o++) s += f[j * N + ((i + o + 4 * N) % N)]
      tmp[j * N + i] = s / w
    }
  }
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      let s = 0
      for (let o = -r; o <= r; o++) s += tmp[((j + o + 4 * N) % N) * N + i]
      out[j * N + i] = s / w
    }
  }
  return out
}

function dX(f: Float64Array): Float64Array {
  const out = new Float64Array(NN)
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++)
      out[j * N + i] = (f[j * N + ((i + 1) % N)] - f[j * N + ((i - 1 + N) % N)]) / (2 * H)
  return out
}

function dY(f: Float64Array): Float64Array {
  const out = new Float64Array(NN)
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++)
      out[j * N + i] = (f[((j + 1) % N) * N + i] - f[((j - 1 + N) % N) * N + i]) / (2 * H)
  return out
}

function strain(u: Float64Array, v: Float64Array) {
  const ux = dX(u)
  const uy = dY(u)
  const vx = dX(v)
  const vy = dY(v)
  const s12 = new Float64Array(NN)
  const mag = new Float64Array(NN)
  for (let n = 0; n < NN; n++) {
    s12[n] = 0.5 * (uy[n] + vx[n])
    mag[n] = Math.sqrt(2 * (ux[n] * ux[n] + vy[n] * vy[n] + 2 * s12[n] * s12[n]))
  }
  return { s11: ux, s22: vy, s12, mag }
}

function mul(a: Float64Array, b: Float64Array): Float64Array {
  const out = new Float64Array(NN)
  for (let n = 0; n < NN; n++) out[n] = a[n] * b[n]
  return out
}

function colorOf(c: number, scale: number): string {
  const x = Math.max(-1, Math.min(1, c / scale))
  if (x >= 0) {
    const g = Math.round(40 + 190 * (1 - x))
    return `rgb(${Math.round(60 + 195 * x)},${g},${Math.round(50 + 40 * (1 - x))})`
  }
  const a = -x
  return `rgb(${Math.round(40 + 30 * (1 - a))},${Math.round(90 + 90 * (1 - a))},${Math.round(120 + 135 * a)})`
}

export function DynamicCoefficientAveragingMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [avgIdx, setAvgIdx] = useState(0)
  const [nModes, setNModes] = useState(18)
  const [clip, setClip] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [readout, setReadout] = useState({ neg: 0, cmin: 0, cmax: 0, unstable: 0, cglob: 0 })

  const windows = [1, 3, 5, 9, 15, 25, 47]
  const stateRef = useRef({ avgIdx, nModes, clip, playing })
  stateRef.current = { avgIdx, nModes, clip, playing }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let t = 0
    let last = performance.now()
    let modes = buildModes(stateRef.current.nModes)
    let cachedModes = stateRef.current.nModes

    const MAP = 340
    const OX = 14
    const OY = 30

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const st = stateRef.current
      if (st.playing) t += dt
      if (st.nModes !== cachedModes) {
        modes = buildModes(st.nModes)
        cachedModes = st.nModes
      }

      const [u, v] = velocity(modes, t)
      const ub = boxFilter(u, GRID_W)
      const vb = boxFilter(v, GRID_W)
      const S = strain(ub, vb)
      const ut = boxFilter(ub, TEST_W)
      const vt = boxFilter(vb, TEST_W)
      const St = strain(ut, vt)

      const uu = boxFilter(mul(ub, ub), TEST_W)
      const uv = boxFilter(mul(ub, vb), TEST_W)
      const vv = boxFilter(mul(vb, vb), TEST_W)
      const mS11 = boxFilter(mul(S.mag, S.s11), TEST_W)
      const mS12 = boxFilter(mul(S.mag, S.s12), TEST_W)
      const mS22 = boxFilter(mul(S.mag, S.s22), TEST_W)

      const LM = new Float64Array(NN)
      const MM = new Float64Array(NN)
      const d2 = DELTA * DELTA
      const dt2 = DELTA_T * DELTA_T
      for (let n = 0; n < NN; n++) {
        let l11 = uu[n] - ut[n] * ut[n]
        let l22 = vv[n] - vt[n] * vt[n]
        const l12 = uv[n] - ut[n] * vt[n]
        const tr = 0.5 * (l11 + l22)
        l11 -= tr
        l22 -= tr
        const m11 = 2 * (d2 * mS11[n] - dt2 * St.mag[n] * St.s11[n])
        const m12 = 2 * (d2 * mS12[n] - dt2 * St.mag[n] * St.s12[n])
        const m22 = 2 * (d2 * mS22[n] - dt2 * St.mag[n] * St.s22[n])
        LM[n] = l11 * m11 + 2 * l12 * m12 + l22 * m22
        MM[n] = m11 * m11 + 2 * m12 * m12 + m22 * m22
      }

      const w = windows[st.avgIdx]
      const lmA = w > 1 ? boxFilter(LM, Math.min(w, N - 1)) : LM
      const mmA = w > 1 ? boxFilter(MM, Math.min(w, N - 1)) : MM

      let sumLM = 0
      let sumMM = 0
      let sumMag = 0
      for (let n = 0; n < NN; n++) {
        sumLM += LM[n]
        sumMM += MM[n]
        sumMag += S.mag[n]
      }
      const cGlob = sumLM / (sumMM || 1)
      const nuMol = 4 * Math.abs(cGlob) * d2 * (sumMag / NN)

      const C = new Float64Array(NN)
      for (let n = 0; n < NN; n++) {
        let c = lmA[n] / (mmA[n] || 1e-30)
        if (st.clip) c = Math.max(c, -nuMol / (d2 * (S.mag[n] || 1e-9)))
        C[n] = c
      }

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, 560, 400)
      const cell = MAP / N
      const scale = Math.max(1e-6, 6 * Math.abs(cGlob))
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          ctx.fillStyle = colorOf(C[j * N + i], scale)
          ctx.fillRect(OX + i * cell, OY + j * cell, cell + 0.7, cell + 0.7)
        }
      }
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.strokeRect(OX, OY, MAP, MAP)

      // averaging window footprint
      const wp = (Math.min(w, N) * cell) / 2
      ctx.strokeStyle = '#ffffff'
      ctx.setLineDash([4, 3])
      ctx.strokeRect(OX + MAP / 2 - wp, OY + MAP / 2 - wp, 2 * wp, 2 * wp)
      ctx.setLineDash([])

      // colorbar
      const CBX = OX + MAP + 26
      for (let p = 0; p < 200; p++) {
        const c = scale * (1 - (2 * p) / 199)
        ctx.fillStyle = colorOf(c, scale)
        ctx.fillRect(CBX, OY + p * (MAP / 200), 18, MAP / 200 + 0.6)
      }
      ctx.strokeStyle = '#30363d'
      ctx.strokeRect(CBX, OY, 18, MAP)

      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = '#c9d1d9'
      ctx.fillText('local  C = Cs²  (⟨L:M⟩ / ⟨M:M⟩)', OX, 18)
      ctx.fillStyle = '#e06c4f'
      ctx.fillText('+' + scale.toFixed(3), CBX + 24, OY + 10)
      ctx.fillStyle = '#8b949e'
      ctx.fillText('0', CBX + 24, OY + MAP / 2 + 4)
      ctx.fillStyle = '#5b9bd5'
      ctx.fillText('−' + scale.toFixed(3), CBX + 24, OY + MAP - 2)
      ctx.fillStyle = '#6e7681'
      ctx.fillText('drain', CBX + 24, OY + 24)
      ctx.fillText('backscatter', CBX + 24, OY + MAP - 16)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('avg window ' + w + '×' + w, OX + 6, OY + MAP - 8)

      frame++
      if (frame % 10 === 0) {
        let neg = 0
        let bad = 0
        let cmin = Infinity
        let cmax = -Infinity
        for (let n = 0; n < NN; n++) {
          if (C[n] < 0) neg++
          if (nuMol + C[n] * d2 * S.mag[n] < 0) bad++
          if (C[n] < cmin) cmin = C[n]
          if (C[n] > cmax) cmax = C[n]
        }
        setReadout({
          neg: (100 * neg) / NN,
          cmin,
          cmax,
          unstable: (100 * bad) / NN,
          cglob: cGlob,
        })
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={400}
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 200 }}>
          <span>
            averaging window : <b>{windows[avgIdx]}×{windows[avgIdx]}</b>
          </span>
          <input
            type="range"
            min={0}
            max={windows.length - 1}
            step={1}
            value={avgIdx}
            onChange={(e) => setAvgIdx(parseInt(e.target.value, 10))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190 }}>
          <span>
            number of modes : <b>{nModes}</b>
          </span>
          <input
            type="range"
            min={6}
            max={30}
            step={1}
            value={nModes}
            onChange={(e) => setNModes(parseInt(e.target.value, 10))}
          />
        </label>
        <button
          onClick={() => setClip((c) => !c)}
          style={{
            padding: '0.35rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: clip ? '#238636' : '#21262d',
            color: '#c9d1d9',
            cursor: 'pointer',
          }}
        >
          {clip ? 'clipping ON' : 'clipping OFF'}
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
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
        C &lt; 0 : <b style={{ color: '#5b9bd5' }}>{readout.neg.toFixed(1)} %</b> &nbsp;|&nbsp; ν + ν
        <sub>T</sub> &lt; 0 : <b style={{ color: '#e06c4f' }}>{readout.unstable.toFixed(1)} %</b>{' '}
        &nbsp;|&nbsp; C range {readout.cmin.toFixed(4)} … {readout.cmax.toFixed(4)} &nbsp;|&nbsp;
        global C = {readout.cglob.toFixed(5)}
      </div>
    </div>
  )
}
