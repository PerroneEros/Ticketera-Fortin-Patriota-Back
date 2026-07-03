import axios from 'axios'

const API_URL = 'http://localhost:34567/api/sales'

export const salesServiceFront = {
  // Traer todas las ventas
  async getSales() {
    const response = await axios.get(API_URL)
    return response.data 
  },

  // Filtrar ventas por fecha (Día, Semana, Mes)
  async getSalesByFilter(filter: string) {
    const response = await axios.get(API_URL, {
      params: { filter }
    })
    return response.data
  }
}