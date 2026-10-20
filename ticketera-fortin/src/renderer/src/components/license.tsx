import React, { useState } from 'react'
import './Styles/license.css'

interface LicenseScreenProps {
  machineId: string
  onActivated: () => void // Función para avisarle al App.tsx que ya se activó
}

export const LicenseScreen: React.FC<LicenseScreenProps> = ({ machineId, onActivated }) => {
  const [key, setKey] = useState('')
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const handleActivate = async () => {
    const success = await window.api.activateLicense(key.trim().toUpperCase())
    if (success) {
      setError(false)
      onActivated()
    } else {
      setError(true)
    }
  }
  const handleCopy = () => {
    navigator.clipboard.writeText(machineId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // Vuelve a decir "Copiar" tras 2 segundos
  }

  return (
    <div className="license-container">
      <div className="license-card">
        <h2 className="license-title">Sistema Bloqueado</h2>
        <p className="license-description">Este equipo no cuenta con una licencia activa.</p>
        <div className="machine-id-box">
          <p className="machine-id-label">Código de Equipo (Enviá esto a Soporte)</p>
          <div className="machine-id-wrapper">
            <strong className="machine-id-text">{machineId}</strong>
            <button
              type="button"
              onClick={handleCopy}
              className={`copy-btn ${copied ? 'copied' : ''}`}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <div className="input-container">
          <input
            type="text"
            placeholder="Ingrese la Clave de Activación"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className={`license-input ${error ? 'error' : ''}`}
          />
          {error && <p className="error-text">Clave incorrecta.</p>}
        </div>
        <button onClick={handleActivate} className="activate-button">
          Activar Sistema
        </button>
      </div>
    </div>
  )
}
