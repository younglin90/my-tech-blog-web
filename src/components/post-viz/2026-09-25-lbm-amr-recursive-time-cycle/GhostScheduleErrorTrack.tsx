'use client'

import { useEffect, useRef, useState } from 'react'

const NC = 128
const PA = 40
const PB = 88
const NF = 2 * (PB - PA)
const WQ = [2 / 3, 1 / 6, 1 / 6]
const CQ = [0, 1, -1]
const NSTEP = 350
const SG = 0.018

const SCHEDULES = ['ordered', 'frozen-ghost', 'refine-after-stream'] as const
type Schedule = (typeof SCHEDULES)[number]
const SCOLOUR: Record<Schedule, string> = {
  ordered: '#4ade80',
  'frozen-ghost': '#fbbf24',
  'refine-after-stream': '#f43f5e',
}

function pulse(x: number) {
  return 1 + 0.3 * Math.exp(-((x - 0.2) ** 2) / (2 * SG * SG))
}

function seed(n: number, u: number, off: number) {
  const f = new Float64Array(n * 3)
  for (let i = 0; i < n; i++) {
    const rho = pulse((off + (i + 0.5) * (off ? 0.5 : 1)) / NC)
    for (let q = 0; q < 3; q++) f[i * 3 + q] = rho * WQ[q] * (1 + 3 * CQ[q] * u)
  }
  return f
}

function bgk(f: Float64Array, lo: number, hi: number, tau: number, u: number) {
  for (let i = lo; i < hi; i++) {
    const rho = f[i * 3] + f[i * 3 + 1] + f[i * 3 + 2]
    for (let q = 0; q < 3; q++) {
      const e = rho * WQ[q] * (1 + 3 * CQ[q] * u)
      f[i * 3 + q] -= (f[i * 3 + q] - e) / tau
    }
  }
}

function streamRing(f: Float64Array, n: number) {
  const g = new Float64Array(f)
  for (let i = 0; i < n; i++) {
    g[i * 3 + 1] = f[((i - 1 + n) % n) * 3 + 1]
    g[i * 3 + 2] = f[((i + 1) % n) * 3 + 2]
  }
  return g
}

function streamPatch(f: Float64Array) {
  const g = new Float64Array(f)
  for (let i = 1; i <= NF; i++) {
    g[i * 3 + 1] = f[(i - 1) * 3 + 1]
    g[i * 3 + 2] = f[(i + 1) * 3 + 2]
  }
  return g
}

function ghostCell(
  sa: Float64Array,
  sb: Float64Array,
  th: number,
  i0: number,
  i1: number,
  w0: number,
  w1: number,
  u: number,
  fac: number
) {
  const v = [0, 0, 0]
  let rho = 0
  for (let q = 0; q < 3; q++) {
    const a = (1 - th) * sa[i0 * 3 + q] + th * sb[i0 * 3 + q]
    const b = (1 - th) * sa[i1 * 3 + q] + th * sb[i1 * 3 + q]
    v[q] = w0 * a + w1 * b
    rho += v[q]
  }
  for (let q = 0; q < 3; q++) {
    const e = rho * WQ[q] * (1 + 3 * CQ[q] * u)
    v[q] = e + fac * (v[q] - e)
  }
  return v
}

type Level = { fc: Float64Array; ff: Float64Array }

function cycleOnce(lv: Level, s: Schedule, tauC: number, tauF: number, u: number) {
  const R = (tauF / tauC) * 0.5
  const S = (R * (1 - 1 / tauF)) / (1 - 1 / tauC)
  const preT = lv.fc
  const postT = new Float64Array(preT)
  bgk(postT, 0, NC, tauC, u)
  const preT1 = streamRing(postT, NC)
  const postT1 = new Float64Array(preT1)
  bgk(postT1, 0, NC, tauC, u)

  for (let k = 0; k < 2; k++) {
    const th = 0.5 * k
    const sa = s === 'refine-after-stream' ? preT : postT
    const sb = s === 'ordered' ? postT1 : s === 'frozen-ghost' ? postT : preT1
    const fac = s === 'refine-after-stream' ? R : S
    const gl = ghostCell(sa, sb, th, PA - 1, PA, 0.75, 0.25, u, fac)
    const gr = ghostCell(sa, sb, th, PB - 1, PB, 0.25, 0.75, u, fac)
    for (let q = 0; q < 3; q++) {
      lv.ff[q] = gl[q]
      lv.ff[(NF + 1) * 3 + q] = gr[q]
    }
    bgk(lv.ff, 1, NF + 1, tauF, u)
    lv.ff = streamPatch(lv.ff)
  }

  const fc = new Float64Array(preT1)
  for (let i = 0; i < PB - PA; i++) {
    const v = [0, 0, 0]
    let rho = 0
    for (let q = 0; q < 3; q++) {
      v[q] = 0.5 * (lv.ff[(1 + 2 * i) * 3 + q] + lv.ff[(2 + 2 * i) * 3 + q])
      rho += v[q]
    }
    for (let q = 0; q < 3; q++) {
      const e = rho * WQ[q] * (1 + 3 * CQ[q] * u)
      fc[(PA + i) * 3 + q] = e + (v[q] - e) / R
    }
  }
  lv.fc = fc
}

export function GhostScheduleErrorTrack() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tauC, setTauC] = useState(0.65)
  const [u, setU] = useState(0.2)
  const [shown, setShown] = useState<Schedule>('refine-after-stream')
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [readout, setReadout] = useState({ step: 0, l2: SCHEDULES.map(() => 0) })

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const tauF = 2 * tauC - 0.5

    const levels: Record<Schedule, Level> = {} as Record<Schedule, Level>
    for (const s of SCHEDULES) {
      const ff = new Float64Array((NF + 2) * 3)
      const inner = seed(NF, u, PA)
      ff.set(inner, 3)
      levels[s] = { fc: seed(NC, u, 0), ff }
    }
    let ref = seed(2 * NC, u, 0)
    for (let i = 0; i < 2 * NC; i++) {
      const rho = pulse((i + 0.5) / (2 * NC))
      for (let q = 0; q < 3; q++) ref[i * 3 + q] = rho * WQ[q] * (1 + 3 * CQ[q] * u)
    }
    let nstep = 0
    let frame = 0
    let raf = 0

    const rhoCoarse = (f: Float64Array) => {
      const r = new Float64Array(NC)
      for (let i = 0; i < NC; i++) r[i] = f[i * 3] + f[i * 3 + 1] + f[i * 3 + 2]
      return r
    }
    const rhoRef = () => {
      const r = new Float64Array(NC)
      for (let i = 0; i < NC; i++) {
        let s = 0
        for (let j = 2 * i; j < 2 * i + 2; j++) s += ref[j * 3] + ref[j * 3 + 1] + ref[j * 3 + 2]
        r[i] = 0.5 * s
      }
      return r
    }

    const draw = () => {
      const W = cv.width
      const H = cv.height
      const left = 54
      const right = W - 16
      const topH = 176
      const botY = topH + 62
      const botH = 116
      const xOf = (i: number) => left + ((right - left) * (i + 0.5)) / NC

      ctx.fillStyle = '#0d1520'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      ctx.fillStyle = '#16233250'
      ctx.fillRect(xOf(PA) , 24, xOf(PB) - xOf(PA), topH - 24)
      ctx.fillStyle = '#64748b'
      ctx.fillText('level-2 patch (dx/2, dt/2)', xOf(PA) + 6, 38)

      const rr = rhoRef()
      const plot = (arr: Float64Array, colour: string, dash: number[]) => {
        ctx.setLineDash(dash)
        ctx.strokeStyle = colour
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < NC; i++) {
          const y = topH - ((arr[i] - 0.98) / 0.36) * (topH - 34)
          if (i === 0) ctx.moveTo(xOf(i), y)
          else ctx.lineTo(xOf(i), y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      plot(rr, '#64748b', [4, 4])
      plot(rhoCoarse(levels[shown].fc), SCOLOUR[shown], [])

      for (const px of [PA, PB]) {
        ctx.strokeStyle = '#94a3b8'
        ctx.setLineDash([2, 4])
        ctx.beginPath()
        ctx.moveTo(xOf(px), 24)
        ctx.lineTo(xOf(px), botY + botH)
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.fillStyle = '#8b98a9'
      ctx.fillText('rho', 16, 40)
      ctx.fillText('|d rho|', 10, botY - 8)

      ctx.strokeStyle = '#26313f'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, botY + botH)
      ctx.lineTo(right, botY + botH)
      ctx.stroke()

      const FULL = 4e-3
      const l2: number[] = []
      SCHEDULES.forEach((s) => {
        const rc = rhoCoarse(levels[s].fc)
        let num = 0
        let den = 0
        ctx.strokeStyle = SCOLOUR[s]
        ctx.lineWidth = s === shown ? 2.2 : 1.2
        ctx.globalAlpha = s === shown ? 1 : 0.65
        ctx.beginPath()
        for (let i = 0; i < NC; i++) {
          const d = Math.abs(rc[i] - rr[i])
          num += d * d
          den += (rr[i] - 1) * (rr[i] - 1)
          const y = botY + botH - Math.min(1, d / FULL) * botH
          if (i === 0) ctx.moveTo(xOf(i), y)
          else ctx.lineTo(xOf(i), y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
        l2.push((100 * Math.sqrt(num)) / Math.sqrt(den))
      })
      ctx.fillStyle = '#64748b'
      ctx.fillText(FULL.toExponential(0), left - 44, botY + 10)
      ctx.fillText('0', left - 14, botY + botH + 4)

      SCHEDULES.forEach((s, i) => {
        ctx.fillStyle = SCOLOUR[s]
        ctx.fillRect(left + i * 238, H - 18, 10, 10)
        ctx.fillStyle = s === shown ? '#e2e8f0' : '#8b98a9'
        ctx.fillText(`${s}  L2 = ${l2[i].toFixed(3)}%`, left + 16 + i * 238, H - 9)
      })
      ctx.fillStyle = '#8b98a9'
      ctx.fillText(`step ${nstep}/${NSTEP}   tau_f = ${tauF.toFixed(2)}`, right - 190, 20)
      return l2
    }

    const tick = () => {
      if (running && nstep < NSTEP) {
        for (let r = 0; r < 2; r++) {
          for (const s of SCHEDULES) cycleOnce(levels[s], s, tauC, tauF, u)
          for (let h = 0; h < 2; h++) {
            bgk(ref, 0, 2 * NC, tauF, u)
            ref = streamRing(ref, 2 * NC)
          }
          nstep += 1
        }
      }
      const l2 = draw()
      frame += 1
      if (frame % 12 === 0) setReadout({ step: nstep, l2 })
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [tauC, u, shown, running, resetKey])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={380}
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
          tau_c = {tauC.toFixed(2)}{' '}
          <input
            type="range"
            min={0.55}
            max={0.95}
            step={0.05}
            value={tauC}
            onChange={(e) => {
              setTauC(parseFloat(e.target.value))
              setResetKey((k) => k + 1)
            }}
          />
        </label>
        <label>
          u = {u.toFixed(2)}{' '}
          <input
            type="range"
            min={0.05}
            max={0.25}
            step={0.05}
            value={u}
            onChange={(e) => {
              setU(parseFloat(e.target.value))
              setResetKey((k) => k + 1)
            }}
          />
        </label>
        <label>
          show{' '}
          <select value={shown} onChange={(e) => setShown(e.target.value as Schedule)}>
            {SCHEDULES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
        <button onClick={() => setResetKey((k) => k + 1)}>reset</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        All three schedules run at once on the same grid; the dashed grey curve is a uniform fine
        grid carried to the same physical time. step {readout.step} — L2 ={' '}
        {readout.l2.map((v) => v.toFixed(3)).join(' / ')} %. Watch the lower panel as the pulse
        reaches the left dotted seam: the green curve stays flat there and its error lives inside
        the pulse, while the red one spikes at the seam itself. Raise tau_c and the gap widens,
        because a larger tau puts more of the distribution into the non-equilibrium part that the
        mis-ordered refine copies at the wrong instant.
      </p>
    </div>
  )
}
