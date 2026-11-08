'use client'

import { useEffect, useRef, useState } from 'react'

// TS port of the post's nozzle_simple(): quasi-1D staggered SIMPLE,
// A(x) = 1 + 0.5((x-1.5)/1.5)^2, inlet rho,u fixed, outlet p = 1, h0 = const.
const W = 760
const H = 500
const N = 60
const G = 1.4
const CP = G / (G - 1)
const TOL = 1e-6
const ITMAX = 3000
const BG = '#0f172a'
const INC = '#f97316'
const CMP = '#38bdf8'
const EXA = '#e2e8f0'
const GRID = 'rgba(148,163,184,0.22)'
const TXT = '#cbd5e1'

const xf = Array.from({ length: N + 1 }, (_, j) => (3 * j) / N)
const xc = Array.from({ length: N }, (_, i) => 0.5 * (xf[i] + xf[i + 1]))
const Af = xf.map((x) => 1 + 0.5 * ((x - 1.5) / 1.5) ** 2)
const Ac = xc.map((x) => 1 + 0.5 * ((x - 1.5) / 1.5) ** 2)

function tdma(a: number[], b: number[], c: number[], d: number[]) {
  const n = d.length, cc = new Array(n), dd = new Array(n), x = new Array(n)
  cc[0] = c[0] / b[0]; dd[0] = d[0] / b[0]
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cc[i - 1]
    cc[i] = c[i] / m; dd[i] = (d[i] - a[i] * dd[i - 1]) / m
  }
  x[n - 1] = dd[n - 1]
  for (let i = n - 2; i >= 0; i--) x[i] = dd[i] - cc[i] * x[i + 1]
  return x
}

const areaRatio = (M: number) => (1 / M) * ((2 / (G + 1)) * (1 + 0.5 * (G - 1) * M * M)) ** ((G + 1) / (2 * (G - 1)))
function subsonicMach(ratio: number) {
  if (ratio <= 1) return 1
  let lo = 1e-5, hi = 1
  for (let k = 0; k < 50; k++) { const m = 0.5 * (lo + hi); if (areaRatio(m) > ratio) lo = m; else hi = m }
  return 0.5 * (lo + hi)
}

type Run = {
  p: number[]; u: number[]; T: number[]; rho: number[]
  hist: number[]; it: number; state: 'run' | 'conv' | 'div' | 'stall'; mdot: number
  rhoIn: number
}

function initRun(Min: number): Run {
  const Tin = 1 / (1 + 0.5 * (G - 1) * Min * Min)
  const uin = Min * Math.sqrt(G * Tin), rhoIn = 1 / Tin
  const mdot = rhoIn * uin * Af[0]
  return {
    p: new Array(N).fill(1), T: new Array(N).fill(Tin), rho: new Array(N).fill(1 / Tin),
    u: Af.map((a) => mdot / (rhoIn * a)), hist: [], it: 0, state: 'run', mdot, rhoIn,
  }
}

function simpleIter(r: Run, comp: boolean, au: number, ap: number) {
  if (r.state !== 'run') return
  const { p, u, T, rho, rhoIn, mdot } = r
  const pe = [p[0], ...p, 1]
  const re = [rhoIn, ...rho, rho[N - 1]]
  const uc = [u[0]]; for (let i = 0; i < N; i++) uc.push(0.5 * (u[i] + u[i + 1])); uc.push(u[N])
  const Ae = [Af[0], ...Ac, Af[N]]
  const F = re.map((v, k) => v * uc[k] * Ae[k])
  const aW: number[] = [], aE: number[] = [], aP: number[] = [], src: number[] = []
  for (let j = 0; j <= N; j++) {
    aW.push(Math.max(F[j], 0)); aE.push(Math.max(-F[j + 1], 0))
    aP.push((aW[j] + aE[j] + Math.max(F[j + 1] - F[j], 0) + 1e-12) / au)
    src.push(Af[j] * (pe[j] - pe[j + 1]) + (1 - au) * aP[j] * u[j])
  }
  src[N] += aE[N] * u[N]
  src[1] += aW[1] * u[0]
  const a = aW.map((v) => -v), c = aE.map((v) => -v); c[N] = 0; a[1] = 0
  const us = [u[0], ...tdma(a.slice(1), aP.slice(1), c.slice(1), src.slice(1))]
  const d = Af.map((A, j) => (j === 0 ? 0 : A / aP[j]))
  const rf = [rhoIn, ...rho]
  const m = rf.map((v, j) => v * us[j] * Af[j])
  const b: number[] = [], aw: number[] = [], ae: number[] = [], diag: number[] = []
  let res = 0
  for (let i = 0; i < N; i++) {
    b.push(m[i] - m[i + 1]); res = Math.max(res, Math.abs(b[i]))
    ae.push(rf[i + 1] * d[i + 1] * Af[i + 1]); aw.push(rf[i] * d[i] * Af[i])
    diag.push(ae[i] + aw[i])
    if (comp) {
      const psi = 1 / T[i]
      diag[i] += us[i + 1] * psi * Af[i + 1]
      if (i > 0) aw[i] += us[i] * (1 / T[i - 1]) * Af[i]
    }
  }
  const pc = tdma(aw.map((v) => -v), diag, ae.map((v) => -v), b)
  const pce = [0, ...pc, 0]
  for (let j = 0; j <= N; j++) u[j] = us[j] + d[j] * (pce[j] - pce[j + 1])
  for (let i = 0; i < N; i++) {
    p[i] += ap * pc[i]
    const ucc = 0.5 * (u[i] + u[i + 1])
    T[i] = 1 - (ucc * ucc) / (2 * CP)
    rho[i] = p[i] / Math.max(T[i], 0.05)
  }
  res /= mdot
  r.it++; r.hist.push(res)
  if (!Number.isFinite(res) || res > 1e3) r.state = 'div'
  else if (res < TOL) r.state = 'conv'
  else if (r.it >= ITMAX) r.state = 'stall'
}

const machOf = (r: Run) => xc.map((_, i) => { const v = 0.5 * (r.u[i] + r.u[i + 1]); return v / Math.sqrt(G * Math.max(r.T[i], 0.05)) })

type Read = { itI: number; itC: number; resI: number; resC: number; stI: string; stC: string; mtI: number; mtC: number; mtEx: number }

export function NozzleSimpleRelaxationRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [Min, setMin] = useState(0.3)
  const [ap, setAp] = useState(0.3)
  const [au, setAu] = useState(0.5)
  const [ipf, setIpf] = useState(2)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<Read>({ itI: 0, itC: 0, resI: 1, resC: 1, stI: 'run', stC: 'run', mtI: 0, mtC: 0, mtEx: 0 })
  const playRef = useRef(playing), ipfRef = useRef(ipf)
  playRef.current = playing; ipfRef.current = ipf
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const I = initRun(Min), C = initRun(Min)
    const ratioT = areaRatio(Min) / 1.5
    const exact = Ac.map((A) => subsonicMach(ratioT * A))
    const mtEx = subsonicMach(ratioT)
    let frame = 0, raf = 0

    const step = () => { simpleIter(I, false, au, ap); simpleIter(C, true, au, ap) }
    const push = () => {
      const mI = machOf(I), mC = machOf(C)
      setRead({
        itI: I.it, itC: C.it, resI: I.hist[I.hist.length - 1] ?? 1, resC: C.hist[C.hist.length - 1] ?? 1,
        stI: I.state, stC: C.state, mtI: Math.max(...mI), mtC: Math.max(...mC), mtEx,
      })
    }
    stepRef.current = () => { step(); draw(); push() }

    const draw = () => {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px sans-serif'
      // top: Mach profile
      const L = 56, R = W - 16, T1 = 34, B1 = 230
      const X = (x: number) => L + (x / 3) * (R - L)
      const Y1 = (m: number) => B1 - (Math.max(0, Math.min(m, 1.2)) / 1.2) * (B1 - T1)
      ctx.strokeStyle = GRID; ctx.lineWidth = 1
      for (let k = 0; k <= 6; k++) {
        const m = 0.2 * k
        ctx.beginPath(); ctx.moveTo(L, Y1(m)); ctx.lineTo(R, Y1(m)); ctx.stroke()
        ctx.fillStyle = TXT; ctx.fillText(m.toFixed(1), 22, Y1(m) + 4)
      }
      ctx.fillStyle = TXT; ctx.fillText('Mach along nozzle (throat at x = 1.5)', L, 22)
      // nozzle outline
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.beginPath()
      xf.forEach((x, j) => { const y = B1 - 8 - (Af[j] - 1) * 40; if (j) ctx.lineTo(X(x), y); else ctx.moveTo(X(x), y) })
      ctx.stroke()
      const prof = (m: number[], col: string, dash: number[] = []) => {
        ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath()
        m.forEach((v, i) => { const x = X(xc[i]), y = Y1(Number.isFinite(v) ? v : 1.2); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
        ctx.stroke(); ctx.setLineDash([])
      }
      prof(exact, EXA, [5, 4]); prof(machOf(I), INC); prof(machOf(C), CMP)
      ctx.fillStyle = EXA; ctx.fillText('- - isentropic exact', R - 170, 50)
      ctx.fillStyle = INC; ctx.fillText("incompressible p'", R - 170, 66)
      ctx.fillStyle = CMP; ctx.fillText("compressible p' (ψ)", R - 170, 82)
      // bottom: residual history
      const T2 = 270, B2 = H - 30
      const X2 = (k: number) => L + (k / ITMAX) * (R - L)
      const Y2 = (r: number) => { const l = Math.log10(Math.max(r, 1e-8)); return T2 + ((2 - Math.min(l, 2)) / 10) * (B2 - T2) }
      ctx.strokeStyle = GRID
      for (let e = 2; e >= -8; e -= 2) {
        ctx.beginPath(); ctx.moveTo(L, Y2(10 ** e)); ctx.lineTo(R, Y2(10 ** e)); ctx.stroke()
        ctx.fillStyle = TXT; ctx.fillText(`1e${e}`, 18, Y2(10 ** e) + 4)
      }
      ctx.strokeStyle = 'rgba(250,204,21,0.6)'; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(L, Y2(TOL)); ctx.lineTo(R, Y2(TOL)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = TXT; ctx.fillText('mass residual max|Δṁ|/ṁ vs SIMPLE iteration (0 … 3000)', L, T2 - 8)
      const hist = (h: number[], col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath()
        h.forEach((r, k) => { const x = X2(k + 1), y = Y2(Number.isFinite(r) ? r : 1e3); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
        ctx.stroke()
      }
      hist(I.hist, INC); hist(C.hist, CMP)
    }

    const loop = () => {
      if (playRef.current) for (let k = 0; k < ipfRef.current; k++) step()
      draw()
      if (++frame % 12 === 0) push()
      raf = requestAnimationFrame(loop)
    }
    push(); raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [Min, ap, au, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const st = (s: string, it: number) => (s === 'conv' ? `converged in ${it}` : s === 'div' ? `diverged at ${it}` : s === 'stall' ? 'stalled (3000)' : `iter ${it}`)

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          M_in = {Min.toFixed(2)}{' '}
          <input type="range" min={0.05} max={0.42} step={0.01} value={Min} onChange={(e) => setMin(Number(e.target.value))} />
        </label>
        <label>
          α_p = {ap.toFixed(2)}{' '}
          <input type="range" min={0.05} max={1} step={0.05} value={ap} onChange={(e) => setAp(Number(e.target.value))} />
        </label>
        <label>
          α_u = {au.toFixed(2)}{' '}
          <input type="range" min={0.2} max={0.9} step={0.05} value={au} onChange={(e) => setAu(Number(e.target.value))} />
        </label>
        <label>
          iter/frame = {ipf}{' '}
          <input type="range" min={1} max={30} step={1} value={ipf} onChange={(e) => setIpf(Number(e.target.value))} />
        </label>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
        <div>exact throat M = {read.mtEx.toFixed(3)}</div>
        <div style={{ color: INC }}>incompressible p′: {st(read.stI, read.itI)} · residual {read.resI.toExponential(1)} · M_max {Number.isFinite(read.mtI) ? read.mtI.toFixed(3) : 'nan'}</div>
        <div style={{ color: CMP }}>compressible p′: {st(read.stC, read.itC)} · residual {read.resC.toExponential(1)} · M_max {Number.isFinite(read.mtC) ? read.mtC.toFixed(3) : 'nan'}</div>
      </div>
    </div>
  )
}
