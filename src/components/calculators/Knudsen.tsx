'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function KnudsenCalculator() {
  const [lambda, setLambda] = useState(6.8e-8)
  const [L, setL] = useState(1e-4)

  const Kn = useMemo(() => lambda / L, [L, lambda])
  const regime =
    Kn < 1e-3 ? 'continuum' :
    Kn < 1e-1 ? 'slip flow' :
    Kn < 10 ? 'transitional' :
    'free molecular'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="mean free path lambda (m)" value={lambda} onChange={setLambda} step={1e-8} min={1e-12} />
        <NumberField label="characteristic length L (m)" value={L} onChange={setL} step={1e-5} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Kn" value={formatNumber(Kn)} color="#22d3ee" />
        <MetricCard label="regime" value={regime} color="#f87171" />
      </div>
      <Note>
        Once Kn moves into the slip or transitional range, continuum CFD usually needs wall slip, rarefaction corrections, or kinetic methods.
      </Note>
    </CalculatorPanel>
  )
}
