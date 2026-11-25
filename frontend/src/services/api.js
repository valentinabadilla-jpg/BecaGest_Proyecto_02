export const BASE_URL = (
    import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

export async function peticionAPI(url, opciones = {}) {

    try {

        const respuesta = await fetch(url, opciones)

        if (respuesta.status >= 500) {

            throw new Error(
                'Ocurrió un error interno en el servidor.'
            )
        }

        return respuesta

    } catch (error) {

        if (error.name === 'AbortError') {
            throw error
        }

        if (error instanceof TypeError) {

            throw new Error(
                'No se pudo conectar con el servidor. Verifica que Django esté en ejecución.'
            )
        }

        throw error
    }
}