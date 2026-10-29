'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'
import { getComments, postComment, timeAgo, type CommentItem } from '@/lib/post-stats'

const NAME_KEY = 'cfd-lab-comment-name'

// 글 하단 댓글 (D1, 로그인 없음). 목록은 오래된 순, 새 댓글은 바로 아래에 붙인다.
export function Comments({ slug }: { slug: string }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [items, setItems] = useState<CommentItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [website, setWebsite] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    try { setName(localStorage.getItem(NAME_KEY) ?? '') } catch {}
    getComments(slug).then((c) => {
      if (cancelled) return
      if (c) setItems(c)
      else setFailed(true)
    })
    return () => { cancelled = true }
  }, [slug])

  // 홈 "최근 댓글"의 #comment-ID 링크: 목록이 비동기로 그려진 뒤에 스크롤한다.
  useEffect(() => {
    if (!items?.length || !location.hash.startsWith('#comment-')) return
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [items])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || !name.trim() || body.trim().length < 2) return
    setSending(true)
    setError(null)
    const res = await postComment(slug, name.trim(), body.trim(), website)
    setSending(false)
    if ('error' in res) {
      setError(t(locale, 'comments.error'))
      return
    }
    try { localStorage.setItem(NAME_KEY, name.trim()) } catch {}
    if (res.item) setItems((prev) => [...(prev ?? []), res.item!])
    setBody('')
  }

  const field = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  return (
    <section id="comments" className="mt-12">
      <h2 className="mb-5 text-lg font-semibold" style={{ color: 'var(--text)' }}>
        {t(locale, 'comments.title')}
        {items && items.length > 0 && (
          <span className="tabular ml-2 text-sm font-normal" style={{ color: 'var(--text-faint)' }}>{items.length}</span>
        )}
      </h2>

      {failed ? (
        <p className="mb-6 text-sm" style={{ color: 'var(--text-faint)' }}>{t(locale, 'comments.unavailable')}</p>
      ) : items && items.length === 0 ? (
        <p className="mb-6 text-sm" style={{ color: 'var(--text-faint)' }}>{t(locale, 'comments.empty')}</p>
      ) : (
        <ol className="mb-8 space-y-5">
          {(items ?? []).map((c) => (
            <li key={c.id} id={`comment-${c.id}`}>
              <div className="flex items-baseline gap-2 text-sm">
                <span className="font-medium" style={{ color: 'var(--text)' }}>{c.name}</span>
                <time className="text-xs" style={{ color: 'var(--text-faint)' }} dateTime={new Date(c.ts).toISOString()}>
                  {timeAgo(c.ts, locale)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {c.body}
              </p>
            </li>
          ))}
        </ol>
      )}

      {!failed && (
        <form onSubmit={submit} className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
            placeholder={t(locale, 'comments.name')}
            aria-label={t(locale, 'comments.name')}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:[border-color:var(--accent)] sm:w-60"
            style={field}
          />
          {/* honeypot — 사람에게는 보이지 않는다 */}
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            name="website"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
            rows={3}
            placeholder={t(locale, 'comments.body')}
            aria-label={t(locale, 'comments.body')}
            className="block w-full resize-y rounded-lg px-3 py-2 text-sm leading-relaxed outline-none focus:[border-color:var(--accent)]"
            style={field}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: error ? 'var(--error)' : 'var(--text-faint)' }}>
              {error ?? t(locale, 'comments.hint')}
            </span>
            <button
              type="submit"
              disabled={sending || !name.trim() || body.trim().length < 2}
              className="min-h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              {sending ? t(locale, 'comments.sending') : t(locale, 'comments.submit')}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
