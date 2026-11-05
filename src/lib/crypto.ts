import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * AES-256-GCM encryption for secrets stored in the database (the WhatsApp aggregator API key).
 * The key is WHATSAPP_ENC_KEY: 32 bytes as 64 hex characters. Output: `v1:<iv>:<tag>:<data>` (base64).
 */
const VERSION = 'v1'

function keyFrom(hex: string | undefined): Buffer {
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('WHATSAPP_ENC_KEY must be set to 64 hex characters (32 bytes).')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptSecret(plain: string, hexKey = process.env.WHATSAPP_ENC_KEY): string {
  const key = keyFrom(hexKey)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':')
}

export function decryptSecret(payload: string, hexKey = process.env.WHATSAPP_ENC_KEY): string {
  const [version, iv, tag, data] = payload.split(':')
  if (version !== VERSION || !iv || !tag || !data) throw new Error('Unrecognised secret format.')
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(hexKey), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
    'utf8',
  )
}

export function isEncryptedSecret(value: unknown): boolean {
  return (
    typeof value === 'string' && value.startsWith(`${VERSION}:`) && value.split(':').length === 4
  )
}
