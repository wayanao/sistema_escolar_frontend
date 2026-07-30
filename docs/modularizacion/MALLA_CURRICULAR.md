# Modularización: Malla curricular

## Control

- Estado: Pendiente.
- Orden: 3.
- Riesgo inicial: Medio/alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Modularizar el planeador anual por asignación, periodo y `slot`, conservando
validaciones de filas, fechas y eliminación implícita de registros vacíos.

## Inventario inicial

- `src/pages/PlaneadorAnual.jsx`
- `src/components/EncabezadoContextoCurso.jsx` como dependencia compartida.
- `src/utils/periodoProfesor.js` como dependencia compartida.
- Endpoints y almacenamiento por documentar en la capa 0.

## Invariantes

- Hasta ocho filas curriculares por asignación y periodo.
- El contenido requiere fecha y la fecha requiere contenido.
- Filas vacías no crean registros.
- Vaciar un `slot` guardado solicita su eliminación.
- Los datos deben conservar el `slot` retornado por el backend.
- Spinner y confirmación de guardado actuales.

## Riesgos iniciales

- Reordenar contenido cuando existen espacios vacíos.
- Enviar registros incompletos o eliminar el `slot` incorrecto.
- Mezclar estado editable con respuesta remota.

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

Crear pruebas puras para validación de filas, mapeo por `slot` y payload de
guardado, además de una prueba de comportamiento de la página.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
