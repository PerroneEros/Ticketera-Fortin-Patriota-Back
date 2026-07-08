import axios from 'axios';

const API_URL = 'http://localhost:34567/api/cash-registers';

// 1. Obtiene la caja que está actualmente abierta (si existe)
export const getCurrentRegister = async () => {
  const response = await axios.get(`${API_URL}/current`);
  return response.data; 
};

// 2. Trae TODAS las cajas filtradas por un rango de fechas (para el Dashboard)
export const getRegistersByDateRange = async (from: string, to: string) => {
  const response = await axios.get(API_URL, {
    params: { from, to }
  });
  return response.data;
};

// 3. Abre un nuevo turno de caja con un monto inicial
export const openRegister = async (openingAmount: number) => {
  const response = await axios.post(`${API_URL}/open`, { opening: openingAmount });
  return response.data;
};

// 4. Cierra el turno de caja enviando la plata final contada
export const closeRegister = async (id: number | string, closingAmount: number) => {
  const response = await axios.put(`${API_URL}/close/${id}`, { closing: closingAmount });
  return response.data;
};

// 5. Busca los totales en efectivo y transferencia de una caja específica
export const getTurnSales = async (id: number | string) => {
  try {
    const response = await axios.get(`${API_URL}/totals/${id}`);
    return response.data; 
  } catch (error) {
    console.error("Error al obtener totales:", error);
    return { efectivo: 0, transferencia: 0 };
  }
};

// 6. Registra un movimiento pegándole a la ruta de movements
export const registerMovement = async (data: { type: string, amount: number, description: string, method: string, date: string }) => {
  const response = await axios.post('http://localhost:34567/api/movements', data);
  return response.data;
};