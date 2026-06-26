import Cash_register from '../model/cash_registers'
import { OpenRegisterInput, CloseRegisterInput } from '../model/interface/cashRegisterInputs'

export const cashRegisterService = {
  // Abrir caja
  async openRegister(data: OpenRegisterInput) {
    // Validar que no haya otra caja abierta
    // validar monto de paertura, que sea mayor a 0 y sea un numero. (Solo se ingresaria en efectivo)
    const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })
    if (activeRegister) {
      throw new Error('Ya existe una caja abierta actualmente. Debes cerrarla antes de abrir una nueva.')
    }

    return await Cash_register.create({
      opening: data.opening,
      closing: 0,
      opened_at: new Date(),
      status: 'open'
    } as any)
  },

  // Cerrar caja
  async closeRegister(id: string, data: CloseRegisterInput) { 
    // deberia validar los importes, no se si en ambos metodos de pago o se validaria todo junto.
    /* Tenemos que ver como hacemos lo del resumen, tendria que ser desde la hora de apertura hasta la hora de cierre
        Porque si el dia anterior se cerro la caja despues de las 12 de la noche no deberia aparecer esa info en el resumen*/  
    const register = await Cash_register.findByPk(id)
    
    if (!register) throw new Error('Caja no encontrada.')// Esto esta bien??
    if (register.status === 'closed') throw new Error('Esta caja ya se encuentra cerrada.')

    return await register.update({
      closing: data.closing,
      closed_at: new Date(),
      status: 'closed'
    })
  },

  // Obtener la caja que está actualmente abierta 
  async getCurrentRegister() {
    //Es necesario saber la caja que esta abierta?
    return await Cash_register.findOne({ where: { status: 'open' } })
  },

  // Obtener el historial de todas las cajas 
  async getAllRegisters() {
    return await Cash_register.findAll({
      order: [['opened_at', 'DESC']]
    })
  },

  // Obtener una caja específica por su ID
  async getRegisterById(id: string) {
    const register = await Cash_register.findByPk(id)
    if (!register) throw new Error('Caja no encontrada.')
    return register
  }
}
