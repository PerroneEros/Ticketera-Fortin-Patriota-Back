import axios from 'axios';
const API_URL = 'http://localhost:34567/api/cash-registers';

// Pide al backend la caja actualmente abierta (si existe).
// Retorna el objeto de la caja o 'null' si están todas cerradas.
export const getCurrentRegister = async () => {
  const response = await axios.get(`${API_URL}/current`);
  return response.data; 
};

// Envía el monto inicial para abrir una nueva caja.
export const openRegister = async (openingAmount: number) => {
  const response = await axios.post(`${API_URL}/open`, { opening: openingAmount });
  return response.data;
};

// Envía el ID de la caja activa y el total contado (efectivo + transferencias)
// para cerrar el turno definitivamente.
export const closeRegister = async (id: number | string, closingAmount: number) => {
  const response = await axios.put(`${API_URL}/close/${id}`, { closing: closingAmount });
  return response.data;
};

// Busca las ventas del turno actual
export const getTurnSales = async (id: number | string) => {
  try {
    // En el futuro, el backend sumará todas las ventas y responderá a esta ruta ( cuanto en efectivo y cuanto en transferencia hay en la caja)
    const response = await axios.get(`${API_URL}/${id}/sales`);
    return response.data; 
  } catch (error) {
    console.error("Error al obtener ventas, usando valores por defecto", error);
    // IMPORTANTE: Como esta ruta aún no existe en el backend, el 'catch' atrapará
    // el error 404 y devolverá 0 en ambas ventas.
    // Esto evita que React se rompa y te permite seguir diseñando en paz.
    return { efectivo: 0, transferencia: 0 }; 
  }
};