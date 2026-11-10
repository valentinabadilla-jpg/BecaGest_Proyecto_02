"""
URL configuration for becagest project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

from rest_framework.authtoken.views import obtain_auth_token

from . import views


urlpatterns = [

    path('admin/', admin.site.urls),

    path(
        'api/token/',
        obtain_auth_token
    ),

    path(
        'api/perfil/',
        views.perfil
    ),

    path(
        'api/sesion/',
        views.contador_sesion
    ),

    path(
        'api/reportes/resumen/',
        views.resumen
    ),

    path(
        '',
        include('estudiantes.urls')
    ),

    path(
        '',
        include('convocatorias.urls')
    ),

    path(
        '',
        include('solicitudes.urls')
    ),

    path(
        '',
        include('evaluaciones.urls')
    ),

    path(
        '',
        include('asignaciones.urls')
    ),

]
