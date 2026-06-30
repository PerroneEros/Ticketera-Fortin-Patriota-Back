import logo from './assets/logo.jpeg'
import Header from './components/header/header'
import { ProductListProvider } from './components/context/productListContext'
import { CategoryProvider } from './components/context/categoryContext' 
import Routs from './routes'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Header />
      <ProductListProvider>
        <CategoryProvider>
          <Routs />
        </CategoryProvider>
      </ProductListProvider>
    </>
  )
}

export default App