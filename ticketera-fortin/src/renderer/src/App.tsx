import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import Header from './components/header/header'
import { ProductListProvider } from './components/context/productListContext'
import Routs from './routes'
import { ProductListProviderDisable } from './components/context/productListDisableContext'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Header />
      <ProductListProviderDisable>
        <ProductListProvider>
          <Routs />
        </ProductListProvider>
      </ProductListProviderDisable>
      <Versions></Versions>
    </>
  )
}

export default App
