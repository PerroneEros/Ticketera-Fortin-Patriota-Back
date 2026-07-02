import { Route, Routes } from 'react-router-dom'
import Products from './components/product/products'
import ProductsList from './components/product/productsList'
import ActivateProducts from './components/product/activateProduct'
import { DashboardView } from './components/dashboard/DashboardView'
export default function Routs() {
  return (
    <>
      <Routes>
        <Route path="/products" element={<Products />} />
        <Route path="/list-products" element={<ProductsList />} />
        <Route path="/activate-products" element={<ActivateProducts />} />
        <Route path="/resumen" element={<DashboardView />} />
      </Routes>
    </>
  )
}
