function EstadoCarga({
    cargando,
    error,
    vacio,
    mensajeCarga = 'Cargando datos...',
    mensajeVacio = 'No hay registros para mostrar.',
    children
}) {

    if (cargando) {
        return (
            <div className="d-flex align-items-center gap-2 my-3" role="status">

                <div className="spinner-border spinner-border-sm text-primary">
                </div>

                <span>{mensajeCarga}</span>

            </div>
        )
    }

    if (error) {
        return (
            <p>No se pudieron cargar los registros.</p>
        )
    }

    if (vacio) {
        return (
            <div className="alert alert-info">
                {mensajeVacio}
            </div>
        )
    }

    return children
}

export default EstadoCarga