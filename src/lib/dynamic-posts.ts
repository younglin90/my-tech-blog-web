export interface DynamicPost {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  content: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'tech-blog-dynamic-posts'
const ADMIN_KEY = 'tech-blog-admin-token'

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(ADMIN_KEY)
}

export function isAdmin(): boolean {
  return getAdminToken() === 'authenticated'
}

export async function adminLogin(password: string): Promise<boolean> {
  const storedHash = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH
  if (!storedHash) {
    console.warn('[Admin] NEXT_PUBLIC_ADMIN_PASSWORD_HASH is not set in .env.local')
    return false
  }
  const inputHash = await sha256(password)
  if (inputHash === storedHash) {
    sessionStorage.setItem(ADMIN_KEY, 'authenticated')
    return true
  }
  return false
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_KEY)
}

export function getAllDynamicPosts(): DynamicPost[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getDynamicPost(id: string): DynamicPost | null {
  return getAllDynamicPosts().find((p) => p.id === id) ?? null
}

export function saveDynamicPost(post: Omit<DynamicPost, 'id' | 'createdAt' | 'updatedAt'>): DynamicPost {
  const posts = getAllDynamicPosts()
  const newPost: DynamicPost = {
    ...post,
    id: `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  posts.push(newPost)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  return newPost
}

export function updateDynamicPost(id: string, updates: Partial<Omit<DynamicPost, 'id' | 'createdAt'>>): DynamicPost | null {
  const posts = getAllDynamicPosts()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) return null
  posts[idx] = { ...posts[idx], ...updates, updatedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  return posts[idx]
}

export function deleteDynamicPost(id: string): boolean {
  const posts = getAllDynamicPosts()
  const filtered = posts.filter((p) => p.id !== id)
  if (filtered.length === posts.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

export function exportPosts(): void {
  const posts = getAllDynamicPosts()
  const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dynamic-posts-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importPosts(json: string): { count: number; error?: string } {
  try {
    const posts = JSON.parse(json)
    if (!Array.isArray(posts)) return { count: 0, error: 'Invalid format: expected an array.' }
    const valid = posts.filter(
      (p): p is DynamicPost =>
        typeof p.id === 'string' &&
        typeof p.title === 'string' &&
        typeof p.content === 'string' &&
        typeof p.date === 'string',
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
    return { count: valid.length }
  } catch {
    return { count: 0, error: 'Failed to parse JSON file.' }
  }
}
