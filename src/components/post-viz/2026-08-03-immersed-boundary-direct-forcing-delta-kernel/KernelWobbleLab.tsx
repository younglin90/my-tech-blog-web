'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// What a discrete delta kernel has to satisfy, and what breaks when it doesn't.
//
//   zeroth moment   sum_i phi(r - i)         = 1   -> total force is conserved
//   first  moment   sum_i (i - r) phi(r - i) = 0   -> the force lands in place
//   grid invariance sum_i phi(r - i)^2       = C   -> the force does not pump
//                                                     as the marker slides
//
// The first two hold for every kernel below. The third is the one that separates
// them: the 2-point hat has sum phi^2 swinging between 0.50 and 1.00 across a
// single cell, so a moving body feels a force that oscillates at the grid
// frequency. Roma's 3-point kernel pins it at 1/2, Peskin's 4-point at 3/8.
// ---------------------------------------------------------------------------

const W = 690
const H = 438

const AX = 58 // node axis geometry
const AY = 150
const CELL = 64 // px per grid cell
const NODES = 9 // nodes drawn, index -4 .. +4

const PX = 58 // lower plot geometry
const PY = 250
const PW = W - PX - 150
const PH = 132

type KernelId = 'hat2' | 'roma3' | 'peskin4'

const KERNELS: Record<KernelId, { label: string; support: number; color: string; phi: (r: number) => number }> = {
  hat2: {
    label: '2-point hat',
    support: 1,
    color: '#f87171',
    phi: (r) => {
      const a = Math.abs(r)
      return a <= 1 ? 1 - a : 0
    },
  },
  roma3: {
    label: '3-point Roma',
    support: 1.5,
    color: '#38bdf8',
    phi: (r) => {
      const a = Math.abs(r)
      if (a <= 0.5) return (1 + Math.sqrt(1 - 3 * a * a)) / 3
      if (a <= 1.5) return (5 - 3 * a - Math.sqrt(1 - 3 * (1 - a) * (1 - a))) / 6
      return 0
    },
  },
  peskin4: {
    label: '4-point Peskin',
    support: 2,
    color: '#fbbf24',
    phi: (r) => {
      const a = Math.abs(r)
      if (a <= 1) return (3 - 2 * a + Math.sqrt(1 + 4 * a - 4 * a * a)) / 8
      if (a <= 2) return (5 - 2 * a - Math.sqrt(-7 + 12 * a - 4 * a * a)) / 8
      return 0
    },
  },
}

// sum phi, sum (i - r) phi, sum phi^2 for a marker sitting at fractional node r
function moments(id: KernelId, r: number) {
  const { phi } = KERNELS[id]
  let m0 = 0
  let m1 = 0
  let m2 = 0
  for (let i = -5; i <= 5; i++) {
    const w = phi(r - i)
    m0 += w
    m1 += (i - r) * w
    m2 += w * w
  }
  return { m0, m1, m2 }
}

export function KernelWobbleLab() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [kernel, setKernel] = useState<KernelId>('peskin4')
  const [pos, setPos] = useState(0.35) // marker offset inside the cell, in [0,1)
  const [running, setRunning] = useState(true)

  const s = useRef({ kernel, pos, running })
  s.current = { kernel, pos, running }
  const drag = useRef(false)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let last = -1

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const draw = (ts: number) => {
      const dt = last < 0 ? 0 : Math.min((ts - last) / 1000, 0.05)
      last = ts
      const st = s.current
      const K = KERNELS[st.kernel]

      if (st.running && !drag.current) {
        const next = (st.pos + dt * 0.32) % 1
        s.current.pos = next
        setPos(next)
      }
      const r = s.current.pos

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const mid = Math.floor(NODES / 2)
      const nodeX = (i: number) => AX + i * CELL
      const markerX = nodeX(mid + r)

      // ---------- Eulerian node axis ----------
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(AX - 18, AY)
      ctx.lineTo(AX + (NODES - 1) * CELL + 18, AY)
      ctx.stroke()

      const { m0, m1, m2 } = moments(st.kernel, r)

      for (let i = 0; i < NODES; i++) {
        const x = nodeX(i)
        const w = K.phi(r + mid - i)
        ctx.strokeStyle = 'rgba(148,163,184,0.22)'
        ctx.beginPath()
        ctx.moveTo(x, AY - 84)
        ctx.lineTo(x, AY + 8)
        ctx.stroke()

        if (w > 1e-4) {
          const bh = w * 78
          ctx.fillStyle = K.color
          ctx.globalAlpha = 0.82
          ctx.fillRect(x - 15, AY - bh, 30, bh)
          ctx.globalAlpha = 1
          text(w.toFixed(3), x - 15, AY - bh - 7, '#e2e8f0', '10px ui-monospace, monospace')
        }
        ctx.fillStyle = w > 1e-4 ? '#e2e8f0' : '#475569'
        ctx.beginPath()
        ctx.arc(x, AY, 3.2, 0, Math.PI * 2)
        ctx.fill()
        text(`${i - mid}`, x - 4, AY + 21, '#64748b', '10px ui-monospace, monospace')
      }
      text('x / h', AX + (NODES - 1) * CELL + 24, AY + 4, '#64748b')

      // support width bracket
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(markerX - K.support * CELL, AY + 32)
      ctx.lineTo(markerX + K.support * CELL, AY + 32)
      ctx.stroke()
      ctx.setLineDash([])
      text(`support ${2 * K.support}h`, markerX - 30, AY + 46, '#94a3b8', '10px ui-monospace, monospace')

      // ---------- the Lagrangian marker ----------
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.moveTo(markerX, AY - 5)
      ctx.lineTo(markerX - 7, AY - 19)
      ctx.lineTo(markerX + 7, AY - 19)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(248,250,252,0.65)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(markerX, AY - 96)
      ctx.lineTo(markerX, AY + 30)
      ctx.stroke()
      text('marker X', markerX + 10, AY + 63, '#f8fafc', 'bold 11px ui-monospace, monospace')

      // ---------- moment readouts ----------
      const rows: [string, string, boolean][] = [
        ['sum phi           (zeroth moment)', m0.toFixed(4), Math.abs(m0 - 1) < 1e-6],
        ['sum (i - X/h) phi (first moment)', (Math.abs(m1) < 1e-9 ? 0 : m1).toFixed(4), Math.abs(m1) < 1e-6],
        ['sum phi^2         (grid invariance)', m2.toFixed(4), false],
      ]
      rows.forEach(([label, val, ok], k) => {
        const y = 22 + k * 17
        text(label, AX - 46, y, '#94a3b8')
        text(val, AX + 252, y, ok ? '#34d399' : K.color, 'bold 11px ui-monospace, monospace')
        if (ok) text('locked', AX + 316, y, '#34d399', '10px ui-monospace, monospace')
      })

      // ---------- sum phi^2 across one cell ----------
      const px = (t: number) => PX + t * PW
      const lo = 0.3
      const hi = 1.05
      const py = (v: number) => PY + PH - ((v - lo) / (hi - lo)) * PH

      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(PX, PY, PW, PH)
      for (const gv of [0.375, 0.5, 0.75, 1.0]) {
        ctx.strokeStyle = 'rgba(148,163,184,0.14)'
        ctx.beginPath()
        ctx.moveTo(PX, py(gv))
        ctx.lineTo(PX + PW, py(gv))
        ctx.stroke()
        text(gv.toFixed(3), PX - 42, py(gv) + 4, '#475569', '10px ui-monospace, monospace')
      }

      // all three curves, the inactive ones ghosted for comparison
      ;(Object.keys(KERNELS) as KernelId[]).forEach((id) => {
        const active = id === st.kernel
        ctx.strokeStyle = KERNELS[id].color
        ctx.globalAlpha = active ? 1 : 0.22
        ctx.lineWidth = active ? 2.4 : 1.2
        ctx.beginPath()
        for (let k = 0; k <= 120; k++) {
          const t = k / 120
          const v = moments(id, t).m2
          if (k === 0) ctx.moveTo(px(t), py(v))
          else ctx.lineTo(px(t), py(v))
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      })

      // live dot
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.arc(px(r), py(m2), 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(248,250,252,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px(r), PY)
      ctx.lineTo(px(r), PY + PH)
      ctx.stroke()

      text('sum phi^2', PX - 46, PY - 10, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text('0', PX - 3, PY + PH + 15, '#475569', '10px ui-monospace, monospace')
      text('1', PX + PW - 3, PY + PH + 15, '#475569', '10px ui-monospace, monospace')
      text('marker position within one cell', PX + PW / 2 - 84, PY + PH + 30, '#64748b')

      // legend + verdict
      ;(Object.keys(KERNELS) as KernelId[]).forEach((id, k) => {
        const y = PY + 16 + k * 18
        ctx.fillStyle = KERNELS[id].color
        ctx.globalAlpha = id === st.kernel ? 1 : 0.35
        ctx.fillRect(PX + PW + 16, y - 8, 16, 3)
        ctx.globalAlpha = 1
        text(KERNELS[id].label, PX + PW + 38, y - 4, id === st.kernel ? '#e2e8f0' : '#64748b')
      })

      const swing = (() => {
        let mn = Infinity
        let mx = -Infinity
        for (let k = 0; k <= 120; k++) {
          const v = moments(st.kernel, k / 120).m2
          mn = Math.min(mn, v)
          mx = Math.max(mx, v)
        }
        return (mx - mn) / mn
      })()

      text(
        swing < 1e-3
          ? 'flat: a body sliding across the grid feels a steady force'
          : `swings ${(swing * 100).toFixed(0)}% per cell: the force pumps as the body slides`,
        PX,
        PY + PH + 50,
        swing < 1e-3 ? '#34d399' : '#f87171',
        'bold 12px ui-monospace, monospace'
      )
      ctx.font = '11px ui-monospace, monospace'
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const pointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = ref.current
    if (!cv) return
    const rect = cv.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * W
    const mid = Math.floor(NODES / 2)
    const t = (cx - AX) / CELL - mid
    const clamped = Math.min(0.999, Math.max(0, t))
    s.current.pos = clamped
    setPos(clamped)
  }

  const btn = (active: boolean, col = '#fbbf24'): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? col : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.7rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onPointerDown={(e) => {
          drag.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          pointer(e)
        }}
        onPointerMove={(e) => {
          if (drag.current) pointer(e)
        }}
        onPointerUp={() => {
          drag.current = false
        }}
        onPointerCancel={() => {
          drag.current = false
        }}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
          cursor: 'ew-resize',
          touchAction: 'none',
        }}
      />

      <div style={row}>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>kernel</span>
        {(Object.keys(KERNELS) as KernelId[]).map((id) => (
          <button key={id} onClick={() => setKernel(id)} style={btn(kernel === id, KERNELS[id].color)}>
            {KERNELS[id].label}
          </button>
        ))}
        <button onClick={() => setRunning((v) => !v)} style={btn(running, '#34d399')}>
          {running ? '❚❚ slide' : '▶ slide'}
        </button>
      </div>

      <div style={row}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          marker X/h
          <input
            type="range"
            min={0}
            max={0.999}
            step={0.001}
            value={pos}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              s.current.pos = v
              setPos(v)
              setRunning(false)
            }}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }}>
            {pos.toFixed(3)}
          </span>
        </label>
        <span style={{ color: '#64748b', fontSize: 12 }}>drag on the canvas to move the marker</span>
      </div>
    </div>
  )
}
