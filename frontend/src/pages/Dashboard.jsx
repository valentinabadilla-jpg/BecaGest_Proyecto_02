import { useEffect, useState } from 'react'
import { BASE_URL, peticionAPI } from '../services/api'

import Alertas from '../components/Alertas'
import EstadoCarga from '../components/EstadoCarga'

function Dashboard({ token }) {

    const [resumen, setResumen] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    // CARGAR RESUMEN DESDE DJANGO

    useEffect(() => {

        const controlador = new AbortController()

        async function cargarResumen() {

            setCargando(true)
            setError('')

            try {

                const respuesta = await peticionAPI(
                    `${BASE_URL}/api/reportes/resumen/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`
                        },
                        signal: controlador.signal
                    }
                )

                if (!respuesta.ok) {

                    if (respuesta.status === 401) {
                        throw new Error(
                            'Debes iniciar sesión nuevamente.'
                        )
                    }

                    if (respuesta.status === 403) {
                        throw new Error(
                            'No tienes permiso para consultar el resumen.'
                        )
                    }

                    throw new Error(
                        'No se pudo cargar el resumen.'
                    )
                }

                const datos = await respuesta.json()

                setResumen(datos)

            } catch (err) {

                if (err.name !== 'AbortError') {

                    setError(
                        err instanceof TypeError
                            ? 'No se pudo conectar con el servidor.'
                            : err.message
                    )
                }

            } finally {

                if (!controlador.signal.aborted) {
                    setCargando(false)
                }
            }
        }

        cargarResumen()

        return () => controlador.abort()

    }, [token])

    return (

        <div>

            <h2 className="mb-4">
                Dashboard
            </h2>

            {/* COMPONENTE REUTILIZABLE DE ALERTAS */}

            <Alertas error={error} />

            {/* COMPONENTE REUTILIZABLE DE ESTADO DE CARGA */}

            <EstadoCarga
                cargando={cargando}
                error={error}
                vacio={!resumen}
                mensajeCarga="Cargando resumen..."
                mensajeVacio="No hay información disponible."
            >

                {resumen && (

                    <>

                        <div className="row">

                            <div className="col-md-4 mb-3">

                                <div className="card p-3">

                                    <h5>Total de estudiantes</h5>

                                    <h3>
                                        {resumen.total_estudiantes}
                                    </h3>

                                </div>

                            </div>

                            <div className="col-md-4 mb-3">

                                <div className="card p-3">

                                    <h5>Convocatorias activas</h5>

                                    <h3>
                                        {resumen.convocatorias_activas}
                                    </h3>

                                </div>

                            </div>

                            <div className="col-md-4 mb-3">

                                <div className="card p-3">

                                    <h5>Solicitudes pendientes</h5>

                                    <h3>
                                        {resumen.solicitudes_pendientes}
                                    </h3>

                                </div>

                            </div>

                            <div className="col-md-4 mb-3">

                                <div className="card p-3">

                                    <h5>Solicitudes aprobadas</h5>

                                    <h3>
                                        {resumen.solicitudes_aprobadas}
                                    </h3>

                                </div>

                            </div>

                            <div className="col-md-4 mb-3">

                                <div className="card p-3">

                                    <h5>Evaluaciones realizadas</h5>

                                    <h3>
                                        {resumen.evaluaciones_realizadas}
                                    </h3>

                                </div>

                            </div>

                            <div className="col-md-4 mb-3">

                                <div className="card p-3">

                                    <h5>Asignaciones no canceladas</h5>

                                    <h3>
                                        {resumen.asignaciones_no_canceladas}
                                    </h3>

                                </div>

                            </div>

                            <div className="col-md-4 mb-3">

                                <div className="card p-3">

                                    <h5>Monto mensual total</h5>

                                    <h3>
                                        ₡{Number(
                                            resumen.monto_mensual_total || 0
                                        ).toLocaleString('es-CR')}
                                    </h3>

                                </div>

                            </div>

                        </div>

                        {/* SOLICITUDES POR CONVOCATORIA */}

                        <div className="card p-3 mt-3">

                            <h4>Solicitudes por convocatoria</h4>

                            <EstadoCarga
                                vacio={
                                    !resumen.solicitudes_por_convocatoria?.length
                                }
                                mensajeVacio="No hay información de solicitudes por convocatoria."
                            >

                                {resumen.solicitudes_por_convocatoria?.map(
                                    item => (

                                        <p key={item.id}>

                                            {item.nombre}:{" "}
                                            {item.total_solicitudes} solicitudes

                                        </p>

                                    )
                                )}

                            </EstadoCarga>

                        </div>

                        {/* SOLICITUDES POR ESTADO */}

                        <div className="card p-3 mt-3">

                            <h4>Solicitudes por estado</h4>

                            <EstadoCarga
                                vacio={
                                    !resumen.solicitudes_por_estado?.length
                                }
                                mensajeVacio="No hay solicitudes registradas."
                            >

                                {resumen.solicitudes_por_estado?.map(
                                    (item, index) => (

                                        <p key={index}>

                                            {item.estado}: {item.total}

                                        </p>

                                    )
                                )}

                            </EstadoCarga>

                        </div>

                        {/* ESTUDIANTES POR CARRERA */}

                        <div className="card p-3 mt-3">

                            <h4>Estudiantes por carrera</h4>

                            <EstadoCarga
                                vacio={
                                    !resumen.estudiantes_por_carrera?.length
                                }
                                mensajeVacio="No hay estudiantes registrados por carrera."
                            >

                                {resumen.estudiantes_por_carrera?.map(
                                    (item, index) => (

                                        <p key={index}>

                                            {item.carrera}: {item.total}

                                        </p>

                                    )
                                )}

                            </EstadoCarga>

                        </div>

                    </>

                )}

            </EstadoCarga>

        </div>
    )
}

export default Dashboard