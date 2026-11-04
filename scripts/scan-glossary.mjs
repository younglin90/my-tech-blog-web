#!/usr/bin/env node
// source-docs/glossary.yaml + published ko posts -> src/lib/glossary.json.
// The glossary page is a post-derived CFD dictionary, not a detached static list.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'source-docs/glossary.yaml'
const I18N = 'source-docs/glossary-i18n.json'
const POSTS_DIR = 'src/content/posts/ko'
const OUT = 'src/lib/glossary.json'
const LOCALES = ['ja', 'zh', 'es']

const AUTO_TERMS = {
  'Navier-Stokes': {
    ko: '질량·운동량 보존으로 유체 운동을 기술하는 지배방정식.',
    en: 'Governing equations for fluid motion from mass and momentum conservation.',
    aliases: ['Navier–Stokes', 'Navier Stokes', 'N-S'],
  },
  'Finite Volume': {
    ko: '셀 체적에 보존법칙을 적분해 면 플럭스로 이산화하는 CFD 방법.',
    en: 'CFD method that integrates conservation laws over cells and discretizes face fluxes.',
    aliases: ['FVM', 'finite-volume', '유한체적'],
  },
  'Finite Difference': {
    ko: '격자점 값의 차분으로 미분 연산자를 근사하는 수치 방법.',
    en: 'Numerical method that approximates derivatives with differences between grid values.',
    aliases: ['FDM', 'finite-difference', '유한차분'],
  },
  'Finite Element': {
    ko: '요소별 기저함수와 약형식을 사용해 PDE를 이산화하는 방법.',
    en: 'PDE discretization using element-wise basis functions and weak forms.',
    aliases: ['FEM', 'finite-element', '유한요소'],
  },
  DG: {
    ko: 'Discontinuous Galerkin. 요소 사이 불연속을 허용하는 고차 Galerkin 계열 방법.',
    en: 'Discontinuous Galerkin method; a high-order Galerkin family allowing inter-element jumps.',
    aliases: ['Discontinuous Galerkin'],
  },
  'Flux Limiter': {
    ko: '급격한 구배에서 진동을 억제하도록 고차 보정량을 제한하는 비선형 함수.',
    en: 'Nonlinear function that limits high-order corrections to suppress oscillations near steep gradients.',
    aliases: ['flux limiter', 'limiter'],
  },
  TENO: {
    ko: 'Targeted ENO. 후보 스텐실을 0/1 방식으로 선별하는 저소산 충격파 포착 재구성.',
    en: 'Targeted ENO reconstruction that selects candidate stencils with a sharp 0/1 decision.',
  },
  'Lax-Wendroff': {
    ko: '시간 Taylor 전개를 이용하는 2차 정확도 선형 이류 스킴.',
    en: 'Second-order linear advection scheme based on a time Taylor expansion.',
    aliases: ['Lax–Wendroff'],
  },
  'Rhie-Chow': {
    ko: 'Collocated 격자에서 압력 체커보드 진동을 막는 운동량 가중 보간.',
    en: 'Momentum-weighted interpolation that suppresses checkerboard pressure modes on collocated grids.',
    aliases: ['Rhie & Chow', 'MWI'],
  },
  'Checkerboard Pressure': {
    ko: '압력과 속도 결합이 약할 때 격자에 번갈아 나타나는 비물리적 압력 모드.',
    en: 'Nonphysical alternating pressure mode caused by weak pressure-velocity coupling.',
    aliases: ['checkerboard', '체커보드 압력'],
  },
  'Collocated Grid': {
    ko: '압력과 속도 등 변수를 같은 셀 중심에 저장하는 격자 배치.',
    en: 'Grid arrangement storing pressure, velocity, and other variables at the same cell center.',
    aliases: ['collocated'],
  },
  'Staggered Grid': {
    ko: '압력과 속도 성분을 서로 다른 위치에 저장해 압력-속도 결합을 강화하는 격자.',
    en: 'Grid arrangement that stores pressure and velocity components at different locations.',
    aliases: ['staggered'],
  },
  'Riemann Solver': {
    ko: '셀 경계의 좌우 상태로 국소 리만 문제를 풀어 수치 플럭스를 구하는 알고리즘.',
    en: 'Algorithm that solves a local Riemann problem at a cell face to compute numerical flux.',
    aliases: ['Riemann solver', '리만 솔버'],
  },
  'Five-Equation Model': {
    ko: '압축성 다상유동에서 상 부피분율과 혼합 운동량·에너지를 추적하는 5개 방정식 모델.',
    en: 'Compressible multiphase model tracking volume fraction plus mixture momentum and energy.',
    aliases: ['five-equation', '5-equation'],
  },
  'Speed of Sound': {
    ko: '압력 교란이 매질을 통해 전파되는 속도. 압축성 혼합물에서는 상분율에 민감하다.',
    en: 'Propagation speed of pressure disturbances; sensitive to phase fraction in compressible mixtures.',
    aliases: ['음속'],
  },
  'Level Set': {
    ko: '계면을 부호 거리 함수의 영등위면으로 표현하는 계면 포착 방법.',
    en: 'Interface-capturing method representing the interface as the zero contour of a signed-distance function.',
  },
  'Diffuse Interface': {
    ko: '계면을 불연속 면이 아니라 유한 두께의 완만한 전이층으로 표현하는 모델.',
    en: 'Model that represents an interface as a finite-thickness transition layer instead of a sharp discontinuity.',
    aliases: ['확산 계면'],
  },
  'Volume Fraction': {
    ko: '다상유동 셀에서 특정 상이 차지하는 체적 비율.',
    en: 'Fraction of a cell volume occupied by a particular phase in multiphase flow.',
    aliases: ['void fraction', '부피분율', '체적분율'],
  },
  'Boundary Layer': {
    ko: '벽면 점성 영향으로 속도 구배가 집중되는 얇은 유동 영역.',
    en: 'Thin near-wall region where viscous effects concentrate velocity gradients.',
    aliases: ['경계층'],
  },
  'Wall Distance': {
    ko: '셀 또는 점에서 가장 가까운 벽까지의 거리. 벽함수와 난류 모델에 필요하다.',
    en: 'Distance from a cell or point to the nearest wall, needed by wall functions and turbulence models.',
    aliases: ['wall-distance', '벽거리'],
  },
  'Fast Marching': {
    ko: 'Eikonal 방정식의 도착 시간을 단조적으로 전파해 거리장을 계산하는 알고리즘.',
    en: 'Algorithm that computes distance or arrival-time fields by monotone propagation of the Eikonal equation.',
    aliases: ['fast marching'],
  },
  Eikonal: {
    ko: '거리 함수나 파면 도착 시간을 나타내는 일차 비선형 PDE.',
    en: 'First-order nonlinear PDE describing distance functions or wavefront arrival time.',
  },
  Krylov: {
    ko: '행렬-벡터 곱으로 생성되는 부분공간. 대형 선형 시스템 반복해법의 기반.',
    en: 'Subspace generated by matrix-vector products; basis of iterative solvers for large linear systems.',
  },
  GMRES: {
    ko: '비대칭 선형 시스템에서 잔차를 최소화하는 Krylov 부분공간 반복해법.',
    en: 'Krylov iterative method that minimizes residuals for nonsymmetric linear systems.',
  },
  BiCGSTAB: {
    ko: '비대칭 선형 시스템에 쓰이는 안정화된 쌍켤레기울기 반복해법.',
    en: 'Stabilized bi-conjugate-gradient iterative solver for nonsymmetric linear systems.',
  },
  'Rankine Vortex': {
    ko: '안쪽은 강제와류, 바깥은 자유와류로 구성된 단순한 와류 모델.',
    en: 'Simple vortex model with a forced-vortex core and free-vortex exterior.',
    aliases: ['Rankine vortex'],
  },
  Vorticity: {
    ko: '속도장의 curl. 유체 입자 회전률의 두 배로 해석된다.',
    en: 'Curl of the velocity field; twice the local spin rate of a fluid particle.',
    aliases: ['와도'],
  },
  Helmholtz: {
    ko: '비점성 바로트로픽 유동에서 와선의 보존 성질을 설명하는 고전 와류 정리.',
    en: 'Classical vortex theorem describing vortex-line conservation in inviscid barotropic flow.',
  },
  'Dean Vortex': {
    ko: '곡관의 원심력으로 생기는 단면 내 한 쌍의 이차 유동 와류.',
    en: 'Pair of secondary-flow vortices generated by centrifugal effects in curved pipes.',
    aliases: ['Dean vortices', 'Dean 와류'],
  },
  Poiseuille: {
    ko: '압력 구배가 구동하는 점성 지배 내부 유동의 해석해.',
    en: 'Analytical viscous internal flow driven by a pressure gradient.',
  },
  'Plateau-Rayleigh': {
    ko: '표면장력으로 액주가 액적으로 끊어지는 불안정성.',
    en: 'Surface-tension instability that breaks a liquid jet into droplets.',
    aliases: ['Plateau–Rayleigh'],
  },
  'Shallow Water': {
    ko: '수평 길이가 수심보다 훨씬 클 때 자유수면 유동을 깊이 평균한 방정식 계열.',
    en: 'Depth-averaged free-surface flow equations for horizontal scales much larger than depth.',
    aliases: ['shallow-water', '천수방정식'],
  },
  'Semi-Implicit': {
    ko: '강한 안정성 제약을 만드는 항은 암시적으로, 나머지는 명시적으로 처리하는 시간 적분.',
    en: 'Time integration that treats stiff terms implicitly and other terms explicitly.',
    aliases: ['semi-implicit'],
  },
  Quaternion: {
    ko: '3D 회전을 특이점 없이 표현하는 4성분 수 체계.',
    en: 'Four-component number system for singularity-free 3D rotations.',
  },
  PINN: {
    ko: 'Physics-Informed Neural Network. PDE 잔차를 손실 함수에 넣는 신경망 방법.',
    en: 'Physics-Informed Neural Network that embeds PDE residuals into the loss function.',
  },
  'k-epsilon': {
    ko: '난류 운동에너지 k와 소산률 epsilon을 푸는 2방정식 RANS 모델.',
    en: 'Two-equation RANS model solving turbulence kinetic energy k and dissipation epsilon.',
    aliases: ['k-ε', 'k epsilon'],
  },
  SST: {
    ko: '벽 근처 k-omega와 외부 k-epsilon 특성을 섞은 난류 모델.',
    en: 'Turbulence model blending near-wall k-omega behavior with outer-flow k-epsilon behavior.',
  },
  'y+': {
    ko: '벽면 첫 셀 거리의 무차원 값. 벽함수와 wall-resolved 해석의 핵심 지표.',
    en: 'Nondimensional wall distance of the first cell; key metric for wall functions and wall-resolved CFD.',
    aliases: ['y-plus', 'y plus'],
  },
  "Peclet": {
    ko: "이류와 확산의 비. 격자 페클레 수가 크면 풍상 쪽 안정화가 필요해진다.",
    en: "Ratio of advection to diffusion. A large cell Peclet number calls for upwind stabilization.",
    aliases: ["Péclet","Peclet","페클레"],
  },
  "Prandtl": {
    ko: "운동량 확산과 열확산의 비. 경계층 두께 비를 가른다.",
    en: "Ratio of momentum diffusivity to thermal diffusivity. It sets the boundary-layer thickness ratio.",
    aliases: ["Prandtl","프란틀"],
  },
  "Nusselt": {
    ko: "대류 열전달과 순수 전도의 비. 벽 열유속의 무차원 지표다.",
    en: "Ratio of convective heat transfer to pure conduction. Dimensionless wall heat flux.",
    aliases: ["Nusselt","누셀"],
  },
  "Weber": {
    ko: "관성력과 표면장력의 비. 액적 분열과 계면 변형의 기준이다.",
    en: "Ratio of inertia to surface tension. It marks droplet breakup and interface deformation.",
    aliases: ["Weber","웨버"],
  },
  "Froude": {
    ko: "관성력과 중력의 비. 자유수면과 성층 유동에서 파동 레짐을 가른다.",
    en: "Ratio of inertia to gravity. It separates wave regimes in free-surface and stratified flow.",
    aliases: ["Froude","프루드"],
  },
  "Knudsen": {
    ko: "평균 자유 행로와 유동 길이의 비. 연속체 가정이 깨지는 정도를 나타낸다.",
    en: "Ratio of mean free path to a flow length. It measures the breakdown of the continuum assumption.",
    aliases: ["Knudsen","크누센"],
  },
  "Damkohler": {
    ko: "유동 시간 스케일과 화학 반응 시간의 비. 반응이 이류에 비해 얼마나 빠른지 본다.",
    en: "Ratio of a flow time scale to a chemical time scale. It says how fast reaction is relative to advection.",
    aliases: ["Damkohler","Damköhler","담쾰러"],
  },
  "Karlovitz": {
    ko: "화염 시간 스케일과 난류 시간 스케일의 비. 화염이 난류에 얼마나 꺾이는지 본다.",
    en: "Ratio of a flame time scale to a turbulence time scale. It measures how strongly turbulence wrinkles the flame.",
    aliases: ["Karlovitz","칼로비츠"],
  },
  "Strouhal": {
    ko: "와 방출 진동수에 길이·속도를 곱한 무차원수. 후류 주기를 정한다.",
    en: "Dimensionless shedding frequency times length over speed. It sets the wake period.",
    aliases: ["Strouhal","스트로할"],
  },
  "Smagorinsky": {
    ko: "아격자 응력을 국소 변형률과 필터 폭으로 닫는 LES 와점성 모델.",
    en: "LES eddy-viscosity closure that ties the subgrid stress to the local strain and the filter width.",
    aliases: ["Smagorinsky","스마고린스키"],
  },
  "Spalart-Allmaras": {
    ko: "난류 점성 하나만 푸는 1방정식 RANS 모델. 외류와 공력에 자주 쓴다.",
    en: "One-equation RANS model that transports a turbulent viscosity. Common for external aerodynamics.",
    aliases: ["Spalart-Allmaras","Spalart–Allmaras"],
  },
  "k-omega": {
    ko: "난류 운동에너지와 비소산율 ω를 푸는 2방정식 RANS. 벽에서 ω가 커진다.",
    en: "Two-equation RANS model for turbulent kinetic energy and specific dissipation rate ω. ω grows at the wall.",
    aliases: ["k-omega","k-ω","k–ω"],
  },
  "Wall Function": {
    ko: "점성 저층을 격자 안에 넣지 않고, 벽 법칙으로 첫 셀의 전단을 닫는 경계 조건.",
    en: "Boundary treatment that skips the viscous sublayer and closes the first-cell shear with the law of the wall.",
    aliases: ["wall function","벽함수"],
  },
  "Gauss-Seidel": {
    ko: "바로 갱신한 이웃 값을 쓰는 반복법. 다중격자의 스무더로 자주 쓴다.",
    en: "Iterative solver that uses the newest neighbor values immediately. A common multigrid smoother.",
    aliases: ["Gauss-Seidel","Gauss–Seidel","가우스-자이델","가우스–자이델"],
  },
  "Jacobi": {
    ko: "이웃은 이전 반복 값만 쓰는 반복법. 증분과 오차를 같은 것으로 보면 안 된다.",
    en: "Iterative method that uses only the previous iterate at neighbors. The update is not the error.",
    aliases: ["Jacobi","야코비"],
  },
  "SOR": {
    ko: "Gauss-Seidel 증분에 완화 계수를 곱해 수렴을 당기는 반복법.",
    en: "Gauss–Seidel iteration with a relaxation factor on the update to speed convergence.",
    aliases: ["SOR"],
  },
  "GCI": {
    ko: "세 격자 해로 이산화 불확실성을 추정하는 Grid Convergence Index.",
    en: "Grid Convergence Index. An estimate of discretization uncertainty from three grid solutions.",
    aliases: ["GCI","grid convergence index","격자 수렴"],
  },
  "Runge-Kutta": {
    ko: "한 스텝 안에서 기울기를 여러 번 평가하는 양시적 시간 적분.",
    en: "Explicit time integrator that evaluates the slope several times inside one step.",
    aliases: ["Runge-Kutta","Runge–Kutta","룽게"],
  },
  "Crank-Nicolson": {
    ko: "시각 n과 n+1의 평균으로 시간 미분을 닫는 2차 암시 스킴.",
    en: "Second-order implicit scheme that averages the spatial operator at time levels n and n+1.",
    aliases: ["Crank-Nicolson","Crank–Nicolson"],
  },
  "Upwind": {
    ko: "정보가 흘러오는 쪽 셀로 계면 값을 정하는 이산화. 수치 확산이 붙는다.",
    en: "Discretization that takes the face value from the upstream cell. It adds numerical diffusion.",
    aliases: ["upwind","풍상"],
  },
  "ENO": {
    ko: "가장 매끄러운 스텐실만 골라 보간하는 Essentially Non-Oscillatory 재구성.",
    en: "Essentially Non-Oscillatory reconstruction that keeps only the smoothest stencil.",
    aliases: ["ENO"],
  },
  "van Leer": {
    ko: "연속적으로 변하는 기울기 제한자. 평활 영역에서는 2차를 유지한다.",
    en: "Slope limiter that varies smoothly and stays second-order in smooth regions.",
    aliases: ["van Leer","반 리어"],
  },
  "minmod": {
    ko: "이웃 기울기 중 가장 작은 쪽을 고르는 제한자. 단조에는 강하지만 소산이 크다.",
    en: "Limiter that picks the smallest neighboring slope. Strongly monotone, and quite diffusive.",
    aliases: ["minmod"],
  },
  "Superbee": {
    ko: "허용 범위에서 가장 가파른 기울기를 고르는 제한자. 접촉을 날카롭게 유지한다.",
    en: "Limiter that picks the steepest slope still inside the TVD region. It keeps contacts sharp.",
    aliases: ["superbee","Superbee"],
  },
  "BGK": {
    ko: "분포를 하나의 완화시간으로 평형에 당기는 격자 볼츠만 충돌 모델.",
    en: "Lattice Boltzmann collision that relaxes the distribution toward equilibrium with one relaxation time.",
    aliases: ["BGK"],
  },
  "Shan-Chen": {
    ko: "격자 볼츠만에서 이웃 밀도에 힘을 걸어 상분리를 만드는 다상 모델.",
    en: "Multiphase lattice Boltzmann model that drives phase separation with a force from neighboring densities.",
    aliases: ["Shan-Chen","Shan–Chen"],
  },
  "Guo Forcing": {
    ko: "격자 볼츠만에서 외력을 분포의 1차·2차 모멘트에 맞게 넣는 이산 강제항.",
    en: "Discrete lattice Boltzmann force that matches the first and second moments of an external body force.",
    aliases: ["Guo forcing","Guo"],
  },
  "Rayleigh-Taylor": {
    ko: "무거운 유체가 가벼운 유체 위에 있을 때 계면이 자라는 불안정.",
    en: "Instability that grows when a heavy fluid sits on a lighter one.",
    aliases: ["Rayleigh-Taylor","Rayleigh–Taylor","레일리-테일러","레일리–테일러"],
  },
  "Kelvin-Helmholtz": {
    ko: "속도가 다른 두 층이 맞닿을 때 계면이 말리는 전단 불안정.",
    en: "Shear instability that rolls up an interface between two streams of different speed.",
    aliases: ["Kelvin-Helmholtz","Kelvin–Helmholtz"],
  },
  "Darcy": {
    ko: "다공성 매질의 압력 기울기와 겉보기 속도가 투과율로 묶이는 선형 저항.",
    en: "Linear resistance in a porous medium that ties the pressure gradient to the superficial velocity through permeability.",
    aliases: ["Darcy","다르시"],
  },
  "Forchheimer": {
    ko: "Darcy 항에 속도 제곱 항을 더해 관성 저항을 넣는 다공성 보정.",
    en: "Porous correction that adds a velocity-squared drag to the Darcy term.",
    aliases: ["Forchheimer","포히하이머"],
  },
  "Brinkman": {
    ko: "Darcy 저항에 유효 점성 라플라시안을 더해 벽 근처 전단을 살리는 항.",
    en: "Term that adds an effective viscous Laplacian to Darcy drag so shear survives near a wall.",
    aliases: ["Brinkman"],
  },
  "Blasius": {
    ko: "압력 기울기 없는 층류 평판 경계층의 상사해.",
    en: "Similarity solution for a laminar flat-plate boundary layer with zero pressure gradient.",
    aliases: ["Blasius","블라시우스"],
  },
  "Boussinesq": {
    ko: "밀도 변화를 부력 항에만 남기고 나머지는 비압축으로 두는 근사.",
    en: "Approximation that keeps density variation only in the buoyancy term and treats the rest as incompressible.",
    aliases: ["Boussinesq","부시네스크"],
  },
  "Grashof": {
    ko: "부력과 점성력의 비. 자연대류의 레이놀즈 수에 해당한다.",
    en: "Ratio of buoyancy to viscous force. It plays the role of a Reynolds number for natural convection.",
    aliases: ["Grashof","그라스호프"],
  },
  "Rankine-Hugoniot": {
    ko: "충격파를 가로지르는 질량·운동량·에너지 점프 조건.",
    en: "Jump conditions for mass, momentum, and energy across a shock.",
    aliases: ["Rankine-Hugoniot","Rankine–Hugoniot"],
  },
  "Rarefaction": {
    ko: "팽창파. 특성이 부채처럼 벌어지며 유체가 가속되는 연속 파동.",
    en: "Expansion fan. A continuous wave in which characteristics spread and the fluid accelerates.",
    aliases: ["rarefaction","팽창파"],
  },
  "Contact Discontinuity": {
    ko: "압력과 속도는 연속이고 밀도만 점프하는 파. 충격파와 달리 흐름이 면을 지나가지 않는다.",
    en: "Wave across which pressure and velocity stay continuous while density jumps. Fluid does not cross it.",
    aliases: ["contact discontinuity","접촉 불연속"],
  },
  "Normal Shock": {
    ko: "흐름에 수직인 충격파. 마하 수가 1을 넘어 들어오면 뒤로 아음속이 된다.",
    en: "Shock standing normal to the flow. A supersonic inflow leaves subsonic.",
    aliases: ["normal shock","수직 충격"],
  },
  "Isentropic": {
    ko: "엔트로피가 일정한 압축성 관계. 충격파를 지나기 전의 가속에 쓴다.",
    en: "Compressible relations at constant entropy. Used for acceleration ahead of a shock.",
    aliases: ["isentropic","등엔트로피"],
  },
  "Artificial Viscosity": {
    ko: "충격파 근처에서만 켜는 수치 점성. 진동을 누르되 매끄러운 곳은 건드리지 않는다.",
    en: "Numerical viscosity switched on near shocks. It damps oscillations and leaves smooth regions alone.",
    aliases: ["artificial viscosity","인공 점성"],
  },
  "Projection Method": {
    ko: "속도를 예측한 뒤 압력 푸아송으로 발산을 0에 맞추는 비압축 시간 전진.",
    en: "Incompressible time march that predicts a velocity and then removes its divergence with a pressure Poisson equation.",
    aliases: ["projection method","투영법"],
  },
  "Pressure Poisson": {
    ko: "속도가 무발산이 되도록 압력을 정하는 타원 방정식.",
    en: "Elliptic equation that sets the pressure so the velocity stays divergence-free.",
    aliases: ["pressure Poisson","압력 푸아송","압력 포아송"],
  },
  "Pressure Correction": {
    ko: "예측 속도의 질량 오차를 압력 수정량으로 지우는 SIMPLE 계열의 단계.",
    en: "SIMPLE-family step that removes the mass error of a predicted velocity through a pressure correction.",
    aliases: ["pressure correction","압력 보정"],
  },
  "Dual Time": {
    ko: "물리 시간 안에 의사 시간을 두고 정상 반복으로 한 스텝을 수렴시키는 적분.",
    en: "Time integrator that converges each physical step by iterating in a pseudo-time.",
    aliases: ["dual time","이중 시간"],
  },
  "Pseudo-Time": {
    ko: "정상해로 가는 가짜 시간. 물리 시간과 달리 수렴만 시키면 된다.",
    en: "Fictitious time used to march a steady problem. Only convergence matters, not the path.",
    aliases: ["pseudo-time","pseudo time","의사 시간"],
  },
  "THINC": {
    ko: "쌍곡탄젠트 분포로 계면을 한 셀 안에 가두는 압축 재구성.",
    en: "Compressive reconstruction that traps an interface inside one cell with a hyperbolic tangent profile.",
    aliases: ["THINC"],
  },
  "CICSAM": {
    ko: "계면 법선과 흐름 방향에 따라 압축 도식을 섞는 VOF 이류 스킴.",
    en: "VOF advection scheme that blends a compressive scheme according to the interface normal and the flow direction.",
    aliases: ["CICSAM"],
  },
  "CSF": {
    ko: "표면장력을 계면 두께 안의 체적력으로 바꾸는 Continuum Surface Force.",
    en: "Continuum Surface Force. Turns surface tension into a body force spread across the interface thickness.",
    aliases: ["CSF","continuum surface force"],
  },
  "Parasitic Current": {
    ko: "표면장력 이산화가 평형 액적 주변에 만드는 가짜 속도.",
    en: "Spurious velocity that a surface-tension discretization creates around a droplet that should be at rest.",
    aliases: ["parasitic current"],
  },
  "Spurious Current": {
    ko: "평형이어야 할 계면 주변에 수치 곡률 오차가 만드는 비물리 유동.",
    en: "Nonphysical flow around an interface at equilibrium, driven by errors in the numerical curvature.",
    aliases: ["spurious current"],
  },
  "Height Function": {
    ko: "부피분율을 기둥으로 더해 계면 높이와 곡률을 재는 방법.",
    en: "Method that sums volume fractions into columns to measure interface height and curvature.",
    aliases: ["height function"],
  },
  "Phase Field": {
    ko: "계면을 유한 두께의 질서 변수로 나타내는 확산 계면 모델.",
    en: "Diffuse-interface model that represents the interface by an order parameter of finite thickness.",
    aliases: ["phase field","phase-field"],
  },
  "Cahn-Hilliard": {
    ko: "상장 변수의 화학 퍼텐셜 구배로 계면을 움직이는 4차 확산 방정식.",
    en: "Fourth-order diffusion equation that moves an interface by the gradient of a chemical potential.",
    aliases: ["Cahn-Hilliard","Cahn–Hilliard"],
  },
  "Two-Fluid": {
    ko: "각 상이 자기 속도와 질량 방정식을 갖는 오일러-오일러 다상 모델.",
    en: "Euler–Euler multiphase model in which each phase has its own velocity and mass equation.",
    aliases: ["two-fluid"],
  },
  "Ghost Fluid": {
    ko: "계면 건너편에 가상 유체를 심어 점프 조건을 맞추는 경계 처리.",
    en: "Interface treatment that plants a fictitious fluid across the front so the jump conditions are met.",
    aliases: ["ghost fluid"],
  },
  "Chapman-Enskog": {
    ko: "볼츠만 방정식을 크누센 수로 전개해 나비에-스토크스를 되돌리는 절차.",
    en: "Expansion of the Boltzmann equation in Knudsen number that recovers the Navier–Stokes equations.",
    aliases: ["Chapman-Enskog","Chapman–Enskog"],
  },
  "Bounce-Back": {
    ko: "벽으로 들어온 분포를 반대 방향으로 되돌리는 격자 볼츠만 벽 조건.",
    en: "Lattice Boltzmann wall rule that sends an incoming distribution back in the opposite direction.",
    aliases: ["bounce-back","bounce back"],
  },
  "MRT": {
    ko: "모멘트마다 다른 완화율을 두는 격자 볼츠만 충돌. 저점성에서 BGK보다 안정하다.",
    en: "Lattice Boltzmann collision with a different relaxation rate per moment. More stable than BGK at low viscosity.",
    aliases: ["MRT"],
  },
  "Zou-He": {
    ko: "입구의 속도와 밀도를 비평형 bounce-back으로 맞추는 격자 볼츠만 경계.",
    en: "Lattice Boltzmann boundary that sets inlet velocity and density with a non-equilibrium bounce-back.",
    aliases: ["Zou-He","Zou–He"],
  },
  "Stiffened Gas": {
    ko: "액체처럼 단단한 유체에 기준 압력과 에너지를 더한 상태 방정식.",
    en: "Equation of state that adds a reference pressure and energy so a liquid stays stiff.",
    aliases: ["stiffened gas"],
  },
  "WENO-JS": {
    ko: "Jiang-Shu 가중으로 매끄러운 스텐실을 고르는 5차 WENO.",
    en: "Fifth-order WENO that picks smooth stencils with the Jiang–Shu weights.",
    aliases: ["WENO-JS"],
  },
  "MP5": {
    ko: "5차 다항식에 단조 제한을 거는 Monotonicity-Preserving 재구성.",
    en: "Monotonicity-preserving reconstruction that limits a fifth-order polynomial.",
    aliases: ["MP5"],
  },
  "Venkatakrishnan": {
    ko: "비정렬 격자에서 기울기를 부드럽게 제한하는 미분 가능 제한자.",
    en: "Differentiable limiter that smoothly bounds a gradient on unstructured meshes.",
    aliases: ["Venkatakrishnan"],
  },
  "Barth-Jespersen": {
    ko: "셀 최댓값을 넘지 않도록 기울기 전체에 하나의 계수를 곱하는 제한자.",
    en: "Limiter that multiplies the whole gradient by one factor so the cell does not exceed its neighbors.",
    aliases: ["Barth","Barth-Jespersen","Barth–Jespersen"],
  },
  "SUPG": {
    ko: "흐름 방향으로 시험 함수를 치우쳐 풍상 안정화를 넣는 유한요소 법.",
    en: "Finite-element stabilization that biases the test function along the flow to add upwinding.",
    aliases: ["SUPG"],
  },
  "PIMPLE": {
    ko: "바깥 SIMPLE 반복 안에 PISO 수정 단계를 넣는 압력-속도 결합.",
    en: "Pressure-velocity coupling that nests PISO corrections inside an outer SIMPLE loop.",
    aliases: ["PIMPLE"],
  },
  "Taylor-Green": {
    ko: "점성으로만 감쇠하는 주기 와열. 스킴의 소산을 재는 표준 시험이다.",
    en: "Periodic vortex array that decays only by viscosity. A standard test of numerical dissipation.",
    aliases: ["Taylor-Green","Taylor–Green"],
  },
  "Couette": {
    ko: "한 벽이 움직이는 평행 채널의 전단 유동. 정상해는 선형 속도다.",
    en: "Shear flow in a channel with one moving wall. The steady velocity is linear.",
    aliases: ["Couette","쿠에트"],
  },
  "Hagen-Poiseuille": {
    ko: "둥근 관의 완전 발달 층류. 속도는 포물선이고 마찰계수는 64/Re다.",
    en: "Fully developed laminar flow in a round pipe. The velocity is parabolic and the friction factor is 64/Re.",
    aliases: ["Hagen-Poiseuille","Hagen–Poiseuille"],
  },
  "HLL": {
    ko: "가장 빠른 두 파만 남기고 그 사이를 한 상태로 평균하는 리만 솔버.",
    en: "Riemann solver that keeps only the two fastest waves and averages a single state between them.",
    aliases: ["HLL"],
  },
  "Sod Shock Tube": {
    ko: "왼쪽이 고압인 1차원 리만 문제. 충격·접촉·팽창이 한 번에 나온다.",
    en: "One-dimensional Riemann problem with high pressure on the left. A shock, a contact, and a rarefaction appear together.",
    aliases: ["Sod"],
  },
  "Shu-Osher": {
    ko: "충격파가 엔트로피 파동을 지나가는 시험. 소산이 크면 파동이 죽는다.",
    en: "Test in which a shock runs through an entropy wave. Too much dissipation kills the wave.",
    aliases: ["Shu-Osher","Shu–Osher"],
  },
  "Well-Balanced": {
    ko: "정지 정수압 같은 균형해를 격자 오차 없이 그대로 유지하는 스킴.",
    en: "Scheme that preserves an equilibrium, such as a hydrostatic rest state, without a grid-scale drift.",
    aliases: ["well-balanced"],
  },
  "Baroclinic": {
    ko: "밀도 기울기와 압력 기울기가 나란하지 않을 때 와도를 만드는 토크.",
    en: "Torque that creates vorticity when the density gradient is not aligned with the pressure gradient.",
    aliases: ["baroclinic"],
  },
  "MRF": {
    ko: "회전 영역을 정상 상대 속도로 두는 Multiple Reference Frame. 격자 자체는 움직이지 않는다.",
    en: "Multiple Reference Frame. A rotating zone is written in steady relative velocity while the mesh stays fixed.",
    aliases: ["MRF","multiple reference frame"],
  },
  "Frozen Rotor": {
    ko: "회전 부품과 정지 부품의 상대 위치를 한 각도로 고정한 정상 해석.",
    en: "Steady analysis that freezes the relative position of a rotor and a stator at one angle.",
    aliases: ["frozen rotor"],
  },
  "Coriolis": {
    ko: "회전 좌표계에서 속도에 수직으로 걸리는 관성력.",
    en: "Inertial force perpendicular to the velocity in a rotating frame.",
    aliases: ["Coriolis","코리올리"],
  },
  "Eddy Viscosity": {
    ko: "난류 혼합을 층류 점성에 더한 스칼라로 바꾸는 Boussinesq 닫힘의 계수.",
    en: "Scalar that replaces turbulent mixing by an addition to the laminar viscosity in a Boussinesq closure.",
    aliases: ["eddy viscosity","와점성"],
  },
  "Stanton": {
    ko: "벽 열유속을 유입 엔탈피 유속으로 나눈 무차원수. Nu/(Re Pr)과 같다.",
    en: "Wall heat flux divided by the incoming enthalpy flux. Equal to Nu/(Re Pr).",
    aliases: ["Stanton"],
  },
  "Ohnesorge": {
    ko: "점성력과 관성·표면장력의 기하평균의 비. 액적 분열의 점성 효과를 본다.",
    en: "Ratio of viscosity to the geometric mean of inertia and surface tension. It measures viscous effects in breakup.",
    aliases: ["Ohnesorge"],
  },
  "Surface Tension": {
    ko: "계면을 줄이려는 단위 길이당 힘. 곡률과 곱하면 법선 압력 점프가 된다.",
    en: "Force per length that shrinks an interface. Times curvature, it is the normal pressure jump.",
    aliases: ["surface tension","표면장력"],
  },
  "Contact Angle": {
    ko: "벽과 계면이 이루는 각. 젖음과 벽 부착을 정한다.",
    en: "Angle between a wall and an interface. It sets wetting and whether the interface sticks to the wall.",
    aliases: ["contact angle","접촉각"],
  },
  "Moody": {
    ko: "레이놀즈 수와 상대 조도에 대한 Darcy 마찰계수의 그림.",
    en: "Chart of the Darcy friction factor against Reynolds number and relative roughness.",
    aliases: ["Moody","무디"],
  },
  "Cavitation": {
    ko: "국소 압력이 증기압 아래로 떨어져 기포가 생기는 현상.",
    en: "Formation of vapor bubbles where the local pressure falls below the vapor pressure.",
    aliases: ["cavitation","캐비테이션"],
  },
  "von Karman": {
    ko: "벽 법칙의 로그층 기울기를 정한 상수, 또는 그 이름의 와열.",
    en: "Constant that sets the slope of the log layer, and the name of the vortex street behind a bluff body.",
    aliases: ["von Karman","von Kármán","카르만"],
  },
  "Mean Free Path": {
    ko: "분자가 다음 충돌까지 가는 평균 거리. 크누센 수의 분자다.",
    en: "Average distance a molecule travels between collisions. The numerator of the Knudsen number.",
    aliases: ["mean free path","평균 자유"],
  },
  "Shock Capturing": {
    ko: "충격파 위치를 미리 주지 않고, 보존형 스킴이 스스로 점프를 붙잡게 하는 방법.",
    en: "Approach that lets a conservative scheme catch a shock without being told where it sits.",
    aliases: ["shock capturing","충격파 포착"],
  },
  "Operator Splitting": {
    ko: "이류·확산·반응처럼 다른 항을 시간 안에서 나누어 따로 적분하는 방법.",
    en: "Method that integrates unlike terms, such as advection, diffusion, and reaction, in separate substeps.",
    aliases: ["operator splitting","연산자 분리"],
  },
  "Slope Limiter": {
    ko: "셀 기울기가 이웃 범위를 넘지 않게 곱하는 계수. TVD와 단조성을 지킨다.",
    en: "Factor that scales a cell slope so it stays inside the neighbor range. It protects TVD and monotonicity.",
    aliases: ["slope limiter"],
  },
  "Odd-Even Decoupling": {
    ko: "압력과 속도가 같은 위치에 있을 때 격자가 한 칸씩 갈라지는 비물리 모드.",
    en: "Nonphysical mode in which a collocated pressure-velocity pair splits the mesh into odd and even cells.",
    aliases: ["odd-even","홀짝"],
  },
  "Condition Number": {
    ko: "행렬이 입력 오차를 얼마나 키우는지의 비. 크면 반복법과 반올림이 나빠진다.",
    en: "Ratio of how much a matrix amplifies an input error. A large value hurts iteration and round-off.",
    aliases: ["condition number","조건수"],
  },
  "Numerical Diffusion": {
    ko: "스킴의 절단 오차가 물리 확산처럼 해를 번지게 하는 효과.",
    en: "Truncation error that spreads a solution the way a physical diffusivity would.",
    aliases: ["numerical diffusion","수치 확산"],
  },
  "Modified Equation": {
    ko: "이산 스킴이 실제로 만족하는 연속 방정식. 앞에 붙은 오차 항이 수치 확산과 분산이다.",
    en: "Continuous equation that a discrete scheme actually satisfies. The leading error terms are numerical diffusion and dispersion.",
    aliases: ["modified equation","수정 방정식"],
  },
  "Method of Characteristics": {
    ko: "쌍곡 방정식을 특성선을 따라 상미분으로 줄여 푸는 방법.",
    en: "Method that reduces a hyperbolic equation to ordinary derivatives along characteristic curves.",
    aliases: ["method of characteristics","특성선"],
  },
  "Non-Orthogonality": {
    ko: "면 법선과 셀 중심 연결선이 어긋난 정도. 확산 항의 보정에 쓴다.",
    en: "Angle between a face normal and the line of cell centers. It drives the correction of the diffusion term.",
    aliases: ["non-orthogonal","non-orthogonality","비직교"],
  },
  "Skewness": {
    ko: "면과 셀 중심 연결선의 교점이 면 중심에서 벗어난 정도.",
    en: "Distance between the face centroid and the point where the cell-center line crosses the face.",
    aliases: ["skewness"],
  },
  "Mesh Quality": {
    ko: "비직교, 비틀림, 종횡비처럼 이산화 오차를 키우는 격자 결함의 묶음.",
    en: "Bundle of mesh defects, such as non-orthogonality, skewness, and aspect ratio, that enlarge the discretization error.",
    aliases: ["mesh quality","격자 품질"],
  },
  "Wall Shear Stress": {
    ko: "벽에서 유체에 걸리는 접선 응력. 마찰 속도와 y+의 기준이다.",
    en: "Tangential stress the fluid exerts on a wall. It sets the friction velocity and y+.",
    aliases: ["wall shear","벽 전단"],
  },
  "Skin Friction": {
    ko: "벽 전단을 동압으로 나눈 계수. 평판 항력의 점성 부분이다.",
    en: "Wall shear divided by dynamic pressure. The viscous part of flat-plate drag.",
    aliases: ["skin friction","표면 마찰"],
  },
  "Local Time Stepping": {
    ko: "셀마다 다른 시간 간격을 써서 정상해로 빨리 가는 가속법.",
    en: "Acceleration that gives each cell its own time step so a steady solution is reached sooner.",
    aliases: ["local time stepping","국소 시간"],
  },
  "Adverse Pressure Gradient": {
    ko: "흐름 방향으로 압력이 오르는 구간. 경계층이 두꺼워지고 박리하기 쉽다.",
    en: "Region where pressure rises in the flow direction. The boundary layer thickens and can separate.",
    aliases: ["adverse pressure","역압력"],
  },
  "Coalescence": {
    ko: "두 기포나 액적이 붙어 하나가 되는 과정.",
    en: "Process in which two bubbles or droplets merge into one.",
    aliases: ["coalescence","합체"],
  },
  "Flamelet": {
    ko: "난류 화염을 얇은 층류 화염 조각의 앙상블로 보는 연소 모델.",
    en: "Combustion model that treats a turbulent flame as an ensemble of thin laminar flame sheets.",
    aliases: ["flamelet","플레임릿"],
  },
  "Richardson Extrapolation": {
    ko: "두 격자 해의 차로 한 차수 높은 추정값을 만드는 절차.",
    en: "Procedure that combines two grid solutions to build an estimate of one order higher.",
    aliases: ["Richardson","리처드슨"],
  },
  "AUSM+": {
    ko: "마하 수 분할에 압력 분할을 더 정교히 넣은 AUSM 계열 플럭스.",
    en: "AUSM-family flux with a more careful split of both Mach number and pressure.",
    aliases: ["AUSM+"],
  },
  "von Neumann Stability": {
    ko: "오차를 푸리에 모드로 놓고 증폭 계수의 크기가 1 이하인지 보는 선형 안정 해석.",
    en: "Linear stability test that writes the error as Fourier modes and asks whether the amplification factor stays at most one.",
    aliases: ["von Neumann stability","von Neumann","폰 노이만"],
  },
}

function parseGlossaryYaml(raw) {
  const result = {}
  let currentKey = null
  let currentEntry = null
  let inTerms = false

  for (const line of raw.split('\n')) {
    if (/^\s*#/.test(line) || !line.trim()) continue
    if (line.startsWith('terms:')) {
      inTerms = true
      continue
    }
    if (!inTerms) continue

    const termStart = line.match(/^  ([^:]+):\s*$/)
    if (termStart) {
      currentKey = termStart[1].trim()
      currentEntry = { ko: '', en: '', wiki: '', aliases: [], source: 'manual' }
      result[currentKey] = currentEntry
      continue
    }

    const field = line.match(/^    (ko|en|ja|zh|es|wiki):\s*"?(.*?)"?\s*$/)
    if (field && currentEntry) {
      const [, key, val] = field
      currentEntry[key] = val
    }
  }

  return result
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const fm = m[1]
  const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? ''
  const description = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? ''
  const date = fm.match(/^date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*$/m)?.[1] ?? ''
  const draft = (fm.match(/^draft:\s*(true|false)\s*$/m)?.[1] ?? 'false') === 'true'
  const tagRaw = fm.match(/^tags:\s*\[([^\]]*)\]\s*$/m)?.[1] ?? ''
  const tags = tagRaw.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  return { title, description, date, draft, tags, body: content.slice(m[0].length) }
}

function stripMdx(body) {
  return body
    .replace(/^import\s+.*$/gm, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1')
}

function loadPosts() {
  const posts = []
  for (const file of readdirSync(POSTS_DIR).filter((n) => n.endsWith('.mdx'))) {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed || parsed.draft) continue
    const slug = file.replace(/\.mdx$/, '')
    const text = [parsed.title, parsed.description, parsed.tags.join(' '), stripMdx(parsed.body)].join('\n')
    posts.push({ slug, title: parsed.title, date: parsed.date, tags: parsed.tags, text })
  }
  return posts
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countNeedle(text, needle) {
  if (!needle) return 0
  const escaped = escapeRegex(needle).replace(/\\\s+/g, '\\s+')
  const needsBoundary = /^[A-Za-z0-9_ -]+$/.test(needle)
  const source = needsBoundary ? `(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])` : escaped
  const matches = text.match(new RegExp(source, 'gi'))
  return matches?.length ?? 0
}

function mergeAutoTerms(result) {
  for (const [term, entry] of Object.entries(AUTO_TERMS)) {
    if (!result[term]) {
      result[term] = { ko: entry.ko, en: entry.en, wiki: entry.wiki ?? '', aliases: [], source: 'post-curated' }
    } else {
      result[term].ko ||= entry.ko
      result[term].en ||= entry.en
      result[term].wiki ||= entry.wiki ?? ''
    }
    result[term].aliases = Array.from(new Set([...(result[term].aliases ?? []), ...(entry.aliases ?? [])]))
  }
}

const result = parseGlossaryYaml(readFileSync(SRC, 'utf-8'))
mergeAutoTerms(result)

const localeOverlay = JSON.parse(readFileSync(I18N, 'utf-8'))
for (const [term, texts] of Object.entries(localeOverlay)) {
  if (!result[term]) {
    console.error(`glossary-i18n: unknown term ${term}`)
    process.exitCode = 1
    continue
  }
  for (const loc of LOCALES) {
    if (texts[loc] && !result[term][loc]) result[term][loc] = texts[loc]
  }
}
for (const term of Object.keys(result)) {
  for (const loc of LOCALES) {
    if (!result[term][loc]) console.error(`glossary-i18n: missing ${loc} for ${term}`)
  }
}

const posts = loadPosts()
for (const [term, entry] of Object.entries(result)) {
  const needles = Array.from(new Set([term, ...(entry.aliases ?? [])]))
  const refs = []
  let total = 0

  for (const post of posts) {
    const count = needles.reduce((sum, needle) => sum + countNeedle(post.text, needle), 0)
    if (count > 0) {
      total += count
      refs.push({ slug: post.slug, title: post.title, date: post.date, count })
    }
  }

  refs.sort((a, b) => b.count - a.count || (a.date < b.date ? 1 : -1))
  entry.count = total
  entry.posts = refs.slice(0, 8)
  if (!entry.source) entry.source = 'manual'
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(OUT, JSON.stringify(sorted, null, 2))
const withRefs = Object.values(sorted).filter((entry) => entry.posts?.length).length
console.log(`✅ glossary: ${Object.keys(sorted).length} terms, ${withRefs} with post refs → ${OUT}`)
