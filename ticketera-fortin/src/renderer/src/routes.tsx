import { Route, Routes } from 'react-router-dom'
import Products from './components/product/products'
import ListProducts from './components/product/listProduct'
export default function Routs() {
  return (
    <>
      <Routes>
        <Route path="/products" element={<Products />} />
        <Route path="/list-products" element={<ListProducts />} />
      </Routes>
    </>
  )
}
