import { useProductList } from '../context/productListContext'
export default function CardProducts() {
  const { productList, loading } = useProductList()
  const product = productList
  return (
    <>
      {loading ? (
        <p>cargando...</p>
      ) : (
        <>
          {product.map((product) => (
            <div key={product.id_product}>
              <div>
                <p>
                  <b>{product.name}</b>
                </p>
              </div>
              <div>{product.price}</div>
              <div>{product.Category ? product.Category.name : 'Sin categoría'}</div>
            </div>
          ))}
        </>
      )}
    </>
  )
}
