import toast from 'react-hot-toast'
import { useProductListDisable } from '../context/productListDisableContext'
import { reactivateProducts } from '../service/productService'
import { useProductList } from '../context/productListContext'

export default function ListActivateProducts() {
  const { productListDisable, loading, fetchProductsDisable } = useProductListDisable()
  const { fetchProducts } = useProductList()
  const product = productListDisable
  const activate = async (id) => {
    if (!window.confirm('¿Estas seguro de habilitar este producto?')) {
      return
    }
    try {
      await reactivateProducts(id)
      toast.success('producto habilitado correctamente')
      await fetchProductsDisable()
      await fetchProducts()
    } catch (error) {
      console.error(error)
      toast.error('Error al habilitar el producto')
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
                <button onClick={() => activate(product.id_product)}>habilitar producto</button>
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
