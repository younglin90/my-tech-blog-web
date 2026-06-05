'use client'

import { useEffect, useRef, useState } from 'react'

// A 2-field (velocity, pressure) all-speed block system
//   A = [[ I , beta*G ], [ Dv , I ]],  beta = 1/M^2
// As the Mach number M drops, beta explodes and A's spectrum smears far up
// the imaginary axis, so plain GMRES stalls. The velocity-pressure Schur
// complement preconditioner P = [[I, beta*G],[0, S]], S = I - beta*Dv*G,
// clusters every eigenvalue at 1, so preconditioned GMRES converges in a
// couple of iterations regardless of M. We run real GMRES here and plot both
// relative-residual histories.
const NC = 24 // cells -> 2*NC unknowns
const DX = 1 / NC

function buildG() {
  // periodic forward difference (gradient)
  const G: number[][] = Array.from({ length: NC }, () => new Array(NC).fill(0))
  for (let i = 0; i < NC; i++) {
    G[i][i] = -1 / DX
    G[i][(i + 1) % NC] = 1 / DX
  }
  return G
}
function transposeNeg(G: number[][]) {
  // Dv = -G^T  so that Dv*G is a (negative) discrete Laplacian
  const D: number[][] = Array.from({ length: NC }, () => new Array(NC).fill(0))
  for (let i = 0; i < NC; i++) for (let j = 0; j < NC; j++) D[i][j] = -G[j][i]
  return D
}
function matVec(M: number[][], x: Float64Array, off = 0) {
  const y = new Float64Array(NC)
  for (let i = 0; i < NC; i++) {
    let s = 0
    for (let j = 0; j < NC; j++) s += M[i][j] * x[off + j]
    y[i] = s
  }
  return y
}
// dense LU factorisation (partial pivot) of an n x n matrix
function luFactor(A: number[][]) {
  const n = A.length
  const lu = A.map((r) => r.slice())
  const piv = Array.from({ length: n }, (_, i) => i)
  for (let k = 0; k < n; k++) {
    let p = k
    for (let i = k + 1; i < n; i++) if (Math.abs(lu[i][k]) > Math.abs(lu[p][k])) p = i
    if (p !== k) { const t = lu[p]; lu[p] = lu[k]; lu[k] = t; const tp = piv[p]; piv[p] = piv[k]; piv[k] = tp }
    for (let i = k + 1; i < n; i++) {
      lu[i][k] /= lu[k][k]
      for (let j = k + 1; j < n; j++) lu[i][j] -= lu[i][k] * lu[k][j]
    }
  }
  return { lu, piv }
}
function luSolve(f: { lu: number[][]; piv: number[] }, b: Float64Array) {
  const { lu, piv } = f
  const n = lu.length
  const x = new Float64Array(n)
  for (let i = 0; i < n; i++) x[i] = b[piv[i]]
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) x[i] -= lu[i][j] * x[j]
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j < n; j++) x[i] -= lu[i][j] * x[j]
    x[i] /= lu[i][i]
  }
  return x
}

function gmres(
  applyA: (x: Float64Array) => Float64Array,
  applyP: (r: Float64Array) => Float64Array,
  b: Float64Array,
  maxit: number
) {
  const N = b.length
  const dot = (a: Float64Array, c: Float64Array) => { let s = 0; for (let i = 0; i < N; i++) s += a[i] * c[i]; return s }
  const r0 = applyP(b) // x0 = 0
  let beta = Math.sqrt(dot(r0, r0))
  const hist = [1]
  if (beta === 0) return hist
  const V: Float64Array[] = [Float64Array.from(r0, (v) => v / beta)]
  const H: number[][] = []
  const cs: number[] = [], sn: number[] = []
  const g = [beta]
  for (let j = 0; j < maxit; j++) {
    let w = applyP(applyA(V[j]))
    H.push(new Array(maxit + 1).fill(0) as unknown as number[])
    for (let i = 0; i <= j; i++) {
      H[j][i] = dot(w, V[i])
      for (let k = 0; k < N; k++) w[k] -= H[j][i] * V[i][k]
    }
    const hN = Math.sqrt(dot(w, w))
    H[j][j + 1] = hN
    // apply previous Givens rotations to the new column
    for (let i = 0; i < j; i++) {
      const t = cs[i] * H[j][i] + sn[i] * H[j][i + 1]
      H[j][i + 1] = -sn[i] * H[j][i] + cs[i] * H[j][i + 1]
      H[j][i] = t
    }
    const denom = Math.hypot(H[j][j], H[j][j + 1])
    cs[j] = H[j][j] / denom
    sn[j] = H[j][j + 1] / denom
    H[j][j] = cs[j] * H[j][j] + sn[j] * H[j][j + 1]
    H[j][j + 1] = 0
    g[j + 1] = -sn[j] * g[j]
    g[j] = cs[j] * g[j]
    hist.push(Math.abs(g[j + 1]) / beta)
    if (hN < 1e-13 || Math.abs(g[j + 1]) / beta < 1e-11) break
    V.push(Float64Array.from(w, (v) => v / hN))
  }
  return hist
}

export function GmresSchurConvergence() {
  const [logM, setLogM] = useState(-2) // Mach = 10^logM
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<{ raw: number[]; pre: number[] }>({ raw: [1], pre: [1] })

  useEffect(() => {
    const M = Math.pow(10, logM)
    const beta = 1 / (M * M)
    const G = buildG()
    const Dv = transposeNeg(G)
    const N2 = 2 * NC

    const applyA = (x: Float64Array) => {
      const y = new Float64Array(N2)
      const Gp = matVec(G, x, NC)   // G * x_p
      const Du = matVec(Dv, x, 0)   // Dv * x_u
      for (let i = 0; i < NC; i++) {
        y[i] = x[i] + beta * Gp[i]
        y[NC + i] = Du[i] + x[NC + i]
      }
      return y
    }
    // Schur preconditioner: S = I - beta * Dv * G  (exact pressure Schur complement)
    const S: number[][] = Array.from({ length: NC }, (_, i) => {
      const row = new Array(NC).fill(0)
      row[i] = 1
      return row
    })
    // S -= beta * Dv*G : build Dv*G column by column
    for (let c = 0; c < NC; c++) {
      const ec = new Float64Array(N2)
      ec[NC + c] = 1
      const Gc = matVec(G, ec, NC)
      const DGc = matVec(Dv, Gc as unknown as Float64Array, 0) // Dv*(G*e_c)
      for (let r = 0; r < NC; r++) S[r][c] -= beta * DGc[r]
    }
    const Sf = luFactor(S)
    const applyP = (r: Float64Array) => {
      const rp = new Float64Array(NC)
      for (let i = 0; i < NC; i++) rp[i] = r[NC + i]
      const zp = luSolve(Sf, rp)             // S z_p = r_p
      const Gzp = matVec(G, (() => { const t = new Float64Array(N2); for (let i = 0; i < NC; i++) t[NC + i] = zp[i]; return t })(), NC)
      const z = new Float64Array(N2)
      for (let i = 0; i < NC; i++) {
        z[i] = r[i] - beta * Gzp[i]          // z_u = r_u - beta G z_p
        z[NC + i] = zp[i]
      }
      return z
    }
    const identity = (r: Float64Array) => r

    // fixed right-hand side
    let seed = 12345
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5 }
    const b = new Float64Array(N2)
    for (let i = 0; i < N2; i++) b[i] = rng()

    const raw = gmres(applyA, identity, b, N2)
    const pre = gmres(applyA, applyP, b, 12)
    setData({ raw, pre })
  }, [logM])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)
    const padL = 44, padB = 26, padT = 12, padR = 12
    const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB
    const maxIt = Math.max(data.raw.length, 8)
    const loMin = -11
    const xOf = (k: number) => x0 + (k / (maxIt - 1)) * (x1 - x0)
    const yOf = (res: number) => {
      const l = Math.log10(Math.max(res, 1e-11))
      return y1 - ((l - loMin) / (0 - loMin)) * (y1 - y0)
    }
    // grid
    ctx.strokeStyle = '#1e293b'
    ctx.fillStyle = '#64748b'
    ctx.font = '10px sans-serif'
    ctx.lineWidth = 1
    for (let e = 0; e >= loMin; e -= 2) {
      const y = yOf(Math.pow(10, e))
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()
      ctx.fillText('1e' + e, 6, y + 3)
    }
    const draw = (h: number[], color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k < h.length; k++) {
        const x = xOf(k), y = yOf(h[k])
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    draw(data.raw, '#fb923c')   // unpreconditioned
    draw(data.pre, '#22d3ee')   // Schur preconditioned
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('iterations →', x1 - 70, y1 + 20)
    ctx.fillStyle = '#fb923c'; ctx.fillRect(x0 + 6, y0 + 4, 12, 4); ctx.fillStyle = '#94a3b8'; ctx.fillText('no preconditioner', x0 + 22, y0 + 11)
    ctx.fillStyle = '#22d3ee'; ctx.fillRect(x0 + 6, y0 + 18, 12, 4); ctx.fillStyle = '#94a3b8'; ctx.fillText('vP Schur preconditioner', x0 + 22, y0 + 25)
  }, [data])

  const M = Math.pow(10, logM)
  return (
    <div style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={640} height={300} style={{ width: '100%', display: 'block', borderRadius: 4 }} />
      <div style={{ marginTop: 10, fontSize: 13 }}>
        <label>Mach number M = {M.toExponential(1)} (β = 1/M² = {(1 / (M * M)).toExponential(1)})</label>
        <input type="range" min={-3} max={0} step={0.1} value={logM} onChange={(e) => setLogM(+e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        unpreconditioned: {data.raw.length - 1} iters to {data.raw[data.raw.length - 1].toExponential(1)} ·
        Schur: {data.pre.length - 1} iters to {data.pre[data.pre.length - 1].toExponential(1)}
      </div>
    </div>
  )
}
