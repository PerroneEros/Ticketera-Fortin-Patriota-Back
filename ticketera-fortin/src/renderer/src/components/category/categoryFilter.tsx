import { useContext } from 'react'
import { CategoryContext } from '../context/categoryContext'
import { useProductList } from '../context/productListContext'
import '../Styles/category.css'

export const CategoryFilter = () => {
  // Los hooks van antes de cualquier return (reglas de hooks de React)
  const context = useContext(CategoryContext)
  const { productList } = useProductList()
  if (!context) return null
  const { categories, activeCategory, setActiveCategory } = context
  const contProducts = (category_id: number): number =>
    productList.filter((product) => product.category_id == category_id).length

  return (
    <div className="category-filter-container">
      <button
        onClick={() => setActiveCategory(null)}
        className={`category-pill ${activeCategory === null ? 'active' : ''}`}
      >
        Todos
      </button>

      {categories.map((cat) => {
        const isActive = activeCategory === cat.category_id
        const count = contProducts(cat.category_id) || 0
        const isEmpty = count === 0

        return (
          <button
            key={cat.category_id}
            disabled={isEmpty}
            onClick={() => setActiveCategory(cat.category_id)}
            className={`category-pill ${isActive ? 'active' : ''} ${isEmpty ? 'empty' : ''}`}
          >
            {cat.name}
            <span className="product-count">({count})</span>
          </button>
        )
      })}
    </div>
  )
}
