import { Link } from 'react-router-dom'
import ListProducts from './listProduct'
export default function ProductsList() {
  return (
    <>
      <div className="Card-ProductsList">
        <Link to="/activate-products" title="Habilitar productos">
          <button>Habilitar Productos</button>
        </Link>
        <ListProducts />
      </div>
    </>
  )
}
