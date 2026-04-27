'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function FroudeCalculator() {
  const [U, setU] = useState(2)
  const [L, setL] = useState(0.5)
  const [g, setG] = useState(9.81)

  const Fr = useMemo(() => U / Math.sqrt(g * L), [U, g, L])
  const regime = Fr < 1 ? 'subcritical' : Fr < 1.2 ? 'near-critical' : 'supercritical'
  const color = Fr < 1 ? '#34d399' : Fr < 1.2 ? '#fbbf24' : '#f87171'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="U (m/s)" value={U} onChange={setU} step={0.1} min={0} />
        <NumberField label="L (m)" value={L} onChange={setL} step={0.01} min={1e-6} />
        <NumberField label="g (m/s^2)" value={g} onChange={setG} step={0.01} min={0.1} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Fr" value={formatNumber(Fr)} color={color} />
        <MetricCard label="regime" value={regime} color={color} />
      </div>
      <Note>
        Fr below 1 indicates gravity waves can propagate upstream. Fr above 1 is typical of supercritical free-surface flow.
      </Note>
    </CalculatorPanel>
  )
}
