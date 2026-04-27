'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function CavitationNumberCalculator() {
  const [pInf, setPInf] = useState(101325)
  const [pV, setPV] = useState(3169)
  const [rho, setRho] = useState(1000)
  const [U, setU] = useState(15)

  const sigma = useMemo(() => (pInf - pV) / (0.5 * rho * U * U), [U, pInf, pV, rho])
  const label = sigma < 1 ? 'high cavitation risk' : sigma < 2 ? 'watch inception margin' : 'comfortable pressure margin'
  const color = sigma < 1 ? '#f87171' : sigma < 2 ? '#fbbf24' : '#34d399'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="p_inf (Pa)" value={pInf} onChange={setPInf} step={1000} min={0} />
        <NumberField label="p_vapor (Pa)" value={pV} onChange={setPV} step={100} min={0} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={1} min={1e-8} />
        <NumberField label="U (m/s)" value={U} onChange={setU} step={0.1} min={1e-8} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="cavitation number" value={formatNumber(sigma)} color={color} />
        <MetricCard label="risk level" value={label} color={color} />
      </div>
      <Note>
        This does not replace a full cavitation model, but it is a good early screening tool for pumps, injectors, valves, and hydrofoils.
      </Note>
    </CalculatorPanel>
  )
}
