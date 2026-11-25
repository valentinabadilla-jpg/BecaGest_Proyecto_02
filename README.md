
# BecaGest - Sistema de Gestión de Becas Estudiantiles

Universidad de Costa Rica - Sede Regional del Pacífico  
Informática Empresarial - Desarrollo de Software IV  
Proyecto 02: Frontend con React para una API REST

## 1. Descripción

BecaGest es una aplicación web para la gestión de becas estudiantiles. Permite administrar estudiantes y convocatorias, registrar solicitudes, evaluar su resultado y asignar beneficios económicos.

El frontend es una aplicación de página única (SPA) que consume la API REST desarrollada en el Proyecto 1. Los datos se almacenan en MySQL y las reglas de negocio y los permisos se aplican en Django.

## 2. Tecnologías y requisitos

- Python 3.14.
- Django 5.2.19.
- Django REST Framework.
- MySQL Server 8.0.
- Node.js y npm compatibles con la versión de Vite.
- React.
- JavaScript.
- Vite.
- React Router.
- Bootstrap 5.
- Git y GitHub.
- Postman.
- Autenticación mediante tokens.

Las dependencias del backend se encuentran en requirements.txt y las del frontend en package.json y package-lock.json.

## 3. Estructura del proyecto

```text
BecaGest_Proyecto_02/
├── becagest/
├── estudiantes/
├── convocatorias/
├── solicitudes/
├── evaluaciones/
├── asignaciones/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── .env.example
├── .gitignore
├── manage.py
├── requirements.txt
└── README.md
```

### Organización del frontend

- components: componentes reutilizables, formularios, tablas, alertas, paginación y menú de navegación.
- context: manejo compartido del token, perfil y estado de autenticación.
- pages: pantallas correspondientes a los módulos del sistema.
- routes: protección de rutas privadas.
- services: configuración de la URL base y comunicación con la API REST.
- assets: recursos utilizados por la aplicación.

## 4. Instalación del backend

### 4.1. Clonar el repositorio

```powershell
git clone https://github.com/valentinabadilla-jpg/BecaGest_Proyecto_02.git
cd BecaGest_Proyecto_02
```

### 4.2. Crear el entorno virtual

```powershell
py -3.14 -m venv .venv
```

Activar el entorno virtual en Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Si PowerShell impide activar el entorno virtual, ejecutar:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 4.3. Instalar dependencias

```powershell
python -m pip install -r requirements.txt
```

### 4.4. Configurar la base de datos MySQL

Desde una sesión administrativa de MySQL, ejecutar los siguientes comandos si la base de datos y el usuario todavía no existen:

```sql
CREATE DATABASE IF NOT EXISTS becagest_db CHARACTER SET utf8mb4;

CREATE USER IF NOT EXISTS 'becagest_user'@'localhost'
IDENTIFIED BY 'CAMBIAR_POR_CONTRASENA_LOCAL';

GRANT ALL PRIVILEGES ON becagest_db.*
TO 'becagest_user'@'localhost';
```

La contraseña de ejemplo debe sustituirse por una contraseña local.

### 4.5. Configurar las variables de entorno

Crear un archivo .env en la raíz del proyecto utilizando como referencia el archivo .env.example.

```powershell
Copy-Item .env.example .env
```

Configurar las siguientes variables:

```dotenv
DB_NAME=becagest_db
DB_USER=becagest_user
DB_PASSWORD=CAMBIAR_POR_CONTRASENA_LOCAL
DB_HOST=localhost
DB_PORT=3306
```

Los valores deben corresponder a la configuración local de MySQL.

El archivo .env real no debe publicarse en GitHub, debido a que contiene credenciales de acceso a la base de datos.

### 4.6. Aplicar las migraciones

```powershell
python manage.py migrate
```

Verificar la configuración del proyecto:

```powershell
python manage.py check
```

Consultar el estado de las migraciones:

```powershell
python manage.py showmigrations
```

### 4.7. Crear un superusuario

Si todavía no existe un administrador, ejecutar:

```powershell
python manage.py createsuperuser
```

Completar los datos solicitados en la terminal.

### 4.8. Ejecutar el backend

```powershell
python manage.py runserver
```

El servidor estará disponible en:

http://127.0.0.1:8000/

Panel de administración de Django:

http://127.0.0.1:8000/admin/

## 5. Configuración CORS

La comunicación entre React y Django requiere permitir las solicitudes provenientes del origen del frontend.

Para ello se utiliza django-cors-headers, incluido en las dependencias del proyecto.

En el archivo becagest/settings.py se debe comprobar que INSTALLED_APPS incluya:

```python
'corsheaders',
```

En MIDDLEWARE debe encontrarse:

```python
'corsheaders.middleware.CorsMiddleware',
```

Este middleware debe colocarse antes de CommonMiddleware.

Los orígenes locales permitidos pueden configurarse de la siguiente manera:

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
```

Si el frontend utiliza otro puerto, deberá ajustarse la configuración CORS o ejecutarse Vite en el puerto correspondiente.

## 6. Instalación y ejecución del frontend

Mantener el servidor Django en ejecución y abrir una segunda terminal en Visual Studio Code.

Ingresar a la carpeta frontend:

```powershell
cd frontend
```

Instalar las dependencias:

```powershell
npm ci
```

### 6.1. URL de la API

El archivo frontend/.env.example contiene la siguiente variable:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

La URL base de la API se administra de forma centralizada en:

```text
frontend/src/services/api.js
```

Cuando no se define VITE_API_URL, el sistema utiliza como valor predeterminado:

http://127.0.0.1:8000

Por lo tanto, no es obligatorio crear un archivo .env adicional dentro del frontend para la ejecución local con esa dirección.

Si se requiere utilizar otra URL, se puede crear un archivo .env dentro de frontend tomando como referencia su archivo .env.example.

### 6.2. Ejecutar el frontend

```powershell
npm run dev
```

Ingresar desde el navegador a:

http://localhost:5173/

### 6.3. Verificar la compilación

```powershell
npm run build
```

Este comando permite comprobar que la aplicación se compila correctamente para producción.

La carpeta dist generada durante la compilación no debe incluirse en el repositorio.

## 7. Usuarios de prueba y perfiles

El sistema cuenta con tres perfiles principales: Administrador, Encargado y Estudiante.

| Usuario de prueba | Perfil |
|---|---|
| maria | Administrador |
| encargado1 | Encargado |
| estudiante1 | Estudiante |

Las contraseñas se configuran localmente y no se incluyen en el repositorio.

En una instalación nueva, los usuarios y grupos correspondientes deben crearse mediante el panel de administración de Django.

Los grupos utilizados son:

- Administrador.
- Encargado.
- Estudiante.

Se deben configurar los permisos correspondientes a cada perfil y asociar las cuentas de estudiantes con sus respectivas fichas.

Las migraciones no crean automáticamente los usuarios ni los registros de demostración.

### 7.1. Administrador

- Consultar el panel de control.
- Registrar, consultar, editar y eliminar estudiantes.
- Registrar, consultar, editar y eliminar convocatorias.
- Gestionar solicitudes.
- Registrar y consultar evaluaciones.
- Gestionar asignaciones.
- Consultar indicadores y reportes.

### 7.2. Encargado

- Consultar el panel de control.
- Consultar estudiantes.
- Consultar convocatorias.
- Gestionar solicitudes según los permisos establecidos.
- Registrar y consultar evaluaciones.
- Gestionar asignaciones según los permisos establecidos.

### 7.3. Estudiante

- Consultar su ficha personal.
- Consultar convocatorias.
- Registrar sus propias solicitudes.
- Editar o eliminar sus solicitudes pendientes.
- Consultar los resultados de sus evaluaciones.
- Consultar sus propias asignaciones.

Los permisos reales se aplican desde el backend, independientemente de las opciones visibles en el frontend.

## 8. Módulos del sistema

### 8.1. Panel de control

El panel de control presenta información obtenida directamente de la API REST.

Los indicadores disponibles son:

- Total de estudiantes.
- Convocatorias activas.
- Solicitudes pendientes.
- Solicitudes aprobadas.
- Evaluaciones realizadas.
- Asignaciones no canceladas.
- Monto mensual total.

También se muestran los siguientes resúmenes:

- Solicitudes por convocatoria.
- Solicitudes por estado.
- Estudiantes por carrera.

La información se obtiene mediante:

```http
GET /api/reportes/resumen/
```

### 8.2. Estudiantes

Permite administrar la información de los estudiantes registrados en el sistema.

Funcionalidades:

- Registrar estudiantes.
- Consultar estudiantes.
- Editar estudiantes.
- Eliminar estudiantes.
- Buscar por nombre.
- Filtrar por carrera.
- Filtrar por estado activo o inactivo.
- Combinar filtros.
- Paginar los resultados.

El registro de estudiantes requiere seleccionar una cuenta de Django perteneciente al grupo Estudiante que todavía no tenga una ficha asociada.

El estudiante únicamente puede consultar su propia ficha.

### 8.3. Convocatorias

Permite administrar las oportunidades de becas disponibles para los estudiantes.

Funcionalidades:

- Registrar convocatorias.
- Consultar convocatorias.
- Editar convocatorias.
- Eliminar convocatorias.
- Buscar por nombre o descripción.
- Filtrar convocatorias activas e inactivas.
- Filtrar convocatorias abiertas actualmente.
- Combinar filtros.
- Ordenar por ID, nombre o fecha de finalización.
- Paginar los resultados.

Validaciones:

- Los cupos deben ser mayores que cero.
- La fecha de finalización no puede ser anterior a la fecha de inicio.
- Los campos obligatorios deben completarse.

### 8.4. Solicitudes

Permite registrar y dar seguimiento a las solicitudes de beca.

Funcionalidades:

- Registrar solicitudes.
- Consultar solicitudes.
- Editar solicitudes pendientes.
- Eliminar solicitudes pendientes.
- Seleccionar estudiantes desde la API.
- Seleccionar convocatorias abiertas desde la API.
- Consultar el estado de cada solicitud.

Estados disponibles:

- PENDIENTE.
- APROBADA.
- RECHAZADA.

Validaciones:

- No se permiten solicitudes duplicadas para un mismo estudiante y convocatoria.
- El motivo debe contener al menos 10 caracteres en el formulario.
- Las solicitudes evaluadas no pueden modificarse ni eliminarse mediante el flujo ordinario.
- Los estudiantes únicamente pueden gestionar sus propias solicitudes, según las restricciones del backend.

### 8.5. Evaluaciones

Permite que el personal autorizado revise las solicitudes de beca.

Funcionalidades:

- Registrar evaluaciones.
- Consultar evaluaciones.
- Seleccionar solicitudes registradas.
- Registrar el resultado.
- Registrar el puntaje.
- Registrar observaciones.
- Consultar el cambio de estado de la solicitud.

Resultados disponibles:

- APROBADA.
- RECHAZADA.

Validaciones:

- El puntaje debe estar entre 0 y 100.
- Cada solicitud puede tener únicamente una evaluación.
- El registro de evaluaciones corresponde al personal autorizado.

Cuando se registra una evaluación, el estado de la solicitud cambia según el resultado.

El estudiante puede consultar sus propias evaluaciones, pero no puede registrar nuevas evaluaciones.

### 8.6. Asignaciones

Permite registrar los beneficios económicos correspondientes a las solicitudes aprobadas.

Funcionalidades:

- Crear asignaciones.
- Consultar asignaciones.
- Consultar el detalle de una asignación.
- Editar asignaciones.
- Eliminar asignaciones.
- Filtrar por estado.
- Consultar el monto mensual.

Estados disponibles:

- ACTIVA.
- FINALIZADA.
- CANCELADA.

Validaciones:

- Solo se pueden asignar beneficios a evaluaciones aprobadas.
- No se debe asignar más de una beca a una misma evaluación simultáneamente.
- El monto mensual debe ser mayor que cero.

Los estudiantes únicamente pueden consultar sus propias asignaciones y sus detalles.

### 8.7. Justificación del módulo sin CRUD completo

Los módulos de Estudiantes, Convocatorias, Solicitudes y Asignaciones cuentan con operaciones de creación, consulta, actualización y eliminación, respetando los permisos y las reglas de negocio.

El módulo de Evaluaciones permite registrar y consultar resultados.

No se ofrecen operaciones de edición o eliminación desde la interfaz, debido a que cada solicitud admite una única evaluación y su resultado determina el estado de la solicitud y la posibilidad de generar una asignación.

Esta restricción permite mantener la integridad y coherencia del proceso de gestión de becas.

### 8.8. Flujo de negocio

1. Se registra un estudiante.
2. Se publica una convocatoria de beca.
3. Se registra una solicitud.
4. La solicitud inicia en estado pendiente.
5. El personal autorizado evalúa la solicitud.
6. La solicitud cambia a aprobada o rechazada.
7. Si la evaluación es aprobada, se puede registrar una asignación económica.
8. El panel de control refleja los cambios realizados en el sistema.

## 9. Autenticación y comunicación con la API

El sistema utiliza autenticación mediante tokens de Django REST Framework.

El inicio de sesión se realiza mediante:

```http
POST /api/token/
```

Una vez obtenido el token, se consulta la información del perfil mediante:

```http
GET /api/perfil/
```

Las solicitudes protegidas utilizan el siguiente encabezado:

```http
Authorization: Token <token>
```

El estado de autenticación se administra mediante React Context.

El token y el perfil se almacenan en el navegador mediante localStorage utilizando las siguientes claves:

- becagest_token.
- becagest_perfil.

Las rutas privadas impiden el acceso a las pantallas protegidas cuando no existe una sesión local.

Al cerrar sesión, se eliminan ambos valores del almacenamiento local y se redirige al usuario al formulario de inicio de sesión.

La autorización de las operaciones se realiza en Django.

La URL base y las llamadas HTTP se centralizan en frontend/src/services/api.js.

## 10. Validaciones y manejo de errores

La aplicación presenta mensajes comprensibles para informar al usuario sobre el resultado de las operaciones.

Se incluyen:

- Mensajes de operaciones exitosas.
- Mensajes de validación.
- Mensajes de acceso denegado.
- Mensajes de errores de conexión.
- Indicadores de carga.
- Mensajes cuando no existen registros.
- Confirmaciones antes de eliminar registros.

### 10.1. Códigos HTTP

| Código | Significado |
|---|---|
| 200 | Solicitud realizada correctamente. |
| 201 | Registro creado correctamente. |
| 204 | Operación exitosa sin contenido en la respuesta. |
| 400 | Datos incorrectos o incumplimiento de validaciones. |
| 401 | Usuario sin autenticación o token inválido. |
| 403 | Usuario autenticado sin permisos suficientes. |
| 404 | Recurso no encontrado. |
| 409 | Conflicto con una regla de negocio. |

### 10.2. Errores comprobados mediante Postman

| Código HTTP | Prueba realizada | Resultado |
|---|---|---|
| 400 | Crear una convocatoria con cero cupos. | Rechazo de los datos incorrectos. |
| 401 | Consultar estudiantes sin token. | Acceso denegado por falta de autenticación. |
| 401 | Consultar estudiantes con un token inválido. | Token rechazado. |
| 403 | Crear una convocatoria con un usuario sin permisos. | Operación denegada. |
| 403 | Consultar la información de otro estudiante. | Acceso denegado. |
| 404 | Consultar un estudiante inexistente. | Estudiante no encontrado. |
| 409 | Modificar una solicitud previamente evaluada. | Operación rechazada. |

También se comprobó el manejo de errores de conexión al detener el servidor Django mientras el frontend se encontraba en ejecución.

## 11. Pruebas del sistema

### 11.1. Pruebas automatizadas

Para ejecutar las pruebas automatizadas del backend, ingresar a la carpeta principal del proyecto con el entorno virtual activo y ejecutar:

```powershell
python manage.py test
```

Resultado obtenido:

```text
Found 20 test(s).
System check identified no issues (0 silenced).

Ran 20 tests in 20.926s

OK
```

Resumen:

- Total de pruebas ejecutadas: 20.
- Pruebas exitosas: 20.
- Pruebas fallidas: 0.
- Errores: 0.

Django utiliza una base de datos temporal para ejecutar las pruebas.

Si el usuario de MySQL no dispone de permisos para crear la base de pruebas, se pueden otorgar los permisos correspondientes desde una sesión administrativa.

Por ejemplo, para el nombre predeterminado de la base de pruebas:

```sql
GRANT ALL PRIVILEGES ON test_becagest_db.*
TO 'becagest_user'@'localhost';
```

### 11.2. Pruebas manuales

Se realizaron pruebas manuales de las siguientes funcionalidades:

- Inicio de sesión correcto.
- Inicio de sesión con credenciales incorrectas.
- Navegación entre módulos.
- Registro de estudiantes.
- Edición de estudiantes.
- Eliminación de estudiantes.
- Búsqueda y filtros combinados de estudiantes.
- Paginación de estudiantes.
- Registro de convocatorias.
- Edición de convocatorias.
- Eliminación de convocatorias.
- Validación de fechas y cupos.
- Búsqueda, filtros y ordenamiento de convocatorias.
- Paginación de convocatorias.
- Registro de solicitudes.
- Validación de solicitudes duplicadas.
- Edición y eliminación de solicitudes pendientes.
- Registro de evaluaciones aprobadas y rechazadas.
- Validación de puntajes.
- Validación de evaluaciones duplicadas.
- Actualización del estado de las solicitudes.
- Registro de asignaciones.
- Consulta del detalle de asignaciones.
- Edición y eliminación de asignaciones.
- Filtros por estado de asignaciones.
- Validación de montos.
- Actualización de los indicadores del panel de control.
- Acceso con el perfil Administrador.
- Acceso con el perfil Encargado.
- Acceso con el perfil Estudiante.
- Restricciones de acceso y permisos.
- Manejo de errores HTTP.
- Manejo de errores de conexión.
- Cierre de sesión.
- Eliminación del token y perfil del almacenamiento local.
- Protección de rutas privadas.
- Diseño adaptable.

Las evidencias de las pruebas se presentan mediante capturas de pantalla y matrices de resultados.

### 11.3. Diseño adaptable

La interfaz utiliza Bootstrap 5 para adaptar sus componentes a diferentes tamaños de pantalla.

Se comprobó el comportamiento de la aplicación mediante las herramientas de desarrollo del navegador, utilizando una vista de dispositivo móvil.

Los formularios, tarjetas, botones y menú de navegación se ajustan al espacio disponible.

Las tablas utilizan contenedores responsivos que permiten el desplazamiento horizontal cuando su contenido supera el ancho de la pantalla.

## 12. Limitaciones y consideraciones

- La aplicación está destinada a un entorno académico de desarrollo local.
- Los servidores de desarrollo de Django y Vite no deben utilizarse como servidores de producción.
- El cierre de sesión elimina el token y el perfil del almacenamiento local del navegador, pero no revoca el token en el servidor.
- Un token obtenido previamente puede continuar siendo válido hasta que sea eliminado o invalidado en Django.
- La creación de cuentas de usuario se realiza mediante el panel de administración de Django.
- Las solicitudes evaluadas únicamente pueden consultarse mediante el flujo ordinario.
- Las evaluaciones no pueden editarse ni eliminarse desde la interfaz.
- La disponibilidad de las convocatorias depende de sus fechas de vigencia.
- Para realizar nuevas demostraciones, puede ser necesario actualizar las fechas de las convocatorias.
- Los datos de demostración deben registrarse en la base de datos local.
- Para una implementación en producción se requiere revisar el almacenamiento de tokens, el uso de HTTPS y la administración de secretos.

Por motivos de seguridad y organización, no deben incluirse en el repositorio:

- Archivos .env reales.
- Contraseñas.
- Tokens de autenticación.
- Entornos virtuales.
- Carpetas node_modules.
- Carpetas dist.
- Archivos __pycache__.
- Archivos temporales generados durante el desarrollo.

## 13. Repositorio del proyecto

El código fuente del proyecto se encuentra disponible en:

https://github.com/valentinabadilla-jpg/BecaGest_Proyecto_02
