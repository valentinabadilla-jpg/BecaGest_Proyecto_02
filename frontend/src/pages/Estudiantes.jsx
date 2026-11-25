import { useEffect, useState } from "react";
import { BASE_URL, peticionAPI } from "../services/api";

import Alertas from "../components/Alertas";
import EstadoCarga from "../components/EstadoCarga";
import Paginacion from "../components/Paginacion";
import Tabla from "../components/Tabla";
import Formulario from "../components/Formulario";

const API_URL = `${BASE_URL}/api/estudiantes/`;

const inicial = {
  usuario: "",
  identificacion: "",
  nombre: "",
  apellidos: "",
  carrera: "",
  activo: true
};

function obtenerError(datos, estado) {
  if (estado === 401) return "Debes iniciar sesión.";

  if (estado === 403) {
    return datos?.error || datos?.detail || "No tienes permiso.";
  }

  if (estado === 404) return "Estudiante no encontrado.";

  if (estado === 409) {
    return datos?.error || "El estudiante tiene registros relacionados.";
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

export default function Estudiantes({
  token,
  esAdmin,
  esEncargado
}) {

  const [estudiantes, setEstudiantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(inicial);
  const [editandoId, setEditandoId] = useState(null);

  const [buscar, setBuscar] = useState("");
  const [carrera, setCarrera] = useState("");
  const [activo, setActivo] = useState("");

  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [siguiente, setSiguiente] = useState(false);
  const [anterior, setAnterior] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [error, setError] = useState("");
  const [errorLista, setErrorLista] = useState("");
  const [errorUsuarios, setErrorUsuarios] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [actualizar, setActualizar] = useState(0);
  const [refrescarUsuarios, setRefrescarUsuarios] = useState(0);

  // CARGAR USUARIOS DISPONIBLES

  useEffect(() => {
    if (!token || !esAdmin) return;

    const controlador = new AbortController();

    async function cargarUsuarios() {
      setCargandoUsuarios(true);
      setErrorUsuarios("");

      try {
        const respuesta = await peticionAPI(
          `${API_URL}usuarios-disponibles/`,
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

        if (!Array.isArray(datos)) {
          throw new Error("La lista de usuarios no es válida.");
        }

        setUsuarios(datos);

      } catch (err) {
        if (err.name !== "AbortError") {
          setErrorUsuarios(err.message);
          setUsuarios([]);
        }

      } finally {
        if (!controlador.signal.aborted) {
          setCargandoUsuarios(false);
        }
      }
    }

    cargarUsuarios();

    return () => controlador.abort();

  }, [token, esAdmin, actualizar, refrescarUsuarios]);

  // CARGAR ESTUDIANTES

  useEffect(() => {
    if (!token) return;

    const controlador = new AbortController();

    async function cargarEstudiantes() {
      setCargando(true);
      setErrorLista("");

      try {
        const parametros = new URLSearchParams();

        parametros.set("page", pagina);

        if (esEncargado) {

          if (buscar.trim()) {
            parametros.set("buscar", buscar.trim());
          }

          if (carrera.trim()) {
            parametros.set("carrera", carrera.trim());
          }

          if (activo !== "") {
            parametros.set("activo", activo);
          }
        }

        const respuesta = await peticionAPI(
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

        setEstudiantes(lista);

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
          setEstudiantes([]);
          setTotal(0);
        }

      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarEstudiantes();

    return () => controlador.abort();

  }, [
    token,
    esEncargado,
    pagina,
    buscar,
    carrera,
    activo,
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
    setEditandoId(null);
    setFormulario(inicial);
  }

  // EDITAR ESTUDIANTE

  function editar(estudiante) {
    setEditandoId(estudiante.id);

    setFormulario({
      usuario: estudiante.usuario,
      identificacion: estudiante.identificacion,
      nombre: estudiante.nombre,
      apellidos: estudiante.apellidos,
      carrera: estudiante.carrera,
      activo: estudiante.activo
    });

    setError("");
    setMensaje("");

    window.scrollTo(0, 0);
  }

  // GUARDAR O ACTUALIZAR ESTUDIANTE

  async function guardar(e) {
    e.preventDefault();

    if (!esAdmin) return;

    const editando = editandoId !== null;

    if (!editando && !formulario.usuario) {
      setError("Selecciona un usuario.");
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const datosEnviar = {
        identificacion: formulario.identificacion.trim(),
        nombre: formulario.nombre.trim(),
        apellidos: formulario.apellidos.trim(),
        carrera: formulario.carrera.trim(),
        activo: formulario.activo
      };

      if (!editando) {
        datosEnviar.usuario = Number(formulario.usuario);
      }

      const respuesta = await peticionAPI(
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
          ? "Estudiante actualizado correctamente."
          : "Estudiante registrado correctamente."
      );

      setPagina(1);
      setActualizar(n => n + 1);

    } catch (err) {
      setError(err.message);

    } finally {
      setProcesando(false);
    }
  }

  // ELIMINAR ESTUDIANTE

  async function eliminar(id) {

    if (
      !esAdmin ||
      !window.confirm("¿Deseas eliminar este estudiante?")
    ) {
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const respuesta = await peticionAPI(
        `${API_URL}${id}/`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Token ${token}`
          }
        }
      );

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));

        throw new Error(
          obtenerError(datos, respuesta.status)
        );
      }

      if (editandoId === id) cancelar();

      setMensaje("Estudiante eliminado correctamente.");

      if (estudiantes.length === 1 && pagina > 1) {
        setPagina(p => p - 1);
      }

      setActualizar(n => n + 1);

    } catch (err) {
      setError(err.message);

    } finally {
      setProcesando(false);
    }
  }

  // COLUMNAS DE LA TABLA

  const columnas = [
    "ID",
    "Identificación",
    "Nombre",
    "Apellidos",
    "Carrera",
    "Activo"
  ];

  if (esAdmin) {
    columnas.push("Acciones");
  }

  return (

    <div className="container mt-4 mb-5">

      <h2>Estudiantes</h2>

      <p>
        {esEncargado
          ? "Consulta de estudiantes de BecaGest"
          : "Mi ficha de estudiante"}
      </p>

      {/* COMPONENTE DE ALERTAS */}

      <Alertas error={error} />

      <Alertas
        error={errorLista}
        mensaje={mensaje}
      />

      {/* COMPONENTE REUTILIZABLE DE FORMULARIO */}

      {esAdmin && (

        <Formulario
          titulo={
            editandoId !== null
              ? "Editar estudiante"
              : "Registrar estudiante"
          }
          onSubmit={guardar}
        >

          <label className="form-label">
            Usuario de Django
          </label>

          {editandoId === null ? (

            <>

              <select
                className="form-select mb-2"
                name="usuario"
                value={formulario.usuario}
                onChange={cambio}
                disabled={
                  cargandoUsuarios || !!errorUsuarios
                }
                required
              >

                <option value="">
                  Seleccionar usuario
                </option>

                {usuarios.map(u => (

                  <option
                    key={u.id}
                    value={u.id}
                  >
                    {u.username}
                  </option>

                ))}

              </select>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mb-3 d-block"
                onClick={() =>
                  setRefrescarUsuarios(n => n + 1)
                }
                disabled={cargandoUsuarios}
              >
                Actualizar lista de usuarios
              </button>

              <Alertas error={errorUsuarios} />

              <EstadoCarga
                cargando={cargandoUsuarios}
                error={errorUsuarios}
                vacio={usuarios.length === 0}
                mensajeCarga="Cargando usuarios..."
                mensajeVacio="No hay usuarios disponibles. Crea un usuario en Django y asígnalo al grupo Estudiante."
              />

            </>

          ) : (

            <input
              className="form-control mb-2"
              value={`Usuario asignado (ID ${formulario.usuario})`}
              readOnly
            />

          )}

          <label className="form-label d-block">
            Identificación
          </label>

          <input
            className="form-control mb-2"
            name="identificacion"
            value={formulario.identificacion}
            onChange={cambio}
            minLength="5"
            maxLength="30"
            required
          />

          <label className="form-label">
            Nombre
          </label>

          <input
            className="form-control mb-2"
            name="nombre"
            value={formulario.nombre}
            onChange={cambio}
            minLength="2"
            maxLength="100"
            required
          />

          <label className="form-label">
            Apellidos
          </label>

          <input
            className="form-control mb-2"
            name="apellidos"
            value={formulario.apellidos}
            onChange={cambio}
            maxLength="100"
            required
          />

          <label className="form-label">
            Carrera
          </label>

          <input
            className="form-control mb-2"
            name="carrera"
            value={formulario.carrera}
            onChange={cambio}
            maxLength="120"
            required
          />

          <div className="form-check mb-3">

            <input
              id="estudiante-activo"
              type="checkbox"
              className="form-check-input"
              name="activo"
              checked={formulario.activo}
              onChange={cambio}
            />

            <label
              className="form-check-label"
              htmlFor="estudiante-activo"
            >
              Estudiante activo
            </label>

          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              procesando ||
              (editandoId === null &&
                (cargandoUsuarios ||
                  !usuarios.length ||
                  !!errorUsuarios))
            }
          >

            {procesando
              ? "Procesando..."
              : editandoId !== null
                ? "Actualizar"
                : "Guardar estudiante"}

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

        </Formulario>

      )}

      {/* FILTROS */}

      {esEncargado && (

        <div className="card p-3 mb-4">

          <h4>Buscar y filtrar estudiantes</h4>

          <label className="form-label">
            Buscar por nombre
          </label>

          <input
            className="form-control mb-2"
            placeholder="Nombre del estudiante"
            value={buscar}
            onChange={e => {
              setBuscar(e.target.value);
              setPagina(1);
            }}
          />

          <label className="form-label">
            Carrera
          </label>

          <input
            className="form-control mb-2"
            placeholder="Ejemplo: Informática"
            value={carrera}
            onChange={e => {
              setCarrera(e.target.value);
              setPagina(1);
            }}
          />

          <label className="form-label">
            Estado
          </label>

          <select
            className="form-select"
            value={activo}
            onChange={e => {
              setActivo(e.target.value);
              setPagina(1);
            }}
          >

            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>

          </select>

        </div>

      )}

      {/* LISTA DE ESTUDIANTES */}

      <h4>
        {esEncargado
          ? "Lista de estudiantes"
          : "Mi ficha"}
      </h4>

      <p>Total de estudiantes encontrados: {total}</p>

      {/* COMPONENTE REUTILIZABLE DE ESTADO DE CARGA */}

      <EstadoCarga
        cargando={cargando}
        error={errorLista}
        vacio={estudiantes.length === 0}
        mensajeCarga="Cargando estudiantes..."
        mensajeVacio="No hay estudiantes para mostrar."
      >

        {/* COMPONENTE REUTILIZABLE DE TABLA */}

        <Tabla columnas={columnas}>

          {estudiantes.map(estudiante => (

            <tr key={estudiante.id}>

              <td>{estudiante.id}</td>
              <td>{estudiante.identificacion}</td>
              <td>{estudiante.nombre}</td>
              <td>{estudiante.apellidos}</td>
              <td>{estudiante.carrera}</td>

              <td>
                {estudiante.activo ? "Sí" : "No"}
              </td>

              {esAdmin && (

                <td>

                  <button
                    className="btn btn-warning btn-sm me-2 mb-1"
                    onClick={() => editar(estudiante)}
                    disabled={procesando}
                  >
                    Editar
                  </button>

                  <button
                    className="btn btn-danger btn-sm mb-1"
                    onClick={() =>
                      eliminar(estudiante.id)
                    }
                    disabled={procesando}
                  >
                    Eliminar
                  </button>

                </td>

              )}

            </tr>

          ))}

        </Tabla>

      </EstadoCarga>

      {/* COMPONENTE REUTILIZABLE DE PAGINACION */}

      <Paginacion
        pagina={pagina}
        anterior={anterior}
        siguiente={siguiente}
        cargando={cargando}
        onAnterior={() => setPagina(p => p - 1)}
        onSiguiente={() => setPagina(p => p + 1)}
      />

    </div>

  );
}