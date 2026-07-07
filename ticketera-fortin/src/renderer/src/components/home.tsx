import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CashRegisterContext } from '../components/context/cashRegisterContext'
import { openRegister } from './service/cashRegisterService'
import logo from '../assets/logo.jpeg'
import './Styles/cashRegisterOpen.css'

export default function Home() {
  const navigate = useNavigate()

  // Extraemos el contexto de la caja
  const context = useContext(CashRegisterContext)

  // Estados locales para manejar el input y la carga
  const [openingAmount, setOpeningAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Si el contexto cargó y detecta que hay una caja activa
    if (context?.activeRegister) {
      // lo mandamos directo a la pantalla de ventas.
      navigate('/products')
    }
  }, [context?.activeRegister, navigate])

  // Función para obtener la fecha formateada
  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
    const dateStr = new Date().toLocaleDateString('es-AR', options)
    return dateStr
      .replace(/(^\w)/, (match) => match.toUpperCase())
      .replace(/ de /g, ' De ')
  }

  // Manejador para enviar el formulario de apertura
  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    const numericAmount = Number(openingAmount)
    if (isNaN(numericAmount) || numericAmount < 0) {
      setErrorMsg('El monto inicial debe ser válido.')
      setIsLoading(false)
      return
    }

    try {
      // Si todo está bien, abrimos la caja
      await openRegister(numericAmount)
      if (context) {
        await context.loadActiveRegister()
      }
      // El useEffect de arriba detectará este cambio y hará el navigate automáticamente,
      // pero dejar este navigate aquí también es una buena red de seguridad.
      navigate('/products')
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Si por alguna razón el contexto falla, mostramos un error visible
  if (!context) {
    return (
      <div className="home-wrapper">
        <h2 style={{ color: 'white' }}>Error: CashRegisterContext no encontrado. Revisa tu App.tsx</h2>
      </div>
    )
  }

  return (
    <div className="home-wrapper">
      <div className="login-card">

        <div className="card-header-black">
          <img src={logo} alt="Logo Fortín Patriotas" className="home-logo" />
          <h1 className="home-title">Fortín Patriotas</h1>
          <h3 className="home-subtitle">Centro Tradicionalista · Casbas</h3>
          <h2 className="home-date">{getCurrentDate()}</h2>
        </div>

        <div className="card-body-white">
          <form onSubmit={handleOpenSubmit} className="open-register-form">

            <label className="input-label">Fondo inicial en efectivo ($)</label>
            <div className="input-container">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                className="amount-input"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                required
              />
            </div>

            <p className="input-helper">
              Ingresa el efectivo físico con el que inicias el turno.
            </p>

            {errorMsg && <p className="error-text" style={{ color: 'red', fontSize: '0.8rem' }}>{errorMsg}</p>}

            <button
              type="submit"
              className="btn-open-register"
              disabled={isLoading}
            >
              {isLoading ? 'Abriendo...' : 'Abrir Caja'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/resumen')}
            >
              Ver reportes sin abrir caja
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}