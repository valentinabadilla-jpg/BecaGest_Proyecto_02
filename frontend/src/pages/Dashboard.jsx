
import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Dashboard({ token }) {

    const [resumen, setResumen] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {

        async function cargarResumen() {

            try {
                const respuesta = await fetch(
                    `${BASE_URL}/api/reportes/resumen/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`
                        }
                    }
                )

                if (!respuesta.ok) {
                    throw new Error('No se pudo cargar el resumen.')
                }

                const datos = await respuesta.json()

                setResumen(datos)

            } catch (err) {
                setError(err.message)
            } finally {
                setCargando(false)
            }
        }

        cargarResumen()

    }, [token])

    if (cargando) {
        return <p>Cargando resumen...</p>
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>
    }

    return (
        <div>

            <h2 className="mb-4">Dashboard</h2>

            <div className="row">

                <div className="col-md-4 mb-3">
                    <div className="card p-3">
                        <h5>Total de estudiantes</h5>
                        <h3>{resumen.total_estudiantes}</h3>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card p-3">
                        <h5>Convocatorias activas</h5>
                        <h3>{resumen.convocatorias_activas}</h3>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card p-3">
                        <h5>Solicitudes pendientes</h5>
                        <h3>{resumen.solicitudes_pendientes}</h3>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card p-3">
                        <h5>Solicitudes aprobadas</h5>
                        <h3>{resumen.solicitudes_aprobadas}</h3>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card p-3">
                        <h5>Evaluaciones realizadas</h5>
                        <h3>{resumen.evaluaciones_realizadas}</h3>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card p-3">
                        <h5>Asignaciones no canceladas</h5>
                        <h3>{resumen.asignaciones_no_canceladas}</h3>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card p-3">
                        <h5>Monto mensual total</h5>
                        <h3>
                            ₡{Number(resumen.monto_mensual_total).toLocaleString('es-CR')}
                        </h3>
                    </div>
                </div>

            </div>

            <div className="card p-3 mt-3">

                <h4>Solicitudes por convocatoria</h4>

                {resumen.solicitudes_por_convocatoria.map((item) => (
                    <p key={item.id}>
                        {item.nombre}: {item.total_solicitudes} solicitudes
                    </p>
                ))}

            </div>

            <div className="card p-3 mt-3">

                <h4>Solicitudes por estado</h4>

                {resumen.solicitudes_por_estado.map((item, index) => (
                    <p key={index}>
                        {item.estado}: {item.total}
                    </p>
                ))}

            </div>

            <div className="card p-3 mt-3">

                <h4>Estudiantes por carrera</h4>

                {resumen.estudiantes_por_carrera.map((item, index) => (
                    <p key={index}>
                        {item.carrera}: {item.total}
                    </p>
                ))}

            </div>

        </div>
    )
}

export default Dashboard
