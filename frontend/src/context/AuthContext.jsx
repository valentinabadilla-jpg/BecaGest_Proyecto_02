import { createContext, useState } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {

    const [token, setToken] = useState('')
    const [perfil, setPerfil] = useState(null)

    const esAdmin = perfil?.es_admin === true

    const esEncargado =
        esAdmin || perfil?.grupos?.includes('Encargado') === true

    const esEstudiante =
        perfil?.grupos?.includes('Estudiante') === true

    function iniciarSesion(datosToken, datosPerfil) {
        setToken(datosToken)
        setPerfil(datosPerfil)
    }

    function cerrarSesion() {
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