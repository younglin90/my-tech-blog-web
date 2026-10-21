'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 400
const R = 8.314462618
const P0 = 101325
const N = 70
const RX = {
  dissoc: { name: 'AlO + M <=> Al + O + M', DH: 487.7e3, DS: 107.2, dn: 1 },
  shuffle: { name: 'Al + O2 <=> AlO + O', DH: 10.7e3, DS: 9.8, dn: 0 },
}
type RxKey = keyof typeof RX
const MODES = ['Kc (correct)', 'Kp as Kc, SI', 'Kp as Kc, CGS'] as const
const MODE_COL = ['#34d399', '#fbbf24', '#f87171']

function kp(rx: RxKey, T: number) {
  const r = RX[rx]
  return Math.exp(r.DS / R - r.DH / (R * T))
}
function kcTrue(rx: RxKey, T: number) {
  return kp(rx, T) * Math.pow(P0 / (R * T), RX[rx].dn)
}
function kcUsed(rx: RxKey, T: number, mode: number) {
  if (mode === 0) return kcTrue(rx, T)
  if (mode === 1) return kp(rx, T)
  return kp(rx, T) * Math.pow(1e6, RX[rx].dn)
}
// equilibrium extent alpha for 1% reactant in Ar at pressure p
function alphaEq(rx: RxKey, K: number, T: number, pAtm: number) {
  if (RX[rx].dn === 0) { const s = Math.sqrt(K); return s / (1 + s) }
  const c0 = (0.01 * pAtm * P0) / (R * T)
  const xi = (-K + Math.sqrt(K * K + 4 * K * c0)) / 2
  return xi / c0
}

type Unit = { x: number; y: number; vx: number; vy: number; ox: number; oy: number; split: boolean }

export function AlOBondUnitBoxLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [T, setT] = useState(3000)
  const [logP, setLogP] = useState(0)
  const [mode, setMode] = useState(2)
  const [rx, setRx] = useState<RxKey>('dissoc')
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [frac, setFrac] = useState(0)
  const live = useRef({ T, pAtm: 1, mode, rx, playing })
  live.current = { T, pAtm: Math.pow(10, logP), mode, rx, playing }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const bx = 20, by = 40, bw = 330, bh = 320
    const units: Unit[] = Array.from({ length: N }, () => ({
      x: bx + 15 + Math.random() * (bw - 30), y: by + 15 + Math.random() * (bh - 30),
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, ox: 0, oy: 0, split: false,
    }))
    units.forEach((u) => { u.ox = u.x + 6; u.oy = u.y })
    let raf = 0, frame = 0
    const clampIn = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

    const loop = () => {
      const L = live.current
      const aTrue = alphaEq(L.rx, kcTrue(L.rx, L.T), L.T, L.pAtm)
      const aUsed = alphaEq(L.rx, kcUsed(L.rx, L.T, L.mode), L.T, L.pAtm)
      const target = Math.min(0.999, Math.max(0.001, aUsed))
      const k1 = 0.02, k2 = (k1 * (1 - target)) / target
      const sp = 0.6 + (L.T - 2000) / 2000
      if (L.playing) {
        for (const u of units) {
          u.vx += (Math.random() - 0.5) * 0.4; u.vy += (Math.random() - 0.5) * 0.4
          const v = Math.hypot(u.vx, u.vy) || 1
          u.vx *= sp / v; u.vy *= sp / v
          u.x += u.vx; u.y += u.vy
          if (u.x < bx + 8 || u.x > bx + bw - 8) u.vx *= -1
          if (u.y < by + 8 || u.y > by + bh - 8) u.vy *= -1
          u.x = clampIn(u.x, bx + 8, bx + bw - 8); u.y = clampIn(u.y, by + 8, by + bh - 8)
          if (u.split) {
            u.ox = clampIn(u.ox + (Math.random() - 0.5) * 3 * sp - u.vx * 0.5, bx + 6, bx + bw - 6)
            u.oy = clampIn(u.oy + (Math.random() - 0.5) * 3 * sp - u.vy * 0.5, by + 6, by + bh - 6)
            if (Math.random() < Math.min(1, k2)) u.split = false
          } else {
            u.ox += (u.x + 6 - u.ox) * 0.3; u.oy += (u.y - u.oy) * 0.3
            if (Math.random() < k1) u.split = true
          }
        }
      }
      const nSplit = units.reduce((s, u) => s + (u.split ? 1 : 0), 0)

      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(`${RX[L.rx].name}   (dn = ${RX[L.rx].dn})`, bx, 22)
      ctx.strokeStyle = 'rgba(203,213,225,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh)
      for (const u of units) {
        if (!u.split) {
          ctx.strokeStyle = 'rgba(203,213,225,0.7)'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(u.ox, u.oy); ctx.stroke()
        }
        ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(u.x, u.y, 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = u.split ? '#f87171' : '#fb7185'; ctx.beginPath(); ctx.arc(u.ox, u.oy, 3.5, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = '#94a3b8'; ctx.fillText('grey: Al   red: O   line: bound (AlO / reactant)', bx, by + bh + 22)

      // K axis (log10)
      const ax = 400, aw = 340, ay = 90
      const lo = -8, hi = 4
      const X = (v: number) => ax + (aw * (Math.log10(Math.max(v, 1e-12)) - lo)) / (hi - lo)
      ctx.strokeStyle = 'rgba(203,213,225,0.6)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + aw, ay); ctx.stroke()
      for (let e = lo; e <= hi; e += 2) {
        ctx.fillStyle = '#64748b'; ctx.fillText(`1e${e}`, X(Math.pow(10, e)) - 12, ay + 16)
        ctx.beginPath(); ctx.moveTo(X(Math.pow(10, e)), ay - 4); ctx.lineTo(X(Math.pow(10, e)), ay + 4); ctx.stroke()
      }
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('equilibrium constant (log scale)', ax, ay - 46)
      const marks: [string, number, string, number][] = [
        ['Kp', kp(L.rx, L.T), '#94a3b8', -30],
        ['Kc true', kcTrue(L.rx, L.T), MODE_COL[0], -16],
        ['Kc used', kcUsed(L.rx, L.T, L.mode), MODE_COL[L.mode], 30],
      ]
      for (const [lab, v, col, dy] of marks) {
        ctx.strokeStyle = col; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(X(v), ay); ctx.lineTo(X(v), ay + (dy > 0 ? dy - 10 : dy + 4)); ctx.stroke()
        ctx.fillStyle = col; ctx.fillText(`${lab} ${v.toExponential(2)}`, Math.min(X(v) - 20, ax + aw - 120), ay + dy + (dy > 0 ? 4 : 0))
      }
      const fac = Math.pow(P0 / (R * L.T), RX[L.rx].dn)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(`(p0/RT)^dn = ${fac.toExponential(3)}  [mol/m^3]^dn`, ax, ay + 62)
      ctx.fillText(`Kc used / Kc true = ${(kcUsed(L.rx, L.T, L.mode) / kcTrue(L.rx, L.T)).toExponential(2)}`, ax, ay + 80)

      // alpha bars
      const gy = 220, gw = 300
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('reaction extent alpha (dn=+1: dissociated fraction)', ax, gy - 10)
      const bars: [string, number, string][] = [
        ['true eq.', aTrue, MODE_COL[0]], ['this code', aUsed, MODE_COL[L.mode]], ['box (live)', nSplit / N, '#e2e8f0'],
      ]
      bars.forEach(([lab, v, col], i) => {
        const y = gy + i * 32
        ctx.strokeStyle = 'rgba(203,213,225,0.35)'; ctx.strokeRect(ax + 80, y, gw - 40, 18)
        ctx.fillStyle = col; ctx.fillRect(ax + 80, y, (gw - 40) * v, 18)
        ctx.fillStyle = '#cbd5e1'; ctx.fillText(lab, ax, y + 13); ctx.fillText(v.toFixed(3), ax + gw + 46, y + 13)
      })
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(`T = ${L.T} K   p = ${L.pAtm.toFixed(2)} atm   1% in Ar`, ax, gy + 112)

      if (++frame % 12 === 0) setFrac(nSplit / N)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [nonce])

  const btn = (on: boolean, col = '#38bdf8'): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? col : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.12)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const pAtm = Math.pow(10, logP)
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center', fontSize: 13 }}>
        {MODES.map((m, i) => (
          <button key={m} style={btn(mode === i, MODE_COL[i])} onClick={() => setMode(i)}>{m}</button>
        ))}
        <button style={btn(rx === 'dissoc')} onClick={() => setRx('dissoc')}>dn = +1 (AlO dissociation)</button>
        <button style={btn(rx === 'shuffle')} onClick={() => setRx('shuffle')}>dn = 0 (Al + O2)</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8, alignItems: 'center', fontSize: 13 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
        <label>T = {T} K{' '}
          <input type="range" min={2000} max={4000} step={50} value={T} onChange={(e) => setT(+e.target.value)} />
        </label>
        <label>p = {pAtm.toFixed(2)} atm{' '}
          <input type="range" min={-1} max={1} step={0.05} value={logP} onChange={(e) => setLogP(+e.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, fontFamily: 'ui-monospace, monospace', opacity: 0.85 }}>
        box alpha = {frac.toFixed(3)} — with dn = 0 all three buttons give the same box; with dn = +1 the CGS reading floods it with free atoms
      </div>
    </div>
  )
}
