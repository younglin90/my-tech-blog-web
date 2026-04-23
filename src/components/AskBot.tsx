'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { localePathPrefix } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

interface Source { slug: string; title: string; score: number }

export function AskBot() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = async () => {
    if (!question.trim() || loading) return
    setLoading(true); setError(null); setAnswer(null); setSources([])
    trackEvent('askbot-query', { q_length: question.length, locale })
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, locale }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'failed')
        if (data.sources) setSources(data.sources)
      } else {
        setAnswer(data.answer)
        setSources(data.sources ?? [])
      }
    } catch (e: any) {
      setError(e.message ?? 'network')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
        style={{ background: 'var(--accent)', color: '#08111f' }}
        aria-label="Ask CFD-bot"
        title="Ask CFD-bot"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div
          className="fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-2rem)] max-w-md rounded-xl p-4 shadow-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Ask CFD-bot
            </h3>
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>RAG · Llama 3.1</span>
          </div>
          <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {locale === 'ko' ? '블로그의 22+ 포스트를 근거로 답합니다.' : 'Answers based on 22+ posts on this blog.'}
          </p>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={locale === 'ko' ? '예: Riemann 문제가 뭐야?' : 'e.g., What is the Riemann problem?'}
              className="flex-1 rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              disabled={loading}
            />
            <button
              onClick={submit}
              disabled={loading || !question.trim()}
              className="rounded-md px-3 py-1.5 text-sm transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#08111f' }}
              aria-label="Ask"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-xs" style={{ color: 'var(--error)' }}>
              {error === 'ai-binding-missing'
                ? 'AI 미설정 — Cloudflare Pages → Functions → Bindings에 Workers AI 등록 필요'
                : `Error: ${error}`}
            </p>
          )}

          {answer && (
            <div className="mt-4 space-y-3">
              <div
                className="rounded-md p-3 text-sm leading-relaxed"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {answer}
              </div>
              {sources.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Sources</p>
                  <ul className="space-y-1 text-xs">
                    {sources.map((s, i) => (
                      <li key={s.slug + i}>
                        <a
                          href={`/${locale}/posts/${s.slug}`}
                          className="link-hover-accent"
                          style={{ color: 'var(--accent)' }}
                        >
                          [{i + 1}] {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
