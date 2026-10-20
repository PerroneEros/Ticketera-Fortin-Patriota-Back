import { Op, QueryTypes, Transaction } from 'sequelize'
import sequelize from '../database/db'
import Cash_register from '../model/cash_registers'
import { OpenRegisterInput } from '../model/interface/cashRegisterInputs'
import { CloseRegisterInput } from '../schemas/cashRegisterSchema'

export interface CloseSummary {
  opening: number
  sales: { cash: number; transfer: number }
  movements: { cashIn: number; cashOut: number; transferIn: number; transferOut: number }
  expected: { cash: number; transfer: number }
}

export class RegisterNotFoundError extends Error {
  constructor() {
    super('Caja no encontrada.')
    this.name = 'RegisterNotFoundError'
  }
}

export class AlreadyClosedError extends Error {
  readonly code = 'ALREADY_CLOSED'
  constructor() {
    super('Esta caja ya está cerrada.')
    this.name = 'AlreadyClosedError'
  }
}

// Something was sold or moved after the cashier saw the expected amounts (RF-12).
export class ExpectedChangedError extends Error {
  readonly code = 'EXPECTED_CHANGED'
  constructor(readonly expected: CloseSummary['expected']) {
    super('Hubo movimientos nuevos en la caja: revisá los montos esperados y volvé a confirmar.')
    this.name = 'ExpectedChangedError'
  }
}

// Closes run one at a time in this process (the app is single-instance), so a double click
// cannot interleave two closes of the same register.
let closeQueue: Promise<unknown> = Promise.resolve()
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const run = closeQueue.then(task, task)
  closeQueue = run.catch(() => undefined)
  return run
}

async function computeSummary(
  register: Cash_register,
  transaction?: Transaction
): Promise<CloseSummary> {
  const id = register.cash_register_id
  const [sales] = await sequelize.query<{ cash: number; transfer: number }>(
    `SELECT COALESCE(SUM(cash_amount), 0) AS cash, COALESCE(SUM(transfer_amount), 0) AS transfer
     FROM Sales WHERE cash_register_id = :id`,
    { replacements: { id }, type: QueryTypes.SELECT, transaction }
  )
  const [movements] = await sequelize.query<CloseSummary['movements']>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'ingreso' AND method = 'efectivo' THEN amount END), 0) AS cashIn,
       COALESCE(SUM(CASE WHEN type = 'egreso' AND method = 'efectivo' THEN amount END), 0) AS cashOut,
       COALESCE(SUM(CASE WHEN type = 'ingreso' AND method = 'transferencia' THEN amount END), 0) AS transferIn,
       COALESCE(SUM(CASE WHEN type = 'egreso' AND method = 'transferencia' THEN amount END), 0) AS transferOut
     FROM Cash_movements WHERE cash_register_id = :id`,
    { replacements: { id }, type: QueryTypes.SELECT, transaction }
  )
  const opening = Number(register.opening)
  return {
    opening,
    sales,
    movements,
    expected: {
      cash: opening + sales.cash + movements.cashIn - movements.cashOut,
      transfer: sales.transfer + movements.transferIn - movements.transferOut
    }
  }
}

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

  // Expected amounts per method, computed here so the screen only displays them (RF-1 to RF-4).
  async getCloseSummary(id: number | string): Promise<CloseSummary> {
    const register = await Cash_register.findByPk(id)
    if (!register) throw new RegisterNotFoundError()
    return computeSummary(register)
  },

  // Stores counted and expected amounts per method; differences are derived when shown.
  // `closing` keeps the counted total for older versions and the PDF.
  closeRegister(id: number | string, data: CloseRegisterInput): Promise<Cash_register> {
    return oneAtATime(() =>
      sequelize.transaction(async (transaction) => {
        const register = await Cash_register.findByPk(id, { transaction })
        if (!register) throw new RegisterNotFoundError()
        if (register.status === 'closed') throw new AlreadyClosedError()

        const { expected } = await computeSummary(register, transaction)
        if (
          expected.cash !== data.shownExpectedCash ||
          expected.transfer !== data.shownExpectedTransfer
        ) {
          throw new ExpectedChangedError(expected)
        }

        const [updated] = await Cash_register.update(
          {
            counted_cash: data.countedCash,
            counted_transfer: data.countedTransfer,
            expected_cash: expected.cash,
            expected_transfer: expected.transfer,
            closing: data.countedCash + data.countedTransfer,
            closed_at: new Date(),
            status: 'closed'
          },
          { where: { cash_register_id: register.cash_register_id, status: 'open' }, transaction }
        )
        if (updated === 0) throw new AlreadyClosedError()
        return (await Cash_register.findByPk(register.cash_register_id, {
          transaction
        })) as Cash_register
      })
    )
  },

  async getCurrentRegister() {
    return await Cash_register.findOne({ where: { status: 'open' } })
  },

  async getAllRegisters(from?: string, to?: string) {
    let whereClause: any = {}

    if (from && to) {
      const startDate = new Date(from)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(to)
      endDate.setHours(23, 59, 59, 999)

      whereClause = { opened_at: { [Op.between]: [startDate, endDate] } }
    }

    return await Cash_register.findAll({
      where: whereClause,
      order: [['opened_at', 'DESC']]
    })
  }
}
