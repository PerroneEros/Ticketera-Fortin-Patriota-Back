import logo from './assets/logo.jpeg'
import Header from './components/header/header'
import { ProductListProvider } from './components/context/productListContext'
import { CategoryProvider } from './components/context/categoryContext'
import { ProductListProviderDisable } from './components/context/productListDisableContext'
import { CashRegisterProvider } from './components/context/cashRegisterContext'
import Routs from './routes'
import CartListProvider from './components/context/cartListContext'


function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
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
