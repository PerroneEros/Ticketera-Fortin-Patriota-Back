// Issues the activation key for one PC:
//   node tools/license/generate-license.mjs C:\ruta\segura\private.pem <codigo-de-equipo>
import { createPrivateKey, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'

const [privateKeyPath, machineId] = process.argv.slice(2)
if (!privateKeyPath || !machineId) {
  console.error('Uso: node tools/license/generate-license.mjs <private.pem> <codigo-de-equipo>')
  process.exit(1)
}

const privateKey = createPrivateKey(readFileSync(privateKeyPath))
console.log(sign(null, Buffer.from(machineId.trim()), privateKey).toString('base64url'))
