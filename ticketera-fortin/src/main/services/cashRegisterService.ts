import { Op } from 'sequelize' // <-- Necesitamos importar Op
import Cash_register from '../model/cash_registers'
import Sales from '../model/sales'
import Cash_movements from '../model/cash_movements'
import { OpenRegisterInput, CloseRegisterInput } from '../model/interface/cashRegisterInputs'

export const cashRegisterService = {
  async openRegister(data: OpenRegisterInput) {
    const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })
    if (activeRegister) {
      throw new Error('Ya existe una caja abierta actualmente.')
    }
    return await Cash_register.create({
      opening: data.opening,
      closing: 0,
      opened_at: new Date(),
      status: 'open'
    } as any)
  },

  async closeRegister(id: string, data: CloseRegisterInput) { 
    const register = await Cash_register.findByPk(id)
    if (!register) throw new Error('Caja no encontrada.')
    if (register.status === 'closed') throw new Error('Esta caja ya está cerrada.')
    return await register.update({
      closing: data.closing,
      closed_at: new Date(),
      status: 'closed'
    })
  },

  async getTurnTotals(cash_register_id: string) {
    const sales = await Sales.findAll({ where: { cash_register_id } })
    const movements = await Cash_movements.findAll({ where: { cash_register_id } })

    let efectivo = 0
    let transferencia = 0

    sales.forEach((s: any) => {
      efectivo += Number(s.cashAmount || 0)
      transferencia += Number(s.transferAmount || 0)
    })

    movements.forEach((m: any) => {
      const amount = Number(m.amount)
      if (m.method === 'efectivo') {
        m.type === 'ingreso' ? efectivo += amount : efectivo -= amount
      } else if (m.method === 'transferencia') {
        m.type === 'ingreso' ? transferencia += amount : transferencia -= amount
      }
    })

    return { efectivo, transferencia }
  },

  async getCurrentRegister() { 
    return await Cash_register.findOne({ where: { status: 'open' } }) 
  },
  
 
  async getAllRegisters(from?: string, to?: string) { 
    let whereClause: any = {}

    if (from && to) {
      const startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      whereClause = { opened_at: { [Op.between]: [startDate, endDate] } };
    }

    return await Cash_register.findAll({ 
      where: whereClause,
      order: [['opened_at', 'DESC']] 
    }) 
  },
  
  async getRegisterById(id: string) { 
    return await Cash_register.findByPk(id) 
  }
}