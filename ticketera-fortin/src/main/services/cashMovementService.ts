import Cash_movements from '../model/cash_movements'
import Cash_register from '../model/cash_registers'
import { CreateMovementInput } from '../schemas/cashMovementSchema'

export const cashMovementService = {
  async createMovement(data: CreateMovementInput) {
    const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })
    if (!activeRegister) {
      throw new Error('No hay ninguna caja abierta para registrar este movimiento.')
    }

    return await Cash_movements.create({
      ...data,
      cash_register_id: activeRegister.cash_register_id,
      date: new Date()
    })
  }
}
