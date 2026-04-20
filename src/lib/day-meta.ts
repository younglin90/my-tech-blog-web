// Day-of-week metadata matching the design (HPC Terminal variant)
// Colors pulled via CSS vars (--day-mon ... --day-sun) to respect theme.

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

// 주제 분류 (3 그룹):
//   월/수/금 → CFD 기법 + 알고리즘 구현
//   화/목   → 유체역학 이론 + 흥미로운 유동 현상
//   토/일   → CFD 논문 리뷰 + 구현 재현
// 모든 요일은 가능한 한 인터랙티브 시각화를 활용한다.
export const DAY_META: Record<DayKey, { label: string; short: string; colorVar: string }> = {
  mon: { label: 'CFD기법', short: 'MON', colorVar: 'var(--day-mon)' },
  tue: { label: '유체역학', short: 'TUE', colorVar: 'var(--day-tue)' },
  wed: { label: 'CFD기법', short: 'WED', colorVar: 'var(--day-wed)' },
  thu: { label: '유체역학', short: 'THU', colorVar: 'var(--day-thu)' },
  fri: { label: 'CFD기법', short: 'FRI', colorVar: 'var(--day-fri)' },
  sat: { label: '논문리뷰', short: 'SAT', colorVar: 'var(--day-sat)' },
  sun: { label: '논문리뷰', short: 'SUN', colorVar: 'var(--day-sun)' },
}

const ORDER: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function dayFromDate(iso: string): DayKey {
  // iso: YYYY-MM-DD (may include a timestamp) — parse as local midnight to avoid tz drift
  const datePart = iso.slice(0, 10)
  const d = new Date(datePart + 'T00:00:00')
  const dow = d.getDay()
  return ORDER[dow] ?? 'mon'
}

export function dayMeta(iso: string) {
  return DAY_META[dayFromDate(iso)] ?? DAY_META.mon
}
