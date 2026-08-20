import React, { useState } from 'react'
import { Sale } from '../context/dashboardContext'
import { DashboardHistory } from './DashboardHistory'
import { DashboardCards } from './DashboardCards'
import { DashboardPayments } from './DashboardPayments'
import { DashboardProducts } from './DashboardProducts'

interface Props {
  cashBox: any
  sales: Sale[]
}

export const DashboardCashBox = ({ cashBox, sales }: Props) => {
  const [isExpanded, setIsExpanded] = useState(cashBox.status === 'open')

  const boxSales = sales.filter((s) => {
    const saleTime = new Date(s.date).getTime()
    const openTime = new Date(cashBox.opened_at).getTime()
    const closeTime = cashBox.closed_at
      ? new Date(cashBox.closed_at).getTime()
      : new Date().getTime()
    return saleTime >= openTime && saleTime <= closeTime
  })

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#555843',
          color: 'white',
          padding: '16px 24px',
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            CAJA DEL:{' '}
            <strong style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '15px' }}>
              {new Date(cashBox.opened_at).toLocaleTimeString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}</strong>
          </h2>

          <span
            style={{
              background:
                cashBox.status === 'open' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: cashBox.status === 'open' ? '#86efac' : '#fca5a5',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: `1px solid ${cashBox.status === 'open' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
            }}
          >
            {cashBox.status === 'open' ? 'ABIERTA' : 'CERRADA'}
          </span>
        </div>

        <div
          style={{
            fontSize: '14px',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px'
          }}
        >
          ▼
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '24px',
            background: '#fafafa',
            borderRadius: '0 0 12px 12px'
          }}
        >
          <DashboardCards sales={boxSales} />
          <DashboardPayments sales={boxSales} />
          <DashboardProducts sales={boxSales} />
          <DashboardHistory sales={boxSales} cashBox={cashBox} />
        </div>
      )}
    </div>
  )
}
