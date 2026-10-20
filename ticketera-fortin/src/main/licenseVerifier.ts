import { createPublicKey, verify } from 'crypto'

// A license key is the base64url Ed25519 signature of the machine id, made with the team's
// private key. The app only holds the public key, so it can verify keys but never create them.
export function createLicenseVerifier(publicKeyPem: string, machineId: string) {
  const publicKey = createPublicKey(publicKeyPem)
  return (key: string): boolean => {
    if (!key) return false
    try {
      return verify(null, Buffer.from(machineId), publicKey, Buffer.from(key, 'base64url'))
    } catch {
      return false
    }
  }
}
