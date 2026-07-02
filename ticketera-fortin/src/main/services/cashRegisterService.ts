import Cash_register from '../model/cash_registers'
import { OpenRegisterInput, CloseRegisterInput } from '../model/interface/cashRegisterInputs'

export const cashRegisterService = {
  
  // Función para iniciar un nuevo turno
  async openRegister(data: OpenRegisterInput) {
    // REGLA DE NEGOCIO: No pueden existir dos cajas abiertas al mismo tiempo.
    const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })
    if (activeRegister) {
      throw new Error('Ya existe una caja abierta actualmente. Debes cerrarla antes de abrir una nueva.')
    }

    // Si no hay ninguna abierta, creamos el nuevo turno.
    return await Cash_register.create({
      opening: data.opening, // Plata inicial ingresada por el usuario
      closing: 0,            // Aún no hay cierre, arranca en 0
      opened_at: new Date(), // Hora actual del servidor
      status: 'open'
    } as any)
  },

  // Función para terminar el turno actual
  async closeRegister(id: string, data: CloseRegisterInput) { 
    const register = await Cash_register.findByPk(id)
    
    if (!register) throw new Error('Caja no encontrada.')
    if (register.status === 'closed') throw new Error('Esta caja ya se encuentra cerrada.')

    // Actualizamos el registro existente marcándolo como cerrado
    return await register.update({
      closing: data.closing, // El total de plata contada que mandó el frontend
      closed_at: new Date(), // Hora exacta del cierre
      status: 'closed'
    })
  },

  async getCurrentRegister() {
    return await Cash_register.findOne({ where: { status: 'open' } })
  },

  // Trae todo el historial ordenado por fecha de apertura (el más nuevo primero)
  async getAllRegisters() {
    return await Cash_register.findAll({
      order: [['opened_at', 'DESC']]
    })
  },

  // Busca una caja específica por su ID (Para los reportes)
  async getRegisterById(id: string) {
    const register = await Cash_register.findByPk(id)
    if (!register) throw new Error('Caja no encontrada.')
    return register
  }
}