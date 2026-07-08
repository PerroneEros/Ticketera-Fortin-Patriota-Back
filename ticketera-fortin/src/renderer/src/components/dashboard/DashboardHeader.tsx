import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardHeader = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const { dateRange, setDateRange, isAllTime, setIsAllTime, isFiltering, setIsFiltering } = useDashboardContext()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => {
    setIsAllTime(false);
    setIsFiltering(true);
    setDateRange({ ...dateRange, [field]: e.target.value })
  }

  const colorCeleste = '#38bdf8';
  const colorOliva = '#555843';

  return (
    <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '15px', 
        background: 'rgba(85, 88, 67, 0.9)', 
        padding: '8px 15px', 
        borderRadius: '30px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(5px)' 
      }}>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={() => setIsFiltering(false)}
            style={{
              background: !isFiltering ? colorCeleste : 'transparent',
              color: !isFiltering ? '#082f49' : 'white',
              border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease'
            }}>
            Caja Actual
          </button>
          <button 
            onClick={() => { setIsAllTime(true); setIsFiltering(true); }}
            style={{
              background: (isFiltering && isAllTime) ? colorCeleste : 'transparent',
              color: (isFiltering && isAllTime) ? '#082f49' : 'white',
              border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease'
            }}>
            Historial
          </button>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 5px' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Desde:</span>
          <input 
            type="date" value={dateRange.from} onChange={(e) => handleDateChange(e, 'from')}
            style={{ border: 'none', background: 'white', padding: '6px 12px', borderRadius: '20px', color: colorOliva, cursor: 'pointer', outline: 'none', opacity: (!isFiltering || isAllTime) ? 0.5 : 1, fontWeight: 'bold' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Hasta:</span>
          <input 
            type="date" value={dateRange.to} onChange={(e) => handleDateChange(e, 'to')}
            style={{ border: 'none', background: 'white', padding: '6px 12px', borderRadius: '20px', color: colorOliva, cursor: 'pointer', outline: 'none', opacity: (!isFiltering || isAllTime) ? 0.5 : 1, fontWeight: 'bold' }}
          />
        </div>

      </div>

      <button 
        onClick={onOpenModal} 
        style={{ 
          background: colorCeleste, color: '#082f49', 
          padding: '12px 24px', border: 'none', borderRadius: '30px', 
          cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}
      >
        ⊕ Movimiento
      </button>

    </div>
  )
}