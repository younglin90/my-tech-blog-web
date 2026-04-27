'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function BiotCalculator() {
  const [h, setH] = useState(50)
  const [Lc, setLc] = useState(0.01)
  const [ks, setKs] = useState(15)

  const Bi = useMemo(() => (h * Lc) / ks, [Lc, h, ks])
  const lumped = Bi < 0.1 ? 'lumped-capacitance valid' : 'internal conduction matters'
  const color = Bi < 0.1 ? '#34d399' : '#f87171'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="h (W/m^2/K)" value={h} onChange={setH} step={1} min={1e-12} />
        <NumberField label="L_c (m)" value={Lc} onChange={setLc} step={0.001} min={1e-8} />
        <NumberField label="k_s (W/m/K)" value={ks} onChange={setKs} step={0.1} min={1e-8} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Bi" value={formatNumber(Bi)} color={color} />
        <MetricCard label="modeling note" value={lumped} color={color} />
      </div>
      <Note>
        The classic rule of thumb is Bi &lt; 0.1 for lumped-capacitance transients. Larger values mean spatial temperature gradients matter inside the solid.
      </Note>
    </CalculatorPanel>
  )
}
