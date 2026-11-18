BecaGest – Frontend

1. Descripción

BecaGest es una aplicación web desarrollada con React que permite gestionar información relacionada con el sistema de becas estudiantiles.

El frontend consume los servicios de una API REST desarrollada con Django REST Framework.

2. Tecnologías utilizadas

React

JavaScript

Vite

React Router DOM

Bootstrap 5

Fetch API

3. Requisitos

Para ejecutar el proyecto se necesita:

Node.js

npm

El backend de BecaGest en funcionamiento.

4. Instalación

Abrir una terminal dentro de la carpeta frontend.

Instalar las dependencias:

npm install

5. Configuración

Crear un archivo llamado .env dentro de la carpeta frontend.

Agregar la siguiente variable:

VITE_API_URL=http://127.0.0.1:8000

Esta variable indica la dirección donde se encuentra funcionando el backend.

6. Ejecución

Para iniciar el frontend, ejecutar:

npm run dev

Después, abrir en el navegador la dirección que proporciona Vite, normalmente:

http://localhost:5173/

7. Funcionalidades principales

Inicio y cierre de sesión mediante autenticación con token.

Protección de rutas según la autenticación.

Dashboard con información obtenida desde la API.

Gestión de estudiantes.

Gestión de convocatorias.

Gestión de asignaciones.

Las funcionalidades de Solicitudes y Evaluaciones se integrarán como parte del desarrollo conjunto del proyecto.

8. Estructura del frontend