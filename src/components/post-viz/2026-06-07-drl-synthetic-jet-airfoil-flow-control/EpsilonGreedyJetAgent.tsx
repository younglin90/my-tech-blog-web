'use client'

import { useEffect, useRef, useState } from 'react'

// epsilon-greedy action selection over the discrete jet-velocity levels
// {0,1,...,20} m/s. Each level has an unknown "true" aerodynamic reward;
// the agent estimates Q-values from noisy samples and balances exploration
// (random pick) vs exploitation (argmax). Watch the bars converge.

const N_ACTIONS = 21 // jet velocities 0..20 m/s

// hidden true reward curve: peaks near 12 m/s, penalizes wasted momentum
function trueReward(a: number): number {
  const peak = 12
  const base = 3.0 - 0.01 * Math.pow(a - peak, 2) // shaped lift-minus-drag
  const cost = 0.015 * a // momentum cost
  return base - cost
}

export function EpsilonGreedyJetAgent() {
  const [epsilon, setEpsilon] = useState(0.2)
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)

  const Q = useRef<number[]>(new Array(N_ACTIONS).fill(0))
  const counts = useRef<number[]>(new Array(N_ACTIONS).fill(0))
  const lastAction = useRef<number>(-1)
  const lastExplore = useRef(false)
  const totalReward = useRef(0)
  const steps = useRef(0)
  const epsRef = useRef(epsilon)
  const runRef = useRef(running)
  epsRef.current = epsilon
  runRef.current = running

  const reset = () => {
    Q.current = new Array(N_ACTIONS).fill(0)
    counts.current = new Array(N_ACTIONS).fill(0)
    lastAction.current = -1
    totalReward.current = 0
    steps.current = 0
    setTick((t) => t + 1)
  }

  useEffect(() => {
    if (!running) return
    let raf = 0
    let acc = 0
    const step = () => {
      acc++
      if (acc % 6 === 0) {
        // choose action: epsilon-greedy
        let a: number
        const eps = epsRef.current
        if (Math.random() < eps) {
          a = Math.floor(Math.random() * N_ACTIONS)
          lastExplore.current = true
        } else {
          let best = 0
          for (let i = 1; i < N_ACTIONS; i++) if (Q.current[i] > Q.current[best]) best = i
          a = best
          lastExplore.current = false
        }
        // sample noisy reward, incremental mean update
        const r = trueReward(a) + (Math.random() - 0.5) * 1.2
        counts.current[a] += 1
        Q.current[a] += (r - Q.current[a]) / counts.current[a]
        lastAction.current = a
        totalReward.current += r
        steps.current += 1
        setTick((t) => t + 1)
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [running])

  // current greedy choice
  let greedy = 0
  for (let i = 1; i < N_ACTIONS; i++) if (Q.current[i] > Q.current[greedy]) greedy = i
  const maxQ = Math.max(1e-6, ...Q.current.map((q) => Math.abs(q)))
  const avgReward = steps.current > 0 ? totalReward.current / steps.current : 0

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 180, marginBottom: 8 }}>
        {Q.current.map((q, i) => {
          const h = (Math.max(0, q) / maxQ) * 100
          const isGreedy = i === greedy && steps.current > 0
          const isLast = i === lastAction.current
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <div
                style={{
                  height: `${h}%`,
                  minHeight: 2,
                  borderRadius: '3px 3px 0 0',
                  background: isLast
                    ? lastExplore.current
                      ? '#facc15'
                      : '#22d3ee'
                    : isGreedy
                    ? '#0e7490'
                    : 'rgba(122,144,168,0.45)',
                  transition: 'height 0.1s linear',
                }}
                title={`U=${i} m/s, Q=${q.toFixed(2)}, n=${counts.current[i]}`}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
        <span>0</span>
        <span>jet velocity action (m/s)</span>
        <span>20</span>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 14, flexWrap: 'wrap', fontSize: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
          <span style={{ whiteSpace: 'nowrap' }}>ε (explore)</span>
          <input type="range" min={0} max={1} step={0.01} value={epsilon} onChange={(e) => setEpsilon(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontFamily: 'ui-monospace, monospace', width: 40 }}>{epsilon.toFixed(2)}</span>
        </label>
        <button onClick={() => setRunning((r) => !r)} style={btn}>{running ? 'Pause' : 'Train'}</button>
        <button onClick={reset} style={btn}>Reset</button>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', color: 'var(--text)' }}>
        steps: {steps.current} · best action: <span style={{ color: '#22d3ee' }}>{greedy} m/s</span> · avg reward: {avgReward.toFixed(2)}
        <span style={{ marginLeft: 12, color: '#facc15' }}>■ explore</span>
        <span style={{ marginLeft: 8, color: '#22d3ee' }}>■ exploit</span>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
}
