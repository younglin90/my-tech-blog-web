'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Mail, Check } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

// Buttondown 임베드. NEXT_PUBLIC_BUTTONDOWN_USERNAME 미설정 시 안내 페이지로 폴백.
// Buttondown 무료 플랜: 100명까지 무료. https://buttondown.email
//
// 사전 준비:
//   1. https://buttondown.email 가입
//   2. Settings → Username 확인
//   3. .env.local 또는 CF Pages env에 NEXT_PUBLIC_BUTTONDOWN_USERNAME=<your-name>

export function Subscribe() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const username = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!username) {
    // 미설정 시: 정적 안내만 노출 (폼은 숨김)
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
          href="/feed.xml"
          className="mt-2 inline-block text-xs font-medium underline underline-offset-4"
          style={{ color: 'var(--accent)' }}
        >
          RSS →
        </a>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitted) return
    // Buttondown은 form action으로 직접 submit하므로 여기서 trackEvent만 발사
    trackEvent('subscribe-submit', { locale })
    setSubmitted(true)
    // 실제 제출은 form의 native submit으로 위임 → 새 창에서 확인 페이지
  }

  return (
    <form
      action={`https://buttondown.email/api/emails/embed-subscribe/${username}`}
      method="post"
      target="popupwindow"
      onSubmit={(e) => {
        handleSubmit(e)
        window.open(`https://buttondown.email/${username}`, 'popupwindow')
      }}
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
          className="flex-1 rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          aria-label={t(locale, 'subscribe.placeholder')}
        />
        <button
          type="submit"
          disabled={submitted}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#08111f' }}
        >
          {submitted ? <Check className="h-3.5 w-3.5" /> : null}
          {t(locale, 'subscribe.button')}
        </button>
      </div>
      <p className="mt-2 text-[10px]" style={{ color: 'var(--text-faint)' }}>
        {t(locale, 'subscribe.note')}
      </p>
    </form>
  )
}
