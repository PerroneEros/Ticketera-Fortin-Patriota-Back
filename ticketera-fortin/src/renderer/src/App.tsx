import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import Header from './components/header/header'
import { ProductListProvider } from './components/context/productListContext'
import Routs from './routes'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Header />
      <ProductListProvider>
        <Routs />
      </ProductListProvider>
      <Versions></Versions>
    </>
  )
}

export default App
