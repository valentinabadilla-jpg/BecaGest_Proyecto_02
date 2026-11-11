
import { useContext } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'

import { AuthContext } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Asignaciones from './pages/Asignaciones'

import Login from './pages/Login'
import Estudiantes from './pages/Estudiantes'
import Convocatorias from './pages/Convocatorias'

function MenuPrincipal() {

    const {
        perfil,
        token,
        esAdmin,
        esEncargado,
        cerrarSesion
    } = useContext(AuthContext)

    const navigate = useNavigate()

    let nombreRol = 'Sin rol asignado'

    if (esAdmin) {
        nombreRol = 'Administrador'
    } else if (esEncargado) {
        nombreRol = 'Encargado'
    } else if (perfil?.grupos?.includes('Estudiante')) {
        nombreRol = 'Estudiante'
    }

    function salir() {
        cerrarSesion()
        navigate('/login')
    }

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">

                    <Link className="navbar-brand" to="/">
                        BecaGest
                    </Link>

                    <div className="navbar-nav me-auto">

                        <Link className="nav-link" to="/">
                            Inicio
                        </Link>

                        <Link className="nav-link" to="/estudiantes">
                            Estudiantes
                        </Link>

                        <Link className="nav-link" to="/convocatorias">
                            Convocatorias
                        </Link>

                        <Link className="nav-link" to="/asignaciones">
                            Asignaciones
                        </Link>

                    </div>

                    <span className="navbar-text me-3">
                        {perfil?.username} | {nombreRol}
                    </span>

                    <button
                        className="btn btn-danger btn-sm"
                        onClick={salir}
                    >
                        Cerrar sesión
                    </button>

                </div>
            </nav>

            <div className="container mt-4">
                <Routes>

                    <Route path="/" element={
                        <Dashboard token={token} />
                    } />

                    <Route path="/estudiantes" element={
                        <Estudiantes
                            token={token}
                            esAdmin={esAdmin}
                            esEncargado={esEncargado}
                        />
                    } />

                    <Route path="/convocatorias" element={
                        <Convocatorias
                            token={token}
                            esAdmin={esAdmin}
                        />
                    } />

                   <Route path="/asignaciones" element={
                        <Asignaciones
                            token={token}
                            esAdmin={esAdmin}
                            esEncargado={esEncargado}
                            esEstudiante={perfil?.grupos?.includes('Estudiante') === true}
                        />
                    } />

                </Routes>
            </div>
        </div>
    )
}

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
