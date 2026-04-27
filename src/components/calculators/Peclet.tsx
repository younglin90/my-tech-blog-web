'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function PecletCalculator() {
  const [U, setU] = useState(1)
  const [L, setL] = useState(0.05)
  const [alpha, setAlpha] = useState(1.4e-7)

  const Pe = useMemo(() => (U * L) / alpha, [U, L, alpha])
  const regime = Pe < 1 ? 'diffusion-dominated' : Pe < 100 ? 'mixed transport' : 'advection-dominated'
  const color = Pe < 1 ? '#34d399' : Pe < 100 ? '#fbbf24' : '#f87171'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="U (m/s)" value={U} onChange={setU} step={0.1} min={0} />
        <NumberField label="L (m)" value={L} onChange={setL} step={0.001} min={1e-6} />
        <NumberField label="alpha (m^2/s)" value={alpha} onChange={setAlpha} step={1e-7} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Pe" value={formatNumber(Pe)} color={color} />
        <MetricCard label="transport mode" value={regime} color={color} />
      </div>
      <Note>
        Large Peclet number means the scalar travels mainly by advection. Low Peclet number indicates diffusion smooths the field rapidly.
      </Note>
    </CalculatorPanel>
  )
}
