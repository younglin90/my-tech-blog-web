'use client'

import { useState } from 'react'

interface Stage {
  id: number
  title: string
  description: string
  concept: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  xpReward: number
}

const stages: Stage[] = [
  {
    id: 1,
    title: 'CFL Condition',
    description: 'Stage 1: The Gateway of Stability',
    concept:
      'CFL(Courant-Friedrichs-Lewy) 조건은 명시적 시간 적분에서 수치 안정성을 보장하는 핵심 조건입니다. CFL number = u * dt / dx 이며, 이 값이 1을 넘으면 정보가 한 셀 이상을 건너뛰게 되어 불안정해집니다.',
    question: 'dx = 0.01, u = 300 m/s 일 때, CFL = 0.5를 만족하는 dt는?',
    options: [
      'dt = 1.67 x 10^-5 s',
      'dt = 3.33 x 10^-5 s',
      'dt = 6.67 x 10^-5 s',
      'dt = 1.00 x 10^-4 s',
    ],
    correctIndex: 0,
    explanation:
      'CFL = u * dt / dx = 0.5 이므로, dt = 0.5 * 0.01 / 300 = 1.67 x 10^-5 s. CFL 조건을 위반하면 해가 폭발(blow-up)합니다!',
    xpReward: 100,
  },
  {
    id: 2,
    title: 'Numerical Diffusion',
    description: 'Stage 2: The Fog of Dissipation',
    concept:
      '1차 upwind scheme은 안정적이지만 수치 확산(numerical diffusion)이 큽니다. Taylor 전개를 하면 leading truncation error가 2차 미분 항, 즉 인공 점성(artificial viscosity)임을 알 수 있습니다.',
    question:
      '1차 upwind scheme의 수치 확산 계수(numerical viscosity)는?',
    options: [
      'u * dx / 2 * (1 - CFL)',
      'u * dx / 2 * (1 + CFL)',
      'u^2 * dt / 2',
      'dx^2 / (2 * dt)',
    ],
    correctIndex: 0,
    explanation:
      '1차 upwind의 modified equation은 du/dt + u*du/dx = (u*dx/2)(1-CFL) * d^2u/dx^2. CFL = 1일 때 수치 확산이 0이 되어 정확해를 줍니다!',
    xpReward: 150,
  },
  {
    id: 3,
    title: 'Godunov Theorem',
    description: "Stage 3: Godunov's Barrier",
    concept:
      "Godunov의 정리(1959): '단조(monotone)인 선형 스킴은 최대 1차 정확도를 가진다.' 이는 선형 스킴으로는 진동 없이 2차 이상의 정확도를 달성할 수 없다는 뜻입니다. 이 한계를 극복하기 위해 TVD limiter, ENO, WENO 등의 비선형 스킴이 개발되었습니다.",
    question:
      'Godunov 정리의 한계를 극복하기 위한 접근법이 아닌 것은?',
    options: [
      'TVD limiter (minmod, van Leer)',
      'WENO reconstruction',
      'Lax-Friedrichs scheme의 격자 세분화',
      'Slope limiter를 이용한 MUSCL scheme',
    ],
    correctIndex: 2,
    explanation:
      'Lax-Friedrichs는 1차 선형 스킴이므로 격자를 아무리 세분화해도 1차 정확도입니다. TVD, MUSCL, WENO는 모두 비선형 재구성을 통해 고차 정확도를 달성하면서 진동을 억제합니다.',
    xpReward: 200,
  },
  {
    id: 4,
    title: 'Riemann Problem',
    description: 'Stage 4: The Wave Chamber',
    concept:
      '1D Euler 방정식의 Riemann 문제 해는 3개의 파로 구성됩니다: 좌향 파(shock 또는 rarefaction), 접촉 불연속(contact discontinuity), 우향 파. Sod shock tube는 가장 유명한 테스트 케이스입니다.',
    question:
      'Sod shock tube 문제에서, 접촉 불연속(contact discontinuity)을 통해 불연속인 물리량은?',
    options: [
      '압력과 속도',
      '밀도와 내부 에너지',
      '속도와 밀도',
      '압력과 밀도',
    ],
    correctIndex: 1,
    explanation:
      '접촉 불연속에서는 압력(p)과 속도(u)가 연속이고, 밀도(rho)와 내부 에너지(e)가 불연속입니다. 이것이 Euler 방정식의 선형 퇴화(linearly degenerate) 특성장에 대응합니다.',
    xpReward: 250,
  },
  {
    id: 5,
    title: 'Multiphase Pressure Oscillation',
    description: 'Stage 5: The Final Boss - Interface Phantom',
    concept:
      '압축성 다상유동에서 계면을 순수 보존형으로 처리하면 EOS가 혼합되어 비물리적 압력 진동이 발생합니다. Abgrall(1996)의 조건: "균일 압력/속도 상태는 수치적으로도 균일하게 유지되어야 한다." 이를 만족시키려면 체적분율 방정식을 비보존형으로 풀어야 합니다.',
    question:
      '5-equation diffuse interface model에서 체적분율 방정식이 비보존형(non-conservative)인 이유는?',
    options: [
      '계산 비용을 줄이기 위해',
      '질량 보존을 포기하기 위해',
      '계면에서 압력/속도 평형을 유지하기 위해',
      '코드 구현을 단순화하기 위해',
    ],
    correctIndex: 2,
    explanation:
      '비보존형 이류는 계면에서의 압력/속도 평형(pressure/velocity equilibrium)을 수치적으로 보존합니다. 질량 보존은 각 상의 부분 밀도 방정식(alpha*rho)이 보존형으로 풀리므로 보장됩니다. 이것이 Abgrall 조건의 핵심입니다!',
    xpReward: 500,
  },
]

type GameState = 'intro' | 'playing' | 'result' | 'cleared'

export function NumericalDungeon() {
  const [gameState, setGameState] = useState<GameState>('intro')
  const [currentStage, setCurrentStage] = useState(0)
  const [xp, setXp] = useState(0)
  const [hp, setHp] = useState(3)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const stage = stages[currentStage]

  const handleAnswer = (index: number) => {
    if (showExplanation) return
    setSelectedOption(index)
    setShowExplanation(true)

    if (index === stage.correctIndex) {
      setXp((prev) => prev + stage.xpReward)
      setCorrectCount((prev) => prev + 1)
    } else {
      setHp((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (hp <= 0) {
      setGameState('result')
      return
    }
    if (currentStage >= stages.length - 1) {
      setGameState('cleared')
      return
    }
    setCurrentStage((prev) => prev + 1)
    setSelectedOption(null)
    setShowExplanation(false)
  }

  const handleRestart = () => {
    setGameState('intro')
    setCurrentStage(0)
    setXp(0)
    setHp(3)
    setSelectedOption(null)
    setShowExplanation(false)
    setCorrectCount(0)
  }

  const getRank = () => {
    if (correctCount === 5) return 'S - CFD Master'
    if (correctCount === 4) return 'A - Numerical Wizard'
    if (correctCount === 3) return 'B - Flux Calculator'
    if (correctCount === 2) return 'C - Grid Generator'
    return 'D - CFL Violator'
  }

  if (gameState === 'intro') {
    return (
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-8 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl font-black tracking-tight">NUMERICAL DUNGEON</div>
          <p className="text-sm text-zinc-500">Survive 5 stages. Master CFD.</p>
        </div>
        <div className="mb-6 space-y-2 rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
          <p><span className="font-semibold">HP:</span> 3 (wrong answer = -1 HP, 0 HP = Game Over)</p>
          <p><span className="font-semibold">XP:</span> Earn XP for each correct answer</p>
          <p><span className="font-semibold">Stages:</span> CFL &rarr; Diffusion &rarr; Godunov &rarr; Riemann &rarr; Multiphase</p>
        </div>
        <div className="mb-6 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>Stage 1-2: Fundamentals of numerical schemes</p>
          <p>Stage 3-4: Core CFD theory</p>
          <p>Stage 5: Final Boss - Compressible multiphase</p>
        </div>
        <button
          onClick={() => setGameState('playing')}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          ENTER DUNGEON
        </button>
      </div>
    )
  }

  if (gameState === 'result') {
    return (
      <div className="rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-8 text-center dark:border-red-900 dark:from-red-950 dark:to-zinc-950">
        <div className="mb-2 text-4xl font-black text-red-600 dark:text-red-400">GAME OVER</div>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">Your simulation has diverged...</p>
        <div className="mb-6 space-y-1 text-sm">
          <p>Stages cleared: {currentStage} / {stages.length}</p>
          <p>Total XP: {xp}</p>
          <p>Rank: {getRank()}</p>
        </div>
        <button
          onClick={handleRestart}
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          RESTART
        </button>
      </div>
    )
  }

  if (gameState === 'cleared') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center dark:border-emerald-900 dark:from-emerald-950 dark:to-zinc-950">
        <div className="mb-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">DUNGEON CLEARED</div>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">Your solution has converged!</p>
        <div className="mb-6 space-y-1 text-sm">
          <p>Correct: {correctCount} / {stages.length}</p>
          <p>Total XP: {xp}</p>
          <p>Remaining HP: {hp}</p>
          <p className="mt-2 text-lg font-bold">Rank: {getRank()}</p>
        </div>
        <button
          onClick={handleRestart}
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          PLAY AGAIN
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Status bar */}
      <div className="mb-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono">
            HP:{' '}
            <span className={hp <= 1 ? 'text-red-500' : ''}>
              {'#'.repeat(hp)}{'_'.repeat(3 - hp)}
            </span>
          </span>
          <span className="font-mono">XP: {xp}</span>
        </div>
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium dark:bg-zinc-800">
          {currentStage + 1} / {stages.length}
        </span>
      </div>

      {/* Stage header */}
      <div className="mb-4">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {stage.description}
        </div>
        <h3 className="text-xl font-bold">{stage.title}</h3>
      </div>

      {/* Concept */}
      <div className="mb-6 rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        {stage.concept}
      </div>

      {/* Question */}
      <div className="mb-4 font-medium">{stage.question}</div>

      {/* Options */}
      <div className="mb-6 space-y-2">
        {stage.options.map((option, index) => {
          let style = 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
          if (showExplanation) {
            if (index === stage.correctIndex) {
              style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600'
            } else if (index === selectedOption && index !== stage.correctIndex) {
              style = 'border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600'
            } else {
              style = 'border-zinc-200 dark:border-zinc-800 opacity-50'
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showExplanation}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${style}`}
            >
              <span className="mr-2 font-mono text-zinc-400">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mb-4">
          <div className={`mb-4 rounded-lg p-4 text-sm leading-relaxed ${
            selectedOption === stage.correctIndex
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
          }`}>
            <div className="mb-1 font-bold">
              {selectedOption === stage.correctIndex
                ? `Correct! +${stage.xpReward} XP`
                : 'Wrong! -1 HP'}
            </div>
            {stage.explanation}
          </div>
          <button
            onClick={handleNext}
            className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {hp <= 0
              ? 'VIEW RESULTS'
              : currentStage >= stages.length - 1
                ? 'VIEW RESULTS'
                : 'NEXT STAGE'}
          </button>
        </div>
      )}
    </div>
  )
}
