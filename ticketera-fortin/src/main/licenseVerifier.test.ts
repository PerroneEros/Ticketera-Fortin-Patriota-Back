import { generateKeyPairSync, sign } from 'crypto'
import { describe, expect, it } from 'vitest'
import { createLicenseVerifier } from './licenseVerifier'

const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
const issueKey = (machineId: string): string =>
  sign(null, Buffer.from(machineId), privateKey).toString('base64url')

describe('createLicenseVerifier', () => {
  const isValid = createLicenseVerifier(publicKeyPem, 'machine-A')

  it('accepts a key signed for this machine', () => {
    expect(isValid(issueKey('machine-A'))).toBe(true)
  })

  it('rejects a key signed for another machine', () => {
    expect(isValid(issueKey('machine-B'))).toBe(false)
  })

  it('rejects a key signed with another private key', () => {
    const other = generateKeyPairSync('ed25519').privateKey
    expect(isValid(sign(null, Buffer.from('machine-A'), other).toString('base64url'))).toBe(false)
  })

  it.each(['', 'ABCDEF0123456789', 'not base64 at all !!!'])(
    'rejects the malformed key %j',
    (key) => {
      expect(isValid(key)).toBe(false)
    }
  )

  it('rejects a valid key that was upper-cased', () => {
    expect(isValid(issueKey('machine-A').toUpperCase())).toBe(false)
  })
})
