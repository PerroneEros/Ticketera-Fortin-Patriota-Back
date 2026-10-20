import logo from './assets/logo.jpeg'
import Header from './components/header/header'
import { ProductListProvider } from './components/context/productListContext'
import { CategoryProvider } from './components/context/categoryContext'
import { ProductListProviderDisable } from './components/context/productListDisableContext'
import { CashRegisterProvider } from './components/context/cashRegisterContext'
import Routs from './routes'
import CartListProvider from './components/context/cartListContext'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { LicenseScreen } from './components/license'

function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [isLicensed, setIsLicensed] = useState(false)
  const [machineId, setMachineId] = useState('')
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  useEffect(() => {
    const checkAuth = async () => {
      const result = await window.api.checkLicense()
      setIsLicensed(result.isLicensed)
      setMachineId(result.machineId)
      setLoading(false)
    }
    checkAuth()
  }, [])
  if (loading) {
    return <div>Cargando sistema...</div>
  }
  // Si no está activado, cortamos el renderizado acá y mostramos el bloqueo
  if (!isLicensed) {
    return <LicenseScreen machineId={machineId} onActivated={() => setIsLicensed(true)} />
  }
  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />
      <CashRegisterProvider>
        <CategoryProvider>
          <CartListProvider>
            <ProductListProviderDisable>
              <ProductListProvider>
                <Header />
                <Routs />
              </ProductListProvider>
            </ProductListProviderDisable>
          </CartListProvider>
        </CategoryProvider>
      </CashRegisterProvider>
    </>
  )
}

export default App
