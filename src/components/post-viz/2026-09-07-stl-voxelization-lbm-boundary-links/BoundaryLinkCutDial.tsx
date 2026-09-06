'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// What a wall does to the D2Q9 links of a 5x5 voxel patch.
//
//   phi(v) = n . (v - c) / s - offset      phi > 0 is solid
//   a link v -> v + e_i is CUT when phi flips sign along it
//   q_i = |I - v| / |e_i| s                (I = the intersection point)
//
//   F  fluid voxel, no cut link
//   FB fluid voxel owning at least one intersection point
//   B  solid voxel still reachable from a fluid voxel
//   G  solid voxel with no fluid link left -> ghost, dropped from the sweep
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const PL = 26
const PT = 30
const PS = 372
const NG = 5
const CS = PS / NG // voxel side in pixels

const RX = 428
const RR = 744

const COL_F = '#1d4ed8'
const COL_FB = '#38bdf8'
const COL_B = '#f97316'
const COL_G = '#64748b'
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.28)'

// D2Q9 lattice directions, e_0 is the rest particle and carries no link
const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const DIRNAME = ['0', 'E', 'N', 'W', 'S', 'NE', 'NW', 'SW', 'SE']

type Voxel = { i: number; j: number; phi: number; cut: number[]; kind: 'F' | 'FB' | 'B' | 'G' }

function classifyPatch(angDeg: number, off: number): Voxel[] {
  const a = (angDeg * Math.PI) / 180
  const nx = Math.cos(a)
  const ny = Math.sin(a)
  const mid = (NG - 1) / 2
  const phiAt = (i: number, j: number) => nx * (i - mid) + ny * (j - mid) - off

  const out: Voxel[] = []
  for (let j = 0; j < NG; j++) {
    for (let i = 0; i < NG; i++) {
      const p = phiAt(i, j)
      const cut: number[] = new Array(9).fill(-1)
      let nFluidNb = 0
      for (let k = 1; k < 9; k++) {
        const ii = i + EX[k]
        const jj = j + EY[k]
        if (ii < 0 || ii >= NG || jj < 0 || jj >= NG) continue
        const pn = phiAt(ii, jj)
        if (pn <= 0) nFluidNb++
        if (p > 0 !== pn > 0) {
          const t = p / (p - pn) // fraction of the link before the wall
          cut[k] = t * Math.hypot(EX[k], EY[k])
        }
      }
      const nCut = cut.filter((v) => v >= 0).length
      let kind: Voxel['kind']
      if (p > 0) kind = nFluidNb > 0 ? 'B' : 'G'
      else kind = nCut > 0 ? 'FB' : 'F'
      out.push({ i, j, phi: p, cut, kind })
    }
  }
  return out
}

const FILL: Record<Voxel['kind'], string> = {
  F: 'rgba(29,78,216,0.38)',
  FB: 'rgba(56,189,248,0.30)',
  B: 'rgba(249,115,22,0.42)',
  G: 'rgba(100,116,139,0.30)',
}
const EDGE: Record<Voxel['kind'], string> = { F: COL_F, FB: COL_FB, B: COL_B, G: COL_G }

export function BoundaryLinkCutDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ang, setAng] = useState(63)
  const [off, setOff] = useState(0.4)
  const [sweep, setSweep] = useState(true)
  const [showQ, setShowQ] = useState(true)
  const [read, setRead] = useState({ off: 0.4, F: 0, FB: 0, B: 0, G: 0 })

  const st = useRef({ ang, off, sweep, showQ })
  st.current = { ang, off, sweep, showQ }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let t = 0
    let dyn = st.current.off

    const CX = (i: number) => PL + (i + 0.5) * CS
    const CY = (j: number) => PT + PS - (j + 0.5) * CS

    const draw = () => {
      const s = st.current
      const offNow = s.sweep ? dyn : s.off
      const vox = classifyPatch(s.ang, offNow)

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('D2Q9 links of a 5 x 5 patch against one wall', PL, 18)

      // voxels
      for (const v of vox) {
        const x = PL + v.i * CS
        const y = PT + PS - (v.j + 1) * CS
        ctx.fillStyle = FILL[v.kind]
        ctx.fillRect(x + 1, y + 1, CS - 2, CS - 2)
        ctx.strokeStyle = `${EDGE[v.kind]}88`
        ctx.lineWidth = 1
        ctx.strokeRect(x + 1.5, y + 1.5, CS - 3, CS - 3)
        ctx.fillStyle = EDGE[v.kind]
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(v.kind, x + 5, y + 14)
      }

      // uncut links, drawn faintly so the lattice is visible
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      for (const v of vox) {
        for (let k = 1; k < 9; k++) {
          const ii = v.i + EX[k]
          const jj = v.j + EY[k]
          if (ii < 0 || ii >= NG || jj < 0 || jj >= NG) continue
          if (v.cut[k] >= 0) continue
          ctx.beginPath()
          ctx.moveTo(CX(v.i), CY(v.j))
          ctx.lineTo(CX(ii), CY(jj))
          ctx.stroke()
        }
      }

      // the wall
      const a = (s.ang * Math.PI) / 180
      const nx = Math.cos(a)
      const ny = Math.sin(a)
      const mid = (NG - 1) / 2
      const px = mid + nx * offNow
      const py = mid + ny * offNow
      const tx = -ny
      const ty = nx
      ctx.beginPath()
      ctx.moveTo(CX(px - 6 * tx), CY(py - 6 * ty))
      ctx.lineTo(CX(px + 6 * tx), CY(py + 6 * ty))
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.stroke()

      // cut links from fluid side + their intersection points
      const pulse = (t % 60) / 60
      for (const v of vox) {
        if (v.phi > 0) continue
        for (let k = 1; k < 9; k++) {
          const qv = v.cut[k]
          if (qv < 0) continue
          const x0 = CX(v.i)
          const y0 = CY(v.j)
          const x1 = CX(v.i + EX[k])
          const y1 = CY(v.j + EY[k])
          const len = Math.hypot(EX[k], EY[k])
          const f = qv / len
          const ix = x0 + f * (x1 - x0)
          const iy = y0 + f * (y1 - y0)
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(ix, iy)
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 1.8
          ctx.stroke()
          // a population walking down the link, turned back at I
          const g = pulse < 0.5 ? pulse * 2 : (1 - pulse) * 2
          ctx.beginPath()
          ctx.arc(x0 + g * (ix - x0), y0 + g * (iy - y0), 2.6, 0, Math.PI * 2)
          ctx.fillStyle = '#fde68a'
          ctx.fill()
          ctx.beginPath()
          ctx.arc(ix, iy, 3.4, 0, Math.PI * 2)
          ctx.fillStyle = '#f97316'
          ctx.fill()
          if (s.showQ && v.i === 2 && v.j === 2) {
            ctx.fillStyle = '#fbbf24'
            ctx.font = '10px ui-monospace, monospace'
            ctx.fillText(f.toFixed(2), ix + 5, iy - 5)
          }
        }
      }

      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(PL, PT, PS, PS)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('dots on a link = intersection point I,  q = |I - v| / |e_i| s', PL, PT + PS + 18)

      // ---- right panel ---------------------------------------------------
      const centre = vox.find((v) => v.i === 2 && v.j === 2)!
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(`centre voxel (2,2) is ${centre.kind}`, RX, 18)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('q per lattice direction  (blank = link not cut)', RX, 36)

      let by = 56
      for (let k = 1; k < 9; k++) {
        const qv = centre.cut[k]
        const f = qv < 0 ? -1 : qv / Math.hypot(EX[k], EY[k])
        ctx.fillStyle = COL_TXT
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(DIRNAME[k].padEnd(3, ' '), RX, by + 9)
        const bw = (RR - RX - 84) * (f < 0 ? 0 : Math.max(0.02, f))
        ctx.fillStyle = f < 0 ? 'rgba(148,163,184,0.10)' : 'rgba(251,191,36,0.30)'
        ctx.fillRect(RX + 26, by, f < 0 ? RR - RX - 84 : bw, 12)
        if (f >= 0) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 1
          ctx.strokeRect(RX + 26.5, by + 0.5, Math.max(1, bw) - 1, 11)
        }
        ctx.textAlign = 'right'
        ctx.fillStyle = f < 0 ? '#475569' : '#fde68a'
        ctx.fillText(f < 0 ? '--' : f.toFixed(3), RR, by + 9)
        ctx.textAlign = 'left'
        by += 19
      }

      // q = 0.5 marker line
      const half = RX + 26 + (RR - RX - 84) * 0.5
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(148,163,184,0.55)'
      ctx.beginPath()
      ctx.moveTo(half, 52)
      ctx.lineTo(half, by - 6)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = COL_TXT
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('q = 0.5  (halfway bounce-back)', RX + 26, by + 8)

      // counts
      const cnt = { F: 0, FB: 0, B: 0, G: 0 }
      for (const v of vox) cnt[v.kind]++
      by += 30
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('patch census', RX, by)
      const rows: Array<[Voxel['kind'], string]> = [
        ['F', 'fluid, untouched'],
        ['FB', 'fluid, owns an I point'],
        ['B', 'solid, still linked to fluid'],
        ['G', 'ghost, dropped'],
      ]
      for (const [k, name] of rows) {
        by += 22
        ctx.fillStyle = FILL[k]
        ctx.fillRect(RX, by - 9, 11, 11)
        ctx.strokeStyle = EDGE[k]
        ctx.lineWidth = 1
        ctx.strokeRect(RX + 0.5, by - 8.5, 10, 10)
        ctx.fillStyle = COL_TXT
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(`${k.padEnd(3, ' ')}${name}`, RX + 18, by)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(String(cnt[k]), RR, by)
        ctx.textAlign = 'left'
      }

      return { offNow, cnt }
    }

    draw()
    let raf = 0
    let frame = 0
    const loop = () => {
      frame++
      t++
      if (st.current.sweep) dyn = 1.9 * Math.sin(t / 150)
      const r = draw()
      if (frame % 12 === 0) {
        setReadRef.current({ off: r.offNow, F: r.cnt.F, FB: r.cnt.FB, B: r.cnt.B, G: r.cnt.G })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(sweep)} onClick={() => setSweep((v) => !v)}>{sweep ? 'sweeping' : 'manual'}</button>
        <button style={btn(showQ)} onClick={() => setShowQ((v) => !v)}>q labels {showQ ? 'on' : 'off'}</button>
        <label style={label}>
          <span style={nameS}>wall angle</span>
          <input type="range" min={0} max={180} step={1} value={ang} onChange={(e) => setAng(parseInt(e.target.value, 10))} />
          <span style={mono}>{ang}&deg;</span>
        </label>
        <label style={label}>
          <span style={nameS}>offset</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.02}
            value={off}
            onChange={(e) => { setSweep(false); setOff(parseFloat(e.target.value)) }}
          />
          <span style={mono}>{(sweep ? read.off : off).toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span style={{ color: COL_F }}>F {read.F}</span>
        <span style={{ color: COL_FB }}>FB {read.FB}</span>
        <span style={{ color: COL_B }}>B {read.B}</span>
        <span style={{ color: COL_G }}>G {read.G}</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag the offset and watch the q bars slide continuously while the class labels jump in steps. Turn the wall to a
        diagonal and the eight q values stop agreeing with each other &mdash; that spread is exactly what a halfway bounce-back
        throws away. Push the wall far enough and orange B voxels turn grey: no fluid link left, nothing to stream into.
      </div>
    </div>
  )
}

const rowS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
  marginTop: '0.6rem',
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 12 }
const nameS: CSSProperties = { color: '#94a3b8' }
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 46 }

function btn(active: boolean): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
