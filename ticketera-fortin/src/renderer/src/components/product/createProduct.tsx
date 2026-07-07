import { useContext, useState } from 'react'
import { CategoryContext } from '../context/categoryContext'
import toast from 'react-hot-toast'
import { createProducts } from '../service/productService'
//import '../Styles/products.css'
import '../Styles/productModals.css'
import { parseInputValue } from '../utils/formatters'

export default function CreateProduct({ onClose }) {
  const context = useContext(CategoryContext)
  const { categories } = context

  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    //se usa para mostrar que no puede ir vacio precio ni nada
    // ya que schema de zod permite precio 0
    if (!name.trim()) {
      setErrorMsg('El nombre es obligatorio.')
      return
    }
    if (!price) {
      setErrorMsg('El precio es obligatorio.')
      return
    }
    if (price <= 0) {
      setErrorMsg('El precio debe ser mayor a 0.')
      return
    }
    if (!category) {
      setErrorMsg('Debes seleccionar una categoría.')
      return
    }
    setIsLoading(true)
    try {
      await createProducts({
        name: name,
        price: price,
        category_id: Number(category)
      })
      toast.success('Producto creado exitosamente')
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
          <h3>Crear Producto</h3>
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
                value={price === 0 ? '' : price.toLocaleString('es-AR')}
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
                <option value="" disabled>
                  Seleccione una categoría
                </option>
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
              {isLoading ? 'Creando...' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
