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
        const productName = item.Product?.name
        // --- ENCABEZADO ---
        printer.alignCenter()
        printer.bold(true) // Activamos la negrita
        printer.setTextQuadArea() // Texto gigante (doble alto y doble ancho a la vez)
        printer.println('FORTIN')

        printer.bold(false) // Apagamos la negrita
        printer.setTextNormal() // Reseteamos el tamaño a normal
        printer.drawLine()

        // --- PRODUCTO ---
        printer.newLine() // Dejamos un renglón en blanco para que respire
        printer.alignCenter()
        printer.bold(true)

        // Hacemos que el nombre del producto destaque muchísimo
        printer.setTextSize(3,3) 

        // Cortamos el nombre por cada espacio en blanco
        // "corona porron" se transforma en una lista: ['corona', 'porron']
        const palabras = productName.split(' ')

        // Imprimimos el "1x" pegado a la primera palabra (Ej: "1x corona")
        if (palabras.length > 0) {
          printer.println(`1x ${palabras[0]}`)
        }

        // Si el producto tiene más palabras (Ej: "porron"), las manda abajo
        for (let i = 1; i < palabras.length; i++) {
          printer.println(palabras[i])
        }

        printer.bold(false)
        printer.setTextNormal()
        printer.newLine() // Otro renglón en blanco abajo
        printer.drawLine()

        // --- PIE DE TICKET ---
        printer.alignCenter()
        printer.newLine()

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