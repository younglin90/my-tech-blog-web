'use client'

import Link from 'next/link'

export function TerminalFooter() {
  return (
    <footer
      className="mt-20 flex flex-col gap-4 rounded-lg px-5 py-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <span style={{ color: 'var(--accent)' }}>$</span> uptime · daily since 2026
        </span>
        <span>영린{"'s"} CFD Blog · CC BY-SA 4.0</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" style={{ color: 'var(--text-faint)' }}>
        <Link href="/tags" className="link-hover-text">tags</Link>
        <Link href="/bookmarks" className="link-hover-text">saved</Link>
        <Link href="/about" className="link-hover-text">about</Link>
        <a href="/feed.xml" className="link-hover-text-accent">rss</a>
        <a href="https://github.com/younglin90" target="_blank" rel="noopener noreferrer" className="link-hover-text">
          github
        </a>
        <span className="ml-auto hidden sm:inline">
          press <kbd>?</kbd> for shortcuts
        </span>
      </div>
    </footer>
  )
}
