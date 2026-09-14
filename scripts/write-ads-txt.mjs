#!/usr/bin/env node
/**
 * scripts/write-ads-txt.mjs — AdSense가 요구하는 out/ads.txt 생성.
 *
 * ads.txt가 도메인 루트에 없으면 AdSense가 "수익 손실 위험" 경고를 띄우고
 * 일부 입찰이 차단된다. public/에 정적 파일로 두면 퍼블리셔 ID가 저장소에
 * 박히므로, 빌드 시점에 환경변수에서 만들어 out/에만 떨군다.
 *
 * NEXT_PUBLIC_ADSENSE_CLIENT 가 없으면 아무것도 하지 않는다.
 */
import { writeFileSync, existsSync } from 'node:fs'

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ''
if (!client) {
  console.log('ads.txt: NEXT_PUBLIC_ADSENSE_CLIENT 없음 — 건너뜀')
  process.exit(0)
}
if (!existsSync('out')) {
  console.error('ads.txt: out/ 디렉터리가 없다. next build 이후에 실행할 것')
  process.exit(1)
}

// ca-pub-1234... → pub-1234...  (ads.txt는 ca- 접두사를 쓰지 않는다)
const pub = client.replace(/^ca-/, '')
if (!/^pub-\d+$/.test(pub)) {
  console.error(`ads.txt: 퍼블리셔 ID 형식이 이상하다: ${client}`)
  process.exit(1)
}

writeFileSync('out/ads.txt', `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`)
console.log(`✅ ads.txt: google.com, ${pub}, DIRECT`)
