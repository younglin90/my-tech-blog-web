'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function BondNumberCalculator() {
  const [deltaRho, setDeltaRho] = useState(1000)
  const [g, setG] = useState(9.81)
  const [L, setL] = useState(1e-2)
  const [sigma, setSigma] = useState(0.072)

  const Bo = useMemo(() => (deltaRho * g * L * L) / sigma, [L, deltaRho, g, sigma])
  const label = Bo < 1 ? 'surface tension dominated shape' : 'gravity strongly affects shape'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="delta rho (kg/m^3)" value={deltaRho} onChange={setDeltaRho} step={1} min={0} />
        <NumberField label="g (m/s^2)" value={g} onChange={setG} step={0.01} min={0.1} />
        <NumberField label="L (m)" value={L} onChange={setL} step={0.001} min={1e-8} />
        <NumberField label="sigma (N/m)" value={sigma} onChange={setSigma} step={0.001} min={1e-8} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Bo" value={formatNumber(Bo)} color="#22d3ee" />
        <MetricCard label="shape control" value={label} color="#fbbf24" />
      </div>
      <Note>
        Bond number is a good first check for whether interface curvature or hydrostatics will dominate a droplet or bubble shape.
      </Note>
    </CalculatorPanel>
  )
}
