import React, { useState } from 'react';
import { Sale } from '../context/dashboardContext';
import { DashboardHistory } from './DashboardHistory';
import { DashboardCards } from './DashboardCards';
import { DashboardPayments } from './DashboardPayments';
import { DashboardProducts } from './DashboardProducts';

interface Props {
  cashBox: any;
  sales: Sale[];
}

export const DashboardCashBox = ({ cashBox, sales }: Props) => {
  
  const [isExpanded, setIsExpanded] = useState(cashBox.status === 'open');

  const boxSales = sales.filter(s => {
    const saleTime = new Date(s.date).getTime();
    const openTime = new Date(cashBox.opened_at).getTime();
    const closeTime = cashBox.closed_at ? new Date(cashBox.closed_at).getTime() : new Date().getTime();
    
    return saleTime >= openTime && saleTime <= closeTime;
  });

  return (
    <div style={{ 
      border: '2px solid #000', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '30px', 
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      transition: 'all 0.3s ease' 
    }}>
      
      {/* CABECERA (AHORA ES CLICKLEABLE) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          // Si está desplegado mostramos la raya gris, si está colapsado la sacamos para que quede limpio
          borderBottom: isExpanded ? '2px solid #e2e8f0' : 'none', 
          paddingBottom: isExpanded ? '15px' : '0',
          cursor: 'pointer', // Hace que el mouse se ponga en formita de mano
          userSelect: 'none' // Evita que el texto se pinte de azul si hacés doble clic
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#334155', textTransform: 'uppercase' }}>
              CAJA DEL: {new Date(cashBox.opened_at).toLocaleString()}
          </h2>
          <span style={{ 
              background: cashBox.status === 'open' ? '#dcfce7' : '#fee2e2', 
              color: cashBox.status === 'open' ? '#16a34a' : '#ef4444', 
              padding: '6px 16px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: `1px solid ${cashBox.status === 'open' ? '#16a34a' : '#ef4444'}`
          }}>
              {cashBox.status === 'open' ? 'ABIERTA' : 'CERRADA'}
          </span>
        </div>

        {/* FLECHA INDICADORA */}
        <div style={{ 
          fontSize: '16px', 
          color: '#64748b', 
          // Gira la flecha animadamente dependiendo de si está abierto o cerrado
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          background: '#e2e8f0',
          padding: '8px 12px',
          borderRadius: '8px'
        }}>
          ▼
        </div>
      </div>

      {/* CONTENIDO DESPLEGABLE (Se oculta o se muestra según el isExpanded) */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          <DashboardCards sales={boxSales} />
          <DashboardPayments sales={boxSales} />
          <DashboardProducts sales={boxSales} />
          <DashboardHistory sales={boxSales} cashBox={cashBox} />
        </div>
      )}

    </div>
  );
};