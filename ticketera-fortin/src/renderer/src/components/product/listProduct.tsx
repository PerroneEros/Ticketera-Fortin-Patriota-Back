import { useState } from 'react';
import toast from 'react-hot-toast';
import { useProductList } from '../context/productListContext';
import { useProductListDisable } from '../context/productListDisableContext';
import { deleteProducts, reactivateProducts } from '../service/productService';
import EditProduct from './editProduct';
import '../Styles/products.css';

export default function ListProducts() {
  const { productList, loading, fetchProducts } = useProductList();
  const { productListDisable, fetchProductsDisable } = useProductListDisable();
  const [filter, setFilter] = useState('active');
  const [productToEdit, setProductToEdit] = useState(null);

  const handleToggle = async (p: any) => {
    try {
      if (p.isActive) {
        await deleteProducts(p.id_product);
        toast.success('Producto desactivado');
      } else {
        await reactivateProducts(p.id_product);
        toast.success('Producto habilitado');
      }
      await fetchProducts();
      await fetchProductsDisable();
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const currentList = filter === 'active' ? productList : productListDisable;

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
            {currentList.length === 0 ? (
              /* ESTADO VACÍO: Si hay 0 productos */
              <tr>
                <td colSpan={5} className="empty-state-row">
                  📦 No hay productos para mostrar en esta lista.
                </td>
              </tr>
            ) : (
              /* PRODUCTOS REALES */
              currentList.map((p: any) => (
                <tr key={p.id_product} className={!p.isActive ? 'product-row-disabled' : ''}>
                  <td><b>{p.name}</b></td>
                  <td>$ {p.price}</td>
                  <td>{p.Category?.name || 'Sin categoría'}</td>
                  <td>{p.isActive ? '✅ Activo' : '❌ Desactivado'}</td>
                  <td>
                    {p.isActive && (
                      <button onClick={() => setProductToEdit(p)}>Editar</button>
                    )}
                    <button onClick={() => handleToggle(p)}>
                      {p.isActive ? 'Desactivar' : 'Habilitar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {productToEdit && (
        <EditProduct
          product={productToEdit}
          onClose={() => {
            setProductToEdit(null);
            fetchProducts();
          }}
        />
      )}
    </>
  );
}