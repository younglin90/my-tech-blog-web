'use client'

import { useMemo, useState } from 'react'

const GAMMA = 1.4

function areaRatio(M: number): number {
  const g = GAMMA
  const exp = (g + 1) / (2 * (g - 1))
  const inner = (2 / (g + 1)) * (1 + ((g - 1) / 2) * M * M)
  return (1 / M) * Math.pow(inner, exp)
}

function solveMach(AoverAstar: number, branch: 'sub' | 'sup'): number {
  let lo = branch === 'sub' ? 1e-3 : 1.0001
  let hi = branch === 'sub' ? 0.9999 : 25
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi)
    const r = areaRatio(mid)
    if (branch === 'sub') {
      if (r > AoverAstar) lo = mid
      else hi = mid
    } else {
      if (r < AoverAstar) lo = mid
      else hi = mid
    }
  }
  return 0.5 * (lo + hi)
}

function pOverP0(M: number): number {
  return Math.pow(1 + ((GAMMA - 1) / 2) * M * M, -GAMMA / (GAMMA - 1))
}

export function LavalNozzleProfile() {
  const [areaExitRatio, setAreaExitRatio] = useState(2.5)
  const [pbOverP0, setPbOverP0] = useState(0.4)

  const W = 680
  const H = 300
  const N = 200

  const data = useMemo(() => {
    const xs = Array.from({ length: N }, (_, i) => i / (N - 1))
    const profile = xs.map((x) => {
      const inletA = 2.5
      const throatX = 0.5
      if (x <= throatX) {
        const t = x / throatX
        return inletA - (inletA - 1) * (1 - Math.pow(1 - t, 2))
      } else {
        const t = (x - throatX) / (1 - throatX)
        return 1 + (areaExitRatio - 1) * Math.pow(t, 1.5)
      }
    })

    const supersonicExit = solveMach(areaExitRatio, 'sup')
    const subsonicExitDesign = solveMach(areaExitRatio, 'sub')
    const pSupExit = pOverP0(supersonicExit)
    const pSubExit = pOverP0(subsonicExitDesign)

    const choked = pbOverP0 < 0.999 * pOverP0(1.0) && pbOverP0 <= pSubExit + 0.001
    const fullySupersonic = Math.abs(pbOverP0 - pSupExit) < 0.02
    const overExpanded = pbOverP0 > pSupExit && pbOverP0 < pSubExit
    const underExpanded = pbOverP0 < pSupExit
    const subsonicAll = pbOverP0 > pSubExit

    let regime = 'subsonic-all'
    if (subsonicAll) regime = 'subsonic'
    else if (fullySupersonic || underExpanded) regime = 'design / under-expanded'
    else if (overExpanded) regime = 'over-expanded (shock inside)'

    const machProfile = profile.map((A, i) => {
      const x = xs[i]
      if (subsonicAll) return solveMach(A, 'sub')
      if (x <= 0.5) return solveMach(A, 'sub')
      return solveMach(A, 'sup')
    })

    return { xs, profile, machProfile, regime, supersonicExit, subsonicExitDesign, pSupExit, pSubExit, choked }
  }, [areaExitRatio, pbOverP0])

  const xy = (x: number, y: number, ymin: number, ymax: number) => {
    const px = 50 + x * (W - 80)
    const py = H - 40 - ((y - ymin) / (ymax - ymin)) * (H - 80)
    return [px, py] as [number, number]
  }

  const wallTopPath = data.xs
    .map((x, i) => {
      const A = data.profile[i]
      const [px, py] = xy(x, 1.5 + A * 0.4, 0, 4)
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`
    })
    .join(' ')

  const wallBottomPath = data.xs
    .map((x, i) => {
      const A = data.profile[i]
      const [px, py] = xy(x, 1.5 - A * 0.4, 0, 4)
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`
    })
    .join(' ')

  const machMax = Math.max(...data.machProfile, 1.5)
  const machPath = data.xs
    .map((x, i) => {
      const M = data.machProfile[i]
      const [px, py] = xy(x, M / machMax, 0, 1)
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`
    })
    .join(' ')

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontFamily: 'monospace' }}>
          Aexit/A* : {areaExitRatio.toFixed(2)}
          <input type="range" min={1.05} max={6.0} step={0.05} value={areaExitRatio}
            onChange={(e) => setAreaExitRatio(parseFloat(e.target.value))}
            style={{ marginLeft: 10, verticalAlign: 'middle', width: 180 }} />
        </label>
        <label style={{ fontSize: 13, fontFamily: 'monospace' }}>
          Pb/P0 : {pbOverP0.toFixed(2)}
          <input type="range" min={0.02} max={0.99} step={0.01} value={pbOverP0}
            onChange={(e) => setPbOverP0(parseFloat(e.target.value))}
            style={{ marginLeft: 10, verticalAlign: 'middle', width: 180 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: 'block', borderRadius: 6, background: 'var(--bg)' }}>
        <path d={wallTopPath} stroke="var(--text)" strokeOpacity="0.55" fill="none" strokeWidth={1.5} />
        <path d={wallBottomPath} stroke="var(--text)" strokeOpacity="0.55" fill="none" strokeWidth={1.5} />
        <line x1={50 + 0.5 * (W - 80)} y1={20} x2={50 + 0.5 * (W - 80)} y2={H - 40} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
        <text x={50 + 0.5 * (W - 80) + 6} y={32} fontSize={11} fill="#f43f5e">throat (Ma=1)</text>
        <path d={machPath} stroke="var(--accent)" fill="none" strokeWidth={2.2} />
        {data.machProfile.map((M, i) => {
          if (i % 25 !== 0) return null
          const [px, py] = xy(data.xs[i], M / machMax, 0, 1)
          return <circle key={i} cx={px} cy={py} r={2.5} fill="var(--accent)" />
        })}
        <line x1={40} y1={H - 40} x2={W - 30} y2={H - 40} stroke="var(--text)" strokeOpacity="0.3" />
        <text x={50} y={H - 22} fontSize={11} fill="var(--text)" opacity={0.7}>inlet</text>
        <text x={W - 80} y={H - 22} fontSize={11} fill="var(--text)" opacity={0.7}>exit</text>
        <text x={W - 200} y={28} fontSize={12} fill="var(--accent)" fontFamily="monospace">
          Ma_exit (design sup): {data.supersonicExit.toFixed(2)}
        </text>
        <text x={W - 200} y={46} fontSize={12} fill="var(--text)" fontFamily="monospace">
          regime: {data.regime}
        </text>
      </svg>
      <p style={{ fontSize: 12, opacity: 0.75, marginTop: 8, fontFamily: 'monospace' }}>
        Cyan curve: Ma along axis (normalized). Dashed red line: throat.
        Lower P_b makes the diverging part accelerate to supersonic.
        Raise P_b above the design and a normal shock appears inside.
      </p>
    </div>
  )
}
