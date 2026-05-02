'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { loadPostIndexClient } from '@/lib/post-index'

interface Props {
  label: string
}

// post-index.json의 meta.generatedAt을 표시 — 사이트가 활발히 업데이트되고
// 있다는 freshness 시그널. Footer 우측에 작은 mono 텍스트.
export function LastBuildIndicator({ label }: Props) {
  const [date, setDate] = useState<Date | null>(null)

  useEffect(() => {
    loadPostIndexClient()
      .then((p) => setDate(new Date(p.meta.generatedAt)))
      .catch(() => {})
  }, [])

  if (!date) return null

  // 상대 시간이 더 임팩트 있음 — '3시간 전' / 'just now'
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor(diffMs / (60 * 60 * 1000))

  let relative: string
  if (hours < 1) relative = '< 1h'
  else if (hours < 24) relative = `${hours}h ago`
  else if (days < 7) relative = `${days}d ago`
  else relative = format(date, 'yyyy.MM.dd')

  return (
    <span
      className="hidden sm:inline"
      title={`${label}: ${format(date, "yyyy.MM.dd HH:mm 'UTC'")}`}
      style={{ color: 'var(--text-faint)' }}
    >
      {label} <span style={{ color: 'var(--text-muted)' }}>{relative}</span>
    </span>
  )
}
