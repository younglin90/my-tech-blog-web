'use client'

import { useEffect, useRef, useState } from 'react'

// ---- minimal dense linear algebra (no external libs) ----
type Vec = number[]
type Mat = number[][]

function dot(a: Vec, b: Vec): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function norm(a: Vec): number {
  return Math.sqrt(dot(a, a))
}

function matVec(A: Mat, x: Vec): Vec {
  const n = A.length
  const y = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = 0
    const row = A[i]
    for (let j = 0; j < n; j++) s += row[j] * x[j]
    y[i] = s
  }
  return y
}

// deterministic pseudo-random so the curve is stable per parameter set
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// random orthogonal matrix via Gram-Schmidt on a Gaussian matrix
function randomOrthogonal(n: number, rng: () => number): Mat {
  const cols: Vec[] = []
  for (let j = 0; j < n; j++) {
    const v: Vec = new Array(n)
    for (let i = 0; i < n; i++) v[i] = gaussian(rng)
    for (let k = 0; k < j; k++) {
      const c = dot(v, cols[k])
      for (let i = 0; i < n; i++) v[i] -= c * cols[k][i]
    }
    const nv = norm(v)
    for (let i = 0; i < n; i++) v[i] /= nv
    cols.push(v)
  }
  // assemble Q with cols as columns
  const Q: Mat = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) Q[i][j] = cols[j][i]
  return Q
}

// A = Q diag(lambda) Q^T  with controllable eigenvalue spread
function buildMatrix(n: number, kappa: number, clustered: boolean, seed: number): Mat {
  const rng = makeRng(seed)
  const lam: Vec = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1)
    // clustered: most eigenvalues pile up near 1, a few large outliers
    const shaped = clustered ? Math.pow(t, 4) : t
    lam[i] = 1 + (kappa - 1) * shaped
  }
  const Q = randomOrthogonal(n, rng)
  const A: Mat = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let k = 0; k < n; k++) s += Q[i][k] * lam[k] * Q[j][k]
      A[i][j] = s
    }
  }
  return A
}

// restarted GMRES(m); returns relative residual history
function gmresHistory(A: Mat, b: Vec, m: number, cycles: number): number[] {
  const n = b.length
  const x = new Array(n).fill(0)
  const b0 = Math.max(norm(b), 1e-30)
  const hist: number[] = []
  for (let cyc = 0; cyc < cycles; cyc++) {
    const Ax = matVec(A, x)
    const r = b.map((bi, i) => bi - Ax[i])
    let beta = norm(r)
    if (cyc === 0) hist.push(beta / b0)
    if (beta / b0 < 1e-11) break

    const V: Vec[] = [r.map((ri) => ri / beta)]
    const H: number[][] = []
    const cs: number[] = []
    const sn: number[] = []
    const g: number[] = [beta]

    let jUsed = 0
    for (let j = 0; j < m; j++) {
      let w = matVec(A, V[j])
      const hcol: number[] = new Array(j + 2).fill(0)
      for (let i = 0; i <= j; i++) {
        hcol[i] = dot(w, V[i])
        const vi = V[i]
        for (let k = 0; k < n; k++) w[k] -= hcol[i] * vi[k]
      }
      hcol[j + 1] = norm(w)
      H.push(hcol)
      // apply previous Givens rotations to this column
      for (let i = 0; i < j; i++) {
        const temp = cs[i] * hcol[i] + sn[i] * hcol[i + 1]
        hcol[i + 1] = -sn[i] * hcol[i] + cs[i] * hcol[i + 1]
        hcol[i] = temp
      }
      // new rotation eliminating hcol[j+1]
      const denom = Math.hypot(hcol[j], hcol[j + 1])
      cs[j] = denom === 0 ? 1 : hcol[j] / denom
      sn[j] = denom === 0 ? 0 : hcol[j + 1] / denom
      hcol[j] = cs[j] * hcol[j] + sn[j] * hcol[j + 1]
      hcol[j + 1] = 0
      // update residual vector g
      g[j + 1] = -sn[j] * g[j]
      g[j] = cs[j] * g[j]

      jUsed = j + 1
      const rel = Math.abs(g[j + 1]) / b0
      hist.push(rel)

      if (rel < 1e-11) {
        if (hcol[j + 1] === 0 && V.length <= j + 1) { /* skip basis push */ }
        break
      }
      const hjj = hcol[j + 1]
      if (hjj > 1e-14) {
        V.push(w.map((wk) => wk / hjj))
      } else {
        break
      }
    }

    // back substitution: solve H[0:jUsed,0:jUsed] y = g
    const y = new Array(jUsed).fill(0)
    for (let i = jUsed - 1; i >= 0; i--) {
      let s = g[i]
      for (let k = i + 1; k < jUsed; k++) s -= H[k][i] * y[k]
      y[i] = s / H[i][i]
    }
    for (let i = 0; i < n; i++) {
      let s = 0
      for (let k = 0; k < jUsed; k++) s += V[k][i] * y[k]
      x[i] += s
    }
    if (Math.abs(g[jUsed]) / b0 < 1e-11) break
  }
  return hist
}

export function GmresConvergenceLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logKappa, setLogKappa] = useState(3) // 10^3
  const [restart, setRestart] = useState(40)
  const [clustered, setClustered] = useState(false)

  const N = 60

  useEffect(() => {
    const kappa = Math.pow(10, logKappa)
    const rng = makeRng(7)
    const A = buildMatrix(N, kappa, clustered, 12345)
    const b: Vec = new Array(N)
    for (let i = 0; i < N; i++) b[i] = gaussian(rng)
    // full GMRES (no restart) reference
    const histFull = gmresHistory(A, b, N, 1)
    // restarted GMRES(m)
    const histRestart = gmresHistory(A, b, restart, 30)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const Hgt = canvas.height
    const padL = 54
    const padB = 34
    const padT = 16
    const padR = 14
    const plotW = W - padL - padR
    const plotH = Hgt - padT - padB

    ctx.clearRect(0, 0, W, Hgt)

    const maxIter = Math.max(histFull.length, histRestart.length, 2)
    const logMin = -11
    const logMax = 0.3
    const xOf = (it: number) => padL + (it / (maxIter - 1)) * plotW
    const yOf = (rel: number) => {
      const lr = Math.log10(Math.max(rel, 1e-12))
      const t = (lr - logMin) / (logMax - logMin)
      return padT + (1 - t) * plotH
    }

    // grid + axes
    ctx.strokeStyle = 'rgba(122,144,168,0.18)'
    ctx.lineWidth = 1
    ctx.fillStyle = '#7a90a8'
    ctx.font = '11px ui-monospace, monospace'
    for (let p = 0; p >= -10; p -= 2) {
      const y = yOf(Math.pow(10, p))
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
      ctx.textAlign = 'right'
      ctx.fillText(`1e${p}`, padL - 6, y + 4)
    }
    ctx.textAlign = 'center'
    ctx.fillText('iteration (matrix-vector products)', padL + plotW / 2, Hgt - 8)
    ctx.save()
    ctx.translate(14, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('relative residual', 0, 0)
    ctx.restore()

    const drawCurve = (hist: number[], color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      hist.forEach((rel, it) => {
        const x = xOf(it)
        const y = yOf(rel)
        if (it === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    drawCurve(histFull, '#22d3ee')
    drawCurve(histRestart, '#f59e0b')

    // legend
    ctx.font = '12px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#22d3ee'
    ctx.fillText('full GMRES', padL + 10, padT + 14)
    ctx.fillStyle = '#f59e0b'
    ctx.fillText(`GMRES(${restart})`, padL + 10, padT + 32)
  }, [logKappa, restart, clustered])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          condition number κ = 1e{logKappa}
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={logKappa}
            onChange={(e) => setLogKappa(Number(e.target.value))}
            style={{ display: 'block', width: 180 }}
          />
        </label>
        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          restart length m = {restart}
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={restart}
            onChange={(e) => setRestart(Number(e.target.value))}
            style={{ display: 'block', width: 180 }}
          />
        </label>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={clustered}
            onChange={(e) => setClustered(e.target.checked)}
          />
          clustered eigenvalues
        </label>
      </div>
    </div>
  )
}
