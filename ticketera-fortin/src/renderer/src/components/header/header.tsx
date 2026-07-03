import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.jpeg'
import { CashRegisterClose } from '../cashRegister/cashRegsiterClose'
import '../Styles/header.css'

export default function Header() {
  const location = useLocation()
  const currentPath = location.pathname

  if (currentPath === '/') return null

  return (
    <header className="main-header">
      {/* Contenedor que bloquea el tamaño del logo */}
      <div className="header-logo-container">
        <img src={logo} alt="Logo ticketera fortin" className="header-logo-img" />
      </div>
      
      {/* El recuadro blanco que agrupa los botones */}
      <nav className="segmented-nav">
        <Link 
          to="/products" 
          className={`seg-item ${currentPath === '/products' ? 'active' : ''}`}
        >
          Productos
        </Link>
        
        <Link 
          to="/list-products" 
          className={`seg-item ${currentPath === '/list-products' ? 'active' : ''}`}
        >
          Ver productos
        </Link>
        
        <Link 
          to="/resumen" 
          className={`seg-item ${currentPath === '/resumen' ? 'active' : ''}`}
        >
          Resumen
        </Link>
        
        {/* Una pequeña línea gris para separar el botón de cerrar caja */}
        <div className="seg-divider"></div>
        
        {/* Cerrar caja */}
        <CashRegisterClose />
      </nav>
    </header>
  )
}