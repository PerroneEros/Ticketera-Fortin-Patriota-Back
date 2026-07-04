import React, { useState } from 'react'
import axios from 'axios'
import { useDashboardContext } from '../context/dashboardContext'

interface Props {
  onClose: () => void
}

export const DashboardMovementModal = ({ onClose }: Props) => {
  const [type, setType] = useState<'ingreso' | 'egreso'>('ingreso')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Nos traemos el trigger para recargar el panel una vez que se guarde el movimiento
  const { setTimeFilter, timeFilter } = useDashboardContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // CLÁUSULA REQUIRE: El cliente verifica la validez del estado antes de actuar.
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (!description.trim()) {
      setError('La descripción es obligatoria para justificar el movimiento.')
      return
    }

    setIsSubmitting(true)

    try {
      // ACA VA LA RUTA NUEVA: Esta es la que tienen que armar en el backend
      const ENDPOINT_MOVIMIENTOS = 'http://localhost:34567/api/movements' 

      await axios.post(ENDPOINT_MOVIMIENTOS, {
        type,
        amount: numAmount,
        description,
        method,
        date: new Date().toISOString()
      })

      // Forzamos una recarga del contexto pisando el filtro actual
      setTimeFilter(timeFilter) 
      onClose() 

    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Error al conectar con el servidor. Revisá que el backend soporte este endpoint.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', padding: '30px', borderRadius: '15px',
        width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Registrar movimiento</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'gray' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setType('ingreso')}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px',
                background: type === 'ingreso' ? '#ecfdf5' : '#f9fafb',
                color: type === 'ingreso' ? '#10b981' : 'gray',
                border: type === 'ingreso' ? '2px solid #10b981' : '1px solid #e5e7eb'
              }}>
              ↑ Ingreso
            </button>
            <button type="button" onClick={() => setType('egreso')}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px',
                background: type === 'egreso' ? '#fef2f2' : '#f9fafb',
                color: type === 'egreso' ? '#ef4444' : 'gray',
                border: type === 'egreso' ? '2px solid #ef4444' : '1px solid #e5e7eb'
              }}>
              ↓ Egreso
            </button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'gray', fontSize: '14px', fontWeight: 'bold' }}>Monto ($)</label>
            <input type="number" step="0.01" placeholder="$ 0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f4f0ec', fontSize: '16px', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'gray', fontSize: '14px', fontWeight: 'bold' }}>Descripción</label>
            <input type="text" placeholder="Ej: Compra de insumos..." value={description} onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f4f0ec', fontSize: '16px', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'gray', fontSize: '14px', fontWeight: 'bold' }}>Método</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setMethod('efectivo')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                  background: method === 'efectivo' ? '#10b981' : '#f9fafb',
                  color: method === 'efectivo' ? 'white' : 'gray',
                  border: method === 'efectivo' ? 'none' : '1px solid #e5e7eb'
                }}>
                Efectivo
              </button>
              <button type="button" onClick={() => setMethod('transferencia')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                  background: method === 'transferencia' ? '#0ea5e9' : '#f9fafb',
                  color: method === 'transferencia' ? 'white' : 'gray',
                  border: method === 'transferencia' ? 'none' : '1px solid #e5e7eb'
                }}>
                Transferencia
              </button>
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '14px', textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} disabled={isSubmitting}
              style={{ flex: 1, padding: '14px', borderRadius: '8px', cursor: 'pointer', background: 'white', color: 'gray', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              style={{ flex: 1, padding: '14px', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', color: 'white', border: 'none', fontWeight: 'bold',
                background: type === 'ingreso' ? '#10b981' : '#ef4444', opacity: isSubmitting ? 0.7 : 1
              }}>
              {isSubmitting ? 'Guardando...' : `Registrar ${type}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}