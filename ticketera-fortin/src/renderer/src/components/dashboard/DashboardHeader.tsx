import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardHeader = ({ onOpenModal }: { onOpenModal: () => void }) => {
  // Nos traemos el nuevo estado del contexto
  const { dateRange, setDateRange, isAllTime, setIsAllTime } = useDashboardContext()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => {
    // Si el usuario toca una fecha específica, apagamos el botón de "Todos"
    setIsAllTime(false);
    
    setDateRange({
      ...dateRange,
      [field]: e.target.value
    })
  }

  return (
    <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px', 
        background: 'white', 
        padding: '10px 20px', 
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
      }}>
        
        {/* Botón Todos */}
        <button 
          onClick={() => setIsAllTime(true)}
          style={{
            background: isAllTime ? '#0ea5e9' : '#f3f4f6',
            color: isAllTime ? 'white' : '#6b7280',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Todos
        </button>

        <span style={{ color: '#d1d5db' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#6b7280', fontSize: '14px' }}>Desde:</span>
          <input 
            type="date" 
            value={dateRange.from} 
            onChange={(e) => handleDateChange(e, 'from')}
            style={{ border: 'none', background: '#f3f4f6', padding: '8px', borderRadius: '6px', color: '#374151', cursor: 'pointer', outline: 'none', opacity: isAllTime ? 0.5 : 1 }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#6b7280', fontSize: '14px' }}>Hasta:</span>
          <input 
            type="date" 
            value={dateRange.to} 
            onChange={(e) => handleDateChange(e, 'to')}
            style={{ border: 'none', background: '#f3f4f6', padding: '8px', borderRadius: '6px', color: '#374151', cursor: 'pointer', outline: 'none', opacity: isAllTime ? 0.5 : 1 }}
          />
        </div>

      </div>

      {/* Botón de Movimiento */}
      <button 
        className="btn-movimiento"
        onClick={onOpenModal} 
        style={{ background: '#0ea5e9', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(14, 165, 233, 0.2)' }}
      >
        ⊕ Movimiento
      </button>

    </div>
  )
}