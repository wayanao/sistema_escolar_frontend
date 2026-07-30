# Modularización: Autenticación, sesión y navegación

## Control

- Estado: Pendiente.
- Orden: 14.
- Riesgo inicial: Crítico.
- Flujo Git: `main` directo.
- Commit base: Por registrar al iniciar.
- Commit final: Pendiente.
- Última actualización: 2026-07-30.

## Objetivo

Separar autenticación, sesión, guards y navegación por rol sin debilitar
seguridad ni modificar la experiencia de acceso.

## Inventario inicial

- `src/App.jsx`
- `src/pages/Login.jsx`
- `src/pages/CambiarPassword.jsx`
- `src/components/LoginForm.jsx`
- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `src/components/NavSuperAdmin.jsx`
- `src/components/DesktopAnimatedNav.jsx`
- `src/components/TenantStatusBanner.jsx`
- `src/components/NotificacionesPlaneadores.jsx` como dependencia compartida.
- `src/utils/api.js`
- `docs/ESTADO_SESION.md`
- `docs/ROLES_UI.md`

## Invariantes

- Cookie de sesión y `withCredentials`.
- Datos visuales de admin, profesor y super admin.
- Redirecciones por rol y password temporal.
- Limpieza por logout y respuesta `401`.
- Preferencias locales que deben sobrevivir o limpiarse según contrato.
- Menús responsive y rutas protegidas actuales.

## Riesgos iniciales

- Es un flujo transversal y de seguridad.
- Un error puede bloquear toda la aplicación o exponer rutas incorrectas.
- `localStorage`, cookie, guards y navegación están distribuidos.
- Las notificaciones pertenecen a dominios adicionales y no deben absorberse
  sin una decisión separada.

## Estrategia adicional

Este módulo se ejecuta al final porque depende de comprender los contratos de
los demás dominios. Requiere pruebas manuales por rol además de pruebas
automáticas.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Pendiente |
| 1. Utilidades puras | Pendiente |
| 2. Servicio de sesión | Pendiente |
| 3. Estado y guards | Pendiente |
| 4. Comandos de login/logout | Pendiente |
| 5. Presentación | Pendiente |
| 6. Composición | Pendiente |
| 7. Cierre | Pendiente |

## Primera acción

Actualizar el inventario de sesión, rutas, roles y limpieza; crear una matriz
de pruebas para admin, profesor, super admin, sesión vencida y password
temporal.

## Entrega para el siguiente chat

- Última capa terminada: Ninguna.
- Verificación más reciente: No ejecutada para el módulo.
- Siguiente acción exacta: Ejecutar capa 0.
