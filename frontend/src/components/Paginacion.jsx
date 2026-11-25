function Paginacion({
    pagina,
    anterior,
    siguiente,
    cargando,
    onAnterior,
    onSiguiente
}) {
    return (
        <div className="d-flex align-items-center gap-2 mt-3">

            <button
                type="button"
                className="btn btn-secondary"
                disabled={!anterior || cargando}
                onClick={onAnterior}
            >
                Anterior
            </button>

            <span>Página {pagina}</span>

            <button
                type="button"
                className="btn btn-primary"
                disabled={!siguiente || cargando}
                onClick={onSiguiente}
            >
                Siguiente
            </button>

        </div>
    )
}

export default Paginacion