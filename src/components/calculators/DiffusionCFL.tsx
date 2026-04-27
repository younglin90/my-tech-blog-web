'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

export function DiffusionCFLCalculator() {
  const [alpha, setAlpha] = useState(1.0e-5)
  const [dt, setDt] = useState(1e-3)
  const [dx, setDx] = useState(1e-2)
  const [dim, setDim] = useState<'1' | '2' | '3'>('1')

  const result = useMemo(() => {
    const dimension = Number(dim)
    const Fo = (alpha * dt) / (dx * dx)
    const FoMax = 0.5 / dimension
    const dtMax = (FoMax * dx * dx) / alpha
    return { Fo, FoMax, dtMax, stable: Fo <= FoMax }
  }, [alpha, dim, dt, dx])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="alpha (m^2/s)" value={alpha} onChange={setAlpha} step={1e-6} min={1e-12} />
        <NumberField label="dt (s)" value={dt} onChange={setDt} step={1e-4} min={0} />
        <NumberField label="dx (m)" value={dx} onChange={setDx} step={1e-3} min={1e-8} />
        <SelectField
          label="spatial dimension"
          value={dim}
          onChange={(value) => setDim(value as '1' | '2' | '3')}
          options={[
            { value: '1', label: '1D explicit' },
            { value: '2', label: '2D explicit' },
            { value: '3', label: '3D explicit' },
          ]}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Fo" value={formatNumber(result.Fo)} color={result.stable ? '#34d399' : '#f87171'} />
        <MetricCard label="Fo_max" value={formatNumber(result.FoMax)} color="#22d3ee" />
        <MetricCard label="dt_max (s)" value={formatNumber(result.dtMax)} color="#fbbf24" />
      </div>
      <Note>
        For central explicit diffusion, the stability limit tightens with dimension. Non-uniform grids and anisotropy can make the real limit stricter.
      </Note>
    </CalculatorPanel>
  )
}
