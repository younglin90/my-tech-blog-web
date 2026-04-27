'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

export function YPlusCalculator() {
  const [rho, setRho] = useState(1.225)
  const [mu, setMu] = useState(1.8e-5)
  const [U, setU] = useState(30)
  const [L, setL] = useState(1)
  const [targetYPlus, setTargetYPlus] = useState(1)
  const [model, setModel] = useState<'laminar' | 'turbulent'>('turbulent')

  const result = useMemo(() => {
    const ReL = (rho * U * L) / mu
    const Cf = model === 'laminar' ? 0.664 / Math.sqrt(Math.max(ReL, 1e-12)) : 0.026 / Math.pow(Math.max(ReL, 1e-12), 1 / 7)
    const uTau = U * Math.sqrt(Cf / 2)
    const y = (targetYPlus * mu) / (rho * uTau)
    return { ReL, Cf, uTau, y, yMm: y * 1000 }
  }, [L, U, model, mu, rho, targetYPlus])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-6} />
        <NumberField label="mu (Pa·s)" value={mu} onChange={setMu} step={1e-6} min={1e-12} />
        <NumberField label="U_inf (m/s)" value={U} onChange={setU} step={0.1} min={0} />
        <NumberField label="reference length L (m)" value={L} onChange={setL} step={0.01} min={1e-6} />
        <NumberField label="target y+" value={targetYPlus} onChange={setTargetYPlus} step={0.1} min={0.01} />
        <SelectField
          label="Cf estimate"
          value={model}
          onChange={(value) => setModel(value as 'laminar' | 'turbulent')}
          options={[
            { value: 'laminar', label: 'flat plate laminar' },
            { value: 'turbulent', label: 'flat plate turbulent' },
          ]}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Re_L" value={formatNumber(result.ReL)} color="#22d3ee" />
        <MetricCard label="Cf" value={formatNumber(result.Cf, 5)} color="#34d399" />
        <MetricCard label="u_tau (m/s)" value={formatNumber(result.uTau)} color="#fbbf24" />
        <MetricCard label="first-cell y (mm)" value={formatNumber(result.yMm)} color="#f87171" />
      </div>
      <Note>
        This is a fast estimate for wall-normal spacing. Use y+ ≈ 1 for wall-resolved SST and roughly 30 to 100 for wall-function setups.
      </Note>
    </CalculatorPanel>
  )
}
