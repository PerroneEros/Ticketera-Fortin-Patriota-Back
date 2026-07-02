import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.jpeg'
<<<<<<< HEAD
=======
import { CashRegisterClose } from '../cashRegister/cashRegsiterClose'
>>>>>>> 1b67bf4e9f959399633b6f09f4d86957efde9803

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

<<<<<<< HEAD
        <Link to="/resumen" title="Resumen">
          <button>Resumen</button>
        </Link>
        
        {/* Agregar un if que si no esta abierta la caja solo se vea resumen */}
        <button>cerrar caja</button>
=======
        <button>Resumen</button>
        
        <CashRegisterClose />
>>>>>>> 1b67bf4e9f959399633b6f09f4d86957efde9803
      </nav>
    </header>
  )
}