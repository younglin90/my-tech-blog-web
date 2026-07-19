'use client'

import { useEffect, useRef, useState } from 'react'

// D2Q9 lattice — the tangential no-slip wall demonstrated on Couette flow.
// Bottom wall: stationary bounce-back. Top wall: moving bounce-back (drags fluid).
// Toggle to free-slip (specular) to see the wall stop dragging the fluid at all.

const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6]
const CS2 = 1 / 3

type WallMode = 'bounceback' | 'freeslip'

export function CouetteBounceBackLab() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [uTop, setUTop] = useState(0.06)
  const [mode, setMode] = useState<WallMode>('bounceback')
  const [running, setRunning] = useState(true)

  // keep latest control values available to the animation loop without restarting it
  const uTopRef = useRef(uTop)
  const modeRef = useRef(mode)
  const runningRef = useRef(running)
  uTopRef.current = uTop
  modeRef.current = mode
  runningRef.current = running

  const resetRef = useRef(0)
  const [resetTick, setResetTick] = useState(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const nx = 72
    const ny = 36
    const tau = 0.8 // relaxation time (viscosity nu = cs2*(tau-0.5))

    // f[dir][x + y*nx]
    let f = new Float64Array(9 * nx * ny)
    let fpost = new Float64Array(9 * nx * ny)

    const idx = (x: number, y: number) => x + y * nx

    // init: rest fluid, rho=1
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        for (let i = 0; i < 9; i++) f[i * nx * ny + idx(x, y)] = W[i]
      }
    }

    let raf = 0

    const step = () => {
      const uw = uTopRef.current
      const wallMode = modeRef.current

      // --- collision (BGK) into fpost ---
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
          const p = idx(x, y)
          let rho = 0, ux = 0, uy = 0
          for (let i = 0; i < 9; i++) {
            const fi = f[i * nx * ny + p]
            rho += fi
            ux += fi * EX[i]
            uy += fi * EY[i]
          }
          ux /= rho
          uy /= rho
          const usq = ux * ux + uy * uy
          for (let i = 0; i < 9; i++) {
            const eu = EX[i] * ux + EY[i] * uy
            const feq = W[i] * rho * (1 + eu / CS2 + (eu * eu) / (2 * CS2 * CS2) - usq / (2 * CS2))
            const k = i * nx * ny + p
            fpost[k] = f[k] + (feq - f[k]) / tau
          }
        }
      }

      // --- streaming (pull) with periodic x; y-neighbours out of range left for wall BC ---
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
          const p = idx(x, y)
          for (let i = 0; i < 9; i++) {
            const sx = (x - EX[i] + nx) % nx
            const sy = y - EY[i]
            if (sy < 0 || sy > ny - 1) continue // filled by boundary rule below
            f[i * nx * ny + p] = fpost[i * nx * ny + idx(sx, sy)]
          }
        }
      }

      // --- wall boundary conditions ---
      for (let x = 0; x < nx; x++) {
        // local density for the momentum term
        const rhoBot = localRho(fpost, nx, ny, x, 0)
        const rhoTop = localRho(fpost, nx, ny, x, ny - 1)

        if (wallMode === 'bounceback') {
          // bottom (stationary): reflect straight back
          setF(f, nx, ny, x, 0, 2, getPost(fpost, nx, ny, x, 0, 4))
          setF(f, nx, ny, x, 0, 5, getPost(fpost, nx, ny, x, 0, 7))
          setF(f, nx, ny, x, 0, 6, getPost(fpost, nx, ny, x, 0, 8))
          // top (moving with uw in +x): reflect + momentum correction
          setF(f, nx, ny, x, ny - 1, 4, getPost(fpost, nx, ny, x, ny - 1, 2))
          setF(f, nx, ny, x, ny - 1, 7, getPost(fpost, nx, ny, x, ny - 1, 5) - 2 * W[5] * rhoTop * (EX[5] * uw) / CS2)
          setF(f, nx, ny, x, ny - 1, 8, getPost(fpost, nx, ny, x, ny - 1, 6) - 2 * W[6] * rhoTop * (EX[6] * uw) / CS2)
        } else {
          // free-slip (specular): flip only the normal component -> no tangential drag
          setF(f, nx, ny, x, 0, 2, getPost(fpost, nx, ny, x, 0, 4))
          setF(f, nx, ny, x, 0, 5, getPost(fpost, nx, ny, x, 0, 8))
          setF(f, nx, ny, x, 0, 6, getPost(fpost, nx, ny, x, 0, 7))
          setF(f, nx, ny, x, ny - 1, 4, getPost(fpost, nx, ny, x, ny - 1, 2))
          setF(f, nx, ny, x, ny - 1, 7, getPost(fpost, nx, ny, x, ny - 1, 6))
          setF(f, nx, ny, x, ny - 1, 8, getPost(fpost, nx, ny, x, ny - 1, 5))
        }
        void rhoBot
      }
    }

    function draw() {
      const uw = uTopRef.current
      const Wd = c!.width, Hd = c!.height
      ctx!.fillStyle = 'rgba(8,17,31,0.96)'
      ctx!.fillRect(0, 0, Wd, Hd)

      const PAD = 30
      const fieldW = Wd - PAD * 2 - 150
      const fieldH = Hd - PAD * 2
      const cw = fieldW / nx
      const ch = fieldH / ny

      // velocity field coloured by ux
      const scale = Math.max(uw, 0.02)
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
          const p = idx(x, y)
          let rho = 0, ux = 0
          for (let i = 0; i < 9; i++) {
            const fi = f[i * nx * ny + p]
            rho += fi
            ux += fi * EX[i]
          }
          ux /= rho
          const t = Math.max(0, Math.min(1, ux / scale))
          const r = Math.round(30 + t * 210)
          const g = Math.round(60 + t * 90)
          const b = Math.round(200 - t * 150)
          ctx!.fillStyle = `rgb(${r},${g},${b})`
          // y=0 at bottom -> draw flipped so bottom wall is at canvas bottom
          const px = PAD + x * cw
          const py = PAD + (ny - 1 - y) * ch
          ctx!.fillRect(px, py, Math.ceil(cw), Math.ceil(ch))
        }
      }

      // wall labels
      ctx!.font = '11px ui-monospace, monospace'
      ctx!.fillStyle = '#fbbf24'
      ctx!.fillText(`moving wall  U=${uw.toFixed(3)} →`, PAD + 4, PAD - 10)
      ctx!.fillStyle = '#94a3b8'
      ctx!.fillText('stationary wall', PAD + 4, PAD + fieldH + 18)

      // profile panel on the right: ux(y) at mid-channel vs exact linear
      const plotX = PAD + fieldW + 40
      const plotW = 100
      const plotH = fieldH
      ctx!.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx!.lineWidth = 1
      ctx!.strokeRect(plotX, PAD, plotW, plotH)

      const mx = Math.floor(nx / 2)
      // exact halfway-bounce-back Couette: ux(j) = U*(j+0.5)/ny
      ctx!.strokeStyle = 'rgba(251,191,36,0.7)'
      ctx!.setLineDash([4, 3])
      ctx!.beginPath()
      for (let y = 0; y < ny; y++) {
        const exact = uw * (y + 0.5) / ny
        const t = Math.max(0, Math.min(1, exact / scale))
        const px = plotX + t * plotW
        const py = PAD + (ny - 1 - y) * ch + ch / 2
        if (y === 0) ctx!.moveTo(px, py); else ctx!.lineTo(px, py)
      }
      ctx!.stroke()
      ctx!.setLineDash([])

      // measured
      let err = 0, cnt = 0
      ctx!.strokeStyle = '#22d3ee'
      ctx!.lineWidth = 2
      ctx!.beginPath()
      for (let y = 0; y < ny; y++) {
        const p = idx(mx, y)
        let rho = 0, ux = 0
        for (let i = 0; i < 9; i++) { const fi = f[i * nx * ny + p]; rho += fi; ux += fi * EX[i] }
        ux /= rho
        const exact = uw * (y + 0.5) / ny
        err += (ux - exact) * (ux - exact); cnt++
        const t = Math.max(0, Math.min(1, ux / scale))
        const px = plotX + t * plotW
        const py = PAD + (ny - 1 - y) * ch + ch / 2
        if (y === 0) ctx!.moveTo(px, py); else ctx!.lineTo(px, py)
      }
      ctx!.stroke()

      ctx!.font = '10px ui-monospace, monospace'
      ctx!.fillStyle = '#cbd5e1'
      ctx!.fillText('u(y)', plotX + 4, PAD - 10)
      ctx!.fillStyle = '#22d3ee'
      ctx!.fillText('measured', plotX, PAD + plotH + 16)
      ctx!.fillStyle = '#fbbf24'
      ctx!.fillText('exact', plotX + 62, PAD + plotH + 16)
      const rms = Math.sqrt(err / cnt)
      ctx!.fillStyle = rms < 1e-3 ? '#4ade80' : '#f87171'
      ctx!.fillText(`RMS=${rms.toExponential(1)}`, plotX, PAD + plotH + 30)
    }

    const loop = () => {
      if (runningRef.current) {
        for (let s = 0; s < 6; s++) step()
      }
      draw()
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTick])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={640}
        height={280}
        style={{ width: '100%', maxWidth: 640, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center', marginTop: '0.7rem', fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Wall speed U
          <input type="range" min={0} max={0.12} step={0.005} value={uTop} onChange={(e) => setUTop(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }}>{uTop.toFixed(3)}</span>
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['bounceback', 'freeslip'] as WallMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                border: '1px solid rgba(148,163,184,0.35)',
                background: mode === m ? '#22d3ee' : 'transparent',
                color: mode === m ? '#08111f' : '#cbd5e1',
                fontWeight: mode === m ? 700 : 400,
              }}
            >
              {m === 'bounceback' ? 'bounce-back (no-slip)' : 'free-slip'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, border: '1px solid rgba(148,163,184,0.35)', background: 'transparent', color: '#cbd5e1' }}
        >
          {running ? 'pause' : 'run'}
        </button>
        <button
          onClick={() => { resetRef.current++; setResetTick((t) => t + 1) }}
          style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, border: '1px solid rgba(148,163,184,0.35)', background: 'transparent', color: '#cbd5e1' }}
        >
          reset
        </button>
      </div>
    </div>
  )
}

function localRho(arr: Float64Array, nx: number, ny: number, x: number, y: number) {
  const p = x + y * nx
  let rho = 0
  for (let i = 0; i < 9; i++) rho += arr[i * nx * ny + p]
  return rho
}
function getPost(arr: Float64Array, nx: number, ny: number, x: number, y: number, i: number) {
  return arr[i * nx * ny + (x + y * nx)]
}
function setF(arr: Float64Array, nx: number, ny: number, x: number, y: number, i: number, val: number) {
  arr[i * nx * ny + (x + y * nx)] = val
}
