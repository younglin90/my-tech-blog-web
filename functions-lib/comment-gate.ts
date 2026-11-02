// 댓글용 사람 확인. 정답은 D1에만 있고 응답 JSON·HTML에는 없다.
// 그림은 워커에서 PNG로 그려 보낸다. 텍스트 봇은 글자를 읽을 수 없다.
import type { D1Database } from './guard'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LEN = 5
const TTL_MS = 10 * 60 * 1000
const MIN_MS = 1200

// 5×7, 왼쪽이 상위 비트. 0/O/1/I 는 빼서 사람이 헷갈리지 않게 한다.
const FONT: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01111, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b01111],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b10010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b10001, 0b01110],
  '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
}

function randInt(n: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % n
}

export function randomNonce(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomCode(): string {
  let s = ''
  for (let i = 0; i < CODE_LEN; i++) s += ALPHABET[randInt(ALPHABET.length)]
  return s
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toUpperCase().replace(/\s+/g, '')
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

async function encodePng(w: number, h: number, rgba: Uint8Array): Promise<Uint8Array> {
  const stride = w * 4
  const raw = new Uint8Array((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
  }
  const stream = new CompressionStream('deflate')
  const writer = stream.writable.getWriter()
  await writer.write(raw)
  await writer.close()
  const zipped = new Uint8Array(await new Response(stream.readable).arrayBuffer())
  const ihdr = new Uint8Array(13)
  const view = new DataView(ihdr.buffer)
  view.setUint32(0, w)
  view.setUint32(4, h)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const parts = [sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', zipped), pngChunk('IEND', new Uint8Array())]
  const total = parts.reduce((n, p) => n + p.length, 0)
  const png = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    png.set(p, off)
    off += p.length
  }
  return png
}

function setPx(rgba: Uint8Array, w: number, h: number, x: number, y: number, rgb: [number, number, number]) {
  if (x < 0 || y < 0 || x >= w || y >= h) return
  const i = (y * w + x) * 4
  rgba[i] = rgb[0]
  rgba[i + 1] = rgb[1]
  rgba[i + 2] = rgb[2]
  rgba[i + 3] = 255
}

export async function renderCodePng(code: string): Promise<string> {
  const scale = 4
  const cw = 5 * scale
  const ch = 7 * scale
  const gap = 8
  const padX = 14
  const padY = 12
  const w = padX * 2 + code.length * cw + (code.length - 1) * gap
  const h = padY * 2 + ch
  const rgba = new Uint8Array(w * h * 4)
  const paper: [number, number, number] = [244, 239, 230]
  const ink: [number, number, number] = [28, 25, 23]
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = paper[0]
    rgba[i + 1] = paper[1]
    rgba[i + 2] = paper[2]
    rgba[i + 3] = 255
  }
  for (let n = 0; n < code.length; n++) {
    const glyph = FONT[code[n]]
    if (!glyph) continue
    const ox = padX + n * (cw + gap) + randInt(3) - 1
    const oy = padY + randInt(3) - 1
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (((glyph[gy] >> (4 - gx)) & 1) === 0) continue
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) setPx(rgba, w, h, ox + gx * scale + sx, oy + gy * scale + sy, ink)
        }
      }
    }
  }
  for (let line = 0; line < 2; line++) {
    let x = randInt(12)
    let y = padY + randInt(ch)
    const slope = (randInt(5) - 2) * 0.15
    const gray: [number, number, number] = [120, 106, 90]
    while (x < w) {
      setPx(rgba, w, h, x, y, gray)
      x += 1
      y += slope
    }
  }
  for (let i = 0; i < Math.floor(w * h * 0.04); i++) {
    const shade = 180 + randInt(50)
    setPx(rgba, w, h, randInt(w), randInt(h), [shade, shade - 8, shade - 16])
  }
  const png = await encodePng(w, h, rgba)
  let binary = ''
  for (let i = 0; i < png.length; i++) binary += String.fromCharCode(png[i])
  return `data:image/png;base64,${btoa(binary)}`
}

type ChallengeRow = { code: string; iat: number; exp: number }

export async function issueChallenge(db: D1Database): Promise<{ nonce: string; image: string }> {
  const nonce = randomNonce()
  const code = randomCode()
  const iat = Date.now()
  const exp = iat + TTL_MS
  await db.prepare('INSERT INTO comment_challenge (nonce, code, iat, exp) VALUES (?, ?, ?, ?)').bind(nonce, code, iat, exp).run()
  if (randInt(8) === 0) await db.prepare('DELETE FROM comment_challenge WHERE exp < ?').bind(iat).run()
  return { nonce, image: await renderCodePng(code) }
}

// 한 번 쓰면 지운다. 틀린 답도 다시 쓸 수 없다.
export async function consumeChallenge(db: D1Database, nonce: string, answer: string): Promise<'ok' | 'bad'> {
  if (!/^[a-f0-9]{32}$/.test(nonce)) return 'bad'
  const now = Date.now()
  const { results } = await db
    .prepare('DELETE FROM comment_challenge WHERE nonce = ? RETURNING code, iat, exp')
    .bind(nonce)
    .all<ChallengeRow>()
  const row = results[0]
  if (!row || row.exp < now || now - row.iat < MIN_MS) return 'bad'
  return normalizeAnswer(answer) === row.code ? 'ok' : 'bad'
}
