# Modularización: Asistencia

## Control

- Estado: Pendiente.
- Orden: 1.
- Riesgo inicial: Medio.
- Rama: No creada.
- Commit base y final: Pendientes.
- Última actualización: 2026-07-30.

## Objetivo

Separar el flujo docente de asistencia en contratos puros, servicio HTTP,
hooks y componentes, conservando marcación, edición, historial y validaciones.

## Inventario inicial

- `src/pages/Asistencia.jsx`
- `src/components/AsistenciaRow.jsx`
- `src/components/EncabezadoContextoCurso.jsx` como dependencia compartida.
- `src/utils/periodoProfesor.js` como dependencia compartida.
- Llamadas directas a `src/utils/api.js` por inventariar en la capa 0.

## Invariantes

- Selección de asignación, periodo y fecha.
- Marcación individual y acción `Marcar todos presentes`.
- Bloqueo cuando quedan estudiantes pendientes.
- Edición segura de una asistencia existente.
- Historial, reintento y aviso de asistencia ya tomada.
- Experiencia móvil y de escritorio actual.

## Riesgos iniciales

- Duplicar guardados o perder cambios al alternar fecha.
- Romper la correspondencia entre estudiantes y estados.
- Cambiar accidentalmente el contrato de asistencia del backend.
- Mezclar preferencias locales con el estado remoto.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Pendiente |
| 1. Utilidades puras | Pendiente |
| 2. Servicio HTTP | Pendiente |
| 3. Hooks de consulta | Pendiente |
| 4. Hooks de comandos | Pendiente |
| 5. Presentación | Pendiente |
| 6. Composición | Pendiente |
| 7. Cierre | Pendiente |

## Primera acción

Crear pruebas de caracterización para carga, marcación, validación de
pendientes, guardado e historial antes de extraer código.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: La global de planeaciones; falta línea base propia.
- Siguiente acción exacta: Ejecutar capa 0.
