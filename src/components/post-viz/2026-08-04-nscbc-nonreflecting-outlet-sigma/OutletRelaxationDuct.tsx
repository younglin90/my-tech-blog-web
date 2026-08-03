'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A duct closed at the left, open at the right. Linear acoustics only, so the
// state splits exactly into two characteristic amplitudes:
//
//   A+ = p' + rho c u'   travels right at +c   (outgoing at the outlet)
//   A- = p' - rho c u'   travels left  at -c   (incoming at the outlet)
//
// With dt = dx / c both are shifted exactly one cell per step, so nothing here
// is smeared by numerical diffusion - every wiggle on screen is the boundary
// condition talking, not the scheme.
//
// The outlet is the whole point. A- comes from outside the domain, so it has to
// be invented. NSCBC invents it with one relaxation law:
//
//   dA-/dt = -K (p_b - p_inf),      K = sigma (1 - M^2) c / L
//
//   sigma = 0     A- frozen -> zero reflection, but the mean pressure is never
//                 pulled back to p_inf: whatever offset a source builds simply
//                 stays there.
//   sigma large   p_b pinned to p_inf, and the same stiffness throws acoustic
//                 energy back into the domain.
// ---------------------------------------------------------------------------

const W = 690
const H = 470

const N = 240 // cells; dt = dx = 1/N with c = 1
const DX = 1 / N

// wave profile panel
const PX = 54
const PY = 34
const PW = W - PX - 116
const PH = 168

// boundary-pressure history panel
const HX = PX
const HY = 268
const HW = PW
const HH = 108
const HIST = 460

const PULSE_X0 = 0.3
const PULSE_W = 0.09

type Outlet = 'nscbc' | 'fixed'

type Field = {
  ap: Float64Array
  am: Float64Array
  amB: number // the invented incoming amplitude held at the outlet
  hist: Float64Array
  hn: number
  incident: number
  reflected: number
  armed: boolean // a pulse is in flight, so reflection is worth measuring
  age: number
}

function blank(): Field {
  return {
    ap: new Float64Array(N),
    am: new Float64Array(N),
    amB: 0,
    hist: new Float64Array(HIST),
    hn: 0,
    incident: 0,
    reflected: 0,
    armed: false,
    age: 0,
  }
}

// one exact-shift step of the two characteristic families
function advance(f: Field, sigma: number, source: number, outlet: Outlet) {
  const { ap, am } = f
  const K = sigma // (1 - M^2) c / L with M = 0, c = 1, L = 1

  for (let i = N - 1; i > 0; i--) ap[i] = ap[i - 1]
  ap[0] = 0
  for (let i = 0; i < N - 1; i++) am[i] = am[i + 1]

  // ---- the outlet: A- has to come from somewhere ----
  const pb = 0.5 * (ap[N - 1] + am[N - 1])
  if (outlet === 'fixed') {
    am[N - 1] = -ap[N - 1] // pressure nailed to p_inf: a perfect mirror
    f.amB = am[N - 1]
  } else {
    f.amB -= DX * K * pb // dt = DX
    am[N - 1] = f.amB
  }

  // ---- closed end at x = 0: u = 0 means A+ = A- ----
  ap[0] = am[0]

  // ---- uniform pressure source (weak heat release) ----
  if (source !== 0) {
    const dp = source * DX
    for (let i = 0; i < N; i++) {
      ap[i] += dp
      am[i] += dp
    }
  }

  f.age += 1
  f.hist[f.hn % HIST] = 0.5 * (ap[N - 1] + am[N - 1])
  f.hn += 1

  // Reflection is measured only after the pulse has had time to reach the outlet.
  // The source contribution to A- is exactly linear in i: a cell picks up q*dt on
  // every step since it left the boundary, and it moves one cell per step. So a
  // least-squares line removes the source exactly and leaves the reflected bump.
  if (f.armed && f.age > 0.85 * N) {
    const M = N - 8
    let si = 0
    let sv = 0
    let sii = 0
    let siv = 0
    for (let i = 0; i < M; i++) {
      si += i
      sv += am[i]
      sii += i * i
      siv += i * am[i]
    }
    const den = M * sii - si * si
    const slope = den !== 0 ? (M * siv - si * sv) / den : 0
    const icpt = (sv - slope * si) / M
    let mx = 0
    for (let i = 0; i < M; i++) {
      const v = Math.abs(am[i] - (slope * i + icpt))
      if (v > mx) mx = v
    }
    if (mx > f.reflected) f.reflected = mx
  }
}

export function OutletRelaxationDuct() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [sigma, setSigma] = useState(0)
  const [source, setSource] = useState(0.3)
  const [outlet, setOutlet] = useState<Outlet>('nscbc')
  const [running, setRunning] = useState(true)

  const field = useRef<Field>(blank())
  const s = useRef({ sigma, source, outlet, running })
  s.current = { sigma, source, outlet, running }
  const fire = useRef(false)
  const clear = useRef(false)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const draw = () => {
      const st = s.current
      const f = field.current

      if (clear.current) {
        field.current = blank()
        clear.current = false
      }
      if (fire.current) {
        const g = field.current
        for (let i = 0; i < N; i++) {
          const x = (i + 0.5) * DX
          g.ap[i] += Math.exp(-(((x - PULSE_X0) / PULSE_W) ** 2))
        }
        g.incident = 1
        g.reflected = 0
        g.armed = true
        g.age = 0
        fire.current = false
      }

      const fld = field.current
      if (st.running) {
        for (let k = 0; k < 3; k++) advance(fld, st.sigma, st.source, st.outlet)
      }

      const { ap, am } = fld

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // ================= wave profile =================
      const lo = -1.15
      const hi = 1.35
      const wx = (x: number) => PX + x * PW
      const wy = (v: number) => PY + PH - ((v - lo) / (hi - lo)) * PH

      ctx.strokeStyle = 'rgba(148,163,184,0.26)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX, PY, PW, PH)
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(PX, wy(0))
      ctx.lineTo(PX + PW, wy(0))
      ctx.stroke()
      ctx.setLineDash([])
      text("p' = p_inf", PX + PW + 8, wy(0) + 4, '#64748b', '10px ui-monospace, monospace')

      // closed end
      ctx.fillStyle = 'rgba(148,163,184,0.35)'
      ctx.fillRect(PX - 7, PY, 7, PH)
      text('closed', PX - 46, PY + PH + 15, '#94a3b8', '10px ui-monospace, monospace')
      text('end u=0', PX - 46, PY + PH + 27, '#94a3b8', '10px ui-monospace, monospace')

      // the outlet
      ctx.strokeStyle = st.outlet === 'fixed' ? '#f87171' : '#fbbf24'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.moveTo(PX + PW, PY)
      ctx.lineTo(PX + PW, PY + PH)
      ctx.stroke()
      text('OUTLET', PX + PW + 8, PY - 8, st.outlet === 'fixed' ? '#f87171' : '#fbbf24', 'bold 11px ui-monospace, monospace')

      const curve = (arr: Float64Array, col: string, wdt: number, alpha: number) => {
        ctx.strokeStyle = col
        ctx.lineWidth = wdt
        ctx.globalAlpha = alpha
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const x = wx((i + 0.5) * DX)
          const y = wy(Math.max(lo, Math.min(hi, arr[i])))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // A+ and A- separately: the red curve IS the reflection
      curve(ap, '#38bdf8', 1.6, 0.55)
      curve(am, '#f87171', 1.6, 0.85)

      const p = new Float64Array(N)
      for (let i = 0; i < N; i++) p[i] = 0.5 * (ap[i] + am[i])
      curve(p, '#e2e8f0', 2.2, 1)

      const legend: [string, string][] = [
        ["p'  (what a probe reads)", '#e2e8f0'],
        ['A+  outgoing, moves right', '#38bdf8'],
        ['A-  incoming, moves left', '#f87171'],
      ]
      legend.forEach(([lab, col], k) => {
        const y = PY + 16 + k * 16
        ctx.fillStyle = col
        ctx.fillRect(PX + 12, y - 8, 14, 3)
        text(lab, PX + 32, y - 4, col === '#e2e8f0' ? '#cbd5e1' : col, '10px ui-monospace, monospace')
      })
      text('x / L', PX + PW / 2 - 12, PY + PH + 18, '#64748b', '10px ui-monospace, monospace')

      // ================= boundary pressure history =================
      const hlo = -0.42
      const hhi = 0.42
      const hxp = (k: number) => HX + (k / (HIST - 1)) * HW
      const hyp = (v: number) => HY + HH - ((Math.max(hlo, Math.min(hhi, v)) - hlo) / (hhi - hlo)) * HH

      ctx.strokeStyle = 'rgba(148,163,184,0.26)'
      ctx.lineWidth = 1
      ctx.strokeRect(HX, HY, HW, HH)
      ctx.strokeStyle = 'rgba(52,211,153,0.55)'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(HX, hyp(0))
      ctx.lineTo(HX + HW, hyp(0))
      ctx.stroke()
      ctx.setLineDash([])
      text('p_inf', HX + HW + 8, hyp(0) + 4, '#34d399', '10px ui-monospace, monospace')
      text('outlet pressure', HX - 46, HY - 8, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text('history  ->  time', HX + HW - 96, HY - 8, '#64748b', '10px ui-monospace, monospace')

      const total = fld.hn
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      const shown = Math.min(total, HIST)
      for (let k = 0; k < shown; k++) {
        const idx = (total - shown + k) % HIST
        const x = hxp(k + (HIST - shown))
        const y = hyp(fld.hist[idx])
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // ================= readouts =================
      let mean = 0
      for (let i = 0; i < N; i++) mean += p[i]
      mean /= N
      const K = st.outlet === 'fixed' ? Infinity : st.sigma
      const R = fld.incident > 0 ? fld.reflected / fld.incident : 0

      const rows: [string, string, string][] = [
        ['sigma', st.outlet === 'fixed' ? 'inf' : st.sigma.toFixed(2), '#fbbf24'],
        ['K = sigma c / L', K === Infinity ? 'inf' : K.toFixed(2), '#fbbf24'],
        [
          'reflected / incident',
          fld.armed ? `${(R * 100).toFixed(1)} %` : '-- fire a pulse',
          R > 0.2 ? '#f87171' : R > 0.05 ? '#fbbf24' : '#34d399',
        ],
        [
          'mean p - p_inf',
          mean.toFixed(4),
          Math.abs(mean) > 0.05 ? '#f87171' : Math.abs(mean) > 0.01 ? '#fbbf24' : '#34d399',
        ],
      ]
      rows.forEach(([lab, val, col], k) => {
        const y = HY + HH + 30 + k * 17
        text(lab, HX, y, '#94a3b8')
        text(val, HX + 168, y, col, 'bold 11px ui-monospace, monospace')
      })

      const verdict =
        st.outlet === 'fixed'
          ? 'p is nailed to p_inf and every wave comes straight back: a mirror'
          : st.sigma < 0.02
            ? 'no reflection at all - but the source offset just sits there, unanchored'
            : st.sigma < 1.5
              ? 'pressure pulled back to p_inf, almost nothing bounces: the useful window'
              : 'p_inf held hard, and the outlet now throws energy back inside'
      const vcol = st.outlet === 'fixed' || st.sigma > 1.5 ? '#f87171' : st.sigma < 0.02 ? '#fbbf24' : '#34d399'
      text(verdict, HX, HY + HH + 30 + 4 * 17 + 6, vcol, 'bold 12px ui-monospace, monospace')
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

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

  const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 42 }

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
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>sigma</span>
          <input
            type="range"
            min={0}
            max={15}
            step={0.05}
            value={sigma}
            onChange={(e) => {
              setSigma(parseFloat(e.target.value))
              setOutlet('nscbc')
            }}
          />
          <span style={mono}>{sigma.toFixed(2)}</span>
        </label>
        <button onClick={() => { setSigma(0); setOutlet('nscbc') }} style={btn(outlet === 'nscbc' && sigma === 0, '#38bdf8')}>
          sigma = 0
        </button>
        <button onClick={() => { setSigma(0.25); setOutlet('nscbc') }} style={btn(outlet === 'nscbc' && sigma === 0.25, '#34d399')}>
          sigma = 0.25
        </button>
        <button onClick={() => setOutlet('fixed')} style={btn(outlet === 'fixed', '#f87171')}>
          p fixed (mirror)
        </button>
      </div>

      <div style={row}>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>source q</span>
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={source}
            onChange={(e) => setSource(parseFloat(e.target.value))}
          />
          <span style={mono}>{source.toFixed(2)}</span>
        </label>
        <button onClick={() => { fire.current = true }} style={btn(false, '#38bdf8')}>
          ▶ fire pulse
        </button>
        <button onClick={() => { clear.current = true }} style={btn(false)}>
          ↺ reset
        </button>
        <button onClick={() => setRunning((v) => !v)} style={btn(running, '#34d399')}>
          {running ? '❚❚ pause' : '▶ run'}
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        fire a pulse and watch the red curve at the outlet — that is the reflection. then drop sigma to 0 and
        watch the white curve settle above p_inf instead of returning to it.
      </div>
    </div>
  )
}
