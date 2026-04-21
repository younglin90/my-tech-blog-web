'use client'

import { useEffect, useState } from 'react'
import { Link2, Check, Twitter, Linkedin, Share2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
  url?: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [href, setHref] = useState(url ?? '')

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === 'function')
    if (!url) setHref(window.location.href)
  }, [url])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, url: href })
    } catch {}
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(href)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(href)}`
  const hackerNewsUrl = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(href)}&t=${encodeURIComponent(title)}`

  return (
    <div className="share-button flex flex-wrap items-center gap-2">
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          className="share-btn flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          aria-label="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      )}
      <button
        onClick={handleCopy}
        className="share-btn flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: copied ? 'var(--success)' : 'var(--text-muted)',
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}
        aria-label="Share on Twitter"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-3.5 w-3.5" />
      </a>
      <a
        href={hackerNewsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}
        aria-label="Share on HackerNews"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896H6.951z"/>
        </svg>
      </a>
    </div>
  )
}
