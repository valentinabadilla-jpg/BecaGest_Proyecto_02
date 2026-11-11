
import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Asignaciones({ token, esAdmin, esEncargado, esEstudiante }) {

    const [asignaciones, setAsignaciones] = useState([])
    const [evaluaciones, setEvaluaciones] = useState([])

    const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState('')
    const [montoMensual, setMontoMensual] = useState('')
    const [mensaje, setMensaje] = useState('')

    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    async function crearAsignacion(e) {

    e.preventDefault()
    setMensaje('')

    if (!evaluacionSeleccionada || !montoMensual) {
        setMensaje('Debés seleccionar una evaluación e ingresar el monto.')
        return
    }

    try {

        const respuesta = await fetch(
            `${BASE_URL}/api/asignaciones/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`
                },
                body: JSON.stringify({
                    evaluacion: evaluacionSeleccionada,
                    monto_mensual: montoMensual,
                    estado: 'ACTIVA'
                })
            }
        )

        const datos = await respuesta.json()

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                datos.evaluacion?.[0] ||
                datos.monto_mensual?.[0] ||
                'No se pudo crear la asignación.'
            )
        }

        setMensaje('Asignación creada correctamente.')
        setEvaluacionSeleccionada('')
        setMontoMensual('')

        setAsignaciones([...asignaciones, datos])

    } catch (err) {
        setMensaje(err.message)
    }
}

    useEffect(() => {

        async function cargarDatos() {

            try {
                const respuestaAsignaciones = await fetch(
                    `${BASE_URL}/api/asignaciones/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`
                        }
                    }
                )

                if (!respuestaAsignaciones.ok) {
                    throw new Error('No se pudieron cargar las asignaciones.')
                }

                const datosAsignaciones = await respuestaAsignaciones.json()
                setAsignaciones(datosAsignaciones)

                if (esAdmin || esEncargado) {

                    const respuestaEvaluaciones = await fetch(
                        `${BASE_URL}/api/evaluaciones/`,
                        {
                            headers: {
                                Authorization: `Token ${token}`
                            }
                        }
                    )

                    if (!respuestaEvaluaciones.ok) {
                        throw new Error('No se pudieron cargar las evaluaciones.')
                    }

                    const datosEvaluaciones = await respuestaEvaluaciones.json()
                    setEvaluaciones(datosEvaluaciones)
                }

            } catch (err) {
                setError(err.message)
            } finally {
                setCargando(false)
            }
        }

        cargarDatos()

    }, [token, esAdmin, esEncargado])

    if (cargando) {
        return <p>Cargando asignaciones...</p>
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>
    }

    const evaluacionesDisponibles = evaluaciones.filter((evaluacion) => {
        const tieneAsignacion = asignaciones.some(
            (asignacion) => asignacion.evaluacion === evaluacion.id
        )

        return (
            evaluacion.resultado === 'APROBADA' &&
            !tieneAsignacion
        )
    })

    return (
        <div>

            <h2 className="mb-4">Asignaciones</h2>

            {(esAdmin || esEncargado) && (
    <div className="card p-3 mb-4">
        <h4>Nueva asignación</h4>

        {mensaje && (
            <div className="alert alert-info">
                {mensaje}
            </div>
        )}

        {evaluacionesDisponibles.length === 0 ? (
            <p>No hay evaluaciones disponibles para asignar.</p>
        ) : (
            <form onSubmit={crearAsignacion}>

                <div className="mb-3">
                    <label className="form-label">
                        Evaluación aprobada
                    </label>

                    <select
                        className="form-select"
                        value={evaluacionSeleccionada}
                        onChange={(e) => setEvaluacionSeleccionada(e.target.value)}
                        required
                    >
                        <option value="">Seleccione una evaluación</option>

                        {evaluacionesDisponibles.map((evaluacion) => (
                            <option key={evaluacion.id} value={evaluacion.id}>
                                Evaluación {evaluacion.id} - Solicitud {evaluacion.solicitud}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Monto mensual (₡)
                    </label>

                    <input
                        type="number"
                        className="form-control"
                        min="0.01"
                        step="0.01"
                        value={montoMensual}
                        onChange={(e) => setMontoMensual(e.target.value)}
                        placeholder="Ejemplo: 50000"
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary">
                    Crear asignación
                </button>

            </form>
        )}
    </div>
)}

            <div className="card p-3">

                <h4>Lista de asignaciones</h4>

                {asignaciones.length === 0 ? (
                    <p>No hay asignaciones registradas.</p>
                ) : (

                    <div className="table-responsive">

                        <table className="table table-striped">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Estudiante</th>
                                    <th>Evaluación</th>
                                    <th>Carrera</th>
                                    <th>Monto mensual</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>

                            <tbody>

                                {asignaciones.map((asignacion) => (

                                    <tr key={asignacion.id}>
                                        <td>{asignacion.id}</td>

                                        <td>
                                            {asignacion.estudiante_nombre}
                                        </td>

                                        <td>{asignacion.evaluacion}</td>

                                        <td>
                                            {asignacion.estudiante_carrera}
                                        </td>

                                        <td>
                                            ₡{Number(asignacion.monto_mensual).toLocaleString('es-CR')}
                                        </td>

                                        <td>{asignacion.fecha_asignacion}</td>

                                        <td>{asignacion.estado}</td>
                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    )
}

export default Asignaciones
