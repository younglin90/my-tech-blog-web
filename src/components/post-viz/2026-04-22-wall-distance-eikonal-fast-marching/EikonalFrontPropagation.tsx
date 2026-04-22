'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const GRID_W = 80
const GRID_H = 50
const CELL = 6
const CANVAS_W = GRID_W * CELL
const CANVAS_H = GRID_H * CELL

const FAR = 0
const CONSIDERED = 1
const ACCEPTED = 2

type Pattern = 'cylinder' | 'double' | 'slit'

const PATTERN_LABEL: Record<Pattern, string> = {
  cylinder: '단일 원통',
  double: '두 원통',
  slit: '슬릿 벽',
}

function buildWalls(pattern: Pattern): Uint8Array {
  const w = new Uint8Array(GRID_W * GRID_H)
  for (let i = 0; i < GRID_W; i++) {
    w[i] = 1
    w[(GRID_H - 1) * GRID_W + i] = 1
  }
  for (let j = 0; j < GRID_H; j++) {
    w[j * GRID_W] = 1
    w[j * GRID_W + GRID_W - 1] = 1
  }
  if (pattern === 'cylinder') {
    const cx = GRID_W * 0.45
    const cy = GRID_H * 0.5
    const r = 6
    for (let j = 0; j < GRID_H; j++) {
      for (let i = 0; i < GRID_W; i++) {
        const dx = i - cx
        const dy = j - cy
        if (dx * dx + dy * dy < r * r) w[j * GRID_W + i] = 1
      }
    }
  } else if (pattern === 'double') {
    const centers: Array<[number, number, number]> = [
      [GRID_W * 0.32, GRID_H * 0.32, 5],
      [GRID_W * 0.62, GRID_H * 0.65, 5],
    ]
    for (const [cx, cy, r] of centers) {
      for (let j = 0; j < GRID_H; j++) {
        for (let i = 0; i < GRID_W; i++) {
          const dx = i - cx
          const dy = j - cy
          if (dx * dx + dy * dy < r * r) w[j * GRID_W + i] = 1
        }
      }
    }
  } else if (pattern === 'slit') {
    const mid = Math.floor(GRID_W * 0.5)
    const gapStart = Math.floor(GRID_H * 0.4)
    const gapEnd = Math.floor(GRID_H * 0.58)
    for (let j = 0; j < GRID_H; j++) {
      if (j < gapStart || j > gapEnd) w[j * GRID_W + mid] = 1
    }
  }
  return w
}

class MinHeap {
  private ts: number[] = []
  private idxs: number[] = []

  get size(): number {
    return this.ts.length
  }

  push(t: number, idx: number) {
    this.ts.push(t)
    this.idxs.push(idx)
    let i = this.ts.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.ts[p] > this.ts[i]) {
        this.swap(p, i)
        i = p
      } else break
    }
  }

  pop(): { t: number; idx: number } | null {
    if (this.ts.length === 0) return null
    const t = this.ts[0]
    const idx = this.idxs[0]
    const lastT = this.ts.pop() as number
    const lastIdx = this.idxs.pop() as number
    if (this.ts.length > 0) {
      this.ts[0] = lastT
      this.idxs[0] = lastIdx
      let i = 0
      const n = this.ts.length
      while (true) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let m = i
        if (l < n && this.ts[l] < this.ts[m]) m = l
        if (r < n && this.ts[r] < this.ts[m]) m = r
        if (m !== i) {
          this.swap(m, i)
          i = m
        } else break
      }
    }
    return { t, idx }
  }

  private swap(a: number, b: number) {
    const tt = this.ts[a]
    this.ts[a] = this.ts[b]
    this.ts[b] = tt
    const ii = this.idxs[a]
    this.idxs[a] = this.idxs[b]
    this.idxs[b] = ii
  }
}

function solveQuadratic(T: Float32Array, j: number, i: number, speed: number): number {
  const Tleft = i > 0 ? T[j * GRID_W + i - 1] : Infinity
  const Tright = i < GRID_W - 1 ? T[j * GRID_W + i + 1] : Infinity
  const Tdown = j > 0 ? T[(j - 1) * GRID_W + i] : Infinity
  const Tup = j < GRID_H - 1 ? T[(j + 1) * GRID_W + i] : Infinity
  const Tx = Tleft < Tright ? Tleft : Tright
  const Ty = Tdown < Tup ? Tdown : Tup
  const h = 1.0
  const invF = h / speed
  const a = Tx < Ty ? Tx : Ty
  const b = Tx < Ty ? Ty : Tx
  if (!isFinite(b) || b >= a + invF) {
    return a + invF
  }
  const diff = b - a
  const disc = 2 * invF * invF - diff * diff
  if (disc < 0) return a + invF
  return 0.5 * (a + b + Math.sqrt(disc))
}

type State = {
  T: Float32Array
  status: Uint8Array
  heap: MinHeap
  walls: Uint8Array
  accepted: number
  totalFluid: number
}

function initState(pattern: Pattern, speed: number): State {
  const walls = buildWalls(pattern)
  const T = new Float32Array(GRID_W * GRID_H)
  const status = new Uint8Array(GRID_W * GRID_H)
  const heap = new MinHeap()
  let totalFluid = 0
  for (let k = 0; k < walls.length; k++) {
    if (walls[k]) {
      T[k] = 0
      status[k] = ACCEPTED
    } else {
      T[k] = Infinity
      totalFluid++
    }
  }
  for (let j = 0; j < GRID_H; j++) {
    for (let i = 0; i < GRID_W; i++) {
      if (!walls[j * GRID_W + i]) continue
      for (const [dj, di] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const nj = j + dj
        const ni = i + di
        if (nj < 0 || nj >= GRID_H || ni < 0 || ni >= GRID_W) continue
        const nidx = nj * GRID_W + ni
        if (walls[nidx] || status[nidx] === ACCEPTED) continue
        const newT = solveQuadratic(T, nj, ni, speed)
        if (newT < T[nidx]) {
          T[nidx] = newT
          if (status[nidx] === FAR) status[nidx] = CONSIDERED
          heap.push(newT, nidx)
        }
      }
    }
  }
  return { T, status, heap, walls, accepted: 0, totalFluid }
}

function advance(state: State, speed: number, budget: number): boolean {
  let done = 0
  while (done < budget) {
    const top = state.heap.pop()
    if (!top) return false
    if (state.status[top.idx] === ACCEPTED) continue
    if (top.t > state.T[top.idx] + 1e-9) continue
    state.status[top.idx] = ACCEPTED
    state.accepted++
    done++
    const j = Math.floor(top.idx / GRID_W)
    const i = top.idx - j * GRID_W
    for (const [dj, di] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const nj = j + dj
      const ni = i + di
      if (nj < 0 || nj >= GRID_H || ni < 0 || ni >= GRID_W) continue
      const nidx = nj * GRID_W + ni
      if (state.walls[nidx] || state.status[nidx] === ACCEPTED) continue
      const newT = solveQuadratic(state.T, nj, ni, speed)
      if (newT < state.T[nidx]) {
        state.T[nidx] = newT
        if (state.status[nidx] === FAR) state.status[nidx] = CONSIDERED
        state.heap.push(newT, nidx)
      }
    }
  }
  return true
}

const VIRIDIS: Array<[number, number, number]> = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [253, 231, 37],
]

function viridis(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(0.999999, t))
  const s = x * (VIRIDIS.length - 1)
  const i0 = Math.floor(s)
  const i1 = i0 + 1
  const f = s - i0
  const a = VIRIDIS[i0]
  const b = VIRIDIS[i1]
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ]
}

function render(
  ctx: CanvasRenderingContext2D,
  state: State,
  maxT: number,
) {
  const img = ctx.createImageData(CANVAS_W, CANVAS_H)
  for (let j = 0; j < GRID_H; j++) {
    for (let i = 0; i < GRID_W; i++) {
      const idx = j * GRID_W + i
      let r = 20
      let g = 28
      let b = 44
      if (state.walls[idx]) {
        r = 240
        g = 240
        b = 244
      } else if (state.status[idx] === ACCEPTED && isFinite(state.T[idx])) {
        const t = Math.min(state.T[idx] / maxT, 1)
        const c = viridis(t)
        r = c[0]
        g = c[1]
        b = c[2]
      } else if (state.status[idx] === CONSIDERED && isFinite(state.T[idx])) {
        r = 244
        g = 204
        b = 88
      }
      for (let dy = 0; dy < CELL; dy++) {
        for (let dx = 0; dx < CELL; dx++) {
          const py = j * CELL + dy
          const px = i * CELL + dx
          const off = (py * CANVAS_W + px) * 4
          img.data[off] = r
          img.data[off + 1] = g
          img.data[off + 2] = b
          img.data[off + 3] = 255
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0)
}

export function EikonalFrontPropagation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<State | null>(null)
  const [pattern, setPattern] = useState<Pattern>('cylinder')
  const [speed, setSpeed] = useState(1.0)
  const [playing, setPlaying] = useState(true)
  const [stepsPerFrame, setStepsPerFrame] = useState(40)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const maxT = useMemo(() => {
    return 45 / Math.max(speed, 0.25)
  }, [speed])

  const reset = useCallback(() => {
    stateRef.current = initState(pattern, speed)
    setProgress(0)
    setDone(false)
    const canvas = canvasRef.current
    if (canvas && stateRef.current) {
      const ctx = canvas.getContext('2d')
      if (ctx) render(ctx, stateRef.current, maxT)
    }
  }, [pattern, speed, maxT])

  useEffect(() => {
    reset()
  }, [reset])

  useEffect(() => {
    let raf = 0
    let cancelled = false
    const loop = () => {
      if (cancelled) return
      const canvas = canvasRef.current
      const state = stateRef.current
      if (canvas && state && playing && !done) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const ok = advance(state, speed, stepsPerFrame)
          render(ctx, state, maxT)
          const p = state.accepted / Math.max(state.totalFluid, 1)
          setProgress(p)
          if (!ok || p >= 1) setDone(true)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [playing, speed, stepsPerFrame, maxT, done])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
          fontSize: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(PATTERN_LABEL) as Pattern[]).map((p) => (
            <button
              key={p}
              onClick={() => setPattern(p)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: pattern === p ? 'var(--accent)' : 'transparent',
                color: pattern === p ? 'var(--bg)' : 'var(--text)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {PATTERN_LABEL[p]}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>전파 속도 F =</span>
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <code>{speed.toFixed(1)}</code>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>프레임당 스텝</span>
          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={stepsPerFrame}
            onChange={(e) => setStepsPerFrame(parseInt(e.target.value, 10))}
          />
          <code>{stepsPerFrame}</code>
        </label>

        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          {playing ? '일시정지' : '재생'}
        </button>

        <button
          onClick={reset}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          리셋
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          width: '100%',
          maxWidth: CANVAS_W,
          height: 'auto',
          display: 'block',
          imageRendering: 'pixelated',
          borderRadius: 4,
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <span>
          진행 {(progress * 100).toFixed(0)}%
          {done ? ' · 완료' : ''}
        </span>
        <span>
          보라색 = 가까움, 노란색 = 멀리 · 벽에서부터 등거리 파면이 퍼진다
        </span>
      </div>
    </div>
  )
}
