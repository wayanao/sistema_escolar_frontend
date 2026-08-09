# Cambios Frontend

## 2026-08-09 - Cierre arquitectónico de excepciones de planeaciones

Migración por capas de las notificaciones compartidas y las imágenes
protegidas, sin cambios de diseño, textos, rutas, comportamiento ni contratos
del backend.

- `utils/planeaciones/` concentra normalización de imágenes, agrupación,
  formato, rutas y el nombre puro del evento de actualización.
- `planeacionesApi.js` es la única frontera HTTP de la consulta de
  notificaciones y de la descarga autenticada con `responseType: "blob"`.
- `useNotificacionesPlaneadores`, `useImagenProtegida` y la sincronización local
  administran consultas, polling, eventos y ciclo de vida de `object URLs`.
- `NotificacionesPlaneadores.jsx` quedó como conector mínimo y
  `NotificacionesPlaneadoresVista.jsx` como presentación controlada.
- Se retiraron `components/ImagenProtegida.jsx` y
  `utils/planeaciones/notificaciones.js`, junto con sus pruebas antiguas y una
  ruta administrativa individual sin consumidor real.
- El barrido final confirmó una sola implementación por responsabilidad, tres
  consumidores productivos de imágenes protegidas y ausencia de directorios
  vacíos o imports obsoletos.

Verificación final: `pnpm run check:deploy` correcto; 282 archivos y 1542
pruebas, ESLint y build de producción de 379 módulos correctos.
`git diff --check` correcto.

## 2026-08-09 - Retiro de reexportación de impresión sin consumidores

- Se eliminó `src/hooks/usePrintConfig.js`, que solo reexportaba la
  implementación real de `hooks/certificadosImpresion/usePrintConfig.js` y ya
  no tenía imports productivos.
- Los consumidores activos ya importaban directamente la implementación de
  dominio; no cambian caché, transporte, presentación ni comportamiento de
  impresión.
- Se actualizaron arquitectura, catálogo de componentes y documentos de
  modularización relacionados.

Verificación: 5 archivos y 19 pruebas de configuración e impresión correctas;
ESLint específico y build de 375 módulos correctos.

## 2026-08-09 - Cierre documental del plan de modularización

- El plan maestro registra los catorce módulos como terminados y publicados en
  `main`, con el commit de cierre correspondiente.
- Los documentos específicos dejan de indicar que falta commit o publicación;
  las verificaciones manuales de producción se conservan como seguimiento
  operativo cuando todavía no existe constancia de su ejecución.
- No se modificó código fuente ni comportamiento de la aplicación.

## 2026-08-09 - Navegación animada ubicada en autenticación

- `DesktopAnimatedNav.jsx` se trasladó desde la raíz de `components/` a
  `components/autenticacion/`, junto a `NavAdminView` y `NavProfesorView`, sus
  dos únicos consumidores.
- Se actualizaron los imports productivos, el mock de las vistas de navegación
  y la documentación sin modificar rutas, textos, estilos ni animaciones.

Verificación: 4 archivos y 39 pruebas relacionadas correctas; ESLint específico
y build de 375 módulos correctos.

## 2026-08-09 - Evento de notificaciones ubicado en planeaciones

- `src/utils/notificacionesPlaneadores.js` se trasladó a
  `src/utils/planeaciones/notificaciones.js` porque todos sus consumidores
  pertenecen al dominio de planeaciones.
- Se actualizaron el componente compartido, los dos hooks consumidores y sus
  mocks de prueba sin cambiar el nombre del evento ni su comportamiento.
- Se agregó una prueba adyacente para proteger el contrato del evento local.

Verificación: 4 archivos y 10 pruebas relacionadas correctas; ESLint específico
y build de 375 módulos correctos.

## 2026-08-09 - Panel móvil de notificaciones anclado al encabezado

- En móvil y tablet, la ventana de notificaciones dejó de usar posición fija
  respecto al viewport y ahora se posiciona dentro del encabezado.
- Al desplazar la página, la ventana acompaña al navbar y sale de la pantalla.
  Conserva sus márgenes laterales, altura máxima, scroll interno y acción
  inferior; en escritorio continúa anclada directamente a la campana.
- Se agregó una prueba adyacente que protege el contrato responsive y evita que
  el panel vuelva a usar `fixed`.

Verificación: 4 archivos y 25 pruebas relacionadas correctas; ESLint específico
y build de 375 módulos correctos.

## 2026-08-09 - Notificaciones compartidas ubicadas en planeaciones

- `NotificacionesPlaneadores.jsx` se trasladó desde la raíz de `components/` a
  `components/planeaciones/`, por encima de `admin/` y `profesor/`, porque ambos
  perfiles consumen la misma campana.
- Se actualizaron el import productivo de `App.jsx`, su mock de composición y
  las referencias documentales. No cambian consulta, textos, rutas, responsive
  ni comportamiento.

Verificación: 3 archivos y 24 pruebas de rutas/navegación correctas; ESLint
específico, build de 375 módulos y `git diff --check` correctos.

## 2026-08-08 - Modularización completa de autenticación, sesión y navegación

Migración arquitectónica del módulo 14 del plan de modularización. No cambia
diseño, textos, rutas, comportamiento responsive ni contratos del backend.

- `utils/autenticacion/` concentra contratos puros de sesión, login, cambio de
  password y navegación: claves y limpieza diferenciada, parseo y decisiones
  de guards, payloads, validaciones y árboles de menú.
- `services/autenticacionApi.js` centraliza los cuatro contratos propios del
  módulo: login, logout, cambio de password y estado del tenant, reutilizando el
  cliente HTTP compartido y su interceptor global de `401`.
- `hooks/autenticacion/` separa las lecturas y guards de sesión, la consulta del
  tenant y los comandos de login, cambio de password y logout. Se conservan el
  almacenamiento por rol, las redirecciones, alertas, temporizador y
  recuperación actuales.
- Seis vistas de `components/autenticacion/` reciben datos y acciones mediante
  props y mantienen únicamente estado visual local: visibilidad de password y
  navegación responsive.
- `pages/Login.jsx`, `pages/CambiarPassword.jsx` y los layouts de `App.jsx` son
  las raíces de composición. `App` conserva la tabla de rutas, imports lazy,
  tres límites de `Suspense`, fallback y orden de guards.
- Se retiraron `LoginForm.jsx`, `NavAdmin.jsx`, `NavProfesor.jsx`,
  `NavSuperAdmin.jsx` y `TenantStatusBanner.jsx`; no quedan conectores ni
  implementaciones antiguas paralelas dentro del módulo.
- `DesktopAnimatedNav` permanece como unidad presentacional compartida y
  `NotificacionesPlaneadores` conserva su frontera de planeaciones, roles y
  callback de navegación.
- Se preservaron deliberadamente el parseo estricto del almacenamiento, la
  diferencia entre limpieza por logout y por `401`, y el montaje actual del
  tenant antes de ciertos redirects internos. Los riesgos quedan documentados
  en `docs/modularizacion/AUTENTICACION_NAVEGACION.md`.

Verificación final:

- 19 archivos y 170 pruebas específicas de autenticación, sesión y navegación
  correctas.
- `pnpm run check:deploy`: correcto; 275 archivos, 1510 pruebas, ESLint y build
  de producción de 375 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones duplicadas:
  correcta. Los cuatro endpoints propios aparecen únicamente en
  `services/autenticacionApi.js`; la consulta de notificaciones permanece fuera
  por pertenecer a planeaciones.

## 2026-08-08 - Reportes financieros: hoyISO y nombreMes ya usan hora local

Corrección de dos de los tres riesgos que la modularización de reportes
financieros dejó registrados (el tercero, medios de pago combinados sin
monto por método, requiere un cambio de esquema en el backend y queda
pendiente).

- **`hoyISO()` tomaba la fecha en UTC**, sin compensar el desfase horario
  local. En la zona real de despliegue (America/Bogota, UTC-5),
  aproximadamente desde las 7:00 p.m. hasta medianoche, "Ingresos hoy" y
  "Egresos hoy" consultaban el día siguiente en vez de hoy. Ahora compensa
  el offset antes de convertir a ISO, con el mismo criterio que ya usa
  `utils/pagos/formatos.js` (`obtenerFechaLocal`).
- **`nombreMes()` mostraba el mes anterior.** Parseaba `"${mes}-01"` como
  fecha local a partir de una medianoche UTC, así que en America/Bogota el
  encabezado de "Movimiento mensual" retrocedía un mes. Ahora construye y
  formatea en UTC explícito, con el mismo criterio que
  `utils/pagos/formatos.js` (`formatearPeriodo`).
- Las dos pruebas que caracterizaban el defecto en
  `utils/reportesFinancieros/formatos.test.js` ahora prueban que ya no
  ocurre, con el mismo escenario horario.
- `pages/ReportesAdmin.test.jsx` dejó de duplicar `formatoMoneda`, `hoyISO`
  y `finDeMesISO`; ahora importa las funciones reales del módulo para que
  sus aserciones no se desalineen si la implementación vuelve a cambiar.

No hay cambios de firma, de diseño ni de textos. El comportamiento cambia
solo en el margen horario donde antes era incorrecto.

Verificación: 12 archivos y 114 pruebas específicas de reportes financieros;
`pnpm run check:deploy` correcto con 256 archivos, 1340 pruebas, ESLint y
build correctos; `git diff --check` correcto.

## 2026-08-08 - Modularización completa de reportes financieros

- Se conservaron diseño, textos, ruta `/admin/reportes`, protección
  administrativa (`AdminRoute` más el control de rol propio de la página),
  filtros por fecha y por medio de pago, soporte de pagos simples y
  combinados, y los contratos de los cuatro endpoints de `/reportes/*`.
- `utils/reportesFinancieros/` concentra la interpretación de medios de
  pago (`mediosPago.js`, trasladado sin cambios desde
  `utils/reportesMediosPago.js`), formateadores de moneda/fecha/mes
  (`formatos.js`), normalización de listas paginadas o planas
  (`contratos.js`) y la combinación de ingresos/egresos mensuales
  (`derivaciones.js`).
- `services/reportesFinancierosApi.js` es la única frontera HTTP del
  módulo, con los cuatro contratos de reporte general, ingresos/egresos por
  rango e ingresos por mes.
- Dos hooks separan la consulta del reporte general (con recarga al volver
  a la pestaña) de la consulta de detalle por rango o mes (validación de
  fechas, filtro de medio de pago, scroll automático). El módulo no tiene
  comandos de escritura: su capa 4 no aplica.
- Cuatro componentes de `components/reportesFinancieros/` conservan el
  resumen financiero, el movimiento mensual, el panel de rango de fechas
  con estudiantes por curso, y el detalle de ingresos/egresos, todos
  controlados por props y callbacks.
- `pages/ReportesAdmin.jsx` queda como raíz de composición de 136 líneas
  (venía de 589): conecta los dos hooks con los cuatro componentes y
  conserva únicamente el control de acceso, el estado de carga inicial y
  las funciones que traducen una interacción en una llamada a los hooks.
- Se caracterizaron y se dejaron preservados a propósito dos riesgos
  preexistentes, documentados en `docs/modularizacion/REPORTES_FINANCIEROS.md`
  para una eventual corrección en tarea aparte:
  - un pago con métodos combinados sin monto por método muestra, al
    filtrar por uno de esos medios, el monto total del pago en vez de una
    porción;
  - `hoyISO()` y `nombreMes()` tienen defectos de zona horaria (toman UTC
    sin compensar el desfase local) que pueden mostrar la fecha de mañana
    como "hoy" o el nombre del mes anterior en la zona horaria real de
    despliegue (America/Bogota).

Verificación final:

- 12 archivos y 114 pruebas específicas de reportes financieros correctas.
- `pnpm run check:deploy`: correcto; 256 archivos, 1340 pruebas, ESLint y
  build de producción de 364 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones
  duplicadas: correcta. No queda ninguna referencia a
  `utils/reportesMediosPago` ni llamadas HTTP directas fuera de
  `reportesFinancierosApi.js`.

## 2026-08-08 - El panel de admin ya no silencia la regla de dependencias

Corrección del sexto defecto que la modularización del módulo 12 dejó
registrado. El efecto que carga la cartera vencida llevaba un
`eslint-disable-next-line react-hooks/exhaustive-deps` con dependencias vacías.

El `disable` no era un descuido: estaba tapando un problema de identidad.
`usuario` se relee de `localStorage` en cada render, así que es un objeto nuevo
cada vez. Obedecer la regla y ponerlo como dependencia habría disparado una
petición a `/cartera/mora/resumen` **en cada render**. La supresión funcionaba,
pero dejaba una trampa: quien intentara «arreglar el lint» sin entender por qué
estaba ahí tumbaría el backend.

- El hook calcula una sola vez `esAdministrador`, un booleano cuya identidad sí
  es estable entre renders.
- Los dos efectos hermanos —cartera y cumpleaños— dependen ahora de ese mismo
  booleano. Antes uno usaba `usuario` con dependencias vacías y el otro
  `usuarioRol`; ahora tienen exactamente la misma forma.
- El `eslint-disable` desapareció. **No queda ninguno en todo el módulo.**

La prueba nueva rerenderiza el hook tres veces y comprueba que sigue habiendo una
sola petición por sección. Se verificó contra la versión con `usuario` como
dependencia: ahí detecta seis peticiones en lugar de una.

No hay cambios visibles ni de comportamiento: el número de consultas y el momento
en que se lanzan son los mismos que antes.

Verificación: 35 archivos y 343 pruebas específicas; `pnpm run check:deploy`
correcto con 244 archivos y 1226 pruebas.

## 2026-08-08 - Los dashboards redirigen con el router

Corrección de los defectos cuarto y quinto que la modularización del módulo 12
dejó registrados. Los dos van juntos porque son el mismo tema: cómo redirige el
módulo cuando no hay sesión válida.

- **Tres pantallas recargaban la aplicación entera.** El panel del profesor y los
  dos rankings hacían `window.location.href = "/login"`, que descarta el bundle
  ya cargado y arranca React desde cero. Ahora `useContextoProfesor` y
  `useRankingProfesor` informan `sesionInvalida` y la página devuelve
  `<Navigate to="/login" />`.
- **`AdminDashboard` navegaba durante el render.** Llamaba a `navigate("/login")`
  en el cuerpo del componente y devolvía `null`, o sea un efecto secundario en
  fase de render que React puede advertir y que con render concurrente no
  garantiza el momento de la redirección. Ahora devuelve el redirect.

Las cuatro pantallas usan `<Navigate to="/login" />` sin `replace`, exactamente
el patrón que ya aplican los cinco guardianes de `App.jsx`.

Un hook no puede devolver JSX, así que la frontera queda clara: el hook detecta
que no hay sesión y la página, que es la raíz de composición, resuelve la
navegación.

También se quitó el `useCallback` de `exigirClaseElegida`: nunca es dependencia
de nadie y su memoización manual impedía que el compilador de React optimizara el
hook.

Siete pruebas se actualizaron —cinco caracterizaciones y dos de hooks— porque
fijaban `window.location.href`. Las de página comprueban además que **ya no se
llama a `navigate` durante el render**.

Verificación: 35 archivos y 342 pruebas específicas; `pnpm run check:deploy`
correcto con 244 archivos y 1225 pruebas.

## 2026-08-08 - Los avisos del profesor usan SweetAlert

Corrección del tercer defecto que la modularización del módulo 12 dejó
registrado. Los dos avisos de «elige una clase» usaban `window.alert`, el único
sitio del sistema que aún lo hacía.

El problema no era solo estético: si el usuario marca en Chrome
`Impedir que esta página cree diálogos adicionales`, el navegador silencia los
`alert` siguientes. A partir de ahí, pulsar `Ver ranking por materia` sin clase
elegida **no hacía absolutamente nada**, sin explicación alguna.

- `useContextoProfesor` avisa con SweetAlert y no espera la respuesta: quien
  llama necesita el booleano de inmediato para decidir si navega.
- `useRankingProfesor` sí espera a que el aviso se cierre antes de volver al
  dashboard, igual que hacía el diálogo nativo que bloqueaba la pantalla.

Los textos no cambian. Los avisos usan `icon: "warning"` y el verde del módulo,
como los del panel de super administración.

Tres caracterizaciones y dos pruebas de hooks se actualizaron: fijaban
`window.alert` y eran la red que debía avisar de este cambio.

Verificación: 35 archivos y 342 pruebas específicas; `pnpm run check:deploy`
correcto con 244 archivos y 1225 pruebas.

## 2026-08-08 - Los dashboards descartan las respuestas superadas

Corrección del segundo defecto que la modularización del módulo 12 dejó
registrado. Las consultas no descartaban respuestas obsoletas, así que una
respuesta lenta podía pisar a una más reciente.

El caso real estaba en el filtro de rendimiento: al cambiar de curso dos veces
seguidas se lanzaban dos pares de consultas, y si la primera tardaba más que la
segunda llegaba después y sobrescribía el resultado. El profesor veía **las notas
del curso anterior bajo la etiqueta del curso nuevo**. El mismo patrón podía
darse al pulsar `Actualizar` varias veces en el panel de tenants.

- `useRendimientoProfesor` y `useTenants` numeran cada consulta y descartan la
  respuesta —o el fallo— de las peticiones ya superadas. También evitan que una
  petición vieja apague el indicador de carga de la vigente.
- `useClasesProfesor`, `useInasistenciasProfesor` y `useCumpleanosProfesor`
  adoptan la misma numeración. Hoy solo cargan al montar, así que es preventivo,
  pero deja una sola regla para todo el módulo en lugar de tres hooks protegidos
  y cuatro sin proteger.
- El efecto de cartera de `useDashboardAdmin` gana la bandera `activo` que ya
  tenía su efecto hermano de cumpleaños.

Las tres pruebas nuevas se verificaron contra el código anterior: fallan sin el
arreglo y pasan con él.

También se corrigió una prueba inestable introducida en el commit anterior:
esperaba a que el error se limpiara, cosa que ocurre al **iniciar** la consulta,
y por eso afirmaba sobre los datos antes de que llegaran. Ahora espera el estado
final. La suite completa se ejecutó tres veces seguidas sin fallos.

Verificación: 35 archivos y 342 pruebas específicas; `pnpm run check:deploy`
correcto con 244 archivos y 1225 pruebas.

## 2026-08-08 - Los dashboards distinguen el fallo de red del dato en cero

Corrección del defecto más grave que la modularización del módulo 12 dejó
registrado. Hasta ahora, cuando una consulta fallaba, el error solo llegaba a
`console.error` y la pantalla pintaba el mismo estado vacío que cuando el
backend respondía correctamente con cero resultados. Un administrador podía leer
`Cartera al día` con el backend caído, y un profesor podía creer que había
perdido sus asignaciones.

Ocurría en cinco sitios, ahora los cinco publican su error:

- `useClasesProfesor` → `errorClases`. Era el peor porque encadenaba: sin clases
  no hay cursos, y sin cursos el rendimiento ni siquiera consultaba, así que un
  solo fallo apagaba tres secciones del panel del profesor.
- `useDashboardAdmin` → `errorCartera`.
- `useInasistenciasProfesor` → `errorInasistencias`.
- `useRendimientoProfesor` → `errorRendimiento`.
- `useRankingProfesor` → `error`.

Cambios visibles:

- La tarjeta de cartera gana un tercer estado: fondo gris pizarra, icono `⛔`,
  `Sin datos` y el motivo. Ya no puede leerse `Cartera al día` tras un fallo.
- Las tres tarjetas del profesor y el horario semanal pintan un aviso rojo en
  lugar de su texto de estado vacío.
- Las dos tablas de ranking sustituyen el emoji de celebración por `⛔` y el
  motivo del fallo.
- El selector de clases muestra `No se pudieron cargar las clases` y el de cursos
  `No se pudieron cargar los cursos`, en vez de `Sin clases asignadas` y
  `Sin cursos asignados`.

Los mensajes siguen el patrón que el módulo ya usaba y viven como constantes en
`utils/dashboards/`. Cada carga limpia el error anterior antes de reintentar.

Cuatro caracterizaciones de la capa 0 se actualizaron **a propósito**: fijaban el
comportamiento silencioso y eran exactamente la red que debía avisar de este
cambio. Se añadieron 11 pruebas nuevas entre hooks y componentes.

Verificación: 35 archivos y 339 pruebas específicas; `pnpm run check:deploy`
correcto con 244 archivos y 1222 pruebas.

## 2026-08-08 - Modularización de dashboards y rankings

Migración arquitectónica del módulo 12 del plan de modularización. No cambia
diseño, textos, rutas, comportamiento ni contratos del backend.

El módulo eran siete archivos y 2188 líneas sin ninguna prueba:
`DashboardProfesor.jsx` con 1005 líneas, `SuperAdminDashboard.jsx` con 431,
`AdminDashboard.jsx` con 343, los dos rankings con 108 y 112,
`CumpleanosSemana.jsx` con 118, y `DashboardAdmin.jsx` con 71 que no estaba
enrutado.

- `src/utils/dashboards/`: cuatro archivos por subdominio. Accesos, moneda,
  saludo y regla de mora del admin; jornadas, horario, deduplicación de clases,
  filtros, planeaciones y rankings del profesor; estados, validaciones del alta
  y marcado de diálogos del super admin; y el cálculo de días y edad de
  cumpleaños, compartido por dos roles. Incluye las reglas puras de clase.
- `src/services/dashboardsApi.js`: frontera HTTP única con los catorce contratos
  del módulo. Ninguna página importa ya `utils/api.js`.
- `src/hooks/dashboards/`: once hooks, uno por sección independiente, más los
  tres del super admin. Cada sección tiene su propia carga y su propio error, de
  modo que el fallo de una no bloquea a las demás.
- `src/components/dashboards/`: catorce componentes presentacionales separados en
  `admin/`, `profesor/` y `superAdmin/`, con `CumpleanosSemana` en la raíz por
  ser el único compartido entre dos roles.
- Las cinco páginas quedaron como raíces de composición de 58, 168, 63, 41 y 41
  líneas.
- Se eliminó `src/pages/DashboardAdmin.jsx`, una versión anterior y duplicada del
  panel de administración que no enrutaba `App.jsx` y que nadie importaba.

Decisiones registradas:

- El módulo posee su transporte de `GET /mis-clases/:id`,
  `GET /plan-de-clases/:id` y `GET /cartera/mora/resumen` en lugar de reutilizar
  el de planeaciones y cartera. Las llamadas Axios eran idénticas, así que
  reutilizarlas no habría roto ninguna prueba, pero habría acoplado los
  dashboards a servicios de otros dominios. Es el criterio que ya aplican
  `pagosApi.js`, `carteraTiposPagoApi.js` e `inventarioVentasApi.js`.
- No se fusionaron contratos entre roles. Admin, profesor y super admin no
  comparten endpoints, forma de respuesta ni permisos.
- Las dos tablas de ranking y las dos tarjetas de rendimiento quedaron como
  componentes hermanos. Unificarlas habría exigido pasar sus siete diferencias
  visuales por props, la mayoría cadenas de clases.
- Las dos funciones `capitalizarInicial` no se unificaron: la del admin conserva
  el resto del nombre y la del profesor lo baja a minúsculas. Fusionarlas
  cambiaría un saludo visible.
- `utils/periodoProfesor.js` no se tocó: es transversal y lo usan siete módulos.
- Se conservan sin corregir los ocho defectos previos a la migración, fijados por
  pruebas para que su corrección futura sea deliberada. El principal es que un
  fallo de red se muestra igual que un dato en cero en cinco sitios: las clases
  del profesor, la cartera, las inasistencias, el rendimiento y los rankings.

Verificación: 35 archivos y 328 pruebas específicas; `pnpm run check:deploy`
correcto.

## 2026-08-07 - Modularización de nómina, egresos y préstamos

Migración arquitectónica del módulo 11 del plan de modularización. No cambia
diseño, textos, rutas, comportamiento ni contratos del backend.

Las tres páginas eran cada una página, consultas, comandos, transformaciones y
presentación en un solo archivo, sin ninguna prueba: `NominaAdmin.jsx` con 312
líneas, `EgresosAdmin.jsx` con 324 y `PrestamosAdmin.jsx` con 326.

- `src/utils/nominaEgresosPrestamos/`: tres archivos separados por subflujo con
  el cálculo del neto y los contratos de nómina; la fecha local, las categorías,
  la normalización y los contratos de egresos; y los estados, contratos y totales
  de préstamos. Incluye las reglas puras de clase por saldo y por estado.
- `src/services/nominaEgresosPrestamosApi.js`: frontera HTTP única con los diez
  contratos del módulo. Ninguna página importa ya `utils/api.js`.
- `src/hooks/nominaEgresosPrestamos/`: tres hooks de consulta —las dos consultas
  paralelas de nómina, los egresos por rango y los profesores con el historial
  bajo demanda— y tres hooks de comandos —el pago de nómina, el formulario de
  egreso y el alta y saldado de préstamos—.
- `src/components/nominaEgresosPrestamos/`: siete componentes presentacionales,
  uno por tarjeta real de la pantalla. Solo importan React y utilidades puras.
- Las tres páginas quedaron como raíces de composición de 64, 62 y 60 líneas.

Decisiones registradas:

- No se fusionaron utilidades entre los tres subflujos. Son tres dominios
  relacionados por el backend —`POST /api/nomina/pagar` abona préstamos y crea un
  egreso automático en la misma transacción— pero con contratos distintos.
- `obtenerFechaLocal` se replicó con la misma firma inyectable que ya tiene
  `utils/pagos/formatos.js`. Unificarlas exigiría modificar el módulo de pagos y
  corresponde a una tarea transversal aparte.
- `GET /profesores` se consume desde el servicio del módulo, con el mismo
  criterio que `pagosApi.js` con `/estudiantes`.
- Los formatos monetarios no se unificaron: nómina y préstamos usan
  `valor.toFixed(2)` y egresos `Number(valor || 0).toFixed(2)`. Cualquier
  unificación cambiaría el comportamiento de una de las pantallas.
- `window.alert` y `window.confirm` se conservaron tal cual, junto con los otros
  defectos preexistentes documentados en el documento del módulo.

Verificación:

- Caracterización previa a cualquier extracción: 31 pruebas de página que
  pasaron sin modificarse en las seis capas siguientes.
- Suite específica del módulo: 20 archivos y 151 pruebas correctas.
- `pnpm run check:deploy`: correcto.
- Detalle completo por capas en
  [docs/modularizacion/NOMINA_EGRESOS_PRESTAMOS.md](modularizacion/NOMINA_EGRESOS_PRESTAMOS.md).

## 2026-08-06 - Limpieza: estado muerto `notas` en la caja

Limpieza sin cambio de comportamiento. El payload enviado al backend es
idéntico antes y después.

- `useCarritoVenta` mantenía el estado `notas`, lo inicializaba en `""` y lo
  reiniciaba tras cada cargo, pero ninguna vista tenía un control para
  escribirlo: siempre viajaba vacío.
- Se retiró el estado y el payload envía `notas: ""` de forma explícita, con un
  comentario que aclara que el backend acepta el campo y que la caja todavía no
  lo expone.
- `construirPayloadVenta` no se modificó: sigue recibiendo `notas` porque
  representa el contrato real de `POST /api/ventas/`, que sí admite el campo.
  Quien decide que hoy va vacío es el hook, no el contrato.
- Exponer el campo en la interfaz queda como funcionalidad pendiente. Requiere
  decidir dónde se escribe, dónde se muestra —hoy ni el historial ni el volante
  lo leen— y confirmar que el controlador del backend lo persista.

Verificación:

- Sin pruebas nuevas: la prueba existente del payload ya exigía `notas: ""` y
  siguió pasando sin modificarse, lo que confirma que el contrato no cambió.
- `pnpm run check:deploy`: correcto; 189 archivos, 732 pruebas, lint y build
  de producción de 308 módulos correctos.

## 2026-08-06 - Retroalimentación de la caja: carga visible y avisos unificados

Corrección funcional posterior a la modularización de inventario y ventas.
No es parte de la migración arquitectónica.

- La caja escribía un estado de carga que ninguna vista leía, así que durante la
  consulta inicial el catálogo mostraba `No hay productos activos con stock
  actualmente.`. Ese texto es el estado vacío, no el de carga, y con conexión
  lenta hacía creer que el inventario estaba agotado.
- `useConsultasVentas` ahora expone `cargando` y `VistaVentas` muestra el mismo
  spinner que ya usa el inventario mientras llegan las tres consultas. El estado
  vacío del catálogo solo aparece cuando la carga terminó.
- Los seis `window.alert` de la caja pasaron a `Swal.fire`, igual que el resto
  del módulo y del proyecto. Se conservaron los textos exactos y se les asignó
  título e ícono según el caso: `Atención`/`warning` para stock agotado, carrito
  vacío y estudiante obligatorio; `Éxito`/`success` para el cargo registrado; y
  `Error`/`error` para el fallo de registro y el de carga inicial.
- El motivo no es solo de estilo: Chrome ofrece `Impedir que esta página cree
  diálogos adicionales` cuando salen varios `alert` seguidos, y al marcarla el
  aviso `Error procesando la venta` dejaba de mostrarse, ocultando una venta
  fallida.
- No se modificaron contratos, payloads, rutas ni la estructura de las vistas.

Verificación:

- 3 pruebas nuevas: spinner durante la carga sin estado vacío, estado vacío solo
  al terminar, y ciclo completo de `cargando` en el hook.
- 97 pruebas específicas de inventario y ventas correctas (13 archivos).
- `pnpm run check:deploy`: correcto; 189 archivos, 732 pruebas, lint y build
  de producción de 308 módulos correctos.

## 2026-08-06 - Corrección: doble registro de un cargo en la caja

Corrección funcional posterior a la modularización de inventario y ventas.
No es parte de la migración arquitectónica.

- `useCarritoVenta` no impedía un segundo envío mientras la petición seguía en
  vuelo. Un doble clic en `Cargar al Estudiante` registraba dos ventas, cobraba
  el doble al estudiante y descontaba el stock dos veces. El backend no
  deduplica `POST /api/ventas/`.
- Se agregó el estado `registrandoVenta`: `procesarVenta` retorna de inmediato
  si ya hay un registro en curso, marca el estado antes de llamar al servicio y
  lo libera en `finally`.
- `VistaVentas` recibe `registrandoVenta`, deshabilita el botón con
  `disabled:opacity-50 disabled:cursor-not-allowed` y muestra `Cargando...`
  mientras dura la petición.
- Un error libera el bloqueo para permitir el reintento, y el carrito y el
  estudiante seleccionado se conservan.
- Las validaciones de carrito vacío y de estudiante obligatorio siguen
  ejecutándose antes de bloquear, para no dejar el botón inutilizable.
- No se modificaron contratos, payloads, rutas ni el resto de la interfaz.

Verificación:

- 3 pruebas nuevas: doble envío bloqueado con una promesa pendiente,
  rehabilitación tras error y botón deshabilitado en la vista.
- 94 pruebas específicas de inventario y ventas correctas (13 archivos).
- `pnpm run check:deploy`: correcto; 189 archivos, 729 pruebas, lint y build
  de producción de 308 módulos correctos.

## 2026-08-06 - Modularización completa de inventario y ventas

- Se conservaron diseño, textos, rutas `/admin/inventario` y `/admin/ventas`,
  protección `AdminRoute`, comportamiento responsive, contratos HTTP y payloads
  de productos, cargos y anulaciones, sin agregar funciones ni rediseños.
- `utils/inventarioVentas/inventario.js` y `ventas.js` concentran estados y
  payloads de producto, filtros del catálogo, transformaciones inmutables del
  carrito, totales, contratos de venta y anulación, y las reglas puras de clase
  por estado y stock.
- `services/inventarioVentasApi.js` centraliza los ocho contratos del módulo.
  Las consultas devuelven datos; crear, actualizar y cambiar el estado de un
  producto devuelven `{ status, data }` porque la interfaz comprueba el rango
  HTTP. `GET /estudiantes` se consume desde aquí en modo lectura, con el mismo
  criterio que `pagosApi.js` y `carteraTiposPagoApi.js` con endpoints
  compartidos.
- Los hooks de `hooks/inventarioVentas/` separan la consulta del catálogo con su
  filtro, las tres consultas paralelas de la caja, el formulario de producto, el
  carrito con el cargo a crédito y la anulación con motivo.
- Los bloques visuales viven en `components/inventarioVentas/` y reciben datos y
  acciones mediante props. `VolanteVenta.jsx` conserva la impresión mediante
  `components/impresion/DocumentoImprimible.jsx` con `tipo="volante_venta"`.
- `pages/InventarioAdmin.jsx` queda como raíz de composición de 44 líneas (antes
  283) y `pages/VentasAdmin.jsx` de 66 líneas (antes 430), sin endpoints,
  payloads ni bloques visuales extensos.
- Se conservan el filtro activo/inactivo/todos, la actualización local de la
  lista al cambiar el estado de un producto sin recargar, el spinner solo en la
  carga inicial, el tope del carrito por existencias, la prohibición de cargos a
  Público General, el motivo obligatorio de al menos cinco caracteres al anular
  y la fila anulada con su motivo visible.
- Se conservan deliberadamente los avisos con `alert` de la caja frente a
  SweetAlert en inventario, la ausencia de indicador de carga en la caja y el
  campo `notas` que viaja siempre vacío por no tener control en la interfaz.
- El módulo no adopta las capacidades de paginación y búsqueda que el backend ya
  ofrece en `/inventario` y `/api/ventas/`; hacerlo habría sido una función
  nueva.

Riesgo conocido que esta migración conservó a propósito:

- El botón `Cargar al Estudiante` no se bloqueaba mientras la petición estaba en
  vuelo, por lo que un doble clic podía registrar dos cargos. Es un defecto
  preexistente cuya corrección excedía una migración arquitectónica; se atendió
  por separado en la entrada del mismo día que encabeza este archivo.

Verificación final:

- 91 pruebas específicas de inventario y ventas correctas (13 archivos).
- `pnpm run check:deploy`: correcto; 189 archivos, 726 pruebas, lint y build
  de producción de 308 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones
  duplicadas: correcta.

## 2026-08-05 - Modularización completa de planilla de notas

- Se conservaron diseño, textos, ruta `/planilla`, comportamiento responsive
  (tarjeta móvil / tabla de escritorio), cálculos de promedio, validaciones
  de rango y contratos del backend, sin agregar funciones ni rediseños.
- Las transformaciones puras (columna interna reservada, formateo de
  etiquetas, notas visibles, promedio, coma decimal y payload de nota) viven
  en `utils/planilla/notas.js`.
- `services/planillaApi.js` centraliza clases, planilla, guardado de nota y
  eliminación de tipo de evaluación, con su propio consumo independiente de
  `services/asistenciaApi.js` aunque comparta dos rutas del backend.
- Los hooks de `hooks/planilla/` separan consultas cancelables de clases y
  planilla del estado editable y los comandos de guardado y gestión de
  tipos de evaluación.
- Los bloques visuales viven en `components/planilla/` y reciben datos y
  acciones mediante props; `PlanillaRow.jsx` se trasladó desde
  `components/` a esa carpeta.
- `pages/Planilla.jsx` queda como raíz de composición de 127 líneas (antes
  ~677), sin endpoints, payloads ni bloques visuales extensos.
- Se conservan la persistencia del tipo de calificación elegido, el bloqueo
  de nombres de tipo reservados/duplicados, la confirmación antes de
  eliminar un tipo y el aviso cuando la clase seleccionada ya no está
  disponible.

Verificación final:

- 45 pruebas específicas de planilla correctas (10 archivos).
- `pnpm run check:deploy`: correcto; 177 archivos, 637 pruebas, lint y build
  de producción de 297 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones
  duplicadas: correcta.

## 2026-08-04 - Modularización completa de pagos

- Se conservaron diseño, textos, ruta `/admin/pagos`, protección administrativa,
  navegación desde cartera, contratos HTTP, payloads y reglas financieras de
  pagos normales, cuotas vencidas, abonos, adelantos y subsidios.
- `utils/pagos/` concentra formatos, cálculos en centavos, normalización,
  estados iniciales y payloads puros; `services/pagosApi.js` es la única
  frontera HTTP del módulo.
- Siete hooks separan catálogos, consultas por estudiante, opciones de
  adelanto, formulario, valores personalizados, registro y anulación.
- Seis componentes de `components/pagos/` conservan listado, formularios,
  historial y comprobante mediante props y callbacks.
- `pages/PagosAdmin.jsx` queda como raíz de composición de ruta, sesión, hooks
  y componentes, sin endpoints, payloads ni bloques visuales extensos.
- `FacturaModerna` se trasladó al dominio PAGOS y continúa dentro de
  `DocumentoImprimible`; no quedan imports ni implementaciones antiguas
  paralelas.

Verificación final:

- 18 archivos y 70 pruebas específicas de PAGOS correctas.
- `pnpm run check:deploy`: correcto; 167 archivos, 592 pruebas, ESLint y build
  de producción de 289 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones duplicadas:
  correcta.

## 2026-08-03 - Modularización completa de cartera y tipos de pago

- Se conservaron diseño, textos, rutas administrativas, protección por rol,
  experiencia responsive, impresión A4, CSV, navegación a Pagos, payloads y
  contratos del backend.
- `utils/carteraTiposPago/` concentra formatos, filtros, totales, CSV, estados
  publicado/borrador, normalización y payloads puros.
- `services/carteraTiposPagoApi.js` es la única frontera HTTP para cartera
  vencida, conceptos, configuración y asignación de cursos.
- Cinco hooks separan carga/fallback/detalle de los formularios y comandos de
  creación, configuración y reemplazo de cursos.
- `components/carteraTiposPago/` contiene las vistas presentacionales de
  cartera/impresión y administración de conceptos mediante props y callbacks.
- `pages/CarteraVencidaAdmin.jsx` y `pages/TiposPagosAdmin.jsx` son raíces de
  composición. Se retiró `components/cartera/AdministrarTiposPago.jsx` y no
  quedan implementaciones antiguas paralelas.
- Se preservó el fallback de `/tipos-pagos/detallado` a `/tipos-pagos`, la
  visibilidad de deudas existentes, las confirmaciones de activación y el
  reemplazo completo de asignaciones por curso.

Verificación final:

- 14 archivos y 49 pruebas específicas de cartera y tipos de pago correctas.
- `pnpm run check:deploy`: correcto; 149 archivos, 522 pruebas, ESLint y build
  de producción de 273 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones duplicadas:
  correcta.

## 2026-08-03 - Modularización completa de malla curricular

- Se conservaron diseño, textos, ruta `/planeador-anual`, protección,
  almacenamiento local, experiencia responsive, impresión, payloads y
  contratos del backend.
- `utils/mallaCurricular/planeadorAnual.js` concentra el contrato puro de ocho
  filas, normalización por `slot`, validaciones y payload posicional.
- `services/mallaCurricularApi.js` es la única frontera HTTP; los hooks separan
  consultas y período del estado editable, validaciones y guardado.
- Los componentes de `components/mallaCurricular/` reciben datos y callbacks
  por props y conservan tarjetas móviles, tabla de escritorio, progreso, estados
  y vista imprimible.
- `pages/PlaneadorAnual.jsx` queda como raíz de composición de 94 líneas, sin
  endpoints, payloads, alertas ni bloques visuales extensos.
- Se preserva el arreglo completo de ocho posiciones para que vaciar una fila
  guardada solicite su eliminación sin desplazar otros `slot`.
- No quedan implementaciones antiguas paralelas dentro de la página.

Verificación final:

- 10 archivos y 34 pruebas específicas de malla curricular correctas.
- `pnpm run check:deploy`: correcto; 136 archivos, 475 pruebas, ESLint y build
  de producción de 263 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de ruta, imports, endpoints, alcance e implementaciones duplicadas:
  correcta.

## 2026-08-03 - Reporte académico parcial en tiempo real

- El reporte parcial dejó de reutilizar el contrato del boletín oficial y ahora
  consume `GET /boletines/admin/reporte-parcial/{estudiante_id}/{periodo}`.
- Las notas y promedios reflejan la planilla vigente aunque exista un boletín
  enviado anteriormente.
- Cada fila muestra primero la descripción guardada por el profesor en la
  planilla, por ejemplo `Evaluación oral`, y conserva nota o valoración.
- El certificado de notas continúa usando
  `/boletines/admin/generar/{estudiante_id}/{periodo}` sin cambios.

Verificación:

- 17 archivos y 62 pruebas específicas de certificados e impresión correctas.
- `pnpm run check:deploy`: correcto; 126 archivos, 441 pruebas, ESLint y build
  de producción de 252 módulos correctos.
- `git diff --check`: correcto.

## 2026-08-03 - Modularización completa de certificados e impresión

- Se conservaron diseño, textos, rutas, permisos, formato A4, experiencia
  responsive, payloads y contratos del backend para certificados, identidad
  institucional y plantillas.
- `utils/certificadosImpresion/` concentra filtros, cálculos, consolidación
  académica y contratos puros; `services/certificadosImpresionApi.js` delimita
  el transporte propio y reutiliza los contratos compatibles de boletines y
  asistencia.
- `printingService.js` continúa como frontera compartida de branding, logos y
  plantillas. La implementación única de `usePrintConfig` vive en el dominio y
  conserva una reexportación compatible para los demás impresos.
- Los hooks separan carga y generación cancelables, caché de impresión y
  comandos de identidad o plantillas. Las vistas de
  `components/certificadosImpresion/` reciben datos y callbacks por props.
- `pages/CertificadosAdmin.jsx` y `pages/BrandingAdmin.jsx` son las raíces de
  composición; se conservaron la selección de pestañas y el montaje diferido
  de plantillas.
- Se retiraron los adaptadores administrativos anteriores, que ya no tenían
  consumidores. No quedan implementaciones antiguas paralelas.
- `DocumentoImprimible` conserva branding, firmas, pie, scroll horizontal
  móvil y los comandos `Descargar PDF` e `Imprimir` mediante `window.print()`.

Verificación final:

- 17 archivos y 61 pruebas específicas de certificados e impresión correctas.
- `pnpm run check:deploy`: correcto; 126 archivos, 440 pruebas, ESLint y build
  de producción de 252 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones duplicadas:
  correcta.

## 2026-08-02 - Modularización completa de estudiantes y observador

- Se conservaron diseño, textos, rutas, protecciones, experiencia responsive,
  almacenamiento local, payloads y contratos del backend en administración de
  estudiantes y observador del profesor.
- `utils/estudiantesObservador/` concentra formularios, filtros,
  normalizaciones y payloads puros; `services/estudiantesObservadorApi.js` es
  la única frontera HTTP del módulo.
- Los hooks separan consultas con aislamiento de respuestas obsoletas,
  formularios y comandos de creación, edición, estado y observaciones.
- Las vistas de `components/estudiantesObservador/` reciben datos y callbacks;
  `pages/EstudiantesAdmin.jsx` y `pages/Formulario.jsx` son raíces de
  composición, y `components/estudiantesObservador/Observaciones.jsx` conserva
  alertas e impresión.
- Se conservaron `/admin/estudiantes`, `/Formulario`, sus guards, el detalle
  tolerante a datos parciales y el guardado parcial del observador.
- Se retiraron `CrearEstudiante.jsx` y `ReporteEstudiante.jsx`, que no tenían
  rutas, imports ni consumidores y duplicaban implementaciones activas.
- La diferencia contractual entre `id` administrativo y `estudiante_id` de
  planilla permanece explícita y protegida por pruebas.
- Las tarjetas del observador continúan apareciendo sin exigir búsqueda, pero
  consultan progresivamente al acercarse al viewport. Buscar un estudiante lo
  vuelve visible y activa su consulta sin disparar solicitudes para todo el
  curso al mismo tiempo.
- Los fallos y tiempos de espera ya no se muestran como `Pendiente`: bloquean
  edición e impresión y ofrecen una acción explícita para reintentar.

Verificación final:

- 18 archivos y 57 pruebas específicas de estudiantes y observador correctas.
- `pnpm run check:deploy`: correcto; 111 archivos, 387 pruebas, lint y build de
  producción de 241 módulos correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones duplicadas:
  correcta.

## 2026-08-02 - Modularización completa de boletines

- Se conservaron diseño, textos, rutas, protecciones, comportamiento,
  almacenamiento local, payloads y contratos del backend en generación
  administrativa, ingreso docente y orden de materias.
- `utils/boletines/` concentra filtros, consolidación, cálculos, normalización,
  copia masiva, movimientos y construcción de payloads puros.
- `services/boletinesApi.js` centraliza el transporte HTTP; los hooks separan
  consultas cancelables de edición, guardados y orden.
- Las vistas de `components/boletin/` reciben datos y callbacks por props;
  `pages/Boletin.jsx`, `IngresoBoletinProfesor.jsx` y `OrdenBoletin.jsx` son las
  raíces de composición.
- Se conservaron `/boletin`, `/ingreso-boletin`, sus guards y la pestaña
  `orden-boletin` de `/admin`.
- Se retiraron los conectores anteriores y `Header.jsx`, `Materia.jsx` y
  `TablaNotas.jsx`, que no tenían consumidores activos y duplicaban un contrato
  de impreso distinto al vigente.
- El boletín mantiene `DocumentoImprimible`, formato A4, escalas numérica y de
  desarrollo y desplazamiento horizontal móvil.
- Al cambiar entre clases con el mismo estudiante, la vista espera que notas y
  observaciones correspondan a la consulta activa antes de mostrar la tarjeta;
  esto evita la pantalla blanca cuando se regresa a una materia con más notas.

Verificación final:

- 17 archivos y 44 pruebas específicas de boletines correctas.
- `pnpm run check:deploy`: correcto; 93 archivos, 330 pruebas, lint y build de
  producción correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, imports, endpoints, alcance e implementaciones duplicadas:
  correcta.

## 2026-08-01 - Modularización completa de administración académica y horarios

- Se conservaron diseño, textos, rutas, comportamiento y contratos del backend
  en profesores, cursos, materias, asignaciones y horarios.
- `utils/administracionAcademica/` concentra contratos y transformaciones puras;
  cinco servicios separan el transporte HTTP y los hooks controlan consultas,
  formularios y comandos.
- Los componentes de `components/administracionAcademica/` quedan limitados a
  presentación y contenedores; `Admin.jsx` y `HorariosAdmin.jsx` son las raíces
  activas de composición.
- Se retiraron los componentes de las ubicaciones antiguas y
  `GestionAcademica.jsx`, raíz histórica sin rutas, imports ni consumidores.
- No se modificó Orden boletín ni ningún otro dominio administrativo.

Verificación final:

- `pnpm run check:deploy`: correcto; 77 archivos, 287 pruebas, lint y build de
  producción correctos.
- `git diff --check`: correcto; los 94 archivos pertenecen al módulo o a su
  documentación autorizada.
- Auditoría de rutas, imports, alcance e implementaciones duplicadas: correcta.

## 2026-07-31 - Modularización completa de asistencia profesor

- El flujo conserva textos, diseño, ruta `/asistencia`, almacenamiento y
  contratos del backend, sin agregar funciones ni rediseños.
- Las transformaciones puras y el payload viven en
  `utils/asistencia/profesor.js`.
- `services/asistenciaApi.js` centraliza planilla, clases, historial y guardado.
- Los hooks de `hooks/asistencia/` separan consultas cancelables de marcación y
  comandos editables.
- Los bloques visuales viven en `components/asistencia/` y reciben datos y
  acciones mediante props.
- `pages/Asistencia.jsx` queda como raíz de composición, contexto y navegación.
- Se conservan el reintento del historial, la edición segura, la restauración,
  las validaciones de pendientes y el detalle de errores del backend.

Verificación final:

- 35 pruebas específicas de asistencia correctas.
- `pnpm run check:deploy`: correcto; 133 pruebas globales, lint y build
  correctos.
- `git diff --check`: correcto.
- Auditoría de rutas, alcance y duplicados: correcta.

## 2026-07-29 - Decimosexta capa: detalle visual y consolidación administrativa

- Los estados de carga y error, el reporte del plan, el formulario de revisión,
  el historial de comentarios y las evidencias se trasladan a
  `components/planeaciones/admin/DetallePlaneacionAdmin.jsx`.
- El componente recibe datos y acciones mediante props. No conoce rutas,
  parámetros de URL ni servicios de planeaciones; reutiliza únicamente el hook
  visual compartido para resolver imágenes protegidas.
- `PlaneadoresClasesAdmin.jsx` queda como raíz de composición del flujo
  administrativo: decide entre bandeja y detalle, conecta los hooks y conserva
  la navegación con filtros.
- La página pasa de 435 a 154 líneas y deja de contener bloques visuales
  extensos o utilidades de presentación.
- Se agregaron seis pruebas para carga, error, contenido, revisión, historial y
  evidencias protegidas.

Verificación:

- `pnpm run check:deploy`: correcto.
- 98 pruebas correctas.
- Lint y build correctos.

Resultado:

- El refactor por capas del flujo administrativo de planeaciones queda
  consolidado.
- Las responsabilidades quedan delimitadas entre servicios, utilidades, hooks,
  componentes presentacionales y la página de composición.

## 2026-07-29 - Decimoquinta capa: resultados de la bandeja administrativa

- La cabecera de resultados, búsqueda automática, tabla de escritorio,
  tarjetas móviles, paginación y estados de selección, carga, error y vacío se
  trasladan a
  `components/planeaciones/admin/ResultadosPlaneacionesAdmin.jsx`.
- El componente recibe datos y callbacks mediante props; no consulta
  servicios, no sincroniza la URL y no administra el estado de filtros o
  navegación.
- La apertura de cada planeación continúa en la página para conservar la ruta y
  los parámetros actuales de la bandeja.
- Se elimina de `PlaneadoresClasesAdmin.jsx` toda la presentación duplicada del
  listado. La página pasa de 700 a 435 líneas.
- Se agregaron cinco pruebas para selección guiada, búsqueda, estados
  prioritarios, resultados responsive, apertura y paginación acotada.

Verificación:

- `pnpm run check:deploy`: correcto.
- 92 pruebas correctas.
- Lint y build correctos.

## 2026-07-29 - Decimocuarta capa: presentación de la bandeja administrativa

- El encabezado y el selector temporal de la bandeja se trasladan a
  `components/planeaciones/admin/EncabezadoPlaneacionesAdmin.jsx`.
- El selector de profesor, los estados de revisión y el contador pendiente se
  trasladan a
  `components/planeaciones/admin/FiltrosPlaneacionesAdmin.jsx`.
- Badges, mensajes accesibles, spinner y la clase compartida de campos se
  centralizan en
  `components/planeaciones/admin/ElementosPlaneacionAdmin.jsx`.
- Los componentes reciben valores y callbacks mediante props; no sincronizan
  la URL, no consultan servicios y no administran el estado de la bandeja.
- Se elimina de `PlaneadoresClasesAdmin.jsx` la presentación duplicada que ya
  vive en esos componentes. La página pasa de 838 a 700 líneas.
- Se agregaron siete pruebas para alcance temporal, cambios de vista,
  selección de profesor, activación de estados, límite del contador, badges,
  mensajes accesibles y carga.

Verificación:

- `pnpm run check:deploy`: correcto.
- 87 pruebas correctas.
- Lint y build correctos.

## 2026-07-29 - Decimotercera capa: detalle y revisión administrativa

- La carga paralela del plan y sus comentarios, el estado del detalle, la
  aprobación, los reconocimientos, las solicitudes de ajuste y los conflictos
  de versión se trasladan a
  `hooks/planeaciones/useDetallePlaneacionAdmin.js`.
- La eliminación administrativa de evidencias se aísla en
  `hooks/planeaciones/useEliminacionImagenPlaneacionAdmin.js`.
- El hook de detalle ignora respuestas antiguas si cambia el plan antes de
  terminar la consulta.
- Se conservan los payloads de versión, mensajes, actualización local,
  notificaciones, desplazamiento superior y recarga ante conflicto `409`.
- `PlaneadoresClasesAdmin.jsx` deja de importar servicios de planeaciones y pasa
  de 954 a 838 líneas.
- Se agregaron ocho pruebas para carga, aprobación, ajuste, conflicto, error,
  confirmación y eliminación de imágenes.

Verificación:

- `pnpm run check:deploy`: correcto.
- 80 pruebas correctas.
- Lint y build correctos.

## 2026-07-29 - Duodécima capa: bandeja administrativa y utils por dominio

- Las utilidades de planeaciones se organizan en `src/utils/planeaciones/`,
  separadas como `profesor.js` y `admin.js`, con sus pruebas junto al archivo
  correspondiente.
- Se actualizan todas las importaciones del profesor y administrador; no quedan
  referencias a las rutas anteriores de `utils`.
- Filtros, búsqueda con debounce, profesores, sincronización de URL, consultas,
  contador pendiente y paginación de la bandeja se trasladan a
  `hooks/planeaciones/useListadoPlaneacionesAdmin.js`.
- `PlaneadoresClasesAdmin.jsx` conserva la presentación y navegación al detalle,
  pero deja de llamar directamente los servicios de listado y profesores.
- La restauración de `pagina` desde la URL espera ahora la respuesta antes de
  ajustar el límite, evitando regresar prematuramente a la página 1.
- La pantalla administrativa pasa de 1.129 a 954 líneas.
- Se agregaron cuatro pruebas para carga paginada, conteos, filtros, debounce y
  errores controlados.

Verificación:

- `pnpm run check:deploy`: correcto.
- 72 pruebas correctas.
- Lint y build correctos.

## 2026-07-29 - Undécima capa: consolidación final del profesor

- La carga, selección, deduplicación y persistencia de clases asignadas se
  trasladan a
  `hooks/planeaciones/useClasesPlaneacionProfesor.js`.
- La normalización del seguimiento, actualización de lecturas y apertura de
  comentarios solicitados por URL se trasladan a
  `hooks/planeaciones/useSeguimientoPlaneacionProfesor.js`.
- La confirmación, eliminación y sincronización posterior de evidencias
  guardadas se trasladan a
  `hooks/planeaciones/useEliminacionImagenPlanProfesor.js`.
- `normalizarSeguimientoPlanProfesor`, en `utils/planeaciones/profesor.js`,
  establece un contrato puro para los datos administrativos del plan.
- `PlanDeClases.jsx` deja de importar servicios y queda dedicado a componer
  hooks y componentes. Pasa de 398 a 281 líneas.
- Se conservan redirección de sesión, parámetros de URL, selección recordada,
  actualización del historial y mensajes existentes.
- Se agregaron diez pruebas para clases duplicadas o ausentes, errores de
  carga, seguimiento, enlaces de comentarios y eliminación de evidencias.

Verificación:

- `pnpm run check:deploy`: correcto.
- 68 pruebas correctas.
- Lint y build correctos.

Resultado:

- El refactor por capas del flujo del profesor queda consolidado.
- La página no contiene endpoints, transporte HTTP ni bloques visuales
  extensos; esas responsabilidades quedan delimitadas entre servicios, hooks,
  utilidades y componentes.

## 2026-07-29 - Décima capa: panel final de guardado

- El panel de confirmación se traslada a
  `components/planeaciones/profesor/GuardadoPlanProfesor.jsx`.
- El componente presenta el texto correspondiente al estado, el progreso, la
  desactivación temporal y el mensaje resultante.
- La construcción multipart, validación del contexto, conflictos de versión,
  recuperación de red y reintentos permanecen en
  `hooks/planeaciones/useGuardadoPlaneacionProfesor.js`.
- `PlanDeClases.jsx` únicamente conecta el estado visual y la acción del hook,
  y pasa de 444 a 398 líneas.
- Se conservan diseño, mensajes, accesibilidad y comportamiento del botón.
- Se agregaron tres pruebas para ejecución, progreso, bloqueo durante carga y
  presentación del mensaje.

Verificación:

- `pnpm run check:deploy`: correcto.
- 58 pruebas correctas.
- Lint y build correctos.

## 2026-07-29 - Novena capa: encabezado y configuración

- El encabezado del planeador y su indicador de estado se trasladan a
  `components/planeaciones/profesor/EncabezadoPlanProfesor.jsx`.
- La selección de clase, periodo y fecha se traslada a
  `components/planeaciones/profesor/ConfiguracionPlanProfesor.jsx`.
- Ambos componentes reciben datos y callbacks mediante props; la página
  conserva la selección, carga y sincronización con la URL y `localStorage`.
- El mapeo puro de estados pendiente, cargando, modificado y guardado se
  centraliza en `obtenerEstadoGuardadoVisual`, dentro de
  `utils/planeaciones/profesor.js`.
- Se mantienen opciones, textos, estilos, animación de confirmación y
  desactivación del selector durante la carga.
- `PlanDeClases.jsx` pasa de 579 a 444 líneas.
- Se agregaron seis pruebas para estados visuales, identificación del plan,
  selección de contexto y carga de clases.

Verificación:

- `pnpm run check:deploy`: correcto.
- 55 pruebas correctas.
- Lint y build correctos.

## 2026-07-29 - Octava capa: presentación de clase

- La vista de presentación se traslada a
  `components/planeaciones/profesor/PresentacionClaseProfesor.jsx`.
- El componente encapsula su portal, bloqueo temporal del scroll, cierre con
  Escape, secciones condicionales y visualización de evidencias.
- La página conserva únicamente el estado que decide cuándo abrir o cerrar la
  presentación y le entrega los datos mediante props.
- Se mantienen el diseño, los textos, el aviso de cambios sin guardar, los
  valores alternativos y la apertura de imágenes locales o protegidas.
- `PlanDeClases.jsx` deja de importar `createPortal`, `useImagenProtegida` y el
  formateador de fecha, y pasa de 869 a 579 líneas.
- Se agregaron cinco pruebas para contenido completo y vacío, cierre por botón
  y teclado, restauración del scroll e imágenes locales y guardadas.

Verificación:

- `pnpm run check:deploy`: correcto.
- 49 pruebas correctas.
- Lint y build correctos.

## 2026-07-28 - Séptima capa: guía editable y evidencias

- La guía didáctica editable se traslada a
  `components/planeaciones/profesor/GuiaDidacticaProfesor.jsx`.
- Los campos de texto y las evidencias nuevas o guardadas se dividen en
  `CampoTextareaPlanProfesor.jsx` y `EvidenciasPlanProfesor.jsx`.
- Los componentes son presentacionales: reciben el formulario, las imágenes y
  las acciones mediante props; no consultan servicios ni duplican estado.
- Se conservan la estructura visual, los límites de texto, la previsualización,
  la eliminación de evidencias y el acceso al modo presentación.
- `PlanDeClases.jsx` queda como coordinador y pasa de 1.179 a 869 líneas.
- Se agregaron tres pruebas de componente para carga, edición, presentación y
  eliminación de evidencia guardada.

Verificación:

- `pnpm run check:deploy`: correcto.
- 44 pruebas correctas.
- Lint y build correctos.

## 2026-07-28 - Sexta capa: componentes de seguimiento e historial

- Se crea `src/components/planeaciones/profesor/` como carpeta de presentación
  del planeador docente.
- `SeguimientoPlanProfesor.jsx` contiene el estado administrativo, el acceso a
  comentarios y el historial visual de observaciones por versión.
- `HistorialPlanesProfesor.jsx` contiene tarjetas, estados de carga y error,
  paginación y selección visual del plan activo.
- `EstadoRevisionBadge.jsx` centraliza la insignia reutilizada por ambos
  componentes.
- Los componentes reciben datos y acciones mediante props; no consultan la API
  ni administran el estado de dominio.
- `PlanDeClases.jsx` deja de contener esos bloques e iconos auxiliares y se
  limita a conectarlos con sus hooks.
- Se agregaron cuatro pruebas de componentes para estados de revisión,
  comentarios, selección del plan y reintento del historial.

Verificación:

- `pnpm run check:deploy`: correcto.
- 41 pruebas correctas.
- Lint y build correctos.

## 2026-07-28 - Quinta capa: guardado resiliente del profesor

- El envío del plan y sus estados de ejecución se trasladan a
  `src/hooks/planeaciones/useGuardadoPlaneacionProfesor.js`.
- El hook administra validación de contexto, construcción del multipart,
  guardado, recarga posterior, conflicto de versión `409`, fallos de conexión y
  reintento solicitado por el profesor.
- La construcción de `FormData` se concentra en
  `crearFormDataPlanProfesor`, dentro de
  `src/utils/planeaciones/profesor.js`.
- `PlanDeClases.jsx` deja de importar SweetAlert2 y la operación HTTP de
  guardado; solo coordina los resultados con sus indicadores visuales.
- Se mantienen los mismos textos, botones, encabezado multipart,
  `version_esperada`, imágenes opcionales y conservación de cambios locales.
- Se agregaron cinco pruebas para el contrato multipart, éxito, las dos
  decisiones ante conflicto y la continuidad sin conexión.

Verificación:

- `pnpm run check:deploy`: correcto.
- 37 pruebas correctas.
- Lint y build correctos.

## 2026-07-28 - Cuarta capa: formulario y carga del plan diario

- El estado editable del plan del profesor se traslada a
  `src/hooks/planeaciones/useFormularioPlaneacionProfesor.js`.
- El hook concentra fecha, periodo, campos pedagógicos, imágenes nuevas,
  imágenes guardadas, vistas previas, valores recordados y estado local de
  guardado.
- La consulta automática y la recarga del plan correspondiente a la clase y
  fecha activas se trasladan a
  `src/hooks/planeaciones/useCargaPlanDiarioProfesor.js`.
- La carga ignora respuestas antiguas si el profesor cambia de clase o fecha
  antes de que termine una solicitud.
- `PlanDeClases.jsx` conserva el guardado remoto, los conflictos `409`, los
  reintentos por conexión, las alertas y la coordinación visual.
- No se modificaron endpoints, `FormData`, validaciones de imágenes,
  `localStorage` ni comportamiento visible.
- Se agregaron siete pruebas para cambios del formulario, recuperación de
  valores, carga de planes, errores y respuestas obsoletas.

Verificación:

- `pnpm run check:deploy`: correcto.
- 32 pruebas correctas.
- Lint y build correctos.

## 2026-07-28 - Tercera capa: hooks de historial y observaciones

- El historial del profesor se traslada a
  `src/hooks/planeaciones/useHistorialPlaneacionesProfesor.js`.
- El hook administra carga, paginación de tres registros, indicador de
  continuación, reintentos, errores y actualización local de un plan.
- La apertura y lectura de observaciones se traslada a
  `src/hooks/planeaciones/useObservacionesPlaneacionProfesor.js`.
- El segundo hook conserva la lectura explícita de comentarios, actualiza el
  contador pendiente y solicita la actualización de notificaciones.
- Ambos hooks ignoran respuestas antiguas cuando cambia la asignación o el plan,
  evitando que una solicitud anterior sobrescriba la selección vigente.
- `PlanDeClases.jsx` conserva todavía el formulario, la carga del plan diario,
  el guardado, las imágenes y la presentación.
- No se modificaron endpoints, payloads, permisos ni comportamiento visible.
- Se agregaron seis pruebas de hooks para paginación, actualización local,
  cambio de asignación, lectura correcta, lectura parcial y cambio de plan.

Verificación:

- `pnpm run check:deploy`: correcto.
- 25 pruebas correctas.
- Lint y build correctos.

## 2026-07-28 - Segunda capa de modularización: servicio de planeaciones

- Las rutas y configuraciones HTTP utilizadas por las pantallas de planeaciones
  se centralizan en `src/services/planeacionesApi.js`.
- El servicio cubre clases asignadas, plan diario, historial, guardado
  multipart, observaciones, confirmación de lectura, bandeja administrativa,
  detalle, revisión e imágenes.
- `PlanDeClases.jsx` y `PlaneadoresClasesAdmin.jsx` dejan de importar el cliente
  Axios directamente. Las páginas continúan coordinando estado, efectos,
  alertas, navegación y presentación.
- El servicio devuelve el cuerpo `data` y propaga los errores originales sin
  transformarlos. Así se conservan la cancelación con `AbortController`, los
  conflictos `409` y la detección de fallos de conexión.
- No se modificaron endpoints, parámetros, payloads, encabezados, permisos ni
  comportamiento visible.
- Se agregaron seis pruebas de contrato para proteger las trece operaciones
  HTTP encapsuladas.

Verificación:

- `pnpm run check:deploy`: correcto.
- 19 pruebas correctas.
- Lint y build correctos.

## 2026-07-28 - Primera capa de modularización de planeaciones

- Se inicia la separación controlada de las pantallas extensas de planeaciones
  del profesor y del administrador.
- Las constantes, estados iniciales, normalización de respuestas, construcción
  de filtros y formateadores puros se trasladan a
  `src/utils/planeaciones/profesor.js` y `src/utils/planeaciones/admin.js`.
- `PlanDeClases.jsx` y `PlaneadoresClasesAdmin.jsx` consumen estas utilidades,
  pero conservan por ahora el estado de React, los efectos, las solicitudes API
  y toda la presentación.
- No se modificaron endpoints, payloads, permisos, almacenamiento local ni
  comportamiento visible. Esta capa sirve como contrato estable antes de
  extraer servicios, hooks y componentes.
- Se agregaron nueve pruebas unitarias para proteger estados, fechas, filtros,
  paginación, normalización de respuestas y mensajes de error.

Verificación:

- `pnpm run check:deploy`: correcto.
- 13 pruebas correctas.
- Lint y build correctos.

## 2026-07-27 - Notificaciones contenidas en móvil y tablet

- La ventana compartida de notificaciones se posiciona respecto al viewport en
  móvil y tablet, en lugar de calcular su ancho desde la campana.
- En teléfonos conserva márgenes laterales simétricos; desde `sm` usa un ancho
  controlado y se alinea al borde derecho de la pantalla.
- En escritorio mantiene el comportamiento original anclado debajo de la
  campana.
- La altura total respeta el alto dinámico del dispositivo. El encabezado y la
  acción inferior permanecen visibles y solo la lista central hace scroll.
- El ajuste aplica por igual a los perfiles administrador y profesor, sin
  cambiar carga, agrupación, contador ni navegación de las notificaciones.

Verificación:

- `pnpm run test`: 4 pruebas correctas.
- `pnpm run lint`: correcto.
- `pnpm run build`: correcto.

## 2026-07-25 - Información de trabajo integrada al encabezado

- Materia, salón, período y fecha dejan de mostrarse como mini tarjetas
  separadas en `Planilla de notas` y `Gestión de asistencia`.
- Toda la información forma un único bloque continuo dentro de la tarjeta
  principal, sin una división horizontal entre el encabezado y el contexto.
- Una sola línea morada vertical redondeada recorre el título, la descripción y
  toda la información de trabajo para reforzar que pertenecen a la misma card.
- Los datos se organizan a la derecha de la línea en una cuadrícula adaptable,
  sin bordes, sombras ni fondos individuales.
- `Tipo de calificación`, exclusivo de Planilla, queda integrado en la misma
  composición sin una tarjeta propia.
- No se cambiaron consultas, estados, notas, asistencia ni guardado.

Verificación:

- `pnpm exec eslint src/components/EncabezadoContextoCurso.jsx
  src/pages/Planilla.jsx src/pages/Asistencia.jsx` correcto.
- `pnpm run test` correcto.
- `pnpm run build` correcto.

## 2026-07-25 - Primeras pruebas automáticas del planeador del profesor

- Se incorpora Vitest con React Testing Library y un navegador simulado
  mediante JSDOM.
- Las pruebas de `PlanDeClases` simulan la API y no se conectan a ningún tenant,
  backend, base de datos ni almacenamiento R2.
- Se comprueba que un plan nuevo envíe `version_esperada = 0`.
- Se verifica que un conflicto `409` envíe la versión abierta y conserve el
  texto local cuando el profesor decide seguir editando.
- Se verifica que la pérdida de conexión muestre el aviso específico sin
  limpiar el formulario.
- Se comprueba que `Intentar de nuevo` repita el envío y permita completar el
  guardado después de recuperar la conexión.
- `pnpm run test` ejecuta la suite una vez y `check:deploy` incluye ahora
  pruebas, lint y build.
- Las nuevas librerías son dependencias exclusivas de desarrollo y no aumentan
  el JavaScript enviado a los usuarios.

Verificación:

- 1 archivo de pruebas y 4 casos correctos.
- `pnpm run lint` correcto.
- `pnpm run build` correcto.

## 2026-07-25 - Aviso de conexión al guardar una planeación

- Si el guardado no obtiene respuesta de red, el profesor recibe un modal
  específico en lugar del mensaje genérico de error.
- Cuando el navegador confirma que está desconectado, el aviso indica
  `Sin conexión a internet`; si el navegador figura conectado pero la API no
  responde, informa `No pudimos conectar con el servidor`.
- En ambos casos los textos, las imágenes seleccionadas y el estado de edición
  permanecen intactos.
- `Intentar de nuevo` repite el guardado con los mismos datos y `Seguir
  editando` cierra el aviso sin descartar el trabajo.
- Los errores con respuesta HTTP, incluido el conflicto de versión `409`,
  conservan su manejo independiente.
- No se modificaron el backend, la base de datos ni el contrato del endpoint.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-25 - Guardado de planeaciones protegido entre pestañas

- El profesor envía `version_esperada` al guardar: usa `0` cuando el plan aún
  no existe y la `version_revision` cargada cuando está editando uno.
- Si otra pestaña o dispositivo guardó primero, el backend responde `409` y la
  interfaz informa que los cambios locales no sobrescribieron la versión más
  reciente.
- El aviso permite cargar inmediatamente el plan actualizado o conservar en
  pantalla los cambios locales para revisarlos o copiarlos antes de recargar.
- La recarga solo reemplaza el formulario después de la confirmación explícita
  del profesor.
- El flujo normal, los campos opcionales, las imágenes y la conservación del
  estado de revisión permanecen sin cambios.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.
- 26 pruebas enfocadas del backend correctas.

## 2026-07-25 - Encabezado e información del curso en una sola tarjeta

- `Planilla de notas` y `Gestión de asistencia` fusionan el encabezado y la
  antigua tarjeta independiente `Información del curso`.
- La tarjeta única conserva el título compacto en la parte superior y presenta
  debajo materia, salón, período y fecha como datos destacados con acentos de
  color diferenciados.
- La fecha utiliza una lectura corta y natural en español, manteniendo el valor
  recibido desde el dashboard.
- En Planilla, `Tipo de calificación` se integra como quinto control dentro del
  mismo contexto académico, conservando su estado y funcionamiento.
- Ambas páginas reutilizan `components/EncabezadoContextoCurso.jsx` para
  mantener la misma distribución responsive y evitar divergencias visuales.
- No se modificaron consultas, estudiantes, notas, asistencia ni guardado.

Verificación:

- `pnpm exec eslint src/components/EncabezadoContextoCurso.jsx
  src/pages/Planilla.jsx src/pages/Asistencia.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Encabezados académicos unificados

- `Planilla de notas` y `Gestión de asistencia` adoptan el encabezado compacto
  utilizado en `Plan de clases`.
- Ambos usan tarjeta blanca, borde morado suave, acento vertical, título con
  jerarquía equilibrada, etiqueta pequeña del módulo y descripción breve.
- Se eliminan los emojis grandes de los títulos para conservar el lenguaje
  visual profesional usado en el taller docente.
- La altura y el margen inferior se reducen para aprovechar mejor el primer
  tramo de la página en móvil y escritorio.
- No se modificaron la información del curso, las tablas, la marcación, los
  filtros ni las acciones de guardado.

Verificación:

- `pnpm exec eslint src/pages/Planilla.jsx src/pages/Asistencia.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Apertura directa de recientes en presentación

- Las planeaciones recientes seleccionadas desde el dashboard ahora incluyen
  la intención de abrirse directamente en `Presentación de clase`.
- `Plan de clases` espera a que la planeación solicitada termine de cargar antes
  de mostrar la presentación, evitando una vista vacía o con información de la
  fecha anterior.
- `Volver a editar` conserva el comportamiento actual y permite continuar en
  el formulario de la misma materia y fecha.
- Las imágenes protegidas mantienen su indicador propio mientras terminan de
  mostrarse dentro de la presentación.
- No se agregaron consultas ni cambios de backend.

Verificación:

- `pnpm exec eslint src/pages/DashboardProfesor.jsx src/pages/PlanDeClases.jsx`
  correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Planeaciones recientes por materia en el dashboard

- Debajo del selector `Clase / grupo` se agrega un filtro dependiente de
  planeaciones recientes.
- El filtro solo aparece cuando existe una materia y curso seleccionados, y
  consulta exclusivamente las cinco planeaciones más recientes de esa
  asignación.
- Cada opción muestra el tema y la fecha de la planeación. Al elegirla, se abre
  directamente `Plan de clases` con la materia, el curso y la fecha
  correspondientes.
- La consulta se ejecuta de forma independiente después de seleccionar la
  clase, presenta su propio spinner y no bloquea los demás datos del dashboard.
- Los resultados se conservan temporalmente por asignación durante la sesión
  del dashboard para evitar consultas repetidas al alternar entre materias.
- No se modificaron el guardado de planeaciones ni los demás filtros del
  contexto de trabajo.

Verificación:

- `pnpm exec eslint src/pages/DashboardProfesor.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Presentación aislada del menú principal

- La presentación de clase ahora se monta directamente sobre la aplicación en
  una capa independiente, evitando que el nav quede cortado o visible detrás.
- Su barra superior cambia a una superficie blanca completamente opaca para
  eliminar la transparencia sobre el menú principal.
- Mientras la presentación está abierta se bloquean el desplazamiento y el
  rebote de la página de fondo tanto en escritorio como en móvil.
- No se modificaron el contenido, las imágenes ni el guardado del plan.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Presentación continua del plan de clase

- Se agrega el botón `Presentación de clase` al encabezado de la guía
  didáctica.
- La presentación se abre como una vista continua de lectura, no como
  diapositivas, y organiza tema, materia, curso, jornada, periodo, fecha y los
  bloques diligenciados de la planeación.
- La vista utiliza directamente el estado actual del formulario, por lo que
  permite revisar también cambios todavía no guardados sin perderlos al volver
  a editar.
- Los campos vacíos se omiten para mantener una lectura limpia y los textos
  conservan su longitud completa, saltos de línea y palabras extensas.
- Las dos evidencias actuales se presentan exclusivamente como imágenes. Se
  prioriza la imagen nueva seleccionada y, cuando no existe, se carga la imagen
  protegida ya guardada.
- Cada evidencia puede abrirse en tamaño completo. No se agregaron PDF, video,
  nuevos tipos de archivo ni cambios de almacenamiento o backend.
- La vista bloquea el desplazamiento de la página de edición mientras está
  abierta, se adapta a móvil y escritorio, y puede cerrarse con `Volver a
  editar` o la tecla Escape.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Una sola acción en las tarjetas del historial

- Las tarjetas de planes guardados conservan únicamente el botón principal
  `Abrir plan`.
- Se retiran el botón `Usar como base` y la lógica local asociada para evitar
  dos acciones visualmente similares.
- El botón restante ocupa todo el ancho de la tarjeta; cuando corresponde a la
  fecha activa continúa deshabilitado con el texto `En edición`.
- No se modificaron la apertura, la paginación ni el guardado de planeaciones.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Selección visible desde el historial de planes

- La tarjeta correspondiente a la fecha cargada cambia la etiqueta
  `Plan abierto` por `Plan en edición`, indicando que es el contenido activo
  para trabajar.
- Su botón deshabilitado cambia de `Abierto` a `En edición`.
- Al abrir otra planeación desde el historial, la vista vuelve suavemente al
  inicio para mostrar la clase seleccionada y el proceso de carga.
- El desplazamiento respeta la preferencia del sistema para reducir movimiento.
- No se modificaron la consulta, la edición ni el guardado del plan.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Estado duplicado retirado de Guardar plan

- Se elimina la cápsula de estado ubicada junto al botón de la tarjeta
  `Guardar plan`.
- El estado de guardado continúa disponible en el encabezado principal, sin
  repetir la misma información al final de la guía.
- El botón ocupa el espacio de acción con mayor claridad y conserva su icono,
  spinner, bloqueo y texto dinámico.
- No se modificaron el mensaje contextual ni el funcionamiento del guardado.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Tarjeta principal de guardado más visible

- `Guardar plan` se rediseña como el último paso destacado de la guía mediante
  una superficie violeta suave, contorno, sombra y acento superior.
- Un icono de guardado y la etiqueta `Último paso` refuerzan la ubicación y la
  función de la tarjeta sin aumentar excesivamente su altura.
- La tarjeta incorpora el estado actual del plan con su color semántico,
  descripción y punto indicador.
- El botón principal utiliza mayor contraste, icono de guardado y spinner
  durante el envío; conserva su bloqueo mientras existe otra carga.
- El mensaje contextual se presenta dentro de una franja inferior separada.
- En móvil, estado y acción se apilan y el botón ocupa todo el ancho.
- Se mantienen la ubicación, las reglas de campos opcionales y el flujo de
  guardado existente.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Historial de planeaciones paginado de tres en tres

- El historial permanece al final de la pantalla y conserva las acciones para
  abrir un plan o usarlo como base.
- Cada vista muestra un máximo de tres tarjetas modernas con fecha, periodo,
  tema, unidad, estado de revisión y comentarios nuevos.
- El plan correspondiente a la fecha abierta se identifica en verde y su
  acción de apertura permanece deshabilitada para evitar cargas innecesarias.
- Los controles `Más recientes` y `Cargar 3 más antiguas` reemplazan las
  tarjetas visibles en lugar de acumular resultados.
- La consulta solicita cuatro registros paginados: presenta tres y usa el
  cuarto solamente para conocer si existe otra página.
- Cambiar la fecha ya no vuelve a consultar el historial completo; este se
  actualiza al cambiar la clase asignada, guardar o eliminar una evidencia.
- El historial incluye esqueletos durante la carga, mensaje de error y acción
  de reintento.
- No se modificaron el guardado ni el uso de planes anteriores como base.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.
- Backend: 20 pruebas enfocadas de integridad y revisión correctas.

## 2026-07-24 - Confirmación de guardado visible al inicio

- Después de guardar correctamente un plan, la pantalla del profesor vuelve
  suavemente al encabezado para mostrar el estado actualizado.
- La cápsula `Guardado` realiza una animación breve de balanceo tipo campana una
  sola vez por cada guardado exitoso.
- La animación se ejecuta cuando finaliza la actualización silenciosa de los
  datos, evitando destacar el estado intermedio de verificación.
- La ventana emergente de éxito se reemplaza por esta confirmación integrada y
  no bloqueante; las alertas de error se conservan.
- El desplazamiento y la animación respetan la preferencia del sistema para
  reducir movimiento.
- No se modificaron el contenido enviado ni las solicitudes al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Identificación completa de la clase en la guía

- La cápsula del encabezado de `Guía didáctica` cambia de morado a tonos
  verdes para diferenciarla del resto de los títulos.
- La identificación reúne materia, curso y jornada en una sola cápsula
  adaptable.
- Cuando la asignación no contiene jornada se muestra `Sin jornada` en lugar de
  dejar el dato vacío.
- Se elimina la barra secundaria `Clase seleccionada` para evitar información
  duplicada y recuperar espacio vertical.
- No se modificaron la selección ni el guardado de la planeación.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Materia y curso visibles en la guía didáctica

- El encabezado de `Guía didáctica` incorpora una cápsula compacta con la
  materia y el curso de la clase seleccionada.
- La cápsula se actualiza al cambiar la clase asignada y permanece oculta
  mientras no exista una selección.
- En pantallas pequeñas se acomoda debajo del título y recorta únicamente los
  nombres de materia demasiado extensos.
- No se modificaron el guardado ni las reglas de los campos de la planeación.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Transparencia suave restaurada en la guía

- Los bloques internos recuperan las transparencias usadas antes del último
  ajuste de opacidad.
- Contexto pedagógico y las zonas de evidencia vuelven a blanco al 90 %.
- Desarrollo de la clase recupera su degradado azul y morado translúcido.
- Evidencias y continuidad vuelve a usar gris claro al 60 %.
- El fondo de útiles escolares vuelve a insinuarse detrás de las tarjetas sin
  cambiar su tamaño ni posición.
- No se modificaron contenido, distribución ni funcionamiento.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Fondos sólidos en los bloques de la guía

- El encabezado y los bloques de contexto pedagógico, desarrollo de la clase y
  evidencias cambian de superficies translúcidas a fondos sólidos.
- Se conservan los tonos blanco, azul, morado y ámbar establecidos en el
  rediseño.
- Las zonas de carga de evidencias también usan fondo blanco opaco.
- La ilustración de útiles permanece visible en los márgenes y separaciones,
  pero deja de mezclarse detrás de campos y contenidos.
- No se modificaron colores principales, tamaños, distribución ni
  funcionamiento.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Mayor presencia cromática del seguimiento

- La barra compacta de seguimiento cambia su fondo blanco por un lavanda muy
  claro para distinguirse al aparecer.
- El contorno usa violeta suave y agrega un acento morado en el borde izquierdo.
- El icono adopta fondo violeta claro y el resultado de la revisión utiliza
  morado oscuro para mejorar su contraste.
- La versión y la fecha relevante usan tonos violetas secundarios.
- Las cápsulas conservan los colores semánticos: ámbar para pendiente, verde
  para revisado y rojo suave cuando existen comentarios nuevos.
- No se modificaron dimensiones, textos, distribución ni comportamiento.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Seguimiento administrativo compacto

- La tarjeta de seguimiento del profesor se convierte en una barra compacta y
  neutral que ocupa menos altura.
- Se retiraron el círculo difuminado, el icono grande y la tipografía de alto
  contraste que competían con la guía didáctica.
- Estado, versión, resultado de la revisión y fecha relevante se presentan en
  pocas líneas con jerarquía secundaria.
- La barra muestra la fecha de revisión cuando existe; en caso contrario,
  conserva la fecha de envío.
- El acceso a comentarios utiliza rojo suave únicamente cuando hay novedades y
  un borde morado discreto para el historial ya conocido.
- Al expandirse, el historial conserva su funcionamiento con un encabezado y
  espaciado más ligeros.
- No se modificaron estados, lectura de comentarios ni solicitudes al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Fondo escolar para toda la guía didáctica

- La ilustración exclusiva de `Contexto pedagógico` se retiró y ese bloque
  vuelve a usar una superficie blanca y neutral.
- Toda la sección `Guía didáctica` incorpora un nuevo fondo original inspirado
  en la referencia compartida por el usuario.
- Cuadernos, lápices, colores, reglas, borradores, notas y mochilas se
  distribuyen con tamaño intermedio a ambos lados, dejando el centro libre.
- El fondo se adapta a cualquier altura repitiéndose verticalmente sin deformar
  los útiles y mantiene una capa clara para proteger la legibilidad.
- El nuevo recurso se optimizó a aproximadamente 87 KB; el fondo panorámico
  anterior fue retirado del proyecto.
- Se conservan la disposición responsive, los campos opcionales, la longitud
  indefinida y la recuperación de valores existentes.
- No se modificaron el guardado ni las solicitudes al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto; Vite incluyó el nuevo fondo con un peso de
  87.37 KB.

## 2026-07-24 - Guía didáctica por bloques: evidencias y continuidad

- Tercera etapa del rediseño de la guía didáctica del profesor.
- Desarrollo cognitivo y actividad en casa se agrupan dentro de un bloque común
  de `Evidencias y continuidad`.
- Cada contenido conserva una tarjeta diferenciada: morada para desarrollo
  cognitivo y ámbar para la continuidad en casa.
- Las descripciones aumentan de cuatro a cinco líneas visibles sin limitar la
  cantidad de caracteres.
- Los selectores de archivo se presentan como zonas punteadas con botones y
  colores relacionados con cada tarjeta.
- Las etiquetas de las evidencias quedaron vinculadas con sus controles para
  mejorar la accesibilidad.
- Textos e imágenes continúan siendo opcionales y se conservan las evidencias
  cargadas previamente.
- No se modificaron formatos permitidos, límite de 5 MB, guardado ni solicitudes
  al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Guía didáctica por bloques: desarrollo de la clase

- Segunda etapa del rediseño de la guía didáctica del profesor.
- `Clase` y `Actividad en clase` se agrupan en un bloque propio con una
  superficie clara, acento azul y una descripción breve de su propósito.
- Ambos campos aumentan de cuatro a seis líneas visibles para ofrecer un área de
  escritura más cómoda.
- El número de líneas solo modifica la altura inicial: los campos continúan sin
  límite de caracteres y pueden ampliarse.
- No se agregaron encabezados numerados ni contadores.
- Los campos siguen siendo opcionales y conservan los datos cargados de la
  planeación existente.
- No se modificaron el guardado ni las solicitudes al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Fondo educativo en contexto pedagógico

- El bloque `Contexto pedagógico` incorpora una ilustración panorámica original
  con libro, lápiz, elementos geométricos, bombillo, cuaderno y globo.
- Los elementos se concentran en los extremos y el centro permanece despejado
  para proteger la legibilidad de los campos.
- La imagen se presenta como fondo decorativo con baja intensidad, una capa
  clara de contraste y sin interacción con el formulario.
- El recurso se carga de forma diferida, se optimizó de aproximadamente 1.2 MB
  a 80 KB y no contiene personas, texto ni marcas.
- Se conserva el comportamiento responsive, la longitud indefinida, los campos
  opcionales y la recuperación de valores existentes.
- No se modificaron el guardado ni las solicitudes al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto; Vite incluyó el fondo optimizado con un peso de
  79.72 KB.

## 2026-07-24 - Guía didáctica por bloques: contexto pedagógico

- Primera etapa del rediseño de la guía didáctica del profesor.
- Unidad, tema, logro y estándar se agrupan en un bloque de `Contexto
  pedagógico` con una superficie neutra y un acento morado.
- Los campos se distribuyen en dos columnas en escritorio y una columna en
  pantallas pequeñas.
- Unidad y tema usan una altura inicial compacta; logro y estándar disponen de
  mayor espacio inicial. Ninguno tiene límite de caracteres.
- No se agregaron encabezados numerados ni contadores de diligenciamiento.
- Todos los campos continúan siendo opcionales y el plan puede guardarse aunque
  alguno permanezca vacío.
- Se conserva sin cambios la carga del plan existente y los campos recordados
  de la última actualización.
- No se modificaron solicitudes ni validaciones del backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.
- Se confirmó que el guardado solo exige clase, periodo y fecha; los campos de
  la guía permanecen opcionales.

## 2026-07-24 - Iconos del dashboard en los controles del planeador

- Las etiquetas de clase asignada, periodo y fecha incorporan los mismos iconos
  lineales de libro y calendario usados en el dashboard del profesor.
- Cada icono se presenta sobre un fondo morado, verde o azul suave acorde con
  el lenguaje visual del dashboard.
- Los iconos son decorativos para lectores de pantalla y las etiquetas quedaron
  vinculadas explícitamente con sus respectivos controles.
- No se modificaron las opciones ni el comportamiento de los campos.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Barra compacta para configurar la clase

- La selección de clase, periodo y fecha se organiza en una barra de
  configuración con proporciones `50 / 20 / 30`.
- `Clase asignada` conserva la mayor jerarquía visual, mientras periodo y fecha
  mantienen el mismo alto y una alineación uniforme.
- Durante la consulta inicial, el selector indica `Cargando clases...` y evita
  cambios hasta que las asignaciones estén disponibles.
- La clase seleccionada se resume en una franja ligera con cápsulas para
  materia, curso y jornada cuando esta última está disponible.
- Se retiró de esta sección el estado de guardado duplicado, porque ya aparece
  en el encabezado principal.
- En pantallas pequeñas los campos y el resumen se reorganizan sin
  desbordamientos.
- No se modificaron la selección, el periodo recordado ni la carga del plan.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Encabezado compacto en el planeador del profesor

- El encabezado de `Plan de clases` reduce su altura y aprovecha el ancho
  disponible con una composición horizontal.
- El título, el contexto de taller docente y la descripción se agrupan en un
  bloque visual más ligero.
- El estado de guardado se presenta como una cápsula alargada que reúne el
  indicador, el estado, su detalle y el número del plan cuando existe.
- La cápsula mantiene los colores de verificación, cambios pendientes y
  guardado, además de anunciar sus actualizaciones a lectores de pantalla.
- En pantallas pequeñas el estado se ubica debajo del título y limita el texto
  largo para evitar desbordamientos.
- No se modificaron la lógica de guardado ni las solicitudes al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Carga visible en la guía didáctica

- Al entrar a Plan de clases del profesor, el cuadro `Guía didáctica` muestra
  un spinner mientras carga las clases asignadas y consulta el plan de la fecha.
- Los campos permanecen ocultos durante la consulta para evitar que el profesor
  escriba sobre información que todavía será reemplazada.
- El mensaje explica que se están cargando la clase y la planeación
  seleccionada.
- El indicador está contenido dentro de la guía, no bloquea el resto de la
  pantalla y cuenta con semántica accesible de estado.
- No se modificaron campos, guardado, imágenes ni solicitudes al backend.

Verificación:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Acceso directo desde notificaciones por profesor

- La campana administrativa conserva una tarjeta por profesor y muestra la
  cantidad total de planeaciones pendientes que envió.
- Al pulsar la tarjeta ya no se despliega una lista secundaria de clases.
- La tarjeta abre inmediatamente la bandeja de planeaciones con `Todas`,
  `Pendiente` y el profesor correspondiente seleccionados.
- El filtro utiliza `profesor_id` para evitar coincidencias incorrectas entre
  docentes con nombres parecidos.
- Las notificaciones del profesor continúan abriendo directamente el plan y sus
  comentarios.

Verificación:

- `pnpm exec eslint src/components/NotificacionesPlaneadores.jsx
  src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Confirmación animada de revisión

- Después de aprobar una planeación o solicitar un ajuste, el aviso de éxito
  entra con un desplazamiento y realce breve cuando la vista vuelve al inicio.
- El mensaje incluye un icono de confirmación y la etiqueta `Actualización
  nueva` para diferenciarlo claramente del contenido anterior.
- La animación ocurre una sola vez, no bloquea acciones y se desactiva cuando el
  sistema solicita reducir movimiento.
- Los avisos de error y advertencia conservan su comportamiento directo y sin
  animación decorativa.
- No se modificaron decisiones administrativas, estados ni solicitudes al
  backend.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-24 - Carga visible al volver a planeaciones

- Al regresar desde el detalle de una clase, la tarjeta del historial conserva
  visibles el encabezado, los filtros y la búsqueda mientras actualiza los
  resultados.
- El área de filas muestra un spinner violeta centrado en lugar del anterior
  bloque de carga poco evidente.
- El mensaje diferencia `Actualizando planeaciones pendientes` de
  `Actualizando planeaciones revisadas` según el filtro seleccionado.
- El indicador usa semántica de estado y anuncia la actualización sin bloquear
  el resto de la página.
- No se modificaron consultas, filtros, paginación ni estados administrativos.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Estados de revisión simplificados

- La bandeja administrativa muestra únicamente los filtros `Pendiente` y
  `Revisado`; se elimina `Con observaciones` como opción independiente.
- Los registros internos `visto` se presentan como pendientes y
  `con_observaciones` como revisados, sin alterar el historial existente.
- Solo `Pendiente` conserva el contador rojo. `Revisado` permanece sin
  contador.
- En el perfil del profesor, una planeación terminada muestra `Revisado con
  observación` cuando tiene comentarios administrativos y `Revisado` cuando no
  los tiene.
- Las tarjetas del historial del profesor aplican el mismo criterio según su
  contador real de comentarios.
- Cuando el profesor guarda una corrección solicitada, aumenta la revisión pero
  no vuelve a pendiente ni genera otra notificación para administración.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx
  src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Hoy y próximas como vista inicial

- Al entrar a Planeadores de clases sin parámetros previos, `Hoy y próximas`
  queda seleccionado automáticamente.
- La vista incluye las clases con fecha de hoy y las programadas para fechas
  futuras.
- El estado de revisión continúa sin selección, por lo que las filas no se
  cargan hasta que el administrador elige un estado.
- Al regresar desde un detalle o entrar mediante una URL con filtros, se
  respeta la vista indicada en la dirección.
- No se modificaron rangos de fecha, estados ni endpoints.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Jerarquía intercambiada en cabecera del planeador

- El estado administrativo y `Revisión N` se ubican debajo del tema de la
  planeación para asociar la decisión directamente con la clase.
- El nombre del docente y sus iniciales pasan al espacio derecho de la cabecera
  que antes ocupaban las cápsulas.
- En escritorio el bloque docente baja ligeramente y suma separación interna a
  la derecha para evitar que el nombre quede pegado al borde.
- En móvil ambos grupos conservan el mismo orden de lectura sin superponerse ni
  truncar nombres largos.
- No se modificaron datos, estados ni acciones administrativas.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Resumen moderno del detalle del planeador

- El encabezado del detalle se reorganiza en una sola tarjeta que aprovecha
  todo el ancho disponible y elimina datos repetidos.
- Cuando no existe tema, el título se construye con materia y curso y se muestra
  `Sin tema registrado` como aviso secundario, en lugar de destacar `Plan sin
  tema`.
- El nombre del docente se presenta con iniciales y capitalización visual más
  suave cuando el backend lo entrega completamente en mayúsculas.
- Estado y `Revisión N` se agrupan en la cabecera; se elimina el duplicado
  `Versión revisada`.
- Materia, curso, periodo, fecha, evidencias y `Comentarios de admin` comparten
  una cuadrícula responsive de seis datos que utiliza todo el espacio.
- No se modificaron los datos, estados ni contratos del backend.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Retorno al inicio después de revisar una clase

- Al aprobar una planeación o solicitar un ajuste correctamente, el detalle
  vuelve automáticamente al inicio.
- El desplazamiento permite ver de inmediato el estado actualizado y el mensaje
  de confirmación sin tener que subir manualmente.
- Se utiliza movimiento suave y se respeta la preferencia del sistema para
  reducir animaciones.
- Los errores no cambian la posición de lectura, para que el administrador
  pueda corregir el comentario o reintentar desde el mismo punto.
- No se modificaron las decisiones administrativas ni sus solicitudes al
  backend.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Nombres directos en el detalle del planeador

- Los bloques del detalle muestran únicamente el nombre real del campo:
  `Unidad`, `Logro`, `Estándar`, `Desarrollo cognitivo`, `Clase`, `Actividad en
  clase` y `Actividad en casa`.
- Se retiran las etiquetas auxiliares `Eje de trabajo`, `Intención`,
  `Referente`, `Proceso`, `Ruta de clase`, `Durante la jornada` y `Continuidad`.
- Los nombres que antes se presentaban en negro adoptan el violeta como color
  común para mantener una jerarquía directa y consistente.
- Se retiran también los encabezados `Fundamentos` y `Base pedagógica del plan`
  para que el detalle comience directamente con los campos diligenciados.
- El contenido diligenciado por el profesor, la estructura y las acciones del
  detalle permanecen sin cambios.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Estados compactos junto al filtro de profesor

- El selector de profesor permanece a la izquierda y los estados se muestran a
  su lado dentro de la misma barra de filtros en escritorio.
- `Pendiente`, `Con observaciones` y `Revisado` recuperan su tamaño compacto y
  forma de cápsula original, sin estirarse para ocupar columnas completas.
- Las cápsulas flotan con separación uniforme y pueden reorganizarse en móvil
  sin perder su tamaño.
- Las burbujas de conteo conservan exactamente su apariencia y comportamiento.
- No se modificaron la carga, los valores seleccionados ni la lógica de
  filtrado.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Barra unificada de filtros de planeaciones

- Se retira la numeración de profesor y estado para evitar que los filtros se
  perciban como pasos obligatorios.
- El selector de profesor y el control de estados comparten etiquetas, altura,
  bordes y proporciones consistentes dentro de una barra responsive.
- Los estados se distribuyen en tres segmentos del mismo ancho; la opción
  activa utiliza violeta sólido para facilitar su reconocimiento.
- Las burbujas de conteo mantienen exactamente sus colores, tamaño, posición y
  formato anteriores.
- No se modificaron la carga, los valores seleccionados ni la lógica de
  filtrado.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Profesor y estado alineados en planeaciones

- `Elegir profesor` y `Estado de revisión` comparten una misma fila en
  escritorio para aprovechar mejor el ancho y formar un bloque visual uniforme.
- Los estados se presentan dentro de un control con el mismo alto y tratamiento
  de borde que el selector de profesor.
- En pantallas pequeñas ambos filtros permanecen apilados para conservar espacio
  táctil, legibilidad y los contadores de notificación.
- No se modificaron la carga, los valores seleccionados ni la lógica de
  filtrado.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Búsqueda automática en historial de planeaciones

- La búsqueda por materia o clase se aplica automáticamente después de una
  pausa de 120 milisegundos al escribir, sin necesidad de pulsar un botón.
- El filtro comienza desde dos caracteres, por lo que términos parciales como
  `mate` encuentran inmediatamente materias como Matemáticas.
- El campo incluye ejemplos breves y una ayuda contextual; al dejar solo un
  carácter indica el mínimo necesario para buscar.
- Al borrar el texto se retiran inmediatamente los términos aplicados y se
  restaura el historial completo con sus contadores, conservando el profesor,
  la vista por fecha y el estado elegidos.
- Si una búsqueda no devuelve coincidencias, la acción `Quitar búsqueda`
  recupera el historial sin reiniciar los demás filtros.
- No se modificaron endpoints ni parámetros del backend.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Jerarquía de filtros en planeaciones administrativas

- La tarjeta de filtros muestra primero `Elegir profesor` y después `Estado de
  revisión`, siguiendo el orden natural de la consulta administrativa.
- Cambiar de profesor aplica el filtro inmediatamente y actualiza los
  contadores correspondientes.
- La búsqueda se mueve dentro del historial con la etiqueta `Buscar materia o
  clase`, separada de los filtros de contexto.
- `Limpiar` dentro del historial borra únicamente la búsqueda; no modifica el
  profesor, la vista temporal ni el estado seleccionados.
- La organización se conserva en escritorio y móvil sin cambiar endpoints ni
  parámetros.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Notificaciones administrativas agrupadas por profesor

- La campana del admin reemplaza las entradas repetidas por una sola tarjeta
  para cada profesor.
- Cada tarjeta informa cuántas planeaciones pendientes envió el docente y
  permite desplegar el detalle de todos sus envíos recientes.
- Cada planeación del grupo conserva acceso directo a su detalle y la acción
  general abre la bandeja en `Todas`, `Pendiente` y con búsqueda por profesor.
- El frontend solicita hasta veinte notificaciones administrativas recientes;
  si existen más, informa el total y dirige a la bandeja para consultar el
  resto.
- Las notificaciones del profesor conservan su comportamiento individual para
  comentarios administrativos.
- No se modificó el contrato del backend.

Verificación:

- `pnpm exec eslint src/components/NotificacionesPlaneadores.jsx
  src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Carga de planeaciones bajo selección explícita

- La bandeja administrativa inicia con `Hoy y próximas` como vista temporal y
  sin un estado preseleccionado.
- Las clases no se consultan ni se muestran hasta elegir una opción de `Vista
  por fecha` y un `Estado de revisión`; la vista inicial ya completa el primer
  requisito.
- Un estado inicial guiado indica los dos pasos pendientes y confirma
  visualmente cada selección.
- Los contadores pueden consultarse después de elegir la vista por fecha, pero
  las filas permanecen vacías hasta completar ambas selecciones.
- Al volver desde el detalle se conservan la fecha, el estado, los filtros y la
  página mediante la URL.
- No se modificaron endpoints ni la lógica de paginación.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Planeación pendiente hasta decisión administrativa

- Abrir el detalle de una planeación ya no cambia automáticamente su estado a
  `visto`.
- La planeación conserva `Pendiente` y su contador administrativo hasta que el
  admin aprueba o solicita un ajuste.
- El perfil profesor deja de mostrar `Visto por administración` y la fecha de
  apertura; solo comunica `Pendiente de revisión`, `Con observaciones` o
  `Revisado`.
- Las notificaciones administrativas permanecen activas hasta completar una
  decisión, reforzando que abrir el documento no equivale a revisarlo.
- No se modificaron endpoints, migraciones ni el historial de comentarios.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx
  src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Contadores de seguimiento en estados de planeación

- Las cápsulas `Pendiente` y `Con observaciones` muestran una notificación con
  la cantidad de planeaciones de cada estado.
- El contador de pendientes usa una burbuja roja y el de observaciones una
  burbuja ámbar; `Revisado` no muestra contador.
- Las cantidades respetan la vista `Anteriores`, `Hoy y próximas` o `Todas`,
  además del profesor y la búsqueda aplicados.
- Al volver del detalle administrativo, los contadores se consultan nuevamente
  para reflejar las planeaciones que todavía requieren atención.
- Se reutiliza el contrato paginado existente de
  `GET /admin/plan-de-clases`; no cambia el backend.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Selector temporal con contraste esmeralda

- El bloque `Vista por fecha` adopta un fondo suave esmeralda y turquesa para
  diferenciarse de la cabecera morada de seguimiento académico.
- El icono de calendario y la opción activa usan verde esmeralda sólido con
  texto blanco; las opciones inactivas conservan contraste legible y estados
  visibles de interacción y foco.
- No se modificaron las vistas, los filtros ni la lógica de paginación.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-23 - Filas más legibles en el historial de planeaciones

- La vista `Todas las planeaciones` reduce el peso visual del tema para que el
  nombre de la clase no domine la fila.
- La materia recibe un tratamiento visual propio, sin una etiqueta redundante,
  y el curso queda separado como dato contextual.
- `Versión N` cambia a `Revisión N`, con una presentación tipo píldora que
  comunica mejor cuántas revisiones ha tenido la planeación.
- La vista móvil incorpora la misma información y jerarquía visual que la
  tabla de escritorio.
- No se modificaron endpoints, filtros, estados ni la lógica de versionado.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-22 - Aprobar planeación con reconocimiento opcional

- El detalle administrativo reemplaza las dos tarjetas de decisión por una
  sola experiencia de revisión con `Comentario para el profesor`.
- `Solicitar ajuste` exige texto y conserva el estado `Con observaciones`.
- `Aprobar planeación` permite un comentario opcional; si existe, guarda el
  reconocimiento, marca la misma versión como `Revisada` y notifica al
  profesor en una sola acción.
- Una planeación que ya estaba revisada permite escribir y enviar un nuevo
  reconocimiento sin cambiar su estado.
- Los dos botones muestran progreso independiente y bloquean envíos duplicados.
- El historial y la campana del profesor usan el término neutral `Comentarios
  de administración`, ya que pueden contener reconocimientos o indicaciones.

Verificación:

- ESLint correcto en el detalle administrativo, plan del profesor y campana.
- `pnpm run build` correcto.

## 2026-07-22 - Selector temporal integrado en la bandeja administrativa

- El selector por fecha se mueve a la cabecera de `Seguimiento académico`, en
  el espacio que ocupaban los contadores `Resultados`, `En esta página` y
  `Con evidencia`; esos tres resúmenes se retiran.
- Las opciones se presentan como `Anteriores`, `Hoy y próximas` y `Todas`, con
  una explicación contextual que aclara qué contiene cada vista.
- `Anteriores` termina ayer. Las planeaciones con fecha de hoy ahora pertenecen
  a `Hoy y próximas`, junto con las clases futuras pendientes de impartir.
- Se retiran los campos manuales `Desde` y `Hasta`; la fecha depende
  exclusivamente de `Anteriores`, `Hoy y próximas` o `Todas`.
- Los filtros de búsqueda quedan reducidos a profesor y texto por materia o
  tema, además del estado de revisión.
- El filtro visible de revisión se simplifica a `Pendiente`, `Con
  observaciones` y `Revisado`; se retiran `Todos los estados` y `Visto por
  administración`.
- Pulsar nuevamente el estado activo lo desactiva. El estado interno `visto`
  se conserva para la trazabilidad del profesor.

Verificación:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-22 - Notificaciones de planeadores con acceso directo

- `NavAdmin` y `NavProfesor` incorporan una campana compartida, siempre
  visible tanto en escritorio como en movil, con contador de pendientes.
- Administracion recibe cada nueva version enviada y abre directamente el
  detalle `/admin/planeadores-clases/:planId`; la primera apertura la marca
  como vista y actualiza el contador.
- El profesor recibe las observaciones nuevas y entra al plan, fecha y clase
  exactos mediante parametros de URL. El historial se abre automaticamente y
  solo entonces se confirma la lectura.
- El panel se actualiza al iniciar, cada 60 segundos, al recuperar foco y
  despues de acciones locales que cambian el estado de lectura.
- El desplegable maneja carga, reintento, estado vacio, cierre al navegar,
  clic externo y tecla Escape.

Verificacion:

- `pnpm run lint` correcto.
- `pnpm run build` correcto.

## 2026-07-22 - Seguimiento administrativo para el profesor

- `PlanDeClases` separa el estado local del formulario del estado de revision
  administrativa.
- Los planes guardados muestran si estan pendientes, vistos, observados o
  revisados, con version y fechas de seguimiento.
- Las observaciones nuevas se resaltan y se marcan como leidas solamente
  cuando el profesor abre su historial.
- El historial identifica la version observada y conserva indicaciones de
  versiones anteriores.
- Los planes recientes incluyen estado y contador de observaciones pendientes.
- Guardar cambios o eliminar una evidencia vuelve a sincronizar la version y
  el estado desde el backend.
- La capa posterior agrega los contadores al navbar sin cambiar este contrato
  de lectura explicita.

Verificacion:

- `pnpm exec eslint src/pages/PlanDeClases.jsx` correcto.
- `pnpm run build` correcto.

## 2026-07-22 - Bandeja administrativa de planeaciones a ancho completo

- Se retiro la columna lateral de envios y el scroll vertical interno.
- La bandeja ocupa todo el ancho y separa `Realizadas`, `Programadas` y `Todas`.
- Se agregaron filtros por estado de revision y paginacion de 12 registros.
- Cada plan abre en `/admin/planeadores-clases/:planId`, conservando filtros y
  pagina en la URL al regresar.
- Abrir el detalle registra el estado `visto`; el admin puede marcar la version
  como revisada, escribir observaciones y consultar su historial versionado.
- Los conflictos `409` recargan el plan para impedir acciones administrativas
  sobre una version antigua.
- La ruta es el destino directo de las notificaciones administrativas.
- No se modifico todavia el navbar ni la pantalla del profesor.

Verificacion:

- `pnpm exec eslint src/pages/PlaneadoresClasesAdmin.jsx src/App.jsx` correcto.
- `pnpm run build` correcto.

Registro de documentacion del frontend.

## 2026-07-22 - Renovacion visual del login de Auligo

- Se reemplaza la identidad anterior del acceso por el logotipo e isotipo de
  `Auligo` y se incorpora el eslogan oficial `Tu aula, tu camino, tu futuro.`.
- El login adopta una composicion inmersiva y adaptable con la fotografia
  institucional original como fondo. El tratamiento profesional se realiza
  mediante filtros de color, iluminacion, desenfoque sutil y capas CSS para
  conservar sin modificaciones a todas las personas de la imagen.
- El formulario usa una tarjeta clara de alto contraste, campos con iconos,
  validacion visible de datos requeridos y control para mostrar u ocultar la
  contrasena.
- La tarjeta se refina con cristal translucido y desenfoque del fondo, sin
  modificar el resto de la composicion del login. El encabezado pequeño se
  reemplaza por el logotipo completo de Auligo con fondo transparente.
- Los tres campos incorporan iconos contenidos, profundidad suave, foco morado
  y una correccion especifica para evitar el fondo azul del autocompletado del
  navegador. El boton de entrada usa degradado, relieve y un indicador de
  avance, conservando sus estados de carga y exito.
- Se compacta la altura de la tarjeta reduciendo su espacio interior, el logo y
  las separaciones superiores. El titulo cambia a `Qué bueno tenerte aquí`, con
  peso moderado y un acento morado en la ultima palabra para ofrecer una
  bienvenida mas calida sin repetir el nombre visible en el logotipo.
- Se conservan el indicador de carga, el bloqueo de envios duplicados, el aviso
  de conexion lenta, las alertas de autenticacion y las redirecciones existentes
  por rol.
- En pantallas pequenas se prioriza el formulario; en escritorio se muestra el
  bloque completo de marca y mensaje institucional.

Verificacion:

- `pnpm exec eslint src/pages/Login.jsx src/components/LoginForm.jsx`.
- `pnpm run build`.

## 2026-07-22 - Profundidad visual para el logo del navbar

- El logotipo de Auligo incorpora una sombra visible desde el estado normal
  sobre su propia silueta y un brillo blanco moderado, conservando el fondo
  transparente.
- Al pasar el cursor se eleva un pixel y aumenta ligeramente la profundidad.
- El tratamiento se comparte en los navbars de administrador, profesor y
  superadministrador.

Verificacion:

- `pnpm exec eslint src/components/NavAdmin.jsx src/components/NavProfesor.jsx
  src/components/NavSuperAdmin.jsx`.
- `pnpm run build`.

## 2026-07-20 - Marca Auligo en los navbars

- Los encabezados de administrador, profesor y superadministrador reemplazan el
  texto `Scholarix` por el logotipo transparente de `Auligo`.
- Se preparo una version recortada del logo para evitar margenes transparentes
  excesivos y conservar una altura compacta dentro del navbar.
- El verde del logotipo del navbar aumenta moderadamente su brillo y saturacion
  para mejorar el contraste sobre el fondo morado.
- El logotipo mantiene el enlace al inicio correspondiente de cada perfil.
- El favicon usa una version minimalista del isotipo: una `A` morada centrada
  sobre una tarjeta blanca de esquinas ampliamente redondeadas, sin birrete,
  borla, boton ni contorno de color. El exterior de la tarjeta permanece
  transparente.
- Se incluyen versiones PNG de `16x16`, `32x32`, `512x512`, un icono Apple de
  `180x180` y un `favicon.ico` compatible con navegadores tradicionales.
- El titulo de la pestaña y las demas apariciones del nombre anterior no cambian
  en esta etapa.

Verificacion:

- `pnpm exec eslint src/components/NavAdmin.jsx src/components/NavProfesor.jsx
  src/components/NavSuperAdmin.jsx`.
- `pnpm run build`.

## 2026-07-18 - Encabezado diferenciado en tabla de planilla

- La planilla agrega una columna compacta `N.º` antes de `Estudiante`, calculada
  con el orden actual de la lista y fija durante el desplazamiento horizontal.
- El encabezado de numeracion usa nuevamente un simbolo numeral vectorial, ahora
  mas grande, grueso y con extremos redondeados, sin capsula ni recuadro.
- Toda la columna de numeracion, incluida su celda superior, usa un fondo
  `purple-200` plano y sin degradado.
- La linea morada se ubica en el borde derecho de la numeracion y continua por
  todas las filas. La celda `Estudiante` queda blanca y sin degradado lateral.
- En movil, el numero aparece como una insignia discreta junto al nombre del
  estudiante.
- El titulo `Información Del Curso` usa mayuscula inicial en cada palabra para
  mantener el formato solicitado en los encabezados de la vista.
- El encabezado de la tabla de escritorio usa una franja visual en tonos morado,
  indigo y verde para separarse claramente de las filas.
- La primera columna cambia de `Nombre` a `Estudiante` y usa fondo blanco,
  texto morado oscuro e icono lineal.
- Los tipos de evaluacion se presentan como encabezados planos y modernos, con
  fondo blanco e icono lineal de evaluacion.
- El icono de `Estudiante` queda centrado dentro de un contenedor propio y el
  texto aumenta de tamano para mejorar alineacion y lectura; el contenedor usa
  borde morado visible para conservar la misma definicion de los demas iconos.
- Los nombres de notas reemplazan el punto decorativo por un icono SVG para
  mantener consistencia con `Estudiante` y `Promedio`.
- Los iconos y nombres de los tipos de nota igualan altura, tamano y centrado
  vertical de `Promedio`.
- La division inferior del encabezado queda como una linea gris continua y los
  extremos mantienen separadores grises; se retiran los bordes fuertes morado,
  violeta y verde de las celdas.
- Cada encabezado, incluidos `Estudiante` y `Promedio`, inicia con una linea
  vertical violeta mas visible y un degradado que parte de ella y se desvanece
  unicamente hacia la derecha, sin recuperar fondos intensos.
- En `Promedio`, la linea y el degradado usan verde esmeralda para coincidir con
  el color de su icono.
- La linea esmeralda de `Promedio` continua por el borde izquierdo de todas sus
  celdas hasta la ultima fila de la tabla. El degradado verde permanece solo en
  la celda del encabezado con el nombre `Promedio`.
- Las lineas horizontales bajan a gris de alta transparencia y recorren cada
  fila desde `Estudiante`, pasando por las notas, hasta `Promedio`. Se retira el
  divisor general mas fuerte del `tbody` para evitar superposicion.
- Lineas violetas muy tenues separan verticalmente `Estudiante` y cada columna
  de nota a lo largo de todas las filas. La division verde de `Promedio` baja
  al mismo nivel de transparencia.
- En `Estudiante`, la linea y el degradado usan el morado de su icono para
  diferenciar esa columna de los nombres de tipos de nota.
- El texto `Estudiante` usa un morado mas visible y cercano al color del icono.
- Los nombres del encabezado conservan sus colores planos y los fondos
  permanecen blancos.
- `Estudiante` y `Promedio` conservan esquinas superiores curvas para mantener
  la forma visual elegida en los extremos del encabezado.
- La franja superior `Notas de Estudiantes` conserva fondo blanco.
  `border-separate` evita artefactos visuales en las curvas y el contenedor
  recorta el contenido al borde general.
- La columna `Promedio` usa fondo blanco, icono de resultados y texto de mayor
  tamano; conserva la linea inferior verde y su posicion fija a la derecha.
- Las cabeceras permanecen visibles durante el desplazamiento de la tabla.
- No se modificaron la vista movil, las notas ni las llamadas al backend.

Verificacion:

- `pnpm exec eslint src/pages/Planilla.jsx`.
- `pnpm run build`.

## 2026-07-18 - Restauracion de notas fuera de rango

- Cuando el profesor escribe una nota menor que `1` o mayor que `5`, se conserva
  la alerta de validacion y el valor invalido no se envia al backend.
- Al cerrar la alerta, la celda restaura inmediatamente la ultima nota valida.
- Si la celda no tenia una nota previa, vuelve a quedar vacia.
- El campo recupera el foco y selecciona su contenido para facilitar la
  correccion.
- El comportamiento se aplica tanto a la tabla de escritorio como a las
  tarjetas de la planilla movil.

Verificacion:

- `pnpm exec eslint src/pages/Planilla.jsx src/components/PlanillaRow.jsx`.
- `pnpm run build`.

## 2026-07-18 - Spinners al gestionar tipos de evaluacion

- `Agregar Tipo` muestra spinner y cambia a `Agregando...` mientras se registra
  la nueva columna de la planilla.
- Al finalizar correctamente, un modal `Guardado` confirma el nombre del tipo
  de evaluacion agregado.
- `Eliminar Tipo` conserva su confirmacion y, al aceptarla, muestra spinner con
  el texto `Eliminando...` hasta completar la operacion.
- Durante cualquiera de las dos acciones se bloquean los controles relacionados
  para evitar envios duplicados o acciones simultaneas.
- Cada boton se ubica inmediatamente debajo de su input o selector y ambos
  usan ancho compacto y alineacion izquierda en escritorio; en movil ocupan el
  ancho disponible y los dos grupos se apilan.
- Los botones usan fondo blanco con borde e icono de color, sin reutilizar los
  fondos del encabezado de la tabla.
- Si la operacion falla, los controles se habilitan nuevamente y se muestra un
  mensaje de error.
- No se modificaron los endpoints, payloads ni el guardado de notas.

Verificacion:

- `pnpm exec eslint src/pages/Planilla.jsx`.
- `pnpm run build`.

## 2026-07-18 - Respuesta visual al ingresar

- El boton `Ingresar` confirma inmediatamente el clic con un spinner y el texto
  `Verificando acceso...`.
- Los campos y el boton quedan deshabilitados mientras responde el servidor,
  evitando envios duplicados.
- Si la respuesta tarda mas de tres segundos, se muestra un mensaje de espera
  sin bloquear el formulario con un modal adicional.
- Al confirmar las credenciales, el boton muestra `Acceso correcto` antes de
  la redireccion.
- Ante un error, el formulario recupera automaticamente su estado editable.
- No se modificaron el endpoint, el payload, la cookie, la sesion ni las rutas.

Verificacion:

- `pnpm exec eslint src/components/LoginForm.jsx`.
- `pnpm run build`.

## 2026-07-17 - Filtro de subsidios en reportes de ingresos

- Se agrego `Subsidio` al selector de medios del detalle de ingresos.
- El normalizador reconoce registros como `subsidio - referencia` y conserva
  la referencia visible escrita por el usuario.
- Los pagos mixtos separados por `+` muestran cada medio con su etiqueta
  correcta y se pueden filtrar individualmente.
- Gestion de Pagos mantiene la referencia del subsidio como texto libre, sin
  una entidad predefinida.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-16 - Subsidios y abonos en pagos adelantados

- `Meses adelantados` permite alternar entre meses completos y distribucion de
  un monto recibido.
- La distribucion cubre cronologicamente cada saldo y muestra el remanente como
  abono parcial del siguiente mes.
- Se informa la capacidad disponible hasta diciembre y se bloquean valores sin
  periodo asignable.
- Si el concepto conserva deuda vencida, aparece una advertencia antes de
  confirmar el adelanto.
- Se agrego `Subsidio` como metodo con campo de entidad o referencia.
- El cliente normaliza respuestas del backend anterior para conservar una
  transicion segura durante el despliegue.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-16 - Selector de meses vencidos en Gestion de Pagos

- Los conceptos mensuales muestran cuotas vencidas en tarjetas responsive con
  mes, estado y saldo.
- El mes mas antiguo se selecciona por defecto; existen acciones para elegir
  todos o volver al primero.
- El total y el primer metodo de pago se completan automaticamente.
- Una confirmacion previa enumera los meses y el valor que se registrara.
- `Abono libre` conserva el flujo compatible sin asignacion mensual.
- Se documentaron estados de carga, error, reintento y ausencia de cuotas.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-16 - Registro opcional de meses adelantados

Se amplio Gestion de Pagos sin reemplazar el flujo existente de pagos
pendientes.

Archivos modificados:

- `src/pages/PagosAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- El formulario permite alternar entre `Pago pendiente` y `Meses adelantados`.
- `Pago pendiente` conserva el selector, monto editable, abonos, inventario y
  endpoint anteriores.
- El modo adelantado consulta solamente conceptos mensuales asignados al
  estudiante.
- El profesor administrativo elige cantidad de meses; la interfaz muestra los
  periodos exactos y calcula el total con el valor vigente del estudiante,
  curso o concepto.
- Al elegir un unico metodo, su monto se completa con el total calculado; se
  siguen admitiendo metodos combinados si su suma coincide.
- En `Pago pendiente`, el primer metodo seleccionado tambien recibe
  automaticamente el saldo mostrado y sigue siendo editable para abonos.
- Estados de carga, error, reintento y ausencia de meses disponibles no
  bloquean el formulario normal.
- El historial y el recibo muestran los meses dentro de la descripcion del
  pago registrada por el backend.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-15 - Contexto de trabajo responsive en dashboard profesor

Se mejoro la presentacion del selector de clase, periodo y fecha sin cambiar su
comportamiento ni las claves compartidas con los demas modulos del profesor.

Archivos modificados:

- `src/pages/DashboardProfesor.jsx`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- Los tres controles se agrupan en una tarjeta `Contexto de trabajo` con
  jerarquia visual, ayudas breves e iconos.
- Se mantiene el selector nativo de asignacion y el mismo `asignacionId`.
- La opcion general se presenta como `Vista general de clases` y se contemplan
  estados de carga y ausencia de asignaciones.
- Se retiro el resumen redundante que aparecia debajo de los selectores para
  mantener el bloque compacto y enfocado en los controles.
- Los controles usan una paleta simetrica con sus iconos: clase en morado,
  periodo en verde y fecha en azul.
- Se retiro el indicador circular de jornada ubicado junto a la flecha del
  selector de clase para mantener el control limpio.
- Las opciones incluyen un simbolo de sol o media jornada junto al texto para
  diferenciarlas en navegadores que no permiten estilizar partes de un
  `<option>` nativo.
- En movil los controles se apilan; en tablet periodo y fecha comparten fila;
  en escritorio la clase ocupa el espacio principal.
- Los campos tienen mayor area tactil, foco visible y etiquetas asociadas para
  mejorar accesibilidad.
- Se conservan `localStorage.asignacionId`, el periodo compartido y
  `localStorage.fechaAsistencia`; no cambia el contrato del backend.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-15 - Fecha limite obligatoria en Malla Curricular

Se corrigio el guardado y la recuperacion de las filas de la Malla Curricular
del profesor.

Archivos modificados:

- `src/pages/PlaneadorAnual.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- Una fila puede guardarse con uno o varios campos academicos diligenciados,
  pero exige una fecha limite.
- Una fecha sin ningun contenido tambien se valida antes de enviar.
- Las filas completamente vacias envian `fecha: null` y ya no generan el error
  de validacion causado por una cadena vacia.
- La respuesta se ubica por `slot`, por lo que las filas conservan su posicion
  aunque existan espacios vacios entre ellas.
- El guardado recarga la informacion persistida y muestra resultado de exito o
  error mediante SweetAlert2.
- El boton muestra spinner y queda deshabilitado mientras responde el backend.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-15 - Observador permite guardado parcial con confirmacion

Se simplifico el registro de observaciones del estudiante para que el profesor
no tenga que diligenciar las tres dimensiones al mismo tiempo.

Archivos modificados:

- `src/components/Observaciones.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- Basta con escribir contenido en una de las dimensiones conductual, cognitiva
  o de lenguaje.
- Las dimensiones no diligenciadas se envian como texto vacio.
- Una observacion parcial cargada desde backend se reconoce como `Guardado`.
- El boton muestra spinner y texto `Guardando...`, queda deshabilitado durante
  la peticion y bloquea temporalmente la edicion de los campos.
- SweetAlert2 informa validacion, confirmacion exitosa y errores de conexion.
- El modal de exito indica cuantas de las tres dimensiones fueron guardadas y
  para que estudiante.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-15 - Marcacion rapida y edicion segura de asistencia

Se simplifico la toma de asistencia del profesor sin cambiar la fecha elegida
en el dashboard.

Archivos modificados:

- `src/pages/Asistencia.jsx`
- `src/components/AsistenciaRow.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- `Marcar todos presentes` completa el grupo y permite cambiar solo las
  ausencias.
- La pantalla muestra contadores de presentes, ausentes y pendientes.
- Los botones por estudiante son mas grandes y muestran texto en movil y
  escritorio.
- Una asistencia guardada se precarga, puede editarse y muestra
  `Cambios sin guardar` hasta confirmar la actualizacion.
- `Restaurar guardado` deshace cambios locales de una asistencia existente;
  en una asistencia nueva, `Limpiar seleccion` vuelve al estado inicial.
- El guardado exige cero pendientes, confirma el resumen y permanece
  deshabilitado cuando no hay cambios.
- La confirmacion, el estado de carga y el resultado del guardado usan modales
  de SweetAlert2 con resumen visual de presentes y ausentes.
- La fecha continua siendo de solo lectura en esta pantalla y se obtiene desde
  `localStorage.fechaAsistencia`, seleccionada en el dashboard.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-15 - Horario del profesor separado por jornadas

Se mejoro el horario semanal del dashboard para profesores que trabajan en
las jornadas de mañana y tarde.

Archivos modificados:

- `src/pages/DashboardProfesor.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- El horario se agrupa por jornada y luego por dia y hora.
- Si el profesor tiene clases en ambas jornadas, puede alternar entre
  `Ambas`, `Mañana` y `Tarde`; `Ambas` es la vista inicial.
- Si solo tiene una jornada, se muestra directamente sin controles
  innecesarios.
- Los selectores de clase y curso incluyen la jornada para diferenciar cursos
  con nombres iguales.
- La deduplicacion de clases usa `curso_id` y materia, evitando mezclar cursos
  homonimos de jornadas diferentes.
- Se conserva una clasificacion temporal por hora como compatibilidad durante
  un despliegue escalonado del backend.

Verificacion:

- `pnpm run lint`.
- `pnpm run build`.

## 2026-07-15 - Limpieza de asignacion obsoleta del profesor

Se agrego una defensa para que el navegador no conserve un `asignacionId`
viejo cuando el backend ya devuelve otro ID academico seguro.

Archivos modificados:

- `src/pages/DashboardProfesor.jsx`
- `src/pages/PlanDeClases.jsx`
- `src/pages/Planilla.jsx`
- `src/pages/Asistencia.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- El dashboard limpia `localStorage.asignacionId` si el ID guardado ya no
  pertenece a las clases actuales del profesor.
- Plan de clases reemplaza un ID guardado invalido por una asignacion valida
  devuelta por `/mis-clases/{profesor_id}`.
- Planilla y Asistencia limpian el ID guardado y redirigen al dashboard si el
  backend responde `403` por una asignacion que ya no pertenece al profesor.

Verificacion:

- Se ejecuto `pnpm run lint`.

## 2026-07-15 - Curso visible en estudiantes de Gestion de Pagos

Se agrego el curso del estudiante en el listado lateral de Gestion de Pagos.

Archivos modificados:

- `src/pages/PagosAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- La pantalla carga el catalogo de cursos junto con estudiantes y tipos de pago.
- Cada estudiante muestra el curso en la linea de metadatos, junto al documento
  y separado por `|`.
- El boton `Nuevo Pago/Factura` usa color verde para diferenciarse de
  `Guardar valor`.
- El boton `Registrar Pago` muestra un spinner y queda deshabilitado mientras
  el backend confirma el pago; el aviso de exito aparece apenas confirma y la
  recarga de historial, ventas y deudas queda en segundo plano.
- En el formulario de nuevo pago, `Concepto de Pago` queda arriba de fecha y
  monto para que el flujo de captura sea mas claro.
- El formulario de pago se reinicia conservando el estudiante seleccionado, de
  modo que se puedan registrar varios pagos seguidos sin salir del estudiante.
- El helper usa `curso_nombre`, `curso` o `curso_id` contra el catalogo de
  cursos para tolerar distintas respuestas del backend.

Verificacion:

- Revision estatica del render del listado para confirmar que la etiqueta usa
  texto pequeno, `truncate` y no cambia la estructura principal de la tarjeta.

## 2026-07-15 - Plan de clases sin bloqueo por longitud

Se retiro el bloqueo por maximo de caracteres en las cajas del plan diario del
profesor.

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- `Unidad` y `Tema` ya no tienen `maxLength` de 255 caracteres.
- Se elimino la validacion que impedia guardar cuando esos campos superaban el
  limite anterior.
- Desarrollo cognitivo y Actividad en casa se mantienen como cajas libres.

Verificacion:

- Se reviso que el bloqueo de longitud solo existia en `Unidad` y `Tema`.

## 2026-07-15 - Documentacion frontend sincronizada con backend

Se actualizo la documentacion operativa del frontend para reflejar los
endpoints y rutas que ya consume el codigo actual.

Archivos modificados:

- `docs/API_CLIENT.md`
- `docs/RUTAS_FRONTEND.md`
- `docs/README.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambios:

- Se corrigieron los endpoints de rendimiento del dashboard profesor:
  `/dashboard/notas-bajas/{profesor_id}` y
  `/dashboard/notas-altas/{profesor_id}` con parametros de filtro.
- Se agregaron al contrato API los endpoints de cartera vencida, ventas,
  pagos, anulaciones y valores personalizados por estudiante.
- Se completo el listado de operaciones CRUD usadas por estudiantes,
  profesores, cursos, materias e inventario.
- Se ubico `/cambiar-password` como ruta superior protegida por
  `PasswordChangeRoute`, no como ruta de super admin.

Verificacion:

- Se contrasto `docs/API_CLIENT.md` contra llamadas reales con `api` en `src/`.
- Se contrasto `docs/RUTAS_FRONTEND.md` contra `src/App.jsx`.

## 2026-07-13 - Valores personalizados en Gestion de Pagos

Archivos modificados:

- `src/pages/PagosAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- En Gestion de Pagos, al seleccionar un estudiante, el admin puede crear,
  editar o quitar valores personalizados por concepto.
- El formulario permite seleccionar tipo de pago, valor individual y motivo del
  acuerdo.
- La lista muestra el valor personalizado y el valor normal del curso/base para
  comparar rapidamente.
- Al guardar o quitar una excepcion se recargan las deudas del estudiante para
  reflejar el nuevo calculo.

## 2026-07-13 - Claridad al asignar conceptos de cartera a cursos

Archivos modificados:

- `src/components/cartera/AdministrarTiposPago.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- La pantalla de Tipos de Pago ahora muestra cuántos cursos activos tienen el
  concepto asignado y cuántos faltan.
- Al agregar, quitar o modificar cursos, aparece un aviso de cambios pendientes
  indicando que no generan deuda hasta presionar `Guardar asignación de cursos`.
- El botón de guardado queda deshabilitado cuando no hay cambios pendientes.
- La etiqueta de cartera ya no considera conceptos legacy como publicados si no
  tienen cursos asignados, alineando la UI con el cálculo real de deuda.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/cartera/AdministrarTiposPago.jsx
pnpm run build
```

## 2026-07-13 - Guardar plan de clases con campos vacios

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El Plan de clases del profesor ya permite guardar aunque los campos
  academicos de texto esten vacios.
- La validacion previa al envio solo exige clase/asignacion, periodo y fecha.
- Se mantiene la validacion de longitud de `Unidad` y `Tema` si el profesor
  escribe contenido en esos campos.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/PlanDeClases.jsx
```

## 2026-07-13 - Recordar unidad y estandar en plan de clases

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `Unidad` y `Estándar` se guardan aparte en `localStorage` por profesor y
  asignacion despues de guardar correctamente un plan de clases.
- Al crear otro plan nuevo para la misma clase, esos dos campos se precargan
  con el ultimo valor guardado por el profesor.
- Si existe un plan para la fecha seleccionada, se respetan los datos guardados
  de ese plan y no se reemplazan por los valores recordados.
- No se cambiaron endpoints ni base de datos.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/PlanDeClases.jsx
pnpm run build
```

## 2026-07-13 - Evidencias por campo en plan de clases

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadoresClasesAdmin.jsx`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Se retiro la seccion general `Evidencias visuales` del Plan de clases del
  profesor.
- `imagen1` se muestra y se guarda desde `Desarrollo cognitivo`.
- `imagen2` se muestra y se guarda desde `Actividad en casa`.
- La vista admin etiqueta esas mismas imagenes por campo para revisar y borrar
  con el mismo contexto.
- Se ajusto la composicion visual para que los dos campos con evidencia queden
  emparejados y no generen espacios blancos grandes en la grilla.
- Se mantuvo el contrato actual del backend y sus restricciones: imagenes PNG,
  JPG/JPEG o WEBP de maximo 5MB.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/PlanDeClases.jsx src/pages/PlaneadoresClasesAdmin.jsx
pnpm run build
```

## 2026-07-13 - Limite visible en plan de clases

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Se agrego contador y `maxLength` de 255 caracteres para `Unidad` y `Tema`
  en el Plan de clases del perfil profesor.
- Se agrego una validacion defensiva antes de guardar para evitar enviar textos
  que excedan el limite real de base de datos.
- No se cambiaron endpoints ni campos enviados al backend.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/PlanDeClases.jsx
pnpm run build
```

## 2026-07-13 - Aplicar logros a todos en boletin profesor

Archivos modificados:

- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Se agrego la accion `Aplicar logros a todos` en el Boletin Final del perfil
  profesor.
- El profesor puede copiar los logros escritos en el primer estudiante al resto
  del grupo del curso y periodo actual desde un panel general.
- La accion permite aplicar solo en campos vacios o sobrescribir todos, con
  confirmacion previa.
- La copia solo modifica los datos en pantalla; no guarda automaticamente y el
  profesor puede editar estudiantes individuales antes de guardar.
- Se agrego `Guardar todo` para guardar el grupo completo respetando los textos
  actuales de cada estudiante, incluidas modificaciones individuales.
- No se modificaron endpoints ni flujos del perfil admin.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/boletin/IngresoBoletinProfesor.jsx
pnpm run build
```

## 2026-07-13 - Promedio de planilla al borrar notas

Archivos modificados:

- `src/pages/Planilla.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Al borrar el valor de una nota numerica, la planilla ahora envia `nota: null`
  y recalcula el promedio sin esa celda.
- Al eliminar un tipo de evaluacion, el promedio local se recalcula quitando esa
  columna antes de recargar la planilla.
- Al cargar la planilla, el promedio visible se recalcula usando solo las
  columnas activas para evitar que una columna eliminada siga afectando el
  resultado mostrado.
- No se modificaron rutas ni pantallas fuera de Planilla.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/Planilla.jsx
```

## 2026-07-12 - Colores por dia en horario del profesor

Archivos modificados:

- `src/pages/DashboardProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Las cards de clases dentro de `Horario asignado` ahora diferencian el dia con
  bordes, encabezado y hora en colores propios por dia.
- Se mantiene el morado institucional como color base del perfil profesor y se
  usan acentos suaves para facilitar la lectura del horario: lunes morado,
  martes esmeralda, miercoles ambar, jueves rosa y viernes slate.
- Se suavizo el fondo de cada dia y se reforzaron los bordes para diferenciar
  sin saturar visualmente la seccion.
- No se modificaron consultas, filtros, seleccion de clase ni datos del horario.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/DashboardProfesor.jsx
pnpm run build
```

## 2026-07-12 - Perfil profesor con paleta visual del admin

Archivos modificados:

- `src/components/NavProfesor.jsx`
- `src/index.css`
- `src/pages/DashboardProfesor.jsx`
- `src/pages/Planilla.jsx`
- `src/pages/Asistencia.jsx`
- `src/pages/Formulario.jsx`
- `src/components/Observaciones.jsx`
- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadorAnual.jsx`
- `src/pages/RankingRendimiento.jsx`
- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Se alineo el color predominante del perfil profesor con el perfil admin,
  usando la misma familia morada para navegacion, estados activos, focos,
  encabezados, badges y botones principales.
- Se mantuvieron los colores semanticos existentes: rojo para alertas,
  verde para exito/guardado y amarillo para bajo rendimiento o pendientes.
- No se modificaron rutas, endpoints, payloads, permisos ni logica de guardado.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/NavProfesor.jsx src/pages/DashboardProfesor.jsx src/pages/Planilla.jsx src/pages/Asistencia.jsx src/pages/Formulario.jsx src/components/Observaciones.jsx src/pages/PlanDeClases.jsx src/pages/PlaneadorAnual.jsx src/pages/RankingRendimiento.jsx src/components/boletin/IngresoBoletinProfesor.jsx
pnpm run build
```

## 2026-07-12 - Validacion de asignacion antes de planilla y asistencia

Archivos modificados:

- `src/pages/Planilla.jsx`
- `src/pages/Asistencia.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Planilla y Asistencia ahora validan que exista una asignacion seleccionada
  antes de cargar sus datos.
- Si el profesor entra sin seleccionar asignacion, se muestra el mismo aviso
  usado en Observaciones y se redirige a la pagina principal para escogerla.
- Se evita que el aviso se repita mas de una vez durante el mismo montaje de la
  pantalla.
- No se modificaron endpoints, payloads ni guardados existentes.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/Planilla.jsx src/pages/Asistencia.jsx
```

## 2026-07-12 - Periodo recordado por profesor

Archivos modificados:

- `src/utils/periodoProfesor.js`
- `src/pages/DashboardProfesor.jsx`
- `src/pages/Planilla.jsx`
- `src/pages/Asistencia.jsx`
- `src/pages/Formulario.jsx`
- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadorAnual.jsx`
- `src/pages/RankingRendimiento.jsx`
- `src/pages/RankingMejorRendimiento.jsx`
- `src/components/Observaciones.jsx`
- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/ESTADO_SESION.md`

Cambio:

- Se agrego `src/utils/periodoProfesor.js` para leer y guardar el periodo como
  preferencia local por docente (`periodo_profesor_<id>`).
- Las pantallas del perfil profesor leen el periodo recordado por profesor y
  usan `1` como respaldo.
- Al cambiar el selector de periodo, la pantalla guarda el valor por profesor y
  mantiene `localStorage.periodo` como compatibilidad para el flujo actual.
- El logout puede seguir limpiando `localStorage.periodo` sin borrar el ultimo
  periodo recordado de cada profesor en ese navegador.
- No se modificaron endpoints, payloads ni backend.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/utils/periodoProfesor.js src/pages/DashboardProfesor.jsx src/pages/Planilla.jsx src/pages/Asistencia.jsx src/pages/Formulario.jsx src/pages/PlanDeClases.jsx src/pages/PlaneadorAnual.jsx src/pages/RankingRendimiento.jsx src/pages/RankingMejorRendimiento.jsx src/components/Observaciones.jsx src/components/boletin/IngresoBoletinProfesor.jsx
```

## 2026-07-01 - Bloqueo de traduccion automatica del navegador

Se reforzo la aplicacion para evitar que Chrome, Edge u otros navegadores
traduzcan automaticamente nombres, cursos, materias, documentos y textos del
sistema.

Archivos modificados:

- `index.html`
- `src/App.jsx`
- `src/pages/Login.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `index.html` ahora declara `lang="es"`, `translate="no"` y clase
  `notranslate` en `html`, `body` y `#root`.
- Se agrego `<meta name="google" content="notranslate">`.
- Los layouts principales y el login heredan `translate="no"` y
  `notranslate`.
- No se modificaron datos, endpoints ni logica de negocio.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/App.jsx src/pages/Login.jsx
```

## 2026-06-30 - Asignaciones sin curso por defecto

Se ajusto el asignador de clases del perfil admin para no seleccionar
automaticamente el primer curso al cargar.

Archivos modificados:

- `src/components/AsignarClase.jsx`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `AsignarClase` inicia con el selector en `Seleccionar curso`.
- El panel de horario muestra el estado vacio hasta que el admin elige un curso.
- Al editar una asignacion existente, el formulario sigue seleccionando el curso
  real de esa asignacion.
- Esto evita que el encabezado o contexto visual diga que se trabaja sobre el
  primer curso disponible cuando el usuario aun no ha elegido curso.
- No se cambiaron endpoints, payloads ni backend.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/AsignarClase.jsx
```

## 2026-06-30 - Login sin codigo demo por defecto

Se ajusto el formulario de login para no precargar `demo` como codigo de
colegio.

Archivos modificados:

- `src/components/LoginForm.jsx`
- `docs/ESTADO_SESION.md`
- `docs/ROLES_UI.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El campo `Codigo del colegio` inicia vacio cuando no existe un codigo real
  previo.
- Si existe `localStorage.ultimo_codigo_colegio`, se precarga ese ultimo codigo
  usado correctamente.
- El codigo se guarda solo despues de un login exitoso.
- Si por compatibilidad existe un valor viejo `demo`, se ignora y no se muestra
  como valor inicial.
- No se cambio duracion de sesion, cookies, token ni backend.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/components/LoginForm.jsx
```

## 2026-06-30 - Reporte academico parcial en certificados

Se agrego una pestaña de reporte academico parcial al modulo de Certificados
del perfil admin.

Archivos modificados:

- `src/pages/CertificadosAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `CertificadosAdmin` agrega la pestaña `Reporte académico parcial`.
- El admin puede generar el reporte para un curso completo o para un estudiante
  individual.
- El reporte se filtra por periodo y por una materia especifica o todas las
  materias.
- El impreso muestra notas actuales, definitiva parcial, estado de la materia e
  inasistencias del periodo para las materias incluidas.
- Se reutilizan endpoints existentes: boletin admin para notas y asistencia por
  asignacion para inasistencias.
- No se agregaron endpoints ni se cambio el contrato backend.
- El impreso usa `DocumentoImprimible` para conservar branding, encabezado,
  firmas, comportamiento A4 y scroll lateral movil.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/CertificadosAdmin.jsx
pnpm run lint
pnpm run build
```

Nota: el build local se relanzo con permisos elevados por el `EPERM` conocido
de Vite/fnm en esta maquina.

## 2026-06-24 - Orden configurable de materias en boletin

Se agrego una pantalla administrativa para ordenar las materias del boletin por
curso.

Archivos modificados:

- `src/components/OrdenBoletin.jsx`
- `src/pages/Admin.jsx`
- `src/components/boletin/Boletin.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Administracion academica agrega la pestana `Orden boletin`.
- El admin selecciona un curso y reorganiza las materias con flechas o numero
  de posicion.
- La pantalla es responsive: en movil usa filas tactiles con controles de
  tamano fijo; en escritorio aprovecha el ancho disponible.
- El guardado consume `PUT /cursos/{curso_id}/orden-boletin`.
- El impreso de boletin consolida materias con `Map` para respetar el orden
  recibido del backend.

## 2026-06-23 - Mensajes de duplicados en administracion academica

Se ajustaron las pantallas de Profesores, Cursos y Materias para enviar nombres
en mayuscula y mostrar el mensaje real que devuelve el backend cuando un dato
esta duplicado.

Archivos modificados:

- `src/components/CrearProfesor.jsx`
- `src/components/CrearCurso.jsx`
- `src/components/CrearMateria.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- Profesores envia `nombre` y `apellido` en mayuscula.
- Cursos y materias envian `nombre` en mayuscula.
- Los errores `409 Conflict` del backend se muestran al usuario con el detalle
  especifico, por ejemplo documento, email, materia o curso repetido.

## 2026-06-23 - Codigo DANE en diseno de impresos

Se agrego el Codigo DANE como dato institucional configurable para cada
colegio desde Diseño de impresos.

Archivos modificados:

- `src/components/admin/IdentidadInstitucional.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `docs/API_CLIENT.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El formulario de identidad institucional permite guardar `codigo_dane`.
- El encabezado comun `DocumentoImprimible` muestra `Codigo DANE` junto a los
  datos institucionales cuando el colegio lo tiene configurado.
- El cambio aplica a boletines, certificados, recibos, ventas, cartera,
  observaciones y planeadores que usan el sistema moderno de impresion.

Verificacion sugerida:

```powershell
pnpm exec eslint src/components/admin/IdentidadInstitucional.jsx src/components/impresion/DocumentoImprimible.jsx
```

## 2026-06-23 - Gestion de pagos usa deudas dedicadas

Se ajustaron Gestion de Pagos y el resumen del estudiante para cargar las
deudas academicas del estudiante desde un endpoint dedicado.

Archivos modificados:

- `src/pages/PagosAdmin.jsx`
- `src/pages/EstudiantesAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `PagosAdmin` cambia de `GET /estudiantes/{id}/detalles` a
  `GET /estudiantes/{id}/deudas` para llenar el selector de conceptos
  pendientes.
- `EstudiantesAdmin` mantiene el resumen amplio de
  `GET /estudiantes/{id}/detalles`, pero fusiona las deudas desde
  `GET /estudiantes/{id}/deudas`.
- El detalle amplio del estudiante sigue disponible para el modulo de
  estudiantes, pero ya no bloquea la cobranza si falla una seccion no
  financiera.

Verificacion ejecutada:

```powershell
pnpm exec eslint src/pages/PagosAdmin.jsx
pnpm exec eslint src/pages/EstudiantesAdmin.jsx
```

## 2026-06-20 - Titulo de observador profesor alineado

Se igualo el tamaño del titulo de `Observador del estudiante` en el perfil
profesor con los encabezados principales de las demas paginas docentes.

Archivo modificado:

- `src/pages/Formulario.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El titulo pasa de `text-xl` a `text-2xl sm:text-3xl`.
- Se mantiene la logica de busqueda, listado y guardado del observador sin
  cambios.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-20 - Navbar admin y profesor mas compacto

Se ajustaron los navbars de administrador y profesor para que el bloque
superior se vea menos pesado y el nombre del software tenga mas presencia.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `src/index.css`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Los encabezados admin y profesor reducen su padding vertical para que el
  cuadro superior se sienta mas compacto.
- La marca `Scholarix` aumenta de tamaño y queda alineada como una sola linea.
- El navbar profesor tambien muestra solo la marca en el encabezado, igual que
  admin.
- La capsula animada del nav desktop admin/profesor baja ligeramente su altura y
  padding, sin cambiar rutas, permisos, grupos ni comportamiento del menu.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-20 - Nav admin sin nombre de usuario bajo la marca

Se retiro el texto secundario `Admin: <nombre>` que aparecia debajo del nombre
del software en el navbar de administrador.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El navbar admin muestra solo la marca `Scholarix`.
- Se elimina el nombre del usuario debajo de la marca para limpiar el encabezado.
- No se cambia el boton de cerrar sesion, rutas, grupos ni permisos.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-20 - Nav con etiquetas mas legibles

Se aumento suavemente el tamaño de las palabras principales del navbar para
mejorar lectura sin cambiar la estructura de navegacion.

Archivos modificados:

- `src/index.css`
- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Las pestañas principales del nav de escritorio pasan a `15px`.
- Los dropdowns aumentan altura tactil y texto a `15px`.
- En movil, las opciones principales usan `text-base` y las subopciones quedan
  en `15px`.

Alcance tecnico:

- Cambio visual de legibilidad.
- No cambia rutas, permisos, grupos, orden de pestañas ni comportamiento de
  despliegue.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Cumpleanos de estudiantes en dashboards

Se agrego un panel visual de cumpleaños de estudiantes en los dashboards de
admin y profesor.

Archivos modificados:

- `src/components/dashboard/CumpleanosSemana.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/DashboardProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El dashboard admin muestra debajo de las cards un bloque `Cumpleaños de la
  semana` con los estudiantes activos que cumplen anos en los proximos 7 dias.
- El dashboard profesor muestra el mismo bloque con estudiantes de sus cursos
  asignados.
- El panel muestra nombre, curso, si cumple hoy/manana/en cuantos dias, edad
  cuando se puede calcular y estados de carga, error o lista vacia.
- Se consume el nuevo backend de dashboard para no cargar todos los estudiantes
  en el navegador.

Alcance tecnico:

- No se cambia navegacion, permisos visuales ni formularios.
- Requiere los endpoints backend:
  `/dashboard/cumpleanos/admin` y
  `/dashboard/cumpleanos/profesor/{profesor_id}`.
- Ambos se consumen con `dias=7`.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Saludo personalizado en dashboards admin y profesor

Se ajusto el saludo inicial de los dashboards principales para que sea mas
cercano y directo.

Archivos modificados:

- `src/pages/AdminDashboard.jsx`
- `src/pages/DashboardProfesor.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El dashboard admin ya no muestra `Bienvenido`; ahora muestra `Hola` y el
  primer nombre del usuario admin en negrita.
- El dashboard profesor ya no muestra `Bienvenida/o`; ahora muestra `Hola` y
  el primer nombre del profesor en negrita.
- Cada dashboard muestra la frase corta con emoji al lado del nombre, como un
  mensaje de inicio.

Alcance tecnico:

- Cambio visual y de texto en frontend.
- No cambia rutas, permisos, carga de datos, endpoints ni backend.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Animacion de cards en dashboard admin

Se agrego una animacion visual suave solamente al dashboard principal de admin.

Archivos modificados:

- `src/pages/AdminDashboard.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Las cards secundarias del dashboard admin ahora son accesos compactos con
  fondo tintado por modulo, franja lateral de color y una burbuja visual suave.
- Se organizan en una grilla mas densa en escritorio para evitar tarjetas
  demasiado grandes.
- En hover y foco de teclado elevan la tarjeta y refuerzan el color del modulo.
- La card destacada de cartera vuelve a conservar su estilo visual anterior.
- El icono de cada card mantiene una microinteraccion leve para dar sensacion
  de respuesta.
- Se agrego soporte para `prefers-reduced-motion` para usuarios que reduzcan
  animaciones del sistema.

Alcance tecnico:

- Cambio limitado a `/dashboard-admin`.
- No modifica dashboard profesor, rutas, permisos, endpoints ni contratos de
  backend.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Correccion de egresos en movimiento mensual

Se corrigio la consulta de egresos desde `Movimiento mensual` en
`ReportesAdmin`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El detalle mensual de egresos ya no arma el rango con `YYYY-MM-31`.
- Ahora calcula el ultimo dia real del mes antes de llamar
  `/reportes/egresos-rango`.
- El rango activo de ingresos mensuales tambien conserva la fecha final real
  del mes.

Motivo:

- En meses sin dia 31, como febrero, abril, junio, septiembre o noviembre, el
  rango podia quedar invalido y el panel hacia scroll pero no mostraba egresos.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Reportes sin accesos rapidos redundantes

Se simplifico el encabezado de `ReportesAdmin` retirando los botones `Ver
ingresos` y `Ver egresos` que estaban junto a `Actualizar`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- El encabezado conserva solo el boton `Actualizar`.
- Los botones `Ingresos` y `Egresos` del panel `Rango de fechas` se mantienen
  como accion principal para consultar movimientos del rango seleccionado.
- No se cambio la carga de detalle, filtros, cards financieros ni endpoints.

Alcance tecnico:

- Cambio visual en frontend.
- No cambia backend, permisos, payload ni base de datos.

## 2026-06-17 - Retiro temporal de apoyos laterales en Plan de Clases

Se retiraron los bloques laterales de `Plantillas rápidas` e `Ideas para
enriquecer` del perfil profesor para evitar ayudas genericas poco claras
mientras se diseña un flujo mas util basado en Malla Curricular.

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`

Cambio:

- Se eliminaron las plantillas rapidas y su accion de autorrelleno local.
- Se elimino el panel `Ideas para enriquecer`.
- El formulario principal de guia didactica y evidencias ocupa todo el ancho
  disponible.
- Se mantiene el flujo de `Usar como base` desde planes recientes.
- Se documento como trabajo futuro conectar Plan de Clases con la Malla
  Curricular para sugerir temas por asignacion, periodo, consecutivo y fecha.

Alcance tecnico:

- No cambia endpoints, permisos, payload ni base de datos.
- El retiro es solo visual/funcional en frontend.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Detalle visual de planeaciones recibidas admin

Se mejoro la lectura del plan seleccionado en `PlaneadoresClasesAdmin` para
que el cuerpo enviado por el profesor se vea como un reporte academico mas
claro y dinamico.

Archivo modificado:

- `src/pages/PlaneadoresClasesAdmin.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- El detalle del plan ahora muestra encabezado de `Reporte recibido` con tema,
  profesor y chips de materia, curso, periodo y fecha.
- Se agregaron bloques visuales para fundamentos pedagogicos: unidad, logro,
  estandar y desarrollo cognitivo.
- La ruta de clase queda destacada en una seccion propia para mejorar lectura
  de textos largos.
- Actividad en clase y actividad en casa se muestran como bloques separados.
- Las evidencias se mantienen al final del reporte con la misma logica de
  visualizacion y borrado.
- Se quito el scroll interno del panel de detalle; el scroll propio queda solo
  en la lista de `Envíos recibidos`.
- En escritorio, la lista de envios conserva ancho lateral y su area de scroll
  se estira con la altura del detalle para evitar un panel cortado.
- La lista mantiene scroll interno y la carga inicial sigue limitada a 20
  envios; el historico completo se trae solo al usar `Cargar más planeaciones`.

Alcance tecnico:

- No cambia endpoints, permisos, payload ni base de datos.
- El cambio es solo UI del detalle admin de planeaciones recibidas.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-17 - Planeadores admin paginados y taller docente profesor

Se ajustaron las pantallas de plan de clases para que el perfil admin revise
envios de profesores con una bandeja paginada y para que el perfil profesor
tenga un entorno mas guiado al elaborar sus planes.

Archivos modificados:

- `src/pages/PlaneadoresClasesAdmin.jsx`
- `src/pages/PlanDeClases.jsx`
- `docs/CAMBIOS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- `PlaneadoresClasesAdmin` consume `GET /admin/plan-de-clases` con
  `limit=20` y `offset`, conserva los filtros actuales y agrega boton
  `Cargar más planeaciones`.
- La vista admin muestra resumen de `Total`, `Mostrados` y `Con evidencia`,
  lista de envios mas escaneable y detalle amplio sin scroll interno.
- `PlanDeClases` mantiene el mismo contrato de guardado, los mismos campos y
  el mismo envio multipart a `/plan-de-clases`.
- La vista profesor se reorganizo como taller docente con contexto de clase,
  guia didactica y opcion `Usar como base` desde planes recientes.

Alcance tecnico:

- No se crearon tablas.
- No se agregaron migraciones.
- No se cambio el payload enviado al backend.
- El endpoint admin ya soporta `limit`, `offset` y respuesta `{ total, items }`;
  el frontend conserva fallback si recibe una lista simple.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Lint sin errores.
- Build de produccion OK.

## 2026-06-13 - Navbar animado de escritorio para admin y profesor

Se agrego un navbar animado reutilizable para escritorio, inspirado en el
modelo visual de borde/indicador sobre la pestaña activa.

Archivos modificados/agregados:

- `src/components/DesktopAnimatedNav.jsx`
- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `src/index.css`
- `docs/COMPONENTES.md`
- `docs/CAMBIOS_FRONTEND.md`

Cambio:

- `NavAdmin` y `NavProfesor` usan el nuevo componente solo desde breakpoint
  `lg`.
- Los menus moviles se mantienen con el comportamiento colapsable existente.
- El indicador se calcula segun el elemento activo o en hover, por lo que no
  depende de `nth-child` ni de una cantidad fija de pestañas.
- Se conserva `translate="no"` para `Nómina`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

## 2026-06-13 - Organizacion de documentacion frontend SaaS

Se reorganizo y actualizo la documentacion del frontend para mejorar el control
operativo del SaaS.

Archivos modificados/agregados:

- `docs/README.md`
- `docs/API_CLIENT.md`
- `docs/ARQUITECTURA_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`
- `docs/COMPONENTES.md`
- `docs/DEPLOY_GRATIS.md`
- `docs/ESTADO_SESION.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/ROLES_UI.md`
- `docs/RUTAS_FRONTEND.md`

Cambios:

- Se agrego un indice principal para saber que documento usar segun el tema.
- Se documentaron los modulos recientes del perfil profesor: planilla movil,
  asistencia, observador e ingreso de boletin.
- Se agregaron criterios de Android/Chrome para `translate="no"` y ocultamiento
  de etiquetas tecnicas como `mas_alto`.
- Se actualizo la documentacion de produccion con UX movil profesor/admin,
  riesgos de cookies, Render/Neon y verificaciones post deploy.
- Se actualizaron rutas, roles, sesion, arquitectura y checklist para reflejar
  el estado actual del SaaS.

Verificacion ejecutada:

```powershell
rg -n "2026-06-13|Planilla|Asistencia|Observaciones|IngresoBoletin|translate=\"no\"|mas_alto" docs
```

## 2026-06-12 - Verificacion del observador en movil

Se ajusto el estado inicial del Observador del estudiante para evitar que el
badge quede indefinidamente en `Verificando` cuando la consulta de registro
tarda o se queda colgada en movil.

Archivo modificado:

- `src/components/Observaciones.jsx`

Cambio:

- La consulta inicial de observacion usa cancelacion con tiempo limite.
- Si la consulta falla o se cancela, el componente apaga `cargando` y vuelve a
  estado `Pendiente` en vez de quedarse en `Verificando`.
- Se evita actualizar estado si el componente se desmonta durante la consulta.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-12 - Etiqueta Nomina en nav admin movil

Se corrigio la etiqueta `Nómina` del menu de cartera en `NavAdmin` para evitar
que Chrome Android la traduzca como `nombre`.

Archivo modificado:

- `src/components/NavAdmin.jsx`

Cambio:

- La opcion `Nómina` queda marcada con `translate="no"` en desktop y movil.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-12 - Etiquetas de notas en ingreso de boletin

Se aplico al ingreso de boletin final el mismo criterio usado en planilla para
evitar etiquetas tecnicas o traducidas por el navegador.

Archivo modificado:

- `src/components/boletin/IngresoBoletinProfesor.jsx`

Cambios:

- Se oculta la nota tecnica `mas_alto` en el detalle de notas de referencia.
- Los nombres de tipo de nota se formatean como etiquetas humanas, reemplazando
  guiones bajos o medios por espacios.
- Las etiquetas visibles de notas usan `translate="no"` para reducir
  traducciones automaticas del navegador.

Verificacion ejecutada:

```powershell
pnpm run lint
```

## 2026-06-12 - Historial y estado guardado en asistencia profesor

Se mejoro la pantalla de asistencia del perfil profesor para que el historial
de inasistencias sea mas claro cuando tarda en cargar y para mostrar si la
asistencia del dia ya fue registrada.

Archivos modificados:

- `src/pages/Asistencia.jsx`
- `src/components/AsistenciaRow.jsx`

Cambios:

- La carga del historial ahora tiene estado visible: `Cargando historial de
  inasistencias...`.
- Si la consulta del historial falla, se muestra un mensaje de error con boton
  `Reintentar`.
- La consulta del historial hace un reintento corto antes de mostrar error,
  para reducir fallos intermitentes de produccion.
- El historial se normaliza en un mapa por estudiante para evitar busquedas
  repetidas al renderizar la lista.
- Si el historial trae registros para la fecha seleccionada, la pantalla muestra
  la notificacion `Asistencia del día ya tomada`.
- Cuando ya existe asistencia para la fecha, los botones de presente/ausente se
  precargan con el estado guardado y el boton principal cambia a
  `Actualizar Asistencia`.
- Mientras el historial esta cargando, cada fila muestra `Cargando historial...`
  en vez de un contador `0` que podria confundirse con dato real.

Alcance:

- No se cambiaron endpoints ni payloads enviados al backend.
- La mejora es de estado visual, manejo de errores y eficiencia del render.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

## 2026-06-12 - UX movil en planilla de notas del profesor

Se mejoro la experiencia movil de la planilla de notas del perfil profesor
para que agregar o editar calificaciones sea mas comodo desde celular.

Archivos modificados:

- `src/pages/Planilla.jsx`
- `src/components/PlanillaRow.jsx`
- `src/constants/valoracionesDesarrollo.js`

Cambios:

- En movil, la tabla de notas se reemplaza por tarjetas por estudiante.
- Cada tarjeta muestra primero el nombre del estudiante y luego las notas por
  tipo de evaluacion, evitando que el nombre ocupe demasiado espacio lateral.
- En calificacion numerica, cada tipo de nota usa un input tactil de ancho
  completo.
- En desarrollo infantil, las opciones se muestran como botones con emoji y
  nombre visible: `Destacado`, `Logrado`, `En proceso` y `Requiere apoyo`.
- En escritorio se conserva la tabla tradicional con columnas, encabezados y
  promedio fijo.
- En la tarjeta movil, el promedio se muestra verde cuando es mayor o igual a
  `3.0` y rojo cuando esta por debajo de `3.0`.
- En la tabla de escritorio, el promedio usa el mismo color: verde desde `3.0`
  y rojo por debajo de `3.0`.
- Despues de guardar una nota numerica, el promedio de la tarjeta movil se
  recalcula localmente para no depender de recargar la pagina.
- La actualizacion del promedio movil se aplica de forma optimista antes de la
  recarga del backend y se reaplica despues de sincronizar, evitando que Android
  conserve visualmente el promedio anterior.
- Las notas numericas aceptan coma decimal de teclado movil y se normalizan a
  punto antes de enviar al backend.
- Los controles superiores de la planilla ajustan padding, tamaño de titulo y
  botones para pantallas estrechas.

Alcance:

- No se cambiaron endpoints ni estructura de datos enviada al backend.
- La mejora aplica al render responsive del frontend.
- Se mantiene la proteccion contra traduccion automatica en nombres, tipos de
  nota e inputs.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

## 2026-06-11 - Optimizacion inicial de carga del dashboard profesor

Se mejoro el tiempo percibido de aparicion del dashboard del perfil profesor
sin cambiar endpoints ni reglas de negocio.

Archivo modificado:

- `src/pages/DashboardProfesor.jsx`

Cambios:

- Se elimino la doble llamada a `GET /mis-clases/{profesor_id}`. La misma
  respuesta ahora alimenta tanto la lista de clases como el horario asignado.
- Se reemplazo el `loading` global de pantalla completa por estados de carga
  por seccion:
  - clases/horario;
  - inasistencias;
  - rendimiento bajo/alto.
- El dashboard puede pintar su estructura principal aunque una tarjeta siga
  cargando datos.
- Las consultas de `notas-bajas` y `notas-altas` se agruparon en una sola
  funcion y se ejecutan en paralelo cuando hay curso seleccionado.

Alcance:

- No se agregaron endpoints.
- No se cambiaron filtros, calculos, rutas ni permisos.
- Si el backend esta dormido en hosting gratuito, la primera respuesta puede
  seguir tardando, pero la UI ya no queda bloqueada por todas las peticiones.

Verificacion ejecutada:

```powershell
rg -n "mis-clases|loadingClases|loadingInasistencias|loadingRendimiento" src/pages/DashboardProfesor.jsx
pnpm run lint
pnpm run build
```

Resultado:

- `GET /mis-clases/{profesor_id}` queda referenciado una sola vez en
  `DashboardProfesor.jsx`.
- Lint OK.
- Build de produccion OK al ejecutarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.

## 2026-06-11 - Ajustes UX movil en admin, impresos y observador

Se mejoro la experiencia movil del perfil admin sin cambiar endpoints, calculos
ni reglas de negocio.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/admin/PlantillasAdmin.jsx`
- `src/components/boletin/Boletin.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `src/pages/BrandingAdmin.jsx`
- `src/pages/CarteraVencidaAdmin.jsx`
- `src/pages/CertificadosAdmin.jsx`
- `src/pages/EstudiantesAdmin.jsx`
- `src/styles/print.css`

Cambios:

- `NavAdmin` en movil ya no despliega todas las subsecciones al abrir el menu.
  Las secciones agrupadas se abren bajo demanda, y sus subpestanas tienen
  estilos diferenciados frente a las pestañas principales.
- La administracion de diseno de impresos y plantillas se ajusto para pantallas
  estrechas: tabs con desplazamiento horizontal, controles apilados y boton de
  guardado mas usable en movil.
- `DocumentoImprimible` acepta `className` por documento y aplica una clase de
  root para documentos que necesitan scroll lateral en movil.
- El toolbar de impresos ahora usa botones compactos `Descargar PDF` e
  `Imprimir`. Ambos abren el dialogo nativo de impresion/guardar PDF del
  navegador.
- Boletin, certificados y estados de cuenta de cartera conservan ancho A4 en
  movil y se desplazan horizontalmente para evitar que el documento salga
  mocho o comprimido.
- El boton `Atras` de boletin y certificados queda arriba a la izquierda para
  no chocar con la barra inferior de descarga/impresion en celulares.
- En `/admin/estudiantes`, el observador dentro del modal de detalle se
  reorganizo para movil: encabezado apilado, contador de registros, chips para
  periodo/materia/profesor/fecha y tarjetas separadas para conductual,
  cognitivo y lenguaje.

Alcance:

- El scroll lateral A4 aplica solo a documentos marcados como boletin,
  certificado o cartera.
- Los cambios mas fuertes de documento estan dentro de media queries moviles.
- En escritorio se conserva la vista centrada y amplia de documentos; el cambio
  visible principal es la posicion superior del boton `Atras` en boletin y
  certificados, y una presentacion mas ordenada del observador.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Lint OK.
- Build de produccion OK al ejecutarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.

## 2026-06-10 - Limpieza de header de tenant en frontend

Se removio el envio del header `X-Tenant-ID` desde el cliente.

Archivos modificados:

- `src/utils/api.js`
- `src/components/LoginForm.jsx`

Cambio:

- El frontend ya no lee `tenant` desde `localStorage` para enviarlo como header.
- El login ya no guarda `tenant` como clave separada en `localStorage`.
- La fuente de verdad del tenant sigue siendo la cookie/token emitida por el
  backend.
- El objeto de sesion (`usuario`, `profesor` o `super_admin`) conserva el tenant
  solo como dato informativo de sesion.

Verificacion ejecutada:

```powershell
rg -n "X-Tenant-ID|setItem\\(['\\\"]tenant['\\\"]|getItem\\(['\\\"]tenant['\\\"]" src
pnpm run lint
pnpm run build
```

Resultado:

- No quedan lecturas/escrituras separadas de `tenant` para el header.
- Lint OK.
- Build de produccion OK.

## 2026-06-10 - Limpieza controlada de warnings de hooks

Se limpiaron los warnings pendientes de `react-hooks/exhaustive-deps` sin
cambiar endpoints, rutas, permisos ni reglas de negocio.

Archivos modificados:

- `src/components/admin/PlantillasAdmin.jsx`
- `src/components/boletin/IngresoBoletinProfesor.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `src/pages/Asistencia.jsx`
- `src/pages/DashboardProfesor.jsx`
- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadoresClasesAdmin.jsx`
- `src/pages/Planilla.jsx`
- `src/pages/RankingRendimiento.jsx`

Cambio:

- Se estabilizaron funciones usadas por `useEffect` con `useCallback`.
- Se declararon dependencias reales en los hooks para evitar estados antiguos en
  memoria.
- Se memoizo la configuracion de impresos para evitar recalculos innecesarios.
- En `PlaneadoresClasesAdmin`, el filtro de profesor y fechas conserva recarga
  automatica, mientras que el campo de busqueda sigue ejecutandose solo al
  presionar `Buscar`.
- Este cambio deja cerrada la nota previa de warnings pendientes en lint.

Pruebas manuales recomendadas:

- Entrar con perfil profesor y revisar `Dashboard`.
- Revisar `Asistencia`, `Planilla`, `Plan de Clases`, `Malla Curricular` y
  `Boletin final`.
- Entrar con perfil admin y revisar `Diseño de impresos / Plantillas`.
- Revisar `Planeadores de clases`, cambiando profesor, fechas y usando el boton
  `Buscar`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Lint OK, sin errores y sin warnings.
- Build de produccion OK al ejecutarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.

## 2026-06-10 - Estado de guardado en plan de clases y malla curricular

Se agrego identificador visual de guardado en los modulos del perfil profesor:
Plan de clases y Malla curricular.

Archivos modificados:

- `src/pages/PlanDeClases.jsx`
- `src/pages/PlaneadorAnual.jsx`

Cambio:

- Ambos modulos muestran estado `Verificando`, `Pendiente`, `Guardado` o
  `Cambios sin guardar`.
- Plan de clases marca `Guardado` cuando existe plan para la fecha seleccionada.
- Malla curricular marca `Guardado` cuando el periodo trae planeadores
  registrados desde el backend.
- Al editar campos, fechas o imagenes pendientes de subir, el estado cambia a
  `Cambios sin guardar`.
- Luego de guardar correctamente, vuelve a `Guardado` y muestra hora de
  actualizacion.
- Los botones cambian texto segun el estado, siguiendo el criterio visual usado
  en boletin final y observador.

Pruebas manuales recomendadas:

- Entrar con perfil profesor.
- Abrir `Plan de Clases`, seleccionar fecha con y sin plan guardado y confirmar
  el estado.
- Editar un campo o cargar imagen y confirmar `Cambios sin guardar`.
- Guardar y confirmar que vuelve a `Guardado`.
- Abrir `Malla Curricular`, cambiar de periodo y confirmar si aparece
  `Guardado` o `Pendiente`.
- Editar una celda o fecha, guardar y confirmar que vuelve a `Guardado`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 12 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Estado de guardado en observador del estudiante

Se agrego identificador visual de guardado en el Observador del estudiante del
perfil profesor.

Archivos modificados:

- `src/components/Observaciones.jsx`

Cambio:

- Cada observador muestra un badge con estado `Pendiente`, `Guardado`,
  `Cambios sin guardar` o `Verificando`.
- Al cargar una observacion existente completa, el estado queda como
  `Guardado`.
- Al editar cualquier dimension, el estado cambia a `Cambios sin guardar`.
- Luego de guardar correctamente, vuelve a `Guardado` y muestra la hora de
  actualizacion.
- Se replica el criterio visual usado en el ingreso de boletin final.

Pruebas manuales recomendadas:

- Entrar con perfil profesor.
- Abrir `Observaciones`.
- Confirmar que estudiantes sin observador muestran `Pendiente`.
- Confirmar que estudiantes con observador ya guardado muestran `Guardado`.
- Editar un campo y confirmar que cambia a `Cambios sin guardar`.
- Guardar y confirmar que vuelve a `Guardado`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 12 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Refactor de medios de pago en reportes

Se separo la logica de medios de pago del componente principal de Reportes y
Estadisticas.

Archivos modificados:

- `src/pages/ReportesAdmin.jsx`
- `src/utils/reportesMediosPago.js`

Cambio:

- Se extrajeron helpers de normalizacion, filtro, detalle visible y calculo de
  montos por medio de pago.
- `ReportesAdmin.jsx` queda enfocado en carga de datos, estados y renderizado.
- El comportamiento visual y funcional del detalle de ingresos se mantiene igual.
- El archivo principal bajo a 609 lineas; la logica extraida queda aislada en
  `reportesMediosPago.js`.

Pruebas manuales recomendadas:

- Abrir `Reportes y Estadisticas`.
- Abrir `Detalle de ingresos`.
- Filtrar por `Efectivo`, `Transferencia` y `Tarjeta`.
- Confirmar que los detalles como `Transferencia - daviplata` y los montos se
  sigan mostrando igual.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Etiqueta base en transferencias con detalle

Se ajusto la etiqueta visible del medio de pago cuando una transferencia trae
detalle libre.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- Cuando el metodo interno es `transferencia` y existe detalle, el chip usa
  `Transferencia` como etiqueta base.
- Evita duplicados como `Daviplata - daviplata`.
- Un pago con detalle `daviplata` ahora debe verse como
  `Transferencia - daviplata`.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Revisar una transferencia con detalle `daviplata`.
- Confirmar que el chip muestre `Transferencia - daviplata`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Correccion de extraccion de detalle por guion

Se corrigio la lectura del detalle libre del medio de pago cuando el backend
envia valores como `transferencia - texto`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- La extraccion del detalle ya no usa la normalizacion que reemplaza guiones por
  espacios.
- Valores como `transferencia - sapo` ahora conservan el texto posterior al
  guion y se muestran como `Transferencia - sapo`.
- Tambien se mantiene soporte para `transferencia: texto`.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Confirmar que un pago con `tipo_pago` guardado como `transferencia - texto`
  se vea en el chip como `Transferencia - texto`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Conserva descripcion libre en tipo de pago

Se corrigio el detalle visible del medio de pago cuando el backend envia el
texto libre dentro de `tipo_pago`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- Si el backend envia valores como `transferencia - sapo`, el reporte extrae y
  muestra el texto libre despues del separador.
- La clasificacion interna sigue siendo `transferencia`, para que el filtro
  funcione igual.
- La etiqueta visible queda como `Transferencia - sapo` en vez de reducirse a
  solo `Transferencia`.
- Tambien se soporta el formato con dos puntos, por ejemplo
  `transferencia: sapo`.

Pruebas manuales recomendadas:

- Registrar un pago por transferencia con una nota libre.
- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia`.
- Confirmar que se vea `Transferencia - texto libre`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Detalle libre en transferencia

Se ajusto el detalle visible del medio de pago en Reportes y Estadisticas para
respetar el texto escrito por el usuario.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- En transferencias, el texto escrito en `nota` o campos equivalentes se muestra
  como detalle visible.
- El sistema ya no limita ese detalle a bancos o plataformas conocidas.
- Si el usuario escribe un texto libre como `sapo`, el detalle puede mostrarse
  como `Transferencia - sapo`.
- Se amplio la lectura de campos como `nota_pago`, `nota_metodo`,
  `observacion`, `observaciones`, `referencia`, `detalle`,
  `detalle_pago` y `descripcion_metodo`.

Pruebas manuales recomendadas:

- Registrar un pago por transferencia con una nota libre.
- Abrir `Detalle de ingresos`.
- Confirmar que el chip del medio de pago muestre `Transferencia - texto`.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Correccion de monto en ingresos filtrados

Se corrigio el monto mostrado en `Detalle de ingresos` cuando se filtra por
`Transferencia` o `Tarjeta`.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- La columna `Monto` ya no depende solo de `pago.monto`; ahora usa como respaldo
  `monto_valido`, `valor`, `total`, `monto_pagado`, `valor_pagado`, `abono` y
  campos equivalentes.
- Si el backend no entrega el monto parcial separado del metodo, pero el ingreso
  pertenece al metodo filtrado, se muestra el monto total del ingreso en vez de
  quedar en `0`.
- Los chips de medio de pago tambien muestran el monto al estar dentro de un
  filtro seleccionado.
- Se ajusto la lectura de valores con separador colombiano, por ejemplo
  `10.000`, para que se interpreten como diez mil y no como diez.
- Los pagos anulados siguen sin sumar en los totales del detalle filtrado.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia` y confirmar que la columna `Monto` muestra valor.
- Filtrar por `Tarjeta` y confirmar que la columna `Monto` muestra valor.
- Confirmar que el total superior cambia segun el filtro y no suma anulados.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Detalle visible y monto por medio de pago

Se ajusto el detalle de ingresos en Reportes y Estadisticas para conservar la
informacion especifica del metodo de pago al filtrar.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- El filtro sigue usando categorias internas (`efectivo`, `transferencia`,
  `tarjeta`), pero la tabla conserva la etiqueta visible real del pago.
- Las transferencias pueden mostrarse como `Nequi`, `Daviplata`, `PSE`,
  `Bancolombia` o `Transferencia - banco/app` si el backend entrega ese dato.
- Se amplio la lectura de montos parciales por metodo para campos como
  `monto_transferencia`, `valor_transferencia`, `monto_nequi`,
  `valor_daviplata`, `monto_tarjeta`, `valor_tarjeta`, entre otros.
- Al filtrar por un solo metodo, la columna `Monto` muestra el valor parcial de
  ese metodo cuando esta disponible.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia` y confirmar que se vea `Nequi`, `Daviplata` o el
  banco correspondiente.
- Confirmar que el monto mostrado sea el valor de la transferencia cuando el
  pago tenga montos separados.
- Filtrar por `Tarjeta` y confirmar que el monto parcial tambien se conserve.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Correccion de filtro por transferencia y tarjeta

Se amplio la normalizacion del filtro de medio de pago en Reportes y
Estadisticas.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- El filtro ya no depende de coincidencias exactas como `transferencia` o
  `tarjeta`.
- Se reconocen variantes como `transferencia bancaria`, `PSE`, `Nequi`,
  `Daviplata`, `Bancolombia`, `tarjeta debito`, `tarjeta credito`, `datafono`,
  `POS` y `targeta`.
- Se aceptan metodos enviados como arreglo, arreglo de textos, objeto, JSON
  serializado o texto.
- Si un texto contiene varios medios de pago, el ingreso aparece en cada filtro
  correspondiente.

Pruebas manuales recomendadas:

- Abrir `Detalle de ingresos`.
- Filtrar por `Transferencia` y confirmar que aparecen pagos transferidos.
- Filtrar por `Tarjeta` y confirmar que aparecen pagos de tarjeta/datáfono.
- Confirmar que `Efectivo` sigue funcionando.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Filtro por medio de pago en detalle de ingresos

Se agrego filtro por medio de pago en el detalle de ingresos del modulo
Reportes y Estadisticas.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- El panel `Detalle de ingresos` ahora incluye un selector para filtrar por
  `Todos`, `Efectivo`, `Transferencia` o `Tarjeta`.
- El filtro se aplica localmente sobre los ingresos ya cargados para no cambiar
  endpoints ni calculos del backend.
- El total superior se recalcula segun el medio de pago seleccionado.
- En pagos mixtos con montos por metodo, el total filtrado suma solo el monto
  del metodo seleccionado.
- Las filas anuladas conservan el monto visible tachado, pero no suman como
  ingreso valido.

Pruebas manuales recomendadas:

- Ir a Admin > Reportes y Estadisticas.
- Abrir `Detalle de ingresos`.
- Cambiar el filtro entre `Efectivo`, `Transferencia` y `Tarjeta`.
- Confirmar que la tabla y el total cambian segun el filtro.
- Probar un pago mixto y confirmar que el filtro muestra el metodo correcto.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Medio de pago en detalle de ingresos

Se agrego el medio de pago en el detalle de ingresos del modulo Reportes y
Estadisticas.

Archivo modificado:

- `src/pages/ReportesAdmin.jsx`

Cambio:

- La tabla `Detalle de ingresos` ahora muestra una columna `Medio de pago`.
- Se normalizan los valores `efectivo`, `transferencia` y `tarjeta`.
- Tambien se acepta `targeta` como equivalente de `tarjeta` por compatibilidad.
- Si el backend entrega pago mixto en una lista de metodos, se muestran los
  metodos y sus montos.
- Se soportan varios nombres posibles de campo: `tipo_pago`, `metodo_pago`,
  `medio_pago`, `forma_pago`, `metodos`, `metodos_pago`, `medios_pago`,
  `formas_pago` y `detalle_metodos`.

Pruebas manuales recomendadas:

- Ir a Admin > Reportes y Estadisticas.
- Abrir `Detalle de ingresos` por el dia o por rango.
- Confirmar que cada ingreso muestra `Efectivo`, `Transferencia` o `Tarjeta`.
- Probar un pago mixto y confirmar que se ven varios metodos.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Ajuste de resumen en certificados imprimibles

Se ajustaron los impresos de certificados para evitar repetir el nombre del
estudiante en el bloque superior de datos.

Archivo modificado:

- `src/pages/CertificadosAdmin.jsx`

Cambio:

- En `Certificado de notas` se quito el campo `Estudiante` del resumen superior.
- En `Certificado de matrícula` se quito el campo `Estudiante` del resumen
  superior.
- El nombre del estudiante se conserva dentro del texto formal del certificado.

Pruebas manuales recomendadas:

- Generar un certificado de notas y confirmar que el resumen inicia en
  `Documento`.
- Generar un certificado de matrícula y confirmar que el resumen inicia en
  `Documento`.
- Confirmar que el nombre del estudiante sigue apareciendo en el cuerpo del
  certificado.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Certificado de matricula en modulo de certificados

Se agrego la separacion por pestanas dentro del modulo de certificados para
soportar certificado de notas y certificado de matricula.

Archivo modificado:

- `src/pages/CertificadosAdmin.jsx`

Cambio:

- Se agregaron pestanas internas: `Certificado de notas` y
  `Certificado de matrícula`.
- La pestana de notas conserva el flujo existente de periodo individual o todos
  los periodos.
- La pestana de matricula reemplaza el selector de periodo por el campo
  `Año lectivo`.
- El certificado de matricula reutiliza `DocumentoImprimible` y el branding
  institucional.
- El impreso de matricula muestra estudiante, documento, curso, jornada, estado
  y año lectivo.
- El texto del certificado queda orientado a soportes administrativos,
  pensiones, subsidios u otros tramites externos.
- No se agregaron rutas nuevas ni cambios en navbar; ambos certificados viven
  dentro de `/admin/certificados`.

Pruebas manuales recomendadas:

- Ir a Admin > Gestion Academica > Certificados.
- Confirmar que inicia en `Certificado de notas` y genera como antes.
- Cambiar a `Certificado de matrícula`.
- Ajustar el año lectivo, seleccionar un estudiante y generar el certificado.
- Presionar `Imprimir` y validar encabezado, datos del estudiante y firmas.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-10 - Historial de prestamos bajo seleccion de trabajador

Se ajusto la pantalla de prestamos para que el historial no se cargue
automaticamente al abrir el modulo.

Archivo modificado:

- `src/pages/PrestamosAdmin.jsx`

Cambio:

- Al abrir la pagina solo se carga la lista de profesores/trabajadores.
- El historial de prestamos se consulta unicamente cuando se selecciona un
  profesor o trabajador en el filtro.
- El selector del historial carga automaticamente los prestamos del trabajador
  seleccionado.
- El boton `Limpiar` vacia el historial y vuelve al mensaje inicial.
- Se agrego un mensaje visible indicando que el historial se carga al escoger
  un profesor o trabajador.
- Despues de registrar un prestamo, el historial se muestra filtrado por el
  trabajador al que se le creo el prestamo.

Pruebas manuales recomendadas:

- Abrir Admin > Nomina/Prestamos y confirmar que no aparece historial cargado.
- Confirmar que se muestra el aviso para seleccionar profesor o trabajador.
- Seleccionar un trabajador y validar que se cargue su historial.
- Presionar `Limpiar` y confirmar que el historial desaparece.
- Crear un prestamo y confirmar que queda visible filtrado por ese trabajador.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-06 - Impresion de estado de cuenta por estudiante y curso

Se agrego impresion de estado de cuenta desde el modulo de Cartera, usando solo
la informacion de cuotas vencidas que ya carga esa pantalla.

Archivo modificado:

- `src/pages/CarteraVencidaAdmin.jsx`

Cambio:

- Se agrego un boton `Imprimir` por estudiante en la tabla.
- Se agrego un boton `Imprimir curso`, habilitado cuando hay un curso
  seleccionado y registros visibles.
- El impreso usa `DocumentoImprimible` para mantener encabezado, branding,
  margenes y boton de impresion unificado.
- El reporte se presenta como `Estado de cuenta`.
- El alcance visible del documento queda como `Cuotas vencidas`.
- El reporte individual del estudiante conserva fecha de corte, totales, deuda
  academica, inventario, mora, cuotas vencidas, conceptos academicos y
  ventas/cargos pendientes.
- El reporte de curso imprime una tabla compacta con estudiante y valor general
  adeudado.
- Al final del reporte de curso se muestran los totales de deuda academica,
  deuda de inventario y total general.
- El reporte de curso respeta los estudiantes visibles dentro del curso y los
  filtros activos de la pantalla.
- No se agregaron endpoints ni se modificaron calculos financieros; el impreso
  reutiliza la data actual de `/cartera/mora`.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Cartera vencida.
- Presionar `Imprimir` en un estudiante y validar el detalle.
- Seleccionar un curso y presionar `Imprimir curso`.
- Confirmar que `Volver` regresa a la tabla.
- En la vista imprimible, presionar `Imprimir` y revisar que el documento
  conserve encabezado, totales y tablas.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Documento visible en generar boletines

Se corrigio la columna `Documento` en la pantalla administrativa para generar
boletines.

Archivo modificado:

- `src/components/boletin/Boletin.jsx`

Cambio:

- Se agrego una funcion `documentoEstudiante` para leer el documento desde los
  nombres de campo usados por distintas respuestas del backend:
  `documento_identidad`, `documento`, `identificacion` o `cedula`.
- La tabla de estudiantes ahora muestra el documento aunque el endpoint no lo
  entregue como `documento_identidad`.
- La busqueda tambien incluye el documento normalizado.
- Se ajusto el placeholder de busqueda para indicar `documento` en lugar de
  `ID`.

Pruebas manuales recomendadas:

- Ir a Admin > Gestion Academica > Gestion Boletines.
- Confirmar que la columna `Documento` muestra el numero del estudiante.
- Buscar por documento y confirmar que el estudiante aparece.
- Generar un boletin para confirmar que el flujo no cambia.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK al relanzarlo con permisos elevados por el `EPERM`
  local conocido de Vite/fnm.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-05-25

Se creo/actualizo la carpeta `docs/` del frontend con documentacion del estado actual del proyecto.

Archivos documentados:

- `ARQUITECTURA_FRONTEND.md`
- `RUTAS_FRONTEND.md`
- `COMPONENTES.md`
- `ROLES_UI.md`
- `API_CLIENT.md`
- `ESTADO_SESION.md`
- `PRODUCCION_FRONTEND.md`
- `CAMBIOS_FRONTEND.md`

Alcance:

- Estructura de `src/`.
- Rutas actuales de React.
- Paginas existentes.
- Componentes principales.
- Consumo de API con Axios.
- Manejo de token.
- Manejo de roles en UI.
- Guards y rutas protegidas.
- Variables `.env` del frontend.
- Build con Vite.
- Riesgos pendientes observados.
- Preparacion actual para produccion.

No se modifico logica de la aplicacion.
No se modificaron componentes, paginas, servicios ni rutas.

## 2026-05-26

Se actualizo `src/pages/PlaneadorAnual.jsx`.

Cambio:

- Se agrego validacion antes de guardar el planeador anual.
- Si una fila tiene contenido escrito pero no tiene fecha seleccionada, el guardado se detiene.
- Se muestra un mensaje indicando la fila que necesita fecha.

Motivo:

- Evitar guardar planeadores con contenido academico sin fecha estimada.

Archivo modificado:

- `src/pages/PlaneadorAnual.jsx`

Pruebas manuales recomendadas:

- Escribir contenido en una fila y dejar la fecha vacia.
- Presionar `Guardar Planeador`.
- Confirmar que aparece el mensaje de fecha obligatoria.
- Seleccionar fecha y volver a guardar.
- Confirmar que el guardado funciona.

Verificacion:

- Se intento ejecutar `pnpm run build`, pero fallo por permisos locales `EPERM` en `AppData`.
- Se intento ejecutar Vite directo, pero fallo por `spawn EPERM` al cargar configuracion.
- El fallo observado corresponde al entorno local de PowerShell/pnpm/Vite, no a una validacion de negocio del codigo.

## 2026-05-26 - Logout contra backend

Se actualizaron los navbars de admin y profesor para cerrar sesion contra el backend.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`

Cambio:

- `handleLogout` ahora llama `POST /logout` usando el cliente `api`.
- Luego limpia `localStorage` y redirige a `/login`.
- Se conserva la limpieza anterior de `document.cookie` como compatibilidad para cookies no HttpOnly.

Motivo:

- El backend crea la cookie `token` como HttpOnly.
- Una cookie HttpOnly no puede ser eliminada por JavaScript.
- El logout correcto debe pedirle al backend que elimine la cookie.

Pruebas manuales recomendadas:

- Iniciar sesion como profesor.
- Confirmar que existe cookie `token`.
- Cerrar sesion desde el menu.
- Confirmar que la cookie `token` desaparece.
- Repetir el mismo flujo como admin.

Verificacion:

- Se intento ejecutar `pnpm run build`, pero fallo por permisos locales `EPERM` en `AppData`.
- Se verifico que ambos navbars importan `api` y llaman `api.post("/logout")`.

## 2026-05-26 - Token fuera de localStorage

Se endurecio el manejo de sesion del frontend para que el JWT no quede guardado en `localStorage`.

Archivos modificados:

- `src/components/LoginForm.jsx`
- `src/utils/api.js`

Cambio:

- `LoginForm` ya no guarda toda la respuesta del login en `localStorage`.
- Ahora solo guarda datos minimos de UI: `id`, `nombre`, `rol` y `tenant`.
- `api.js` ya no usa `access_token` guardado en `localStorage` como respaldo.
- Las peticiones siguen usando `withCredentials: true`, por lo que la cookie de sesion enviada por el backend viaja automaticamente.
- `Cookies.get("token")` queda solo como compatibilidad para cookies no HttpOnly usadas en desarrollo.

Motivo:

- Reducir el riesgo de robo de JWT por XSS.
- Mantener el token real en cookie HttpOnly manejada por el backend.
- Separar datos de UI de credenciales sensibles.

Pruebas manuales recomendadas:

- Cerrar sesion y volver a iniciar sesion como admin.
- Revisar DevTools > Application > Local Storage.
- Confirmar que `usuario` no contiene `access_token` ni `token_type`.
- Confirmar que existe la cookie `token`.
- Navegar por pantallas admin y confirmar que las llamadas API funcionan.
- Cerrar sesion y confirmar que la cookie `token` desaparece.
- Repetir el flujo como profesor y confirmar que `profesor` no contiene `access_token` ni `token_type`.

Verificacion:

- Se revisaron `src/components/LoginForm.jsx` y `src/utils/api.js`.
- Se intento buscar usos restantes de `access_token`/`token_type`, pero PowerShell mostro ruido local de permisos de `fnm`; no se observaron coincidencias funcionales en los archivos modificados.
- La compilacion con `pnpm run build` sigue bloqueada por permisos locales `EPERM` en `AppData`.

## 2026-05-26 - Crear Curso sin campos financieros

Se actualizo el formulario administrativo de crear/editar cursos para separar lo academico de lo financiero.

Archivo modificado:

- `src/components/CrearCurso.jsx`

Cambio:

- Se ocultaron/eliminaron del formulario los inputs:
  - `Matricula`;
  - `Mensualidad`;
  - `Meses`.
- El formulario ahora muestra datos academicos del curso:
  - `Nombre`;
  - `Jornada`.
- El payload ya no envia `matricula`, `mensualidad` ni `meses`.

Motivo:

- Los cobros se administran desde `Tipos de Pago`.
- Evitar que el admin configure valores financieros duplicados entre Crear Curso y Cartera.
- Alinear el formulario con el backend, donde Curso ya quedo como entidad academica.

Pruebas manuales recomendadas:

- Crear un curso nuevo desde Administracion > Crear Curso.
- Confirmar que solo pide nombre y jornada.
- Editar un curso existente y confirmar que no aparecen campos financieros.
- Ir a Tipos de Pago y asignar los cobros al curso.
- Confirmar que cartera/pagos calculan deuda desde Tipos de Pago.

Verificacion:

- Se reviso `src/components/CrearCurso.jsx`.
- No quedan estados, inputs ni payload de `matricula`, `mensualidad` o `meses`.

## 2026-05-26 - Nomina usa sueldo del profesor como salario base

Se ajusto el modal de pago de nomina para que el campo `Salario Base` se llene
automaticamente con el sueldo asignado al profesor.

Archivo modificado:

- `src/pages/NominaAdmin.jsx`

Cambio:

- Al abrir el modal `Realizar Pago`, `salarioBase` ya no queda vacio.
- Ahora toma `empleado.sueldo` recibido desde `/api/nomina/empleados`.
- Si el empleado no trae sueldo, usa `0` como valor seguro.

Motivo:

- Evitar que el admin tenga que volver a digitar manualmente el sueldo que ya se
  configuro al crear o editar el profesor.

Pruebas manuales recomendadas:

- Crear o editar un profesor con sueldo.
- Ir a Admin > Cartera > Gestion de Nomina.
- Abrir `Realizar Pago` para ese profesor.
- Confirmar que `Salario Base` muestra el sueldo asignado.
- Confirmar que el total neto se recalcula correctamente con bonos/descuentos.

## 2026-05-26 - Alerta clara para tipos de pago duplicados

Se ajusto la pantalla de Tipos de Pago para mostrar la causa real cuando el
backend rechaza un concepto duplicado.

Archivo modificado:

- `src/components/cartera/AdministrarTiposPago.jsx`

Cambio:

- En el guardado de conceptos, el `catch` ahora lee `error.response.data.detail`.
- Si el backend responde `409`, muestra una alerta de `Concepto duplicado`.
- Para otros errores, muestra el detalle del backend o un mensaje generico mas
  especifico.

Motivo:

- Evitar que el usuario vea "Error de conexion" cuando en realidad el concepto
  ya existe.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Tipos de Pago.
- Intentar crear un concepto con un nombre existente.
- Confirmar que la alerta diga que el concepto ya existe.
- Intentar editar un concepto usando el nombre de otro existente.

## 2026-05-26 - Normalizacion visual al crear profesor, curso y materia

Se agrego normalizacion en frontend para enviar nombres en formato titulo desde
el panel administrativo.

Archivos modificados:

- `src/components/CrearProfesor.jsx`
- `src/components/CrearCurso.jsx`
- `src/components/CrearMateria.jsx`

Cambio:

- Profesor:
  - `nombre` y `apellido` se envian con iniciales en mayuscula;
  - `email` se envia en minusculas.
- Curso:
  - `nombre` se envia con iniciales en mayuscula.
- Materia:
  - `nombre` se envia con iniciales en mayuscula.

Motivo:

- Mejorar consistencia visual en listados, boletines, reportes e impresos.
- Evitar guardar textos con mayusculas/minusculas desordenadas desde la UI.

Pruebas manuales recomendadas:

- Crear profesor escribiendo `juan carlos` y `perez`.
- Confirmar que se guarda/lista como `Juan Carlos Perez`.
- Crear curso y materia en minusculas.
- Confirmar que aparecen con iniciales en mayuscula.

## 2026-05-27 - Anular pagos desde historial del estudiante

Se agrego la accion de anulacion de pagos desde el historial de pagos del
estudiante y se ajusto el reporte de ingresos para mostrar la huella de pagos
anulados.

Archivos modificados:

- `src/pages/PagosAdmin.jsx`
- `src/pages/ReportesAdmin.jsx`

Cambio:

- En el historial de pagos del estudiante aparece `Anular pago` para pagos
  vigentes.
- Al anular, se pide motivo obligatorio.
- Los pagos anulados quedan visibles, marcados como `Anulado` y con el monto
  tachado.
- No se permite imprimir recibo de un pago anulado.
- En Reportes > Ingresos Mensuales/rango:
  - se muestran `Total valido` y `Total anulado`;
  - las filas anuladas se ven en rojo;
  - el motivo de anulacion aparece en el detalle.

Motivo:

- Evitar eliminacion fisica de pagos.
- Mantener trazabilidad financiera antes de implementar una pagina general de
  movimientos/auditoria.

Pruebas manuales recomendadas:

- Registrar un pago.
- Anularlo desde el historial con motivo.
- Confirmar que aparece en rojo como anulado.
- Abrir ingresos mensuales y confirmar que aparece como huella, pero no suma al
  total valido.

## 2026-05-27 - Anular ventas de inventario

Se agrego accion de anulacion en el listado de cargos recientes de ventas de
inventario.

Archivo modificado:

- `src/pages/VentasAdmin.jsx`

Cambio:

- Cada venta vigente muestra accion `Anular`.
- La anulacion pide motivo obligatorio.
- Una venta anulada queda marcada en rojo como `Anulada`.
- El motivo de anulacion se muestra debajo del detalle del cargo.
- El total aparece tachado cuando la venta esta anulada.

Motivo:

- Evitar eliminacion de ventas y conservar trazabilidad visual.
- Alinear ventas de inventario con la anulacion auditada de pagos.

Pruebas manuales recomendadas:

- Crear una venta/cargo de inventario.
- Anularla desde cargos recientes escribiendo motivo.
- Confirmar que queda marcada como `Anulada`.
- Confirmar que al recargar la pantalla se mantiene anulada.

## 2026-05-28 - Dashboard profesor: rankings por curso

Se ajustaron los cards del dashboard del profesor para mostrar informacion mas
util y filtrable sin depender solo del primer resultado.

Archivo modificado:

- `src/pages/DashboardProfesor.jsx`

Cambio:

- El card de inasistencias ahora muestra ranking por curso.
- Los cards de notas bajas y notas altas muestran listados, no solo un
  estudiante.
- Se agrego filtro por `Curso` y `Materia` para notas bajas y notas altas.
- Los botones de ranking detallado quedaron separados del card para evitar
  navegaciones accidentales.

Seguridad:

- El filtro por curso se envia al backend como `curso_id`.
- La autorizacion real queda en backend; la UI no decide permisos.

Pruebas manuales recomendadas:

- Entrar como profesor y revisar el dashboard.
- Cambiar el filtro entre `Todas las materias del curso` y una materia especifica.
- Confirmar que notas bajas/altas cambian segun el filtro.
- Confirmar que inasistencias muestra ranking por curso.
- Confirmar que el boton `Ver ranking por materia` sigue pidiendo seleccionar
  un salon/materia.

Correccion posterior:

- El filtro de rendimiento quedo en dos niveles:
  - `Curso`.
  - `Materia`: `Todas las materias del curso` o una materia especifica.
- `Todas las materias del curso` calcula el rendimiento usando solo las
  materias que ese profesor dicta en el curso seleccionado.

## 2026-05-30 - Aviso de tenant en mora

Se agrego un aviso global para tenants con estado `en_mora`.

Archivos modificados/agregados:

- `src/components/TenantStatusBanner.jsx`
- `src/App.jsx`

Cambio:

- El layout autenticado consulta `GET /tenant/status`.
- Si el backend responde `mostrar_aviso = true`, se muestra un banner superior
  indicando que el servicio esta en mora.
- Si el tenant esta `activo`, no se muestra ningun aviso.
- El aviso se renderiza una sola vez en el layout para admin y profesor.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Reportes dinamicos con card de egresos

Se rediseño la pantalla de reportes y estadisticas para mostrar indicadores
financieros mas claros y permitir detalle clickeable de egresos.

Archivos modificados:

- `src/pages/ReportesAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- Se agregaron cards de ingresos hoy, egresos hoy, balance hoy y balance
  general.
- El card de egresos es clickeable y carga el detalle desde
  `GET /reportes/egresos-rango`.
- Al cargar un detalle desde una card o boton de reportes, la pantalla baja
  automaticamente al panel de detalle.
- Se agrego comparacion mensual de ingresos, egresos y balance con barras
  visuales.
- El panel de detalle ahora alterna entre ingresos y egresos.
- Se mantuvo la busqueda por rango de fechas para ingresos y egresos.
- La pantalla usa un layout mas denso, moderno y orientado a lectura rapida.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Administracion como pestaña principal

Se ajusto la navegacion del admin para mejorar acceso a la pantalla de
administracion academica.

Archivos modificados:

- `src/components/NavAdmin.jsx`

Cambio:

- Se saco `Administracion` del dropdown `Gestion Academica`.
- Se agrego `Administracion` como pestaña principal junto a `Estudiantes`.
- El mismo ajuste se aplico al menu movil.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Certificados en Gestion Academica

Se agrego una pantalla administrativa para generar certificados de notas usando
el sistema de impresion existente.

Archivos modificados/agregados:

- `src/pages/CertificadosAdmin.jsx`
- `src/App.jsx`
- `src/components/NavAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/RUTAS_FRONTEND.md`
- `docs/COMPONENTES.md`

Cambio:

- Se agrego la ruta `/admin/certificados`.
- Se agrego `Certificados` dentro del menu `Gestion Academica`.
- La pantalla permite filtrar estudiantes por curso, estado, busqueda y periodo.
- Se agrego opcion `Todos los periodos`, que consulta P1 a P4 y presenta notas
  por periodo con promedio.
- El certificado toma nombre completo y documento desde la ficha del estudiante
  para evitar datos incompletos si el consolidado academico no los devuelve.
- Si una materia no trae definitiva directa, o recibe `0`, la pantalla calcula
  una nota de respaldo desde `detalles.notas_por_periodo` o `detalles.nota`,
  usando solo valores mayores que `0`.
- Al generar, consume `GET /boletines/admin/generar/{estudiante_id}/{periodo}`.
- El certificado se imprime con `DocumentoImprimible`, reutilizando el branding,
  encabezado, firmas y pie de pagina del diseno de impresos.

Pruebas manuales recomendadas:

- Entrar como admin.
- Ir a `Gestion Academica > Certificados`.
- Filtrar un curso, seleccionar periodo y generar certificado de un estudiante.
- Confirmar que aparece el certificado con tabla de materias, notas y desempeno.
- Presionar `Imprimir` y validar encabezado, datos institucionales y firmas.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Prestamos sin eliminar y filtro por profesor

Se ajusto la pantalla de prestamos para conservar trazabilidad financiera y
facilitar la revision por profesor.

Archivos modificados:

- `src/pages/PrestamosAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- Antes de registrar, el formulario valida profesor y monto mayor que 0.
- Antes de enviar al backend, muestra confirmacion con profesor, monto, fecha y
  aviso de que el prestamo no se puede eliminar; solo saldar.
- Se quito la accion `Eliminar`.
- Los prestamos pendientes solo muestran accion `Saldar`.
- Los prestamos pagados muestran estado saldado sin accion operativa.
- El historial permite filtrar por profesor usando
  `GET /api/prestamos/?profesor_id={profesor_id}`.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-01 - Cierre fase SaaS super admin

Se agregaron ajustes frontend para cerrar la primera fase de control SaaS.

Archivos modificados/agregados:

- `src/App.jsx`
- `src/components/LoginForm.jsx`
- `src/pages/CambiarPassword.jsx`
- `src/pages/SuperAdminDashboard.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/RUTAS_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`

Cambio:

- Si login responde `debe_cambiar_password = true`, el admin entra a
  `/cambiar-password`.
- Las rutas normales de admin redirigen a `/cambiar-password` hasta completar
  el cambio.
- `CambiarPassword` llama `POST /auth/cambiar-password` y actualiza
  `localStorage.usuario`.
- Crear colegio valida email y password temporal fuerte desde frontend.
- El panel de super admin muestra `estado` efectivo y, cuando difiere,
  `estado_manual`.

Verificacion ejecutada:

```powershell
pnpm run build
```

Resultado:

- Build de produccion OK.

## 2026-06-01 - Crear colegio desde super admin

Se agrego el formulario frontend para crear colegios desde el panel de
plataforma.

Archivos modificados:

- `src/pages/SuperAdminDashboard.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`

Cambio:

- Se agrego boton `Crear colegio`.
- El formulario pide colegio, codigo, admin inicial, password temporal, fecha
  de inicio, proximo pago, dias de gracia y notas.
- Al crear correctamente, el colegio aparece en la tabla de tenants.
- La tabla muestra proximo pago y dias de gracia.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-01 - Confirmacion, motivo e historial de estado SaaS

Se fortalecio el panel de super admin para que los cambios de estado tengan
motivo y puedan revisarse.

Archivos modificados:

- `src/pages/SuperAdminDashboard.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/CHECKLIST_PRODUCCION_FRONTEND.md`
- `docs/PLAN_EJECUCION_FRONTEND.md`

Cambio:

- Antes de cambiar estado se pide confirmacion.
- Para `suspendido` y `cancelado` el motivo es obligatorio.
- El motivo se envia al backend junto con el estado.
- Se agrego boton `Ver` para consultar historial de cambios por tenant.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-01 - Mensaje de login para tenant bloqueado

Se ajusto el formulario de login para no mostrar "Credenciales incorrectas"
cuando el colegio existe pero esta suspendido o cancelado.

Archivo modificado:

- `src/components/LoginForm.jsx`

Cambio:

- `401`: muestra credenciales incorrectas.
- `403`: muestra "Servicio no disponible" y el mensaje enviado por backend.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-05-30 - Panel inicial de super admin

Se agrego la primera pantalla de plataforma para controlar tenants.

Archivos modificados/agregados:

- `src/components/NavSuperAdmin.jsx`
- `src/pages/SuperAdminDashboard.jsx`
- `src/App.jsx`
- `src/components/LoginForm.jsx`
- `src/utils/api.js`
- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `docs/API_CLIENT.md`
- `docs/COMPONENTES.md`
- `docs/PRODUCCION_FRONTEND.md`
- `docs/ROLES_UI.md`
- `docs/RUTAS_FRONTEND.md`

Cambio:

- El mismo login soporta `rol = "super_admin"`.
- El super admin se guarda en `localStorage.super_admin`.
- Se agrego ruta `/super-admin`.
- El panel lista tenants y permite cambiar estado entre `activo`, `en_mora`,
  `suspendido` y `cancelado`.
- Logout y manejo global de `401` limpian tambien `localStorage.super_admin`.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estados de estudiantes y profesores

Se agrego control operativo por estado para estudiantes y profesores desde las
pantallas administrativas, alineado con el backend y sin borrado fisico.

Archivos modificados:

- `src/pages/EstudiantesAdmin.jsx`
- `src/components/CrearProfesor.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Estudiantes muestran `activo` por defecto.
- La pantalla de estudiantes permite filtrar `activo`, `retirado`, `egresado`,
  `inactivo` y `todos`.
- Se agrego cambio de estado de estudiante via
  `PATCH /estudiantes/{estudiante_id}/estado`.
- Profesores muestran `activo` por defecto.
- La pantalla de profesores permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego cambio de estado de profesor via
  `PATCH /profesores/{profesor_id}/estado`.
- El formulario de profesor permite crear/editar conservando estado.
- La UI muestra etiquetas de estado y trata la desactivacion como operativa, no
  como eliminacion de historial.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estado operativo de cursos

Se agrego control operativo por estado para cursos desde la pantalla
administrativa, alineado con el backend y sin borrado fisico.

Archivos modificados:

- `src/components/CrearCurso.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Cursos muestran `activo` por defecto.
- La pantalla de cursos permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego campo de estado al crear/editar curso.
- Se agrego cambio de estado de curso via `PATCH /cursos/{curso_id}/estado`.
- La UI muestra etiquetas de estado y trata la desactivacion como operativa, no
  como eliminacion de historial.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estado operativo de materias

Se agrego control operativo por estado para materias desde la pantalla
administrativa, alineado con el backend y sin borrado fisico.

Archivos modificados:

- `src/components/CrearMateria.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Materias muestran `activo` por defecto.
- La pantalla de materias permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego campo de estado al crear/editar materia.
- Se agrego cambio de estado de materia via
  `PATCH /materias/{materia_id}/estado`.
- La UI muestra etiquetas de estado y trata la desactivacion como operativa, no
  como eliminacion de historial.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Estado operativo de productos de inventario

Se agrego control operativo por estado para productos de inventario, alineado
con el backend y sin borrado fisico.

Archivos modificados:

- `src/pages/InventarioAdmin.jsx`
- `src/pages/VentasAdmin.jsx`
- `docs/API_CLIENT.md`
- `docs/PRODUCCION_FRONTEND.md`

Cambio:

- Productos muestran `activo` por defecto en inventario.
- La pantalla de inventario permite filtrar `activo`, `inactivo` y `todos`.
- Se agrego campo de estado al crear/editar producto.
- Se agrego cambio de estado de producto via
  `PATCH /inventario/{item_id}/estado`.
- La accion de eliminar en UI se reemplazo por desactivar para conservar
  historial de ventas.
- Ventas solo carga productos activos con stock.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Egresos filtrados por fecha y sin eliminar

Se ajusto la pantalla de egresos para mostrar por defecto solo los egresos del
dia actual y buscar por rango de fechas.

Archivos modificados:

- `src/pages/EgresosAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- El historial inicia filtrado por la fecha actual.
- Se agregaron campos `Desde` y `Hasta`.
- Se agrego boton `Buscar` para consultar el rango seleccionado.
- Se agrego boton `Hoy` para volver rapidamente al dia actual.
- Se quito la columna/accion `Eliminar`.
- Antes de registrar, el formulario valida concepto, categoria y monto mayor
  que 0.
- Antes de enviar al backend, muestra una confirmacion con concepto, monto,
  fecha y categoria.
- Si el backend rechaza el egreso, la alerta muestra el detalle de validacion
  recibido.
- Se agrego accion `Editar` solo para egresos manuales devueltos con
  `editable = true`.
- Al editar, se reutiliza el formulario, se pide confirmacion y se llama
  `PUT /api/egresos/{egreso_id}`.
- Los egresos automaticos, como nomina, se muestran sin accion editable.
- Al registrar un egreso, el listado se actualiza para la fecha del egreso
  registrado.

Verificacion ejecutada:

```powershell
pnpm run build
pnpm run lint
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Correccion de historial de egresos por fechas

Se corrigio la carga del historial en Control de Egresos y Gastos.

Archivo modificado:

- `src/pages/EgresosAdmin.jsx`

Cambio:

- El boton `Buscar` ahora envia correctamente `fecha_desde` y `fecha_hasta`
  seleccionadas por el usuario.
- La fecha por defecto ya no usa UTC; ahora se calcula con la fecha local del
  navegador.
- El boton `Hoy` tambien usa la fecha local.
- La respuesta de egresos se normaliza a lista para evitar fallos si el backend
  devuelve un formato inesperado.
- El total y el monto de la tabla convierten `monto` a numero antes de formatear.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Egresos.
- Confirmar que al entrar se muestran los egresos del dia local.
- Elegir un rango con egresos anteriores y presionar `Buscar`.
- Confirmar que el historial cambia al rango seleccionado.
- Presionar `Hoy` y confirmar que vuelve al dia actual.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Tipos de pago sin eliminar concepto

Se ajusto la pantalla de Tipos de Pago para que los conceptos de cobro no se
eliminen desde acciones.

Archivos modificados:

- `src/components/cartera/AdministrarTiposPago.jsx`
- `docs/API_CLIENT.md`

Cambio:

- Se quito el boton de eliminar concepto en la tabla de conceptos existentes.
- Se elimino la llamada frontend `DELETE /tipos-pagos/{id}` desde esa pantalla.
- El flujo operativo queda en crear, editar, configurar y cambiar estado
  `activo/inactivo`.
- La conservacion del concepto protege trazabilidad de cartera, pagos y reportes
  financieros.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Tipos de Pago.
- Confirmar que en `Conceptos Existentes` solo aparecen acciones de configurar
  y editar.
- Desactivar un concepto desde su configuracion y confirmar que queda como
  inactivo/borrador.
- Confirmar que los conceptos historicos siguen visibles al listar.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Alineacion de acciones en listado de profesores

Se ajusto el listado de profesores dentro de Administracion academica para que
la columna de acciones quede ubicada de forma consistente despues de ampliar el
layout global.

Archivo modificado:

- `src/components/CrearProfesor.jsx`

Cambio:

- La tabla de profesores ahora usa `table-fixed` y un ancho minimo controlado.
- Las columnas `Nombre`, `Email`, `Estado` y `Acciones` tienen anchos definidos.
- La columna `Acciones` queda alineada a la derecha.
- Los controles de estado y editar no hacen wrap en pantallas amplias.
- Nombre y email usan truncado con `title` para evitar que textos largos
  deformen la tabla.

Pruebas manuales recomendadas:

- Ir a Admin > Administracion > Profesores.
- Confirmar que la columna `Acciones` queda al extremo derecho del listado.
- Probar con profesores de nombres/emails largos.
- Revisar que en pantallas angostas la tabla mantenga scroll horizontal.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Ancho de generar boletines administrativos

Se ajusto la pantalla administrativa de generacion de boletines para que use el
ancho ampliado del layout global.

Archivo modificado:

- `src/components/boletin/Boletin.jsx`

Cambio:

- La vista de busqueda/listado para generar boletines dejo de usar
  `max-w-6xl mx-auto`.
- El listado de estudiantes y los filtros ahora pueden ocupar el ancho global
  disponible.
- No se modifico la vista del boletin generado ni `DocumentoImprimible`, para
  conservar el formato profesional de impresion.

Pruebas manuales recomendadas:

- Ir a Admin > Gestion Academica > Gestion Boletines.
- Confirmar que la pantalla de busqueda/listado aprovecha mas ancho.
- Generar un boletin y confirmar que la vista imprimible conserva su formato.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Revision de paginas amplias y asistencia profesor

Se revisaron las paginas operativas principales despues de ampliar el layout
global para detectar limites internos que seguian dejando pantallas pequeñas.

Archivos modificados:

- `src/pages/Asistencia.jsx`
- `src/components/AsistenciaRow.jsx`
- `src/pages/TiposPagosAdmin.jsx`

Cambio:

- `Asistencia.jsx` dejo de usar `max-w-4xl`, por lo que ahora aprovecha el
  ancho del layout global.
- `AsistenciaRow.jsx` se ajusto para verse mejor en ancho amplio y en movil:
  nombre truncado, contador de inasistencias y botones estables.
- `TiposPagosAdmin.jsx` dejo de limitar el modulo de conceptos a `max-w-4xl`.
- Estudiantes, Pagos, Reportes, Administracion e Inventario no tenian un
  `max-w` interno fuerte que bloqueara el nuevo ancho global.

Pruebas manuales recomendadas:

- Entrar como profesor y abrir Asistencia.
- Confirmar que la pagina ya no queda angosta y que las filas se ven ordenadas.
- Entrar como admin y revisar Tipos de Pago.
- Revisar Estudiantes, Pagos, Reportes, Administracion e Inventario para
  confirmar que el ancho global se aprovecha sin desordenar la UI.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Alineacion de navbars al ancho global

Se ajustaron las barras superiores y el banner SaaS para que coincidan con el
nuevo ancho global de la aplicacion.

Archivos modificados:

- `src/components/NavAdmin.jsx`
- `src/components/NavProfesor.jsx`
- `src/components/NavSuperAdmin.jsx`
- `src/components/TenantStatusBanner.jsx`

Cambio:

- Los contenedores internos pasaron de `max-w-6xl` a `max-w-[1600px]`.
- Se agrego `w-full` y el mismo padding responsive usado por el `main` global.
- Los menus moviles conservan el mismo ancho/padding para quedar alineados.
- No se cambiaron rutas, permisos ni logica de navegacion.

Pruebas manuales recomendadas:

- Iniciar sesion como admin y confirmar que navbar, banner y contenido quedan
  alineados.
- Repetir el flujo como profesor.
- Revisar super admin en `/super-admin`.
- Probar el menu movil en una pantalla angosta.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Ampliacion inicial del ancho global

Se ajusto el contenedor principal de la aplicacion para aprovechar mejor
pantallas grandes sin eliminar limites internos de paginas especificas.

Archivo modificado:

- `src/App.jsx`

Cambio:

- El `main` global paso de `max-w-6xl` a `max-w-[1600px]`.
- Se mantiene `mx-auto`, `w-full` y padding responsive.
- El cambio aplica al layout general y al layout de super admin.
- No se tocaron navbars ni paginas internas en este primer paso.

Pruebas manuales recomendadas:

- Abrir pantallas grandes como Estudiantes, Pagos, Reportes, Inventario y
  Administracion.
- Confirmar si el contenido gana ancho sin sentirse desordenado.
- Revisar una pantalla pequena para confirmar que el padding responsive se
  mantiene correcto.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-05 - Administracion admin con tabs superiores

Se rediseño la pagina `Admin.jsx` para eliminar el sidebar y dar todo el ancho
al contenido de los modulos academicos del perfil admin.

Archivo modificado:

- `src/pages/Admin.jsx`

Cambio:

- Se elimino el sidebar de la pagina de administracion academica.
- Se agregaron tabs superiores compactas para `Profesores`, `Cursos`,
  `Materias` y `Asignaciones`.
- El modulo `Profesores` queda cargado por defecto.
- El contenido del modulo usa el ancho completo disponible.
- En movil y tablet las tabs se desplazan horizontalmente.
- Se elimino la pantalla inicial de seleccion para evitar redundancia.
- Se conserva la carga lazy: cursos, materias y asignaciones se cargan solo
  cuando el usuario abre su tab.

Pruebas manuales recomendadas:

- Ir a Admin > Administracion.
- Confirmar que `Profesores` carga por defecto.
- Abrir Profesores, Cursos, Materias y Asignaciones.
- Confirmar que no aparece sidebar ni pantalla inicial de seleccion.
- Probar en una pantalla angosta y confirmar que el menu se desplaza
  horizontalmente.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.

## 2026-06-04 - Filtro operativo de tipos de pago por estado

Se mejoro la experiencia de Tipos de Pago para separar los conceptos activos de
los inactivos.

Archivos modificados:

- `src/components/cartera/AdministrarTiposPago.jsx`
- `src/pages/PagosAdmin.jsx`
- `docs/API_CLIENT.md`

Cambio:

- La tabla de conceptos muestra por defecto solo los activos.
- Se agrego filtro `Activos`, `Inactivos` y `Todos` con contador.
- Los conceptos inactivos se muestran atenuados cuando se consultan desde
  `Inactivos` o `Todos`.
- Al desactivar un concepto se confirma que no generara nuevos cobros y que las
  deudas/pagos existentes se conservan.
- Al reactivar un concepto se confirma que vuelve con su configuracion anterior
  sin generar cobros retroactivos automaticamente.
- `PagosAdmin` solo conserva conceptos activos como apoyo para nuevos pagos.
- Las deudas ya generadas siguen visibles y cobrables aunque su concepto haya
  sido desactivado.

Pruebas manuales recomendadas:

- Ir a Admin > Cartera > Tipos de Pago y confirmar que inicia en `Activos`.
- Desactivar un concepto y confirmar que sale del filtro `Activos`.
- Cambiar a `Inactivos` y confirmar que aparece atenuado.
- Reactivar el concepto y confirmar el aviso de no retroactividad.
- En Pagos, confirmar que las deudas pendientes del estudiante siguen visibles.

Verificacion ejecutada:

```powershell
pnpm run lint
pnpm run build
```

Resultado:

- Build de produccion OK.
- Lint sin errores.
- Permanecen 13 warnings conocidos de `react-hooks/exhaustive-deps`.
