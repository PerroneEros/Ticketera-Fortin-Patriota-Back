import logo from '../../assets/logo.jpeg'
export default function Header() {
  return (
    <header>
      <div className="Logo" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
        <img
          src={logo}
          alt="Logo ticketera fortin "
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
      <nav>
        <button>Productos</button>
        <button>Ver productos</button>
        <button>Resumen</button>
        {/* Agregar un if que si no esta abierta la caja solo se vea resumen */}
        <button>cerrar caja</button>
      </nav>
    </header>
  )
}
