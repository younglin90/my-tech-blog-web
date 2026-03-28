'use client'

import { useState } from 'react'
import { Link2, Check, Twitter } from 'lucide-react'

interface ShareButtonProps {
  title: string
  url?: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const href = url ?? (typeof window !== 'undefined' ? window.location.href : '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(href)}`

  const btnStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '0.375rem',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    transition: 'border-color 0.1s, color 0.1s',
    cursor: 'pointer',
    textDecoration: 'none',
  } as const

  return (
    <div className="share-button flex items-center gap-2">
      <button
        onClick={handleCopy}
        style={{ ...btnStyle, color: copied ? 'var(--success)' : 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          if (!copied) (e.currentTarget as HTMLElement).style.color = 'var(--text)'
        }}
        onMouseLeave={(e) => {
          if (!copied) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={btnStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        <Twitter className="h-3.5 w-3.5" />
        Share
      </a>
    </div>
  )
}
