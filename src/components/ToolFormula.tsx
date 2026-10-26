import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { KatexStyles } from '@/components/KatexStyles'

interface ToolFormulaProps {
  formula: string
  label: string
  renderedLabel: string
  asciiLabel: string
}

export function ToolFormula({ formula, label, renderedLabel, asciiLabel }: ToolFormulaProps) {
  const displayFormula = toSafeDisplayFormula(formula)

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(145deg, color-mix(in srgb, var(--accent) 14%, transparent), var(--surface) 48%, var(--bg))',
        border: '1px solid var(--border)',
      }}
    >
      <KatexStyles />
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
          {label}
        </div>
        <div className="mono rounded-full px-2 py-1 text-[10px]" style={{ background: 'var(--bg)', color: 'var(--text-faint)' }}>
          {renderedLabel}
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="tool-formula-render">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
          >
            {`$$\n${displayFormula}\n$$`}
          </ReactMarkdown>
        </div>
        <details className="mt-3 rounded-xl px-3 py-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <summary className="cursor-pointer text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {asciiLabel}
          </summary>
          <code className="mt-2 block whitespace-pre-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
            {formula}
          </code>
        </details>
      </div>
    </section>
  )
}

function toSafeDisplayFormula(formula: string): string {
  const lines = formula
    .split(/\s{2,}|,\s+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return String.raw`\text{No formula available}`

  return String.raw`\begin{aligned}` +
    lines.map((line) => String.raw`\text{${escapeLatexText(prettyFormulaText(line))}}`).join(String.raw`\\[0.35em]`) +
    String.raw`\end{aligned}`
}

function prettyFormulaText(value: string): string {
  return value.replace(/\s+/g, ' ')
}

function escapeLatexText(value: string): string {
  return value
    .replace(/\\/g, String.raw`\textbackslash{}`)
    .replace(/([{}_$&#%])/g, String.raw`\$1`)
    .replace(/\^/g, String.raw`\^{}`)
    .replace(/~/g, String.raw`\~{}`)
}
