'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function FourierCalculator() {
  const [alpha, setAlpha] = useState(1.0e-5)
  const [time, setTime] = useState(10)
  const [L, setL] = useState(0.02)

  const Fo = useMemo(() => (alpha * time) / (L * L), [L, alpha, time])
  const stage = Fo < 0.1 ? 'early transient' : Fo < 1 ? 'moderate penetration' : 'deep diffusion penetration'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="alpha (m^2/s)" value={alpha} onChange={setAlpha} step={1e-6} min={1e-12} />
        <NumberField label="time t (s)" value={time} onChange={setTime} step={0.1} min={0} />
        <NumberField label="length L (m)" value={L} onChange={setL} step={0.001} min={1e-8} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Fo" value={formatNumber(Fo)} color="#22d3ee" />
        <MetricCard label="diffusion stage" value={stage} color="#fbbf24" />
      </div>
      <Note>
        Fourier number helps judge how far a thermal disturbance has diffused relative to the body size or mesh scale.
      </Note>
    </CalculatorPanel>
  )
}
