'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Tag, User, Search, Bookmark } from 'lucide-react'

const links = [
  { href: '/', label: 'Posts', Icon: FileText },
  { href: '/tags', label: 'Tags', Icon: Tag },
  { href: '/bookmarks', label: 'Saved', Icon: Bookmark },
  { href: '/about', label: 'About', Icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  // Open search by dispatching the same Ctrl+K event that Search.tsx listens for
  const openSearch = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex w-full max-w-full overflow-hidden sm:hidden"
      style={{
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {links.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-100"
            style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
      <button
        onClick={openSearch}
        className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-100"
        style={{ color: 'var(--text-muted)' }}
      >
        <Search className="h-5 w-5" strokeWidth={1.5} />
        <span className="truncate">Search</span>
      </button>
    </nav>
  )
}
