# Modularización: Dashboards y rankings

## Control

- Estado: Pendiente.
- Orden: 12.
- Riesgo inicial: Medio/alto.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar consultas agregadas, secciones independientes y presentación de los
dashboards por rol sin cambiar accesos, métricas ni navegación.

## Inventario inicial

- `src/pages/AdminDashboard.jsx`
- `src/pages/DashboardAdmin.jsx`
- `src/pages/DashboardProfesor.jsx`
- `src/pages/SuperAdminDashboard.jsx`
- `src/pages/RankingRendimiento.jsx`
- `src/pages/RankingMejorRendimiento.jsx`
- `src/components/dashboard/CumpleanosSemana.jsx`

## Invariantes

- Contenido y accesos según rol.
- Contexto de trabajo del profesor.
- Cumpleaños, inasistencias y rendimiento como secciones independientes.
- Rankings por curso.
- Estados parciales de carga y error.
- Navegación actual hacia los módulos.

## Riesgos iniciales

- Mezclar contratos de admin, profesor y super admin.
- Bloquear todo el dashboard por el fallo de una sección.
- Duplicar consultas agregadas.
- Cambiar permisos al extraer tarjetas o accesos.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Pendiente |
| 1. Utilidades puras | Pendiente |
| 2. Servicio HTTP | Pendiente |
| 3. Hooks de consulta | Pendiente |
| 4. Hooks de comandos | Pendiente o No aplica por evaluar |
| 5. Presentación | Pendiente |
| 6. Composición | Pendiente |
| 7. Cierre | Pendiente |

## Primera acción

Definir subdominios por rol y proteger que cada sección pueda fallar o cargar
sin bloquear las demás.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
