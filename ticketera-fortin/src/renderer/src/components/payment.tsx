import { useState } from 'react'

export default function Payment({ method, total, onClose, onConfirm }) {
  const [cash, setCash] = useState(0)
  const [transfer, setTransfer] = useState(0)
  const handlePayment = async (e) => {
    e.preventDefault()
    onConfirm({
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
