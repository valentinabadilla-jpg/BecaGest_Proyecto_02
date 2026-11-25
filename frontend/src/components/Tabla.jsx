function Tabla({ columnas, children }) {

    return (
        <div className="table-responsive">

            <table className="table table-striped table-bordered">

                <thead className="table-dark">

                    <tr>
                        {columnas.map((columna, index) => (
                            <th key={index}>
                                {columna}
                            </th>
                        ))}
                    </tr>

                </thead>

                <tbody>
                    {children}
                </tbody>

            </table>

        </div>
    )
}

export default Tabla