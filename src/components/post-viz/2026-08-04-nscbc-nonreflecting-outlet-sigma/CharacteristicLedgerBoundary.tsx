'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// How many boundary conditions is a boundary allowed to have? Not a matter of
// taste - count the characteristics.
//
// The 1D Euler system carries five wave families:
//
//   L1  u - c   acoustic, upstream-running
//   L2  u       entropy
//   L3  u       transverse momentum u2
//   L4  u       transverse momentum u3
//   L5  u + c   acoustic, downstream-running
//
// At a given boundary each family either LEAVES the domain (its amplitude is
// computable from interior points) or ENTERS it (its amplitude is not in the
// solution at all and must be supplied). The number of entering families is
// exactly the number of physical boundary conditions the problem admits.
//
// Slide the Mach number across +-1 and the count jumps. That jump is why an
// outlet that works at M = 0.3 blows up at M = 1.2 with the same code.
// ---------------------------------------------------------------------------

const W = 690
const H = 430

const BX = 56
const BY = 30
const BW = 380
const BH = 250

const TMAX = 1.15 // transit times shown on the vertical axis
const SPACING = 0.17

type Side = 'right' | 'left'

type Family = { key: string; label: string; speed: (m: number) => number; color: string; dy: number }

const FAMILIES: Family[] = [
  { key: 'L1', label: 'L1   u - c   acoustic', speed: (m) => m - 1, color: '#f472b6', dy: 0 },
  { key: 'L2', label: 'L2   u       entropy', speed: (m) => m, color: '#fbbf24', dy: -0.012 },
  { key: 'L3', label: 'L3   u       u2', speed: (m) => m, color: '#a78bfa', dy: 0 },
  { key: 'L4', label: 'L4   u       u3', speed: (m) => m, color: '#f0abfc', dy: 0.012 },
  { key: 'L5', label: 'L5   u + c   acoustic', speed: (m) => m + 1, color: '#38bdf8', dy: 0 },
]

// a family enters the domain when it points inward at that boundary
function isIncoming(speed: number, side: Side) {
  return side === 'right' ? speed < 0 : speed > 0
}

function regime(m: number, side: Side) {
  const outward = side === 'right' ? m : -m
  if (outward > 1) return 'supersonic outflow'
  if (outward > 0) return 'subsonic outflow'
  if (outward > -1) return 'subsonic inflow'
  return 'supersonic inflow'
}

// what you are actually allowed to impose, in words
function prescription(m: number, side: Side) {
  const outward = side === 'right' ? m : -m
  if (outward > 1) return 'impose nothing - the interior decides everything'
  if (outward > 0) return 'one condition: the static pressure p_inf'
  if (outward > -1) return 'four conditions: u1, u2, u3 and T'
  return 'all five - the whole state is dictated from outside'
}

export function CharacteristicLedgerBoundary() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [mach, setMach] = useState(0.3)
  const [side, setSide] = useState<Side>('right')
  const [running, setRunning] = useState(true)

  const s = useRef({ mach, side, running })
  s.current = { mach, side, running }
  const phase = useRef(0)

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
      if (st.running) phase.current = (phase.current + dt * 0.16) % SPACING

      const m = st.mach
      const px = (x: number) => BX + x * BW
      const py = (t: number) => BY + BH - (t / TMAX) * BH

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // ---------- frame ----------
      ctx.strokeStyle = 'rgba(148,163,184,0.26)'
      ctx.lineWidth = 1
      ctx.strokeRect(BX, BY, BW, BH)
      text('t', BX - 16, BY + 8, '#64748b')
      text('x', BX + BW + 6, BY + BH + 4, '#64748b')
      text('0', BX - 4, BY + BH + 16, '#475569', '10px ui-monospace, monospace')
      text('L', BX + BW - 4, BY + BH + 16, '#475569', '10px ui-monospace, monospace')
      text('interior', BX + BW / 2 - 24, BY + BH + 32, '#64748b', '10px ui-monospace, monospace')

      // ---------- the boundary under study ----------
      const bxPix = side === 'right' ? BX + BW : BX
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(bxPix, BY - 6)
      ctx.lineTo(bxPix, BY + BH + 6)
      ctx.stroke()
      text(
        side === 'right' ? 'boundary x = L' : 'boundary x = 0',
        side === 'right' ? bxPix - 96 : bxPix + 8,
        BY - 12,
        '#e2e8f0',
        'bold 11px ui-monospace, monospace'
      )

      // ---------- characteristics ----------
      ctx.save()
      ctx.beginPath()
      ctx.rect(BX, BY, BW, BH)
      ctx.clip()

      let nIn = 0
      FAMILIES.forEach((fam) => {
        const sp = fam.speed(m)
        const incoming = isIncoming(sp, side)
        if (incoming) nIn += 1
        ctx.strokeStyle = fam.color
        ctx.globalAlpha = incoming ? 0.95 : 0.5
        ctx.lineWidth = incoming ? 2 : 1.3
        ctx.setLineDash(incoming ? [] : [5, 4])

        for (let k = -9; k <= 12; k++) {
          const x0 = k * SPACING + phase.current
          ctx.beginPath()
          ctx.moveTo(px(x0), py(0) + fam.dy * BH)
          ctx.lineTo(px(x0 + sp * TMAX), py(TMAX) + fam.dy * BH)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
        ctx.setLineDash([])
      })
      ctx.restore()

      // ---------- in/out arrows at the boundary ----------
      const dir = side === 'right' ? 1 : -1
      FAMILIES.forEach((fam, k) => {
        const sp = fam.speed(m)
        const incoming = isIncoming(sp, side)
        const y = BY + 22 + k * 12
        const tip = bxPix + dir * (incoming ? -20 : 20)
        const tail = bxPix + dir * (incoming ? 4 : -4)
        ctx.strokeStyle = incoming ? '#f87171' : '#34d399'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(tail, y)
        ctx.lineTo(tip, y)
        ctx.stroke()
        ctx.fillStyle = incoming ? '#f87171' : '#34d399'
        ctx.beginPath()
        ctx.moveTo(tip, y)
        ctx.lineTo(tip + (incoming ? dir * 6 : -dir * 6), y - 3.4)
        ctx.lineTo(tip + (incoming ? dir * 6 : -dir * 6), y + 3.4)
        ctx.closePath()
        ctx.fill()
      })

      // ---------- ledger ----------
      const LX = BX + BW + 62
      text('wave family', LX, BY + 2, '#94a3b8', '10px ui-monospace, monospace')
      text('at this edge', LX + 124, BY + 2, '#94a3b8', '10px ui-monospace, monospace')

      FAMILIES.forEach((fam, k) => {
        const sp = fam.speed(m)
        const incoming = isIncoming(sp, side)
        const y = BY + 22 + k * 26
        ctx.fillStyle = fam.color
        ctx.fillRect(LX, y - 8, 12, 3)
        text(fam.key, LX + 20, y - 4, '#e2e8f0', 'bold 11px ui-monospace, monospace')
        text(fam.label.slice(5), LX + 46, y - 4, '#94a3b8', '10px ui-monospace, monospace')
        text(
          incoming ? 'IN' : 'OUT',
          LX + 124,
          y - 4,
          incoming ? '#f87171' : '#34d399',
          'bold 11px ui-monospace, monospace'
        )
        text(`${sp >= 0 ? '+' : ''}${sp.toFixed(2)} c`, LX + 160, y - 4, '#64748b', '10px ui-monospace, monospace')
      })

      const yBase = BY + 22 + 5 * 26 + 12
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.beginPath()
      ctx.moveTo(LX, yBase - 14)
      ctx.lineTo(LX + 196, yBase - 14)
      ctx.stroke()
      text('incoming', LX, yBase, '#94a3b8', '10px ui-monospace, monospace')
      text(`${nIn}`, LX + 124, yBase, '#f87171', 'bold 13px ui-monospace, monospace')
      text('computable', LX, yBase + 18, '#94a3b8', '10px ui-monospace, monospace')
      text(`${5 - nIn}`, LX + 124, yBase + 18, '#34d399', 'bold 13px ui-monospace, monospace')

      // ---------- verdict strip ----------
      const reg = regime(m, side)
      text(`M = ${m >= 0 ? '+' : ''}${m.toFixed(2)}   ${reg}`, BX, BY + BH + 58, '#e2e8f0', 'bold 13px ui-monospace, monospace')
      text(
        `${nIn} physical condition${nIn === 1 ? '' : 's'} allowed  ->  ${prescription(m, side)}`,
        BX,
        BY + BH + 78,
        nIn === 0 ? '#34d399' : nIn === 5 ? '#f87171' : '#fbbf24',
        '12px ui-monospace, monospace'
      )
      text(
        'solid + red = enters the domain, you must invent its amplitude.  dashed + green = leaves, read it off the interior.',
        BX,
        BY + BH + 98,
        '#64748b',
        '10px ui-monospace, monospace'
      )
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [side])

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
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div style={row}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>Mach M</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.01}
            value={mach}
            onChange={(e) => setMach(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }}>
            {mach >= 0 ? '+' : ''}
            {mach.toFixed(2)}
          </span>
        </label>
        <button onClick={() => setMach(0.3)} style={btn(Math.abs(mach - 0.3) < 1e-9, '#34d399')}>
          M = 0.3
        </button>
        <button onClick={() => setMach(1.4)} style={btn(Math.abs(mach - 1.4) < 1e-9, '#38bdf8')}>
          M = 1.4
        </button>
        <button onClick={() => setMach(-0.3)} style={btn(Math.abs(mach + 0.3) < 1e-9, '#f87171')}>
          M = -0.3
        </button>
      </div>

      <div style={row}>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>boundary</span>
        <button onClick={() => setSide('right')} style={btn(side === 'right')}>
          outlet x = L
        </button>
        <button onClick={() => setSide('left')} style={btn(side === 'left')}>
          inlet x = 0
        </button>
        <button onClick={() => setRunning((v) => !v)} style={btn(running, '#34d399')}>
          {running ? '❚❚ freeze' : '▶ run'}
        </button>
      </div>
    </div>
  )
}
