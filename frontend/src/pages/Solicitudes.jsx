import { useEffect, useState } from "react";

const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const API_URL = `${BASE_URL}/api/solicitudes/`;
const API_ESTUDIANTES = `${BASE_URL}/api/estudiantes/`;
const API_CONVOCATORIAS = `${BASE_URL}/api/convocatorias/`;

const inicial = {
  estudiante: "",
  convocatoria: "",
  motivo: ""
};

const ESTADOS = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada"
};

const CLASES_ESTADO = {
  PENDIENTE: "bg-warning text-dark",
  APROBADA: "bg-success",
  RECHAZADA: "bg-danger"
};

const CAMPOS = {
  estudiante: "Estudiante",
  convocatoria: "Convocatoria",
  motivo: "Motivo"
};

// Convierte los mensajes en inglés de DRF y los mensajes de duplicidad
// en textos comprensibles para el usuario.
function traducir(texto) {
  const t = String(texto);

  if (/unique set|ya existe una solicitud/i.test(t)) {
    return "Ya existe una solicitud de este estudiante para esta convocatoria. No se permiten solicitudes duplicadas.";
  }

  if (/may not be (blank|null)/i.test(t)) {
    return "Este campo no puede estar vacío.";
  }

  if (/required/i.test(t)) {
    return "Este campo es obligatorio.";
  }

  if (/invalid pk|does not exist|incorrect type/i.test(t)) {
    return "Selecciona una opción válida de la lista.";
  }

  const largo = t.match(/no more than (\d+) characters/i);

  if (largo) {
    return `No puede superar los ${largo[1]} caracteres.`;
  }

  return t;
}

function obtenerError(datos, estado) {
  const contenido = datos || {};

  if (estado === 401) return "Debes iniciar sesión.";

  if (estado === 403) {
    return (
      contenido.error ||
      contenido.detail ||
      "No tienes permiso para esta operación."
    );
  }

  if (estado === 404) return "Solicitud no encontrada.";

  if (estado === 409) {
    return `${contenido.error || "La solicitud ya fue evaluada."} Ya no se puede modificar ni eliminar.`;
  }

  const errores = Object.entries(contenido).map(
    ([campo, mensaje]) => {
      const texto = (Array.isArray(mensaje) ? mensaje : [mensaje])
        .map(traducir)
        .join(", ");

      return CAMPOS[campo] ? `${CAMPOS[campo]}: ${texto}` : texto;
    }
  );

  return errores.join(" | ") || `Error HTTP ${estado}`;
}

function crearError(datos, estado) {
  const error = new Error(obtenerError(datos, estado));
  error.estado = estado;
  return error;
}

function mensajeError(err) {
  if (err instanceof TypeError) {
    return "No se pudo conectar con el servidor. Verifica que Django esté en ejecución.";
  }

  return err.message;
}

async function leerJson(respuesta) {
  try {
    return await respuesta.json();
  } catch {
    return {};
  }
}

// Recorre todas las páginas de un listado paginado de la API.
async function cargarTodas(url, token, signal, extra = {}) {
  const resultados = [];

  const parametros = new URLSearchParams({
    page_size: "50",
    ...extra
  });

  let siguiente = `${url}?${parametros.toString()}`;

  while (siguiente) {
    const respuesta = await fetch(siguiente, {
      headers: {
        Authorization: `Token ${token}`
      },
      signal
    });

    const datos = await leerJson(respuesta);

    if (!respuesta.ok) {
      throw crearError(datos, respuesta.status);
    }

    resultados.push(...(datos.results || []));
    siguiente = datos.next;
  }

  return resultados;
}

export default function Solicitudes({ token }) {

  const [solicitudes, setSolicitudes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);
  const [convocatoriasAbiertas, setConvocatoriasAbiertas] = useState([]);

  const [formulario, setFormulario] = useState(inicial);
  const [editandoId, setEditandoId] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [cargandoListas, setCargandoListas] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [errorListas, setErrorListas] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [actualizar, setActualizar] = useState(0);
  const [refrescarListas, setRefrescarListas] = useState(0);

  // Cargar estudiantes y convocatorias desde la API para los selectores
  useEffect(() => {

    if (!token) return;

    const controlador = new AbortController();

    async function cargarListas() {

      setCargandoListas(true);
      setErrorListas("");

      try {
        const [
          todosEstudiantes,
          todasConvocatorias,
          abiertas
        ] = await Promise.all([
          cargarTodas(API_ESTUDIANTES, token, controlador.signal),
          cargarTodas(API_CONVOCATORIAS, token, controlador.signal),
          cargarTodas(
            API_CONVOCATORIAS,
            token,
            controlador.signal,
            { abierta: "si" }
          )
        ]);

        setEstudiantes(todosEstudiantes);
        setConvocatorias(todasConvocatorias);
        setConvocatoriasAbiertas(abiertas);

      } catch (err) {
        if (err.name !== "AbortError") {
          setErrorListas(mensajeError(err));
          setEstudiantes([]);
          setConvocatorias([]);
          setConvocatoriasAbiertas([]);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoListas(false);
        }
      }
    }

    cargarListas();

    return () => controlador.abort();

  }, [token, refrescarListas]);

  // Cargar solicitudes desde Django
  useEffect(() => {

    if (!token) return;

    const controlador = new AbortController();

    async function cargarSolicitudes() {

      setCargando(true);
      setErrorCarga("");

      try {
        const respuesta = await fetch(API_URL, {
          headers: {
            Authorization: `Token ${token}`
          },
          signal: controlador.signal
        });

        const datos = await leerJson(respuesta);

        if (!respuesta.ok) {
          throw crearError(datos, respuesta.status);
        }

        setSolicitudes(
          Array.isArray(datos) ? datos : datos.results || []
        );

      } catch (err) {
        if (err.name !== "AbortError") {
          setErrorCarga(mensajeError(err));
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarSolicitudes();

    return () => controlador.abort();

  }, [token, actualizar]);

  const estudiantesActivos = estudiantes.filter(
    (estudiante) => estudiante.activo
  );

  // Si solo hay un estudiante disponible (caso de un usuario Estudiante)
  // se selecciona automáticamente.
  const estudianteFormulario =
    formulario.estudiante ||
    (estudiantesActivos.length === 1
      ? String(estudiantesActivos[0].id)
      : "");

  function nombreEstudiante(id) {
    const estudiante = estudiantes.find((e) => e.id === Number(id));

    return estudiante
      ? `${estudiante.nombre} ${estudiante.apellidos}`
      : `Estudiante ${id}`;
  }

  function nombreConvocatoria(id) {
    const convocatoria = convocatorias.find((c) => c.id === Number(id));

    return convocatoria ? convocatoria.nombre : `Convocatoria ${id}`;
  }

  function cambio(e) {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  }

  function editar(solicitud) {

    setEditandoId(solicitud.id);

    setFormulario({
      estudiante: String(solicitud.estudiante),
      convocatoria: String(solicitud.convocatoria),
      motivo: solicitud.motivo
    });

    setError("");
    setMensaje("");

    window.scrollTo(0, 0);
  }

  function cancelar() {
    setEditandoId(null);
    setFormulario(inicial);
  }

  async function guardar(e) {

    e.preventDefault();

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    const editando = editandoId !== null;
    const motivo = formulario.motivo.trim();

    if (!editando && !estudianteFormulario) {
      setError("Debes seleccionar un estudiante.");
      return;
    }

    if (!editando && !formulario.convocatoria) {
      setError("Debes seleccionar una convocatoria.");
      return;
    }

    if (motivo.length < 10) {
      setError("El motivo debe tener al menos 10 caracteres.");
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const url = editando
        ? `${API_URL}${editandoId}/`
        : API_URL;

      const datosEnviar = editando
        ? { motivo }
        : {
            estudiante: Number(estudianteFormulario),
            convocatoria: Number(formulario.convocatoria),
            motivo
          };

      const respuesta = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`
        },
        body: JSON.stringify(datosEnviar)
      });

      const datos = await leerJson(respuesta);

      if (!respuesta.ok) {
        throw crearError(datos, respuesta.status);
      }

      cancelar();

      setMensaje(
        editando
          ? "Solicitud actualizada correctamente."
          : "Solicitud registrada correctamente. Su estado inicial es Pendiente."
      );

      setActualizar(n => n + 1);

    } catch (err) {
      setError(mensajeError(err));

      // Si la solicitud ya fue evaluada, se actualiza la lista
      // para mostrar su estado real.
      if (err.estado === 409) {
        setActualizar(n => n + 1);
      }

    } finally {
      setProcesando(false);
    }
  }

  async function eliminar(id) {

    if (!window.confirm("¿Deseas eliminar esta solicitud?")) {
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
        const datos = await leerJson(respuesta);

        throw crearError(datos, respuesta.status);
      }

      if (editandoId === id) {
        cancelar();
      }

      setMensaje("Solicitud eliminada correctamente.");
      setActualizar(n => n + 1);

    } catch (err) {
      setError(mensajeError(err));

      if (err.estado === 409) {
        setActualizar(n => n + 1);
      }

    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="container mt-4 mb-5">

      <h2>Solicitudes</h2>
      <p>Registro y seguimiento de solicitudes de beca de BecaGest</p>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {errorCarga && (
        <div className="alert alert-danger">
          {errorCarga}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success">
          {mensaje}
        </div>
      )}

      {errorListas && (
        <div className="alert alert-danger">
          No se pudieron cargar los estudiantes y convocatorias: {errorListas}
        </div>
      )}

      {!token && (
        <div className="alert alert-warning">
          Debes iniciar sesión para utilizar este módulo.
        </div>
      )}

      <div className="card p-3 mb-4">

        <h4>
          {editandoId !== null
            ? "Editar solicitud"
            : "Registrar solicitud"}
        </h4>

        <p className="text-muted">
          El sistema valida los permisos de tu usuario.
          Una solicitud solo se puede editar o eliminar
          mientras esté pendiente.
        </p>

        <form onSubmit={guardar}>

          <label className="form-label">
            Estudiante
          </label>

          {editandoId === null ? (
            <select
              className="form-select mb-2"
              name="estudiante"
              value={estudianteFormulario}
              onChange={cambio}
              disabled={!token || cargandoListas}
              required
            >
              <option value="">
                Seleccionar estudiante
              </option>

              {estudiantesActivos.map((estudiante) => (
                <option
                  key={estudiante.id}
                  value={estudiante.id}
                >
                  {estudiante.nombre} {estudiante.apellidos} ({estudiante.identificacion})
                </option>
              ))}
            </select>
          ) : (
            <input
              className="form-control mb-2"
              value={nombreEstudiante(formulario.estudiante)}
              readOnly
            />
          )}

          <label className="form-label">
            Convocatoria
          </label>

          {editandoId === null ? (
            <select
              className="form-select mb-2"
              name="convocatoria"
              value={formulario.convocatoria}
              onChange={cambio}
              disabled={!token || cargandoListas}
              required
            >
              <option value="">
                Seleccionar convocatoria
              </option>

              {convocatoriasAbiertas.map((convocatoria) => (
                <option
                  key={convocatoria.id}
                  value={convocatoria.id}
                >
                  {convocatoria.nombre} (hasta {convocatoria.fecha_fin})
                </option>
              ))}
            </select>
          ) : (
            <input
              className="form-control mb-2"
              value={nombreConvocatoria(formulario.convocatoria)}
              readOnly
            />
          )}

          {editandoId === null ? (
            <>
              <div className="mb-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setRefrescarListas(n => n + 1)}
                  disabled={!token || cargandoListas}
                >
                  Actualizar listas
                </button>
              </div>

              {cargandoListas && (
                <p>Cargando estudiantes y convocatorias...</p>
              )}

              {!cargandoListas &&
                !errorListas &&
                token &&
                estudiantesActivos.length === 0 && (
                  <div className="alert alert-info">
                    No hay estudiantes activos disponibles.
                    Registra un estudiante en el módulo Estudiantes
                    y actualiza las listas.
                  </div>
                )}

              {!cargandoListas &&
                !errorListas &&
                token &&
                convocatoriasAbiertas.length === 0 && (
                  <div className="alert alert-info">
                    No hay convocatorias abiertas.
                    Registra o activa una convocatoria en el módulo
                    Convocatorias y actualiza las listas.
                  </div>
                )}
            </>
          ) : (
            <p className="text-muted">
              El estudiante y la convocatoria de una solicitud
              no se pueden cambiar.
            </p>
          )}

          <label className="form-label">
            Motivo
          </label>

          <textarea
            className="form-control mb-3"
            name="motivo"
            value={formulario.motivo}
            onChange={cambio}
            minLength="10"
            maxLength="300"
            rows="3"
            required
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              !token ||
              procesando ||
              (editandoId === null &&
                (estudiantesActivos.length === 0 ||
                  convocatoriasAbiertas.length === 0))
            }
          >
            {procesando
              ? "Procesando..."
              : editandoId !== null
                ? "Actualizar"
                : "Guardar solicitud"}
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

      <h4>Lista de solicitudes</h4>

      <p>Total de solicitudes encontradas: {solicitudes.length}</p>

      {cargando ? (
        <p>Cargando solicitudes...</p>
      ) : !token ? (
        <p>Inicia sesión para consultar los registros.</p>
      ) : solicitudes.length === 0 ? (
        <div className="alert alert-info">
          No hay solicitudes para mostrar.
        </div>
      ) : (
        <div className="table-responsive">

          <table className="table table-striped table-bordered">

            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Estudiante</th>
                <th>Convocatoria</th>
                <th>Fecha</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {solicitudes.map((solicitud) => (
                <tr key={solicitud.id}>

                  <td>{solicitud.id}</td>
                  <td>{nombreEstudiante(solicitud.estudiante)}</td>
                  <td>{nombreConvocatoria(solicitud.convocatoria)}</td>
                  <td>{solicitud.fecha_solicitud}</td>
                  <td>{solicitud.motivo}</td>

                  <td>
                    <span
                      className={`badge ${
                        CLASES_ESTADO[solicitud.estado] || "bg-secondary"
                      }`}
                    >
                      {ESTADOS[solicitud.estado] || solicitud.estado}
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2 mb-1"
                      onClick={() => editar(solicitud)}
                      disabled={procesando}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-danger btn-sm mb-1"
                      onClick={() => eliminar(solicitud.id)}
                      disabled={procesando}
                    >
                      Eliminar
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

    </div>
  );
}
