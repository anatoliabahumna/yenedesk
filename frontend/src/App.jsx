import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import Layout from './components/Layout'
import Home from './pages/Home'
import Notes from './modules/Notes'
import Finance from './modules/Finance'
import Fitness from './modules/Fitness'
import Meals from './modules/Meals'
import PCBuilder from './modules/PCBuilder'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="notes" element={<Notes />} />
            <Route path="finance" element={<Finance />} />
            <Route path="fitness" element={<Fitness />} />
            <Route path="meals" element={<Meals />} />
          <Route path="pc" element={<PCBuilder />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
