import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'

export const printerService = {
  async printTickets(items: any[]) {
    try {
      // 1. Configuramos la impresora (sin interface porque no la va a mandar ella)
      const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: '\\\\127.0.0.1\\POSPrinter', // <--- ¡DEVOLVEMOS ESTA LÍNEA!
        characterSet: CharacterSet.PC850_MULTILINGUAL,
        removeSpecialCharacters: false,
        lineCharacter: '-',
        breakLine: BreakLine.WORD
      })

      // 2. Armamos todos los tickets en la memoria
      for (const item of items) {
        const productName = item.Product?.name || `Producto ID ${item.id_product}`

        printer.alignCenter()
        printer.setTextDoubleHeight()
        printer.setTextDoubleWidth()
        printer.println('Fortin')

        printer.setTextNormal()
        printer.drawLine()

        printer.setTextDoubleHeight()
        printer.println(`1x ${productName}`)

        printer.setTextNormal()
        printer.drawLine()

        printer.alignCenter()
        printer.println('Valido por un canje')

        printer.cut() // Agrega el comando de corte
      }

      // 3. En vez de ejecutar, extraemos el código crudo (buffer)
      const buffer = printer.getBuffer()

      // 4. Guardamos ese código en un archivo temporal de Windows
      const tempFilePath = path.join(os.tmpdir(), 'ticket_fortin.bin')
      fs.writeFileSync(tempFilePath, buffer)

      // 5. ¡El golpe de gracia! Usamos CMD de Windows para mandar el archivo por el "tubo"
      // El comando 'copy /b' copia archivos binarios directamente al puerto de red
      const command = `copy /b "${tempFilePath}" "\\\\127.0.0.1\\POSPrinter"`

      exec(command, (error) => {
        if (error) {
          console.error('Error al inyectar el ticket en Windows:', error)
        } else {
          console.log('¡Ticket enviado exitosamente a la ticketera!')
        }
      })

      // Limpiamos la memoria de la librería
      printer.clear()
      return true
    } catch (error) {
      console.error('Fallo al armar el ticket:', error)
      return false
    }
  }
}