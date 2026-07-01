import { createContext, useContext, useEffect, useState } from 'react'
import { getAllProductsDisable } from '../service/productService'
const productListDisableContext = createContext(null)
export function ProductListProviderDisable({ children }) {
  const [productListDisable, setproductListDisable] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchProductsDisable = async () => {
    setLoading(true)
    try {
      const data = await getAllProductsDisable()
      setproductListDisable(data)
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchProductsDisable()
  }, [])
  return (
    <productListDisableContext.Provider
      value={{ productListDisable, setproductListDisable, loading, fetchProductsDisable }}
    >
      {children}
    </productListDisableContext.Provider>
  )
}
export function useProductListDisable() {
  const context = useContext(productListDisableContext)
  if (!context) {
    throw new Error('productListDisable debe ser usado dentro de un productListProvider')
  }
  return context
}
