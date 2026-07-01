import React from 'react'
import CardProducts from './product/cardProducts'
import { CategoryFilter } from '../components/category/categoryFilter' 
import { CategoryActions } from '../components/category/categoryActions'

export default function Home() {
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