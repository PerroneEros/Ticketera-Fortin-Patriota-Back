// Creates the license key pair ONCE. Run it outside the repo:
//   node tools/license/keygen.mjs C:\ruta\segura
// Keep private.pem off the repo and off shared folders: whoever has it can issue licenses.
import { generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const targetDir = process.argv[2]
if (!targetDir) {
  console.error('Uso: node tools/license/keygen.mjs <carpeta-destino>')
  process.exit(1)
}

const privatePath = join(targetDir, 'private.pem')
if (existsSync(privatePath)) {
  console.error(
    `Ya existe ${privatePath}. No se sobrescribe: las licencias emitidas dejarían de valer.`
  )
  process.exit(1)
}

mkdirSync(targetDir, { recursive: true })
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 })
const publicPem = publicKey.export({ type: 'spki', format: 'pem' })
writeFileSync(join(targetDir, 'public.pem'), publicPem)

console.log('Listo. Copiá esta clave pública en src/main/licensePublicKey.ts:\n')
console.log(publicPem)
