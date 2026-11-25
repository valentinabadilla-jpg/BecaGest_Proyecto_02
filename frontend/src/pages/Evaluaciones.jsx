import { useEffect, useState } from "react";
import { BASE_URL, peticionAPI } from "../services/api";

import Alertas from "../components/Alertas";
import EstadoCarga from "../components/EstadoCarga";
import Tabla from "../components/Tabla";
import Formulario from "../components/Formulario";

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

// TRADUCIR MENSAJES DE ERROR

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

// MANEJO DE ERRORES HTTP

function obtenerError(datos, estado) {

  const contenido = datos || {};

  if (estado === 401) {
    return "Debes iniciar sesión.";
  }

  if (estado === 403) {
    return (
      contenido.error ||
      contenido.detail ||
      "No tienes permiso para realizar esta operación."
    );
  }

  if (estado === 404) {
    return "Registro no encontrado.";
  }

  if (estado === 409) {
    return (
      contenido.error ||
      "No se puede completar la operación."
    );
  }

  const errores = Object.entries(contenido).map(
    ([campo, mensaje]) => {

      const texto = (
        Array.isArray(mensaje) ? mensaje : [mensaje]
      )
        .map(traducir)
        .join(", ");

      return CAMPOS[campo]
        ? `${CAMPOS[campo]}: ${texto}`
        : texto;
    }
  );

  return errores.join(" | ") || `Error HTTP ${estado}`;
}

function crearError(datos, estado) {

  const error = new Error(
    obtenerError(datos, estado)
  );

  error.estado = estado;

  return error;
}

function mensajeError(err) {

  if (err instanceof TypeError) {
    return "No se pudo conectar con el servidor.";
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

// CARGAR LISTADOS

async function cargarListado(url, token, signal) {

  const respuesta = await peticionAPI(url, {

    headers: {
      Authorization: `Token ${token}`
    },

    signal
  });

  const datos = await leerJson(respuesta);

  if (!respuesta.ok) {
    throw crearError(datos, respuesta.status);
  }

  return Array.isArray(datos)
    ? datos
    : datos.results || [];
}

// CARGAR TODAS LAS PAGINAS

async function cargarTodas(url, token, signal) {

  const resultados = [];

  let siguiente = `${url}?page_size=50`;

  while (siguiente) {

    const respuesta = await peticionAPI(
      siguiente,
      {
        headers: {
          Authorization: `Token ${token}`
        },
        signal
      }
    );

    const datos = await leerJson(respuesta);

    if (!respuesta.ok) {
      throw crearError(datos, respuesta.status);
    }

    if (Array.isArray(datos)) {

      resultados.push(...datos);

      break;
    }

    resultados.push(...(datos.results || []));

    siguiente = datos.next;
  }

  return resultados;
}

export default function Evaluaciones({
  token,
  esAdmin,
  esEncargado,
  esEstudiante
}) {

  const puedeEvaluar = esAdmin || esEncargado;

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);

  const [formulario, setFormulario] = useState(inicial);

  const [
    ultimaEvaluacion,
    setUltimaEvaluacion
  ] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState("");

  const [actualizar, setActualizar] = useState(0);

  // CARGAR DATOS DESDE DJANGO

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

          cargarListado(
            API_URL,
            token,
            controlador.signal
          ),

          cargarTodas(
            API_SOLICITUDES,
            token,
            controlador.signal
          ),

          cargarTodas(
            API_ESTUDIANTES,
            token,
            controlador.signal
          ),

          cargarTodas(
            API_CONVOCATORIAS,
            token,
            controlador.signal
          )

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

  // CLASIFICAR SOLICITUDES

  const solicitudesPendientes = solicitudes.filter(
    solicitud => solicitud.estado === "PENDIENTE"
  );

  const solicitudesEvaluadas = solicitudes.filter(
    solicitud => solicitud.estado !== "PENDIENTE"
  );

  // OBTENER NOMBRE DEL ESTUDIANTE

  function nombreEstudiante(id) {

    const estudiante = estudiantes.find(
      e => e.id === Number(id)
    );

    return estudiante
      ? `${estudiante.nombre} ${estudiante.apellidos}`
      : `Estudiante ${id}`;
  }

  // OBTENER NOMBRE DE LA CONVOCATORIA

  function nombreConvocatoria(id) {

    const convocatoria = convocatorias.find(
      c => c.id === Number(id)
    );

    return convocatoria
      ? convocatoria.nombre
      : `Convocatoria ${id}`;
  }

  // BUSCAR SOLICITUD

  function buscarSolicitud(id) {

    return solicitudes.find(
      s => s.id === Number(id)
    );
  }

  function etiquetaSolicitud(solicitud) {

    return `Solicitud ${solicitud.id} - ${nombreEstudiante(
      solicitud.estudiante
    )} - ${nombreConvocatoria(solicitud.convocatoria)}`;
  }

  // CAMBIAR CAMPOS DEL FORMULARIO

  function cambio(e) {

    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  }

  // LIMPIAR FORMULARIO

  function cancelar() {

    setFormulario(inicial);
  }

  // CONSULTAR ESTADO DE LA SOLICITUD

  async function consultarEstadoSolicitud(id) {

    try {

      const respuesta = await peticionAPI(
        `${API_SOLICITUDES}${id}/`,
        {
          headers: {
            Authorization: `Token ${token}`
          }
        }
      );

      const datos = await leerJson(respuesta);

      return respuesta.ok ? datos.estado : null;

    } catch {

      return null;
    }
  }

  // REGISTRAR EVALUACION

  async function guardar(e) {

    e.preventDefault();

    setError("");
    setUltimaEvaluacion(null);

    if (!token) {

      setError("Debes iniciar sesión.");

      return;
    }

    if (!puedeEvaluar) {

      setError("No tienes permiso para evaluar solicitudes.");

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

      setError(
        "El puntaje debe ser un número entero entre 0 y 100."
      );

      return;
    }

    if (!formulario.observaciones.trim()) {

      setError(
        "Debes escribir las observaciones de la evaluación."
      );

      return;
    }

    const solicitud = buscarSolicitud(
      formulario.solicitud
    );

    setProcesando(true);

    try {

      const respuesta = await peticionAPI(
        API_URL,
        {
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
        }
      );

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

        estadoAnterior: solicitud
          ? solicitud.estado
          : "PENDIENTE",

        estadoNuevo: estadoNuevo

      });

      cancelar();

      setActualizar(n => n + 1);

    } catch (err) {

      setError(mensajeError(err));

      setActualizar(n => n + 1);

    } finally {

      setProcesando(false);
    }
  }

  // COLUMNAS DE LA TABLA

  const columnas = [
    "ID",
    "Solicitud",
    "Estudiante",
    "Convocatoria",
    "Resultado",
    "Puntaje",
    "Observaciones",
    "Fecha de evaluación",
    "Estado actual de la solicitud"
  ];

  return (

    <div className="container mt-4 mb-5">

      <h2>
        {puedeEvaluar
          ? "Evaluaciones"
          : "Mis evaluaciones"}
      </h2>

      <p>
        {puedeEvaluar
          ? "Revisión de solicitudes de beca por el personal autorizado."
          : "Consulta de los resultados de tus solicitudes de beca."}
      </p>

      {/* COMPONENTE REUTILIZABLE DE ALERTAS */}

      <Alertas error={error} />

      <Alertas error={errorCarga} />

      {/* INFORMACION PARA ESTUDIANTES */}

      {esEstudiante && !puedeEvaluar && (

        <div className="alert alert-info">

          Puedes consultar tus evaluaciones y conocer
          el resultado de tus solicitudes de beca.

          El registro de evaluaciones corresponde al
          personal autorizado.

        </div>

      )}

      {/* RESULTADO DE LA ULTIMA EVALUACION */}

      {puedeEvaluar && ultimaEvaluacion && (

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
                CLASES_ESTADO[ultimaEvaluacion.resultado] ||
                "bg-secondary"
              }`}
            >

              {ESTADOS[ultimaEvaluacion.resultado] ||
                ultimaEvaluacion.resultado}

            </span>

            {" "}con un puntaje de {ultimaEvaluacion.puntaje} de 100.

          </p>

          <p className="mb-2">

            Estado anterior de la solicitud:{" "}

            <span
              className={`badge ${
                CLASES_ESTADO[ultimaEvaluacion.estadoAnterior] ||
                "bg-secondary"
              }`}
            >

              {ESTADOS[ultimaEvaluacion.estadoAnterior] ||
                ultimaEvaluacion.estadoAnterior}

            </span>

          </p>

          <p className="mb-2">

            Estado actual:{" "}

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

              "No se pudo consultar. Actualiza la lista para verificarlo."

            )}

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

      {/* FORMULARIO SOLO PARA ADMINISTRADOR Y ENCARGADO */}

      {puedeEvaluar && (

        <Formulario
          titulo="Evaluar solicitud"
          onSubmit={guardar}
        >

          <p className="text-muted">

            Solo el personal autorizado puede evaluar solicitudes.
            Cada solicitud se evalúa una sola vez y su estado cambia
            según el resultado.

          </p>

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

                {solicitudesPendientes.map(solicitud => (

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

                {solicitudesEvaluadas.map(solicitud => (

                  <option
                    key={solicitud.id}
                    value={solicitud.id}
                  >

                    {`${etiquetaSolicitud(solicitud)} (${
                      ESTADOS[solicitud.estado] ||
                      solicitud.estado
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

          {token && (

            <EstadoCarga
              cargando={cargando}
              error={errorCarga}
              vacio={solicitudes.length === 0}
              mensajeCarga="Cargando solicitudes..."
              mensajeVacio="No hay solicitudes para evaluar. Registra una solicitud en el módulo Solicitudes y actualiza la lista."
            />

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

            <option value="APROBADA">

              Aprobada

            </option>

            <option value="RECHAZADA">

              Rechazada

            </option>

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
              cargando ||
              !!errorCarga ||
              solicitudes.length === 0
            }
          >

            {procesando
              ? "Procesando..."
              : "Guardar evaluación"}

          </button>

          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={cancelar}
            disabled={procesando}
          >

            Limpiar

          </button>

        </Formulario>

      )}

      {/* LISTA DE EVALUACIONES */}

      <h4>
        {puedeEvaluar
          ? "Lista de evaluaciones"
          : "Mis resultados"}
      </h4>

      <p>

        Total de evaluaciones mostradas: {evaluaciones.length}

      </p>

      {!token ? (

        <p>Inicia sesión para consultar los registros.</p>

      ) : (

        <EstadoCarga
          cargando={cargando}
          error={errorCarga}
          vacio={evaluaciones.length === 0}
          mensajeCarga="Cargando evaluaciones..."
          mensajeVacio="No hay evaluaciones para mostrar."
        >

          <Tabla columnas={columnas}>

            {evaluaciones.map(evaluacion => {

              const solicitud = buscarSolicitud(
                evaluacion.solicitud
              );

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

                        {ESTADOS[solicitud.estado] ||
                          solicitud.estado}

                      </span>

                    ) : (

                      "-"

                    )}

                  </td>

                </tr>

              );
            })}

          </Tabla>

        </EstadoCarga>

      )}

    </div>
  );
}