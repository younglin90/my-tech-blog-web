'use client'

import { useState } from 'react'
import { Link2, Check, Twitter, Linkedin } from 'lucide-react'

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
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(href)}`
  const hackerNewsUrl = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(href)}&t=${encodeURIComponent(title)}`

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
        aria-label="Share on Twitter"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={btnStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-3.5 w-3.5" />
      </a>
      <a
        href={hackerNewsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={btnStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
        aria-label="Share on HackerNews"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896H6.951z"/>
        </svg>
      </a>
    </div>
  )
}
