# Modularización: Estudiantes y observador

## Control

- Estado: Pendiente.
- Orden: 5.
- Riesgo inicial: Alto.
- Rama: No creada.
- Commit base y final: Pendientes.
- Última actualización: 2026-07-30.

## Objetivo

Separar listado, detalle, creación, estado operativo y observador del
estudiante, conservando roles, datos parciales y experiencia responsive.

## Inventario inicial

- `src/pages/EstudiantesAdmin.jsx`
- `src/components/CrearEstudiante.jsx`
- `src/components/Observaciones.jsx`
- `src/components/ReporteEstudiante.jsx` como dependencia por clasificar.
- Endpoints y relaciones académicas por inventariar en la capa 0.

## Invariantes

- Filtros y estados actuales del listado.
- Modal de detalle y navegación existente.
- Observador con guardado parcial y confirmación.
- Chips de periodo, materia, profesor y fecha.
- Tarjetas móviles y columnas de escritorio.
- Permisos y acciones correspondientes al perfil activo.

## Riesgos iniciales

- Mezclar datos del listado con el estudiante abierto.
- Perder observaciones parciales o asociarlas al estudiante incorrecto.
- Romper el modal responsive.
- Cambiar reglas de estado operativo.

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

Inventariar por separado listado, detalle, creación, estado y observador;
agregar pruebas de aislamiento entre estudiantes antes de extraer hooks.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
