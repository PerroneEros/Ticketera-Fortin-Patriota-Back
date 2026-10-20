import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const PRINTER_SHARE = '\\\\127.0.0.1\\POSPrinter'

// Arma en memoria un ticket por nombre recibido (uno por unidad vendida)
function buildTicketsBuffer(productNames: string[]): Buffer {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: PRINTER_SHARE,
    characterSet: CharacterSet.PC850_MULTILINGUAL,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    breakLine: BreakLine.WORD
  })

  for (const productName of productNames) {
    // --- ENCABEZADO ---
    printer.alignCenter()
    printer.bold(true)
    printer.setTextQuadArea() // Texto gigante (doble alto y doble ancho a la vez)
    printer.println('FORTIN')
    printer.bold(false)
    printer.setTextNormal()
    printer.drawLine()

    // --- PRODUCTO ---
    printer.newLine()
    printer.alignCenter()
    printer.bold(true)
    printer.setTextSize(3, 3)

    // "corona porron" se imprime como "1x corona" y abajo "porron"
    const palabras = productName.split(' ')
    printer.println(`1x ${palabras[0]}`)
    for (let i = 1; i < palabras.length; i++) {
      printer.println(palabras[i])
    }

    printer.bold(false)
    printer.setTextNormal()
    printer.newLine()
    printer.drawLine()

    // --- PIE DE TICKET ---
    printer.alignCenter()
    printer.newLine()
    printer.cut()
  }
  return printer.getBuffer()
}

export const printerService = {
  async printTickets(productNames: string[]): Promise<void> {
    // Un archivo por trabajo: dos ventas seguidas no pueden pisarse los tickets
    const tempFilePath = path.join(os.tmpdir(), `ticket_fortin_${randomUUID()}.bin`)
    await fs.writeFile(tempFilePath, buildTicketsBuffer(productNames))
    try {
      // 'copy /b' manda el binario crudo a la cola compartida de la ticketera
      await execFileAsync('cmd.exe', ['/c', 'copy', '/b', tempFilePath, PRINTER_SHARE])
    } finally {
      await fs.unlink(tempFilePath).catch(() => undefined)
    }
  }
}
