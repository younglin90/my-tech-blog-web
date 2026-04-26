'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import postIndex from '@/lib/post-index.json'

// MarkdownPreview: 미리보기 시점에만 로드 (initial admin 청크에서 KaTeX 300KB+ 제외).
const MarkdownPreview = dynamic(() => import('@/components/admin/MarkdownPreview'), {
  ssr: false,
  loading: () => <div className="text-sm" style={{ color: 'var(--text-muted)' }}>preview loading…</div>,
})
import Link from 'next/link'
import {
  type DynamicPost,
  getAllDynamicPosts,
  getDynamicPost,
  saveDynamicPost,
  updateDynamicPost,
  deleteDynamicPost,
  isAdmin,
  adminLogin,
  adminLogout,
  exportPosts,
  importPosts,
} from '@/lib/dynamic-posts'
import { format, parseISO } from 'date-fns'

type View = 'login' | 'dashboard' | 'write' | 'edit' | 'view'

interface AdminPost {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  url: string
  type: 'static' | 'dynamic'
}

export default function AdminPage() {
  const [view, setView] = useState<View>('login')
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPost[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)

  // Editor state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [importMsg, setImportMsg] = useState('')

  // Static posts from lightweight post-index (admin 페이지 번들 19MB → ~200KB 로 축소)
  const staticPosts: AdminPost[] = (postIndex.items as Array<{
    slug: string; locale: string; title: string; date: string;
    description: string; tags?: string[]; url: string; draft?: boolean;
  }>)
    .filter((p) => !p.draft && p.locale === 'ko')
    .map((p) => ({
      id: p.slug,
      title: p.title,
      date: p.date,
      description: p.description,
      tags: p.tags ?? [],
      url: p.url,
      type: 'static' as const,
    }))

  useEffect(() => {
    if (isAdmin()) {
      setAuthed(true)
      setView('dashboard')
      setDynamicPosts(getAllDynamicPosts())
    }
  }, [])

  const handleLogin = async () => {
    const ok = await adminLogin(password)
    if (ok) {
      setAuthed(true)
      setView('dashboard')
      setDynamicPosts(getAllDynamicPosts())
      setLoginError(false)
    } else {
      setLoginError(true)
    }
  }

  const handleLogout = () => {
    adminLogout()
    setAuthed(false)
    setView('login')
    setPassword('')
  }

  const refreshPosts = useCallback(() => {
    setDynamicPosts(getAllDynamicPosts())
  }, [])

  const resetEditor = useCallback(() => {
    setTitle('')
    setDescription('')
    setTags('')
    setContent('')
    setShowPreview(false)
    setEditId(null)
    setSaveMsg('')
  }, [])

  const goWrite = () => {
    resetEditor()
    setView('write')
  }

  const goEdit = (id: string) => {
    const post = getDynamicPost(id)
    if (!post) return
    setEditId(id)
    setTitle(post.title)
    setDescription(post.description)
    setTags(post.tags.join(', '))
    setContent(post.content)
    setShowPreview(false)
    setSaveMsg('')
    setView('edit')
  }

  const goView = (id: string) => {
    setViewId(id)
    setView('view')
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      setSaveMsg('Title and content are required.')
      return
    }
    const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const postData = {
      title: title.trim(),
      date: new Date().toISOString(),
      description: description.trim(),
      tags: tagArr,
      content: content,
    }

    if (view === 'edit' && editId) {
      updateDynamicPost(editId, postData)
      setSaveMsg('Post updated.')
    } else {
      saveDynamicPost(postData)
      setSaveMsg('Post published.')
    }
    refreshPosts()
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    deleteDynamicPost(id)
    refreshPosts()
    if (view === 'view' || view === 'edit') setView('dashboard')
  }

  // ── LOGIN ──
  if (view === 'login') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm">
          <h1 className="mb-6 text-2xl font-bold">Admin Login</h1>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              autoFocus
            />
            {loginError && (
              <p className="text-sm text-red-500">Incorrect password.</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── VIEW DYNAMIC POST ──
  if (view === 'view' && viewId) {
    const post = getDynamicPost(viewId)
    if (!post) return <div>Post not found.</div>
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">&larr; Dashboard</button>
          <button onClick={() => goEdit(viewId)} className="rounded bg-zinc-100 px-3 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">Edit</button>
          <button onClick={() => handleDelete(viewId)} className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900">Delete</button>
        </div>
        <article className="py-4">
          <div className="mb-8 text-center">
            <time className="text-sm text-zinc-500">{format(new Date(post.date), 'LLLL d, yyyy')}</time>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h1>
            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <MarkdownPreview>{post.content}</MarkdownPreview>
          </div>
        </article>
      </div>
    )
  }

  // ── EDITOR (write / edit) ──
  if (view === 'write' || view === 'edit') {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => { resetEditor(); setView('dashboard'); }} className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
            &larr; Dashboard
          </button>
          <h1 className="text-lg font-bold">{view === 'edit' ? 'Edit Post' : 'New Post'}</h1>
          <div className="w-20" />
        </div>

        <div className="space-y-4">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-lg font-semibold focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            placeholder="Description (short summary)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            placeholder="Tags (comma separated: CFD, Multiphase, ...)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />

          <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${!showPreview ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100' : 'text-zinc-400'}`}
            >
              Markdown
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${showPreview ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100' : 'text-zinc-400'}`}
            >
              Preview
            </button>
          </div>

          {!showPreview ? (
            <textarea
              placeholder="Write your post in Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[50vh] w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-3 font-mono text-sm leading-relaxed focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          ) : (
            <div className="min-h-[50vh] rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              {content.trim() ? (
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <MarkdownPreview>{content}</MarkdownPreview>
                </div>
              ) : (
                <p className="text-zinc-400">Nothing to preview yet.</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {view === 'edit' ? 'Update' : 'Publish'}
            </button>
            <button
              onClick={() => { resetEditor(); setView('dashboard'); }}
              className="rounded-md border border-zinc-300 px-6 py-2.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            {saveMsg && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">{saveMsg}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── DASHBOARD ──
  // Merge static + dynamic posts
  const dynamicItems: AdminPost[] = dynamicPosts.map((p) => ({
    id: p.id,
    title: p.title,
    date: p.date,
    description: p.description,
    tags: p.tags,
    url: `/read?id=${p.id}`,
    type: 'dynamic' as const,
  }))

  const allItems = [...staticPosts, ...dynamicItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={goWrite}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + New Post
          </button>
          <button
            onClick={() => exportPosts()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            title="Download all dynamic posts as JSON"
          >
            Export JSON
          </button>
          <label
            className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            title="Restore posts from a previously exported JSON file"
          >
            Import JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  const result = importPosts(ev.target?.result as string)
                  if (result.error) {
                    setImportMsg(`Import failed: ${result.error}`)
                  } else {
                    setImportMsg(`Imported ${result.count} post(s).`)
                    refreshPosts()
                  }
                  setTimeout(() => setImportMsg(''), 4000)
                }
                reader.readAsText(file)
                e.target.value = ''
              }}
            />
          </label>
          <button
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Logout
          </button>
        </div>
      </div>
      {importMsg && (
        <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{importMsg}</p>
      )}

      <div className="mb-4 text-xs text-zinc-400">
        Total {allItems.length} posts ({staticPosts.length} static + {dynamicItems.length} dynamic)
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {allItems.map((post) => (
          <div key={post.id} className="flex items-start justify-between gap-4 py-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {post.type === 'static' ? (
                  <Link href={post.url} className="text-lg font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400">
                    {post.title}
                  </Link>
                ) : (
                  <button onClick={() => goView(post.id)} className="text-left text-lg font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400">
                    {post.title}
                  </button>
                )}
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  post.type === 'static'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                }`}>
                  {post.type === 'static' ? 'MDX' : 'Dynamic'}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                <time>{format(new Date(post.date), 'yyyy-MM-dd')}</time>
                {post.tags.length > 0 && (
                  <>
                    <span>&middot;</span>
                    <span>{post.tags.join(', ')}</span>
                  </>
                )}
              </div>
              {post.description && (
                <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{post.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {post.type === 'static' ? (
                <Link
                  href={post.url}
                  className="rounded px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  View
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => goEdit(post.id)}
                    className="rounded px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="rounded px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
