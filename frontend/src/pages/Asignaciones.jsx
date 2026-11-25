import { useEffect, useState } from 'react'
import { BASE_URL, peticionAPI } from '../services/api'

import Alertas from '../components/Alertas'
import EstadoCarga from '../components/EstadoCarga'
import Tabla from '../components/Tabla'
import Formulario from '../components/Formulario'

const API_URL = `${BASE_URL}/api/asignaciones/`
const API_EVALUACIONES = `${BASE_URL}/api/evaluaciones/`

function obtenerMensajeError(datos, status) {

    if (status === 401) {
        return 'Debes iniciar sesión nuevamente.'
    }

    if (status === 403) {
        return 'No tienes permisos para realizar esta operación.'
    }

    if (status === 404) {
        return 'La asignación solicitada no existe.'
    }

    if (status === 409) {
        return datos?.error || 'Existe un conflicto con la asignación.'
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
            .join(' ') || `Error HTTP ${status}`
    }

    return `Error HTTP ${status}`
}

async function leerRespuesta(respuesta) {

    if (respuesta.status === 204) {
        return null
    }

    return respuesta.json().catch(() => null)
}

async function cargarListado(url, token, signal) {

    const resultados = []
    let siguiente = url

    while (siguiente) {

        const respuesta = await peticionAPI(
            siguiente,
            {
                headers: {
                    Authorization: `Token ${token}`
                },
                signal
            }
        )

        const datos = await leerRespuesta(respuesta)

        if (!respuesta.ok) {

            throw new Error(
                obtenerMensajeError(datos, respuesta.status)
            )
        }

        if (Array.isArray(datos)) {

            resultados.push(...datos)

            break
        }

        resultados.push(...(datos?.results || []))

        siguiente = datos?.next
    }

    return resultados
}

function Asignaciones({
    token,
    esAdmin,
    esEncargado,
    esEstudiante
}) {

    const puedeAdministrar = esAdmin || esEncargado

    const [asignaciones, setAsignaciones] = useState([])
    const [todasAsignaciones, setTodasAsignaciones] = useState([])
    const [evaluaciones, setEvaluaciones] = useState([])

    const [
        evaluacionSeleccionada,
        setEvaluacionSeleccionada
    ] = useState('')

    const [montoMensual, setMontoMensual] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')

    const [
        asignacionDetalle,
        setAsignacionDetalle
    ] = useState(null)

    const [
        asignacionEditando,
        setAsignacionEditando
    ] = useState(null)

    const [montoEdicion, setMontoEdicion] = useState('')
    const [estadoEdicion, setEstadoEdicion] = useState('')

    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [errorCarga, setErrorCarga] = useState('')

    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [actualizar, setActualizar] = useState(0)

    // CARGAR DATOS DESDE DJANGO

    useEffect(() => {

        if (!token) return

        const controlador = new AbortController()

        async function cargarDatos() {

            setCargando(true)
            setErrorCarga('')

            try {

                const parametros =
                    puedeAdministrar && filtroEstado
                        ? `?estado=${filtroEstado}`
                        : ''

                const listaAsignaciones = await cargarListado(
                    `${API_URL}${parametros}`,
                    token,
                    controlador.signal
                )

                if (controlador.signal.aborted) return

                setAsignaciones(listaAsignaciones)

                if (puedeAdministrar) {

                    const [
                        listaCompleta,
                        listaEvaluaciones
                    ] = await Promise.all([

                        cargarListado(
                            API_URL,
                            token,
                            controlador.signal
                        ),

                        cargarListado(
                            API_EVALUACIONES,
                            token,
                            controlador.signal
                        )

                    ])

                    if (controlador.signal.aborted) return

                    setTodasAsignaciones(listaCompleta)
                    setEvaluaciones(listaEvaluaciones)

                } else {

                    setTodasAsignaciones([])
                    setEvaluaciones([])
                }

            } catch (err) {

                if (err.name !== 'AbortError') {

                    setErrorCarga(err.message)
                }

            } finally {

                if (!controlador.signal.aborted) {

                    setCargando(false)
                }
            }
        }

        cargarDatos()

        return () => controlador.abort()

    }, [
        token,
        puedeAdministrar,
        filtroEstado,
        actualizar
    ])

    // EVALUACIONES APROBADAS SIN ASIGNACION

    const evaluacionesDisponibles = evaluaciones.filter(
        evaluacion => {

            const tieneAsignacion = todasAsignaciones.some(
                asignacion =>
                    Number(asignacion.evaluacion) ===
                    Number(evaluacion.id)
            )

            return (
                evaluacion.resultado === 'APROBADA' &&
                !tieneAsignacion
            )
        }
    )

    // CREAR ASIGNACION

    async function crearAsignacion(e) {

        e.preventDefault()

        setMensaje('')
        setError('')

        if (!puedeAdministrar) {

            setError('No tienes permiso para asignar becas.')

            return
        }

        if (!evaluacionSeleccionada || !montoMensual) {

            setError(
                'Debes seleccionar una evaluación e ingresar el monto.'
            )

            return
        }

        if (
            !Number.isFinite(Number(montoMensual)) ||
            Number(montoMensual) <= 0
        ) {

            setError(
                'El monto mensual debe ser mayor que cero.'
            )

            return
        }

        const disponible = evaluacionesDisponibles.some(
            evaluacion =>
                Number(evaluacion.id) ===
                Number(evaluacionSeleccionada)
        )

        if (!disponible) {

            setError(
                'La evaluación seleccionada ya no está disponible.'
            )

            setActualizar(n => n + 1)

            return
        }

        setGuardando(true)

        try {

            const respuesta = await peticionAPI(
                API_URL,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`
                    },

                    body: JSON.stringify({
                        evaluacion: Number(evaluacionSeleccionada),
                        monto_mensual: montoMensual,
                        estado: 'ACTIVA'
                    })
                }
            )

            const datos = await leerRespuesta(respuesta)

            if (!respuesta.ok) {

                throw new Error(
                    obtenerMensajeError(
                        datos,
                        respuesta.status
                    )
                )
            }

            setEvaluacionSeleccionada('')
            setMontoMensual('')

            setMensaje(
                'Asignación creada correctamente.'
            )

            setActualizar(n => n + 1)

        } catch (err) {

            setError(err.message)

            setActualizar(n => n + 1)

        } finally {

            setGuardando(false)
        }
    }

    // CONSULTAR DETALLE

    async function consultarDetalle(id) {

        setError('')
        setMensaje('')

        try {

            const respuesta = await peticionAPI(
                `${API_URL}${id}/`,
                {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                }
            )

            const datos = await leerRespuesta(respuesta)

            if (!respuesta.ok) {

                throw new Error(
                    obtenerMensajeError(
                        datos,
                        respuesta.status
                    )
                )
            }

            setAsignacionDetalle(datos)
            setAsignacionEditando(null)

        } catch (err) {

            setError(err.message)
        }
    }

    // INICIAR EDICION

    function iniciarEdicion(asignacion) {

        if (!puedeAdministrar) return

        setAsignacionEditando(asignacion)

        setMontoEdicion(asignacion.monto_mensual)
        setEstadoEdicion(asignacion.estado)

        setAsignacionDetalle(null)

        setMensaje('')
        setError('')
    }

    // GUARDAR EDICION

    async function guardarEdicion(e) {

        e.preventDefault()

        if (!puedeAdministrar) return

        setMensaje('')
        setError('')

        if (
            !Number.isFinite(Number(montoEdicion)) ||
            Number(montoEdicion) <= 0
        ) {

            setError(
                'El monto mensual debe ser mayor que cero.'
            )

            return
        }

        setGuardando(true)

        try {

            const respuesta = await peticionAPI(
                `${API_URL}${asignacionEditando.id}/`,
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

                throw new Error(
                    obtenerMensajeError(
                        datos,
                        respuesta.status
                    )
                )
            }

            setAsignacionEditando(null)

            setMensaje(
                'Asignación actualizada correctamente.'
            )

            setActualizar(n => n + 1)

        } catch (err) {

            setError(err.message)

        } finally {

            setGuardando(false)
        }
    }

    // ELIMINAR ASIGNACION

    async function eliminarAsignacion(id) {

        if (!puedeAdministrar) return

        const confirmar = window.confirm(
            `¿Seguro que deseas eliminar la asignación ${id}?`
        )

        if (!confirmar) return

        setMensaje('')
        setError('')
        setGuardando(true)

        try {

            const respuesta = await peticionAPI(
                `${API_URL}${id}/`,
                {
                    method: 'DELETE',

                    headers: {
                        Authorization: `Token ${token}`
                    }
                }
            )

            if (!respuesta.ok) {

                const datos = await leerRespuesta(respuesta)

                throw new Error(
                    obtenerMensajeError(
                        datos,
                        respuesta.status
                    )
                )
            }

            setMensaje(
                'Asignación eliminada correctamente.'
            )

            setAsignacionDetalle(null)
            setAsignacionEditando(null)

            setActualizar(n => n + 1)

        } catch (err) {

            setError(err.message)

        } finally {

            setGuardando(false)
        }
    }

    // COLUMNAS DE LA TABLA

    const columnas = [
        'ID',
        'Estudiante',
        'Evaluación',
        'Carrera',
        'Monto mensual',
        'Fecha',
        'Estado',
        'Acciones'
    ]

    return (

        <div>

            <h2 className="mb-4">

                {puedeAdministrar
                    ? 'Asignaciones'
                    : 'Mis asignaciones'}

            </h2>

            {/* ALERTAS */}

            <Alertas
                error={error}
                mensaje={mensaje}
            />

            <Alertas error={errorCarga} />

            {/* INFORMACION PARA ESTUDIANTES */}

            {esEstudiante && !puedeAdministrar && (

                <div className="alert alert-info">

                    Puedes consultar las becas que te han sido
                    asignadas y conocer su monto mensual y estado.

                </div>

            )}

            {/* ESTADO DE CARGA */}

            <EstadoCarga
                cargando={cargando}
                error={errorCarga}
                vacio={false}
                mensajeCarga="Cargando asignaciones..."
            >

                {/* FORMULARIO DE CREACION */}

                {puedeAdministrar && (

                    <Formulario
                        titulo="Nueva asignación"
                        onSubmit={crearAsignacion}
                    >

                        <EstadoCarga
                            vacio={evaluacionesDisponibles.length === 0}
                            mensajeVacio="No hay evaluaciones disponibles para asignar."
                        >

                            <div className="mb-3">

                                <label className="form-label">

                                    Evaluación aprobada

                                </label>

                                <select
                                    className="form-select"
                                    value={evaluacionSeleccionada}
                                    onChange={e =>
                                        setEvaluacionSeleccionada(
                                            e.target.value
                                        )
                                    }
                                    disabled={guardando}
                                    required
                                >

                                    <option value="">

                                        Seleccione una evaluación

                                    </option>

                                    {evaluacionesDisponibles.map(
                                        evaluacion => (

                                            <option
                                                key={evaluacion.id}
                                                value={evaluacion.id}
                                            >

                                                Evaluación {evaluacion.id} -
                                                Solicitud {evaluacion.solicitud}

                                            </option>

                                        )
                                    )}

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
                                    onChange={e =>
                                        setMontoMensual(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ejemplo: 50000"
                                    disabled={guardando}
                                    required
                                />

                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={guardando}
                            >

                                {guardando
                                    ? 'Guardando...'
                                    : 'Crear asignación'}

                            </button>

                        </EstadoCarga>

                    </Formulario>

                )}

                {/* LISTA DE ASIGNACIONES */}

                <div className="card p-3 mb-4">

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">

                        <h4 className="mb-0">

                            Lista de asignaciones

                        </h4>

                        {puedeAdministrar && (

                            <select
                                className="form-select"
                                style={{ maxWidth: '220px' }}
                                value={filtroEstado}
                                onChange={e =>
                                    setFiltroEstado(
                                        e.target.value
                                    )
                                }
                                disabled={guardando}
                            >

                                <option value="">

                                    Todos los estados

                                </option>

                                <option value="ACTIVA">

                                    Activas

                                </option>

                                <option value="FINALIZADA">

                                    Finalizadas

                                </option>

                                <option value="CANCELADA">

                                    Canceladas

                                </option>

                            </select>

                        )}

                    </div>

                    <p>

                        Total de asignaciones mostradas:
                        {' '}{asignaciones.length}

                    </p>

                    <EstadoCarga
                        vacio={asignaciones.length === 0}
                        mensajeVacio="No hay asignaciones para mostrar."
                    >

                        <Tabla columnas={columnas}>

                            {asignaciones.map(asignacion => (

                                <tr key={asignacion.id}>

                                    <td>{asignacion.id}</td>

                                    <td>

                                        {asignacion.estudiante_nombre}

                                    </td>

                                    <td>

                                        {asignacion.evaluacion}

                                    </td>

                                    <td>

                                        {asignacion.estudiante_carrera}

                                    </td>

                                    <td>

                                        ₡{Number(
                                            asignacion.monto_mensual
                                        ).toLocaleString('es-CR')}

                                    </td>

                                    <td>

                                        {asignacion.fecha_asignacion}

                                    </td>

                                    <td>

                                        <span className={`badge ${
                                            asignacion.estado === 'ACTIVA'
                                                ? 'bg-success'
                                                : asignacion.estado === 'FINALIZADA'
                                                    ? 'bg-secondary'
                                                    : 'bg-danger'
                                        }`}>

                                            {asignacion.estado}

                                        </span>

                                    </td>

                                    <td>

                                        <div className="d-flex gap-1 flex-wrap">

                                            <button
                                                className="btn btn-info btn-sm"
                                                onClick={() =>
                                                    consultarDetalle(
                                                        asignacion.id
                                                    )
                                                }
                                                disabled={guardando}
                                            >

                                                Ver

                                            </button>

                                            {puedeAdministrar && (

                                                <>

                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() =>
                                                            iniciarEdicion(
                                                                asignacion
                                                            )
                                                        }
                                                        disabled={guardando}
                                                    >

                                                        Editar

                                                    </button>

                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() =>
                                                            eliminarAsignacion(
                                                                asignacion.id
                                                            )
                                                        }
                                                        disabled={guardando}
                                                    >

                                                        Eliminar

                                                    </button>

                                                </>

                                            )}

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </Tabla>

                    </EstadoCarga>

                </div>

                {/* DETALLE DE ASIGNACION */}

                {asignacionDetalle && (

                    <div className="card p-3 mb-4">

                        <h4>

                            Detalle de asignación #{asignacionDetalle.id}

                        </h4>

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
                            onClick={() =>
                                setAsignacionDetalle(null)
                            }
                        >

                            Cerrar detalle

                        </button>

                    </div>

                )}

                {/* FORMULARIO DE EDICION */}

                {asignacionEditando && puedeAdministrar && (

                    <Formulario
                        titulo={`Editar asignación #${asignacionEditando.id}`}
                        onSubmit={guardarEdicion}
                    >

                        <p>

                            <strong>Evaluación:</strong>{' '}

                            {asignacionEditando.evaluacion}

                        </p>

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
                                onChange={e =>
                                    setMontoEdicion(
                                        e.target.value
                                    )
                                }
                                disabled={guardando}
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
                                onChange={e =>
                                    setEstadoEdicion(
                                        e.target.value
                                    )
                                }
                                disabled={guardando}
                                required
                            >

                                <option value="ACTIVA">

                                    Activa

                                </option>

                                <option value="FINALIZADA">

                                    Finalizada

                                </option>

                                <option value="CANCELADA">

                                    Cancelada

                                </option>

                            </select>

                        </div>

                        <div className="d-flex gap-2">

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={guardando}
                            >

                                {guardando
                                    ? 'Guardando...'
                                    : 'Guardar cambios'}

                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() =>
                                    setAsignacionEditando(null)
                                }
                                disabled={guardando}
                            >

                                Cancelar

                            </button>

                        </div>

                    </Formulario>

                )}

            </EstadoCarga>

        </div>
    )
}

export default Asignaciones