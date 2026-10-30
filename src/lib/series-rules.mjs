// Series definitions and the rule that places each post in one of them.
// Shared by scripts/build-post-index.mjs (post-index.json) and src/lib/series.ts,
// so the series page, post badges, search and link previews always agree.
//
// A post's frontmatter `series:` wins. Otherwise the post goes to the series whose
// tag weights score highest (its first tag counts 1.6x). New daily posts therefore
// join a series automatically; add a tag here when a new topic keeps landing in none.

export const SERIES = [
  {
    slug: 'numerical-methods',
    tags: { FVM: 2, FDM: 2, 'Numerical-Analysis': 2, 'Unstructured-Grid': 2, Mesh: 2, 'Mesh-Generation': 2, AMR: 2, Curvilinear: 2, 'Boundary-Conditions': 2, Advection: 1, Diffusion: 1, SIMPLE: 2, 'Rhie-Chow': 3, CFD: 1, 'Numerical-Methods': 2, 'High-Order': 1, Incompressible: 1, 'Projection-Method': 3, 'Fractional-Step': 3, 'Pressure-Poisson': 2 },
    title: { ko: '수치 기법', en: 'Numerical Methods', ja: '数値手法', zh: '数值方法', es: 'Métodos numéricos' },
    description: {
      ko: '유한체적·유한차분 이산화, 격자, 경계조건, 압력–속도 연성까지 CFD 솔버의 뼈대를 이루는 수치 기법.',
      en: 'Discretization, meshes, boundary conditions and pressure–velocity coupling: the numerical backbone of a CFD solver.',
      ja: '有限体積・有限差分の離散化、格子、境界条件、圧力–速度連成まで、CFDソルバーの骨格となる数値手法。',
      zh: '有限体积与有限差分离散、网格、边界条件和压力–速度耦合，构成 CFD 求解器骨架的数值方法。',
      es: 'Discretización, mallas, condiciones de contorno y acoplamiento presión–velocidad: la base numérica de un solver CFD.',
    },
  },
  {
    slug: 'shock-capturing',
    tags: { 'Shock-Capturing': 3, Riemann: 3, 'Riemann-Solver': 3, TVD: 3, 'Flux-Limiter': 3, 'Slope-Limiter': 3, WENO: 3, TENO: 3, MUSCL: 3, Godunov: 3, HLLC: 3, Characteristics: 2, Compressible: 1, 'Compressible-Flow': 1 },
    title: { ko: '충격파 포착과 리만 솔버', en: 'Shock Capturing & Riemann Solvers', ja: '衝撃波捕獲とリーマンソルバー', zh: '激波捕捉与黎曼求解器', es: 'Captura de choques y solvers de Riemann' },
    description: {
      ko: '리만 솔버, TVD·플럭스 제한자, MUSCL·WENO·TENO 재구성으로 불연속을 날카롭고 안정하게 잡는 방법.',
      en: 'Riemann solvers, TVD flux limiters and MUSCL/WENO/TENO reconstruction for sharp, stable discontinuities.',
      ja: 'リーマンソルバー、TVD・流束制限関数、MUSCL・WENO・TENO再構成で不連続を鋭く安定に捉える方法。',
      zh: '用黎曼求解器、TVD 通量限制器以及 MUSCL/WENO/TENO 重构，锐利而稳定地捕捉间断。',
      es: 'Solvers de Riemann, limitadores TVD y reconstrucción MUSCL/WENO/TENO para capturar discontinuidades nítidas y estables.',
    },
  },
  {
    slug: 'implicit-solvers',
    tags: { 'Low-Mach': 3, IMEX: 3, Implicit: 2, Preconditioning: 2, 'Asymptotic-Preserving': 3, 'Dual-Time': 3, 'Time-Integration': 2, Acoustics: 1, Krylov: 3, 'Newton-Krylov': 3, Multigrid: 3, 'Linear-Solver': 3, 'Iterative-Solver': 3, Poisson: 2, GMRES: 3, Algorithms: 1 },
    title: { ko: '암시적 해법과 선형 솔버', en: 'Implicit Methods & Linear Solvers', ja: '陰的解法と線形ソルバー', zh: '隐式方法与线性求解器', es: 'Métodos implícitos y solvers lineales' },
    description: {
      ko: '저마하 예조건화, IMEX·이중 시간 전진, 크릴로프·뉴턴–크릴로프·멀티그리드로 큰 연립방정식을 빠르게 푸는 법.',
      en: 'Low-Mach preconditioning, IMEX and dual-time stepping, and Krylov, Newton–Krylov and multigrid solvers for large systems.',
      ja: '低マッハ前処理、IMEX・双対時間ステップ、クリロフ・ニュートン–クリロフ・マルチグリッドで大規模な連立方程式を速く解く方法。',
      zh: '低马赫预处理、IMEX 与双时间步推进，以及 Krylov、Newton–Krylov 和多重网格等大规模方程组求解方法。',
      es: 'Precondicionamiento a bajo Mach, IMEX y paso de tiempo dual, y solvers de Krylov, Newton–Krylov y multigrid para sistemas grandes.',
    },
  },
  {
    slug: 'compressible-multiphase',
    tags: { Multiphase: 3, 'Compressible-Multiphase': 4, 'Diffuse-Interface': 3, 'Interface-Capturing': 3, VOF: 3, THINC: 3, 'Surface-Tension': 2, 'Five-Equation': 4, 'Level-Set': 3, Cavitation: 3, 'Phase-Change': 2, 'Ghost-Fluid-Method': 3, 'Sharp-Interface': 3, 'Multi-Material': 3 },
    title: { ko: '압축성 다상유동', en: 'Compressible Multiphase', ja: '圧縮性多相流', zh: '可压缩多相流', es: 'Flujo multifásico compresible' },
    description: {
      ko: '확산 경계면과 5-방정식 모델, 경계면 포착(VOF·THINC), 표면장력까지 압축성 다상유동 해석의 핵심.',
      en: 'Diffuse-interface and five-equation models, interface capturing (VOF, THINC) and surface tension for compressible multiphase flow.',
      ja: '拡散界面モデルと5方程式モデル、界面捕獲(VOF・THINC)、表面張力まで、圧縮性多相流解析の要点。',
      zh: '扩散界面与五方程模型、界面捕捉(VOF、THINC)以及表面张力，可压缩多相流计算的核心。',
      es: 'Modelos de interfaz difusa y de cinco ecuaciones, captura de interfaces (VOF, THINC) y tensión superficial en flujo multifásico compresible.',
    },
  },
  {
    slug: 'lattice-boltzmann',
    tags: { LBM: 4, 'Chapman-Enskog': 3, 'Kinetic-Theory': 2, 'Forcing-Term': 2, Boltzmann: 3 },
    title: { ko: '격자 볼츠만 방법', en: 'Lattice Boltzmann Method', ja: '格子ボルツマン法', zh: '格子玻尔兹曼方法', es: 'Método de Lattice Boltzmann' },
    description: {
      ko: 'Chapman–Enskog 전개, 충돌 연산자, 외력항, 경계 처리까지 격자 볼츠만 방법을 운동론에서부터 따라간다.',
      en: 'The lattice Boltzmann method from kinetic theory: Chapman–Enskog expansion, collision operators, forcing terms and boundaries.',
      ja: 'Chapman–Enskog展開、衝突演算子、外力項、境界処理まで、格子ボルツマン法を気体分子運動論から追う。',
      zh: '从分子运动论出发理解格子玻尔兹曼方法：Chapman–Enskog 展开、碰撞算子、外力项与边界处理。',
      es: 'El método de Lattice Boltzmann desde la teoría cinética: expansión de Chapman–Enskog, operadores de colisión, términos de fuerza y contornos.',
    },
  },
  {
    slug: 'fem-dg',
    tags: { FEM: 3, 'Discontinuous-Galerkin': 3, DG: 3, DGM: 3, Spectral: 2 },
    title: { ko: '유한요소와 DG', en: 'FEM and DG', ja: '有限要素と DG', zh: '有限元与 DG', es: 'FEM y DG' },
    description: {
      ko: '유한요소법과 불연속 갤러킨(DG)의 정식화, 기저함수, 구현.',
      en: 'Finite element and discontinuous Galerkin formulations, basis functions and implementation.',
      ja: '有限要素法と不連続ガラーキン法(DG)の定式化、基底関数、実装。',
      zh: '有限元与间断伽辽金(DG)方法的公式、基函数与实现。',
      es: 'Formulaciones de elementos finitos y Galerkin discontinuo, funciones base e implementación.',
    },
  },
  {
    slug: 'fsi-particles',
    tags: { FSI: 3, SPH: 3, IBM: 3, 'Rigid-Body': 2, DEM: 3, 'Moving-Mesh': 2 },
    title: { ko: '유동–구조 연성과 입자법', en: 'FSI & Particle Methods', ja: '流体構造連成と粒子法', zh: '流固耦合与粒子方法', es: 'FSI y métodos de partículas' },
    description: {
      ko: '유동–구조 연성(FSI), 가상 경계법, SPH 같은 입자법으로 움직이는 물체와 유체를 함께 푼다.',
      en: 'Fluid–structure interaction, immersed boundaries and particle methods such as SPH for moving bodies in flow.',
      ja: '流体構造連成(FSI)、埋め込み境界法、SPHなどの粒子法で、動く物体と流体を一緒に解く。',
      zh: '流固耦合(FSI)、浸入边界法以及 SPH 等粒子方法，同时求解运动物体与流体。',
      es: 'Interacción fluido–estructura, fronteras inmersas y métodos de partículas como SPH para cuerpos en movimiento.',
    },
  },
  {
    slug: 'flow-physics',
    tags: { 'Flow-Phenomena': 2, 'Fluid-Dynamics': 2, 'Boundary-Layer': 2, Vortex: 2, Reynolds: 2, Poiseuille: 2, Bernoulli: 2, Turbulence: 2, 'Natural-Convection': 2, 'Heat-Transfer': 2, Combustion: 2, Viscosity: 1, Historical: 1, 'Fluid-Mechanics': 2, 'Prandtl-Number': 2, 'Analytical-Solution': 1, Turbomachinery: 2, 'Rotating-Frame': 2, Coriolis: 2 },
    title: { ko: '유체역학 현상', en: 'Flow Physics', ja: '流体力学の現象', zh: '流体力学现象', es: 'Física de fluidos' },
    description: {
      ko: '경계층, 와류, 난류, 열전달, 연소처럼 수치 해석이 재현해야 할 물리 현상과 그 역사.',
      en: 'Boundary layers, vortices, turbulence, heat transfer and combustion: the physics a simulation has to reproduce, and its history.',
      ja: '境界層、渦、乱流、熱伝達、燃焼など、数値解析が再現すべき物理現象とその歴史。',
      zh: '边界层、涡、湍流、传热与燃烧，数值模拟需要再现的物理现象及其历史。',
      es: 'Capas límite, vórtices, turbulencia, transferencia de calor y combustión: la física que una simulación debe reproducir y su historia.',
    },
  },
  {
    slug: 'openfoam-practice',
    tags: { OpenFOAM: 4, 'CFD-Verification': 3 },
    title: { ko: 'OpenFOAM 실무', en: 'OpenFOAM in Practice', ja: 'OpenFOAM実践', zh: 'OpenFOAM 实战', es: 'OpenFOAM en la práctica' },
    description: {
      ko: 'OpenFOAM 케이스 설정과 검증 예제를 다룬다.',
      en: 'OpenFOAM case setup and verification examples.',
      ja: 'OpenFOAMのケース設定と検証例を扱う。',
      zh: 'OpenFOAM 的算例设置与验证示例。',
      es: 'Configuración de casos en OpenFOAM y ejemplos de verificación.',
    },
  },
  {
    slug: 'paper-review',
    tags: { 'Paper-Review': 10 },
    title: { ko: '논문 리뷰', en: 'Paper Reviews', ja: '論文レビュー', zh: '论文评述', es: 'Reseñas de artículos' },
    description: {
      ko: 'CFD와 유체역학 논문을 골라 핵심 아이디어, 수식, 재현 코드로 읽는다.',
      en: 'Selected CFD and fluid-mechanics papers, read through their key idea, equations and a reproduction script.',
      ja: 'CFDと流体力学の論文を選び、核となるアイデア・数式・再現コードで読む。',
      zh: '精选 CFD 与流体力学论文，从核心思想、公式和复现代码入手解读。',
      es: 'Artículos de CFD y mecánica de fluidos leídos a través de su idea clave, sus ecuaciones y un código de reproducción.',
    },
  },
]

const FIRST_TAG_WEIGHT = 1.6
const MIN_SCORE = 1.6

/** @param {{ series?: string, tags?: string[] }} post */
export function resolveSeries(post) {
  if (post.series) return post.series
  const tags = post.tags ?? []
  if (tags.includes('Paper-Review')) return 'paper-review'
  let best
  let bestScore = 0
  for (const s of SERIES) {
    let score = 0
    tags.forEach((tag, i) => { score += (s.tags[tag] ?? 0) * (i === 0 ? FIRST_TAG_WEIGHT : 1) })
    if (score > bestScore) { best = s.slug; bestScore = score }
  }
  return bestScore >= MIN_SCORE ? best : undefined
}
