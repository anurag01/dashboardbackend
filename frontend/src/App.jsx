import { Route, Routes } from 'react-router-dom'
import Nav from './components/Nav'
import Portal from './pages/Portal'
import LeadForm from './pages/LeadForm'
import './App.css'

function App() {


  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/form" element={<LeadForm />} />
      </Routes>
    </>
  )
}

export default App
