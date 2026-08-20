import './Styles/ConfirmModals.css'
export default function WindowConfirm({ text, onConfirm, onClose }) {
  return (
    <div className="modal-prod-overlay">
      <div className="confirm-modal-content">

        <div className="confirm-modal-header">
          <h3>Confirmación</h3>
          <button className="btn-prod-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="confirm-modal-body">
          <p>¿Está seguro de <b>{text}</b>?</p>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn-cancel-confirm" onClick={onClose}>Cancelar</button>
          <button className="btn-accept-confirm" onClick={onConfirm}>Confirmar</button>
        </div>

      </div>
    </div>
  )
}
