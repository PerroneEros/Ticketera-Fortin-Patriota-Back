import React, { useState } from 'react'
import { Sale, useDashboardContext } from '../context/dashboardContext'
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
  const {registerList} = useDashboardContext()
  const boxSales = sales.filter((s) => {
    const saleTime = new Date(s.date).getTime()
    const openTime = new Date(cashBox.opened_at).getTime()
    const closeTime = cashBox.closed_at
      ? new Date(cashBox.closed_at).getTime()
      : new Date().getTime()
    return saleTime >= openTime && saleTime <= closeTime
  })
  const imprimirPDFLista = () =>{
    const productStats: Record<string, { quantity: number; total: number }> = {};
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalIngreso = 0
    let totalEgreso = 0
    let ingresoEfectivo = 0
    let egresoEfectivo = 0
    let ingresoTransferencia = 0
    let egresoTransferencia = 0
   boxSales.forEach((sale) => {
      // Sumar para los totales (ignorando el cierre)
      if (sale.paymentMethod !== 'cierre') {
        const cash = Number(sale.cashAmount) || 0;
        const transfer = Number(sale.transferAmount) || 0;
        if (sale.paymentMethod === 'egreso') {
          totalEfectivo -= cash;
          totalTransferencia -= transfer;
          egresoEfectivo -= cash
          egresoTransferencia -= transfer
          totalEgreso += cash+transfer
        } else {
          totalEfectivo += cash;
          totalTransferencia += transfer;
          ingresoEfectivo += cash
          ingresoTransferencia += transfer
          totalIngreso += cash+transfer
        }
      }

      // Agrupar productos
      if (sale.paymentMethod !== 'ingreso' && sale.paymentMethod !== 'egreso' && sale.Sale_items) {
        sale.Sale_items.forEach((item) => {
          const productName = item.Product?.name || `Producto #${item.id_product}`;
          if (!productStats[productName]) {
            productStats[productName] = { quantity: 0, total: 0 };
          }
          productStats[productName].quantity += Number(item.quantity) || 0;
          productStats[productName].total += Number(item.total) || 0;
        });
      }
    });

    // 2. Armar las filas HTML de los productos
    const filasProductos = Object.entries(productStats)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .map(([name, stats]) => `
        <tr>
          <td>${name}</td>
          <td style="text-align: center;">${stats.quantity}</td>
          <td style="text-align: right;">$${stats.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join("");

    // 3. Armar las filas HTML del historial de movimientos
    const filasMovimientos = boxSales.map((sale) => {
      const fecha = new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const total = Number(sale.total) || 0;
      const esEgreso = sale.paymentMethod === 'egreso';
      return `
        <tr>
          <td>${fecha}</td>
          <td style="text-transform: uppercase;">${sale.paymentMethod}</td>
          <td>$${(Number(sale.cashAmount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
          <td>$${(Number(sale.transferAmount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: bold; color: ${esEgreso ? '#ef4444' : '#16a34a'};">
            ${esEgreso ? '-' : ''}$${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    }).join("");

    // 4. Construir el documento HTML completo
    const htmlContent = `
   <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Caja</title>
        <style>
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
          @page { size: A4; margin: 15mm; } 
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; margin: 0; }
          h1, h2 { text-align: center; color: #0f172a; margin-bottom: 10px; }
          
          .summary-container { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            margin-bottom: 25px; 
            margin-top: 20px;
          }
          .summary-box { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0; 
          }
          .summary-box.highlight {
            background: #f0f9ff;
            border-color: #bae6fd;
          }
          .summary-box h3 { 
            margin: 0 0 10px 0; 
            font-size: 13px; 
            text-transform: uppercase; 
            color: #64748b; 
            border-bottom: 1px solid #e2e8f0; 
            padding-bottom: 5px; 
          }
          .summary-box.highlight h3 { color: #0284c7; border-color: #bae6fd; }
          
          .summary-item { 
            display: flex; 
            justify-content: space-between; 
            font-size: 13px; 
            margin-bottom: 6px; 
          }
          .summary-total { 
            display: flex; 
            justify-content: space-between; 
            font-size: 15px; 
            font-weight: bold; 
            margin-top: 10px; 
            padding-top: 10px; 
            border-top: 2px dashed #cbd5e1; 
          }
          
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background-color: #3b82f6; color: white; font-weight: bold; text-transform: uppercase; font-size: 12px; }
          tr:nth-child(even) { background-color: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>Reporte de Caja</h1>
        <p style="text-align: center; color: #64748b; margin-top: 0;">
          Apertura: ${new Date(cashBox.opened_at).toLocaleString('es-AR')} 
          ${cashBox.closed_at ? `<br/>Cierre: ${new Date(cashBox.closed_at).toLocaleString('es-AR')}` : ' - CAJA ABIERTA'}
        </p>

        <!-- TARJETAS DE RESUMEN -->
        <div class="summary-container">
          
          <!-- Columna Ingresos -->
          <div class="summary-box">
            <h3>Ingresos</h3>
            <div class="summary-item">
              <span>Efectivo:</span> 
              <span>$${ingresoEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-item">
              <span>Transferencia:</span> 
              <span>$${ingresoTransferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-total" style="color: #16a34a;">
              <span>Total:</span> 
              <span>$${totalIngreso.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <!-- Columna Egresos -->
          <div class="summary-box">
            <h3>Egresos</h3>
            <div class="summary-item">
              <span>Efectivo:</span> 
              <span>$${Math.abs(egresoEfectivo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-item">
              <span>Transferencia:</span> 
              <span>$${Math.abs(egresoTransferencia).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-total" style="color: #ef4444;">
              <span>Total:</span> 
              <span>$${totalEgreso.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <!-- Columna Balance Neto -->
          <div class="summary-box highlight">
            <h3>Balance en Caja</h3>
            <div class="summary-item">
              <span>Efectivo:</span> 
              <span>$${totalEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-item">
              <span>Transferencia:</span> 
              <span>$${totalTransferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-total" style="color: #0ea5e9; border-color: #93c5fd;">
              <span>Caja Final:</span> 
              <span>$${(totalEfectivo + totalTransferencia).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>
        <h2>Productos Vendidos</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            ${filasProductos || '<tr><td colspan="3" style="text-align:center;">No hay productos vendidos</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
    `;

    // 5. Abrir ventana oculta y disparar la impresión (Genera el PDF en el navegador)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Escribir el contenido HTML en el iframe
    if (iframe.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();

      // Esperar un instante a que el DOM del iframe renderice y mandar a imprimir
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
        
        // Limpiar: Borrar el iframe después de un ratito para no consumir memoria
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    }
  }
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
        <div>
          <button
          onClick={(e)=>{
            e.stopPropagation();
            imprimirPDFLista()}}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#38bdf8',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
            Imprimir PDF
          </button>
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
