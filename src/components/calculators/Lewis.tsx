'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function LewisCalculator() {
  const [alpha, setAlpha] = useState(2.2e-5)
  const [D, setD] = useState(2.0e-5)

  const Le = useMemo(() => alpha / D, [D, alpha])
  const label = Le < 1 ? 'species diffuses faster than heat' : Le < 2 ? 'comparable diffusion rates' : 'heat diffuses faster than species'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="thermal diffusivity alpha (m^2/s)" value={alpha} onChange={setAlpha} step={1e-6} min={1e-12} />
        <NumberField label="mass diffusivity D (m^2/s)" value={D} onChange={setD} step={1e-6} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Le" value={formatNumber(Le)} color="#22d3ee" />
        <MetricCard label="interpretation" value={label} color="#34d399" />
      </div>
      <Note>
        Lewis number matters in combustion and reactive mixing, where thermal and species layers may separate in thickness.
      </Note>
    </CalculatorPanel>
  )
}
