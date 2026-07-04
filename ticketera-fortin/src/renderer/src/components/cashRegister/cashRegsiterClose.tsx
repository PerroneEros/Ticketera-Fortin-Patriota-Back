import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CashRegisterContext } from '../context/cashRegisterContext';
import { closeRegister, getTurnSales } from '../service/cashRegsiterService';
import '../Styles/cashRegisterClose.css';

export const CashRegisterClose = () => {
  const navigate = useNavigate();

  // Estados generales del Modal
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Variables de lo que cuenta físicamente el empleado
  const [countedCash, setCountedCash] = useState<string>('');
  const [countedTransfers, setCountedTransfers] = useState<string>('');

  // Booleanos de confirmación
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [transfersConfirmed, setTransfersConfirmed] = useState(false);

  // Ventas desde la BD
  const [ventasEfectivo, setVentasEfectivo] = useState<number>(0);
  const [ventasTransferencia, setVentasTransferencia] = useState<number>(0);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(false);

  // Contexto
  const context = useContext(CashRegisterContext);

  if (!context) return null;
  const { activeRegister, loadActiveRegister } = context;

  const fondoInicial = activeRegister ? Number(activeRegister.opening) : 0;
  const esperadoEfectivo = fondoInicial + ventasEfectivo;
  const esperadoTransferencia = ventasTransferencia;
  const totalFacturado = ventasEfectivo + ventasTransferencia;

  const diffEfectivo = Number(countedCash) - esperadoEfectivo;
  const diffTransferencia = Number(countedTransfers) - esperadoTransferencia;
  const diffTotal = diffEfectivo + diffTransferencia;

  const handleOpenCloseModal = async () => {
    setErrorMsg('');
    setCountedCash('');
    setCountedTransfers('');
    setCashConfirmed(false);
    setTransfersConfirmed(false);

    if (activeRegister) {
      setIsLoadingSales(true);
      setShowModal(true);

      try {
        const sales = await getTurnSales(activeRegister.cash_register_id);
        setVentasEfectivo(sales.efectivo || 0);
        setVentasTransferencia(sales.transferencia || 0);
      } catch (error) {
        setErrorMsg('No se pudieron cargar las ventas del turno.');
      } finally {
        setIsLoadingSales(false);
      }
    }
  };

  const handleCloseSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');

    const totalCounted = Number(countedCash) + Number(countedTransfers);

    try {
      if (!activeRegister) throw new Error('No hay ninguna caja abierta.');

      await closeRegister(activeRegister.cash_register_id, totalCounted);
      await loadActiveRegister();
      setShowModal(false);

      navigate('/');

    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDiff = (diff: number) => {
    if (diff > 0) return `↗ +$${diff.toFixed(2)}`;
    if (diff < 0) return `↘ -$${Math.abs(diff).toFixed(2)}`;
    return `$0.00`;
  };

  const getDiffClass = (diff: number) => {
    if (diff > 0) return 'text-diff-positive';
    if (diff < 0) return 'text-diff-negative';
    return 'text-diff-neutral';
  };

  return (
    <>
      {/* 2. BOTÓN LIMPIO SIN CSS EN LÍNEA */}
      {activeRegister && (
        <button
          className="close-btn-header-close"
          onClick={handleOpenCloseModal}
        >
          Cerrar Caja
        </button>
      )}

      {/* VENTANA MODAL: ARQUEO Y CIERRE DE CAJA */}
      {showModal && (
        <div className="close-modal-overlay">
          <div className="close-modal-content">

            <div className="close-header">
              <div className="close-title-area">
                <span className="close-icon-lock">🔒</span>
                <div>
                  <h3>Cierre de Caja</h3>
                  <p>Turno actual</p>
                </div>
              </div>
              <div className="close-total-area">
                <span className="close-btn-x" onClick={() => setShowModal(false)}>✕</span>
                <p>Total facturado</p>
                <h4>${isLoadingSales ? '...' : totalFacturado.toFixed(2)}</h4>
              </div>
            </div>

            <div className="close-body">
              <div className="close-summary-cards">
                <div className="close-summary-card close-fund">
                  <p>Fondo inicial</p>
                  <strong>${fondoInicial.toFixed(2)}</strong>
                </div>
                <div className="close-summary-card close-sales-cash">
                  <p>Efectivo ventas</p>
                  <strong>${isLoadingSales ? '...' : ventasEfectivo.toFixed(2)}</strong>
                </div>
                <div className="close-summary-card close-sales-transfers">
                  <p>Transferencias</p>
                  <strong>${isLoadingSales ? '...' : ventasTransferencia.toFixed(2)}</strong>
                </div>
              </div>

              <div className="close-count-section close-cash-section">
                <div className="close-section-header">
                  <span>💵 Efectivo en caja</span>
                  <span>Esperado: <strong>${isLoadingSales ? '...' : esperadoEfectivo.toFixed(2)}</strong></span>
                </div>

                {!cashConfirmed ? (
                  <div className="close-count-input-row">
                    <input
                      type="number" step="0.01" placeholder="$ Monto contado..."
                      value={countedCash} onChange={(e) => setCountedCash(e.target.value)}
                      disabled={isLoadingSales}
                    />
                    <button
                      className="close-btn-confirm-count close-btn-cash"
                      onClick={() => { if (countedCash !== '') setCashConfirmed(true) }}
                      disabled={countedCash === '' || isLoadingSales}
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <div className="close-count-confirmed-row">
                    <span className="close-confirmed-text">
                      <span className="close-check-icon">✓</span> Contado: <strong>${Number(countedCash).toFixed(2)}</strong>
                    </span>
                    <div className="close-confirmed-actions">
                      <span className={`close-diff-text ${getDiffClass(diffEfectivo)}`}>{formatDiff(diffEfectivo)}</span>
                      <button type="button" className="close-btn-edit" onClick={() => setCashConfirmed(false)}>Editar</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="close-count-section close-transfer-section">
                <div className="close-section-header">
                  <span>📱 Transferencias recibidas</span>
                  <span>Esperado: <strong>${isLoadingSales ? '...' : esperadoTransferencia.toFixed(2)}</strong></span>
                </div>

                {!transfersConfirmed ? (
                  <div className="close-count-input-row">
                    <input
                      type="number" step="0.01" placeholder="$ Monto contado..."
                      value={countedTransfers} onChange={(e) => setCountedTransfers(e.target.value)}
                      disabled={isLoadingSales}
                    />
                    <button
                      className="close-btn-confirm-count close-btn-transfer"
                      onClick={() => { if (countedTransfers !== '') setTransfersConfirmed(true) }}
                      disabled={countedTransfers === '' || isLoadingSales}
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <div className="close-count-confirmed-row">
                    <span className="close-confirmed-text">
                      <span className="close-check-icon">✓</span> Contado: <strong>${Number(countedTransfers).toFixed(2)}</strong>
                    </span>
                    <div className="close-confirmed-actions">
                      <span className={`close-diff-text ${getDiffClass(diffTransferencia)}`}>{formatDiff(diffTransferencia)}</span>
                      <button type="button" className="close-btn-edit" onClick={() => setTransfersConfirmed(false)}>Editar</button>
                    </div>
                  </div>
                )}
              </div>

              {cashConfirmed && transfersConfirmed && (
                <div className={`close-total-diff-section ${diffTotal >= 0 ? 'close-bg-positive' : 'close-bg-negative'}`}>
                  <div className="close-total-diff-header">
                    <span>Diferencia total del turno</span>
                    <strong className={getDiffClass(diffTotal)}>{formatDiff(diffTotal)}</strong>
                  </div>
                  <p className="close-total-diff-msg">
                    {diffTotal > 0 && 'Hay más dinero del esperado en el turno.'}
                    {diffTotal < 0 && 'Falta dinero respecto a lo esperado.'}
                    {diffTotal === 0 && 'El cierre de caja es exacto.'}
                  </p>
                </div>
              )}

              {errorMsg && <p className="close-error-text text-center">{errorMsg}</p>}
            </div>

            <div className="close-footer">
              <button
                className="close-btn-final-close"
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