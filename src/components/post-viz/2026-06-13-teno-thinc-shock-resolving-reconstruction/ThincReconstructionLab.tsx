'use client'
import { useEffect, useRef, useState } from 'react'

// 한 셀 안에서 THINC tanh 프로파일의 jump 중심 위치 d를 푼다 (논문 식 2.20)
function thincCenter(fm: number, fc: number, fp: number, beta: number): number | null {
  const fa = 0.5 * (fp + fm)
  const fd = 0.5 * (fp - fm)
  if (Math.abs(fd) < 1e-12) return null
  if ((fp - fc) * (fc - fm) <= 0) return null // 비단조 → THINC 미적용
  const alpha = (fc - fa) / fd
  if (Math.abs(alpha) >= 1) return null
  const T1 = Math.tanh(beta / 2)
  const T2 = Math.tanh((alpha * beta) / 2)
  const r = T2 / T1
  return (1 / (2 * beta)) * Math.log((1 - r) / (1 + r))
}

// THINC subcell 값: X in [-0.5, 0.5] (식 2.19)
function thincValue(fm: number, fc: number, fp: number, beta: number, X: number): number {
  const fa = 0.5 * (fp + fm)
  const fd = 0.5 * (fp - fm)
  const d = thincCenter(fm, fc, fp, beta)
  if (d === null) return fc
  return fa + fd * Math.tanh(beta * (X - d))
}

// Catmull-Rom 으로 셀 평균을 잇는 매끄러운 다항 재구성 (개념 표현)
function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

const N = 14 // 셀 개수
// 정확한 프로파일: 접촉 불연속 (top-hat)
function exact(x: number): number {
  return x > 0.32 && x < 0.64 ? 1.15 : 0.2
}

type Scheme = 'poly' | 'thinc' | 'hybrid'

export function ThincReconstructionLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [scheme, setScheme] = useState<Scheme>('hybrid')
  const [beta, setBeta] = useState(1.8)
  const [overshoot, setOvershoot] = useState(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const Wd = 580
    const Hd = 300
    c.width = Wd * dpr
    c.height = Hd * dpr
    c.style.width = Wd + 'px'
    c.style.height = Hd + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const padL = 38
    const padR = 14
    const padT = 16
    const padB = 26
    const x2px = (x: number) => padL + x * (Wd - padL - padR)
    const fMin = 0
    const fMax = 1.5
    const f2py = (f: number) => Hd - padB - ((f - fMin) / (fMax - fMin)) * (Hd - padT - padB)

    // 셀 평균 계산
    const dx = 1 / N
    const favg: number[] = []
    for (let i = 0; i < N; i++) {
      let s = 0
      const sub = 20
      for (let k = 0; k < sub; k++) s += exact((i + (k + 0.5) / sub) * dx)
      favg.push(s / sub)
    }
    const at = (i: number) => favg[Math.max(0, Math.min(N - 1, i))]

    // 불연속 셀 검출 (hybrid용): 단조 & 큰 점프
    const isJumpCell = (i: number) => {
      const d = thincCenter(at(i - 1), at(i), at(i + 1), beta)
      return d !== null && Math.abs(at(i + 1) - at(i - 1)) > 0.25
    }

    ctx.clearRect(0, 0, Wd, Hd)
    // 배경
    ctx.fillStyle = '#0b1422'
    ctx.fillRect(0, 0, Wd, Hd)

    // 셀 경계
    ctx.strokeStyle = 'rgba(120,140,170,0.16)'
    ctx.lineWidth = 1
    for (let i = 0; i <= N; i++) {
      ctx.beginPath()
      ctx.moveTo(x2px(i * dx), padT)
      ctx.lineTo(x2px(i * dx), Hd - padB)
      ctx.stroke()
    }

    // 정확한 프로파일 (회색 계단)
    ctx.strokeStyle = 'rgba(160,176,200,0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    let started = false
    for (let px = 0; px <= 400; px++) {
      const x = px / 400
      const yy = f2py(exact(x))
      if (!started) {
        ctx.moveTo(x2px(x), yy)
        started = true
      } else ctx.lineTo(x2px(x), yy)
    }
    ctx.stroke()

    // 재구성 곡선
    let peak = -Infinity
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    let drew = false
    for (let i = 0; i < N; i++) {
      const useThinc =
        scheme === 'thinc' || (scheme === 'hybrid' && isJumpCell(i))
      const steps = 16
      for (let k = 0; k <= steps; k++) {
        const X = -0.5 + k / steps // 셀 내부 좌표
        const x = (i + 0.5 + X) * dx
        let val: number
        if (useThinc) {
          val = thincValue(at(i - 1), at(i), at(i + 1), beta, X)
        } else {
          // Catmull-Rom: 다항 재구성 개념 표현
          val = catmull(at(i - 1), at(i), at(i + 1), at(i + 2), X + 0.5)
        }
        peak = Math.max(peak, val)
        const px = x2px(x)
        const py = f2py(val)
        if (!drew) {
          ctx.moveTo(px, py)
          drew = true
        } else ctx.lineTo(px, py)
      }
    }
    ctx.stroke()

    // 셀 평균 점
    ctx.fillStyle = '#f5c542'
    for (let i = 0; i < N; i++) {
      ctx.beginPath()
      ctx.arc(x2px((i + 0.5) * dx), f2py(favg[i]), 2.6, 0, Math.PI * 2)
      ctx.fill()
    }

    // 축 라벨
    ctx.fillStyle = 'rgba(160,176,200,0.8)'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.fillText('u', 6, f2py(1.15) + 4)
    ctx.fillText('x', x2px(1) - 8, Hd - 8)

    setOvershoot(Math.max(0, peak - 1.15))
  }, [scheme, beta])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
        margin: '1.4rem 0',
      }}
    >
      <canvas ref={ref} style={{ width: '100%', maxWidth: 580, display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['poly', 'thinc', 'hybrid'] as Scheme[]).map((s) => (
            <button
              key={s}
              onClick={() => setScheme(s)}
              style={{
                padding: '5px 11px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontSize: 12.5,
                background: scheme === s ? 'var(--accent)' : 'transparent',
                color: scheme === s ? '#08111f' : 'var(--text-muted)',
                fontWeight: scheme === s ? 600 : 400,
              }}
            >
              {s === 'poly' ? 'Polynomial' : s === 'thinc' ? 'THINC' : 'Hybrid (BVD)'}
            </button>
          ))}
        </div>
        <label style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          β = {beta.toFixed(2)}
          <input
            type="range"
            min={1.0}
            max={2.4}
            step={0.05}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            disabled={scheme === 'poly'}
            style={{ width: 130 }}
          />
        </label>
        <span style={{ fontSize: 12.5, color: overshoot > 0.03 ? '#f87171' : '#4ade80' }}>
          overshoot: {overshoot.toFixed(3)}
        </span>
      </div>
    </div>
  )
}
