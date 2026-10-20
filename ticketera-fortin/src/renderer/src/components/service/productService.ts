import { apiClient } from './apiClient'

interface ProductData {
  name: string
  price: number
  category_id: number
}

export const getAllProducts = async () => {
  try {
    const response = await apiClient.get('/products')
    return response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}
export const getAllProductsDisable = async () => {
  try {
    const response = await apiClient.get('/products/disable')
    return response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}
export const createProducts = async (productData: ProductData) => {
  try {
    const response = await apiClient.post('/products', productData)
    return response.data
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}
export const editProducts = async (id: number, productData: Partial<ProductData>) => {
  try {
    const response = await apiClient.put(`/products/${id}`, productData)
    return response.data
  } catch (error) {
    console.error(`Error updating product ${id}:`, error)
    throw error
  }
}

export const deleteProducts = async (id: number) => {
  try {
    const response = await apiClient.delete(`/products/${id}`)
    return response.data
  } catch (error) {
    console.error('error eliminando producto', error)
    throw error
  }
}
export const reactivateProducts = async (id: number) => {
  try {
    const response = await apiClient.put(`/products/activate/${id}`)
    return response.data
  } catch (error) {
    console.error('error activando el  producto', error)
    throw error
  }
}
