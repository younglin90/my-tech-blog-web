'use client'

import { useEffect, useRef, useState } from 'react'

// Interactive geometry of the diffusion-flux face decomposition S_f = E_f + T_f
// on a non-orthogonal mesh. The user tilts the cell-center vector d away from the
// face-normal S_f and switches between the minimum / orthogonal / over-relaxed
// choices of the implicit part E_f. Pure SVG-free Canvas drawing.

type Approach = 'min' | 'orth' | 'over'

const LABELS: Record<Approach, string> = {
  min: 'minimum correction',
  orth: 'orthogonal correction',
  over: 'over-relaxed',
}

// length of E_f in units of |S_f|, given the non-orthogonality angle theta (rad)
function implicitLength(approach: Approach, theta: number): number {
  const c = Math.cos(theta)
  if (approach === 'min') return c
  if (approach === 'orth') return 1
  return 1 / c // over-relaxed
}

export function NonOrthogonalFaceDecomposition() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [thetaDeg, setThetaDeg] = useState(35)
  const [approach, setApproach] = useState<Approach>('over')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = 560
    const H = 340
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    canvas.style.height = 'auto'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const theta = (thetaDeg * Math.PI) / 180
    const O = { x: W * 0.42, y: H * 0.56 } // shared face point (origin of vectors)
    const SLEN = 150 // pixels representing |S_f|
    const DLEN = 220 // cell-center distance |d| in pixels (visual only)
    const dhat = { x: Math.cos(theta), y: -Math.sin(theta) } // d points up-right on screen

    // helper to draw an arrow
    const arrow = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      color: string,
      width: number,
      dash: number[] = []
    ) => {
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = width
      ctx.setLineDash(dash)
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.setLineDash([])
      const ang = Math.atan2(to.y - from.y, to.x - from.x)
      const h = 9
      ctx.beginPath()
      ctx.moveTo(to.x, to.y)
      ctx.lineTo(to.x - h * Math.cos(ang - 0.4), to.y - h * Math.sin(ang - 0.4))
      ctx.lineTo(to.x - h * Math.cos(ang + 0.4), to.y - h * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    // cell centers P and N along d
    const P = { x: O.x - (DLEN / 2) * dhat.x, y: O.y - (DLEN / 2) * dhat.y }
    const N = { x: O.x + (DLEN / 2) * dhat.x, y: O.y + (DLEN / 2) * dhat.y }

    // the face: a line through O perpendicular to S_f (i.e. vertical, since S is horizontal)
    ctx.strokeStyle = 'rgba(150,170,190,0.55)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(O.x, O.y - 95)
    ctx.lineTo(O.x, O.y + 95)
    ctx.stroke()
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillStyle = 'rgba(150,170,190,0.85)'
    ctx.fillText('face f', O.x + 6, O.y - 80)

    // d direction (faint dashed) through cell centers
    arrow(P, N, 'rgba(160,180,200,0.45)', 1.5, [6, 5])
    // cell-center dots + labels
    const dot = (pt: { x: number; y: number }, label: string) => {
      ctx.fillStyle = 'rgba(190,205,220,0.95)'
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillText(label, pt.x - 5, pt.y + 20)
    }
    dot(P, 'P')
    dot(N, 'N')

    // S_f : horizontal, gray
    const Stip = { x: O.x + SLEN, y: O.y }
    arrow(O, Stip, 'rgba(180,195,210,0.9)', 2, [])
    ctx.fillStyle = 'rgba(180,195,210,0.95)'
    ctx.font = '13px ui-monospace, monospace'
    ctx.fillText('S_f', Stip.x + 6, Stip.y + 4)

    // E_f : along d, cyan (implicit part)
    const eLen = implicitLength(approach, theta) * SLEN
    const Etip = { x: O.x + eLen * dhat.x, y: O.y + eLen * dhat.y }
    arrow(O, Etip, '#22d3ee', 3, [])
    ctx.fillStyle = '#22d3ee'
    ctx.fillText('E_f (implicit)', Etip.x + 8, Etip.y)

    // T_f : closes the triangle from E tip to S tip, pink (explicit correction)
    arrow(Etip, Stip, '#f472b6', 2.5, [])
    const Tmid = { x: (Etip.x + Stip.x) / 2, y: (Etip.y + Stip.y) / 2 }
    ctx.fillStyle = '#f472b6'
    ctx.fillText('T_f (explicit)', Tmid.x + 8, Tmid.y - 4)

    // angle arc between S and d
    ctx.strokeStyle = 'rgba(245,158,11,0.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(O.x, O.y, 34, 0, -theta, true)
    ctx.stroke()
    ctx.fillStyle = 'rgba(245,158,11,0.95)'
    ctx.fillText(`θ=${thetaDeg}°`, O.x + 40, O.y - 14)
  }, [thetaDeg, approach])

  const theta = (thetaDeg * Math.PI) / 180
  const eFac = implicitLength(approach, theta)
  // |T_f| / |S_f| for each approach (closing-triangle length)
  const tFrac = (a: Approach): number => {
    const e = implicitLength(a, theta)
    // |T|^2 = |S|^2 + |E|^2 - 2 |S||E| cos(theta), with |S|=1
    const v = 1 + e * e - 2 * e * Math.cos(theta)
    return Math.sqrt(Math.max(0, v))
  }
  const rho = (a: Approach): number => tFrac(a) / implicitLength(a, theta)

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
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginTop: 14,
          fontSize: 13,
        }}
      >
        <label>
          non-orthogonality θ = {thetaDeg}°
          <input
            type="range"
            min={0}
            max={75}
            step={1}
            value={thetaDeg}
            onChange={(e) => setThetaDeg(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {(['min', 'orth', 'over'] as Approach[]).map((a) => (
            <button
              key={a}
              onClick={() => setApproach(a)}
              style={{
                padding: '5px 10px',
                fontSize: 12,
                borderRadius: 7,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: approach === a ? '#22d3ee' : 'transparent',
                color: approach === a ? '#08111f' : 'var(--text-muted)',
                fontWeight: approach === a ? 700 : 400,
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12.5,
          marginTop: 14,
          color: 'var(--text-muted)',
          lineHeight: 1.7,
        }}
      >
        <div>
          <strong style={{ color: 'var(--text)' }}>{LABELS[approach]}</strong> &nbsp; |E_f|/|S_f| ={' '}
          <span style={{ color: '#22d3ee' }}>{eFac.toFixed(3)}</span> &nbsp; |T_f|/|S_f| ={' '}
          <span style={{ color: '#f472b6' }}>{tFrac(approach).toFixed(3)}</span>
        </div>
        <div style={{ marginTop: 4 }}>
          explicit/implicit ratio ρ = |T_f|/|E_f| : &nbsp;
          min <span style={{ color: rho('min') >= 1 ? '#f87171' : 'inherit' }}>{rho('min').toFixed(2)}</span> &nbsp;|&nbsp;
          orth <span style={{ color: rho('orth') >= 1 ? '#f87171' : 'inherit' }}>{rho('orth').toFixed(2)}</span> &nbsp;|&nbsp;
          over <span style={{ color: rho('over') >= 1 ? '#f87171' : 'inherit' }}>{rho('over').toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
