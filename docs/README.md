# Documentacion Frontend

Indice operativo de la documentacion del frontend `frontend-react`.

Ultima organizacion: 2026-07-30.

## Lectura rapida

- `PRODUCCION_FRONTEND.md`: estado actual para operar el frontend en
  produccion.
- `CHECKLIST_PRODUCCION_FRONTEND.md`: riesgos, pruebas manuales y checklist
  antes/despues de liberar.
- `PLAN_EJECUCION_FRONTEND.md`: trabajo futuro ordenado por prioridad.
- `modularizacion/README.md`: migración arquitectónica por módulos, capas,
  chats y commits independientes.
- `modularizacion/PROMPT_INICIO_MODULO.md`: prompt reutilizable para comenzar
  cada módulo en un chat nuevo.
- `CAMBIOS_FRONTEND.md`: historial cronologico de cambios realizados.

## Funcionalidades de producto

Funciones nuevas documentadas aparte de la migracion arquitectonica. Cada una
tiene su gemela en `sistema_escolar_api/docs/funcionalidades/` y su prompt de
continuacion para retomarla en otro chat u otro LLM.

- `funcionalidades/NIVEL_ACADEMICO.md`: niveles preescolar y primaria en
  cursos, planilla y asistencia. **Completo.**
- `funcionalidades/OBSERVADOR_ESTUDIANTE.md`: pagina nueva del observador por
  estudiante, con bitacora, impresion y autocorreccion de texto.
  **Disenado, nada implementado.**
- `funcionalidades/LISTAS_SEGUIMIENTO.md`: pantalla nueva de admin para crear
  columnas por curso y marcar alumnos con un check y una nota corta.
  **Disenado, nada implementado.**
- `funcionalidades/ANIO_LECTIVO.md`: selector discreto de año lectivo para
  el admin, consulta de años cerrados y pantalla para preparar y activar el
  año siguiente. El documento principal esta en el backend.
  **Fase 4 con código completo** (pasos 4.1 a 4.7, 2026-10-03 a
  2026-10-05); la fase 5 no ha comenzado.
- `funcionalidades/ENTREVISTA_ADMISION.md`: página de admisiones del año en
  preparación (aspirantes nuevos, entrevista, resultado y matricular a los
  aprobados) y el formulario del estudiante sin lo que pasa a la entrevista.
  El documento principal está en el backend. **Diseñado (E0, 2026-10-12),
  nada implementado.**
- `funcionalidades/SISBEN_RESIDENCIA.md`: SISBÉN y lugar de residencia por
  partes en el formulario del estudiante (crear, editar y matricular desde
  una admisión). El documento principal está en el backend. **Backend en
  producción; pantalla (S3) escrita el 2026-10-20, sin publicar.**
- `funcionalidades/EXPERIENCIA_CARTERA_NOMINA.md`: saber qué pasa al guardar
  en Cartera vencida, Tipos de pago, Nómina, Préstamos y Egresos (botones que
  se bloquean, confirmaciones, avisos de éxito y de error, desplazamiento
  automático, montos sin centavos). Solo frontend. **Completo en código:
  pasos 0 a 3 en `9a61a8a`, `9306cb5` y `9b88cd3`; paso 4 (montos y
  detalles) hecho el 2026-10-21, sin commit.**
- `funcionalidades/SUBNOTAS_PLANILLA.md`: modal de subnotas por tipo de nota
  en la planilla del profesor, con la celda calculada a partir de su
  promedio; después, porcentajes por tipo. El documento principal está en el
  backend. **Parte A (subnotas) publicada el 2026-10-21, backend y
  frontend. Parte B (porcentajes): diseño (B0) aprobado, caracterización
  (B1) hecha y B2 (backend) en curso; en este repo, nada nuevo todavía.**

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
