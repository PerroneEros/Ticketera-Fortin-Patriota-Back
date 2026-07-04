import './Styles/productModals.css'
export default function WindowConfirm({ text, onConfirm, onClose }) {
  return (
    <div className="modal-prod-overlay">
      <div className="modal-prod-content">
        <div className="modal-prod-header">
          <p>Esta seguro de {text}?</p>
          <button className="btn-prod-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-prod-actions">
          <button onClick={onConfirm}>Confirmar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
