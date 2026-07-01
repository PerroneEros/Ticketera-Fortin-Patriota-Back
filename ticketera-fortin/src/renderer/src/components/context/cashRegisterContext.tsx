import { createContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentRegister } from '../service/cashRegsiterService';

// Tipado de la caja para TypeScript
export interface CashRegister {
  cash_register_id: number; 
  opening: number;
  closing: number;
  status: 'open' | 'closed';
  opened_at: string;
}

// Lo que este contexto compartirá con el resto de la aplicación
interface CashRegisterContextType {
  activeRegister: CashRegister | null;
  loadActiveRegister: () => Promise<void>;
}

export const CashRegisterContext = createContext<CashRegisterContextType | undefined>(undefined);

export const CashRegisterProvider = ({ children }: { children: ReactNode }) => {
  // Estado principal: Si tiene datos, hay caja abierta. Si es null, está cerrada.
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);

  // Función que llama a la base de datos para sincronizar el estado real de la caja
  const loadActiveRegister = async () => {
    try {
      const data = await getCurrentRegister();
      setActiveRegister(data || null);
    } catch (error) {
      console.error('Error al cargar la caja activa:', error);
    }
  };

  // Se ejecuta automáticamente 1 sola vez cuando la aplicación se carga
  useEffect(() => {
    loadActiveRegister();
  }, []);

  return (
    <CashRegisterContext.Provider value={{ activeRegister, loadActiveRegister }}>
      {children}
    </CashRegisterContext.Provider>
  );
};