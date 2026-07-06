import { useState } from 'react'

export default function Payment({ method, total, onClose, onConfirm }) {
  const [cash, setCash] = useState(0)
  const [transfer, setTransfer] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const handlePayment = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    //Validaciones según el método elegido
    if (method === 'efectivo') {
      if (cash <= 0) {
        setErrorMsg('El monto en efectivo debe ser mayor a 0.')
        return
      }
      if (cash !== total) {
        setErrorMsg(`La suma de los montos debe ser exactamente $${total}.`)
        return
      }
    }
    if (method === 'transferencia') {
      if (transfer <= 0) {
        setErrorMsg('El monto por transferencia debe ser mayor a 0.')
        return
      }
      if (transfer !== total) {
        setErrorMsg(`El monto por transferencia debe ser exactamente $${total}.`)
        return
      }
    }
    if (method === 'combinado') {
      if (cash <= 0 || transfer <= 0) {
        setErrorMsg('Debes ingresar ambos montos para el pago combinado.')
        return
      }
      //valida que no paguen de mas
      if (cash + transfer !== total) {
        setErrorMsg(`La suma de los montos debe ser exactamente $${total}.`)
        return
      }
    }

    onConfirm({
      method: method,
      cashAmount: cash,
      transferAmount: transfer
    })
  }
  return (
    <div className="modal-prod-overlay">
      <div className="modal-prod-content">
        <div>
          <h3>Ingrese el monto (Total: ${total})</h3>
          <button className="btn-prod-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handlePayment}>
          <div>
            <div>
              {(method == 'efectivo' || method == 'combinado') && (
                <>
                  <label>Efectivo:</label>
                  <input
                    type="number"
                    onChange={(c) => {
                      setCash(Number(c.target.value))
                    }}
                  />
                </>
              )}
            </div>
            <div>
              {(method == 'transferencia' || method == 'combinado') && (
                <>
                  <label>Transferencia:</label>
                  <input
                    type="number"
                    onChange={(t) => {
                      setTransfer(Number(t.target.value))
                    }}
                  />
                </>
              )}
              {errorMsg && <p className="error-text">{errorMsg}</p>}
            </div>
            <div>
              <button type="submit">Confirmar</button>
            </div>
            <div>
              <button type="button" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
