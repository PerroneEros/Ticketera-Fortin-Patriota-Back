import React, { useState, useRef, useEffect, useContext } from 'react';
import { CashRegisterContext } from '../context/cashRegisterContext';
import { openRegister } from '../service/cashRegsiterService';
import '../Styles/home.css';

export const CashRegisterOpen = () => {
  // Manejo del menú desplegable del botón principal
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados generales del Modal
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Guarda lo que escribe el usuario en el input de "Fondo Inicial"
  const [openingAmount, setOpeningAmount] = useState<string>('');

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
      setShowModal(false);               // Cierra el modal
      setOpeningAmount('');              // Limpia el input
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
            // Si la caja ya está abierta, el botón no hace nada (no abre menú)
            if (!activeRegister) setIsOpen(!isOpen);
          }}
          // Si la caja está abierta lo pintamos oscuro/verde y quitamos el cursor de la mano
          style={{ 
            backgroundColor: activeRegister ? '#555843' : 'var(--color-acento)',
            cursor: activeRegister ? 'default' : 'pointer'
          }}
        >
          {activeRegister ? 'Caja Abierta' : 'Caja Cerrada'} 
          {/* Solo muestra la flechita si la caja está cerrada */}
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

      {/* Modal de Apertura de caja */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Apertura de Caja</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
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
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-confirm" disabled={isLoading}>
                  {isLoading ? 'Abriendo...' : 'Abrir Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};