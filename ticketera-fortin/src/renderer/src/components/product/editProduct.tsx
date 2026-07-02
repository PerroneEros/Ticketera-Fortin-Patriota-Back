import toast from 'react-hot-toast'
import { editProducts } from '../service/productService'
import { useContext, useState } from 'react'
import { CategoryContext } from '../context/categoryContext'

export default function EditProduct({ product, onClose }) {
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price)
  const [category, setCategory] = useState(product.category_id)
  const context = useContext(CategoryContext)
  const { categories } = context
  const handleSave = async () => {
    try {
      await editProducts(product.id_product, {
        name: name,
        price: Number(price),
        category_id: Number(category)
      })
      toast.success('producto editado correctamente')
      onClose()
    } catch (error) {
      toast.error('error al editar un producto')
    }
  }
  return (
    <div>
      <div>
        <h3>Editar Producto</h3>
        <label>Nombre:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>Precio:</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <label>Categoria</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.name}
            </option>
          ))}
        </select>
        <div>
          <button onClick={handleSave}>Guardar cambios</button>
          <button onClick={onClose}>Cancelar cambios</button>
        </div>
      </div>
    </div>
  )
}
