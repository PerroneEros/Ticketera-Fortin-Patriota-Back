import toast from 'react-hot-toast'
import { useProductListDisable } from '../context/productListDisableContext'
import { reactivateProducts } from '../service/productService'
import { useProductList } from '../context/productListContext'
import '../Styles/activateProduct.css' // Asegúrate de importar el nuevo CSS

export default function ListActivateProducts() {
  const { productListDisable, loading, fetchProductsDisable } = useProductListDisable()
  const { fetchProducts } = useProductList()

  const activate = async (id: number) => {
    if (!window.confirm('¿Estás seguro de habilitar este producto?')) return
    try {
      await reactivateProducts(id)
      toast.success('Producto habilitado correctamente')
      await fetchProductsDisable()
      await fetchProducts()
    } catch (error) {
      console.error(error)
      toast.error('Error al habilitar el producto')
    }
  }

  return (
    <ul className="Card-ProductsList">
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          {productListDisable.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '20px' }}>No hay productos para habilitar</p>
          ) : (
            productListDisable.map((product) => (
              <li key={product.id_product} className="activate-item">
                <div><b>{product.name}</b></div>
                <div>$ {product.price}</div>
                <div>{product.Category ? product.Category.name : 'Sin categoría'}</div>
                <div className="status-badge">Desactivado</div>
                <div>
                  <button className="btn-activate" onClick={() => activate(product.id_product)}>
                    Habilitar
                  </button>
                </div>
              </li>
            ))
          )}
        </>
      )}
    </ul>
  )
}