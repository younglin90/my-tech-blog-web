#!/usr/bin/env node
/**
 * scripts/write-ads-txt.mjs — AdSense가 요구하는 out/ads.txt 생성.
 *
 * ads.txt가 도메인 루트에 없으면 AdSense가 "수익 손실 위험" 경고를 띄우고
 * 일부 입찰이 차단된다. 게시자 ID는 광고 코드와 ads.txt에 공개되는 값이므로
 * 소유자 계정을 기본값으로 두고, 필요할 때 환경변수로 오버라이드한다.
 *
 * NEXT_PUBLIC_ADSENSE_CLIENT 가 없으면 현재 소유자의 게시자 ID를 사용한다.
 */
import { writeFileSync, existsSync } from 'node:fs'

const client =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-8224726790382223'
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
