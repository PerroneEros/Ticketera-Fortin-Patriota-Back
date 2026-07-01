import { Link } from 'react-router-dom'
import ListProducts from './listProduct'
import { useState } from 'react'
import CreateProduct from './createProduct'
import { useProductList } from '../context/productListContext'
export default function ProductsList() {
  const [productToCreate, setProductToCreate] = useState(false)
  const { fetchProducts } = useProductList()
  return (
    <>
      <div className="Card-ProductsList">
        <Link to="/activate-products" title="Habilitar productos">
          <button>Habilitar Productos</button>
        </Link>
        <button onClick={() => setProductToCreate(true)}>Crear Producto</button>
        <ListProducts />
      </div>
      {productToCreate && (
        <CreateProduct
          onClose={() => {
            setProductToCreate(false)
            fetchProducts()
          }}
        />
      )}
    </>
  )
}
