// CFD 계산기 메타데이터.
// 새 계산기 추가 시 여기에 한 줄, src/components/calculators/{slug}.tsx 추가.

export interface CalculatorMeta {
  slug: string
  title: Record<string, string>      // i18n
  desc: Record<string, string>
  formula: string                     // KaTeX (자유)
  tags: string[]
}

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: 'reynolds',
    title: { ko: 'Reynolds 수', en: 'Reynolds Number', ja: 'レイノルズ数', zh: '雷诺数', es: 'Número de Reynolds' },
    desc: {
      ko: '관성력 vs 점성력의 비. 층류·난류 천이 판정.',
      en: 'Inertial-to-viscous ratio. Predicts laminar–turbulent transition.',
      ja: '慣性力対粘性力の比。層流-乱流遷移を予測。',
      zh: '惯性力与粘性力之比。预测层流-湍流转捩。',
      es: 'Razón inercia/viscosidad. Predice la transición laminar-turbulenta.',
    },
    formula: 'Re = \\dfrac{\\rho U L}{\\mu} = \\dfrac{U L}{\\nu}',
    tags: ['Reynolds', 'transition', 'CFD'],
  },
  {
    slug: 'mach',
    title: { ko: 'Mach 수', en: 'Mach Number', ja: 'マッハ数', zh: '马赫数', es: 'Número de Mach' },
    desc: {
      ko: '유속 대 음속의 비. 압축성/충격파 평가.',
      en: 'Flow-to-sound speed ratio. Assess compressibility / shocks.',
      ja: '流速と音速の比。圧縮性・衝撃波評価。',
      zh: '流速与声速之比。评估可压缩性/激波。',
      es: 'Razón velocidad/velocidad del sonido. Compresibilidad/choques.',
    },
    formula: 'M = \\dfrac{U}{a}, \\quad a = \\sqrt{\\gamma R T}',
    tags: ['Mach', 'compressible', 'CFD'],
  },
  {
    slug: 'boundary-layer',
    title: { ko: '경계층 두께', en: 'Boundary Layer Thickness', ja: '境界層厚さ', zh: '边界层厚度', es: 'Espesor de capa límite' },
    desc: {
      ko: '평판 위 층류·난류 경계층 두께.',
      en: 'Laminar/turbulent BL thickness over a flat plate.',
      ja: '平板上の層流・乱流境界層厚さ。',
      zh: '平板上层流/湍流边界层厚度。',
      es: 'Espesor de capa límite laminar/turbulenta sobre placa plana.',
    },
    formula: '\\delta_{lam} \\approx \\dfrac{5 x}{\\sqrt{Re_x}}, \\quad \\delta_{turb} \\approx \\dfrac{0.37 x}{Re_x^{1/5}}',
    tags: ['boundary layer', 'fluid mechanics'],
  },
  {
    slug: 'cfl',
    title: { ko: 'CFL 조건', en: 'CFL Condition', ja: 'CFL条件', zh: 'CFL 条件', es: 'Condición CFL' },
    desc: {
      ko: '명시적 시간 적분의 안정성 조건.',
      en: 'Stability condition for explicit time integration.',
      ja: '陽的時間積分の安定条件。',
      zh: '显式时间积分的稳定性条件。',
      es: 'Condición de estabilidad para integración temporal explícita.',
    },
    formula: 'C = \\dfrac{u \\Delta t}{\\Delta x} \\le C_{max}',
    tags: ['CFL', 'numerics', 'stability'],
  },
]
