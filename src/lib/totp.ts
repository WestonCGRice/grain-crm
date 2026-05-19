import crypto from 'crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buf: Buffer): string {
  let result = ''
  let bits = 0
  let value = 0
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) result += ALPHABET[(value << (5 - bits)) & 31]
  return result
}

function base32Decode(encoded: string): Buffer {
  const bytes: number[] = []
  let bits = 0
  let value = 0
  for (const char of encoded.toUpperCase().replace(/=+$/, '')) {
    const idx = ALPHABET.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8)
  buf.writeBigInt64BE(BigInt(counter))
  const digest = crypto.createHmac('sha1', secret).update(buf).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  return String(code % 1_000_000).padStart(6, '0')
}

export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20))
}

export function keyuri(account: string, issuer: string, secret: string): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params}`
}

export function verifyTOTP(token: string, secret: string): boolean {
  const key = base32Decode(secret)
  const counter = Math.floor(Date.now() / 1000 / 30)
  const clean = token.replace(/\s/g, '')
  for (const step of [0, -1, 1]) {
    if (hotp(key, counter + step) === clean) return true
  }
  return false
}
