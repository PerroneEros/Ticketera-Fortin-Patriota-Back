import { useState } from 'react'
import Payment from './payment'
import './Styles/cartModals.css'

export default function Method({ total, onClose, onConfirm }) {
  const [selectMethod, setSelectMethod] = useState(null)

  if (selectMethod) {
    return (
      <Payment
        method={selectMethod}
        total={total}
        onClose={onClose}
        onConfirm={onConfirm}
        onBack={() => setSelectMethod(null)} // <-- Prop para volver atrás
      />
    )
  }

  return (
    <div className="modal-prod-overlay">
      <div className="modal-ticket-content">
        {/* Encabezado oscuro */}
        <div className="modal-ticket-header">
          <h3>Seleccionar método de pago</h3>
          <button className="btn-ticket-cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>

        <div className="modal-ticket-body">
          {/* Total a cobrar */}
          <div className="ticket-total-display">
            <p>Total a cobrar</p>
            <h2>${total.toLocaleString('es-AR')}</h2>
          </div>

          <p className="ticket-subtitle">Selecciona método de pago</p>

          {/* Tarjetas de métodos */}
          <div className="ticket-methods-list">
            <button className="ticket-method-card cash" onClick={() => setSelectMethod('efectivo')}>
              <div className="method-icon-box">💵</div>
              <div className="method-text-box">
                <h4>Efectivo</h4>
                <p>Pago completo en efectivo</p>
              </div>
              <div className="method-arrow">→</div>
            </button>

            <button
              className="ticket-method-card transfer"
              onClick={() => setSelectMethod('transferencia')}
            >
              <div className="method-icon-box">📱</div>
              <div className="method-text-box">
                <h4>Transferencia</h4>
                <p>Pago completo por transferencia</p>
              </div>
              <div className="method-arrow">→</div>
            </button>

            <button
              className="ticket-method-card mixed"
              onClick={() => setSelectMethod('combinado')}
            >
              <div className="method-icon-box">🔀</div>
              <div className="method-text-box">
                <h4>Pago combinado</h4>
                <p>Parte en efectivo, parte en transferencia</p>
              </div>
              <div className="method-arrow">→</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
