import type { Locale } from '@/lib/i18n'
import { titleFromSlug } from '@/lib/jsonld'

const SERIES_TITLES: Record<string, Record<Locale, string>> = {
  'numerical-methods': {
    ko: '수치 기법',
    en: 'Numerical Methods',
    ja: '数値手法',
    zh: '数值方法',
    es: 'Métodos numéricos',
  },
  'compressible-multiphase': {
    ko: '압축성 다상유동',
    en: 'Compressible Multiphase',
    ja: '圧縮性多相流',
    zh: '可压缩多相流',
    es: 'Flujo multifásico compresible',
  },
  'fem-dg': {
    ko: '유한요소와 DG',
    en: 'FEM and DG',
    ja: '有限要素と DG',
    zh: '有限元与 DG',
    es: 'FEM y DG',
  },
}

export function seriesTitle(slug: string, locale: Locale): string {
  return SERIES_TITLES[slug]?.[locale] ?? titleFromSlug(slug)
}
