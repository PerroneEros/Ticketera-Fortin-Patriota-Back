import axios from 'axios'

const API_URL = 'http://localhost:34567/api/sales'

export const salesServiceFront = {
  async getSales() {
    const response = await axios.get(API_URL)
    return response.data
  },
  async getSalesByFilter(filter: string) {
    const response = await axios.get(API_URL, {
      params: { filter }
    })
    return response.data
  },
  
  async getSalesByDateRange(from: string, to: string) {
    const response = await axios.get(API_URL, {
      params: { from, to }
    })
    return response.data
  },
  async createSale(saleData: any) {
    try {
      const response = await axios.post(API_URL, saleData)
      return response.data
    } catch (error) {
      console.error('error activando el  producto', error)
      throw error
    }
  }
}