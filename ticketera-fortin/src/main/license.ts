import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { machineIdSync } from 'node-machine-id'
import { createLicenseVerifier } from './licenseVerifier'
import { LICENSE_PUBLIC_KEY } from './licensePublicKey'

const licensePath = (): string => join(app.getPath('userData'), 'licencia.json')
const currentMachineId = machineIdSync()

function buildVerifier(): (key: string) => boolean {
  try {
    return createLicenseVerifier(LICENSE_PUBLIC_KEY, currentMachineId)
  } catch (error) {
    // Fail closed: without a valid public key no license can be accepted.
    console.error('Clave pública de licencias inválida o no configurada:', error)
    return () => false
  }
}

const isValidLicenseKey = buildVerifier()

export function checkLicense(): { isLicensed: boolean; machineId: string } {
  let savedKey = ''
  if (existsSync(licensePath())) {
    try {
      savedKey = JSON.parse(readFileSync(licensePath(), 'utf8')).clave ?? ''
    } catch {
      savedKey = ''
    }
  }
  return { isLicensed: isValidLicenseKey(savedKey), machineId: currentMachineId }
}

export function activateLicense(key: string): boolean {
  const cleanKey = key.trim()
  if (!isValidLicenseKey(cleanKey)) return false
  writeFileSync(licensePath(), JSON.stringify({ clave: cleanKey }))
  return true
}
