
import { useState } from "react";
import Estudiantes from "./pages/Estudiantes";
import Convocatorias from "./pages/Convocatorias";

const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export default function App() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [pantalla, setPantalla] = useState("estudiantes");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const esAdmin = perfil?.es_admin === true;

  const esEncargado =
    esAdmin || perfil?.grupos?.includes("Encargado") === true;

  const esEstudiante =
    perfil?.grupos?.includes("Estudiante") === true;

  async function iniciarSesion(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch(`${BASE_URL}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: usuario,
          password
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.token) {
        throw new Error("Usuario o contraseña incorrectos.");
      }

      const respuestaPerfil = await fetch(
        `${BASE_URL}/api/perfil/`,
        {
          headers: {
            Authorization: `Token ${datos.token}`
          }
        }
      );

      if (!respuestaPerfil.ok) {
        throw new Error("No se pudo consultar el perfil del usuario.");
      }

      const datosPerfil = await respuestaPerfil.json();

      setPerfil(datosPerfil);
      setToken(datos.token);
      setPassword("");

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function cerrarSesion() {
    setUsuario("");
    setPassword("");
    setToken("");
    setPerfil(null);
    setPantalla("estudiantes");
    setError("");
  }

  if (!token) {
    return (
      <div className="container mt-5">
        <h1 className="text-center mb-4">BecaGest</h1>

        <div
          className="card p-4 mx-auto"
          style={{ maxWidth: "400px" }}
        >
          <h3>Iniciar sesión</h3>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={iniciarSesion}>
            <label className="form-label">Usuario</label>

            <input
              className="form-control mb-3"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />

            <label className="form-label">Contraseña</label>

            <input
              type="password"
              className="form-control mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  let nombreRol = "Sin rol asignado";

  if (esAdmin) {
    nombreRol = "Administrador";
  } else if (esEncargado) {
    nombreRol = "Encargado";
  } else if (esEstudiante) {
    nombreRol = "Estudiante";
  }

  return (
    <div>
      <div className="container mt-4">
        <h1 className="text-center">BecaGest</h1>

        <p className="text-center mb-1">
          Bienvenido: {perfil?.username}
        </p>

        <p className="text-center">
          Perfil: {nombreRol}
        </p>

        <div className="text-center mb-4">
          <button
            className="btn btn-primary me-2 mb-2"
            onClick={() => setPantalla("estudiantes")}
          >
            Estudiantes
          </button>

          <button
            className="btn btn-success me-2 mb-2"
            onClick={() => setPantalla("convocatorias")}
          >
            Convocatorias
          </button>

          <button
            className="btn btn-danger mb-2"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {pantalla === "estudiantes" && (
        <Estudiantes
          token={token}
          esAdmin={esAdmin}
          esEncargado={esEncargado}
        />
      )}

      {pantalla === "convocatorias" && (
        <Convocatorias
          token={token}
          esAdmin={esAdmin}
        />
      )}
    </div>
  );
}
