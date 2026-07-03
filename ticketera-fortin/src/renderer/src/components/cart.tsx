import { useCartList } from './context/cartListContext'
export default function Cart() {
  const { cartList, updateQuantity } = useCartList()
  const total = cartList.reduce((acumulador, product) => {
    return acumulador + product.price * (product.quantity || 1)
  }, 0)
  return (
    <>
      <div>
        {cartList.map((product, index) => (
          <div key={index}>
            <p>
              <b>{product.name}</b>
            </p>
            <p>
              <b>${product.price}</b>
            </p>
            <button onClick={() => updateQuantity(product.id_product, product.quantity - 1)}>
              -
            </button>
            <button onClick={() => updateQuantity(product.id_product, product.quantity + 1)}>
              +
            </button>
          </div>
        ))}
        <p>Total: {total}</p>
      </div>
    </>
  )
}
