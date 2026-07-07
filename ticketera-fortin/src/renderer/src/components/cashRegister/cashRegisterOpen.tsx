import React, { useState, useRef, useEffect, useContext } from 'react';
Wimport { useNavigate } from 'react-router-dom';
import { CashRegisterContext } from '../context/cashRegisterContext';
import { openRegister } from '../service/cashRegsiterService';
import '../Styles/cashRegisterOpen.css';

export const CashRegisterOpen = () => {
  const navigate = useNavigate();

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
          <div className="login-card">

            <div className="card-header-black">
              <button className="open-btn-close-x" onClick={() => setShowModal(false)}>✕</button>

              <img src="/ruta-a-tu-logo.png" alt="Logo Fortín" className="home-logo" />

              <h2 className="home-title">Fortín Patriotas</h2>
              <p className="home-subtitle">Centro Tradicionalista · Casbas</p>

              <p className="home-date">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <form onSubmit={handleOpenSubmit} className="card-body-white open-register-form">

              <div>
                <label className="input-label">Fondo inicial en efectivo ($)</label>
                <div className="input-container">
                  <span className="open-currency-symbol">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="amount-input"
                  />
                </div>
              </div>

              <p className="input-helper">Ingresa el efectivo físico con el que inicias el turno.</p>

              {errorMsg && <p className="open-error-text">{errorMsg}</p>}

              <div className="open-actions">
                <button type="submit" className="btn-open-register" disabled={isLoading}>
                  {isLoading ? 'Abriendo...' : 'Abrir Caja'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigate('/resumen')}>
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