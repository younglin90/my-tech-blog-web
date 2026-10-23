'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'

// Buttondown 임베드. NEXT_PUBLIC_BUTTONDOWN_USERNAME 미설정 시 안내 페이지로 폴백.
// Buttondown 무료 플랜: 100명까지 무료. https://buttondown.email
//
// 인라인 fetch로 직접 POST → 새 창 띄우지 않고 그 자리에서 success/error 표시.
// Buttondown의 embed-subscribe 엔드포인트는 CORS 허용. 실패해도 form fallback이
// 가능하지만 일관성 위해 단일 인라인 흐름 유지.
export function Subscribe() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const username = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  if (!username) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
          <Mail className="h-3.5 w-3.5" />
          <span>{t(locale, 'subscribe.subtitle')}</span>
        </div>
        <a
          href={locale === 'ko' ? '/feed.xml' : `/feed-${locale}.xml`}
          className="mt-2 inline-block text-xs font-medium underline underline-offset-4"
          style={{ color: 'var(--accent)' }}
        >
          RSS →
        </a>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === 'submitting' || status === 'success') return
    setStatus('submitting')
    try {
      const body = new FormData()
      body.append('email', email)
      // Buttondown은 'tag' 파라미터를 받아 자동으로 태그 부여 가능 (선택)
      const res = await fetch(
        `https://buttondown.email/api/emails/embed-subscribe/${username}`,
        { method: 'POST', body, mode: 'no-cors' },   // no-cors → opaque 응답, status 알 수 없음
      )
      // no-cors의 opaque response는 status 0이라 성공 여부 못 읽지만,
      // Buttondown은 항상 confirmation 메일을 보내므로 fetch 자체가 throw하지 않으면 성공으로 간주.
      void res
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)' }}
      >
        <div className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            {t(locale, 'subscribe.success')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg p-4"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Mail className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t(locale, 'subscribe.title')}</p>
      </div>
      <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {t(locale, 'subscribe.subtitle')}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={t(locale, 'subscribe.placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          className="flex-1 rounded-md px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          aria-label={t(locale, 'subscribe.placeholder')}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t(locale, 'subscribe.submitting')}
            </>
          ) : (
            t(locale, 'subscribe.button')
          )}
        </button>
      </div>
      {status === 'error' && (
        <div
          className="mt-2 flex items-center gap-1.5 text-xs"
          style={{ color: '#f87171' }}
        >
          <AlertCircle className="h-3 w-3" />
          {t(locale, 'subscribe.error')}
        </div>
      )}
      <p className="mt-2 text-[10px]" style={{ color: 'var(--text-faint)' }}>
        {t(locale, 'subscribe.note')}
        {' · '}
        <Link href={`/${locale}/privacy`} className="underline underline-offset-2 link-hover-text-accent">
          {t(locale, 'subscribe.privacy')}
        </Link>
      </p>
    </form>
  )
}
