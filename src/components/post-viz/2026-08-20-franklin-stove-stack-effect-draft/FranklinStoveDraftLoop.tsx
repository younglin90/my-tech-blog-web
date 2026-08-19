'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Franklin's 1741 stove sends the flue gas UP over a baffle, DOWN a back
// channel, and only then up the chimney. The chimney top never moves, so the
// net elevation gain is the same either way -- and yet the draft falls.
//
// Reason: buoyancy head is bought per metre at the LOCAL gas density.
//   dp = (rho_amb - rho(z)) * g * dz
// The descent is spent while the gas is still hot (large negative term), and
// the metre given back at the top is bought with gas that has already dumped
// its heat into the room. Push the down-leg far enough, or let the fire cool,
// and the loop can no longer pull enough through the mouth -- smoke spills.
//
// Everything below solves the same loop balance as the article's Python:
// march the gas, sum the head, balance it against the losses, take the upper
// (stable) root in mdot.
// ---------------------------------------------------------------------------

const W = 726
const H = 436

const G = 9.81
const R_AIR = 287
const CP = 1100
const T_AMB = 283
const P_ATM = 101325
const D_FLUE = 0.15
const A_FLUE = (Math.PI * D_FLUE * D_FLUE) / 4
const PERIM = Math.PI * D_FLUE
const F_DARCY = 0.03
const K_MINOR = 3
const U_STACK = 5
const Z_TOP = 7
const Z_BAFFLE = 0.8
const A_MOUTH = 0.12
const V_SPILL = 0.25

const FLOOR = 392
const SCALE = 48
const yOf = (z: number) => FLOOR - z * SCALE
const X_RISE = 118
const X_DOWN = 168
const X_STACK = 220

const rhoOf = (T: number) => P_ATM / (R_AIR * T)
const MDOT_SPILL = rhoOf(T_AMB) * A_MOUTH * V_SPILL

type Leg = { head: number; T: number[] }
type Sol = { mdot: number; legs: Leg[]; head: number; loss: number; Texit: number; stalled: boolean }

const NS = 40

/** March the gas along rise / descent / chimney at a trial mdot. */
function marchFlue(mdot: number, hDown: number, tFire: number, uRoom: number): Sol {
  const spec: [number, number, number][] = [
    [Z_BAFFLE, +1, uRoom],
    [hDown, -1, uRoom],
    [Z_TOP - Z_BAFFLE + hDown, +1, U_STACK],
  ]
  const rhoA = rhoOf(T_AMB)
  let T = tFire
  let loss = 0
  const legs: Leg[] = []
  for (const [L, sgn, U] of spec) {
    const samples = [T]
    let head = 0
    if (L > 1e-9) {
      const ds = L / NS
      for (let k = 0; k < NS; k++) {
        const Tn = T_AMB + (T - T_AMB) * Math.exp((-U * PERIM * ds) / (mdot * CP))
        const rho = rhoOf(0.5 * (T + Tn))
        head += (rhoA - rho) * G * sgn * ds
        loss += ((F_DARCY / D_FLUE) * 0.5 * mdot * mdot * ds) / (rho * A_FLUE * A_FLUE)
        T = Tn
        samples.push(T)
      }
    }
    legs.push({ head, T: samples })
  }
  loss += (K_MINOR * 0.5 * mdot * mdot) / (rhoOf(T) * A_FLUE * A_FLUE)
  const head = legs[0].head + legs[1].head + legs[2].head
  return { mdot, legs, head, loss, Texit: T, stalled: false }
}

/** Upper (stable) root of head = loss. */
function solveLoop(hDown: number, tFire: number, uRoom: number): Sol {
  const lo = 2e-3
  const hi = 0.3
  const n = 56
  let best = -1e9
  let bestM = lo
  for (let i = 0; i < n; i++) {
    const m = lo * Math.pow(hi / lo, i / (n - 1))
    const s = marchFlue(m, hDown, tFire, uRoom)
    if (s.head - s.loss > best) {
      best = s.head - s.loss
      bestM = m
    }
  }
  if (best <= 0) {
    const s = marchFlue(lo, hDown, tFire, uRoom)
    return { ...s, mdot: 0, stalled: true }
  }
  let a = bestM
  let b = hi
  for (let k = 0; k < 32; k++) {
    const m = 0.5 * (a + b)
    const s = marchFlue(m, hDown, tFire, uRoom)
    if (s.head - s.loss > 0) a = m
    else b = m
  }
  const s = marchFlue(0.5 * (a + b), hDown, tFire, uRoom)
  return { ...s, stalled: s.mdot < MDOT_SPILL }
}

/** Polyline of each leg in canvas pixels, for drawing and for the particles. */
function legPaths(hDown: number) {
  const zBot = Z_BAFFLE - hDown
  return [
    [
      [X_RISE, yOf(0.1)],
      [X_RISE, yOf(Z_BAFFLE)],
      [X_DOWN, yOf(Z_BAFFLE)],
    ],
    hDown > 1e-6
      ? [
          [X_DOWN, yOf(Z_BAFFLE)],
          [X_DOWN, yOf(zBot)],
          [X_STACK, yOf(zBot)],
        ]
      : [
          [X_DOWN, yOf(Z_BAFFLE)],
          [X_STACK, yOf(Z_BAFFLE)],
        ],
    [
      [X_STACK, yOf(zBot)],
      [X_STACK, yOf(Z_TOP)],
    ],
  ] as number[][][]
}

function polyLength(pts: number[][]) {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return L
}

function polyAt(pts: number[][], f: number): [number, number] {
  const total = polyLength(pts)
  let want = Math.max(0, Math.min(1, f)) * total
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    if (want <= seg || i === pts.length - 1) {
      const t = seg < 1e-9 ? 0 : want / seg
      return [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])]
    }
    want -= seg
  }
  return [pts[0][0], pts[0][1]]
}

function heatColor(T: number, alpha = 1) {
  const t = Math.max(0, Math.min(1, (T - T_AMB) / 420))
  const r = Math.round(120 + 135 * t)
  const g = Math.round(130 - 20 * t + 70 * t * t)
  const b = Math.round(150 - 130 * t)
  return `rgba(${r},${g},${b},${alpha})`
}

export function FranklinStoveDraftLoop() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [hDown, setHDown] = useState(0.8)
  const [tFire, setTFire] = useState(600)
  const [uRoom, setURoom] = useState(40)

  const sol = useMemo(() => solveLoop(hDown, tFire, uRoom), [hDown, tFire, uRoom])
  const paths = useMemo(() => legPaths(hDown), [hDown])

  const live = useRef({ sol, paths, hDown })
  live.current = { sol, paths, hDown }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    // particle = { leg, f } walking the flue; spill particles drift in the room
    const puffs = Array.from({ length: 26 }, (_, i) => ({ leg: 0, f: i / 26 }))
    const spill = Array.from({ length: 18 }, () => ({ x: 0, y: 0, age: 99, vx: 0, vy: 0 }))

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const { sol: s, paths: P, hDown: hd } = live.current

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- room + masonry ----
      ctx.fillStyle = 'rgba(30,41,59,0.55)'
      ctx.fillRect(40, yOf(2.9), 250, 2.9 * SCALE)
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(40, yOf(2.9), 250, 2.9 * SCALE)
      text('ROOM  10 C', 48, yOf(2.9) + 16, '#64748b')
      ctx.fillStyle = 'rgba(71,85,105,0.45)'
      ctx.fillRect(X_STACK - 22, yOf(Z_TOP), 44, Z_TOP * SCALE)
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(X_STACK - 22, yOf(Z_TOP), 44, Z_TOP * SCALE)

      // height ticks
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      for (let z = 0; z <= 7; z++) {
        ctx.beginPath()
        ctx.moveTo(24, yOf(z))
        ctx.lineTo(32, yOf(z))
        ctx.stroke()
        if (z % 2 === 0) text(`${z}m`, 4, yOf(z) + 4, '#64748b', '10px ui-monospace, monospace')
      }

      // ---- duct walls, tinted by local gas temperature ----
      for (let i = 0; i < 3; i++) {
        const pts = P[i]
        const Ts = s.legs[i].T
        ctx.lineWidth = 13
        ctx.lineCap = 'round'
        const n = 24
        for (let k = 0; k < n; k++) {
          const [x0, y0] = polyAt(pts, k / n)
          const [x1, y1] = polyAt(pts, (k + 1) / n)
          const T = Ts[Math.min(Ts.length - 1, Math.round(((k + 0.5) / n) * (Ts.length - 1)))]
          ctx.strokeStyle = heatColor(T, 0.5)
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
          ctx.stroke()
        }
        ctx.lineWidth = 1
      }

      // baffle plate + fire
      ctx.fillStyle = 'rgba(148,163,184,0.5)'
      ctx.fillRect(X_RISE + 14, yOf(Z_BAFFLE) - 4, X_DOWN - X_RISE - 20, 5)
      text('baffle', X_RISE + 12, yOf(Z_BAFFLE) - 10, '#94a3b8', '10px ui-monospace, monospace')
      const flame = 8 + 6 * Math.sin(now / 90)
      ctx.fillStyle = heatColor(tFireRef(s), 0.85)
      ctx.beginPath()
      ctx.ellipse(X_RISE, yOf(0.12), 13, flame, 0, 0, 2 * Math.PI)
      ctx.fill()
      text('fire', X_RISE - 12, FLOOR + 16, '#94a3b8', '10px ui-monospace, monospace')

      // mouth
      ctx.strokeStyle = s.stalled ? '#f87171' : 'rgba(148,163,184,0.6)'
      ctx.beginPath()
      ctx.moveTo(X_RISE - 34, yOf(0.05))
      ctx.lineTo(X_RISE - 34, yOf(0.75))
      ctx.stroke()
      text('mouth', X_RISE - 66, yOf(0.4), s.stalled ? '#f87171' : '#94a3b8', '10px ui-monospace, monospace')

      // down-leg bracket
      if (hd > 0.01) {
        ctx.strokeStyle = '#f87171'
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(X_DOWN + 12, yOf(Z_BAFFLE))
        ctx.lineTo(X_DOWN + 12, yOf(Z_BAFFLE - hd))
        ctx.stroke()
        ctx.setLineDash([])
        text(`h_down ${hd.toFixed(2)} m`, X_DOWN + 18, yOf(Z_BAFFLE - hd / 2), '#f87171', '10px ui-monospace, monospace')
      }

      // ---- flue particles ----
      const lens = P.map(polyLength)
      for (const p of puffs) {
        const Ts = s.legs[p.leg].T
        const idx = Math.min(Ts.length - 1, Math.round(p.f * (Ts.length - 1)))
        const T = Ts[idx]
        const v = s.mdot / (rhoOf(T) * A_FLUE) // m/s
        p.f += (v * 17 * dt) / Math.max(1, lens[p.leg])
        while (p.f >= 1) {
          p.f -= 1
          p.leg = (p.leg + 1) % 3
        }
        const [x, y] = polyAt(P[p.leg], p.f)
        ctx.fillStyle = heatColor(T, 0.95)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      }

      // ---- spill into the room when the loop cannot hold the mouth ----
      if (s.stalled) {
        for (const q of spill) {
          q.age += dt
          if (q.age > 2.4) {
            q.age = 0
            q.x = X_RISE - 30
            q.y = yOf(0.55 + 0.2 * Math.sin(now / 200))
            q.vx = -22 - 14 * Math.random()
            q.vy = -16 - 12 * Math.random()
          }
          q.x += q.vx * dt
          q.y += q.vy * dt
          ctx.fillStyle = `rgba(248,113,113,${Math.max(0, 0.6 - q.age / 4)})`
          ctx.beginPath()
          ctx.arc(q.x, q.y, 3 + q.age * 2, 0, 2 * Math.PI)
          ctx.fill()
        }
        ctx.fillStyle = 'rgba(248,113,113,0.18)'
        ctx.fillRect(46, yOf(2.75), 150, 26)
        ctx.strokeStyle = '#f87171'
        ctx.strokeRect(46, yOf(2.75), 150, 26)
        text('SMOKE SPILLS INTO ROOM', 54, yOf(2.75) + 17, '#f87171', 'bold 10px ui-monospace, monospace')
      }

      // ---- ledger panel ----
      const PX0 = 330
      text('BUOYANCY LEDGER', PX0, 30, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text('dp = (rho_amb - rho) g dz , paid per metre', PX0, 48, '#64748b')

      const bars: [string, number, string][] = [
        ['rise to baffle', s.legs[0].head, '#34d399'],
        ['descent', s.legs[1].head, '#f87171'],
        ['chimney', s.legs[2].head, '#34d399'],
      ]
      const zeroX = PX0 + 130
      const span = 200
      const scaleP = span / 50
      let by = 74
      for (const [lbl, val, col] of bars) {
        text(lbl, PX0, by + 11, '#94a3b8')
        ctx.fillStyle = 'rgba(148,163,184,0.12)'
        ctx.fillRect(PX0 + 100, by, 260, 15)
        const w = Math.abs(val) * scaleP
        ctx.fillStyle = col
        if (val >= 0) ctx.fillRect(zeroX, by + 2, Math.max(1, w), 11)
        else ctx.fillRect(zeroX - Math.max(1, w), by + 2, Math.max(1, w), 11)
        text(`${val >= 0 ? '+' : ''}${val.toFixed(2)} Pa`, PX0 + 300, by + 11, col, 'bold 11px ui-monospace, monospace')
        by += 26
      }
      ctx.strokeStyle = 'rgba(226,232,240,0.45)'
      ctx.beginPath()
      ctx.moveTo(zeroX, 70)
      ctx.lineTo(zeroX, by - 4)
      ctx.stroke()

      by += 6
      text('net draft', PX0, by + 11, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      ctx.fillStyle = 'rgba(56,189,248,0.2)'
      ctx.fillRect(PX0 + 100, by, 260, 15)
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(PX0 + 100, by + 2, Math.max(1, Math.min(260, (s.head / 55) * 260)), 11)
      text(`${s.head.toFixed(2)} Pa`, PX0 + 300, by + 11, '#38bdf8', 'bold 11px ui-monospace, monospace')

      // mass flow vs spill threshold
      by += 44
      text('MOUTH CHECK', PX0, by, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      by += 14
      const gauge = 260
      ctx.fillStyle = 'rgba(148,163,184,0.12)'
      ctx.fillRect(PX0, by, gauge, 16)
      const thr = (MDOT_SPILL / 0.09) * gauge
      ctx.fillStyle = s.stalled ? '#f87171' : '#34d399'
      ctx.fillRect(PX0, by + 2, Math.max(1, Math.min(gauge, (s.mdot / 0.09) * gauge)), 12)
      ctx.strokeStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(PX0 + thr, by - 4)
      ctx.lineTo(PX0 + thr, by + 20)
      ctx.stroke()
      text('spill limit', PX0 + thr - 22, by + 33, '#fbbf24', '10px ui-monospace, monospace')
      text(`mdot ${s.mdot.toFixed(4)} kg/s`, PX0, by - 22, s.stalled ? '#f87171' : '#34d399', 'bold 11px ui-monospace, monospace')

      by += 54
      const row2 = (lbl: string, v: string, col: string) => {
        text(lbl, PX0, by, '#94a3b8')
        text(v, PX0 + 150, by, col, 'bold 11px ui-monospace, monospace')
        by += 19
      }
      row2('flue exit temp', `${s.Texit.toFixed(0)} K`, '#e2e8f0')
      row2('exit velocity', `${(s.mdot / (rhoOf(s.Texit) * A_FLUE)).toFixed(2)} m/s`, '#e2e8f0')
      row2('chimney top', `${Z_TOP.toFixed(1)} m  (fixed)`, '#94a3b8')
      row2('path length', `${(Z_TOP + 2 * hd).toFixed(2)} m`, '#94a3b8')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 56 }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={rowS}>
        <label style={label}>
          <span style={name}>down-leg h_down</span>
          <input type="range" min={0} max={1.2} step={0.05} value={hDown} onChange={(e) => setHDown(parseFloat(e.target.value))} />
          <span style={mono}>{hDown.toFixed(2)} m</span>
        </label>
        <label style={label}>
          <span style={name}>fire temp</span>
          <input type="range" min={320} max={800} step={5} value={tFire} onChange={(e) => setTFire(parseFloat(e.target.value))} />
          <span style={mono}>{tFire.toFixed(0)} K</span>
        </label>
        <label style={label}>
          <span style={name}>room heat pickup U</span>
          <input type="range" min={5} max={70} step={1} value={uRoom} onChange={(e) => setURoom(parseFloat(e.target.value))} />
          <span style={mono}>{uRoom.toFixed(0)}</span>
        </label>
      </div>

      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        The chimney top stays at 7 m however you drag <em>down-leg</em>, so the elevation gained never changes — but the red bar
        grows and the net draft falls, because the descent is paid for with the hottest, lightest gas. Now drag <em>fire temp</em>
        down: the mouth gauge crosses the amber spill limit far earlier with a deep down-leg than with none.
      </div>
    </div>
  )
}

/** Inlet temperature of the first leg, i.e. what the fire is delivering. */
function tFireRef(s: Sol) {
  return s.legs[0].T[0]
}
