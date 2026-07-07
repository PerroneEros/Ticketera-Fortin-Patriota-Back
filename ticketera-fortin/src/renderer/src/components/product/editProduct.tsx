import toast from 'react-hot-toast'
import { editProducts } from '../service/productService'
import { useContext, useState } from 'react'
import { CategoryContext } from '../context/categoryContext'
import { parseInputValue } from '../utils/formatters'
//import '../Styles/products.css'

export default function EditProduct({ product, onClose }) {
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(Number(product.price) || 0)
  const [category, setCategory] = useState(product.category_id)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const context = useContext(CategoryContext)
  const { categories } = context

  const handleSave = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!name.trim()) {
      setErrorMsg('El nombre es obligatorio')
      return
    }
    if (!category) {
      setErrorMsg('Debes seleccionar una categoría')
      return
    }

    setIsLoading(true)
    try {
      await editProducts(product.id_product, {
        name: name,
        price: price,
        category_id: Number(category)
      })
      toast.success('Producto editado correctamente')
      onClose()
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Ocurrió un error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-prod-overlay">
      <div className="modal-prod-content">
        <div className="modal-prod-header">
          <h3>Editar Producto</h3>
          <button className="btn-prod-close" onClick={onClose} disabled={isLoading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-prod-body">
            <div className="prod-input-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="prod-input-group">
              <label>Precio:</label>
              <input
                type="text"
                inputMode="numeric"
                value={price.toLocaleString('es-AR')}
                onChange={(e) => setPrice(parseInputValue(e.target.value))}
                disabled={isLoading}
              />
            </div>

            <div className="prod-input-group">
              <label>Categoría:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errorMsg && <p className="error-text">{errorMsg}</p>}
            </div>
          </div>

          <div className="modal-prod-actions">
            <button
              type="button"
              className="btn-prod-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-prod-confirm" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
