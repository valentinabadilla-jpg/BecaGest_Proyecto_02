import { useEffect, useState } from "react";

const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const API_URL = `${BASE_URL}/api/evaluaciones/`;
const API_SOLICITUDES = `${BASE_URL}/api/solicitudes/`;
const API_ESTUDIANTES = `${BASE_URL}/api/estudiantes/`;
const API_CONVOCATORIAS = `${BASE_URL}/api/convocatorias/`;

const inicial = {
  solicitud: "",
  resultado: "",
  puntaje: "",
  observaciones: ""
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
  solicitud: "Solicitud",
  resultado: "Resultado",
  puntaje: "Puntaje",
  observaciones: "Observaciones"
};

// Convierte los mensajes en inglés de DRF y los mensajes de evaluación
// única en textos comprensibles para el usuario.
function traducir(texto) {
  const t = String(texto);

  if (/already exists|unique/i.test(t)) {
    return "Esta solicitud ya fue evaluada. Cada solicitud solo puede tener una evaluación.";
  }

  if (/solo se pueden evaluar solicitudes pendientes/i.test(t)) {
    return "Solo se pueden evaluar solicitudes pendientes. Esta solicitud ya fue evaluada.";
  }

  if (/may not be (blank|null)/i.test(t)) {
    return "Este campo no puede estar vacío.";
  }

  if (/valid integer/i.test(t)) {
    return "El puntaje debe ser un número entero.";
  }

  if (/required/i.test(t)) {
    return "Este campo es obligatorio.";
  }

  if (/not a valid choice/i.test(t)) {
    return "Selecciona un resultado válido de la lista.";
  }

  if (/greater than or equal to|less than or equal to/i.test(t)) {
    return "El puntaje debe estar entre 0 y 100.";
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
      "No tienes permiso para evaluar solicitudes."
    );
  }

  if (estado === 404) return "Registro no encontrado.";

  if (estado === 409) {
    return contenido.error || "No se puede completar la operación.";
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

// Lee un listado que puede venir paginado o como arreglo simple.
async function cargarListado(url, token, signal) {
  const respuesta = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`
    },
    signal
  });

  const datos = await leerJson(respuesta);

  if (!respuesta.ok) {
    throw crearError(datos, respuesta.status);
  }

  return Array.isArray(datos) ? datos : datos.results || [];
}

// Recorre todas las páginas de un listado paginado de la API.
async function cargarTodas(url, token, signal) {
  const resultados = [];

  let siguiente = `${url}?page_size=50`;

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

export default function Evaluaciones({ token }) {

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);

  const [formulario, setFormulario] = useState(inicial);
  const [ultimaEvaluacion, setUltimaEvaluacion] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState("");

  const [actualizar, setActualizar] = useState(0);

  // Cargar evaluaciones, solicitudes, estudiantes y convocatorias
  useEffect(() => {

    if (!token) return;

    const controlador = new AbortController();

    async function cargarDatos() {

      setCargando(true);
      setErrorCarga("");

      try {
        const [
          listaEvaluaciones,
          listaSolicitudes,
          listaEstudiantes,
          listaConvocatorias
        ] = await Promise.all([
          cargarListado(API_URL, token, controlador.signal),
          cargarListado(API_SOLICITUDES, token, controlador.signal),
          cargarTodas(API_ESTUDIANTES, token, controlador.signal),
          cargarTodas(API_CONVOCATORIAS, token, controlador.signal)
        ]);

        setEvaluaciones(listaEvaluaciones);
        setSolicitudes(listaSolicitudes);
        setEstudiantes(listaEstudiantes);
        setConvocatorias(listaConvocatorias);

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

    cargarDatos();

    return () => controlador.abort();

  }, [token, actualizar]);

  const solicitudesPendientes = solicitudes.filter(
    (solicitud) => solicitud.estado === "PENDIENTE"
  );

  const solicitudesEvaluadas = solicitudes.filter(
    (solicitud) => solicitud.estado !== "PENDIENTE"
  );

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

  function buscarSolicitud(id) {
    return solicitudes.find((s) => s.id === Number(id));
  }

  function etiquetaSolicitud(solicitud) {
    return `Solicitud ${solicitud.id} - ${nombreEstudiante(solicitud.estudiante)} - ${nombreConvocatoria(solicitud.convocatoria)}`;
  }

  function cambio(e) {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  }

  function cancelar() {
    setFormulario(inicial);
  }

  // Consulta el estado real de la solicitud después de evaluarla
  async function consultarEstadoSolicitud(id) {
    try {
      const respuesta = await fetch(`${API_SOLICITUDES}${id}/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });

      const datos = await leerJson(respuesta);

      return respuesta.ok ? datos.estado : null;

    } catch {
      return null;
    }
  }

  async function guardar(e) {

    e.preventDefault();

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    if (!formulario.solicitud) {
      setError("Debes seleccionar una solicitud.");
      return;
    }

    if (!formulario.resultado) {
      setError("Debes seleccionar un resultado.");
      return;
    }

    const puntaje = Number(formulario.puntaje);

    if (
      formulario.puntaje === "" ||
      !Number.isInteger(puntaje) ||
      puntaje < 0 ||
      puntaje > 100
    ) {
      setError("El puntaje debe ser un número entero entre 0 y 100.");
      return;
    }

    if (!formulario.observaciones.trim()) {
      setError("Debes escribir las observaciones de la evaluación.");
      return;
    }

    const solicitud = buscarSolicitud(formulario.solicitud);

    setProcesando(true);
    setError("");
    setUltimaEvaluacion(null);

    try {
      const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({
          solicitud: Number(formulario.solicitud),
          resultado: formulario.resultado,
          puntaje: puntaje,
          observaciones: formulario.observaciones.trim()
        })
      });

      const datos = await leerJson(respuesta);

      if (!respuesta.ok) {
        throw crearError(datos, respuesta.status);
      }

      const estadoNuevo = await consultarEstadoSolicitud(
        datos.solicitud
      );

      setUltimaEvaluacion({
        solicitud: datos.solicitud,
        estudiante: solicitud
          ? nombreEstudiante(solicitud.estudiante)
          : "",
        convocatoria: solicitud
          ? nombreConvocatoria(solicitud.convocatoria)
          : "",
        resultado: datos.resultado,
        puntaje: datos.puntaje,
        estadoAnterior: solicitud ? solicitud.estado : "PENDIENTE",
        estadoNuevo: estadoNuevo
      });

      cancelar();
      setActualizar(n => n + 1);

    } catch (err) {
      setError(mensajeError(err));

      // Se actualizan las listas para mostrar el estado real
      // de la solicitud.
      setActualizar(n => n + 1);

    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="container mt-4 mb-5">

      <h2>Evaluaciones</h2>
      <p>Revisión de solicitudes de beca por el personal autorizado</p>

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

      {ultimaEvaluacion && (
        <div className="alert alert-success">

          <h5 className="alert-heading">
            Evaluación registrada correctamente
          </h5>

          <p className="mb-1">
            Solicitud {ultimaEvaluacion.solicitud}
            {ultimaEvaluacion.estudiante &&
              `: ${ultimaEvaluacion.estudiante}`}
            {ultimaEvaluacion.convocatoria &&
              ` - ${ultimaEvaluacion.convocatoria}`}
          </p>

          <p className="mb-1">
            Resultado:{" "}
            <span
              className={`badge ${
                CLASES_ESTADO[ultimaEvaluacion.resultado] || "bg-secondary"
              }`}
            >
              {ESTADOS[ultimaEvaluacion.resultado] ||
                ultimaEvaluacion.resultado}
            </span>
            {" "}con un puntaje de {ultimaEvaluacion.puntaje} de 100.
          </p>

          <p className="mb-2">
            Estado de la solicitud:{" "}
            <span
              className={`badge ${
                CLASES_ESTADO[ultimaEvaluacion.estadoAnterior] ||
                "bg-secondary"
              }`}
            >
              {ESTADOS[ultimaEvaluacion.estadoAnterior] ||
                ultimaEvaluacion.estadoAnterior}
            </span>
            {" "}cambió a{" "}
            {ultimaEvaluacion.estadoNuevo ? (
              <span
                className={`badge ${
                  CLASES_ESTADO[ultimaEvaluacion.estadoNuevo] ||
                  "bg-secondary"
                }`}
              >
                {ESTADOS[ultimaEvaluacion.estadoNuevo] ||
                  ultimaEvaluacion.estadoNuevo}
              </span>
            ) : (
              "un nuevo estado (actualiza la lista para verlo)"
            )}
            .
          </p>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setUltimaEvaluacion(null)}
          >
            Cerrar
          </button>

        </div>
      )}

      {!token && (
        <div className="alert alert-warning">
          Debes iniciar sesión para utilizar este módulo.
        </div>
      )}

      <div className="card p-3 mb-4">

        <h4>Evaluar solicitud</h4>

        <p className="text-muted">
          Solo el personal autorizado puede evaluar solicitudes.
          Cada solicitud se evalúa una sola vez y su estado cambia
          según el resultado.
        </p>

        <form onSubmit={guardar}>

          <label className="form-label">
            Solicitud
          </label>

          <select
            className="form-select mb-2"
            name="solicitud"
            value={formulario.solicitud}
            onChange={cambio}
            disabled={!token || cargando}
            required
          >
            <option value="">
              Seleccionar solicitud
            </option>

            {solicitudesPendientes.length > 0 && (
              <optgroup label="Pendientes de evaluar">
                {solicitudesPendientes.map((solicitud) => (
                  <option
                    key={solicitud.id}
                    value={solicitud.id}
                  >
                    {etiquetaSolicitud(solicitud)}
                  </option>
                ))}
              </optgroup>
            )}

            {solicitudesEvaluadas.length > 0 && (
              <optgroup label="Ya evaluadas">
                {solicitudesEvaluadas.map((solicitud) => (
                  <option
                    key={solicitud.id}
                    value={solicitud.id}
                  >
                    {`${etiquetaSolicitud(solicitud)} (${
                      ESTADOS[solicitud.estado] || solicitud.estado
                    })`}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <div className="mb-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setActualizar(n => n + 1)}
              disabled={!token || cargando}
            >
              Actualizar lista de solicitudes
            </button>
          </div>

          {!cargando &&
            !errorCarga &&
            token &&
            solicitudes.length === 0 && (
              <div className="alert alert-info">
                No hay solicitudes para evaluar.
                Registra una solicitud en el módulo Solicitudes
                y actualiza la lista.
              </div>
            )}

          <label className="form-label">
            Resultado
          </label>

          <select
            className="form-select mb-2"
            name="resultado"
            value={formulario.resultado}
            onChange={cambio}
            required
          >
            <option value="">
              Seleccionar resultado
            </option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>

          <label className="form-label">
            Puntaje (0 a 100)
          </label>

          <input
            type="number"
            className="form-control mb-2"
            name="puntaje"
            value={formulario.puntaje}
            onChange={cambio}
            min="0"
            max="100"
            step="1"
            required
          />

          <label className="form-label">
            Observaciones
          </label>

          <textarea
            className="form-control mb-3"
            name="observaciones"
            value={formulario.observaciones}
            onChange={cambio}
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
              solicitudes.length === 0
            }
          >
            {procesando ? "Procesando..." : "Guardar evaluación"}
          </button>

          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={cancelar}
            disabled={procesando}
          >
            Limpiar
          </button>

        </form>
      </div>

      <h4>Lista de evaluaciones</h4>

      <p>Total de evaluaciones encontradas: {evaluaciones.length}</p>

      {cargando ? (
        <p>Cargando evaluaciones...</p>
      ) : !token ? (
        <p>Inicia sesión para consultar los registros.</p>
      ) : evaluaciones.length === 0 ? (
        <div className="alert alert-info">
          No hay evaluaciones para mostrar.
        </div>
      ) : (
        <div className="table-responsive">

          <table className="table table-striped table-bordered">

            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Solicitud</th>
                <th>Estudiante</th>
                <th>Convocatoria</th>
                <th>Resultado</th>
                <th>Puntaje</th>
                <th>Observaciones</th>
                <th>Fecha de evaluación</th>
                <th>Estado actual de la solicitud</th>
              </tr>
            </thead>

            <tbody>
              {evaluaciones.map((evaluacion) => {

                const solicitud = buscarSolicitud(evaluacion.solicitud);

                return (
                  <tr key={evaluacion.id}>

                    <td>{evaluacion.id}</td>
                    <td>{evaluacion.solicitud}</td>

                    <td>
                      {solicitud
                        ? nombreEstudiante(solicitud.estudiante)
                        : "-"}
                    </td>

                    <td>
                      {solicitud
                        ? nombreConvocatoria(solicitud.convocatoria)
                        : "-"}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          CLASES_ESTADO[evaluacion.resultado] ||
                          "bg-secondary"
                        }`}
                      >
                        {ESTADOS[evaluacion.resultado] ||
                          evaluacion.resultado}
                      </span>
                    </td>

                    <td>{evaluacion.puntaje}</td>
                    <td>{evaluacion.observaciones}</td>
                    <td>{evaluacion.fecha_evaluacion}</td>

                    <td>
                      {solicitud ? (
                        <span
                          className={`badge ${
                            CLASES_ESTADO[solicitud.estado] ||
                            "bg-secondary"
                          }`}
                        >
                          {ESTADOS[solicitud.estado] || solicitud.estado}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      )}

    </div>
  );
}
