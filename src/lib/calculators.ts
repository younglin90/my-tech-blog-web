// CFD 계산기 메타데이터.
// 새 계산기 추가 시 여기에 한 줄, src/components/calculators/{slug}.tsx 추가.

export type CalculatorCategory = 'dimensionless' | 'turbulence' | 'heat-transfer' | 'numerics'

export const CATEGORY_LABELS: Record<CalculatorCategory, string> = {
  'dimensionless': 'Dimensionless Numbers',
  'turbulence': 'Turbulence',
  'heat-transfer': 'Heat Transfer',
  'numerics': 'Numerics & Stability',
}

export interface CalculatorMeta {
  slug: string
  title: Record<string, string>
  desc: Record<string, string>
  formula: string
  tags: string[]
  category: CalculatorCategory
}

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: 'reynolds',
    category: 'dimensionless',
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
    category: 'dimensionless',
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
    slug: 'prandtl',
    category: 'dimensionless',
    title: { ko: 'Prandtl 수', en: 'Prandtl Number', ja: 'プラントル数', zh: '普朗特数', es: 'Número de Prandtl' },
    desc: {
      ko: '운동량 확산 vs 열 확산의 비. 열전달 경계층 두께 판정.',
      en: 'Momentum-to-thermal diffusivity ratio. Determines relative thickness of velocity vs thermal boundary layers.',
      ja: '運動量拡散対熱拡散の比。速度境界層と熱境界層の厚さ比。',
      zh: '动量扩散与热扩散之比。决定速度与热边界层相对厚度。',
      es: 'Razón difusividad momento/térmica. Determina espesores relativos de capas límite.',
    },
    formula: 'Pr = \\dfrac{\\mu C_p}{k} = \\dfrac{\\nu}{\\alpha}',
    tags: ['Prandtl', 'heat transfer', 'convection'],
  },
  {
    slug: 'boundary-layer',
    category: 'turbulence',
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
    slug: 'kolmogorov',
    category: 'turbulence',
    title: { ko: 'Kolmogorov 미세척도', en: 'Kolmogorov Microscales', ja: 'コルモゴロフ微細スケール', zh: '科尔莫戈罗夫微尺度', es: 'Microescalas de Kolmogorov' },
    desc: {
      ko: '난류 에너지 캐스케이드의 가장 작은 길이·시간·속도 척도.',
      en: 'Smallest length, time and velocity scales in the turbulence energy cascade.',
      ja: '乱流エネルギーカスケードの最小スケール。',
      zh: '湍流能量级串中的最小长度、时间和速度尺度。',
      es: 'Escalas mínimas de longitud, tiempo y velocidad en la cascada energética turbulenta.',
    },
    formula: '\\eta = \\left(\\dfrac{\\nu^3}{\\varepsilon}\\right)^{1/4}, \\quad \\tau_\\eta = \\left(\\dfrac{\\nu}{\\varepsilon}\\right)^{1/2}',
    tags: ['Kolmogorov', 'turbulence', 'DNS'],
  },
  {
    slug: 'turbulence-intensity',
    category: 'turbulence',
    title: { ko: '난류 강도 / k-ε 경계조건', en: 'Turbulence Intensity / k-ε BCs', ja: '乱流強度 / k-ε 境界条件', zh: '湍流强度 / k-ε 边界条件', es: 'Intensidad de turbulencia / BCs k-ε' },
    desc: {
      ko: '난류 강도 I에서 k, ε, ω 입구 경계조건 계산. OpenFOAM/Fluent 설정에 바로 사용.',
      en: 'Compute k, ε, ω inlet BCs from turbulence intensity I. Ready to use in OpenFOAM / Fluent.',
      ja: '乱流強度IからRk, ε, ω入口境界条件を計算。OpenFOAM/Fluentに直接使用可。',
      zh: '由湍流强度I计算k, ε, ω入口边界条件，直接用于OpenFOAM/Fluent。',
      es: 'Calcula BCs de entrada k, ε, ω desde la intensidad de turbulencia I. Listo para OpenFOAM/Fluent.',
    },
    formula: 'k = \\tfrac{3}{2}(IU)^2, \\quad \\varepsilon = C_\\mu^{3/4} k^{3/2} / \\ell',
    tags: ['turbulence', 'boundary condition', 'OpenFOAM', 'k-epsilon'],
  },
  {
    slug: 'nusselt',
    category: 'heat-transfer',
    title: { ko: 'Nusselt 수 / h', en: 'Nusselt Number / h', ja: 'ヌセルト数 / h', zh: '努塞尔数 / h', es: 'Número de Nusselt / h' },
    desc: {
      ko: '대류 vs 전도 열전달의 비. 열전달 계수 h 계산.',
      en: 'Convective-to-conductive heat transfer ratio. Computes h from Nu correlations.',
      ja: '対流対伝導熱伝達の比。Nu相関からhを計算。',
      zh: '对流与导热之比。由Nu相关式计算h。',
      es: 'Razón transferencia convectiva/conductiva. Calcula h a partir de correlaciones Nu.',
    },
    formula: 'Nu = \\dfrac{h L}{k}, \\quad h = \\dfrac{Nu \\cdot k}{L}',
    tags: ['Nusselt', 'heat transfer', 'convection'],
  },
  {
    slug: 'cfl',
    category: 'numerics',
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
