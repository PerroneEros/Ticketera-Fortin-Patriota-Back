import { Route, Routes } from 'react-router-dom'
import Home from './components/home'
export default function Routs() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}
