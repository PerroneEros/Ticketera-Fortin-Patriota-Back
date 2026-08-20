import { createContext, useState, useEffect, ReactNode } from 'react';
import { getAllCategories } from '../service/categoryService';

export interface Category {
  category_id: number;
  name: string;
  productCount?: number; 
}

interface CategoryContextType {
  categories: Category[];
  activeCategory: number | null; 
  setActiveCategory: (id: number | null) => void;
  loadCategories: () => Promise<void>;
}

export const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, activeCategory, setActiveCategory, loadCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};