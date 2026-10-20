import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CashRegisterContext } from '../context/cashRegisterContext'
import { closeRegister, CloseSummary, getCloseSummary } from '../service/cashRegisterService'
import '../Styles/cashRegisterClose.css'
import { parseInputValue } from '../utils/formatters'

const money = (amount: number): string =>
  amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDiff = (diff: number): string => {
  if (diff > 0) return `↗ +$${money(Math.abs(diff))}`
  if (diff < 0) return `↘ -$${money(Math.abs(diff))}`
  return `$0.00`
}

const getDiffClass = (diff: number): string => {
  if (diff > 0) return 'text-diff-positive'
  if (diff < 0) return 'text-diff-negative'
  return 'text-diff-neutral'
}

// One count per payment method. A count that does not match the expected amount has to be
// confirmed twice (RF-6); the second confirmation accepts the difference (RF-7).
interface Count {
  value: number
  confirmed: boolean
  // Value the cashier already confirmed once despite not matching the expected amount.
  mismatchSeen: number | null
}

const emptyCount: Count = { value: 0, confirmed: false, mismatchSeen: null }

function confirmCount(count: Count, expected: number): Count {
  if (count.value === expected || count.mismatchSeen === count.value) {
    return { ...count, confirmed: true }
  }
  return { ...count, mismatchSeen: count.value }
}

interface CountSectionProps {
  title: string
  className: string
  buttonClassName: string
  expected: number | null
  count: Count
  disabled: boolean
  onChange: (count: Count) => void
}

const CountSection = ({
  title,
  className,
  buttonClassName,
  expected,
  count,
  disabled,
  onChange
}: CountSectionProps): React.JSX.Element => {
  const diff = expected === null ? 0 : count.value - expected
  const awaitingReconfirm = !count.confirmed && count.mismatchSeen === count.value

  return (
    <div className={`close-count-section ${className}`}>
      <div className="close-section-header">
        <span>{title}</span>
        <span>
          Esperado: <strong>${expected === null ? '...' : money(expected)}</strong>
        </span>
      </div>

      {!count.confirmed ? (
        <>
          <div className="close-count-input-row">
            <input
              type="text"
              inputMode="numeric"
              placeholder="$ Monto contado..."
              aria-label={`${title} contado`}
              value={count.value.toLocaleString('es-AR')}
              onChange={(e) => onChange({ ...count, value: parseInputValue(e.target.value) })}
              disabled={disabled}
            />
            <button
              className={`close-btn-confirm-count ${buttonClassName}`}
              onClick={() => expected !== null && onChange(confirmCount(count, expected))}
              disabled={disabled}
            >
              {awaitingReconfirm ? 'Confirmar de nuevo' : 'Confirmar'}
            </button>
          </div>
          {awaitingReconfirm && (
            <p className="close-error-text" role="alert">
              No coincide con el esperado (diferencia {formatDiff(diff)}). Volvé a contar y confirmá
              de nuevo.
            </p>
          )}
        </>
      ) : (
        <div className="close-count-confirmed-row">
          <span className="close-confirmed-text">
            <span className="close-check-icon">✓</span> Contado:{' '}
            <strong>${money(count.value)}</strong>
          </span>
          <div className="close-confirmed-actions">
            <span className={`close-diff-text ${getDiffClass(diff)}`}>{formatDiff(diff)}</span>
            <button
              type="button"
              className="close-btn-edit"
              onClick={() => onChange({ ...count, confirmed: false })}
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ApiError {
  response?: { status?: number; data?: { code?: string; message?: string } }
  message?: string
}

export const CashRegisterClose = (): React.JSX.Element | null => {
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [cash, setCash] = useState<Count>(emptyCount)
  const [transfer, setTransfer] = useState<Count>(emptyCount)
  const [summary, setSummary] = useState<CloseSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)

  const context = useContext(CashRegisterContext)
  if (!context) return null
  const { activeRegister, loadActiveRegister } = context

  const expectedCash = summary?.expected.cash ?? null
  const expectedTransfer = summary?.expected.transfer ?? null
  const fondoInicial = summary?.opening ?? Number(activeRegister?.opening ?? 0)
  const ventasEfectivo = summary?.sales.cash ?? 0
  const ventasTransferencia = summary?.sales.transfer ?? 0
  const totalFacturado = fondoInicial + ventasEfectivo + ventasTransferencia

  const diffEfectivo = cash.value - (expectedCash ?? 0)
  const diffTransferencia = transfer.value - (expectedTransfer ?? 0)
  const diffTotal = diffEfectivo + diffTransferencia
  const bothConfirmed = cash.confirmed && transfer.confirmed
  const countsDisabled = isLoadingSummary || summary === null

  const loadSummary = async (): Promise<void> => {
    if (!activeRegister) return
    setIsLoadingSummary(true)
    try {
      setSummary(await getCloseSummary(activeRegister.cash_register_id))
    } catch {
      setSummary(null)
      setErrorMsg('No se pudieron cargar los montos esperados. Cerrá y volvé a intentar.')
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleOpenCloseModal = async (): Promise<void> => {
    setErrorMsg('')
    setCash(emptyCount)
    setTransfer(emptyCount)
    setSummary(null)
    if (!activeRegister) return
    setShowModal(true)
    await loadSummary()
  }

  const handleCloseSubmit = async (): Promise<void> => {
    if (!activeRegister || expectedCash === null || expectedTransfer === null) return
    setIsLoading(true)
    setErrorMsg('')
    try {
      await closeRegister(activeRegister.cash_register_id, {
        countedCash: cash.value,
        countedTransfer: transfer.value,
        shownExpectedCash: expectedCash,
        shownExpectedTransfer: expectedTransfer
      })
      await loadActiveRegister()
      setShowModal(false)
      navigate('/')
    } catch (error) {
      const { response, message } = error as ApiError
      const serverMessage = response?.data?.message
      if (response?.data?.code === 'EXPECTED_CHANGED') {
        // RF-12: show the new expected amounts and ask to confirm both counts again.
        setCash((c) => ({ ...c, confirmed: false, mismatchSeen: null }))
        setTransfer((t) => ({ ...t, confirmed: false, mismatchSeen: null }))
        await loadSummary()
        setErrorMsg(serverMessage ?? 'Los montos esperados cambiaron. Volvé a confirmar.')
      } else if (response?.data?.code === 'ALREADY_CLOSED') {
        toast.error(serverMessage ?? 'Esta caja ya está cerrada.')
        setShowModal(false)
        await loadActiveRegister()
      } else {
        setErrorMsg(serverMessage ?? message ?? 'No se pudo cerrar la caja.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {activeRegister && (
        <button className="close-btn-header-close" onClick={handleOpenCloseModal}>
          Cerrar Caja
        </button>
      )}

      {showModal && (
        <div className="close-modal-overlay">
          <div className="close-modal-content">
            <div className="close-header">
              <div className="close-title-area">
                <span className="close-icon-lock">🔒</span>
                <div>
                  <h3>Cierre de Caja</h3>
                  <p>Turno actual</p>
                </div>
              </div>
              <div className="close-total-area">
                <span className="close-btn-x" onClick={() => setShowModal(false)}>
                  ✕
                </span>
                <p>Total facturado</p>
                <h4>${isLoadingSummary ? '...' : money(totalFacturado)}</h4>
              </div>
            </div>

            <div className="close-body">
              <div className="close-summary-cards">
                <div className="close-summary-card close-fund">
                  <p>Fondo inicial</p>
                  <strong>${money(fondoInicial)}</strong>
                </div>
                <div className="close-summary-card close-sales-cash">
                  <p>Efectivo ventas</p>
                  <strong>${isLoadingSummary ? '...' : money(ventasEfectivo)}</strong>
                </div>
                <div className="close-summary-card close-sales-transfers">
                  <p>Transferencias</p>
                  <strong>${isLoadingSummary ? '...' : money(ventasTransferencia)}</strong>
                </div>
              </div>

              {summary && (
                <p className="close-movements-note">
                  Movimientos — efectivo: +${money(summary.movements.cashIn)} / -$
                  {money(summary.movements.cashOut)} · transferencias: +$
                  {money(summary.movements.transferIn)} / -${money(summary.movements.transferOut)}
                </p>
              )}

              <CountSection
                title="💵 Efectivo en caja"
                className="close-cash-section"
                buttonClassName="close-btn-cash"
                expected={expectedCash}
                count={cash}
                disabled={countsDisabled}
                onChange={setCash}
              />

              <CountSection
                title="📱 Transferencias recibidas"
                className="close-transfer-section"
                buttonClassName="close-btn-transfer"
                expected={expectedTransfer}
                count={transfer}
                disabled={countsDisabled}
                onChange={setTransfer}
              />

              {bothConfirmed && (
                <div
                  className={`close-total-diff-section ${diffTotal >= 0 ? 'close-bg-positive' : 'close-bg-negative'}`}
                >
                  <div className="close-total-diff-header">
                    <span>Diferencia total del turno</span>
                    <strong className={getDiffClass(diffTotal)}>{formatDiff(diffTotal)}</strong>
                  </div>
                  <p className="close-total-diff-msg">
                    {diffTotal > 0 && 'Hay más dinero del esperado en el turno.'}
                    {diffTotal < 0 && 'Falta dinero respecto a lo esperado.'}
                    {diffTotal === 0 && 'El cierre de caja es exacto.'}
                  </p>
                  {(diffEfectivo !== 0 || diffTransferencia !== 0) && (
                    <p className="close-total-diff-msg" role="alert">
                      Atención: la caja se va a cerrar con diferencia (efectivo{' '}
                      {formatDiff(diffEfectivo)} · transferencias {formatDiff(diffTransferencia)}).
                    </p>
                  )}
                </div>
              )}

              {errorMsg && <p className="close-error-text text-center">{errorMsg}</p>}
            </div>

            <div className="close-footer">
              <button
                className="close-btn-final-close"
                disabled={!bothConfirmed || isLoading || countsDisabled}
                onClick={handleCloseSubmit}
              >
                🔒 Cerrar Caja y Nuevo Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
