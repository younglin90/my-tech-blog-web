'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function ChokedMassFlowCalculator() {
  const [gamma, setGamma] = useState(1.4)
  const [R, setR] = useState(287)
  const [T0, setT0] = useState(300)
  const [p0, setP0] = useState(300000)
  const [area, setArea] = useState(1.0e-4)
  const [Cd, setCd] = useState(0.98)

  const result = useMemo(() => {
    const factor = Math.sqrt(gamma / (R * T0)) * Math.pow(2 / (gamma + 1), (gamma + 1) / (2 * (gamma - 1)))
    const mdotPerArea = Cd * p0 * factor
    const mdot = mdotPerArea * area
    const TStar = T0 * 2 / (gamma + 1)
    const pStar = p0 * Math.pow(2 / (gamma + 1), gamma / (gamma - 1))
    return { mdotPerArea, mdot, TStar, pStar }
  }, [Cd, R, T0, area, gamma, p0])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="gamma" value={gamma} onChange={setGamma} step={0.01} min={1.01} />
        <NumberField label="R (J/kg/K)" value={R} onChange={setR} step={1} min={1} />
        <NumberField label="T0 (K)" value={T0} onChange={setT0} step={1} min={1} />
        <NumberField label="p0 (Pa)" value={p0} onChange={setP0} step={1000} min={1} />
        <NumberField label="throat area A (m^2)" value={area} onChange={setArea} step={1e-5} min={1e-8} />
        <NumberField label="discharge coefficient Cd" value={Cd} onChange={setCd} step={0.01} min={0.1} max={1.5} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="mdot (kg/s)" value={formatNumber(result.mdot)} color="#22d3ee" />
        <MetricCard label="mdot / A (kg/s/m^2)" value={formatNumber(result.mdotPerArea)} color="#34d399" />
        <MetricCard label="T* (K)" value={formatNumber(result.TStar)} color="#fbbf24" />
        <MetricCard label="p* (Pa)" value={formatNumber(result.pStar)} color="#f87171" />
      </div>

      <Note>
        Use this when the nozzle throat is sonic. The result is the maximum mass flow rate available from the given stagnation state.
      </Note>
    </CalculatorPanel>
  )
}
