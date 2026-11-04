import type { CalculatorMeta } from '@/lib/calculators'
import type { Locale } from '@/lib/i18n'

interface ToolInsightPanelProps {
  meta: CalculatorMeta
  locale: Locale
  categoryLabel: string
}

export function ToolInsightPanel({ meta, locale, categoryLabel }: ToolInsightPanelProps) {
  const title = meta.title[locale] ?? meta.title.en

  return (
    <section
      className="mb-5 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2.5"
      aria-label={title}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}
    >
      <span
        className="mono rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
      >
        {categoryLabel}
      </span>
      {meta.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full px-2 py-0.5 text-[11px]"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          {tag}
        </span>
      ))}
    </section>
  )
}
