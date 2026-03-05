'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { allPosts } from 'contentlayer/generated'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Search() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const filteredPosts = allPosts
    .filter((post) => !post.draft)
    .filter((post) => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.description.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5)

  const onSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium sm:inline dark:bg-zinc-800">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] sm:pt-[20vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-zinc-100/10"
            >
              <div className="flex items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
                <SearchIcon className="h-5 w-5 text-zinc-400" />
                <input
                  autoFocus
                  placeholder="Search posts..."
                  className="h-12 w-full border-none bg-transparent px-4 text-zinc-900 focus:outline-none focus:ring-0 dark:text-zinc-100"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <button
                      key={post.slug}
                      onClick={() => onSelect(post.url)}
                      className="flex w-full flex-col rounded-lg px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {post.title}
                      </span>
                      <span className="text-sm text-zinc-500 line-clamp-1">
                        {post.description}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-12 text-center text-zinc-500">
                    No posts found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
