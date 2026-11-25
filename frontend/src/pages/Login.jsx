import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { BASE_URL, peticionAPI } from '../services/api'

import Alertas from '../components/Alertas'
import Formulario from '../components/Formulario'

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

            const respuesta = await peticionAPI(
                `${BASE_URL}/api/token/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: usuario,
                        password: password
                    })
                }
            )

            const datos = await respuesta.json()

            if (!respuesta.ok || !datos.token) {

                throw new Error(
                    'Usuario o contraseña incorrectos.'
                )
            }

            const respuestaPerfil = await peticionAPI(
                `${BASE_URL}/api/perfil/`,
                {
                    headers: {
                        Authorization: `Token ${datos.token}`
                    }
                }
            )

            if (!respuestaPerfil.ok) {

                throw new Error(
                    'No se pudo consultar el perfil.'
                )
            }

            const datosPerfil = await respuestaPerfil.json()

            iniciarSesion(datos.token, datosPerfil)

            navigate('/')

        } catch (err) {

            setError(
                err instanceof TypeError
                    ? 'No se pudo conectar con el servidor.'
                    : err.message
            )

        } finally {

            setCargando(false)
        }
    }

    return (

        <div className="container mt-5">

            <div
                className="mx-auto"
                style={{ maxWidth: '400px' }}
            >

                <h1 className="text-center mb-4">
                    BecaGest
                </h1>

                <Formulario
                    titulo="Iniciar sesión"
                    onSubmit={manejarLogin}
                >

                    <Alertas error={error} />

                    <label
                        className="form-label"
                        htmlFor="usuario"
                    >
                        Usuario
                    </label>

                    <input
                        id="usuario"
                        type="text"
                        className="form-control mb-3"
                        value={usuario}
                        onChange={e =>
                            setUsuario(e.target.value)
                        }
                        autoComplete="username"
                        disabled={cargando}
                        required
                    />

                    <label
                        className="form-label"
                        htmlFor="password"
                    >
                        Contraseña
                    </label>

                    <input
                        id="password"
                        type="password"
                        className="form-control mb-3"
                        value={password}
                        onChange={e =>
                            setPassword(e.target.value)
                        }
                        autoComplete="current-password"
                        disabled={cargando}
                        required
                    />

                    <button
                        className="btn btn-primary w-100"
                        type="submit"
                        disabled={cargando}
                    >

                        {cargando
                            ? 'Ingresando...'
                            : 'Iniciar sesión'}

                    </button>

                </Formulario>

            </div>

        </div>
    )
}

export default Login