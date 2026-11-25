import { Routes, Route } from 'react-router-dom'

import ProtectedRoute from './routes/ProtectedRoute'
import MenuPrincipal from './components/MenuPrincipal'
import Login from './pages/Login'

function App() {

    return (
        <Routes>

            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/*" element={<MenuPrincipal />} />
            </Route>

        </Routes>
    )
}

export default App