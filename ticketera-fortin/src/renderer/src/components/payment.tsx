import { useState } from 'react'
import './Styles/productModals.css'
import { parseInputValue } from './utils/formatters'

export default function Payment({ method, total, onClose, onConfirm, onBack }) {
  const [cash, setCash] = useState(method === 'efectivo' ? total : 0)
  const [transfer, setTransfer] = useState(method === 'transferencia' ? total : 0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCashChange = (val) => {
    const num = parseInputValue(val)
    setCash(num)
    if (method === 'combinado') {
      const remainder = total - num
      setTransfer(remainder > 0 ? remainder : 0)
    }
  }

  const handleTransferChange = (val) => {
    const num = parseInputValue(val)
    setTransfer(num)
    if (method === 'combinado') {
      const remainder = total - num
      setCash(remainder > 0 ? remainder : 0)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (method === 'efectivo' && cash !== total) {
      setErrorMsg(`Debe abonar exactamente $${total}.`)
      return
    }
    if (method === 'transferencia' && transfer !== total) {
      setErrorMsg(`Debe abonar exactamente $${total}.`)
      return
    }
    if (method === 'combinado' && cash + transfer !== total) {
      setErrorMsg(`La suma debe ser exactamente $${total}.`)
      return
    }

    onConfirm({ method: method, cashAmount: cash, transferAmount: transfer })
  }

  return (
    <div className="modal-prod-overlay">
      <div className="modal-ticket-content">
        <div className="modal-ticket-header">
          <button className="btn-ticket-back" onClick={onBack}>
            ← Volver
          </button>
          <button className="btn-ticket-cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>

        <div className="modal-ticket-body">
          <div className="ticket-total-display">
            <p>Monto a cobrar</p>
            <h2>${total.toLocaleString('es-AR')}</h2>
          </div>

          <form onSubmit={handlePayment} className="payment-form">
            <div className="payment-inputs-container">
              {(method === 'efectivo' || method === 'combinado') && (
                <div className="payment-input-group">
                  <label>Monto en Efectivo:</label>
                  {/* CLASES NUEVAS Y ÚNICAS AQUÍ */}
                  <div className="payment-modal-wrapper">
                    <span className="payment-modal-currency">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      min="0"
                      value={cash === 0 ? '' : cash.toLocaleString('es-AR')}
                      placeholder="0"
                      onChange={(e) => handleCashChange(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {(method === 'transferencia' || method === 'combinado') && (
                <div className="payment-input-group">
                  <label>Monto en Transferencia:</label>
                  {/* CLASES NUEVAS Y ÚNICAS AQUÍ */}
                  <div className="payment-modal-wrapper">
                    <span className="payment-modal-currency">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      min="0"
                      value={transfer === 0 ? '' : transfer.toLocaleString('es-AR')}
                      placeholder="0"
                      onChange={(e) => handleTransferChange(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {errorMsg && <p className="error-text payment-error">{errorMsg}</p>}

            <div className="modal-prod-actions center-actions">
              <button type="submit" className="btn-confirm-payment">
                Confirmar Pago
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
