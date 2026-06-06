'use client'

import { useEffect, useRef, useState } from 'react'

// Phenomenological wake-control demo. A synthetic jet near the airfoil
// leading edge injects momentum; as the jet velocity rises, shed vortices
// weaken and the lift fluctuation shrinks. Not a real solver -- it is a
// qualitative picture of the paper's central result.

interface Vortex {
  x: number
  y: number
  sign: number // +1 / -1 alternating
  born: number
}

export function SyntheticJetWakeControl() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [jetVel, setJetVel] = useState(0) // U_a in m/s, 0..20
  const [running, setRunning] = useState(true)
  const stateRef = useRef({ vortices: [] as Vortex[], t: 0, lastSpawn: 0, sign: 1, clPhase: 0 })

  // keep latest values readable inside the rAF loop
  const jetRef = useRef(jetVel)
  const runRef = useRef(running)
  jetRef.current = jetVel
  runRef.current = running

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const afX = 150 // airfoil trailing-edge x
    const afY = H / 2
    let raf = 0

    const draw = () => {
      const s = stateRef.current
      const u = jetRef.current
      // control authority: 0 (no jet) .. 1 (full)
      const ctrl = Math.min(1, u / 20)
      // shedding amplitude shrinks with jet momentum
      const amp = (H * 0.22) * (1 - 0.78 * ctrl)
      const strength = 1 - 0.82 * ctrl

      if (runRef.current) {
        s.t += 1
        s.clPhase += 0.06 * (1 - 0.4 * ctrl)
        // spawn a new vortex periodically at the trailing edge
        const interval = 26
        if (s.t - s.lastSpawn > interval) {
          s.lastSpawn = s.t
          s.sign *= -1
          s.vortices.push({ x: afX, y: afY + s.sign * amp, sign: s.sign, born: s.t })
        }
        // advect downstream
        for (const v of s.vortices) {
          v.x += 1.7
          v.y += Math.sin((v.x - afX) * 0.03) * 0.3 * v.sign
        }
        s.vortices = s.vortices.filter((v) => v.x < W + 30)
      }

      // --- render ---
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // centerline
      ctx.strokeStyle = 'rgba(122,144,168,0.18)'
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.moveTo(0, afY)
      ctx.lineTo(W, afY)
      ctx.stroke()
      ctx.setLineDash([])

      // vortices
      for (const v of s.vortices) {
        const age = s.t - v.born
        const fade = Math.max(0, 1 - age / 220)
        const r = (10 + 6 * Math.sin(s.t * 0.1)) * strength * fade + 2
        const col = v.sign > 0 ? '34,211,238' : '244,114,114'
        const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, r * 2.2)
        g.addColorStop(0, `rgba(${col},${0.55 * fade})`)
        g.addColorStop(1, `rgba(${col},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(v.x, v.y, r * 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // airfoil (angled flat-ish body)
      ctx.save()
      ctx.translate(afX - 70, afY)
      ctx.rotate(-0.32) // angle of attack
      ctx.fillStyle = '#cdd7e3'
      ctx.beginPath()
      ctx.ellipse(0, 0, 70, 9, 0, 0, Math.PI * 2)
      ctx.fill()
      // synthetic jet orifice near leading edge, suction side
      const jetGlow = ctrl
      ctx.fillStyle = `rgba(250,204,21,${0.4 + 0.6 * jetGlow})`
      ctx.beginPath()
      ctx.arc(-48, -8, 4 + 3 * jetGlow, 0, Math.PI * 2)
      ctx.fill()
      // jet plume
      if (u > 0) {
        const plume = 8 + 26 * ctrl
        const gg = ctx.createLinearGradient(-48, -8, -48, -8 - plume)
        gg.addColorStop(0, `rgba(250,204,21,${0.5 * (0.5 + 0.5 * Math.sin(s.clPhase * 3))})`)
        gg.addColorStop(1, 'rgba(250,204,21,0)')
        ctx.strokeStyle = gg
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(-48, -8)
        ctx.lineTo(-48, -8 - plume)
        ctx.stroke()
      }
      ctx.restore()

      // lift signal (oscillation amplitude shrinks with control)
      const clBase = 1.8 + 0.2 * ctrl
      const clOsc = (0.55 * strength) * Math.sin(s.clPhase)
      const cl = clBase + clOsc
      const cd = 0.085 - 0.006 * ctrl

      // HUD
      ctx.fillStyle = '#e7eef6'
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillText(`U_jet = ${u} m/s`, 14, 22)
      ctx.fillText(`C_L = ${cl.toFixed(3)}  (osc ±${Math.abs(0.55 * strength).toFixed(2)})`, 14, 40)
      ctx.fillText(`C_D = ${cd.toFixed(3)}`, 14, 58)
      ctx.fillStyle = ctrl > 0.5 ? '#22d3ee' : '#7a90a8'
      ctx.fillText(
        ctrl < 0.05 ? 'control OFF — strong vortex shedding' : ctrl < 0.5 ? 'partial control' : 'wake stabilized',
        14,
        H - 14,
      )

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={720} height={300} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, flex: 1, minWidth: 220 }}>
          <span style={{ whiteSpace: 'nowrap' }}>Jet velocity Uₐ</span>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={jetVel}
            onChange={(e) => setJetVel(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', width: 56 }}>{jetVel} m/s</span>
        </label>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  )
}
