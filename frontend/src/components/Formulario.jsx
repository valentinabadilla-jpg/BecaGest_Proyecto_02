function Formulario({
    titulo,
    onSubmit,
    children
}) {

    return (
        <div className="card p-3 mb-4">

            <h4>{titulo}</h4>

            <form onSubmit={onSubmit}>

                {children}

            </form>

        </div>
    )
}

export default Formulario