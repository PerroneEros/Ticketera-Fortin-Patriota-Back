import { useState } from 'react'
import ListProducts from './listProduct'
import CreateProduct from './createProduct'
import { useProductList } from '../context/productListContext'
import '../Styles/productList.css'

export default function ProductsList() {
  const [productToCreate, setProductToCreate] = useState(false)
  const { fetchProducts } = useProductList()

  return (
    <div className="products-manager">
      <div className="Card-ProductsList">
        <button onClick={() => setProductToCreate(true)}>Crear Producto</button>
      </div>
      <ListProducts />
      {productToCreate && (
        <CreateProduct onClose={() => { setProductToCreate(false); fetchProducts(); }} />
      )}
    </div>
  )
}