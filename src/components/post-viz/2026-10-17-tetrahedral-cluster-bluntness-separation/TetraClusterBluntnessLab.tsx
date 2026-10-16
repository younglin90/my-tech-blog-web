'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const W = 760
const H = 420
const RC = Math.sqrt(6) / 2 // centre circumradius for touching unit spheres
const RV = RC + 1
const T_END = 6
const FACES = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]
// Rough reading of the paper's Fig. 16(a) text: initial polar angle -> terminal V'_T
const CURVE: [number, number][] = [[0, 0.1], [70, 0.7], [90, 0.7], [120, 0.3], [160, 0.5], [180, 0.2]]

type V3 = [number, number, number]
type M3 = number[][]

const BASE: V3[] = (() => {
  const s = (RC * Math.sqrt(8)) / 3
  const out: V3[] = [[-RC, 0, 0]]
  for (const t of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) out.push([RC / 3, s * Math.cos(t), s * Math.sin(t)])
  return out
})()

function mul(A: M3, B: M3): M3 {
  return [0, 1, 2].map((i) => [0, 1, 2].map((j) => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]))
}
function rot(pitch: number, yaw: number, roll: number): M3 {
  const p = (pitch * Math.PI) / 180, y = (yaw * Math.PI) / 180, r = (roll * Math.PI) / 180
  const Ry = [[Math.cos(p), 0, Math.sin(p)], [0, 1, 0], [-Math.sin(p), 0, Math.cos(p)]]
  const Rz = [[Math.cos(y), -Math.sin(y), 0], [Math.sin(y), Math.cos(y), 0], [0, 0, 1]]
  const Rx = [[1, 0, 0], [0, Math.cos(r), -Math.sin(r)], [0, Math.sin(r), Math.cos(r)]]
  return mul(Rx, mul(Rz, Ry))
}
const apply = (R: M3, v: V3): V3 => [0, 1, 2].map((i) => R[i][0] * v[0] + R[i][1] * v[1] + R[i][2] * v[2]) as V3

function vOfTheta(th: number) {
  for (let k = 1; k < CURVE.length; k++) {
    const [t0, v0] = CURVE[k - 1], [t1, v1] = CURVE[k]
    if (th <= t1) return v0 + ((v1 - v0) * (th - t0)) / (t1 - t0)
  }
  return CURVE[CURVE.length - 1][1]
}

function analyse(X: V3[]) {
  const c: V3 = [0, 1, 2].map((i) => X.reduce((s, p) => s + p[i], 0) / 4) as V3
  const d = X.map((p) => [p[0] - c[0], p[1] - c[1], p[2] - c[2]] as V3)
  let B = -1
  for (const [a, b, e] of FACES) {
    const u = [0, 1, 2].map((i) => d[b][i] - d[a][i]), v = [0, 1, 2].map((i) => d[e][i] - d[a][i])
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    if (n[0] * d[a][0] + n[1] * d[a][1] + n[2] * d[a][2] < 0) n = n.map((q) => -q)
    B = Math.max(B, -n[0] / Math.hypot(n[0], n[1], n[2]))
  }
  const w = d.map((q) => (q[0] < 0 ? q[0] * q[0] : 0))
  const sw = w.reduce((s, q) => s + q, 0)
  const ly = w.reduce((s, q, i) => s + q * d[i][1], 0) / sw
  const lz = w.reduce((s, q, i) => s + q * d[i][2], 0) / sw
  const A = Math.hypot(ly, lz) / RV
  const th = d.map((q) => (Math.acos(Math.max(-1, Math.min(1, -q[0] / Math.hypot(q[0], q[1], q[2])))) * 180) / Math.PI)
  const vel = th.map(vOfTheta)
  return { B, A, th, vel, d, mean: vel.reduce((s, q) => s + q, 0) / 4 }
}

function velColor(v: number) {
  const t = Math.max(0, Math.min(1, v / 0.7))
  const r = Math.round(56 + t * (248 - 56)), g = Math.round(189 - t * (189 - 113)), b = Math.round(248 - t * (248 - 113))
  return `rgb(${r},${g},${b})`
}

const PRESETS: { label: string; p: number; y: number }[] = [
  { label: 'vertex-first', p: 0, y: 0 },
  { label: 'paper 36/18', p: 36, y: 18 },
  { label: 'face-first', p: 180, y: 0 },
  { label: 'pitch 90', p: 90, y: 0 },
]

export function TetraClusterBluntnessLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [pitch, setPitch] = useState(36)
  const [yaw, setYaw] = useState(18)
  const [roll, setRoll] = useState(0)
  const [running, setRunning] = useState(false)
  const [tRead, setTRead] = useState(0)
  const tRef = useRef(0)

  const cloud = useMemo(() => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const pts: { B: number; A: number; v: number }[] = []
    for (let k = 0; k < 2500; k++) {
      const g = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd())
      let [w, x, y, z] = [g(), g(), g(), g()]
      const n = Math.hypot(w, x, y, z); w /= n; x /= n; y /= n; z /= n
      const R = [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
      ]
      const a = analyse(BASE.map((p) => apply(R, p)))
      pts.push({ B: a.B, A: a.A, v: a.mean })
    }
    return pts
  }, [])

  const state = useMemo(() => analyse(BASE.map((p) => apply(rot(pitch, yaw, roll), p))), [pitch, yaw, roll])

  useEffect(() => { tRef.current = 0; setTRead(0); setRunning(false) }, [pitch, yaw, roll])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0, last = performance.now()
    const S = analyse(BASE.map((p) => apply(rot(pitch, yaw, roll), p)))

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      if (running && tRef.current < T_END) tRef.current = Math.min(T_END, tRef.current + dt * 1.2)
      const t = tRef.current
      if (++frame % 12 === 0) setTRead(t)

      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      // current sphere positions: lateral expansion at the curve velocity (toy kinematics)
      const pos = S.d.map((q, i) => {
        const l = Math.hypot(q[1], q[2])
        const k = l > 1e-6 ? (S.vel[i] * t * 1.1) / l : 0
        return [q[0] + 0.08 * t * t * Math.cos((S.th[i] * Math.PI) / 180), q[1] * (1 + k), q[2] * (1 + k)] as V3
      })

      // panel 1: side view (flow -> +x)
      const sc = 26, ox = 150, oy = 180
      ctx.fillStyle = '#94a3b8'; ctx.fillText('side view (x-y)', 12, 18)
      ctx.strokeStyle = 'rgba(148,163,184,0.55)'; ctx.lineWidth = 1.2
      for (let k = 0; k < 5; k++) {
        const yy = 70 + k * 55
        ctx.beginPath(); ctx.moveTo(8, yy); ctx.lineTo(36, yy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(36, yy); ctx.lineTo(30, yy - 4); ctx.lineTo(30, yy + 4); ctx.closePath(); ctx.fillStyle = 'rgba(148,163,184,0.55)'; ctx.fill()
      }
      ctx.fillStyle = '#94a3b8'; ctx.fillText('M=20', 6, 352)
      const lead = pos.reduce((m, p) => (p[0] < m[0] ? p : m), pos[0])
      ctx.strokeStyle = 'rgba(251,191,36,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath()
      for (let s = -1; s <= 1.0001; s += 0.05) {
        const yy = s * 6.5, xx = lead[0] - 1.35 + 0.09 * yy * yy
        const X = ox + xx * sc, Y = oy - (lead[1] + yy) * sc
        if (s === -1) ctx.moveTo(X, Y); else ctx.lineTo(X, Y)
      }
      ctx.stroke()
      const order = [0, 1, 2, 3].sort((a, b) => pos[a][2] - pos[b][2])
      for (const i of order) {
        const X = ox + pos[i][0] * sc, Y = oy - pos[i][1] * sc
        ctx.beginPath(); ctx.arc(X, Y, sc, 0, 2 * Math.PI)
        ctx.fillStyle = velColor(S.vel[i]); ctx.globalAlpha = 0.88; ctx.fill(); ctx.globalAlpha = 1
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#0f172a'; ctx.fillText(`${Math.round(S.th[i])}°`, X - 13, Y + 4)
      }

      // panel 2: upstream view (y-z)
      const ux = 390, uy = 120, us = 15
      ctx.fillStyle = '#94a3b8'; ctx.fillText('upstream view (y-z)', 312, 18)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(ux, uy, RV * us, 0, 2 * Math.PI); ctx.stroke()
      const ord2 = [0, 1, 2, 3].sort((a, b) => pos[b][0] - pos[a][0])
      for (const i of ord2) {
        const X = ux + pos[i][1] * us, Y = uy - pos[i][2] * us
        ctx.beginPath(); ctx.arc(X, Y, us, 0, 2 * Math.PI)
        ctx.fillStyle = velColor(S.vel[i]); ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke()
      }
      ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(ux, uy, 2.5, 0, 2 * Math.PI); ctx.fill()

      // panel 3: A-B map
      const mx0 = 520, mx1 = 740, my0 = 30, my1 = 190
      const bx = (B: number) => mx0 + ((B - 1 / 3) / (2 / 3)) * (mx1 - mx0)
      const ay = (A: number) => my1 - (A / 0.4) * (my1 - my0)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.strokeRect(mx0, my0, mx1 - mx0, my1 - my0)
      for (const p of cloud) { ctx.fillStyle = velColor(p.v); ctx.globalAlpha = 0.35; ctx.fillRect(bx(p.B) - 1, ay(p.A) - 1, 2, 2) }
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(bx(S.B), ay(S.A), 6, 0, 2 * Math.PI); ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('bluntness B', 600, 206); ctx.fillText('1/3', mx0 - 8, 206); ctx.fillText('1', mx1 - 4, 206)
      ctx.save(); ctx.translate(506, 150); ctx.rotate(-Math.PI / 2); ctx.fillText('asymmetry A', 0, 0); ctx.restore()
      ctx.fillText('0.4', mx0 - 26, my0 + 4); ctx.fillText('0', mx0 - 12, my1 + 4)
      ctx.fillText('2500 random attitudes', mx0 + 4, my0 - 8)

      // panel 4: polar angle curve
      const cx0 = 300, cx1 = 740, cy0 = 245, cy1 = 395
      const tx = (th: number) => cx0 + (th / 180) * (cx1 - cx0)
      const vy = (v: number) => cy1 - (v / 0.8) * (cy1 - cy0)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0)
      ctx.fillStyle = 'rgba(251,191,36,0.08)'; ctx.fillRect(tx(60), cy0, tx(90) - tx(60), cy1 - cy0)
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.beginPath()
      CURVE.forEach(([th, v], k) => (k ? ctx.lineTo(tx(th), vy(v)) : ctx.moveTo(tx(th), vy(v))))
      ctx.stroke()
      S.th.forEach((th, i) => {
        ctx.beginPath(); ctx.arc(tx(th), vy(S.vel[i]), 6, 0, 2 * Math.PI)
        ctx.fillStyle = velColor(S.vel[i]); ctx.fill(); ctx.strokeStyle = '#0f172a'; ctx.stroke()
      })
      ctx.strokeStyle = '#e2e8f0'; ctx.setLineDash([5, 4]); ctx.beginPath()
      ctx.moveTo(cx0, vy(S.mean)); ctx.lineTo(cx1, vy(S.mean)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = '#94a3b8'
      ctx.fillText("V'_T vs initial polar angle θ0 (sketch of paper Fig. 16a)", cx0, cy0 - 8)
      for (const th of [0, 45, 90, 135, 180]) ctx.fillText(`${th}°`, tx(th) - 10, cy1 + 14)
      ctx.fillText('0.8', cx0 - 26, cy0 + 4); ctx.fillText('0', cx0 - 12, cy1 + 4)
      ctx.fillText('shock-surfing band', tx(60) + 2, cy0 + 14)
      ctx.fillStyle = '#e2e8f0'; ctx.fillText(`cluster mean ${S.mean.toFixed(3)}`, cx1 - 150, vy(S.mean) - 6)

      // time bar
      ctx.fillStyle = '#94a3b8'; ctx.fillText(`t' = ${t.toFixed(2)} / ${T_END}`, 12, 400)
      ctx.fillStyle = 'rgba(56,189,248,0.6)'; ctx.fillRect(110, 392, (t / T_END) * 160, 8)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.strokeRect(110, 392, 160, 8)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [pitch, yaw, roll, running, cloud])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const symmetricTrap = state.B < 0.36 && state.A < 0.02
  const kind = state.B < 0.45 ? 'slender (single leading sphere)' : state.B > 0.85 ? 'blunt (face into the flow)' : 'intermediate'

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
        <label>pitch {pitch}°<input type="range" min={-90} max={180} step={1} value={pitch} onChange={(e) => setPitch(+e.target.value)} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></label>
        <label>yaw {yaw}°<input type="range" min={0} max={180} step={1} value={yaw} onChange={(e) => setYaw(+e.target.value)} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></label>
        <label>roll {roll}°<input type="range" min={0} max={120} step={1} value={roll} onChange={(e) => setRoll(+e.target.value)} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {PRESETS.map((p) => (
          <button key={p.label} style={btn(pitch === p.p && yaw === p.y)} onClick={() => { setPitch(p.p); setYaw(p.y); setRoll(0) }}>{p.label}</button>
        ))}
        <button style={btn(running)} onClick={() => { if (tRef.current >= T_END) tRef.current = 0; setRunning((v) => !v) }}>{running ? 'pause' : 'release'}</button>
        <button style={btn(false)} onClick={() => { tRef.current = 0; setTRead(0); setRunning(false) }}>reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <div>B = {state.B.toFixed(3)} · A = {state.A.toFixed(3)} · {kind}</div>
        <div>θ0 = [{state.th.map((q) => q.toFixed(1)).join(', ')}]° · V'_i (sketch) = [{state.vel.map((q) => q.toFixed(2)).join(', ')}] · t' = {tRead.toFixed(1)}</div>
        <div style={{ color: symmetricTrap ? '#f87171' : '#94a3b8' }}>
          {symmetricTrap
            ? 'paper: this symmetric vertex-first cluster did not separate at all — contact forces balanced the rear spheres. The polar-angle sketch misses it.'
            : 'color = sketch V\'_T (blue slow → red fast). Roll leaves B, A and θ0 unchanged.'}
        </div>
      </div>
    </div>
  )
}
