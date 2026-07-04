import { useState } from 'react'
import Payment from './payment'

export default function Method({ total, onClose, onConfirm }) {
  const [selectMethod, setSelectMethod] = useState(null)
  if (selectMethod) {
    return <Payment method={selectMethod} total={total} onClose={onClose} onConfirm={onConfirm} />
  }
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div>
          <h3>Seleccione metodo de pago:</h3>
        </div>
        <div>
          <button onClick={() => setSelectMethod('efectivo')}>Efectivo</button>
        </div>
        <div>
          <button onClick={() => setSelectMethod('transferencia')}>Transferencia</button>
        </div>
        <div>
          <button onClick={() => setSelectMethod('combinado')}>Combinado</button>
        </div>
        <div>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
