import { Route, Routes } from 'react-router-dom'
import Products from './components/product/products'
import ProductsList from './components/product/productsList'
import ActivateProducts from './components/product/activateProduct'
export default function Routs() {
  return (
    <>
      <Routes>
        <Route path="/products" element={<Products />} />
        <Route path="/list-products" element={<ProductsList />} />
        <Route path="/activate-products" element={<ActivateProducts />} />
      </Routes>
    </>
  )
}
