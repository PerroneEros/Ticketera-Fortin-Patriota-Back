import axios from 'axios'
const API_URL = 'http://localhost:34567/api'
export const getAllProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`)
    return response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}
export const getAllProductsDisable = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/disable`)
    return response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}
export const createProducts = async (productData: any) => {
  try {
    const response = await axios.post(`${API_URL}/products`, productData)
    return response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}
export const editProducts = async (id: number, productData: any) => {
  try {
    const response = await axios.put(`${API_URL}/products/${id}`, productData)
    return response.data
  } catch (error) {
    console.error(`Error updating product ${id}:`, error)
    throw error
  }
}

export const deleteProducts = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/products/${id}`)
    return response.data
  } catch (error) {
    console.error('error eliminando producto', error)
    throw error
  }
}
export const reactivateProducts = async (id: number) => {
  try {
    const response = await axios.put(`${API_URL}/products/activate/${id}`)
    return response.data
  } catch (error) {
    console.error('error activando el  producto', error)
    throw error
  }
}
