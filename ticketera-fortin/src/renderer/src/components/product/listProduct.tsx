import { useProductList } from '../context/productListContext'
export default function ListProducts() {
  const { productList, loading } = useProductList()
  const product = productList
  return (
    <>
      {loading ? (
        <p>cargando...</p>
      ) : (
        <>
          {product.map((product) => (
            <li key={product.id_product}>
              <div>
                <p>
                  <b>{product.name}</b>
                </p>
              </div>
              <div>{product.price}</div>
              <div>{product.Category ? product.Category.name : 'Sin categoría'}</div>
            </li>
          ))}
        </>
      )}
    </>
  )
}
