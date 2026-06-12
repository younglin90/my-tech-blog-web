'use client'
import { useEffect, useRef, useState } from 'react'

const N = 100
const dx = 1 / N
const dt = 0.45 * dx
const a = 1 // 이류 속도

function minmod(p: number, q: number): number {
  if (p * q <= 0) return 0
  return Math.abs(p) < Math.abs(q) ? p : q
}

// top-hat 초기조건
function topHat(x: number): number {
  return x > 0.35 && x < 0.65 ? 1 : 0
}

// 셀 경계(i+1/2)에서 좌측 재구성값. a>0 이므로 이 값이 upwind flux.
function reconMinmod(u: number[]): number[] {
  const vR = new Array(N)
  for (let i = 0; i < N; i++) {
    const um = u[(i - 1 + N) % N]
    const up = u[(i + 1) % N]
    vR[i] = u[i] + 0.5 * minmod(u[i] - um, up - u[i])
  }
  return vR
}

// THINC 양 경계값 (식 2.19, X=±0.5). 비단조면 null.
function thincEdges(um: number, uc: number, up: number, beta: number): [number, number] | null {
  const fa = 0.5 * (up + um)
  const fd = 0.5 * (up - um)
  if (Math.abs(fd) < 1e-12) return null
  if ((up - uc) * (uc - um) <= 0) return null
  const alpha = (uc - fa) / fd
  if (Math.abs(alpha) >= 1) return null
  const T1 = Math.tanh(beta / 2)
  const T2 = Math.tanh((alpha * beta) / 2)
  const d = (1 / (2 * beta)) * Math.log((1 - T2 / T1) / (1 + T2 / T1))
  const vL = fa + fd * Math.tanh(beta * (-0.5 - d))
  const vR = fa + fd * Math.tanh(beta * (0.5 - d))
  return [vL, vR]
}

// BVD: 셀별로 minmod / THINC 중 경계변동(TBV)이 작은 쪽 선택 (Deng et al. THINC-BVD 단순화)
function reconBVD(u: number[], beta: number): number[] {
  const pL = new Array(N)
  const pR = new Array(N)
  const tEdge: ([number, number] | null)[] = new Array(N)
  for (let i = 0; i < N; i++) {
    const um = u[(i - 1 + N) % N]
    const up = u[(i + 1) % N]
    const s = minmod(u[i] - um, up - u[i])
    pL[i] = u[i] - 0.5 * s
    pR[i] = u[i] + 0.5 * s
    tEdge[i] = thincEdges(um, u[i], up, beta)
  }
  const vR = new Array(N)
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N
    const ip = (i + 1) % N
    const polyTBV = Math.abs(pR[im] - pL[i]) + Math.abs(pR[i] - pL[ip])
    if (tEdge[i]) {
      const [tL, tR] = tEdge[i]!
      const thincTBV = Math.abs(pR[im] - tL) + Math.abs(tR - pL[ip])
      vR[i] = thincTBV < polyTBV ? tR : pR[i]
    } else {
      vR[i] = pR[i]
    }
  }
  return vR
}

function L(u: number[], beta: number, useBVD: boolean): number[] {
  const vR = useBVD ? reconBVD(u, beta) : reconMinmod(u)
  const out = new Array(N)
  for (let i = 0; i < N; i++) {
    const Fr = a * vR[i]
    const Fl = a * vR[(i - 1 + N) % N]
    out[i] = -(Fr - Fl) / dx
  }
  return out
}

// SSP-RK2 한 스텝
function step(u: number[], beta: number, useBVD: boolean): number[] {
  const k1 = L(u, beta, useBVD)
  const u1 = u.map((v, i) => v + dt * k1[i])
  const k2 = L(u1, beta, useBVD)
  return u.map((v, i) => 0.5 * v + 0.5 * (u1[i] + dt * k2[i]))
}

export function ContactAdvectionDecay() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [beta, setBeta] = useState(1.8)
  const [running, setRunning] = useState(true)
  const [revs, setRevs] = useState(0)
  const stateRef = useRef<{ uM: number[]; uB: number[]; t: number }>({
    uM: [],
    uB: [],
    t: 0,
  })
  const betaRef = useRef(beta)
  betaRef.current = beta

  const reset = () => {
    const u0 = Array.from({ length: N }, (_, i) => topHat((i + 0.5) * dx))
    stateRef.current = { uM: [...u0], uB: [...u0], t: 0 }
    setRevs(0)
  }

  useEffect(() => {
    if (stateRef.current.uM.length === 0) reset()
  }, [])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const Wd = 580
    const Hd = 280
    c.width = Wd * dpr
    c.height = Hd * dpr
    c.style.width = Wd + 'px'
    c.style.height = Hd + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const padL = 30
    const padR = 12
    const padT = 14
    const padB = 40
    const x2px = (x: number) => padL + x * (Wd - padL - padR)
    const f2py = (f: number) => Hd - padB - ((f + 0.2) / 1.5) * (Hd - padT - padB)

    let raf = 0
    const draw = () => {
      const st = stateRef.current
      if (running) {
        for (let s = 0; s < 4; s++) {
          st.uM = step(st.uM, betaRef.current, false)
          st.uB = step(st.uB, betaRef.current, true)
          st.t += dt
        }
        setRevs(st.t)
      }
      ctx.clearRect(0, 0, Wd, Hd)
      ctx.fillStyle = '#0b1422'
      ctx.fillRect(0, 0, Wd, Hd)

      // 정확해 (이동한 top-hat) — 회색
      const shift = st.t % 1
      ctx.strokeStyle = 'rgba(160,176,200,0.4)'
      ctx.lineWidth = 1.3
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const x = i * dx
        const xs = (x - shift + 1) % 1
        const y = f2py(topHat(xs))
        if (i === 0) ctx.moveTo(x2px(x), y)
        else ctx.lineTo(x2px(x), y)
      }
      ctx.stroke()

      const plot = (u: number[], color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const x = (i + 0.5) * dx
          const y = f2py(u[i])
          if (i === 0) ctx.moveTo(x2px(x), y)
          else ctx.lineTo(x2px(x), y)
        }
        ctx.stroke()
      }
      plot(st.uM, '#f87171') // minmod TVD
      plot(st.uB, '#22d3ee') // THINC-BVD

      // 범례
      ctx.font = '11.5px ui-sans-serif, system-ui'
      ctx.fillStyle = 'rgba(160,176,200,0.7)'
      ctx.fillText('— exact', padL, Hd - 22)
      ctx.fillStyle = '#f87171'
      ctx.fillText('— minmod TVD', padL + 70, Hd - 22)
      ctx.fillStyle = '#22d3ee'
      ctx.fillText('— THINC-BVD', padL + 180, Hd - 22)
      ctx.fillStyle = 'rgba(160,176,200,0.8)'
      ctx.fillText(`revolutions: ${st.t.toFixed(2)}`, padL + 300, Hd - 22)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [running])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
        margin: '1.4rem 0',
      }}
    >
      <canvas ref={ref} style={{ width: '100%', maxWidth: 580, display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, alignItems: 'center' }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            fontSize: 12.5,
            background: 'var(--accent)',
            color: '#08111f',
            fontWeight: 600,
          }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            fontSize: 12.5,
            background: 'transparent',
            color: 'var(--text-muted)',
          }}
        >
          Reset
        </button>
        <label style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          β = {beta.toFixed(2)}
          <input
            type="range"
            min={1.1}
            max={2.2}
            step={0.05}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            style={{ width: 120 }}
          />
        </label>
      </div>
    </div>
  )
}
