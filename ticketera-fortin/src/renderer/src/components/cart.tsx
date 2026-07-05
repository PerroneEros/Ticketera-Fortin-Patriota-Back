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
    toast.success('pago confirmado', paymentDetails)
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
      let ticketHTML = `
   <html>
        <head>
          <style>
            body { 
              font-family: monospace; /* Letra de ticket */
              width: 80mm; /* Ancho típico de ticketera */
              margin: 0; 
              padding: 0;
              color: black;
              font-size: 15px
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .divider { border-bottom: 1px dashed black; margin: 10px 0; }
            /*Esta clase obliga a que el contenido siguiente vaya en otro ticket*/
            .ticket-page { 
              page-break-after: always; 
              padding-bottom: 10px;
            }
          </style>
        </head>
        <body>
    `
      //recorre la lista para agregarla al ticket
      cartList.forEach((prod) => {
        //Por cada producto repetimos el diseño según su cantidad
        for (let i = 0; i < prod.quantity; i++) {
          ticketHTML += `
          <div class="ticket-page">
            <div class="center">
              <h2>Fortin</h2>
            </div>
            <div class="divider"></div>
            <div class="center">
              <h2>1x ${prod.name}</h2>
            </div>
            <div class="divider"></div>
            <div class="center">
              <p>Válido por un canje</p>
            </div>
          </div>
        `
        }
      })
      // cierre del ticket
      ticketHTML += `
        </body>
      </html>
    `
      //abre la ventana de impresion usamos iframe y no windows.print porque da error
      //iframe abre una ventana virtual que no se ve en pantalla
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)

      // 2. Le inyectamos tu ticketHTML adentro
      iframe.contentDocument.write(ticketHTML)
      iframe.contentDocument.close()

      // 3. Le decimos que apenas termine de cargar, mande a imprimir
      iframe.onload = () => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()

        // 4. Limpiamos la basura: después de 1 segundo, borramos el iframe invisible
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }
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
