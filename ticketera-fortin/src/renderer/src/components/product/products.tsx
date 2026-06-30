<<<<<<< HEAD:ticketera-fortin/src/renderer/src/components/home.tsx
import React from 'react'
import CardProducts from './product/cardProducts'
import { CategoryFilter } from '../components/category/categoryFilter' 
import { CategoryActions } from '../components/category/categoryActions'

export default function Home() {
=======
import CardProducts from './cardProducts'
export default function Products() {
>>>>>>> 4da53afb523a4098c2c3e248900de59a3966623a:ticketera-fortin/src/renderer/src/components/product/products.tsx
  return (
    <div className="home-container">
      <div className="toolbar-container">
        <CategoryActions /> 
      </div>
      <div className="filters-container">
        <CategoryFilter />
      </div>
      <div className="Card-ProductsHome">
        <CardProducts />
      </div>

    </div>
  )
}