
import { useState } from 'react'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        () => localStorage.getItem('becagest_token') || ''
    )

    const [perfil, setPerfil] = useState(() => {
        const perfilGuardado = localStorage.getItem('becagest_perfil')

        try {
            return perfilGuardado ? JSON.parse(perfilGuardado) : null
        } catch {
            localStorage.removeItem('becagest_perfil')
            return null
        }
    })

    const esAdmin = perfil?.es_admin === true

    const esEncargado =
        esAdmin || perfil?.grupos?.includes('Encargado') === true

    const esEstudiante =
        perfil?.grupos?.includes('Estudiante') === true

    function iniciarSesion(datosToken, datosPerfil) {
        localStorage.setItem('becagest_token', datosToken)
        localStorage.setItem(
            'becagest_perfil',
            JSON.stringify(datosPerfil)
        )

        setToken(datosToken)
        setPerfil(datosPerfil)
    }

    function cerrarSesion() {
        localStorage.removeItem('becagest_token')
        localStorage.removeItem('becagest_perfil')

        setToken('')
        setPerfil(null)
    }

    return (
        <AuthContext.Provider value={{
            token,
            perfil,
            esAdmin,
            esEncargado,
            esEstudiante,
            iniciarSesion,
            cerrarSesion
        }}>
            {children}
        </AuthContext.Provider>
    )
}
