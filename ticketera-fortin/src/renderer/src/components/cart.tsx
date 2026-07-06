import toast from 'react-hot-toast'
import { useCartList } from './context/cartListContext'
import { useState } from 'react'
import Method from './method'
import { getCurrentRegister } from './service/cashRegsiterService'
import { salesServiceFront } from './service/salesService'
export default function Cart() {
  const { cartList, updateQuantity, setCartList } = useCartList()
  const [errorMsg, setErrorMsg] = useState('')
  const total = cartList.reduce((acumulador, product) => {
    return acumulador + product.price * (product.quantity || 1)
  }, 0)
  const [showPaymentonMethod, setShowPaymentMethod] = useState(false)
  const handleOpenShowPayment = () => {
    if (cartList.length === 0) {
      setErrorMsg('el carrito esta vacio')
      return
    }
    setShowPaymentMethod(true)
  }
  const handlePrintandSell = async (paymentDetails) => {
    setErrorMsg('')
    console.log('detalle del pago', paymentDetails)
    toast.success('pago confirmado')
    try {
      console.log(paymentDetails.method)
      const cash_register = await getCurrentRegister()
      const newSale = {
        cash_register_id: cash_register.cash_register_id,
        date: new Date(),
        total: total,
        paymentMethod: paymentDetails.method,
        cashAmount: paymentDetails.cashAmount || 0,
        transferAmount: paymentDetails.transferAmount || 0,
        items: cartList.map((prod) => ({
          id_product: prod.id_product,
          quantity: prod.quantity || 1,
          unit_price: prod.price,
          total: prod.price * (prod.quantity || 1),
          printed: true,
          created_at: new Date()
        }))
      }
      await salesServiceFront.createSale(newSale)
      setCartList([])
      setShowPaymentMethod(false)
      toast.success('venta finalizada')
    } catch (error) {
      console.error(error)
      setErrorMsg('Error no se imprimió.')
    }
  }
  return (
    <>
      <div>
        {cartList.map((product) => (
          <div key={product.id_product}>
            <p>
              <b>
                {product.name} (x{product.quantity})
              </b>
            </p>
            <p>
              <b>${product.price * product.quantity}</b>
            </p>
            <button onClick={() => updateQuantity(product.id_product, product.quantity - 1)}>
              -
            </button>
            <button onClick={() => updateQuantity(product.id_product, product.quantity + 1)}>
              +
            </button>
          </div>
        ))}
        <p>
          <b>Total: {total}</b>
        </p>
        <button onClick={handleOpenShowPayment}>Imprimir ticket</button>
        {errorMsg && <p className="error-text">{errorMsg}</p>}
      </div>
      {showPaymentonMethod && (
        <Method
          total={total}
          onClose={() => setShowPaymentMethod(false)}
          onConfirm={handlePrintandSell}
        />
      )}
    </>
  )
}
