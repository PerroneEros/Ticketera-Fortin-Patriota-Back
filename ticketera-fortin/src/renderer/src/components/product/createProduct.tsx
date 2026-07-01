import { useContext, useState } from 'react'
import { CategoryContext } from '../context/categoryContext'
import toast from 'react-hot-toast'
import { createProducts } from '../service/productService'

export default function CreateProduct({ onClose }) {
  const context = useContext(CategoryContext)
  const { categories } = context
  const [name, setName] = useState()
  const [price, setPrice] = useState()
  const [category, setCategory] = useState()
  const handleSave = async () => {
    try {
      await createProducts({
        name: name,
        price: Number(price),
        category_id: Number(category)
      })
      toast.success('producto creado exitosamente')
      onClose()
    } catch (error) {
      toast.error('error al crear un producto')
    }
  }
  return (
    <>
      <div>
        <h3>crear producto</h3>
        <label>Nombre:</label>
        <input type="text" onChange={(e) => setName(e.target.value)} />
        <label>Precio:</label>
        <input type="number" onChange={(e) => setPrice(e.target.value)} />
        <label>Categoria:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">seleccione una categoria</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.name}
            </option>
          ))}
        </select>
        <button onClick={handleSave}>Crear producto</button>
      </div>
    </>
  )
}
