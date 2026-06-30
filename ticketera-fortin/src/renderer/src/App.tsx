import logo from './assets/logo.jpeg'
import Header from './components/header/header'
import { ProductListProvider } from './components/context/productListContext'
import { CategoryProvider } from './components/context/categoryContext'
import Routs from './routes'
import { ProductListProviderDisable } from './components/context/productListDisableContext'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Header />
      <CategoryProvider>
        <ProductListProviderDisable>
          <ProductListProvider>
            <Routs />
          </ProductListProvider>
        </ProductListProviderDisable>
      </CategoryProvider>
    </>
  )
}

export default App
