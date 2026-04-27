'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

export function CellReynoldsCalculator() {
  const [rho, setRho] = useState(1.225)
  const [U, setU] = useState(25)
  const [dx, setDx] = useState(5e-3)
  const [mu, setMu] = useState(1.8e-5)

  const ReCell = useMemo(() => (rho * U * dx) / mu, [U, dx, mu, rho])
  const label = ReCell < 2 ? 'central differencing usually comfortable' : ReCell < 10 ? 'watch boundedness and oscillations' : 'advection dominates cell scale'
  const color = ReCell < 2 ? '#34d399' : ReCell < 10 ? '#fbbf24' : '#f87171'

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-8} />
        <NumberField label="U (m/s)" value={U} onChange={setU} step={0.1} min={0} />
        <NumberField label="dx (m)" value={dx} onChange={setDx} step={1e-4} min={1e-8} />
        <NumberField label="mu (Pa·s)" value={mu} onChange={setMu} step={1e-6} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Re_cell" value={formatNumber(ReCell)} color={color} />
        <MetricCard label="discretization note" value={label} color={color} />
      </div>
      <Note>
        This is a practical mesh-scale signal. Large cell Reynolds number often pushes you toward upwinding, flux limiting, or a finer grid.
      </Note>
    </CalculatorPanel>
  )
}
