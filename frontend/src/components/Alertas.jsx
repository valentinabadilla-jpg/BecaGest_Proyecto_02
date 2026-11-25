function Alertas({ error, mensaje }) {

    return (
        <>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {mensaje && (
                <div className="alert alert-success" role="status">
                    {mensaje}
                </div>
            )}
        </>
    )
}

export default Alertas