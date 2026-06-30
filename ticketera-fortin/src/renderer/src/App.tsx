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
<<<<<<< HEAD
      <ProductListProvider>
        <CategoryProvider>
          <Routs />
        </CategoryProvider>
      </ProductListProvider>
=======
      <ProductListProviderDisable>
        <ProductListProvider>
          <Routs />
        </ProductListProvider>
      </ProductListProviderDisable>
      <Versions></Versions>
>>>>>>> 4da53afb523a4098c2c3e248900de59a3966623a
    </>
  )
}

export default App