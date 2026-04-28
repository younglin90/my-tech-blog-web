'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function memoryColor(gb: number) {
  if (gb < 16) return '#34d399'
  if (gb < 128) return '#fbbf24'
  return '#fb7185'
}

function hardwareClass(gb: number) {
  if (gb < 16) return 'laptop scale'
  if (gb < 128) return 'workstation scale'
  if (gb < 512) return 'single large node'
  return 'multi-node planning'
}

export function CaseMemoryEstimatorCalculator() {
  const [cellsMillions, setCellsMillions] = useState(8)
  const [scalarFields, setScalarFields] = useState(8)
  const [vectorFields, setVectorFields] = useState(3)
  const [timeLevels, setTimeLevels] = useState(2)
  const [matrixFactor, setMatrixFactor] = useState(7)
  const [overheadFactor, setOverheadFactor] = useState(1.8)
  const [partitions, setPartitions] = useState(16)

  const result = useMemo(() => {
    const cells = Math.max(cellsMillions, 0) * 1e6
    const fieldDoubles = scalarFields + vectorFields * 3
    const fieldBytes = cells * fieldDoubles * Math.max(timeLevels, 1) * 8
    const matrixBytes = cells * Math.max(matrixFactor, 0) * 8 * 5
    const overheadBytes = (fieldBytes + matrixBytes) * Math.max(overheadFactor - 1, 0)
    const totalBytes = fieldBytes + matrixBytes + overheadBytes
    const gb = totalBytes / 1024 ** 3
    const perRankGb = gb / Math.max(partitions, 1)
    const cellsPerRank = cells / Math.max(partitions, 1)
    const fieldShare = fieldBytes / Math.max(totalBytes, 1)
    const matrixShare = matrixBytes / Math.max(totalBytes, 1)
    const overheadShare = overheadBytes / Math.max(totalBytes, 1)
    return { cells, fieldDoubles, fieldBytes, matrixBytes, overheadBytes, totalBytes, gb, perRankGb, cellsPerRank, fieldShare, matrixShare, overheadShare }
  }, [cellsMillions, matrixFactor, overheadFactor, partitions, scalarFields, timeLevels, vectorFields])

  const maxGb = 512
  const memoryWidth = clamp(result.gb / maxGb, 0.02, 1) * 430
  const rankCount = Math.min(Math.max(Math.round(partitions), 1), 32)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="cells (million)" value={cellsMillions} onChange={setCellsMillions} step={1} min={0.001} />
        <NumberField label="scalar fields" value={scalarFields} onChange={setScalarFields} step={1} min={0} />
        <NumberField label="vector fields" value={vectorFields} onChange={setVectorFields} step={1} min={0} />
        <NumberField label="time levels" value={timeLevels} onChange={setTimeLevels} step={1} min={1} />
        <NumberField label="matrix stencil factor" value={matrixFactor} onChange={setMatrixFactor} step={0.5} min={0} />
        <NumberField label="solver overhead factor" value={overheadFactor} onChange={setOverheadFactor} step={0.1} min={1} />
        <NumberField label="MPI partitions" value={partitions} onChange={setPartitions} step={1} min={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="CFD case memory estimator">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">CFD memory budget</text>

          <rect x="116" y="88" width="430" height="42" rx="12" fill="rgba(148,163,184,0.16)" />
          <rect x="116" y="88" width={memoryWidth} height="42" rx="12" fill={memoryColor(result.gb)} opacity="0.75" />
          {[16, 128, 512].map((tick) => (
            <g key={tick}>
              <line x1={116 + (tick / maxGb) * 430} x2={116 + (tick / maxGb) * 430} y1="78" y2="142" stroke="rgba(226,232,240,0.25)" />
              <text x={100 + (tick / maxGb) * 430} y="158" fill="var(--text-muted)" fontSize="11">{`${tick} GB`}</text>
            </g>
          ))}
          <text x="116" y="184" fill={memoryColor(result.gb)} fontSize="14" fontWeight="700">{hardwareClass(result.gb)}</text>
          <text x="116" y="204" fill="var(--text-muted)" fontSize="12">total memory includes fields, sparse matrices, and solver overhead</text>

          <g transform="translate(116 232)">
            <rect x="0" y="0" width="430" height="34" rx="10" fill="rgba(148,163,184,0.16)" />
            <rect x="0" y="0" width={430 * result.fieldShare} height="34" rx="10" fill="#22d3ee" opacity="0.8" />
            <rect x={430 * result.fieldShare} y="0" width={430 * result.matrixShare} height="34" fill="#fbbf24" opacity="0.82" />
            <rect x={430 * (result.fieldShare + result.matrixShare)} y="0" width={430 * result.overheadShare} height="34" rx="10" fill="#fb7185" opacity="0.74" />
            <text x="8" y="23" fill="#08111f" fontSize="12" fontWeight="700">fields</text>
            <text x={430 * result.fieldShare + 8} y="23" fill="#08111f" fontSize="12" fontWeight="700">matrix</text>
            <text x={430 * (result.fieldShare + result.matrixShare) + 8} y="23" fill="#08111f" fontSize="12" fontWeight="700">overhead</text>
          </g>

          <g transform="translate(116 288)">
            {Array.from({ length: rankCount }, (_, i) => {
              const x = (i % 16) * 27
              const y = Math.floor(i / 16) * 20
              const load = 0.55 + ((i * 7) % 9) / 20
              return <rect key={i} x={x} y={y} width="20" height={14 + load * 5} rx="4" fill={memoryColor(result.perRankGb)} opacity={0.48 + load * 0.38} />
            })}
            <text x="0" y="56" fill="var(--text-muted)" fontSize="12">{`${rankCount} shown partitions; per-rank memory should fit node limits`}</text>
          </g>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="total memory (GB)" value={formatNumber(result.gb)} color={memoryColor(result.gb)} />
        <MetricCard label="per-rank memory (GB)" value={formatNumber(result.perRankGb)} color={memoryColor(result.perRankGb)} />
        <MetricCard label="cells per rank" value={formatNumber(result.cellsPerRank, 0)} color="#22d3ee" />
        <MetricCard label="stored components/cell" value={formatNumber(result.fieldDoubles, 0)} color="#34d399" />
        <MetricCard label="field memory (GB)" value={formatNumber(result.fieldBytes / 1024 ** 3)} color="#22d3ee" />
        <MetricCard label="matrix memory (GB)" value={formatNumber(result.matrixBytes / 1024 ** 3)} color="#fbbf24" />
        <MetricCard label="overhead memory (GB)" value={formatNumber(result.overheadBytes / 1024 ** 3)} color="#fb7185" />
        <MetricCard label="hardware class" value={hardwareClass(result.gb)} color={memoryColor(result.gb)} />
      </div>
      <Note>This is a sizing estimate, not a solver guarantee. Multigrid levels, chemistry tables, Lagrangian particles, and I/O buffers can increase memory substantially.</Note>
    </CalculatorPanel>
  )
}
