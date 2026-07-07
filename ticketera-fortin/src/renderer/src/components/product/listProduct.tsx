import { useState } from 'react'
import toast from 'react-hot-toast'
import { useProductList } from '../context/productListContext'
import { useProductListDisable } from '../context/productListDisableContext'
import { deleteProducts, reactivateProducts } from '../service/productService'
import EditProduct from './editProduct'
import '../Styles/products.css'
import WindowConfirm from '../windowConfirm'
export default function ListProducts() {
  const { productList, loading, fetchProducts } = useProductList()
  const { productListDisable, fetchProductsDisable } = useProductListDisable()
  const [filter, setFilter] = useState('active')
  const [productToEdit, setProductToEdit] = useState(null)
  const [productToToggle, setProductToToggle] = useState(null)
  const handleOpenConfirm = (p: any) => {
    setProductToToggle(p)
  }
  const handleToggle = async (p: any) => {
    if (!productToToggle) return
    try {
      if (productToToggle.isActive) {
        await deleteProducts(productToToggle.id_product)
        toast.success('Producto deshabilitado')
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
          Habilitados
        </button>
        <button
          className={`filter-btn ${filter === 'disabled' ? 'active' : ''}`}
          onClick={() => setFilter('disabled')}
        >
          Deshabilitados
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-scroll-wrapper">
          <table className="admin-product-table">
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
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state-row">
                    📦 No hay productos para mostrar en esta lista.
                  </td>
                </tr>
              ) : (
                currentList.map((p: any) => (
                  <tr key={p.id_product} className={!p.isActive ? 'product-row-disabled' : ''}>
                    <td>
                      <b>{p.name}</b>
                    </td>
                    <td>$ {(p.price || 0).toLocaleString('es-AR')}</td>
                    <td>{p.Category?.name || 'Sin categoría'}</td>
                    <td>{p.isActive ? '✅ Habilitado' : '❌ Deshabilitado'}</td>
                    <td>
                      {p.isActive && <button onClick={() => setProductToEdit(p)}>Editar</button>}
                      <button onClick={() => handleOpenConfirm(p)}>
                        {p.isActive ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
          text={productToToggle.isActive ? 'deshabilitar este producto' : 'habilitar este producto'}
          onConfirm={handleToggle}
          onClose={() => setProductToToggle(null)}
        />
      )}
    </>
  )
}
