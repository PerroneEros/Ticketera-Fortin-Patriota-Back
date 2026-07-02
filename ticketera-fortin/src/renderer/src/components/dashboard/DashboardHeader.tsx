import React from 'react'
import { useDashboardContext, TimeFilter } from '../context/dashboardContext'

export const DashboardHeader = () => {
  const { timeFilter, setTimeFilter } = useDashboardContext()
  const filters: TimeFilter[] = ['Día', 'Semana', 'Mes', 'Todo']

  return (
    <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      
      {/* Filtros de tiempo */}
      <div className="filters-group" style={{ display: 'flex', gap: '10px', background: '#f1f1f1', padding: '5px', borderRadius: '8px' }}>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              // Si el filtro está activo, le cambio el color
              background: timeFilter === filter ? '#0ea5e9' : 'transparent',
              color: timeFilter === filter ? 'white' : 'gray',
              fontWeight: timeFilter === filter ? 'bold' : 'normal'
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/*Botón de Ingreso/Egreso */}
      <div className="actions-group">
        <button 
          className="btn-movimiento"
          style={{ background: '#0ea5e9', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ⊕ Movimiento
        </button>
      </div>
    </div>
  )
}