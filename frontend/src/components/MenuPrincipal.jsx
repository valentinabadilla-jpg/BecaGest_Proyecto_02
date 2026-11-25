import { useContext } from 'react'
import {
    Routes,
    Route,
    Link,
    useNavigate,
    Navigate
} from 'react-router-dom'

import { AuthContext } from '../context/AuthContext'

import Dashboard from '../pages/Dashboard'
import Estudiantes from '../pages/Estudiantes'
import Convocatorias from '../pages/Convocatorias'
import Solicitudes from '../pages/Solicitudes'
import Evaluaciones from '../pages/Evaluaciones'
import Asignaciones from '../pages/Asignaciones'

function MenuPrincipal() {

    const {
        perfil,
        token,
        esAdmin,
        esEncargado,
        esEstudiante,
        cerrarSesion
    } = useContext(AuthContext)

    const navigate = useNavigate()

    let nombreRol = 'Sin rol asignado'

    if (esAdmin) {

        nombreRol = 'Administrador'

    } else if (esEncargado) {

        nombreRol = 'Encargado'

    } else if (esEstudiante) {

        nombreRol = 'Estudiante'
    }

    // CERRAR SESION

    function salir() {

        cerrarSesion()

        navigate('/login', {
            replace: true
        })
    }

    return (

        <div>

            {/* MENU PRINCIPAL */}

            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">

                <div className="container d-flex flex-wrap gap-2">

                    <Link
                        className="navbar-brand"
                        to="/"
                    >
                        BecaGest
                    </Link>

                    <div className="navbar-nav me-auto flex-row flex-wrap gap-2">

                        {esEncargado && (

                            <Link
                                className="nav-link"
                                to="/"
                            >
                                Inicio
                            </Link>

                        )}

                        <Link
                            className="nav-link"
                            to="/estudiantes"
                        >
                            {esEncargado
                                ? 'Estudiantes'
                                : 'Mi ficha'}
                        </Link>

                        <Link
                            className="nav-link"
                            to="/convocatorias"
                        >
                            Convocatorias
                        </Link>

                        <Link
                            className="nav-link"
                            to="/solicitudes"
                        >
                            Solicitudes
                        </Link>

                        <Link
                            className="nav-link"
                            to="/evaluaciones"
                        >
                            Evaluaciones
                        </Link>

                        <Link
                            className="nav-link"
                            to="/asignaciones"
                        >
                            Asignaciones
                        </Link>

                    </div>

                    <span className="navbar-text me-3">

                        {perfil?.username} | {nombreRol}

                    </span>

                    <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={salir}
                    >
                        Cerrar sesión
                    </button>

                </div>

            </nav>

            {/* RUTAS DE LOS MODULOS */}

            <div className="container mt-4">

                <Routes>

                    {/* DASHBOARD SOLO PARA PERSONAL AUTORIZADO */}

                    <Route
                        path="/"
                        element={
                            esEncargado ? (

                                <Dashboard token={token} />

                            ) : (

                                <Navigate
                                    to="/convocatorias"
                                    replace
                                />

                            )
                        }
                    />

                    <Route
                        path="/estudiantes"
                        element={
                            <Estudiantes
                                token={token}
                                esAdmin={esAdmin}
                                esEncargado={esEncargado}
                            />
                        }
                    />

                    <Route
                        path="/convocatorias"
                        element={
                            <Convocatorias
                                token={token}
                                esAdmin={esAdmin}
                            />
                        }
                    />

                    <Route
                        path="/solicitudes"
                        element={
                            <Solicitudes
                                token={token}
                            />
                        }
                    />

                    <Route
                        path="/evaluaciones"
                        element={
                            <Evaluaciones
                                token={token}
                                esAdmin={esAdmin}
                                esEncargado={esEncargado}
                                esEstudiante={esEstudiante}
                            />
                        }
                    />

                    <Route
                        path="/asignaciones"
                        element={
                            <Asignaciones
                                token={token}
                                esAdmin={esAdmin}
                                esEncargado={esEncargado}
                                esEstudiante={esEstudiante}
                            />
                        }
                    />

                    {/* RUTAS INEXISTENTES */}

                    <Route
                        path="*"
                        element={
                            <Navigate to="/" replace />
                        }
                    />

                </Routes>

            </div>

        </div>
    )
}

export default MenuPrincipal