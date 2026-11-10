
import { useEffect, useState } from "react";

const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const API_URL = `${BASE_URL}/api/convocatorias/`;

const inicial = {
  nombre: "",
  descripcion: "",
  fecha_inicio: "",
  fecha_fin: "",
  cupos: "",
  activa: true
};

function obtenerError(datos, estado) {
  if (estado === 401) return "Debes iniciar sesión.";

  if (estado === 403) {
    return datos?.error || datos?.detail || "No tienes permiso.";
  }

  if (estado === 404) return "Convocatoria no encontrada.";

  if (estado === 409) {
    return datos?.error || "La convocatoria tiene registros relacionados.";
  }

  if (datos?.error) return datos.error;
  if (datos?.detail) return datos.detail;

  if (datos && typeof datos === "object") {
    const errores = Object.entries(datos).map(
      ([campo, mensaje]) =>
        `${campo}: ${
          Array.isArray(mensaje)
            ? mensaje.join(", ")
            : mensaje
        }`
    );

    if (errores.length) return errores.join(" | ");
  }

  return `Error HTTP ${estado}`;
}

export default function Convocatorias({ token, esAdmin }) {

  const [convocatorias, setConvocatorias] = useState([]);
  const [formulario, setFormulario] = useState(inicial);
  const [editandoId, setEditandoId] = useState(null);

  const [buscar, setBuscar] = useState("");
  const [activa, setActiva] = useState("");
  const [abierta, setAbierta] = useState("");
  const [orden, setOrden] = useState("id");

  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [siguiente, setSiguiente] = useState(false);
  const [anterior, setAnterior] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [errorLista, setErrorLista] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [actualizar, setActualizar] = useState(0);

  // CARGAR CONVOCATORIAS DESDE DJANGO

  useEffect(() => {
    if (!token) return;

    const controlador = new AbortController();

    async function cargarConvocatorias() {
      setCargando(true);
      setErrorLista("");

      try {
        const parametros = new URLSearchParams();

        parametros.set("page", pagina);
        parametros.set("orden", orden);

        if (buscar.trim()) {
          parametros.set("buscar", buscar.trim());
        }

        if (activa !== "") {
          parametros.set("activa", activa);
        }

        if (abierta === "si") {
          parametros.set("abierta", "si");
        }

        const respuesta = await fetch(
          `${API_URL}?${parametros}`,
          {
            headers: {
              Authorization: `Token ${token}`
            },
            signal: controlador.signal
          }
        );

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
          throw new Error(
            obtenerError(datos, respuesta.status)
          );
        }

        const lista = Array.isArray(datos)
          ? datos
          : datos.results || [];

        setConvocatorias(lista);

        setTotal(
          Array.isArray(datos)
            ? lista.length
            : datos.count || 0
        );

        setSiguiente(Boolean(datos.next));
        setAnterior(Boolean(datos.previous));

      } catch (err) {
        if (err.name !== "AbortError") {
          setErrorLista(err.message);
          setConvocatorias([]);
          setTotal(0);
        }

      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarConvocatorias();

    return () => controlador.abort();

  }, [
    token,
    buscar,
    activa,
    abierta,
    orden,
    pagina,
    actualizar
  ]);

  // CAMBIAR CAMPOS DEL FORMULARIO

  function cambio(e) {
    const { name, value, type, checked } = e.target;

    setFormulario({
      ...formulario,
      [name]: type === "checkbox" ? checked : value
    });
  }

  // CANCELAR EDICION

  function cancelar() {
    setFormulario(inicial);
    setEditandoId(null);
  }

  // EDITAR CONVOCATORIA

  function editar(convocatoria) {
    setEditandoId(convocatoria.id);

    setFormulario({
      nombre: convocatoria.nombre,
      descripcion: convocatoria.descripcion,
      fecha_inicio: convocatoria.fecha_inicio,
      fecha_fin: convocatoria.fecha_fin,
      cupos: convocatoria.cupos,
      activa: convocatoria.activa
    });

    setError("");
    setMensaje("");
    window.scrollTo(0, 0);
  }

  // GUARDAR O ACTUALIZAR

  async function guardar(e) {
    e.preventDefault();

    if (!esAdmin) return;

    if (formulario.fecha_fin < formulario.fecha_inicio) {
      setError("La fecha final no puede ser anterior a la inicial.");
      return;
    }

    if (Number(formulario.cupos) <= 0) {
      setError("Los cupos deben ser mayores que cero.");
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const editando = editandoId !== null;

      const datosEnviar = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        fecha_inicio: formulario.fecha_inicio,
        fecha_fin: formulario.fecha_fin,
        cupos: Number(formulario.cupos),
        activa: formulario.activa
      };

      const respuesta = await fetch(
        editando ? `${API_URL}${editandoId}/` : API_URL,
        {
          method: editando ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`
          },
          body: JSON.stringify(datosEnviar)
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          obtenerError(datos, respuesta.status)
        );
      }

      cancelar();

      setMensaje(
        editando
          ? "Convocatoria actualizada correctamente."
          : "Convocatoria registrada correctamente."
      );

      setPagina(1);
      setActualizar(n => n + 1);

    } catch (err) {
      setError(err.message);

    } finally {
      setProcesando(false);
    }
  }

  // ELIMINAR CONVOCATORIA

  async function eliminar(id) {
    if (
      !esAdmin ||
      !window.confirm("¿Deseas eliminar esta convocatoria?")
    ) {
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`
        }
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));

        throw new Error(
          obtenerError(datos, respuesta.status)
        );
      }

      if (editandoId === id) cancelar();

      setMensaje("Convocatoria eliminada correctamente.");

      if (convocatorias.length === 1 && pagina > 1) {
        setPagina(p => p - 1);
      }

      setActualizar(n => n + 1);

    } catch (err) {
      setError(err.message);

    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="container mt-4 mb-5">
      <h2>Convocatorias</h2>
      <p>Consulta de convocatorias de BecaGest</p>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {errorLista && (
        <div className="alert alert-danger">{errorLista}</div>
      )}

      {mensaje && (
        <div className="alert alert-success">{mensaje}</div>
      )}

      {/* FORMULARIO SOLO PARA ADMINISTRADOR */}

      {esAdmin && (
        <div className="card p-3 mb-4">
          <h4>
            {editandoId !== null
              ? "Editar convocatoria"
              : "Registrar convocatoria"}
          </h4>

          <form onSubmit={guardar}>
            <label className="form-label">
              Nombre
            </label>

            <input
              className="form-control mb-2"
              name="nombre"
              value={formulario.nombre}
              onChange={cambio}
              maxLength="120"
              required
            />

            <label className="form-label">
              Descripción
            </label>

            <textarea
              className="form-control mb-2"
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambio}
              maxLength="250"
              required
            />

            <label className="form-label">
              Fecha de inicio
            </label>

            <input
              type="date"
              className="form-control mb-2"
              name="fecha_inicio"
              value={formulario.fecha_inicio}
              onChange={cambio}
              required
            />

            <label className="form-label">
              Fecha de finalización
            </label>

            <input
              type="date"
              className="form-control mb-2"
              name="fecha_fin"
              min={formulario.fecha_inicio || undefined}
              value={formulario.fecha_fin}
              onChange={cambio}
              required
            />

            <label className="form-label">
              Cupos disponibles
            </label>

            <input
              type="number"
              className="form-control mb-2"
              name="cupos"
              min="1"
              step="1"
              value={formulario.cupos}
              onChange={cambio}
              required
            />

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="convocatoria-activa"
                name="activa"
                checked={formulario.activa}
                onChange={cambio}
              />

              <label
                className="form-check-label"
                htmlFor="convocatoria-activa"
              >
                Convocatoria activa
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={procesando}
            >
              {procesando
                ? "Procesando..."
                : editandoId !== null
                  ? "Actualizar"
                  : "Guardar convocatoria"}
            </button>

            {editandoId !== null && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={cancelar}
                disabled={procesando}
              >
                Cancelar
              </button>
            )}
          </form>
        </div>
      )}

      {/* BUSQUEDA, FILTROS Y ORDENAMIENTO */}

      <div className="card p-3 mb-4">
        <h4>Buscar y filtrar convocatorias</h4>

        <label className="form-label">
          Buscar por nombre o descripción
        </label>

        <input
          className="form-control mb-2"
          placeholder="Buscar convocatoria"
          value={buscar}
          onChange={e => {
            setBuscar(e.target.value);
            setPagina(1);
          }}
        />

        <label className="form-label">
          Estado
        </label>

        <select
          className="form-select mb-2"
          value={activa}
          onChange={e => {
            setActiva(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>

        <label className="form-label">
          Convocatorias abiertas
        </label>

        <select
          className="form-select mb-2"
          value={abierta}
          onChange={e => {
            setAbierta(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todas</option>
          <option value="si">
            Solo abiertas actualmente
          </option>
        </select>

        <label className="form-label">
          Ordenar por
        </label>

        <select
          className="form-select"
          value={orden}
          onChange={e => {
            setOrden(e.target.value);
            setPagina(1);
          }}
        >
          <option value="id">ID ascendente</option>
          <option value="-id">ID descendente</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="-nombre">Nombre Z-A</option>
          <option value="fecha_fin">
            Fecha final ascendente
          </option>
          <option value="-fecha_fin">
            Fecha final descendente
          </option>
        </select>
      </div>

      {/* LISTA DE CONVOCATORIAS */}

      <h4>Lista de convocatorias</h4>

      <p>Total de convocatorias encontradas: {total}</p>

      {cargando ? (
        <p>Cargando convocatorias...</p>

      ) : errorLista ? (
        <p>No se pudieron cargar las convocatorias.</p>

      ) : convocatorias.length === 0 ? (
        <div className="alert alert-info">
          No hay convocatorias para mostrar.
        </div>

      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Fecha inicio</th>
                <th>Fecha fin</th>
                <th>Cupos</th>
                <th>Activa</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {convocatorias.map(convocatoria => (
                <tr key={convocatoria.id}>
                  <td>{convocatoria.id}</td>
                  <td>{convocatoria.nombre}</td>
                  <td>{convocatoria.descripcion}</td>
                  <td>{convocatoria.fecha_inicio}</td>
                  <td>{convocatoria.fecha_fin}</td>
                  <td>{convocatoria.cupos}</td>
                  <td>
                    {convocatoria.activa ? "Sí" : "No"}
                  </td>

                  {esAdmin && (
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2 mb-1"
                        onClick={() =>
                          editar(convocatoria)
                        }
                        disabled={procesando}
                      >
                        Editar
                      </button>

                      <button
                        className="btn btn-danger btn-sm mb-1"
                        onClick={() =>
                          eliminar(convocatoria.id)
                        }
                        disabled={procesando}
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINACION */}

      <div className="d-flex align-items-center gap-2 mt-3">
        <button
          className="btn btn-secondary"
          disabled={!anterior || cargando}
          onClick={() => setPagina(p => p - 1)}
        >
          Anterior
        </button>

        <span>Página {pagina}</span>

        <button
          className="btn btn-primary"
          disabled={!siguiente || cargando}
          onClick={() => setPagina(p => p + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

