'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'
import { getCommentChallenge, getComments, postComment, timeAgo, type CommentChallenge, type CommentItem } from '@/lib/post-stats'

const NAME_KEY = 'cfd-lab-comment-name'

// 글 하단 댓글 (D1, 로그인 없음). 목록은 오래된 순, 새 댓글은 바로 아래에 붙인다.
// 등록은 그림 속 글자를 직접 입력해야 한다. 정답은 서버에만 있다.
export function Comments({ slug }: { slug: string }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [items, setItems] = useState<CommentItem[] | null>(null)
  const [listFailed, setListFailed] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [website, setWebsite] = useState('')
  const [answer, setAnswer] = useState('')
  const [gate, setGate] = useState<CommentChallenge | null>(null)
  const [gateFailed, setGateFailed] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGate = useCallback(() => {
    setGate(null)
    setGateFailed(false)
    setAnswer('')
    getCommentChallenge().then((c) => {
      if (c) setGate(c)
      else setGateFailed(true)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    try { setName(localStorage.getItem(NAME_KEY) ?? '') } catch {}
    getComments(slug).then((c) => {
      if (cancelled) return
      if (c) setItems(c)
      else setListFailed(true)
    })
    loadGate()
    return () => { cancelled = true }
  }, [slug, loadGate])

  // 홈 "최근 댓글" 링크: 목록이 비동기로 그려진 뒤에 스크롤한다.
  useEffect(() => {
    if (!items?.length) return
    const m = location.hash.match(/^#(?:note|comment)-(\d+)$/)
    if (!m) return
    document.getElementById(`note-${m[1]}`)?.scrollIntoView({ block: 'center' })
  }, [items])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || !name.trim() || body.trim().length < 2 || !gate || answer.trim().length < 5) return
    setSending(true)
    setError(null)
    const res = await postComment(slug, name.trim(), body.trim(), website, { nonce: gate.nonce, answer: answer.trim() })
    setSending(false)
    if ('error' in res) {
      setError(t(locale, res.error === 'challenge' ? 'comments.challengeError' : 'comments.error'))
      loadGate()
      return
    }
    try { localStorage.setItem(NAME_KEY, name.trim()) } catch {}
    if (res.item) setItems((prev) => [...(prev ?? []), res.item!])
    setBody('')
    loadGate()
  }

  const field = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  const ready = !sending && !!name.trim() && body.trim().length >= 2 && !!gate && answer.trim().length >= 5

  return (
    <section id="reader-notes" className="mt-12">
      <h2 className="mb-5 text-lg font-semibold" style={{ color: 'var(--text)' }}>
        {t(locale, 'comments.title')}
        {items && items.length > 0 && (
          <span className="tabular ml-2 text-sm font-normal" style={{ color: 'var(--text-faint)' }}>{items.length}</span>
        )}
      </h2>

      {listFailed ? (
        <p className="mb-6 text-sm" style={{ color: 'var(--text-faint)' }}>{t(locale, 'comments.unavailable')}</p>
      ) : items && items.length === 0 ? (
        <p className="mb-6 text-sm" style={{ color: 'var(--text-faint)' }}>{t(locale, 'comments.empty')}</p>
      ) : (
        <ol className="mb-8 space-y-5">
          {(items ?? []).map((c) => (
            <li key={c.id} id={`note-${c.id}`}>
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
        <div className="flex flex-wrap items-center gap-2">
          {gate ? (
            <img
              src={gate.image}
              alt=""
              className="h-[52px] w-auto rounded-md"
              style={{ border: '1px solid var(--border)', background: '#f4efe6' }}
            />
          ) : (
            <span
              className="inline-block h-[52px] w-[168px] rounded-md"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
            />
          )}
          <button
            type="button"
            onClick={loadGate}
            className="min-h-10 rounded-lg px-3 text-xs"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            {t(locale, 'comments.newCode')}
          </button>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={t(locale, 'comments.challenge')}
            aria-label={t(locale, 'comments.challenge')}
            className="min-h-10 w-40 rounded-lg px-3 py-2 text-sm uppercase tracking-widest outline-none focus:[border-color:var(--accent)]"
            style={field}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs" style={{ color: error || gateFailed ? 'var(--error)' : 'var(--text-faint)' }}>
            {error ?? (gateFailed ? t(locale, 'comments.unavailable') : t(locale, 'comments.challengeHint'))}
          </span>
          <button
            type="submit"
            disabled={!ready}
            className="min-h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {sending ? t(locale, 'comments.sending') : t(locale, 'comments.submit')}
          </button>
        </div>
      </form>
    </section>
  )
}
