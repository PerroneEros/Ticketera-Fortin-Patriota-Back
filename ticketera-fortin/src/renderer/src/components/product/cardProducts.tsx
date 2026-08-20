import { useProductList } from '../context/productListContext'
import { useContext } from 'react'
import { CategoryContext } from '../context/categoryContext'
import '../Styles/products.css'
import '../Styles/productModals.css'
import { useCartList } from '../context/cartListContext'

export default function CardProducts() {
  const { productList, loading } = useProductList()
  const context = useContext(CategoryContext)
  const { addOrUpdateItem } = useCartList()
  // en caso de que tarde en cargar category evita que todo explote
  if (!context) return null
  const { activeCategory } = context

  let productFilter
  if (activeCategory == null) {
    productFilter = productList
  } else {
    productFilter = productList.filter((prod) => prod.category_id == activeCategory)
  }

  return (
    <>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        productFilter.map((product) => (
          <div
            key={product.id_product}
            className="product-card"
            onClick={() => addOrUpdateItem(product)}
          >
            <div className="product-name">
              <b>{product.name}</b>
            </div>
            <div className="product-price">$ {product.price.toLocaleString('es-AR')}</div>
            <div className="product-category">
              {product.Category ? product.Category.name : 'Sin categoría'}
            </div>
          </div>
        ))
      )}
    </>
  )
}
