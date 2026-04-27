'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function WeberCalculator() {
  const [rho, setRho] = useState(1000)
  const [U, setU] = useState(10)
  const [L, setL] = useState(1e-3)
  const [sigma, setSigma] = useState(0.072)

  const We = useMemo(() => (rho * U * U * L) / sigma, [L, U, rho, sigma])
  const label = We < 1 ? 'surface tension dominated' : We < 10 ? 'moderate deformation' : 'breakup likely'
  const color = We < 1 ? '#34d399' : We < 10 ? '#fbbf24' : '#f87171'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={1} min={1e-8} />
        <NumberField label="U (m/s)" value={U} onChange={setU} step={0.1} min={0} />
        <NumberField label="L (m)" value={L} onChange={setL} step={1e-4} min={1e-8} />
        <NumberField label="sigma (N/m)" value={sigma} onChange={setSigma} step={0.001} min={1e-8} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="We" value={formatNumber(We)} color={color} />
        <MetricCard label="regime" value={label} color={color} />
      </div>
      <Note>
        Droplet and jet breakup thresholds depend on geometry, but larger Weber number almost always means stronger inertial distortion.
      </Note>
    </CalculatorPanel>
  )
}
