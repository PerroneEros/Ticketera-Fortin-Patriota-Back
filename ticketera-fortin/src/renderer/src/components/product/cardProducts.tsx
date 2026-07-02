import { useProductList } from '../context/productListContext'
import { useContext } from 'react'
import { CategoryContext } from '../context/categoryContext'
export default function CardProducts() {
  const { productList, loading } = useProductList()
  let productFilter
  const context = useContext(CategoryContext)
  const { activeCategory } = context
  if (activeCategory == null) {
    productFilter = productList
  } else {
    productFilter = productList.filter((prod) => prod.category_id == activeCategory)
  }
  return (
    <>
      {loading ? (
        <p>cargando...</p>
      ) : (
        <>
          {productFilter.map((product) => (
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
