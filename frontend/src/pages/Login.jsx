import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Login() {

    const { iniciarSesion } = useContext(AuthContext)
    const navigate = useNavigate()

    const [usuario, setUsuario] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    async function manejarLogin(e) {
        e.preventDefault()
        setError('')
        setCargando(true)

        try {
            const respuesta = await fetch(`${BASE_URL}/api/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usuario,
                    password: password
                })
            })

            const datos = await respuesta.json()

            if (!respuesta.ok || !datos.token) {
                throw new Error('Usuario o contraseña incorrectos.')
            }

            const respuestaPerfil = await fetch(
                `${BASE_URL}/api/perfil/`,
                {
                    headers: {
                        Authorization: `Token ${datos.token}`
                    }
                }
            )

            if (!respuestaPerfil.ok) {
                throw new Error('No se pudo consultar el perfil.')
            }

            const datosPerfil = await respuestaPerfil.json()

            iniciarSesion(datos.token, datosPerfil)

            navigate('/')

        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="container mt-5">
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <h1 className="text-center mb-4">BecaGest</h1>

                <h3>Iniciar sesión</h3>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form onSubmit={manejarLogin}>

                    <label className="form-label">Usuario</label>

                    <input
                        type="text"
                        className="form-control mb-3"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        required
                    />

                    <label className="form-label">Contraseña</label>

                    <input
                        type="password"
                        className="form-control mb-3"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        className="btn btn-primary w-100"
                        type="submit"
                        disabled={cargando}
                    >
                        {cargando ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>

                </form>
            </div>
        </div>
    )
}

export default Login