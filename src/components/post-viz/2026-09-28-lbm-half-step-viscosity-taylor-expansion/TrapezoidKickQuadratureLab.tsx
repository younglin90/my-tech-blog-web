'use client'

import { useEffect, useRef, useState } from 'react'

const NSTEP = 30 // steps drawn in the bottom strip

/** One-step amplification of the theta-weighted collision integral. */
const amplification = (theta: number, z: number) => (1 - (1 - theta) * z) / (1 + theta * z)

/** |A_theta(z) - exp(-z)| : the quadrature error of a single characteristic hop. */
const stepError = (theta: number, z: number) => Math.abs(amplification(theta, z) - Math.exp(-z))

export function TrapezoidKickQuadratureLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const thetaRef = useRef(0.5)
  const zRef = useRef(0.8)
  const runRef = useRef(true)
  const [theta, setTheta] = useState(0.5)
  const [z, setZ] = useState(0.8)
  const [running, setRunning] = useState(true)
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    thetaRef.current = theta
  }, [theta])
  useEffect(() => {
    zRef.current = z
  }, [z])
  useEffect(() => {
    runRef.current = running
  }, [running])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let phase = 0

    const draw = () => {
      const th = thetaRef.current
      const zz = zRef.current
      if (runRef.current) phase = (phase + 0.006) % 1

      ctx.fillStyle = '#0d1420'
      ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.font = '12px ui-monospace, monospace'

      // ================= left: the kick along one characteristic =================
      const ax = 60
      const ay = 40
      const aw = 300
      const ah = 230
      const qx = (s: number) => ax + s * aw
      const qy = (v: number) => ay + (1 - v) * ah

      ctx.strokeStyle = '#1e293b'
      ctx.beginPath()
      for (let v = 0; v <= 1.001; v += 0.25) {
        ctx.moveTo(ax, qy(v))
        ctx.lineTo(ax + aw, qy(v))
      }
      ctx.stroke()
      ctx.strokeStyle = '#26313f'
      ctx.strokeRect(ax, ay, aw, ah)
      ctx.fillStyle = '#8b98a9'
      for (let v = 0; v <= 1.001; v += 0.25) ctx.fillText(v.toFixed(2), ax - 34, qy(v) + 4)
      ctx.fillText('s = 0', ax - 6, ay + ah + 16)
      ctx.fillText('s = dt', ax + aw - 26, ay + ah + 16)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('collision kick along the characteristic:  W(s) = exp(-s/tau)', ax - 36, 28)

      // exact area under the relaxation curve
      ctx.fillStyle = 'rgba(56,189,248,0.18)'
      ctx.beginPath()
      ctx.moveTo(qx(0), qy(0))
      for (let s = 0; s <= 1.0001; s += 0.01) ctx.lineTo(qx(s), qy(Math.exp(-zz * s)))
      ctx.lineTo(qx(1), qy(0))
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let s = 0; s <= 1.0001; s += 0.01) {
        const p = qy(Math.exp(-zz * s))
        if (s === 0) ctx.moveTo(qx(s), p)
        else ctx.lineTo(qx(s), p)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      // the theta rule replaces the curve by one height
      const hTheta = (1 - th) * 1 + th * Math.exp(-zz)
      ctx.strokeStyle = '#f472b6'
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(qx(0), qy(hTheta))
      ctx.lineTo(qx(1), qy(hTheta))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.lineWidth = 1
      // the two endpoints the rule is allowed to read
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(qx(0), qy(1), 4 + 6 * (1 - th), 0, 2 * Math.PI)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(qx(1), qy(Math.exp(-zz)), 4 + 6 * th, 0, 2 * Math.PI)
      ctx.fill()

      // travelling marker: where the kick actually is right now
      const sm = phase
      ctx.fillStyle = '#fde68a'
      ctx.beginPath()
      ctx.arc(qx(sm), qy(Math.exp(-zz * sm)), 5, 0, 2 * Math.PI)
      ctx.fill()

      const exactArea = (1 - Math.exp(-zz)) / zz
      ctx.fillStyle = '#38bdf8'
      ctx.fillText(`exact mean = ${exactArea.toFixed(5)}`, ax + 8, ay + 18)
      ctx.fillStyle = '#f472b6'
      ctx.fillText(`theta rule = ${hTheta.toFixed(5)}`, ax + 8, ay + 34)
      ctx.fillStyle = '#8b98a9'
      ctx.fillText(
        `gap = ${(hTheta - exactArea).toExponential(2)}`,
        ax + 8,
        ay + 50,
      )

      // ================= right: error slope in dt =================
      const bx = 470
      const by = 40
      const bw = 380
      const bh = 230
      const lxMin = -2.2
      const lxMax = 0.4
      const lyMin = -7
      const lyMax = -0.3
      const ex = (lz: number) => bx + ((lz - lxMin) / (lxMax - lxMin)) * bw
      const ey = (le: number) => by + ((lyMax - le) / (lyMax - lyMin)) * bh

      ctx.strokeStyle = '#1e293b'
      ctx.beginPath()
      for (let le = -1; le >= lyMin; le -= 1) {
        ctx.moveTo(bx, ey(le))
        ctx.lineTo(bx + bw, ey(le))
      }
      for (let lz = -2; lz <= 0.001; lz += 1) {
        ctx.moveTo(ex(lz), by)
        ctx.lineTo(ex(lz), by + bh)
      }
      ctx.stroke()
      ctx.strokeStyle = '#26313f'
      ctx.strokeRect(bx, by, bw, bh)
      ctx.fillStyle = '#8b98a9'
      for (let le = -1; le >= lyMin; le -= 1) ctx.fillText(`1e${le}`, bx - 36, ey(le) + 4)
      for (let lz = -2; lz <= 0.001; lz += 1) ctx.fillText(`1e${lz}`, ex(lz) - 12, by + bh + 16)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('one-step error  vs  dt/tau', bx, 28)

      // reference slopes 2 and 3
      const ref = (p: number, colour: string, tag: string) => {
        const anchorLz = -0.6
        const anchorLe = Math.log10(Math.max(stepError(th, Math.pow(10, anchorLz)), 1e-16))
        ctx.strokeStyle = colour
        ctx.setLineDash([3, 5])
        ctx.beginPath()
        ctx.moveTo(ex(lxMin), ey(anchorLe + p * (lxMin - anchorLz)))
        ctx.lineTo(ex(lxMax), ey(anchorLe + p * (lxMax - anchorLz)))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = colour
        ctx.fillText(tag, bx + bw - 54, ey(anchorLe + p * (lxMax - 0.15 - anchorLz)))
      }
      ref(2, '#fb923c', 'slope 2')
      ref(3, '#4ade80', 'slope 3')

      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      let started = false
      for (let lz = lxMin; lz <= lxMax; lz += 0.02) {
        const e = stepError(th, Math.pow(10, lz))
        const le = Math.log10(Math.max(e, 1e-16))
        if (le < lyMin) {
          started = false
          continue
        }
        if (!started) {
          ctx.moveTo(ex(lz), ey(le))
          started = true
        } else ctx.lineTo(ex(lz), ey(le))
      }
      ctx.stroke()
      ctx.lineWidth = 1

      const lzNow = Math.log10(zz)
      const leNow = Math.log10(Math.max(stepError(th, zz), 1e-16))
      ctx.fillStyle = '#fde68a'
      ctx.beginPath()
      ctx.arc(ex(lzNow), ey(leNow), 5, 0, 2 * Math.PI)
      ctx.fill()

      // ================= bottom: the error after n steps =================
      const cx0 = 60
      const cy0 = 310
      const cw = 790
      const chh = 80
      const gx = (n: number) => cx0 + (n / NSTEP) * cw
      const gy = (le: number) => cy0 + ((0 - le) / 4) * chh
      ctx.strokeStyle = '#26313f'
      ctx.strokeRect(cx0, cy0, cw, chh)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('non-equilibrium part after n steps (log)', cx0, cy0 - 8)
      const a = amplification(th, zz)
      const drawSeq = (fn: (n: number) => number, colour: string) => {
        ctx.strokeStyle = colour
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let n = 0; n <= NSTEP; n++) {
          const le = Math.max(-4, Math.log10(Math.max(Math.abs(fn(n)), 1e-12)))
          if (n === 0) ctx.moveTo(gx(n), gy(le))
          else ctx.lineTo(gx(n), gy(le))
        }
        ctx.stroke()
        ctx.lineWidth = 1
      }
      drawSeq((n) => Math.exp(-zz * n), '#38bdf8')
      drawSeq((n) => Math.pow(a, n), '#f472b6')
      const nCur = Math.floor(phase * NSTEP)
      ctx.strokeStyle = '#fde68a'
      ctx.beginPath()
      ctx.moveTo(gx(nCur), cy0)
      ctx.lineTo(gx(nCur), cy0 + chh)
      ctx.stroke()
      const relErr =
        Math.abs(Math.pow(a, nCur) - Math.exp(-zz * nCur)) / Math.max(Math.exp(-zz * nCur), 1e-30)
      ctx.fillStyle = '#8b98a9'
      ctx.fillText(
        `n = ${nCur}   relative error ${(100 * relErr).toFixed(2)}%   ${a < 0 ? '(A < 0: sign flips every step)' : ''}`,
        cx0 + 8,
        cy0 + chh - 8,
      )

      frame++
      if (frame % 12 === 0) setCursor(nCur)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const a = amplification(theta, z)
  const tauRatio = a > 0 ? -z / Math.log(a) : null

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={420}
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
          theta = {theta.toFixed(3)}{' '}
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={theta}
            onChange={(e) => setTheta(parseFloat(e.target.value))}
          />
        </label>
        <label>
          dt/tau = {z.toFixed(3)}{' '}
          <input
            type="range"
            min={-2}
            max={0.3}
            step={0.01}
            value={Math.log10(z)}
            onChange={(e) => setZ(Math.pow(10, parseFloat(e.target.value)))}
          />
        </label>
        <button onClick={() => setTheta(0)}>theta = 0 (read f)</button>
        <button onClick={() => setTheta(0.5)}>theta = 1/2 (read f-bar)</button>
        <label>
          <input type="checkbox" checked={running} onChange={(e) => setRunning(e.target.checked)} />{' '}
          run
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        Only theta = 1/2 puts the pink line where the blue area demands, so its error rides slope 3
        instead of slope 2 — that single half is the whole difference. Realised relaxation:
        tau_eff/tau = {tauRatio === null ? 'undefined (A < 0)' : tauRatio.toFixed(4)}. The lattice
        Boltzmann update you write is theta = 1/2 in f-bar, which is why the viscosity answers to
        tau - 1/2 and not tau. Cursor sits at n = {cursor}.
      </p>
    </div>
  )
}
