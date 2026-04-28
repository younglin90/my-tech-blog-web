'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const G = 9.80665

function frictionFactor(re: number, epsOverD: number): number {
  if (!Number.isFinite(re) || re <= 0) return Number.NaN
  if (re < 2300) return 64 / re

  let f = 0.25 / Math.log10(epsOverD / 3.7 + 5.74 / Math.pow(re, 0.9)) ** 2
  for (let i = 0; i < 18; i++) {
    const inv = -2 * Math.log10(epsOverD / 3.7 + 2.51 / (re * Math.sqrt(f)))
    f = 1 / (inv * inv)
  }
  return f
}

export function ColebrookCalculator() {
  const [re, setRe] = useState(1e5)
  const [epsOverD, setEpsOverD] = useState(1e-4)

  const result = useMemo(() => {
    const f = frictionFactor(re, epsOverD)
    const regime = re < 2300 ? 'laminar' : re < 4000 ? 'transitional' : 'turbulent'
    return { f, regime }
  }, [epsOverD, re])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Re" value={re} onChange={setRe} step={1000} min={1} />
        <NumberField label="epsilon / D" value={epsOverD} onChange={setEpsOverD} step={0.00001} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Darcy f" value={formatNumber(result.f, 5)} color="#22d3ee" />
        <MetricCard label="regime" value={result.regime} color={result.regime === 'turbulent' ? '#f87171' : '#34d399'} />
      </div>
      <Note>Uses laminar f = 64/Re below Re = 2300 and Colebrook-White iteration above transition.</Note>
    </CalculatorPanel>
  )
}

export function DarcyWeisbachCalculator() {
  const [rho, setRho] = useState(998)
  const [mu, setMu] = useState(0.001)
  const [q, setQ] = useState(0.02)
  const [diameter, setDiameter] = useState(0.1)
  const [length, setLength] = useState(20)
  const [roughness, setRoughness] = useState(4.5e-5)
  const [minorK, setMinorK] = useState(1.5)

  const result = useMemo(() => {
    const area = Math.PI * diameter * diameter / 4
    const u = q / Math.max(area, 1e-12)
    const re = (rho * u * diameter) / Math.max(mu, 1e-12)
    const epsOverD = roughness / Math.max(diameter, 1e-12)
    const f = frictionFactor(re, epsOverD)
    const qdyn = 0.5 * rho * u * u
    const dp = (f * length / Math.max(diameter, 1e-12) + minorK) * qdyn
    const head = dp / (rho * G)
    const hydraulicPower = dp * q
    return { u, re, f, dp, head, hydraulicPower }
  }, [diameter, length, minorK, mu, q, rho, roughness])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={1} min={1e-6} />
        <NumberField label="mu (Pa·s)" value={mu} onChange={setMu} step={0.0001} min={1e-12} />
        <NumberField label="Q (m^3/s)" value={q} onChange={setQ} step={0.001} min={0} />
        <NumberField label="D (m)" value={diameter} onChange={setDiameter} step={0.01} min={1e-6} />
        <NumberField label="L (m)" value={length} onChange={setLength} step={1} min={0} />
        <NumberField label="roughness epsilon (m)" value={roughness} onChange={setRoughness} step={0.00001} min={0} />
        <NumberField label="minor loss K" value={minorK} onChange={setMinorK} step={0.1} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="U (m/s)" value={formatNumber(result.u)} color="#22d3ee" />
        <MetricCard label="Re" value={formatNumber(result.re)} color="#34d399" />
        <MetricCard label="Darcy f" value={formatNumber(result.f, 5)} color="#fbbf24" />
        <MetricCard label="Delta p (Pa)" value={formatNumber(result.dp)} color="#f87171" />
        <MetricCard label="head loss (m)" value={formatNumber(result.head)} color="#a78bfa" />
        <MetricCard label="hydraulic power (W)" value={formatNumber(result.hydraulicPower)} color="#fb7185" />
      </div>
      <Note>Pressure drop uses Delta p = (f L/D + K) rho U^2 / 2. Pump shaft power needs division by efficiency.</Note>
    </CalculatorPanel>
  )
}

export function LiftDragCalculator() {
  const [rho, setRho] = useState(1.225)
  const [u, setU] = useState(40)
  const [area, setArea] = useState(1.2)
  const [lift, setLift] = useState(1200)
  const [drag, setDrag] = useState(120)

  const result = useMemo(() => {
    const qdyn = 0.5 * rho * u * u
    const denom = Math.max(qdyn * area, 1e-12)
    return {
      qdyn,
      cl: lift / denom,
      cd: drag / denom,
      liftToDrag: Math.abs(drag) > 1e-12 ? lift / drag : Number.NaN,
    }
  }, [area, drag, lift, rho, u])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-6} />
        <NumberField label="U (m/s)" value={u} onChange={setU} step={1} min={0} />
        <NumberField label="reference area A (m^2)" value={area} onChange={setArea} step={0.1} min={1e-9} />
        <NumberField label="lift force L (N)" value={lift} onChange={setLift} step={10} />
        <NumberField label="drag force D (N)" value={drag} onChange={setDrag} step={10} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="q = 1/2 rho U^2 (Pa)" value={formatNumber(result.qdyn)} color="#22d3ee" />
        <MetricCard label="C_L" value={formatNumber(result.cl)} color="#34d399" />
        <MetricCard label="C_D" value={formatNumber(result.cd)} color="#fbbf24" />
        <MetricCard label="L/D" value={formatNumber(result.liftToDrag)} color="#f87171" />
      </div>
      <Note>Use the same reference area convention as the experiment or solver report before comparing coefficients.</Note>
    </CalculatorPanel>
  )
}

export function StrouhalCalculator() {
  const [st, setSt] = useState(0.2)
  const [u, setU] = useState(15)
  const [diameter, setDiameter] = useState(0.08)

  const result = useMemo(() => {
    const frequency = st * u / Math.max(diameter, 1e-12)
    return { frequency, period: 1 / frequency }
  }, [diameter, st, u])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="St" value={st} onChange={setSt} step={0.01} min={0} />
        <NumberField label="U (m/s)" value={u} onChange={setU} step={0.5} min={0} />
        <NumberField label="D or L (m)" value={diameter} onChange={setDiameter} step={0.01} min={1e-9} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="shedding frequency (Hz)" value={formatNumber(result.frequency)} color="#22d3ee" />
        <MetricCard label="period (s)" value={formatNumber(result.period)} color="#fbbf24" />
      </div>
      <Note>Circular cylinder wakes often sit near St = 0.2 over a broad subcritical Reynolds-number range.</Note>
    </CalculatorPanel>
  )
}

export function Courant3DCalculator() {
  const [ux, setUx] = useState(20)
  const [uy, setUy] = useState(5)
  const [uz, setUz] = useState(0)
  const [dx, setDx] = useState(0.02)
  const [dy, setDy] = useState(0.02)
  const [dz, setDz] = useState(0.02)
  const [dt, setDt] = useState(0.0004)
  const [cmax, setCmax] = useState(1)

  const result = useMemo(() => {
    const rate = Math.abs(ux) / Math.max(dx, 1e-12) + Math.abs(uy) / Math.max(dy, 1e-12) + Math.abs(uz) / Math.max(dz, 1e-12)
    const courant = dt * rate
    const dtMax = cmax / Math.max(rate, 1e-12)
    return { courant, dtMax, safe: courant <= cmax }
  }, [cmax, dt, dx, dy, dz, ux, uy, uz])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="u_x (m/s)" value={ux} onChange={setUx} step={1} />
        <NumberField label="u_y (m/s)" value={uy} onChange={setUy} step={1} />
        <NumberField label="u_z (m/s)" value={uz} onChange={setUz} step={1} />
        <NumberField label="dt (s)" value={dt} onChange={setDt} step={0.0001} min={0} />
        <NumberField label="dx (m)" value={dx} onChange={setDx} step={0.001} min={1e-12} />
        <NumberField label="dy (m)" value={dy} onChange={setDy} step={0.001} min={1e-12} />
        <NumberField label="dz (m)" value={dz} onChange={setDz} step={0.001} min={1e-12} />
        <NumberField label="C_max" value={cmax} onChange={setCmax} step={0.1} min={0.01} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="C_x + C_y + C_z" value={`${formatNumber(result.courant)} ${result.safe ? 'stable' : 'too high'}`} color={result.safe ? '#34d399' : '#f87171'} />
        <MetricCard label="dt_max (s)" value={formatNumber(result.dtMax)} color="#22d3ee" />
      </div>
      <Note>Many finite-volume solvers report max Courant over cells. This local estimate uses a directional sum.</Note>
    </CalculatorPanel>
  )
}

export function BoundaryLayerStackCalculator() {
  const [firstHeight, setFirstHeight] = useState(0.00002)
  const [layers, setLayers] = useState(18)
  const [growth, setGrowth] = useState(1.2)

  const result = useMemo(() => {
    const n = Math.max(1, Math.round(layers))
    const last = firstHeight * Math.pow(growth, n - 1)
    const total = Math.abs(growth - 1) < 1e-9
      ? firstHeight * n
      : firstHeight * (Math.pow(growth, n) - 1) / (growth - 1)
    return { n, last, total }
  }, [firstHeight, growth, layers])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="first layer height (m)" value={firstHeight} onChange={setFirstHeight} step={0.00001} min={0} />
        <NumberField label="layers" value={layers} onChange={setLayers} step={1} min={1} />
        <NumberField label="growth ratio" value={growth} onChange={setGrowth} step={0.05} min={1} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="rounded layers" value={String(result.n)} color="#22d3ee" />
        <MetricCard label="last layer height (m)" value={formatNumber(result.last)} color="#fbbf24" />
        <MetricCard label="total prism height (m)" value={formatNumber(result.total)} color="#34d399" />
      </div>
      <Note>Pair this with the y+ calculator: first set the wall-normal first-cell height, then choose growth and layer count.</Note>
    </CalculatorPanel>
  )
}
