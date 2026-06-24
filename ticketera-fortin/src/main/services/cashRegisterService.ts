import Cash_register from '../model/cash_registers'
import { OpenRegisterInput, CloseRegisterInput } from '../model/interface/cashRegisterInputs'

export const cashRegisterService = {
  // Abrir caja
  async openRegister(data: OpenRegisterInput) {
    // Validar que no haya otra caja abierta
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
    const register = await Cash_register.findByPk(id)
    
    if (!register) throw new Error('Caja no encontrada.')
    if (register.status === 'closed') throw new Error('Esta caja ya se encuentra cerrada.')

    return await register.update({
      closing: data.closing,
      closed_at: new Date(),
      status: 'closed'
    })
  },

  // Obtener la caja que está actualmente abierta 
  async getCurrentRegister() {
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