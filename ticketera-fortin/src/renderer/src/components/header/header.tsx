import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.jpeg'
import { CashRegisterClose } from '../cashRegister/cashRegsiterClose'
import '../Styles/header.css'

export default function Header() {
  const location = useLocation() 
  if (location.pathname === '/') {
    return null
  }

  return (
    <header>
      <div className="Logo" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
        <img
          src={logo}
          alt="Logo ticketera fortin"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
      <nav>
        <Link to="/products" title="Productos">
          <button>Productos</button>
        </Link>

        <Link to="/list-products" title="Ver Lista de Productos">
          <button>Ver productos</button>
        </Link>

        <button>Resumen</button>
        
        <CashRegisterClose />
      </nav>
    </header>
  )
}