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

// /admin 접근은 functions/_middleware.ts 의 Basic Auth가 막는다.
// 페이지가 열렸다면 이미 인증된 것이므로 클라이언트 쪽 비밀번호 검사는 두지 않는다.
// (예전 NEXT_PUBLIC_ADMIN_PASSWORD_HASH는 번들에 그대로 실려 오프라인 대입으로 풀 수 있었다.)
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(ADMIN_KEY)
}

export function isAdmin(): boolean {
  return typeof window !== 'undefined'
}

export async function adminLogin(_password: string): Promise<boolean> {
  sessionStorage.setItem(ADMIN_KEY, 'authenticated')
  return true
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
