import { useContext } from 'react';
import { CategoryContext } from '../context/categoryContext';

export const CategoryFilter = () => {
  const context = useContext(CategoryContext);
  if (!context) return null;

  const { categories, activeCategory, setActiveCategory } = context;

  return (
    <div className="category-filter-container">
      <button
        onClick={() => setActiveCategory(null)}
        className={`category-pill ${activeCategory === null ? 'active' : ''}`}
      >
        Todos
      </button>

      {categories.map((cat) => {
        const isActive = activeCategory === cat.category_id;
        const count = cat.productCount || 0;
        const isEmpty = count === 0;

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
        );
      })}
    </div>
  );
};