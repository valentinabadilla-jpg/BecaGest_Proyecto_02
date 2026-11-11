from rest_framework import serializers
from .models import Asignacion


class AsignacionSerializer(serializers.ModelSerializer):

    estudiante_nombre = serializers.SerializerMethodField()

    estudiante_carrera = serializers.CharField(
        source='evaluacion.solicitud.estudiante.carrera',
        read_only=True
    )

    def get_estudiante_nombre(self, obj):
        estudiante = obj.evaluacion.solicitud.estudiante

        return estudiante.nombre + ' ' + estudiante.apellidos

    class Meta:
        model = Asignacion
        fields = [
            'id',
            'evaluacion',
            'monto_mensual',
            'fecha_asignacion',
            'estado',
            'estudiante_nombre',
            'estudiante_carrera'
        ]

        read_only_fields = [
            'id',
            'fecha_asignacion'
        ]

    def validate_monto_mensual(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                'El monto mensual debe ser mayor que cero.'
            )

        return value

    def validate(self, data):

        evaluacion = data.get(
            'evaluacion',
            self.instance.evaluacion if self.instance else None
        )

        estado = data.get(
            'estado',
            self.instance.estado if self.instance else 'ACTIVA'
        )

        if self.instance:

            if evaluacion != self.instance.evaluacion:
                raise serializers.ValidationError(
                    'No se puede cambiar la evaluación de una asignación.'
                )

        if (
            evaluacion.resultado != 'APROBADA'
            or evaluacion.solicitud.estado != 'APROBADA'
        ):
            raise serializers.ValidationError(
                'Solo se pueden asignar becas a solicitudes aprobadas.'
            )

        if estado != 'CANCELADA':

            convocatoria = evaluacion.solicitud.convocatoria

            asignaciones = Asignacion.objects.filter(
                evaluacion__solicitud__convocatoria=convocatoria,
                estado__in=['ACTIVA', 'FINALIZADA']
            )

            if self.instance:
                asignaciones = asignaciones.exclude(
                    pk=self.instance.pk
                )

            if asignaciones.count() >= convocatoria.cupos:
                raise serializers.ValidationError(
                    'No quedan cupos disponibles en esta convocatoria.'
                )

        return data