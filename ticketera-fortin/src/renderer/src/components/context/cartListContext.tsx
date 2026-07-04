import { createContext, useState, useContext } from 'react'
import toast from 'react-hot-toast'

const CartListContext = createContext()
export default function CartListProvider({ children }) {
  const [cartList, setCartList] = useState([])
  const addOrUpdateItem = (productToAdd) => {
    const existingItemIndex = cartList.findIndex(
      (item) => item.id_product === productToAdd.id_product
    )
    if (existingItemIndex > -1) {
      const currenQuantity = cartList[existingItemIndex].quantity || 1

      const newCart = cartList.map((item, index) => {
        if (index == existingItemIndex) {
          return { ...item, quantity: currenQuantity + 1 }
        }
        return item
      })
      setCartList(newCart)
      toast.success('Cantidad actualizada en el carrito')
    } else {
      const newItem = { ...productToAdd, quantity: 1 }
      setCartList([...cartList, newItem])
      toast.success('Producto añadido al carrito')
    }
  }
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartList(cartList.filter((item) => item.id_product !== productId))
    } else {
      setCartList(
        cartList.map((item) =>
          item.id_product === productId ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }
  return (
    <CartListContext.Provider value={{ cartList, setCartList, addOrUpdateItem, updateQuantity }}>
      {children}
    </CartListContext.Provider>
  )
}

export function useCartList() {
  const context = useContext(CartListContext)
  if (!context) throw new Error('cartList debe ser usado dentro de un cartListProvider')

  return context
}
