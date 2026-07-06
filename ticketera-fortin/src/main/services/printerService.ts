import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer'

export const printerService = {
  async printTickets(items: any[]) {
    try {
      const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON, // EPSON es el estándar para el 90% de las ticketeras chinas y de marca
        interface: '\\\\localhost\\POSPrinterPOS80', // ¡IMPORTANTE! Acá debes poner el nombre exacto de la impresora en Windows
        characterSet: CharacterSet.PC850_MULTILINGUAL, // Para que salgan bien los acentos
        removeSpecialCharacters: false,
        lineCharacter: '-',
        breakLine: BreakLine.WORD,
        options: {
          timeout: 5000
        }
      })

      const isConnected = await printer.isPrinterConnected()
      if (!isConnected) {
        console.error('La impresora no está conectada o no se encuentra.')
        return false
      }

      // 2. Iteramos sobre los items para generar 1 ticket físico por unidad
      for (const item of items) {
        // Obtenemos el nombre del producto de tu base de datos o lo pasas armado
        const productName = item.Product?.name || `Producto ID ${item.id_product}`

        printer.alignCenter()
        printer.setTextDoubleHeight()
        printer.setTextDoubleWidth()
        printer.println('Fortin') // Nombre del local

        printer.setTextNormal()
        printer.drawLine()

        printer.setTextDoubleHeight()
        printer.println(`1x ${productName}`) // Producto

        printer.setTextNormal()
        printer.drawLine()

        printer.alignCenter()
        printer.println('Valido por un canje')

        printer.cut() // Corta el papel después de cada ticket
      }

      // 3. Enviamos todos los comandos acumulados a la impresora física
      await printer.execute()
      printer.clear() // Limpiamos la memoria
      return true
    } catch (error) {
      console.error('Fallo al imprimir:', error)
      return false
    }
  }
}
