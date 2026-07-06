import { Link, useLocation } from 'react-router-dom'
import { useContext } from 'react' // IMPORTAMOS HOOKS
import { CashRegisterContext } from '../context/cashRegisterContext' // IMPORTAMOS CONTEXTO
import logo from '../../assets/logo.jpeg'
import { CashRegisterClose } from '../cashRegister/cashRegsiterClose'
import '../Styles/header.css'

export default function Header() {
  const location = useLocation()
  const currentPath = location.pathname

  // OBTENEMOS EL ESTADO DE LA CAJA
  const context = useContext(CashRegisterContext)
  const activeRegister = context?.activeRegister

  if (currentPath === '/') return null

  return (
    <header className="main-header">
      <div className="header-logo-container">
        <img src={logo} alt="Logo ticketera fortin" className="header-logo-img" />
      </div>

      <nav className="segmented-nav">

        {/* SOLO MOSTRAMOS ESTO SI LA CAJA ESTÁ ABIERTA */}
        {activeRegister && (
          <>
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
          </>
        )}

        {/* EL RESUMEN SE VE SIEMPRE */}
        <Link
          to="/resumen"
          className={`seg-item ${currentPath === '/resumen' ? 'active' : ''}`}
        >
          Resumen
        </Link>

        <div className="seg-divider"></div>

        {/* SI ESTÁ ABIERTA, CERRAMOS. SI ESTÁ CERRADA, VOLVEMOS AL INICIO A ABRIRLA */}
        {activeRegister ? (
          <CashRegisterClose />
        ) : (
          <Link to="/" className="seg-item" style={{ color: '#10b981', fontWeight: 'bold' }}>
            Abrir Caja
          </Link>
        )}
      </nav>
    </header>
  )
}