
import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function obtenerMensajeError(datos, status) {
    if (status === 401) {
        return 'Tu sesión ha expirado. Iniciá sesión nuevamente.'
    }

    if (status === 403) {
        return 'No tenés permisos para realizar esta operación.'
    }

    if (status === 404) {
        return 'La asignación solicitada no existe.'
    }

    if (typeof datos === 'string') {
        return datos
    }

    if (datos?.error) {
        return datos.error
    }

    if (datos?.detail) {
        return datos.detail
    }

    if (datos) {
        return Object.values(datos)
            .flat()
            .filter(Boolean)
            .join(' ')
    }

    return 'Ocurrió un error al comunicarse con el servidor.'
}

async function leerRespuesta(respuesta) {
    if (respuesta.status === 204) {
        return null
    }

    return respuesta.json()
}

function Asignaciones({ token, esAdmin, esEncargado, esEstudiante }) {
    const puedeAdministrar = esAdmin || esEncargado

    const [asignaciones, setAsignaciones] = useState([])
    const [evaluaciones, setEvaluaciones] = useState([])

    const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState('')
    const [montoMensual, setMontoMensual] = useState('')

    const [filtroEstado, setFiltroEstado] = useState('')
    const [asignacionDetalle, setAsignacionDetalle] = useState(null)
    const [asignacionEditando, setAsignacionEditando] = useState(null)

    const [montoEdicion, setMontoEdicion] = useState('')
    const [estadoEdicion, setEstadoEdicion] = useState('')

    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')

    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)

    async function cargarAsignaciones() {
        const parametros = puedeAdministrar && filtroEstado
            ? `?estado=${filtroEstado}`
            : ''

        const respuesta = await fetch(
            `${BASE_URL}/api/asignaciones/${parametros}`,
            {
                headers: {
                    Authorization: `Token ${token}`
                }
            }
        )

        const datos = await leerRespuesta(respuesta)

        if (!respuesta.ok) {
            throw new Error(obtenerMensajeError(datos, respuesta.status))
        }

        setAsignaciones(Array.isArray(datos) ? datos : datos.results || [])
    }

    useEffect(() => {
        let activo = true

        async function cargarDatos() {
            setCargando(true)
            setError('')

            try {
                const parametros = puedeAdministrar && filtroEstado
                    ? `?estado=${filtroEstado}`
                    : ''

                const respuesta = await fetch(
                    `${BASE_URL}/api/asignaciones/${parametros}`,
                    {
                        headers: {
                            Authorization: `Token ${token}`
                        }
                    }
                )

                const datos = await leerRespuesta(respuesta)

                if (!respuesta.ok) {
                    throw new Error(obtenerMensajeError(datos, respuesta.status))
                }

                if (!activo) return

                setAsignaciones(
                    Array.isArray(datos) ? datos : datos.results || []
                )

                if (puedeAdministrar) {
                    const respuestaEvaluaciones = await fetch(
                        `${BASE_URL}/api/evaluaciones/`,
                        {
                            headers: {
                                Authorization: `Token ${token}`
                            }
                        }
                    )

                    const datosEvaluaciones = await leerRespuesta(
                        respuestaEvaluaciones
                    )

                    if (!respuestaEvaluaciones.ok) {
                        throw new Error(
                            obtenerMensajeError(
                                datosEvaluaciones,
                                respuestaEvaluaciones.status
                            )
                        )
                    }

                    if (!activo) return

                    setEvaluaciones(
                        Array.isArray(datosEvaluaciones)
                            ? datosEvaluaciones
                            : datosEvaluaciones.results || []
                    )
                }
            } catch (err) {
                if (activo) {
                    setError(err.message)
                }
            } finally {
                if (activo) {
                    setCargando(false)
                }
            }
        }

        cargarDatos()

        return () => {
            activo = false
        }
    }, [token, puedeAdministrar, filtroEstado])

    async function crearAsignacion(e) {
        e.preventDefault()
        setMensaje('')
        setError('')

        if (!evaluacionSeleccionada || !montoMensual) {
            setError('Debés seleccionar una evaluación e ingresar el monto.')
            return
        }

        if (Number(montoMensual) <= 0) {
            setError('El monto mensual debe ser mayor que cero.')
            return
        }

        setGuardando(true)

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

            const datos = await leerRespuesta(respuesta)

            if (!respuesta.ok) {
                throw new Error(obtenerMensajeError(datos, respuesta.status))
            }

            setEvaluacionSeleccionada('')
            setMontoMensual('')
            setMensaje('Asignación creada correctamente.')

            await cargarAsignaciones()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardando(false)
        }
    }

    async function consultarDetalle(id) {
        setError('')
        setMensaje('')

        try {
            const respuesta = await fetch(
                `${BASE_URL}/api/asignaciones/${id}/`,
                {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                }
            )

            const datos = await leerRespuesta(respuesta)

            if (!respuesta.ok) {
                throw new Error(obtenerMensajeError(datos, respuesta.status))
            }

            setAsignacionDetalle(datos)
            setAsignacionEditando(null)
        } catch (err) {
            setError(err.message)
        }
    }

    function iniciarEdicion(asignacion) {
        setAsignacionEditando(asignacion)
        setMontoEdicion(asignacion.monto_mensual)
        setEstadoEdicion(asignacion.estado)
        setAsignacionDetalle(null)
        setMensaje('')
        setError('')
    }

    async function guardarEdicion(e) {
        e.preventDefault()
        setMensaje('')
        setError('')

        if (Number(montoEdicion) <= 0) {
            setError('El monto mensual debe ser mayor que cero.')
            return
        }

        setGuardando(true)

        try {
            const respuesta = await fetch(
                `${BASE_URL}/api/asignaciones/${asignacionEditando.id}/`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`
                    },
                    body: JSON.stringify({
                        monto_mensual: montoEdicion,
                        estado: estadoEdicion
                    })
                }
            )

            const datos = await leerRespuesta(respuesta)

            if (!respuesta.ok) {
                throw new Error(obtenerMensajeError(datos, respuesta.status))
            }

            setAsignacionEditando(null)
            setMensaje('Asignación actualizada correctamente.')

            await cargarAsignaciones()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardando(false)
        }
    }

    async function eliminarAsignacion(id) {
        const confirmar = window.confirm(
            `¿Seguro que deseás eliminar la asignación ${id}?`
        )

        if (!confirmar) return

        setMensaje('')
        setError('')

        try {
            const respuesta = await fetch(
                `${BASE_URL}/api/asignaciones/${id}/`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Token ${token}`
                    }
                }
            )

            if (!respuesta.ok) {
                const datos = await leerRespuesta(respuesta)
                throw new Error(obtenerMensajeError(datos, respuesta.status))
            }

            setMensaje('Asignación eliminada correctamente.')
            setAsignacionDetalle(null)
            setAsignacionEditando(null)

            await cargarAsignaciones()
        } catch (err) {
            setError(err.message)
        }
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

    if (cargando) {
        return <p>Cargando asignaciones...</p>
    }

    return (
        <div>
            <h2 className="mb-4">Asignaciones</h2>

            {mensaje && (
                <div className="alert alert-success">
                    {mensaje}
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {puedeAdministrar && (
                <div className="card p-3 mb-4">
                    <h4>Nueva asignación</h4>

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
                                    onChange={(e) =>
                                        setEvaluacionSeleccionada(e.target.value)
                                    }
                                    required
                                >
                                    <option value="">
                                        Seleccione una evaluación
                                    </option>

                                    {evaluacionesDisponibles.map((evaluacion) => (
                                        <option
                                            key={evaluacion.id}
                                            value={evaluacion.id}
                                        >
                                            Evaluación {evaluacion.id} -
                                            Solicitud {evaluacion.solicitud}
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
                                    onChange={(e) =>
                                        setMontoMensual(e.target.value)
                                    }
                                    placeholder="Ejemplo: 50000"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={guardando}
                            >
                                {guardando ? 'Guardando...' : 'Crear asignación'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            <div className="card p-3 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <h4 className="mb-0">Lista de asignaciones</h4>

                    {puedeAdministrar && (
                        <select
                            className="form-select"
                            style={{ maxWidth: '220px' }}
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="ACTIVA">Activas</option>
                            <option value="FINALIZADA">Finalizadas</option>
                            <option value="CANCELADA">Canceladas</option>
                        </select>
                    )}
                </div>

                {asignaciones.length === 0 ? (
                    <p>No hay asignaciones registradas.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Estudiante</th>
                                    <th>Evaluación</th>
                                    <th>Carrera</th>
                                    <th>Monto mensual</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {asignaciones.map((asignacion) => (
                                    <tr key={asignacion.id}>
                                        <td>{asignacion.id}</td>
                                        <td>{asignacion.estudiante_nombre}</td>
                                        <td>{asignacion.evaluacion}</td>
                                        <td>{asignacion.estudiante_carrera}</td>
                                        <td>
                                            ₡{Number(
                                                asignacion.monto_mensual
                                            ).toLocaleString('es-CR')}
                                        </td>
                                        <td>{asignacion.fecha_asignacion}</td>
                                        <td>{asignacion.estado}</td>
                                        <td>
                                            <div className="d-flex gap-1 flex-wrap">
                                                <button
                                                    className="btn btn-info btn-sm"
                                                    onClick={() =>
                                                        consultarDetalle(asignacion.id)
                                                    }
                                                >
                                                    Ver
                                                </button>

                                                {puedeAdministrar && (
                                                    <>
                                                        <button
                                                            className="btn btn-warning btn-sm"
                                                            onClick={() =>
                                                                iniciarEdicion(asignacion)
                                                            }
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() =>
                                                                eliminarAsignacion(asignacion.id)
                                                            }
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {asignacionDetalle && (
                <div className="card p-3 mb-4">
                    <h4>Detalle de asignación #{asignacionDetalle.id}</h4>

                    <p>
                        <strong>Evaluación:</strong>{' '}
                        {asignacionDetalle.evaluacion}
                    </p>

                    <p>
                        <strong>Estudiante:</strong>{' '}
                        {asignacionDetalle.estudiante_nombre}
                    </p>

                    <p>
                        <strong>Carrera:</strong>{' '}
                        {asignacionDetalle.estudiante_carrera}
                    </p>

                    <p>
                        <strong>Monto mensual:</strong>{' '}
                        ₡{Number(
                            asignacionDetalle.monto_mensual
                        ).toLocaleString('es-CR')}
                    </p>

                    <p>
                        <strong>Fecha:</strong>{' '}
                        {asignacionDetalle.fecha_asignacion}
                    </p>

                    <p>
                        <strong>Estado:</strong>{' '}
                        {asignacionDetalle.estado}
                    </p>

                    <button
                        className="btn btn-secondary"
                        onClick={() => setAsignacionDetalle(null)}
                    >
                        Cerrar detalle
                    </button>
                </div>
            )}

            {asignacionEditando && (
                <div className="card p-3 mb-4">
                    <h4>Editar asignación #{asignacionEditando.id}</h4>

                    <p>
                        <strong>Evaluación:</strong>{' '}
                        {asignacionEditando.evaluacion}
                    </p>

                    <form onSubmit={guardarEdicion}>
                        <div className="mb-3">
                            <label className="form-label">
                                Monto mensual (₡)
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                min="0.01"
                                step="0.01"
                                value={montoEdicion}
                                onChange={(e) =>
                                    setMontoEdicion(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Estado
                            </label>

                            <select
                                className="form-select"
                                value={estadoEdicion}
                                onChange={(e) =>
                                    setEstadoEdicion(e.target.value)
                                }
                                required
                            >
                                <option value="ACTIVA">Activa</option>
                                <option value="FINALIZADA">Finalizada</option>
                                <option value="CANCELADA">Cancelada</option>
                            </select>
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={guardando}
                            >
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setAsignacionEditando(null)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

export default Asignaciones
