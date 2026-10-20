import toast from 'react-hot-toast'
import { useCartList } from './context/cartListContext'
import { useState } from 'react'
import Method from './method'
import { salesServiceFront } from './service/salesService'
import './Styles/cart.css'

export default function Cart() {
  const { cartList, updateQuantity, setCartList } = useCartList()
  const [errorMsg, setErrorMsg] = useState('')
  const total = cartList.reduce((acumulador, product) => {
    return acumulador + product.price * (product.quantity || 1)
  }, 0)
  const [showPaymentonMethod, setShowPaymentMethod] = useState(false)

  const handleOpenShowPayment = () => {
    if (cartList.length === 0) {
      setErrorMsg('El carrito esta vacio')
      return
    }
    setShowPaymentMethod(true)
  }

  const handlePrintandSell = async (paymentDetails) => {
    setErrorMsg('')
    try {
      await salesServiceFront.createSale({
        paymentMethod: paymentDetails.method,
        cashAmount: paymentDetails.cashAmount || 0,
        transferAmount: paymentDetails.transferAmount || 0,
        expectedTotal: total,
        items: cartList.map((prod) => ({
          id_product: prod.id_product,
          quantity: prod.quantity || 1
        }))
      })
      setCartList([])
      setShowPaymentMethod(false)
      toast.success('Venta registrada')
    } catch (error) {
      console.error(error)
      const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message
      const message = apiMessage || 'Error: no se pudo registrar la venta.'
      // The payment modal covers the cart, so the reason is also shown as a toast
      toast.error(message)
      setErrorMsg(message)
    }
  }

  return (
    <>
      <div className="cart-container">
        {/* Cabecera del ticket */}
        <div className="cart-header">
          <span className="cart-icon">🧾</span>
          <h3>Ticket Actual</h3>
        </div>

        {/* Lista de productos (con scroll si hay muchos) */}
        <div className="cart-items-wrapper">
          {cartList.length === 0 ? (
            <div className="cart-empty-state">
              <p>
                Selecciona productos
                <br />
                para agregar al ticket
              </p>
            </div>
          ) : (
            cartList.map((product) => (
              <div key={product.id_product} className="cart-item">
                <div className="cart-item-info">
                  <p className="cart-item-name">{product.name}</p>
                  <p className="cart-item-price">
                    ${(product.price * product.quantity).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="cart-item-controls">
                  <button onClick={() => updateQuantity(product.id_product, product.quantity - 1)}>
                    -
                  </button>
                  <span className="cart-item-qty">{product.quantity}</span>
                  <button onClick={() => updateQuantity(product.id_product, product.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie del ticket: Total y Botones */}
        <div className="cart-footer">
          {errorMsg && <p className="cart-error-text">{errorMsg}</p>}
          <div className="cart-total-row">
            <span>Total a pagar:</span>
            <span className="cart-total-amount">${total.toLocaleString('es-AR')}</span>
          </div>

          <div className="cart-actions">
            <button
              className="btn-clear-cart"
              onClick={() => setCartList([])}
              disabled={cartList.length === 0}
            >
              Limpiar
            </button>
            <button
              className="btn-charge-cart"
              onClick={handleOpenShowPayment}
              disabled={cartList.length === 0}
            >
              Cobrar
            </button>
          </div>
        </div>
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
