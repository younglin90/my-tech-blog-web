'use client'

import { useEffect, useState } from 'react'

/**
 * URL query param에 state를 동기화하는 경량 훅.
 * 페이지 로드 시 ?key=value 가 있으면 초기값 대신 사용.
 * 변경 시 URL을 history.replaceState로 갱신 (페이지 리로드 없음).
 *
 * 사용:
 *   const [re, setRe] = useUrlParam('re', 100, 'number')
 *   <input value={re} onChange={(e) => setRe(Number(e.target.value))} />
 *
 * 사용자가 URL 복사하면 그 설정이 그대로 재현됨.
 */
type ParamType = 'number' | 'string'

export function useUrlParam<T = number | string>(
  key: string,
  defaultValue: T,
  type: ParamType = 'number',
): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  // 첫 마운트 시 URL에서 읽기
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const raw = params.get(key)
    if (raw === null) return
    if (type === 'number') {
      const n = Number(raw)
      if (!Number.isNaN(n)) setValue(n as T)
    } else {
      setValue(raw as T)
    }
  }, [key, type])

  // value 변경 시 URL 갱신 (debounced via rAF)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (value === defaultValue) {
      params.delete(key)
    } else {
      params.set(key, String(value))
    }
    const search = params.toString()
    const newUrl = window.location.pathname + (search ? `?${search}` : '') + window.location.hash
    if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, '', newUrl)
    }
  }, [key, value, defaultValue])

  return [value, setValue]
}
