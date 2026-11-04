'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 500
const GREY = 'rgba(140,140,140,0.95)'
const JET = '#38bdf8'
const SLOW = '#f97316'
const NUM = '#22c55e'
const BERN = '#a78bfa'
const N = 80
const TOL = 1e-3

type Read = { x: number; dp: number; dpMom: number; dpBern: number; loss: number; carnot: number; x99: number | null; V2: number; done: boolean; stall: boolean; steps: number }

// same as the Python mixing_duct(): von Mises march, N stream tubes of equal flux dψ,
// u_new = u + dx (ν ∂²(u²/2)/∂ψ² − P/u), P = dp/dx fixed by Σ dψ/u = H (Newton)
export function StreamTubeMixingDuctRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [sigma, setSigma] = useState(0.5)
  const [eps, setEps] = useState(0.2)
  const [nu, setNu] = useState(0.004)
  const [spf, setSpf] = useState(20)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<Read>({ x: 0, dp: 0, dpMom: 0, dpBern: 0, loss: 0, carnot: 0, x99: null, V2: 0, done: false, stall: false, steps: 0 })
  const playRef = useRef(playing), spfRef = useRef(spf)
  playRef.current = playing; spfRef.current = spf
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    // ---- stream_tubes()
    const Q = sigma + eps * (1 - sigma)
    const dpsi = Q / N
    const nJet = Math.round((N * sigma) / Q)
    let u = new Float64Array(N)
    const jet: boolean[] = []
    for (let k = 0; k < N; k++) { jet.push(Math.abs(k - (N - 1) / 2) < nJet / 2); u[k] = jet[k] ? 1 : eps }
    const u0 = u.slice()
    let Hd = 0, M = 0, E0 = 0
    for (let k = 0; k < N; k++) { Hd += dpsi / u[k]; M += u[k] * dpsi; E0 += 0.5 * u[k] * u[k] * dpsi }
    const Qt = N * dpsi
    const V2 = Qt / Hd
    const dpMom = M / Hd - V2 * V2
    E0 /= Qt
    const dpBern = 0.5 * (1 - V2 * V2)
    let carnot = 0
    for (let k = 0; k < N; k++) carnot += 0.5 * (u0[k] - V2) ** 2 * dpsi
    carnot /= Qt
    const xMax = 0.13 / nu

    let x = 0, p = 0, P = 0, x99: number | null = null, done = false, stall = false, steps = 0, frame = 0
    const px: number[] = [0], pp: number[] = [0]
    const tubes: { x: number; yb: Float64Array }[] = []
    const Dq = new Float64Array(N), un = new Float64Array(N)

    const ybounds = () => {
      const yb = new Float64Array(N + 1)
      for (let k = 0; k < N; k++) yb[k + 1] = yb[k] + dpsi / u[k]
      return yb
    }
    tubes.push({ x: 0, yb: ybounds() })

    const step = () => {
      if (done || stall) return
      let umax = 0, err = 0
      for (let k = 0; k < N; k++) umax = Math.max(umax, u[k])
      const dx = (0.4 * dpsi * dpsi) / (nu * umax)
      for (let k = 0; k < N; k++) {
        const qm = 0.5 * u[Math.max(k - 1, 0)] ** 2, q0 = 0.5 * u[k] ** 2, qp = 0.5 * u[Math.min(k + 1, N - 1)] ** 2
        Dq[k] = (nu * (qp - 2 * q0 + qm)) / (dpsi * dpsi)
      }
      for (let it = 0; it < 20; it++) {
        let f = -Hd, df = 0
        for (let k = 0; k < N; k++) {
          un[k] = u[k] + dx * (Dq[k] - P / u[k])
          if (un[k] <= 0) { stall = true; return }
          f += dpsi / un[k]; df += (dpsi * dx) / (u[k] * un[k] * un[k])
        }
        P -= f / df
        if (Math.abs(f) < 1e-13) break
      }
      const nw = new Float64Array(N)
      for (let k = 0; k < N; k++) { nw[k] = u[k] + dx * (Dq[k] - P / u[k]); if (nw[k] <= 0) { stall = true; return } }
      u = nw
      x += dx; p += P * dx; steps++
      if (x99 === null && p >= 0.99 * dpMom) x99 = x
      for (let k = 0; k < N; k++) err = Math.max(err, Math.abs(u[k] - V2))
      if (err <= TOL) done = true
      if (steps % 4 === 0 || done) { px.push(x); pp.push(p) }
      if (steps % 12 === 0 || done) tubes.push({ x, yb: ybounds() })
    }

    const lossNow = () => {
      let e = 0
      for (let k = 0; k < N; k++) e += 0.5 * u[k] * u[k] * dpsi
      return E0 - (p + e / Qt)
    }
    const publish = () => setRead({ x, dp: p, dpMom, dpBern, loss: lossNow(), carnot, x99, V2, done, stall, steps })

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // ---- duct with stream tubes (x vs y)
      const dx0 = 50, dx1 = 740, dy0 = 22, dy1 = 222
      const X = (v: number) => dx0 + (Math.min(v, xMax) / xMax) * (dx1 - dx0)
      const Y = (v: number) => dy0 + (v / Hd) * (dy1 - dy0)
      ctx.strokeStyle = GREY; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(dx0, dy0); ctx.lineTo(dx1, dy0); ctx.moveTo(dx0, dy1); ctx.lineTo(dx1, dy1); ctx.stroke()
      // filled bands: jet vs slow
      for (let k = 0; k < N; k++) {
        ctx.fillStyle = jet[k] ? 'rgba(56,189,248,0.22)' : 'rgba(249,115,22,0.22)'
        ctx.beginPath()
        tubes.forEach((t, i) => (i === 0 ? ctx.moveTo(X(t.x), Y(t.yb[k])) : ctx.lineTo(X(t.x), Y(t.yb[k]))))
        for (let i = tubes.length - 1; i >= 0; i--) ctx.lineTo(X(tubes[i].x), Y(tubes[i].yb[k + 1]))
        ctx.closePath(); ctx.fill()
      }
      ctx.lineWidth = 0.8
      for (let k = 0; k <= N; k += 4) {
        ctx.strokeStyle = 'rgba(127,127,127,0.55)'
        ctx.beginPath()
        tubes.forEach((t, i) => (i === 0 ? ctx.moveTo(X(t.x), Y(t.yb[k])) : ctx.lineTo(X(t.x), Y(t.yb[k]))))
        ctx.stroke()
      }
      ctx.fillStyle = GREY
      ctx.fillText(`stream tubes, each carries dψ = Q/${N}   x/H → (window ${xMax.toFixed(0)})`, dx0, dy1 + 16)
      ctx.strokeStyle = 'rgba(250,204,21,0.9)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(X(x), dy0); ctx.lineTo(X(x), dy1); ctx.stroke()

      // ---- p(x) plot
      const gx0 = 50, gx1 = 470, gy0 = 262, gy1 = 470
      const pMax = Math.max(dpBern, dpMom) * 1.1 + 1e-9
      const PY = (v: number) => gy1 - (v / pMax) * (gy1 - gy0)
      ctx.strokeStyle = 'rgba(127,127,127,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0)
      const GX = (v: number) => gx0 + (Math.min(v, xMax) / xMax) * (gx1 - gx0)
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5
      ctx.strokeStyle = BERN; ctx.beginPath(); ctx.moveTo(gx0, PY(dpBern)); ctx.lineTo(gx1, PY(dpBern)); ctx.stroke()
      ctx.strokeStyle = NUM; ctx.beginPath(); ctx.moveTo(gx0, PY(dpMom)); ctx.lineTo(gx1, PY(dpMom)); ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = NUM; ctx.lineWidth = 2.2; ctx.beginPath()
      for (let i = 0; i < px.length; i++) (i === 0 ? ctx.moveTo(GX(px[i]), PY(pp[i])) : ctx.lineTo(GX(px[i]), PY(pp[i])))
      ctx.stroke()
      ctx.fillStyle = BERN; ctx.fillText(`Bernoulli (jet) ${dpBern.toFixed(4)}`, gx0 + 6, PY(dpBern) - 5)
      ctx.fillStyle = NUM; ctx.fillText(`momentum ${dpMom.toFixed(4)}`, gx0 + 6, PY(dpMom) + 14)
      ctx.fillStyle = GREY; ctx.fillText('(p − p1)/ρV1²  vs  x/H', gx0, gy0 - 6)
      ctx.fillText('0', gx0 - 12, gy1 + 4); ctx.fillText(xMax.toFixed(0), gx1 - 12, gy1 + 14)

      // ---- u(y) profile
      const ux0 = 520, ux1 = 740, uy0 = 262, uy1 = 470
      const UX = (v: number) => ux0 + v * (ux1 - ux0)
      const UY = (v: number) => uy0 + (v / Hd) * (uy1 - uy0)
      ctx.strokeStyle = 'rgba(127,127,127,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(ux0, uy0, ux1 - ux0, uy1 - uy0)
      const prof = (vel: Float64Array, col: string, lw: number) => {
        let y = 0
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath()
        for (let k = 0; k < N; k++) {
          const h = dpsi / vel[k]
          k === 0 ? ctx.moveTo(UX(vel[k]), UY(y)) : ctx.lineTo(UX(vel[k]), UY(y))
          ctx.lineTo(UX(vel[k]), UY(y + h)); y += h
        }
        ctx.stroke()
      }
      prof(u0, 'rgba(127,127,127,0.6)', 1)
      prof(u, stall ? '#ef4444' : JET, 2.2)
      ctx.setLineDash([3, 3]); ctx.strokeStyle = NUM; ctx.beginPath(); ctx.moveTo(UX(V2), uy0); ctx.lineTo(UX(V2), uy1); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = GREY; ctx.fillText('u(y)/V1 now (grey: inlet)', ux0, uy0 - 6)
      ctx.fillText('0', ux0 - 4, uy1 + 14); ctx.fillText('1', ux1 - 4, uy1 + 14)
      ctx.fillStyle = NUM; ctx.fillText(`V2 = ${V2.toFixed(3)}`, UX(V2) + 4, uy1 - 6)
      if (stall) { ctx.fillStyle = '#ef4444'; ctx.fillText('STALL: slow tube hit u = 0', ux0 + 6, uy0 + 16) }
      ctx.fillStyle = SLOW; ctx.fillText('slow', 8, dy0 + 14); ctx.fillStyle = JET; ctx.fillText('jet', 8, (dy0 + dy1) / 2 + 4)
    }

    let raf = 0
    const loop = () => {
      if (playRef.current) for (let s = 0; s < spfRef.current; s++) step()
      draw()
      if (++frame % 12 === 0) publish()
      raf = requestAnimationFrame(loop)
    }
    stepRef.current = () => { step(); draw(); publish() }
    publish()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [sigma, eps, nu, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          jet area σ = {sigma.toFixed(2)}{' '}
          <input type="range" min={0.2} max={0.8} step={0.05} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} />
        </label>
        <label>
          slow stream ε = {eps.toFixed(2)}{' '}
          <input type="range" min={0.02} max={0.9} step={0.01} value={eps} onChange={(e) => setEps(Number(e.target.value))} />
        </label>
        <label>
          ν = {nu.toFixed(3)}{' '}
          <input type="range" min={0.001} max={0.01} step={0.001} value={nu} onChange={(e) => setNu(Number(e.target.value))} />
        </label>
        <label>
          steps/frame = {spf}{' '}
          <input type="range" min={1} max={100} step={1} value={spf} onChange={(e) => setSpf(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: GREY }}>
          step {read.steps} · x/H = {read.x.toFixed(2)} · V2 = {read.V2.toFixed(3)} · x99 = {read.x99 === null ? '—' : read.x99.toFixed(1)}
          {read.done ? ' · mixed (|u−V2| < 1e-3)' : ''}{read.stall ? ' · STALL (flow would reverse)' : ''}
        </div>
        <div style={{ color: NUM }}>dp_num = {read.dp.toFixed(4)} · dp_mom = {read.dpMom.toFixed(4)} · loss = {read.loss.toFixed(4)} · Carnot = {read.carnot.toFixed(4)}</div>
        <div style={{ color: BERN }}>dp_Bernoulli = {read.dpBern.toFixed(4)} · Bernoulli/num = {read.dp > 1e-6 ? (read.dpBern / read.dp).toFixed(2) : '—'}×</div>
      </div>
    </div>
  )
}
