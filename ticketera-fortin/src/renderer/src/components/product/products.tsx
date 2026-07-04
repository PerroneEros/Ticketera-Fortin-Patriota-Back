import React from 'react'
import CardProducts from '../product/cardProducts'
import { CategoryFilter } from '../category/categoryFilter'
import { CategoryActions } from '../category/categoryActions'
import '../Styles/products.css'

export default function Products() {
  return (
    <div className="home-container">
      {/* Sección Filtros */}
      <div className="filtros-y-acciones">
        <CategoryActions />
        <CategoryFilter />
      </div>

      {/* Sección Tarjetas (El estándar para la venta) */}
      <div className="Card-ProductsHome">
        <CardProducts />
      </div>
    </div>
  )
}