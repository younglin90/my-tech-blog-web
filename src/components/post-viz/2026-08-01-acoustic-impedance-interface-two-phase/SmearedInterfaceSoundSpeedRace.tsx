'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// What a smeared interface does to the speed of sound.
//
// Inside a cell that holds both phases, the mixture is soft like the gas but
// heavy like the liquid. Wood's relation is the honest consequence:
//
//   rho_m = a*rho_g + (1-a)*rho_l
//   1/(rho_m c_m^2) = a/(rho_g c_g^2) + (1-a)/(rho_l c_l^2)
//
// For air and water at a = 0.5 that gives c_m = 24 m/s — fourteen times slower
// than air and sixty times slower than water. No physical medium in the problem
// travels that slowly; the number is an artefact of averaging across the front.
//
// The race below sends one signal through a sharp interface and one through an
// interface smeared over n cells, using the SAME domain and the same two
// materials. Both markers ride the c(x) curve they actually see. Drag n and the
// smeared signal stalls in the mixture band while the sharp one keeps going.
// ---------------------------------------------------------------------------

const W = 660
const H = 400

const RHO_G = 1.2
const C_G = 347
const C_L = 1500

const L = 0.02 // domain length, m
const NCELL = 200
const DX = L / NCELL
const XS = 0.06 * L // start
const XE = 0.94 * L // finish

const NS = 420 // integration samples

const PX = 46
const PW = 372
const PY = 30
const PH = 140

const IX = 468 // Wood inset
const IW = 176
const IY = 30
const IH = 140

export function SmearedInterfaceSoundSpeedRace() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [nSmear, setNSmear] = useState(8)
  const [rhoL, setRhoL] = useState(998)
  const [running, setRunning] = useState(true)

  const s = useRef({ nSmear, rhoL, running })
  s.current = { nSmear, rhoL, running }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let simT = 0 // microseconds
    let last = -1

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const wood = (a: number, rl: number) => {
      const rm = a * RHO_G + (1 - a) * rl
      const inv = a / (RHO_G * C_G * C_G) + (1 - a) / (rl * C_L * C_L)
      return 1 / Math.sqrt(rm * inv)
    }

    // log-scale mapping for the sound-speed axis
    const CMIN = 8
    const CMAX = 2000
    const cy = (c: number, top: number, hh: number) =>
      top + hh - ((Math.log10(c) - Math.log10(CMIN)) / (Math.log10(CMAX) - Math.log10(CMIN))) * hh

    const draw = (ts: number) => {
      const dt = last < 0 ? 0 : Math.min((ts - last) / 1000, 0.05)
      last = ts
      const st = s.current
      const w = st.nSmear * DX
      const rl = st.rhoL

      const alpha = (x: number) => {
        if (w <= 0) return x < L / 2 ? 1 : 0
        return 0.5 * (1 - Math.tanh((4 * (x - L / 2)) / w))
      }
      const cDiffuse = (x: number) => wood(alpha(x), rl)
      const cSharp = (x: number) => (x < L / 2 ? C_G : C_L)

      // cumulative time of flight, in microseconds
      const xs = new Float64Array(NS + 1)
      const tS = new Float64Array(NS + 1)
      const tD = new Float64Array(NS + 1)
      const h = (XE - XS) / NS
      for (let i = 0; i <= NS; i++) xs[i] = XS + i * h
      for (let i = 1; i <= NS; i++) {
        const xm = 0.5 * (xs[i - 1] + xs[i])
        tS[i] = tS[i - 1] + (h / cSharp(xm)) * 1e6
        tD[i] = tD[i - 1] + (h / cDiffuse(xm)) * 1e6
      }
      const arrS = tS[NS]
      const arrD = tD[NS]

      const rate = Math.max(arrS, arrD) / 3.4 // finish the slower one in ~3.4 s
      if (st.running) simT += dt * rate
      if (simT > Math.max(arrS, arrD) * 1.12) simT = 0

      const posOf = (tab: Float64Array) => {
        if (simT >= tab[NS]) return XE
        let lo = 0
        let hi = NS
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1
          if (tab[mid] <= simT) lo = mid
          else hi = mid
        }
        const f = (simT - tab[lo]) / Math.max(tab[hi] - tab[lo], 1e-12)
        return xs[lo] + f * h
      }
      const posS = posOf(tS)
      const posD = posOf(tD)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ================================================= c(x) profile panel
      const px = (x: number) => PX + (x / L) * PW
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.lineWidth = 1
      for (const c of [10, 100, 1000]) {
        ctx.beginPath()
        ctx.moveTo(PX, cy(c, PY, PH))
        ctx.lineTo(PX + PW, cy(c, PY, PH))
        ctx.stroke()
        text(`${c}`, 14, cy(c, PY, PH) + 4, '#64748b')
      }
      text('c [m/s]', 8, PY - 10, '#94a3b8')
      text('x', PX + PW - 8, PY + PH + 16, '#94a3b8')

      // smear band
      if (w > 0) {
        ctx.fillStyle = 'rgba(248,113,113,0.10)'
        ctx.fillRect(px(L / 2 - w / 2), PY, (w / L) * PW, PH)
      }

      const profile = (f: (x: number) => number, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 0; i <= 300; i++) {
          const x = (i / 300) * L
          const y = cy(Math.max(f(x), CMIN), PY, PH)
          if (i === 0) ctx.moveTo(px(x), y)
          else ctx.lineTo(px(x), y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      profile(cSharp, '#94a3b8', [5, 4])
      profile(cDiffuse, '#22d3ee', [])

      const dot = (x: number, f: (q: number) => number, col: string) => {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(px(x), cy(Math.max(f(x), CMIN), PY, PH), 4.5, 0, Math.PI * 2)
        ctx.fill()
      }
      dot(posS, cSharp, '#e2e8f0')
      dot(posD, cDiffuse, '#f87171')

      text('gas', PX + 6, PY + 14, '#64748b')
      text('liquid', PX + PW - 40, PY + 14, '#64748b')
      text('sharp', PX + 6, PY + PH - 18, '#94a3b8')
      text('Wood mixture', PX + 6, PY + PH - 5, '#22d3ee')

      // ================================================= Wood curve inset
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.strokeRect(IX, IY, IW, IH)
      text('c_m vs gas fraction α', IX, IY - 10, '#94a3b8')
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      let cMin = Infinity
      let aMin = 0
      for (let i = 0; i <= 200; i++) {
        const a = i / 200
        const c = wood(a, rl)
        if (c < cMin) {
          cMin = c
          aMin = a
        }
        const X = IX + a * IW
        const Y = cy(Math.max(c, CMIN), IY, IH)
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()
      ctx.fillStyle = '#f87171'
      ctx.beginPath()
      ctx.arc(IX + aMin * IW, cy(Math.max(cMin, CMIN), IY, IH), 4, 0, Math.PI * 2)
      ctx.fill()
      text(`min ${cMin.toFixed(1)} m/s @ α=${aMin.toFixed(2)}`, IX + 4, IY + IH - 6, '#f87171')
      text('α=0 (liquid)', IX + 4, IY + 14, '#64748b')
      text('α=1', IX + IW - 30, IY + 14, '#64748b')

      // ================================================= race tracks
      const trackX = PX
      const trackW = W - PX - 16
      const tx = (x: number) => trackX + ((x - XS) / (XE - XS)) * trackW
      const lane = (y: number, pos: number, col: string, label: string, done: boolean, tArr: number) => {
        ctx.fillStyle = 'rgba(148,163,184,0.14)'
        ctx.fillRect(trackX, y, trackW, 14)
        ctx.fillStyle = col
        ctx.fillRect(trackX, y, tx(pos) - trackX, 14)
        ctx.strokeStyle = 'rgba(248,250,252,0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(trackX + trackW, y - 3)
        ctx.lineTo(trackX + trackW, y + 17)
        ctx.stroke()
        text(label, 6, y + 11, col)
        text(done ? `arrived  ${tArr.toFixed(1)} µs` : `${simT.toFixed(1)} µs`, tx(pos) + 6, y + 11, '#cbd5e1')
      }
      text('same domain, same two materials — who gets there first?', trackX, 208, '#e2e8f0')
      lane(220, posS, '#94a3b8', 'sharp', posS >= XE - 1e-9, arrS)
      lane(252, posD, '#22d3ee', 'smeared', posD >= XE - 1e-9, arrD)

      // ================================================= readouts
      const rY = 306
      const LH = 15
      text(
        `smear width n = ${st.nSmear} cells = ${(w * 1e3).toFixed(2)} mm   (grid ${NCELL} cells over ${(L * 1e3).toFixed(0)} mm)`,
        PX,
        rY,
        '#e2e8f0'
      )
      text(
        `slowest cell in the band: c = ${cMin.toFixed(1)} m/s   —  gas ${C_G} m/s, liquid ${C_L} m/s`,
        PX,
        rY + LH,
        '#f87171'
      )
      text(
        `time of flight:  sharp ${arrS.toFixed(2)} µs   smeared ${arrD.toFixed(2)} µs   →  ${((arrD / arrS - 1) * 100).toFixed(1)} % late`,
        PX,
        rY + 2 * LH,
        '#22d3ee'
      )
      text(
        `acoustic CFL in the band would need Δt ≤ Δx/c = ${((DX / cMin) * 1e9).toFixed(0)} ns`,
        PX,
        rY + 3 * LH,
        '#fbbf24'
      )
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#22d3ee' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.8rem',
          alignItems: 'center',
          marginTop: '0.7rem',
          fontSize: 13,
          color: '#cbd5e1',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          smear n
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={nSmear}
            onChange={(e) => setNSmear(parseInt(e.target.value, 10))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 54 }}>
            {nSmear} cells
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ρ_liquid
          <input
            type="range"
            min={50}
            max={1200}
            step={10}
            value={rhoL}
            onChange={(e) => setRhoL(parseInt(e.target.value, 10))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 70 }}>
            {rhoL} kg/m³
          </span>
        </label>

        <button onClick={() => setRunning((v) => !v)} style={btn(running)}>
          {running ? '❚❚ pause' : '▶ play'}
        </button>
      </div>

      <p
        style={{
          fontSize: 12,
          color: '#94a3b8',
          marginTop: '0.5rem',
          fontFamily: 'ui-monospace, monospace',
          lineHeight: 1.55,
        }}
      >
        What to watch: at n = 0 the two lanes are the same run. Pull n up to 8 cells — a width any capturing scheme
        reaches within a few hundred steps — and the cyan curve digs a hole down to ~24 m/s that neither material has,
        so the smeared signal falls behind and arrives late. Drop ρ_liquid and the hole fills in: the dip is driven by
        the density ratio, not by the sound speeds. The yellow line is the bill an explicit solver pays for that hole.
      </p>
    </div>
  )
}
