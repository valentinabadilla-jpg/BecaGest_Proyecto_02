BECAGEST
SISTEMA DE GESTIÓN DE BECAS ESTUDIANTILES

1. DESCRIPCIÓN DEL PROYECTO

BecaGest es una API REST desarrollada con Python, Django y Django REST Framework que permite gestionar el proceso de solicitud, evaluación y asignación de becas estudiantiles.

El sistema utiliza MySQL como base de datos y autenticación mediante tokens para controlar el acceso de los usuarios.

El sistema está compuesto por dos partes:

Backend: desarrollado con Python, Django y Django REST Framework. Procesa la información, aplica las reglas del sistema, valida los permisos y se comunica con la base de datos.

Frontend: desarrollado con React, Vite y Bootstrap. Proporciona la interfaz desde la cual los usuarios inician sesión y utilizan los módulos disponibles.

La información se almacena en MySQL. El frontend se comunica con el backend mediante una API REST y utiliza tokens para acceder a las operaciones protegidas.

2. TECNOLOGÍAS UTILIZADAS

Backend

Python
Django 6.1.2
Django REST Framework 3.18.3
MySQL 8
mysqlclient 2.3.0
python-dotenv 1.2.4
Postman
Visual Studio Code

Frontend

React 19.3.1
React DOM 19.3.1
Vite 8.3.6
React Router DOM 7.18.5
Bootstrap 5.3.8
JavaScript

3. MÓDULOS DEL SISTEMA

Estudiantes: administra la información de los estudiantes.

Convocatorias: registra las convocatorias de becas, fechas y cupos disponibles.

Solicitudes: permite registrar y consultar solicitudes de becas.

Evaluaciones: permite aprobar o rechazar solicitudes.

Asignaciones: administra las becas asignadas y sus montos mensuales.

3.1. FUNCIONALIDAD DE CADA MÓDULO

1. Dashboard

Es la pantalla principal del sistema y permite visualizar un resumen general de la gestión de becas. Presenta información relacionada con los estudiantes, convocatorias, solicitudes, evaluaciones y asignaciones. Facilita consultar el estado general del proceso sin tener que ingresar individualmente a cada módulo.

2. Estudiantes

Permite administrar la información de los estudiantes registrados en el sistema. Contiene los datos necesarios para identificarlos, como número de identificación, nombre, apellidos y carrera. Esta información se utiliza para relacionar a cada estudiante con sus respectivas solicitudes de beca.

3. Convocatorias

Permite crear, consultar y administrar las convocatorias de becas. En este módulo se registra el nombre de la convocatoria, su descripción, las fechas de inicio y finalización, los cupos disponibles y su estado. Su función es organizar las oportunidades de beca a las que pueden aplicar los estudiantes.

4. Solicitudes

Permite registrar y consultar las solicitudes de beca presentadas por los estudiantes. Cada solicitud se relaciona con un estudiante y una convocatoria. También permite dar seguimiento al estado de las solicitudes durante el proceso de revisión y aprobación.

5. Evaluaciones

Permite revisar las solicitudes presentadas por los estudiantes. El encargado puede consultar la información correspondiente y registrar el resultado de la evaluación, indicando si la solicitud es aprobada o rechazada, según las reglas establecidas en el sistema.

6. Asignaciones

Permite registrar y administrar las becas otorgadas a los estudiantes cuyas solicitudes fueron aprobadas. Contiene la información relacionada con la asignación y el monto de la beca. Este módulo permite consultar las becas concedidas y mantener un registro de los beneficios asignados.

4. ROLES DE USUARIO

Administrador: administra los registros y las convocatorias.

Encargado: gestiona solicitudes, evaluaciones y asignaciones.

Estudiante: consulta información permitida y registra sus propias solicitudes.

La autenticación se realiza mediante tokens.

5. INSTALACIÓN DEL PROYECTO

5.1. Requisitos

Tener instalado Python, MySQL Server, Visual Studio Code y Postman.

5.2. Crear el entorno virtual

Abrir una terminal en la carpeta principal del proyecto y ejecutar:

py -m venv .venv

Activar el entorno virtual:

.\.venv\Scripts\Activate.ps1

5.3. Instalar dependencias

python -m pip install -r requirements.txt

5.4. Instalar las dependencias del frontend

Abrir otra terminal, ingresar a la carpeta frontend e instalar las dependencias:

cd frontend
npm install

Este comando instala las dependencias necesarias para ejecutar React y Vite.

6. CONFIGURACIÓN DE MYSQL

Abrir MySQL Workbench y crear la base de datos:

CREATE DATABASE becagest_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

Crear un usuario de MySQL y concederle permisos para trabajar con becagest_db.

Para ejecutar las pruebas automatizadas, el usuario también necesita permisos sobre la base de datos temporal de pruebas.

7. VARIABLES DE ENTORNO

Copiar el archivo .env.example y crear un archivo llamado .env.

Completar las variables:

DB_NAME=becagest_db
DB_USER=becagest_user
DB_PASSWORD=CONTRASENA_LOCAL_MYSQL
DB_HOST=localhost
DB_PORT=3306

Cada integrante debe colocar la contraseña correspondiente a su instalación de MySQL.

El archivo .env contiene información privada y no debe subirse a GitHub.



8. MIGRACIONES

Ejecutar:

python manage.py migrate

Verificar las migraciones:

python manage.py showmigrations

9. CREAR EL ADMINISTRADOR

Ejecutar:

python manage.py createsuperuser

Iniciar el servidor:

python manage.py runserver

Acceder al administrador de Django:

http://127.0.0.1:8000/admin/

Desde el administrador se pueden crear los grupos Administrador, Encargado y Estudiante, asignar permisos y registrar usuarios de prueba.

10. EJECUTAR EL FRONTEND

El frontend debe iniciarse desde una terminal diferente a la que ejecuta Django.

Ingresar a la carpeta frontend:

cd frontend

Si todavía no se instalaron las dependencias:

npm install

Iniciar el servidor de desarrollo:

npm run dev

Vite mostrará la dirección local de la aplicación, normalmente:

http://localhost:5173/

Abrir esa dirección en el navegador para utilizar BecaGest.

10.1. Ejecución completa del sistema

Para utilizar BecaGest se deben mantener dos terminales abiertas:

Terminal 1 – Backend

Desde la carpeta principal:

.\.venv\Scripts\Activate.ps1
python manage.py runserver

Terminal 2 – Frontend

Desde la carpeta principal:

cd frontend
npm run dev

Finalmente, abrir en el navegador:

http://localhost:5173/

MySQL también debe estar funcionando para que el sistema pueda consultar y guardar información.

11. ENDPOINTS PRINCIPALES

POST /api/token/
Obtener token de autenticación.

GET /api/perfil/
Consultar perfil del usuario.

GET /api/estudiantes/
Listar estudiantes.

POST /api/estudiantes/
Registrar estudiante.

GET /api/convocatorias/
Listar convocatorias.

POST /api/convocatorias/
Registrar convocatoria.

GET /api/solicitudes/
Listar solicitudes.

POST /api/solicitudes/
Registrar solicitud.

GET /api/evaluaciones/
Listar evaluaciones.

POST /api/evaluaciones/
Registrar evaluación.

GET /api/asignaciones/
Listar asignaciones.

POST /api/asignaciones/
Registrar asignación.

GET /api/reportes/resumen/
Consultar resumen del sistema.

GET /api/sesion/
Consultar contador de sesión.

Los endpoints de detalle utilizan un identificador, por ejemplo:

/api/convocatorias/1/

Las operaciones de consulta, actualización y eliminación dependen de los permisos asignados a cada usuario.

12. PRUEBAS AUTOMATIZADAS

El proyecto cuenta con 20 pruebas automatizadas distribuidas entre los cinco módulos.

Para ejecutar las pruebas:

python manage.py test

Django utiliza una base de datos temporal para realizar las pruebas sin modificar los registros principales.

13. PRUEBAS MANUALES CON POSTMAN

El sistema se prueba mediante Postman para verificar las operaciones CRUD, autenticación, autorización, filtros, búsquedas, ordenamiento, paginación y reglas de negocio.

Se comprueban los siguientes códigos HTTP:

200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict

14. FLUJO DE FUNCIONAMIENTO

1. El administrador registra una convocatoria de becas.
2. El estudiante registra una solicitud.
3. El encargado evalúa la solicitud.
4. El sistema actualiza el estado de la solicitud.
5. Si la solicitud es aprobada y existen cupos disponibles, se registra la asignación.
6. El encargado puede consultar los reportes del sistema.

15. SEGURIDAD

BecaGest utiliza autenticación mediante tokens y tres grupos de usuarios.

Los permisos permiten controlar las operaciones que puede realizar cada usuario.

Las credenciales de conexión a MySQL se almacenan en el archivo .env.

El archivo .gitignore debe impedir que las contraseñas, tokens y archivos privados se incluyan en el repositorio.

16. LIMITACIONES

BecaGest es un proyecto académico desarrollado como una API REST.

No cuenta con una interfaz web propia para estudiantes. Sus funcionalidades se prueban mediante Postman y el administrador de Django.

El servidor de desarrollo de Django se utiliza únicamente para pruebas locales.