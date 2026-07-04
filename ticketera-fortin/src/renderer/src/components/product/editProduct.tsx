import toast from 'react-hot-toast'
import { editProducts } from '../service/productService'
import { useContext, useState } from 'react'
import { CategoryContext } from '../context/categoryContext'
//import '../Styles/products.css'

export default function EditProduct({ product, onClose }) {
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price)
  const [category, setCategory] = useState(product.category_id)
  const [isLoading, setIsLoading] = useState(false)
  
  const context = useContext(CategoryContext)
  const { categories } = context

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!name || !price || !category) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)
    try {
      await editProducts(product.id_product, {
        name: name,
        price: Number(price),
        category_id: Number(category)
      })
      toast.success('Producto editado correctamente')
      onClose()
    } catch (error) {
      toast.error('Error al editar el producto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-prod-overlay">
      <div className="modal-prod-content">
        <div className="modal-prod-header">
          <h3>Editar Producto</h3>
          <button className="btn-prod-close" onClick={onClose} disabled={isLoading}>✕</button>
        </div>
        
        <form onSubmit={handleSave}>
          <div className="modal-prod-body">
            <div className="prod-input-group">
              <label>Nombre:</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
            </div>
            
            <div className="prod-input-group">
              <label>Precio:</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isLoading} />
            </div>
            
            <div className="prod-input-group">
              <label>Categoría:</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isLoading}>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="modal-prod-actions">
            <button type="button" className="btn-prod-cancel" onClick={onClose} disabled={isLoading}>Cancelar</button>
            <button type="submit" className="btn-prod-confirm" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}