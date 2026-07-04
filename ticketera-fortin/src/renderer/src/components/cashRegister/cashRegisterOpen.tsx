import React, { useState, useRef, useEffect, useContext } from 'react';
import { CashRegisterContext } from '../context/cashRegisterContext';
import { openRegister } from '../service/cashRegsiterService';
import '../Styles/cashRegisterOpen.css';

export const CashRegisterOpen = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [openingAmount, setOpeningAmount] = useState<string>('');

  const context = useContext(CashRegisterContext);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!context) return null;
  const { activeRegister, loadActiveRegister } = context;

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
      await openRegister(numericAmount);
      await loadActiveRegister();
      setShowModal(false);
      setOpeningAmount('');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="dropdown-container" ref={dropdownRef}>
        <button
          className="btn-orange"
          onClick={() => {
            if (!activeRegister) setIsOpen(!isOpen);
          }}
          style={{
            backgroundColor: activeRegister ? '#555843' : 'var(--color-acento)',
            cursor: activeRegister ? 'default' : 'pointer'
          }}
        >
          {activeRegister ? 'Caja Abierta' : 'Caja Cerrada'}
          {!activeRegister && <span className="chevron">⌄</span>}
        </button>

        {isOpen && !activeRegister && (
          <div className="dropdown-menu">
            <button
              onClick={() => {
                setShowModal(true);
                setIsOpen(false);
              }}
              className="dropdown-item"
            >
              Abrir Caja
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="open-modal-overlay">
          <div className="open-modal-card">

            <div className="open-card-top">
              <button className="open-btn-close-x" onClick={() => setShowModal(false)}>✕</button>

              <div className="open-logo-wrapper">
                {/* AQUÍ VA TU IMAGEN */}
                <img src="/ruta-a-tu-logo.png" alt="Logo Fortín" className="open-logo-img" />
              </div>

              <h2 className="open-title">Fortín Patriotas</h2>
              <p className="open-subtitle">Centro Tradicionalista · Casbas</p>

              <p className="open-date">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <form onSubmit={handleOpenSubmit} className="open-card-bottom">

              <div className="open-input-group">
                <label>Fondo inicial en efectivo ($)</label>
                <div className="open-input-wrapper">
                  <span className="open-currency-symbol">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <p className="open-helper-text">Ingresa el efectivo físico con el que inicias el turno.</p>

              {errorMsg && <p className="open-error-text">{errorMsg}</p>}

              <div className="open-actions">
                <button type="submit" className="open-btn-submit" disabled={isLoading}>
                  {isLoading ? 'Abriendo...' : 'Abrir Caja'}
                </button>
                <button type="button" className="open-btn-cancel" onClick={() => setShowModal(false)}>
                  Ver reportes sin abrir caja
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};