const EPS = 1e-10

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

export function bisect(
  fn: (x: number) => number,
  lo: number,
  hi: number,
  maxIter = 120,
  tol = 1e-10
): number | null {
  let a = lo
  let b = hi
  let fa = fn(a)
  let fb = fn(b)
  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) return null
  for (let i = 0; i < maxIter; i++) {
    const m = 0.5 * (a + b)
    const fm = fn(m)
    if (!Number.isFinite(fm)) return null
    if (Math.abs(fm) < tol || Math.abs(b - a) < tol) return m
    if (fa * fm <= 0) {
      b = m
      fb = fm
    } else {
      a = m
      fa = fm
    }
  }
  return 0.5 * (a + b)
}

export interface IsentropicState {
  M: number
  muDeg: number | null
  nuDeg: number | null
  p_p0: number
  rho_rho0: number
  T_T0: number
  p_pStar: number
  rho_rhoStar: number
  T_TStar: number
  A_AStar: number
}

export function isentropicFromMach(M: number, gamma = 1.4): IsentropicState | null {
  if (!(M > 0) || !(gamma > 1)) return null
  const tt0 = 1 / (1 + 0.5 * (gamma - 1) * M * M)
  const pp0 = Math.pow(tt0, gamma / (gamma - 1))
  const rr0 = Math.pow(tt0, 1 / (gamma - 1))
  const ttStar = ((gamma + 1) / 2) * tt0
  const ppStar = Math.pow(ttStar, gamma / (gamma - 1))
  const rrStar = Math.pow(ttStar, 1 / (gamma - 1))
  const area =
    (1 / M) *
    Math.pow((2 / (gamma + 1)) * (1 + 0.5 * (gamma - 1) * M * M), (gamma + 1) / (2 * (gamma - 1)))
  const mu = M >= 1 ? toDeg(Math.asin(1 / M)) : null
  const nu =
    M >= 1
      ? toDeg(
          Math.sqrt((gamma + 1) / (gamma - 1)) *
            Math.atan(Math.sqrt(((gamma - 1) / (gamma + 1)) * (M * M - 1))) -
            Math.atan(Math.sqrt(M * M - 1))
        )
      : null
  return {
    M,
    muDeg: mu,
    nuDeg: nu,
    p_p0: pp0,
    rho_rho0: rr0,
    T_T0: tt0,
    p_pStar: ppStar,
    rho_rhoStar: rrStar,
    T_TStar: ttStar,
    A_AStar: area,
  }
}

export function isentropicMachFromPressureRatio(pOverP0: number, gamma = 1.4): number | null {
  if (!(pOverP0 > 0 && pOverP0 <= 1)) return null
  return bisect((M) => (isentropicFromMach(M, gamma)?.p_p0 ?? 0) - pOverP0, EPS, 50)
}

export function isentropicMachFromTempRatio(tOverT0: number, gamma = 1.4): number | null {
  if (!(tOverT0 > 0 && tOverT0 <= 1)) return null
  return bisect((M) => (isentropicFromMach(M, gamma)?.T_T0 ?? 0) - tOverT0, EPS, 50)
}

export function isentropicMachFromAreaRatio(
  areaRatio: number,
  gamma = 1.4,
  branch: 'subsonic' | 'supersonic' = 'supersonic'
): number | null {
  if (!(areaRatio >= 1)) return null
  if (Math.abs(areaRatio - 1) < 1e-12) return 1
  return branch === 'subsonic'
    ? bisect((M) => (isentropicFromMach(M, gamma)?.A_AStar ?? 0) - areaRatio, EPS, 1 - 1e-8)
    : bisect((M) => (isentropicFromMach(M, gamma)?.A_AStar ?? 0) - areaRatio, 1 + 1e-8, 50)
}

export function isentropicMachFromPrandtlMeyer(nuDeg: number, gamma = 1.4): number | null {
  if (!(nuDeg >= 0)) return null
  const nuMax = toDeg((Math.PI / 2) * (Math.sqrt((gamma + 1) / (gamma - 1)) - 1))
  if (nuDeg > nuMax) return null
  if (nuDeg === 0) return 1
  return bisect((M) => (isentropicFromMach(M, gamma)?.nuDeg ?? 0) - nuDeg, 1 + 1e-8, 200)
}

export interface NormalShockState {
  M1: number
  M2: number
  p2_p1: number
  rho2_rho1: number
  T2_T1: number
  p02_p01: number
  p1_p02: number
}

export function normalShockFromM1(M1: number, gamma = 1.4): NormalShockState | null {
  if (!(M1 > 1) || !(gamma > 1)) return null
  const m1sq = M1 * M1
  const m2sq = (1 + 0.5 * (gamma - 1) * m1sq) / (gamma * m1sq - 0.5 * (gamma - 1))
  if (!(m2sq > 0)) return null
  const M2 = Math.sqrt(m2sq)
  const p2_p1 = 1 + (2 * gamma / (gamma + 1)) * (m1sq - 1)
  const rho2_rho1 = ((gamma + 1) * m1sq) / ((gamma - 1) * m1sq + 2)
  const T2_T1 = p2_p1 / rho2_rho1

  const term1 = Math.pow(((gamma + 1) * m1sq) / ((gamma - 1) * m1sq + 2), gamma / (gamma - 1))
  const term2 = Math.pow((gamma + 1) / (2 * gamma * m1sq - (gamma - 1)), 1 / (gamma - 1))
  const p02_p01 = term1 * term2

  const isen1 = isentropicFromMach(M1, gamma)
  if (!isen1) return null
  const p1_p02 = isen1.p_p0 / p02_p01

  return { M1, M2, p2_p1, rho2_rho1, T2_T1, p02_p01, p1_p02 }
}

export interface ObliqueShockState {
  M1: number
  thetaDeg: number
  betaDeg: number
  M1n: number
  M2n: number
  M2: number
  p2_p1: number
  rho2_rho1: number
  T2_T1: number
  p02_p01: number
}

function thetaFromBeta(M1: number, beta: number, gamma: number): number {
  const m1s = M1 * Math.sin(beta)
  const num = 2 * (m1s * m1s - 1)
  const den = Math.tan(beta) * (M1 * M1 * (gamma + Math.cos(2 * beta)) + 2)
  return Math.atan(num / den)
}

export function maxObliqueThetaDeg(M1: number, gamma = 1.4): number {
  const betaMin = Math.asin(1 / M1) + 1e-6
  const betaMax = Math.PI / 2 - 1e-6
  let maxTheta = 0
  for (let i = 0; i <= 1200; i++) {
    const b = betaMin + (betaMax - betaMin) * (i / 1200)
    const t = thetaFromBeta(M1, b, gamma)
    if (Number.isFinite(t)) maxTheta = Math.max(maxTheta, t)
  }
  return toDeg(maxTheta)
}

export function obliqueShockFromBeta(
  M1: number,
  betaDeg: number,
  gamma = 1.4
): ObliqueShockState | null {
  if (!(M1 > 1)) return null
  const beta = toRad(betaDeg)
  const betaMin = Math.asin(1 / M1)
  if (!(beta > betaMin && beta < Math.PI / 2)) return null
  const theta = thetaFromBeta(M1, beta, gamma)
  if (!(theta >= 0 && theta < beta)) return null
  const M1n = M1 * Math.sin(beta)
  const ns = normalShockFromM1(M1n, gamma)
  if (!ns) return null
  const M2 = ns.M2 / Math.sin(beta - theta)
  return {
    M1,
    thetaDeg: toDeg(theta),
    betaDeg,
    M1n,
    M2n: ns.M2,
    M2,
    p2_p1: ns.p2_p1,
    rho2_rho1: ns.rho2_rho1,
    T2_T1: ns.T2_T1,
    p02_p01: ns.p02_p01,
  }
}

export function obliqueShockFromTheta(
  M1: number,
  thetaDeg: number,
  gamma = 1.4,
  branch: 'weak' | 'strong' = 'weak'
): ObliqueShockState | null {
  if (!(M1 > 1 && thetaDeg >= 0)) return null
  const theta = toRad(thetaDeg)
  if (thetaDeg === 0) return obliqueShockFromBeta(M1, toDeg(Math.asin(1 / M1) + 1e-6), gamma)
  const thetaMax = maxObliqueThetaDeg(M1, gamma)
  if (thetaDeg > thetaMax) return null
  const betaMin = Math.asin(1 / M1) + 1e-6
  const betaMax = Math.PI / 2 - 1e-6
  const f = (b: number) => thetaFromBeta(M1, b, gamma) - theta

  const roots: number[] = []
  let prevB = betaMin
  let prevF = f(prevB)
  const N = 1500
  for (let i = 1; i <= N; i++) {
    const b = betaMin + (betaMax - betaMin) * (i / N)
    const fb = f(b)
    if (prevF * fb <= 0) {
      const root = bisect(f, prevB, b)
      if (root !== null) roots.push(root)
    }
    prevB = b
    prevF = fb
  }
  if (roots.length === 0) return null
  const beta = branch === 'weak' ? Math.min(...roots) : Math.max(...roots)
  return obliqueShockFromBeta(M1, toDeg(beta), gamma)
}

export interface FannoState {
  M: number
  T_TStar: number
  P_PStar: number
  P0_P0Star: number
  U_UStar: number
  fourFLoDStar: number
  sStarMinusS_over_R: number
}

export function fannoFromMach(M: number, gamma = 1.4): FannoState | null {
  if (!(M > 0)) return null
  const T_TStar = ((gamma + 1) / 2) / (1 + 0.5 * (gamma - 1) * M * M)
  const P_PStar = (1 / M) * Math.sqrt(((gamma + 1) / 2) / (1 + 0.5 * (gamma - 1) * M * M))
  const P0_P0Star =
    (1 / M) * Math.pow((2 + (gamma - 1) * M * M) / (gamma + 1), (gamma + 1) / (2 * (gamma - 1)))
  const U_UStar = M * Math.sqrt(T_TStar)
  const fourFLoDStar =
    (1 - M * M) / (gamma * M * M) +
    ((gamma + 1) / (2 * gamma)) * Math.log(((gamma + 1) * M * M) / (2 + (gamma - 1) * M * M))
  const sStarMinusS_over_R = Math.log(P0_P0Star)
  return { M, T_TStar, P_PStar, P0_P0Star, U_UStar, fourFLoDStar, sStarMinusS_over_R }
}

export interface RayleighState {
  M: number
  T0_T0Star: number
  T_TStar: number
  P_PStar: number
  P0_P0Star: number
  U_UStar: number
  sStarMinusS_over_R: number
}

export function rayleighFromMach(M: number, gamma = 1.4): RayleighState | null {
  if (!(M > 0)) return null
  const gm1 = gamma - 1
  const gp1 = gamma + 1
  const denom = 1 + gamma * M * M
  const T0_T0Star = (2 * gp1 * M * M * (1 + 0.5 * gm1 * M * M)) / (denom * denom)
  const T_TStar = (M * M * gp1 * gp1) / (denom * denom)
  const P_PStar = gp1 / denom
  const P0_P0Star =
    (gp1 / denom) * Math.pow((1 + 0.5 * gm1 * M * M) / (0.5 * gp1), gamma / gm1)
  const U_UStar = (gp1 * M * M) / denom
  const sStarMinusS_over_R = Math.log(P0_P0Star)
  return { M, T0_T0Star, T_TStar, P_PStar, P0_P0Star, U_UStar, sStarMinusS_over_R }
}
