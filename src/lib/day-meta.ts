// Day-of-week metadata matching the design (HPC Terminal variant)
// Colors pulled via CSS vars (--day-mon ... --day-sun) to respect theme.

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export const DAY_META: Record<DayKey, { label: string; short: string; colorVar: string }> = {
  mon: { label: 'CFD기법', short: 'MON', colorVar: 'var(--day-mon)' },
  tue: { label: '논문리뷰', short: 'TUE', colorVar: 'var(--day-tue)' },
  wed: { label: '시각화', short: 'WED', colorVar: 'var(--day-wed)' },
  thu: { label: '유체역학', short: 'THU', colorVar: 'var(--day-thu)' },
  fri: { label: '구현', short: 'FRI', colorVar: 'var(--day-fri)' },
  sat: { label: '고전문제', short: 'SAT', colorVar: 'var(--day-sat)' },
  sun: { label: '유동현상', short: 'SUN', colorVar: 'var(--day-sun)' },
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
