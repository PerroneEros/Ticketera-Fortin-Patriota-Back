import { useContext } from 'react'
import { CategoryContext } from '../context/categoryContext'
import { useProductList } from '../context/productListContext'
import '../Styles/category.css'

export const CategoryFilter = () => {
  const context = useContext(CategoryContext)
  if (!context) return null
  const { productList } = useProductList()
  const { categories, activeCategory, setActiveCategory } = context
  const contProducts = (category_id: number) => {
    let cantProduct = 0
    for (let i = 0; i < productList.length; i++) {
      let product = productList[i]
      if (category_id == product.category_id) {
        cantProduct++
      }
    }
    return cantProduct
  }

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
