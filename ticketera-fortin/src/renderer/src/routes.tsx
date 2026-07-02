import { Route, Routes } from 'react-router-dom'
// IMPORTAMOS HOME AQUÍ (Verifica que la ruta coincida con donde guardaste home.tsx)
import Home from './components/home' 
import Products from './components/product/products'
import ProductsList from './components/product/productsList'
import ActivateProducts from './components/product/activateProduct'
<<<<<<< HEAD
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
=======

export default function Routs() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/list-products" element={<ProductsList />} />
      <Route path="/activate-products" element={<ActivateProducts />} />
    </Routes>
>>>>>>> 1b67bf4e9f959399633b6f09f4d86957efde9803
  )
}