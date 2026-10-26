import type { CalculatorCategory, CalculatorMeta } from '@/lib/calculators'
import type { Locale } from '@/lib/i18n'

interface ToolInsightPanelProps {
  meta: CalculatorMeta
  locale: Locale
  categoryLabel: string
}

const CATEGORY_TONES: Record<CalculatorCategory, { glow: string; hot: string; cool: string }> = {
  compressible: { glow: 'rgba(56,189,248,0.34)', hot: '#f97316', cool: '#22d3ee' },
  'internal-flow': { glow: 'rgba(45,212,191,0.28)', hot: '#22d3ee', cool: '#14b8a6' },
  aerodynamics: { glow: 'rgba(125,211,252,0.30)', hot: '#facc15', cool: '#38bdf8' },
  turbomachinery: { glow: 'rgba(251,146,60,0.25)', hot: '#fb923c', cool: '#22d3ee' },
  'porous-rheology': { glow: 'rgba(163,230,53,0.22)', hot: '#a3e635', cool: '#14b8a6' },
  dimensionless: { glow: 'rgba(34,211,238,0.24)', hot: '#f472b6', cool: '#22d3ee' },
  turbulence: { glow: 'rgba(59,130,246,0.28)', hot: '#818cf8', cool: '#22d3ee' },
  'heat-transfer': { glow: 'rgba(251,113,133,0.24)', hot: '#fb7185', cool: '#facc15' },
  'reacting-flow': { glow: 'rgba(249,115,22,0.28)', hot: '#f97316', cool: '#facc15' },
  multiphase: { glow: 'rgba(96,165,250,0.26)', hot: '#67e8f9', cool: '#60a5fa' },
  numerics: { glow: 'rgba(34,211,238,0.22)', hot: '#22d3ee', cool: '#94a3b8' },
}

const PANEL_COPY: Record<Locale, { eyebrow: string; headline: string; body: string; input: string; model: string; output: string }> = {
  ko: {
    eyebrow: '시각 계산기',
    headline: '숫자를 넣기 전에 유동의 모양을 먼저 잡습니다.',
    body: '이 도구는 입력값을 단순 결과표가 아니라 레짐, 스케일, 지배 효과로 읽게 만듭니다. 아래 계산기를 조작하면서 그림의 흐름과 결과가 어떻게 같이 움직이는지 확인하세요.',
    input: '입력 스케일',
    model: '지배식',
    output: '판정',
  },
  en: {
    eyebrow: 'visual calculator',
    headline: 'Read the flow shape before trusting the number.',
    body: 'This page turns a CFD setup into regime, scale, and dominant-effect cues. Adjust the calculator below and compare the moving graphic with the computed result.',
    input: 'input scale',
    model: 'model',
    output: 'check',
  },
  ja: {
    eyebrow: 'ビジュアル計算',
    headline: '数値を見る前に、流れの形をつかみます。',
    body: 'このツールは入力値をレジーム、スケール、支配効果として読めるようにします。下の計算機を動かし、図と結果の変化を見比べてください。',
    input: '入力スケール',
    model: '支配式',
    output: '判定',
  },
  zh: {
    eyebrow: '可视化计算',
    headline: '先看流动形态，再相信数字。',
    body: '该工具把 CFD 设置转换为工况、尺度和主导效应提示。调节下方计算器，观察动态图与计算结果如何一起变化。',
    input: '输入尺度',
    model: '模型',
    output: '判断',
  },
  es: {
    eyebrow: 'calculadora visual',
    headline: 'Lee la forma del flujo antes de confiar en el número.',
    body: 'La herramienta convierte una configuración CFD en pistas de régimen, escala y efecto dominante. Ajusta la calculadora y compara la gráfica con el resultado.',
    input: 'escala',
    model: 'modelo',
    output: 'criterio',
  },
}

export function ToolInsightPanel({ meta, locale, categoryLabel }: ToolInsightPanelProps) {
  const copy = PANEL_COPY[locale] ?? PANEL_COPY.en
  const tone = CATEGORY_TONES[meta.category]
  const primaryTag = meta.tags[0] ?? meta.category

  return (
    <section
      className="mb-6 overflow-hidden rounded-3xl"
      style={{
        background: `radial-gradient(circle at 20% 20%, ${tone.glow}, transparent 38%), linear-gradient(135deg, var(--surface), var(--bg))`,
        border: '1px solid var(--border)',
        boxShadow: `0 24px 80px ${tone.glow}`,
      }}
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="relative min-h-[260px] overflow-hidden border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--border)' }}>
          <CategoryIllustration category={meta.category} tone={tone} title={meta.title[locale] ?? meta.title.en} />
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="mono rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            >
              {copy.eyebrow}
            </span>
            <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {categoryLabel}
            </span>
          </div>

          <div>
            <h2 className="display text-2xl font-bold tracking-[-0.03em] sm:text-3xl" style={{ color: 'var(--text)' }}>
              {copy.headline}
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              {copy.body}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <StageCard label="01" value={copy.input} tone={tone.cool} />
            <StageCard label="02" value={copy.model} tone={tone.hot} />
            <StageCard label="03" value={copy.output} tone="var(--accent)" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[primaryTag, ...meta.tags.filter((tag) => tag !== primaryTag).slice(0, 5)].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-1 text-[11px]"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StageCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="mono text-[10px]" style={{ color: tone }}>
        {label}
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

function CategoryIllustration({
  category,
  tone,
  title,
}: {
  category: CalculatorCategory
  tone: { glow: string; hot: string; cool: string }
  title: string
}) {
  return (
    <svg viewBox="0 0 720 360" role="img" aria-label={`${title} visual summary`} className="h-full min-h-[260px] w-full">
      <defs>
        <linearGradient id={`tool-grad-${category}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={tone.cool} stopOpacity="0.92" />
          <stop offset="100%" stopColor={tone.hot} stopOpacity="0.86" />
        </linearGradient>
        <radialGradient id={`tool-glow-${category}`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={tone.cool} stopOpacity="0.32" />
          <stop offset="100%" stopColor={tone.cool} stopOpacity="0" />
        </radialGradient>
        <pattern id={`tool-grid-${category}`} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="720" height="360" fill="rgba(8,17,31,0.56)" />
      <rect width="720" height="360" fill={`url(#tool-grid-${category})`} />
      <circle cx="360" cy="180" r="180" fill={`url(#tool-glow-${category})`} />

      <FlowLines tone={tone} />
      {category === 'compressible' && <CompressibleShape category={category} tone={tone} />}
      {category === 'internal-flow' && <InternalFlowShape category={category} tone={tone} />}
      {category === 'aerodynamics' && <AerodynamicsShape category={category} tone={tone} />}
      {category === 'turbomachinery' && <RotorShape category={category} tone={tone} />}
      {category === 'porous-rheology' && <PorousShape category={category} tone={tone} />}
      {category === 'dimensionless' && <RegimeMapShape category={category} tone={tone} />}
      {category === 'turbulence' && <TurbulenceShape category={category} tone={tone} />}
      {category === 'heat-transfer' && <HeatShape category={category} tone={tone} />}
      {category === 'reacting-flow' && <FlameShape category={category} tone={tone} />}
      {category === 'multiphase' && <MultiphaseShape category={category} tone={tone} />}
      {category === 'numerics' && <NumericsShape category={category} tone={tone} />}
    </svg>
  )
}

function FlowLines({ tone }: { tone: { hot: string; cool: string } }) {
  return (
    <g opacity="0.72">
      {[72, 116, 244, 288].map((y, index) => (
        <path
          key={y}
          d={`M 18 ${y} C 190 ${y - 28 + index * 10}, 286 ${y + 36}, 430 ${y - 8} S 610 ${y + 20}, 702 ${y - 12}`}
          fill="none"
          stroke={index % 2 ? tone.hot : tone.cool}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="10 16"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-52" dur={`${5 + index}s`} repeatCount="indefinite" />
        </path>
      ))}
    </g>
  )
}

function CompressibleShape({ category, tone }: ShapeProps) {
  return (
    <g>
      <path d="M150 115 C240 160 278 160 360 132 C452 100 524 108 606 142 L606 218 C524 252 452 260 360 228 C278 200 240 200 150 245 Z" fill="rgba(8,17,31,0.78)" stroke={`url(#tool-grad-${category})`} strokeWidth="3" />
      <path d="M404 86 L446 278" stroke={tone.hot} strokeWidth="5" strokeLinecap="round" opacity="0.9">
        <animate attributeName="opacity" values="0.42;1;0.42" dur="2.4s" repeatCount="indefinite" />
      </path>
      <text x="396" y="72" className="mono" fill={tone.hot} fontSize="18">shock</text>
    </g>
  )
}

function InternalFlowShape({ category, tone }: ShapeProps) {
  return (
    <g>
      <rect x="110" y="118" width="500" height="124" rx="62" fill="rgba(8,17,31,0.82)" stroke={`url(#tool-grad-${category})`} strokeWidth="3" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M ${160 + i * 70} 211 C ${210 + i * 38} 154, ${296 + i * 22} 154, ${344 + i * 34} 211`} fill="none" stroke={i % 2 ? tone.hot : tone.cool} strokeWidth="2" opacity="0.8" />
      ))}
      <path d="M140 180 H580" stroke={tone.cool} strokeWidth="8" strokeLinecap="round" opacity="0.28" />
    </g>
  )
}

function AerodynamicsShape({ category, tone }: ShapeProps) {
  return (
    <g>
      <path d="M196 190 C292 118 450 128 564 180 C438 202 308 210 196 190 Z" fill="rgba(8,17,31,0.86)" stroke={`url(#tool-grad-${category})`} strokeWidth="3" />
      <path d="M170 156 C280 102 438 106 618 142" fill="none" stroke={tone.cool} strokeWidth="3" strokeLinecap="round" />
      <path d="M170 226 C304 262 474 244 626 198" fill="none" stroke={tone.hot} strokeWidth="3" strokeLinecap="round" />
      <circle cx="520" cy="180" r="8" fill={tone.hot}>
        <animate attributeName="cx" values="226;520;226" dur="4.8s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

function RotorShape({ category, tone }: ShapeProps) {
  return (
    <g transform="translate(360 180)">
      <circle r="118" fill="rgba(8,17,31,0.70)" stroke={`url(#tool-grad-${category})`} strokeWidth="3" />
      {[0, 72, 144, 216, 288].map((angle) => (
        <path key={angle} d="M0 0 C42 -22 72 -58 104 -92 C90 -24 62 8 0 0 Z" fill={tone.hot} opacity="0.72" transform={`rotate(${angle})`}>
          <animateTransform attributeName="transform" type="rotate" from={`${angle} 0 0`} to={`${angle + 360} 0 0`} dur="8s" repeatCount="indefinite" />
        </path>
      ))}
      <circle r="28" fill={tone.cool} opacity="0.9" />
    </g>
  )
}

function PorousShape({ category, tone }: ShapeProps) {
  return (
    <g>
      {[150, 220, 290, 360, 430, 500, 570].map((x, i) => (
        <circle key={x} cx={x} cy={128 + (i % 3) * 48} r={24 + (i % 2) * 8} fill="rgba(8,17,31,0.84)" stroke={i % 2 ? tone.hot : tone.cool} strokeWidth="3" />
      ))}
      <path d="M116 250 C240 202 376 284 604 218" fill="none" stroke={`url(#tool-grad-${category})`} strokeWidth="7" strokeLinecap="round" strokeDasharray="18 18">
        <animate attributeName="stroke-dashoffset" from="0" to="-72" dur="4s" repeatCount="indefinite" />
      </path>
    </g>
  )
}

function RegimeMapShape({ category, tone }: ShapeProps) {
  return (
    <g>
      <path d="M146 282 V82 M146 282 H606" stroke="rgba(226,232,240,0.48)" strokeWidth="2" />
      <path d="M166 262 C260 236 280 146 356 132 C448 116 482 222 586 98" fill="none" stroke={`url(#tool-grad-${category})`} strokeWidth="4" />
      {[190, 252, 330, 396, 476, 548].map((x, i) => (
        <circle key={x} cx={x} cy={236 - (i % 3) * 42} r="8" fill={i % 2 ? tone.hot : tone.cool}>
          <animate attributeName="r" values="6;11;6" dur={`${2.5 + i * 0.2}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function TurbulenceShape({ tone }: ShapeProps) {
  return (
    <g>
      {[170, 260, 365, 472, 570].map((x, i) => (
        <path key={x} d={`M ${x} 180 m -42 0 a 42 42 0 1 0 84 0 a 42 42 0 1 0 -84 0`} fill="none" stroke={i % 2 ? tone.hot : tone.cool} strokeWidth="3" strokeDasharray="12 10">
          <animate attributeName="stroke-dashoffset" from="0" to={i % 2 ? '44' : '-44'} dur={`${3.2 + i * 0.35}s`} repeatCount="indefinite" />
        </path>
      ))}
      <path d="M110 258 H616" stroke="rgba(226,232,240,0.25)" strokeWidth="6" strokeLinecap="round" />
    </g>
  )
}

function HeatShape({ category, tone }: ShapeProps) {
  return (
    <g>
      <rect x="132" y="250" width="456" height="24" rx="12" fill={tone.hot} opacity="0.72" />
      {[210, 292, 374, 456, 538].map((x, i) => (
        <path key={x} d={`M ${x} 238 C ${x - 40} 184, ${x + 42} 146, ${x} 88`} fill="none" stroke={i % 2 ? tone.hot : tone.cool} strokeWidth="5" strokeLinecap="round" opacity="0.76">
          <animate attributeName="d" values={`M ${x} 238 C ${x - 40} 184, ${x + 42} 146, ${x} 88;M ${x} 238 C ${x + 36} 184, ${x - 34} 146, ${x} 88;M ${x} 238 C ${x - 40} 184, ${x + 42} 146, ${x} 88`} dur={`${4 + i * 0.2}s`} repeatCount="indefinite" />
        </path>
      ))}
      <text x="146" y="308" className="mono" fill={tone.hot} fontSize="18">q'' wall</text>
    </g>
  )
}

function FlameShape({ category, tone }: ShapeProps) {
  return (
    <g transform="translate(360 200)">
      <path d="M0 -118 C54 -46 92 -28 82 40 C74 100 22 132 0 136 C-28 112 -76 86 -72 28 C-68 -30 -22 -56 0 -118 Z" fill={`url(#tool-grad-${category})`} opacity="0.86">
        <animate attributeName="d" values="M0 -118 C54 -46 92 -28 82 40 C74 100 22 132 0 136 C-28 112 -76 86 -72 28 C-68 -30 -22 -56 0 -118 Z;M0 -126 C40 -48 104 -24 78 48 C62 106 34 128 0 136 C-34 110 -86 78 -66 20 C-48 -30 -18 -64 0 -126 Z;M0 -118 C54 -46 92 -28 82 40 C74 100 22 132 0 136 C-28 112 -76 86 -72 28 C-68 -30 -22 -56 0 -118 Z" dur="2.8s" repeatCount="indefinite" />
      </path>
      <path d="M0 -48 C26 0 42 18 30 58 C18 92 -12 104 -30 70 C-44 42 -16 4 0 -48 Z" fill="rgba(8,17,31,0.58)" />
    </g>
  )
}

function MultiphaseShape({ category, tone }: ShapeProps) {
  return (
    <g>
      <path d="M92 220 C190 176 258 260 360 220 C468 178 530 258 628 214 V296 H92 Z" fill={`url(#tool-grad-${category})`} opacity="0.42" />
      {[170, 234, 318, 420, 506, 574].map((x, i) => (
        <circle key={x} cx={x} cy={214 - (i % 3) * 34} r={14 + (i % 2) * 7} fill="rgba(8,17,31,0.7)" stroke={i % 2 ? tone.hot : tone.cool} strokeWidth="3">
          <animate attributeName="cy" values={`${214 - (i % 3) * 34};${184 - (i % 3) * 30};${214 - (i % 3) * 34}`} dur={`${3.4 + i * 0.28}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function NumericsShape({ category, tone }: ShapeProps) {
  return (
    <g>
      {[130, 190, 250, 310, 370, 430, 490, 550].map((x) => (
        <path key={x} d={`M ${x} 88 V282`} stroke="rgba(226,232,240,0.14)" strokeWidth="2" />
      ))}
      {[100, 145, 190, 235, 280].map((y) => (
        <path key={y} d={`M 116 ${y} H604`} stroke="rgba(226,232,240,0.14)" strokeWidth="2" />
      ))}
      <path d="M116 184 C180 90 248 278 316 184 S456 90 604 184" fill="none" stroke={`url(#tool-grad-${category})`} strokeWidth="5" strokeLinecap="round" />
      <path d="M116 184 L604 184" stroke={tone.cool} strokeWidth="2" strokeDasharray="10 10">
        <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="3s" repeatCount="indefinite" />
      </path>
    </g>
  )
}

type ShapeProps = {
  category: CalculatorCategory
  tone: { hot: string; cool: string }
}
