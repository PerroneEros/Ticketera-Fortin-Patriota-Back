import toast from 'react-hot-toast'
import { useProductList } from '../context/productListContext'
import { deleteProducts } from '../service/productService'
import { useProductListDisable } from '../context/productListDisableContext'
export default function ListProducts() {
  const { productList, loading, fetchProducts } = useProductList()
  const { fetchProductsDisable } = useProductListDisable()
  const product = productList
  const eliminateProduct = async (id) => {
    if (!window.confirm('¿Estas seguro de deshabilitar este producto?')) {
      return
    }
    try {
      await deleteProducts(id)
      toast.success('producto eliminado correctamente')
      await fetchProducts()
      await fetchProductsDisable()
    } catch (error) {
      console.error(error)
      toast.error('Error al eliminar el producto')
    }
  }
  return (
    <>
      {loading ? (
        <p>cargando...</p>
      ) : (
        <>
          {product.map((product) => (
            <li key={product.id_product}>
              <div>
                <button>editar</button>
                <button onClick={() => eliminateProduct(product.id_product)}>deshabilitar</button>
                <p>
                  <b>{product.name}</b>
                </p>
              </div>
              <div>{product.price}</div>
              <div>{product.Category ? product.Category.name : 'Sin categoría'}</div>
              <div>{product.isActive ? 'activado' : 'desactivado'}</div>
            </li>
          ))}
        </>
      )}
    </>
  )
}
