import React from 'react'
import CardProducts from '../product/cardProducts'
import { CategoryFilter } from '../category/categoryFilter'
import { CategoryActions } from '../category/categoryActions'
import '../Styles/products.css'
import Cart from '../cart'

export default function Products() {
  return (
    <div className="home-container">

      {/* Lado Izquierdo: Productos y Filtros */}
      <div className="products-main-section">
        <div className="filtros-y-acciones">
          <CategoryActions />
          <CategoryFilter />
        </div>
        <div className="Card-ProductsHome">
          <CardProducts />
        </div>
      </div>

      {/* Lado Derecho: Carrito (Ticket) */}
      <div className="cart-sidebar-section">
        <Cart />
      </div>

    </div>
  )
}