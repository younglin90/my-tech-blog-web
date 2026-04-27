'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function SchmidtCalculator() {
  const [nu, setNu] = useState(1.5e-5)
  const [D, setD] = useState(2.0e-5)

  const Sc = useMemo(() => nu / D, [D, nu])
  const label = Sc < 1 ? 'mass diffusion faster than momentum' : Sc < 10 ? 'comparable transport' : 'species diffusion much slower'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="nu (m^2/s)" value={nu} onChange={setNu} step={1e-6} min={1e-12} />
        <NumberField label="species diffusivity D (m^2/s)" value={D} onChange={setD} step={1e-6} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Sc" value={formatNumber(Sc)} color="#22d3ee" />
        <MetricCard label="interpretation" value={label} color="#fbbf24" />
      </div>
      <Note>
        Gas mixing often lives near Sc ≈ 1, while liquid-phase mass transfer can reach much larger values.
      </Note>
    </CalculatorPanel>
  )
}
