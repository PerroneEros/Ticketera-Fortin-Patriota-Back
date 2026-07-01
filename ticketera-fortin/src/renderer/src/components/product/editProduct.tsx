import toast from 'react-hot-toast'
import { editProducts } from '../service/productService'
import { useState } from 'react'

export default function EditProduct({ product, onClose }) {
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price)
  const handleSave = async () => {
    try {
      await editProducts(product.id_product, {
        name: name,
        price: price
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
        <div>
          <button onClick={handleSave}>Guardar cambios</button>
          <button onClick={onClose}>Cancelar cambios</button>
        </div>
      </div>
    </div>
  )
}
