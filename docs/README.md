# Documentacion Frontend

Indice operativo de la documentacion del frontend `frontend-react`.

Ultima organizacion: 2026-07-15.

## Lectura rapida

- `PRODUCCION_FRONTEND.md`: estado actual para operar el frontend en
  produccion.
- `CHECKLIST_PRODUCCION_FRONTEND.md`: riesgos, pruebas manuales y checklist
  antes/despues de liberar.
- `PLAN_EJECUCION_FRONTEND.md`: trabajo futuro ordenado por prioridad.
- `CAMBIOS_FRONTEND.md`: historial cronologico de cambios realizados.

## Control SaaS

- `API_CLIENT.md`: contrato frontend con backend, endpoints consumidos y
  responsabilidades por modulo, incluyendo cartera, ventas, dashboard y valores
  personalizados de pago por estudiante.
- `ESTADO_SESION.md`: claves de `localStorage`, cookie de sesion y riesgos.
- `ROLES_UI.md`: roles visibles en frontend, guards y limites de seguridad.
- `DEPLOY_GRATIS.md`: guia de despliegue con Vercel, Render y Neon.

## Control tecnico

- `ARQUITECTURA_FRONTEND.md`: estructura del proyecto, stack y criterios de
  arquitectura.
- `COMPONENTES.md`: componentes principales, paginas y comportamiento UX.
- `RUTAS_FRONTEND.md`: rutas de React Router, guards y navegacion.

## Estado actual resumido

- Frontend en React/Vite con `pnpm` obligatorio.
- Sesion real por cookie `token` emitida por backend; `localStorage` conserva
  datos visuales y selecciones de trabajo.
- Tenant resuelto por backend desde cookie/token; el frontend no envia
  `X-Tenant-ID`.
- Super admin controla tenants/colegios, estados SaaS, historial y creacion de
  colegio.
- Perfil admin tiene navegacion movil agrupada, impresos A4 con scroll lateral
  y observador de estudiante responsive.
- Perfil profesor tiene planilla movil por tarjetas, asistencia con estado de
  historial, observador con verificacion acotada e ingreso de boletin protegido
  contra etiquetas tecnicas/traduccion automatica.

## Rutina recomendada al cambiar el frontend

1. Actualizar `CAMBIOS_FRONTEND.md` con fecha, archivos y verificacion.
2. Si cambia una pantalla o componente, actualizar `COMPONENTES.md`.
3. Si cambia una ruta, actualizar `RUTAS_FRONTEND.md`.
4. Si cambia una llamada al backend, actualizar `API_CLIENT.md`.
5. Si cambia login, cookies, roles o tenant, actualizar `ESTADO_SESION.md`,
   `ROLES_UI.md`, `PRODUCCION_FRONTEND.md` y el checklist.
6. Antes de desplegar, revisar `CHECKLIST_PRODUCCION_FRONTEND.md`.
