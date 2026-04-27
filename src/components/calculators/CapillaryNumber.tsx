'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function CapillaryNumberCalculator() {
  const [mu, setMu] = useState(1e-3)
  const [U, setU] = useState(1)
  const [sigma, setSigma] = useState(0.072)

  const Ca = useMemo(() => (mu * U) / sigma, [U, mu, sigma])
  const label = Ca < 1e-3 ? 'capillary dominated' : Ca < 1e-1 ? 'mixed balance' : 'viscous dominated interface motion'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="mu (Pa·s)" value={mu} onChange={setMu} step={1e-4} min={1e-12} />
        <NumberField label="U (m/s)" value={U} onChange={setU} step={0.1} min={0} />
        <NumberField label="sigma (N/m)" value={sigma} onChange={setSigma} step={0.001} min={1e-8} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Ca" value={formatNumber(Ca)} color="#22d3ee" />
        <MetricCard label="regime" value={label} color="#34d399" />
      </div>
      <Note>
        Capillary number is especially useful for coating flows, microfluidics, and interface-capturing problems with moving contact lines.
      </Note>
    </CalculatorPanel>
  )
}
