import React, { useState, useRef, useEffect, useContext } from 'react';
import { CashRegisterContext } from '../context/cashRegisterContext';
import { openRegister, closeRegister, getTurnSales } from '../service/cashRegsiterService';
import './CategoryStyles.css'; 

// Tipos permitidos para saber qué ventana modal mostrar
type ModalType = 'none' | 'abrir' | 'cerrar';

export const CashRegisterActions = () => {
  // Manejo del menú desplegable del botón principal
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados generales del Modal (cargando, errores, qué modal se ve)
  const [modalType, setModalType] = useState<ModalType>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Guarda lo que escribe el usuario en el input de "Fondo Inicial"
  const [openingAmount, setOpeningAmount] = useState<string>('');

  // Cierre de caja
  const [countedCash, setCountedCash] = useState<string>('');
  const [countedTransfers, setCountedTransfers] = useState<string>('');
  // Estos booleanos controlan si el usuario ya presionó "Confirmar" en cada input
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [transfersConfirmed, setTransfersConfirmed] = useState(false);

  // Aquí guardaremos las ventas reales que traiga la base de datos
  // Inicializan en 0 hasta que el backend nos diga lo contrario
  const [ventasEfectivo, setVentasEfectivo] = useState<number>(0);
  const [ventasTransferencia, setVentasTransferencia] = useState<number>(0);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(false);

  const context = useContext(CashRegisterContext);

  // Si el usuario hace clic fuera del menú se cierra
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Medida de seguridad por si el componente está fuera del Provider
  if (!context) return null; 
  const { activeRegister, loadActiveRegister } = context;

  // Tomamos con cuánto dinero se abrió el turno. Si no hay caja, ponemos 0.
  const fondoInicial = activeRegister ? Number(activeRegister.opening) : 0;
  
  // Lo que se espera que haya (Monto inicial + lo que se vendió)
  const esperadoEfectivo = fondoInicial + ventasEfectivo;
  const esperadoTransferencia = ventasTransferencia;
  const totalFacturado = ventasEfectivo + ventasTransferencia;

  // Calculamos la diferencia entre lo que el usuario contó y lo que dice el sistema.
  // Positivo = Sobra plata | Negativo = Falta plata | Cero = Exacto
  const diffEfectivo = Number(countedCash) - esperadoEfectivo;
  const diffTransferencia = Number(countedTransfers) - esperadoTransferencia;
  const diffTotal = diffEfectivo + diffTransferencia;

  const handleActionClick = async (action: ModalType) => {
    // Cerramos el menú desplegable y limpiamos cualquier estado anterior
    setIsOpen(false);
    setErrorMsg('');
    setOpeningAmount('');
    setCountedCash('');
    setCountedTransfers('');
    setCashConfirmed(false);
    setTransfersConfirmed(false);
    
    // Si el usuario quiere "cerrar" la caja, primero 
    // le preguntamos al backend cuánto se vendió antes de mostrar el modal.
    if (action === 'cerrar' && activeRegister) {
      setIsLoadingSales(true);
      setModalType(action); // Mostramos el modal de inmediato (mostrará "...")
      
      try {
        // Traemos las ventas del backend (o 0 si aún no existe)
        const sales = await getTurnSales(activeRegister.cash_register_id);
        setVentasEfectivo(sales.efectivo || 0);
        setVentasTransferencia(sales.transferencia || 0);
      } catch (error) {
        setErrorMsg('No se pudieron cargar las ventas del turno.');
      } finally {
        setIsLoadingSales(false);
      }
    } else {
      setModalType(action);
    }
  };

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const numericAmount = Number(openingAmount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setErrorMsg('El monto inicial debe ser válido.');
      setIsLoading(false);
      return;
    }

    try {
      await openRegister(numericAmount); // Guarda en base de datos
      await loadActiveRegister();        // Actualiza el botón a "Caja Abierta"
      setModalType('none');              // Cierra el modal
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');

    // Sumamos todo el dinero contado por el empleado para enviarlo como un único total
    const totalCounted = Number(countedCash) + Number(countedTransfers);

    try {
      if (!activeRegister) throw new Error('No hay ninguna caja abierta.');
      
      // Enviamos el ID de la caja y el total final contado al backend
      await closeRegister(activeRegister.cash_register_id, totalCounted); 
      
      await loadActiveRegister(); // Actualiza el botón a "Caja Cerrada"
      setModalType('none');       // Cierra el modal
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pone el signo + o - y la flechita según si sobra o falta dinero
  const formatDiff = (diff: number) => {
    if (diff > 0) return `↗ +$${diff.toFixed(2)}`;
    if (diff < 0) return `↘ -$${Math.abs(diff).toFixed(2)}`;
    return `$0.00`;
  };

  // Devuelve el correspondiente para pintar el valor en verde, rojo o gris
  const getDiffClass = (diff: number) => {
    if (diff > 0) return 'text-diff-positive';
    if (diff < 0) return 'text-diff-negative';
    return 'text-diff-neutral';
  };

  return (
    <>
      <div className="dropdown-container" ref={dropdownRef}>
        <button 
          className="btn-orange" 
          onClick={() => setIsOpen(!isOpen)}
          // Si la caja está abierta lo pintamos oscuro/verde, si no, toma color acento
          style={{ backgroundColor: activeRegister ? '#555843' : 'var(--color-acento)' }}
        >
          {activeRegister ? 'Caja Abierta' : 'Caja Cerrada'} <span className="chevron">⌄</span>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            {/* Si NO hay caja, muestra opción Abrir. Si la HAY, muestra Cerrar. */}
            {!activeRegister ? (
              <button onClick={() => handleActionClick('abrir')} className="dropdown-item">Abrir Caja</button>
            ) : (
              <button onClick={() => handleActionClick('cerrar')} className="dropdown-item danger">Cerrar Caja</button>
            )}
          </div>
        )}
      </div>

      {/* Apertura de caja*/}
      {modalType === 'abrir' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Apertura de Caja</h3>
              <button className="btn-close" onClick={() => setModalType('none')}>✕</button>
            </div>
            <form onSubmit={handleOpenSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label>Monto inicial de apertura ($)</label>
                  <input 
                    type="number" min="0" step="0.01" value={openingAmount} 
                    onChange={(e) => setOpeningAmount(e.target.value)} required
                  />
                </div>
                {errorMsg && <p className="error-text">{errorMsg}</p>}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalType('none')}>Cancelar</button>
                <button type="submit" className="btn-confirm" disabled={isLoading}>
                  {isLoading ? 'Abriendo...' : 'Abrir Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cierre de caja */}
      {modalType === 'cerrar' && (
        <div className="modal-overlay">
          <div className="modal-content modal-close-register">
            <div className="close-header">
              <div className="close-title-area">
                <span className="icon-lock">🔒</span>
                <div>
                  <h3>Cierre de Caja</h3>
                  <p>Turno actual</p>
                </div>
              </div>
              <div className="close-total-area">
                <span className="close-btn-x" onClick={() => setModalType('none')}>✕</span>
                <p>Total facturado</p>
                <h4>${isLoadingSales ? '...' : totalFacturado.toFixed(2)}</h4>
              </div>
            </div>

            <div className="close-body">
              <div className="summary-cards">
                <div className="summary-card fund">
                  <p>Fondo inicial</p>
                  <strong>${fondoInicial.toFixed(2)}</strong>
                </div>
                <div className="summary-card sales-cash">
                  <p>Efectivo ventas</p>
                  <strong>${isLoadingSales ? '...' : ventasEfectivo.toFixed(2)}</strong>
                </div>
                <div className="summary-card sales-transfers">
                  <p>Transferencias</p>
                  <strong>${isLoadingSales ? '...' : ventasTransferencia.toFixed(2)}</strong>
                </div>
              </div>

              {/* cuenta el efectivo */}
              <div className="count-section cash-section">
                <div className="section-header">
                  <span>💵 Efectivo en caja</span>
                  <span>Esperado: <strong>${isLoadingSales ? '...' : esperadoEfectivo.toFixed(2)}</strong></span>
                </div>
                
                {/* Condicional: Si no confirmó, muestra el input. Si confirmó, muestra el resultado y la diferencia. */}
                {!cashConfirmed ? (
                  <div className="count-input-row">
                    <input 
                      type="number" step="0.01" placeholder="$ Monto contado..."
                      value={countedCash} onChange={(e) => setCountedCash(e.target.value)}
                      disabled={isLoadingSales}
                    />
                    <button 
                      className="btn-confirm-count btn-cash"
                      onClick={() => { if(countedCash !== '') setCashConfirmed(true) }}
                      disabled={countedCash === '' || isLoadingSales}
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <div className="count-confirmed-row">
                    <span>✔️ Contado: <strong>${Number(countedCash).toFixed(2)}</strong></span>
                    <span className={`diff-text ${getDiffClass(diffEfectivo)}`}>{formatDiff(diffEfectivo)}</span>
                    <button type="button" className="btn-edit" onClick={() => setCashConfirmed(false)}>Editar</button>
                  </div>
                )}
              </div>

              {/* Cuenta las transferencias */}
              <div className="count-section transfer-section">
                <div className="section-header">
                  <span>📱 Transferencias recibidas</span>
                  <span>Esperado: <strong>${isLoadingSales ? '...' : esperadoTransferencia.toFixed(2)}</strong></span>
                </div>

                {!transfersConfirmed ? (
                  <div className="count-input-row">
                    <input 
                      type="number" step="0.01" placeholder="$ Monto contado..."
                      value={countedTransfers} onChange={(e) => setCountedTransfers(e.target.value)}
                      disabled={isLoadingSales}
                    />
                    <button 
                      className="btn-confirm-count btn-transfer"
                      onClick={() => { if(countedTransfers !== '') setTransfersConfirmed(true) }}
                      disabled={countedTransfers === '' || isLoadingSales}
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <div className="count-confirmed-row">
                    <span>✔️ Contado: <strong>${Number(countedTransfers).toFixed(2)}</strong></span>
                    <span className={`diff-text ${getDiffClass(diffTransferencia)}`}>{formatDiff(diffTransferencia)}</span>
                    <button type="button" className="btn-edit" onClick={() => setTransfersConfirmed(false)}>Editar</button>
                  </div>
                )}
              </div>

              {/* Resultado luego de que se cuenten los metodos de pago */}
              {cashConfirmed && transfersConfirmed && (
                <div className={`total-diff-section ${diffTotal >= 0 ? 'bg-positive' : 'bg-negative'}`}>
                  <div className="total-diff-header">
                    <span>Diferencia total del turno</span>
                    <strong className={getDiffClass(diffTotal)}>{formatDiff(diffTotal)}</strong>
                  </div>
                  <p className="total-diff-msg">
                    {diffTotal > 0 && 'Hay más dinero del esperado en el turno.'}
                    {diffTotal < 0 && 'Falta dinero respecto a lo esperado.'}
                    {diffTotal === 0 && 'El cierre de caja es exacto.'}
                  </p>
                </div>
              )}

              {errorMsg && <p className="error-text text-center">{errorMsg}</p>}
            </div>
            <div className="close-footer">
              <button 
                className="btn-final-close"
                disabled={!cashConfirmed || !transfersConfirmed || isLoading || isLoadingSales}
                onClick={handleCloseSubmit}
              >
                🔒 Cerrar Caja y Nuevo Turno
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};