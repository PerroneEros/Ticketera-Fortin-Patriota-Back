import { useState } from 'react'
import toast from 'react-hot-toast'
import { useProductList } from '../context/productListContext'
import { useProductListDisable } from '../context/productListDisableContext'
import { deleteProducts, reactivateProducts } from '../service/productService'
import EditProduct from './editProduct'
import '../Styles/productList.css'
import WindowConfirm from '../windowConfirm'

export default function ListProducts() {
  const { productList, loading, fetchProducts } = useProductList()
  const { productListDisable, fetchProductsDisable } = useProductListDisable()
  const [filter, setFilter] = useState('active')
  const [productToEdit, setProductToEdit] = useState(null)
  const [productToToggle, setProductToToggle] = useState(null)
  const handleOpenConfirm = (p) => {
    setProductToToggle(p)
  }
  const handleToggle = async () => {
    if (!productToToggle) return
    try {
      if (productToToggle.isActive) {
        await deleteProducts(productToToggle.id_product)
        toast.success('Producto desactivado')
      } else {
        await reactivateProducts(productToToggle.id_product)
        toast.success('Producto habilitado')
      }
      await fetchProducts()
      await fetchProductsDisable()
    } catch {
      toast.error('Error al actualizar estado')
    } finally {
      setProductToToggle(null)
    }
  }

  const currentList = filter === 'active' ? productList : productListDisable

  return (
    <>
      <div className="filter-container">
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Activos
        </button>
        <button
          className={`filter-btn ${filter === 'disabled' ? 'active' : ''}`}
          onClick={() => setFilter('disabled')}
        >
          Desactivados
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((p) => (
              <tr key={p.id_product} className={!p.isActive ? 'product-row-disabled' : ''}>
                <td>
                  <b>{p.name}</b>
                </td>
                <td>$ {p.price}</td>
                <td>{p.Category?.name || 'Sin categoría'}</td>
                <td>{p.isActive ? '✅ Activo' : '❌ Desactivado'}</td>
                <td>
                  {p.isActive && <button onClick={() => setProductToEdit(p)}>Editar</button>}
                  <button onClick={() => handleOpenConfirm(p)}>
                    {p.isActive ? 'Desactivar' : 'Habilitar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {productToEdit && (
        <EditProduct
          product={productToEdit}
          onClose={() => {
            setProductToEdit(null)
            fetchProducts()
          }}
        />
      )}
      {productToToggle && (
        <WindowConfirm
          text={productToToggle.isActive ? 'desactivar este producto' : 'habilitar este producto'}
          onCancel={() => setProductToToggle(null)}
          onConfirm={handleToggle}
        />
      )}
    </>
  )
}
