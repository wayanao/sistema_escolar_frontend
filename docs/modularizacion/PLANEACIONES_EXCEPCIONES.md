# Cierre arquitectónico: excepciones de Planeaciones

## Control

- Estado: Terminado y verificado localmente; pendiente commit, publicación y
  validación manual en producción.
- Módulo: Planeaciones.
- Alcance: notificaciones compartidas e imágenes protegidas.
- Commit base: `c192e0222ab14998a008268bd1626ccac104fc13`.
- Rama de trabajo: `main`.
- Inicio: 2026-08-09.
- Finalización local: 2026-08-09.
- Commit final: Pendiente.

## Objetivo

Cerrar las excepciones que aparecieron después de la modularización de
referencia de Planeaciones, conservando diseño, textos, rutas, comportamiento,
frecuencias de actualización y contratos del backend.

## Alcance confirmado al iniciar

### Notificaciones

- `src/components/planeaciones/NotificacionesPlaneadores.jsx` combinaba
  transporte HTTP, estado remoto, polling, eventos del navegador, navegación y
  presentación.
- `src/utils/planeaciones/notificaciones.js` conservaba el nombre del evento
  local, pero también ejecutaba `window.dispatchEvent` desde una carpeta de
  utilidades puras.
- `src/hooks/planeaciones/useDetallePlaneacionAdmin.js` y
  `useObservacionesPlaneacionProfesor.js` emitían la actualización después de
  revisar, comentar o confirmar lecturas.

### Imágenes protegidas

- `src/components/ImagenProtegida.jsx` exportaba un hook, normalizaba rutas,
  ejecutaba HTTP con `responseType: "blob"` y administraba `object URLs`.
- Sus tres consumidores productivos pertenecen exclusivamente a Planeaciones:
  `PresentacionClaseProfesor`, `EvidenciasPlanProfesor` y
  `DetallePlaneacionAdmin`.

## Fuera de alcance

- Cambios de endpoints, payloads, roles, rutas o permisos.
- Cambios visuales de la campana o de las evidencias.
- Sustituir el evento local por Context, estado global o una dependencia nueva.
- Corregir comportamientos funcionales no relacionados.
- Modificar otros módulos.

## Contratos que no pueden cambiar

1. `GET /notificaciones/planeadores` conserva `limit: 20` para admin y
   `limit: 8` para profesor.
2. La carga inicial muestra estado de carga; polling, foco, visibilidad y evento
   local recargan silenciosamente.
3. El polling continúa cada 60 segundos y se limpia al desmontar.
4. Admin agrupa por `profesor_id` o nombre, suma `cantidad` y conserva la fecha
   más reciente; profesor conserva cada notificación individual.
5. Contadores, textos, rutas y query strings permanecen exactos.
6. El panel se cierra al navegar, pulsar Escape o hacer clic fuera y conserva su
   posicionamiento responsive actual.
7. Las imágenes HTTP se solicitan como `blob`; rutas absolutas conservan path y
   query, y rutas relativas normalizan barras y slash inicial.
8. Cada blob resuelto crea un `object URL`; al cambiar ruta o desmontar se revoca
   el URL anterior.
9. Los errores conservan sus mensajes y no publican resultados después del
   desmontaje.
10. Revisar, comentar o confirmar lecturas continúa solicitando una recarga de
    la campana.

## Arquitectura objetivo

- `utils/planeaciones/`: normalización, agrupación, formato y contratos puros.
- `services/planeacionesApi.js`: transporte de notificaciones e imágenes blob.
- `hooks/planeaciones/`: estado remoto, polling, ciclo de vida de blobs y
  sincronización del evento local.
- `components/planeaciones/`: vista de notificaciones y presentación existente
  de evidencias.
- Un conector mínimo puede unir hook, navegación y vista porque la campana se
  monta globalmente desde `App.jsx`; no se introducirá un Context sin necesidad.

## Capas

| Capa | Objetivo | Estado |
|---:|---|---|
| 0 | Contrato, inventario y caracterización | Completada |
| 1 | Utilidades puras | Completada |
| 2 | Transporte HTTP | Completada |
| 3 | Hooks y sincronización | Completada |
| 4 | Presentación y composición | Completada |
| 5 | Retiro de ubicaciones antiguas e integración | Completada |
| 6 | Cierre documental y verificación global | Completada |

## Riesgos

- Los temporizadores y eventos globales pueden producir recargas duplicadas si
  no se limpian con las mismas referencias.
- Una extracción incorrecta puede mostrar loading durante una recarga que hoy
  es silenciosa.
- La navegación depende del rol y de query strings cuyo orden está protegido.
- Los `object URLs` pueden filtrar memoria si se pierde su revocación, o dejar
  imágenes rotas si se revocan antes de tiempo.
- Los tests actuales de consumidores mockean `useImagenProtegida`; por eso la
  caracterización propia del hook es obligatoria antes de moverlo.
- El texto accesible actual usa `planeaciónes` al pluralizar. Es un defecto
  preexistente protegido como comportamiento observado; no se corregirá dentro
  de esta migración arquitectónica sin una decisión funcional separada.

## Capa 0 — Contrato y protección

### Línea base

- `main` coincide con `origin/main` en
  `c192e0222ab14998a008268bd1626ccac104fc13`.
- Working tree limpio al iniciar.
- Auditoría global inmediatamente anterior: 277 archivos y 1512 pruebas,
  ESLint y build de 375 módulos correctos.

### Trabajo de la capa

- Ampliar la caracterización de la campana para carga por rol, agrupación,
  navegación, estados y disparadores de recarga.
- Agregar caracterización propia de `useImagenProtegida` para normalización,
  blob, error y limpieza.
- Conservar la prueba del contrato del evento local.
- No modificar código productivo.

### Decisiones

- La caracterización se hace sobre resultados observables, incluso cuando
  conserva peculiaridades existentes, para evitar cambios funcionales ocultos.
- El evento local y su frecuencia permanecen como contratos; esta migración no
  introducirá Context ni estado global.
- Las funciones privadas se protegerán primero a través del componente y del
  hook actuales. Cada función pura tendrá pruebas unitarias adyacentes al ser
  extraída en la capa 1.
- La capa 0 no cambia código productivo ni comienza extracciones.

### Estado de entrega

- Última capa terminada: capa 0.
- Archivos productivos modificados: ninguno.
- Verificación específica:
  `pnpm exec vitest run src/components/planeaciones/NotificacionesPlaneadores.test.jsx src/components/ImagenProtegida.test.jsx src/utils/planeaciones/notificaciones.test.js`
  — 3 archivos y 11 pruebas correctas.
- ESLint específico:
  `pnpm exec eslint src/components/planeaciones/NotificacionesPlaneadores.test.jsx src/components/ImagenProtegida.test.jsx src/utils/planeaciones/notificaciones.test.js`
  — código de salida 0.
- Siguiente acción exacta: ejecutar únicamente la capa 1, extrayendo a
  `utils/planeaciones/` la normalización de rutas de imagen, el formato de
  fechas, la agrupación de notificaciones y la construcción de query strings
  como funciones puras con pruebas adyacentes. No mover todavía HTTP, estado,
  efectos, navegación ni presentación.

## Capa 1 — Utilidades puras

### Trabajo realizado

- Se creó `utils/planeaciones/imagenes.js` con la normalización pura de rutas
  vacías, `blob`, `data`, HTTP y relativas.
- Se creó `utils/planeaciones/notificacionesContratos.js` con el formato de
  momentos, la agrupación administrativa y la construcción exacta de las rutas
  y query strings de navegación.
- `ImagenProtegida.jsx` y `NotificacionesPlaneadores.jsx` consumen las nuevas
  funciones sin conservar copias locales.
- Se agregaron pruebas unitarias adyacentes para valores normales, fallbacks,
  casos inválidos, prioridades y orden de parámetros.
- No se movieron transporte HTTP, estado, efectos, eventos ni JSX.

### Decisiones

- Los contratos puros de notificaciones viven en
  `notificacionesContratos.js`, separados de `notificaciones.js`: este último
  todavía despacha un evento de navegador y se resolverá en la capa 3.
- Las funciones de navegación devuelven la ruta completa porque path, orden de
  parámetros y codificación forman un único contrato observable.
- La normalización de imágenes permanece dentro de Planeaciones; no se creó una
  abstracción compartida porque no hay un segundo dominio consumidor.
- Se conservaron literalmente fallbacks, localización `es-CO`, pluralización,
  nombres de parámetros y orden de query strings.

### Riesgos vigentes

- La carga HTTP continúa dentro de componentes hasta la capa 2.
- Estado, polling, eventos y ciclo de vida de blobs continúan mezclados hasta la
  capa 3.
- `utils/planeaciones/notificaciones.js` seguirá siendo una excepción temporal
  hasta extraer la sincronización del navegador.

### Estado de entrega

- Última capa terminada: capa 1.
- Pruebas específicas:
  `pnpm exec vitest run src/utils/planeaciones/imagenes.test.js src/utils/planeaciones/notificacionesContratos.test.js src/components/planeaciones/NotificacionesPlaneadores.test.jsx src/components/ImagenProtegida.test.jsx src/utils/planeaciones/notificaciones.test.js`
  — 5 archivos y 21 pruebas correctas.
- ESLint específico de las unidades y consumidores modificados: código de
  salida 0.
- No quedan implementaciones locales duplicadas de las transformaciones
  extraídas.
- Siguiente acción exacta: ejecutar únicamente la capa 2, agregando a
  `services/planeacionesApi.js` el GET de notificaciones con su `limit` actual y
  la descarga de imágenes con `responseType: "blob"`, con pruebas adyacentes;
  reemplazar en los consumidores el acceso directo a `utils/api` sin mover
  todavía estado, efectos, polling, eventos, ciclo de vida de blobs ni JSX.

## Capa 2 — Transporte HTTP

### Trabajo realizado

- Se agregó `listarNotificacionesPlaneadores(limit)` a
  `services/planeacionesApi.js`; conserva `GET /notificaciones/planeadores` y
  envía el límite recibido en `params`.
- Se agregó `descargarImagenPlaneacion(path)` al mismo servicio; conserva el
  path normalizado y `responseType: "blob"`.
- `NotificacionesPlaneadores.jsx` e `ImagenProtegida.jsx` dejaron de importar
  directamente `utils/api` y consumen las nuevas funciones de servicio.
- Se ampliaron las pruebas adyacentes de `planeacionesApi` antes de implementar
  los contratos nuevos.
- No se movieron estado, efectos, polling, eventos, ciclo de vida de blobs,
  navegación ni JSX.

### Decisiones

- El servicio recibe `limit` en lugar del rol. La decisión admin `20` o profesor
  `8` sigue en la capa de estado hasta extraerla al hook.
- La ruta llega normalizada al servicio: `utils` transforma y `services` se
  limita al transporte HTTP.
- Ambas funciones devuelven `response.data`, igual que el resto de
  `planeacionesApi`, y propagan los errores sin envolverlos ni cambiar sus
  payloads.
- No se agregaron señales, caché, reintentos ni opciones nuevas porque no forman
  parte del contrato actual.

### Riesgos vigentes

- Los componentes todavía administran estado y efectos; esa mezcla se resolverá
  exclusivamente en la capa 3.
- La descarga devuelve el blob al consumidor, que sigue siendo responsable de
  crear y revocar el `object URL` hasta mover ese ciclo de vida al hook.
- La sincronización por eventos del navegador continúa temporalmente en
  `utils/planeaciones/notificaciones.js` y en el componente de la campana.

### Estado de entrega

- Última capa terminada: capa 2.
- Pruebas específicas:
  `pnpm exec vitest run src/services/planeacionesApi.test.js src/utils/planeaciones/imagenes.test.js src/utils/planeaciones/notificacionesContratos.test.js src/components/planeaciones/NotificacionesPlaneadores.test.jsx src/components/ImagenProtegida.test.jsx src/utils/planeaciones/notificaciones.test.js`
  — 6 archivos y 29 pruebas correctas.
- ESLint específico de servicio, utilidades y consumidores: código de salida 0.
- El endpoint de notificaciones y `responseType: "blob"` productivos existen
  únicamente en `services/planeacionesApi.js`.
- Siguiente acción exacta: ejecutar únicamente la capa 3, creando hooks de
  Planeaciones para el estado, carga inicial y silenciosa, polling, foco,
  visibilidad y ciclo de vida de imágenes blob; mover también el despacho y la
  escucha del evento local fuera de `utils`, actualizar sus productores y
  consumidores con pruebas adyacentes. No separar todavía el JSX de la campana
  ni rediseñar su composición.

## Capa 3 — Hooks y sincronización

### Trabajo realizado

- Se creó `hooks/planeaciones/useNotificacionesPlaneadores.js` para estado
  remoto, carga inicial y silenciosa, normalización de respuesta, reintento,
  polling cada 60 segundos, foco, visibilidad y escucha del evento local.
- Se creó `hooks/planeaciones/useImagenProtegida.js` para descarga, estado,
  error, creación y revocación de `object URLs` y descarte después del
  desmontaje.
- Se creó `hooks/planeaciones/notificacionesPlaneadoresSync.js` para el comando
  que despacha el evento de actualización.
- El nombre del evento pasó a `utils/planeaciones/notificacionesContratos.js`
  como contrato puro.
- `useDetallePlaneacionAdmin` y `useObservacionesPlaneacionProfesor` consumen el
  comando nuevo; los tres consumidores de imágenes usan el hook nuevo.
- Se retiraron `components/ImagenProtegida.jsx` y
  `utils/planeaciones/notificaciones.js`, junto con sus pruebas antiguas, sin
  dejar reexportaciones de compatibilidad ni implementaciones duplicadas.
- `NotificacionesPlaneadores.jsx` conserva exactamente su JSX, navegación y
  comportamiento local del panel; ahora consume el hook de estado remoto.

### Decisiones

- La constante del evento permanece en `utils` porque es un contrato puro; su
  despacho y escucha viven en `hooks`, donde corresponden los efectos y
  comandos del navegador.
- `useNotificacionesPlaneadores` expone `cargar` para conservar el botón de
  reintento sin duplicar consultas en el componente.
- `useImagenProtegida` se movió directamente a su ubicación final porque todos
  sus consumidores pertenecen a Planeaciones y fueron actualizados en la misma
  capa; no se añadió un archivo puente obsoleto.
- Se conservaron las referencias exactas de listeners y temporizador durante la
  limpieza, así como la distinción entre carga inicial visible y recargas
  silenciosas.
- No se introdujeron Context, caché, estado global ni dependencias nuevas.

### Riesgos vigentes

- La campana todavía combina navegación, estado local de apertura, handlers y
  todo el JSX; la separación vista/conector corresponde a la capa 4.
- Las rutas y el cierre por navegación, Escape o clic exterior deben permanecer
  protegidos durante esa separación.
- Los previews locales de imágenes del formulario usan su propio ciclo de
  `object URLs`; no pertenecen al hook de imagen protegida y no se modificarán.

### Estado de entrega

- Última capa terminada: capa 3.
- Pruebas de hooks, sincronización, campana y productores: 6 archivos y 23
  pruebas correctas.
- Regresión de consumidores, página, servicio y utilidades: 7 archivos y 37
  pruebas correctas.
- Total específico de la capa: 13 archivos y 60 pruebas correctas.
- ESLint específico de hooks, productores, consumidores, servicio y utilidades:
  código de salida 0.
- No existen los cuatro paths antiguos ni referencias hacia ellos; despacho,
  escucha y ciclo de blob protegido tienen una sola implementación.
- Siguiente acción exacta: ejecutar únicamente la capa 4, extrayendo el JSX de
  la campana a un componente de presentación con pruebas adyacentes y dejando
  `NotificacionesPlaneadores.jsx` como conector mínimo entre hook, router,
  estado local del panel y handlers. Conservar clases, textos, accesibilidad,
  rutas y comportamiento; no cambiar todavía el montaje global ni iniciar el
  barrido final de integración.

## Capa 4 — Presentación y composición

### Trabajo realizado

- Se creó `components/planeaciones/NotificacionesPlaneadoresVista.jsx` con todo
  el marcado de campana, panel, estados, grupos administrativos, observaciones
  del profesor e iconos.
- La vista recibe datos, estado, ref y callbacks; no importa hooks, router,
  servicios ni APIs del navegador.
- `NotificacionesPlaneadores.jsx` quedó como conector entre el hook remoto,
  router, agrupación pura, estado local del panel, efectos de cierre y handlers
  de navegación.
- Se añadieron pruebas adyacentes de la vista para campana cerrada, límite `99+`,
  admin, profesor, loading, error, reintento y bandeja vacía.
- La prueba del conector ahora protege explícitamente cierre por Escape, clic
  exterior y cambio de ruta, además de rutas, polling y eventos existentes.
- El import y montaje global desde `App.jsx` permanecieron sin cambios.

### Decisiones

- Se conservó `NotificacionesPlaneadores.jsx` como punto público y conector para
  no modificar los contratos de composición de los navbars.
- El ref del contenedor se entrega a la vista porque delimita el DOM presentado,
  mientras el listener de clic exterior permanece en el conector.
- Los subcomponentes de grupo, observación e iconos siguen privados dentro de la
  vista porque no tienen un segundo consumidor real.
- El conector conserva estado local y efectos estrictamente asociados a la
  composición del panel; la vista es controlada y solo delega eventos.
- No se cambiaron clases, textos, orden visual, accesibilidad, rutas ni
  comportamiento responsive.

### Riesgos vigentes

- El conector conserva una rama administrativa individual heredada dentro de
  `abrirNotificacion`; la vista administrativa solo abre grupos. La capa 5 debe
  confirmar y retirar ese contrato residual si no existe otro consumidor.
- Falta el barrido estructural de imports, paths antiguos y dependencias directas
  antes de considerar estable la integración completa.
- La verificación global de lint y build continúa reservada para la capa 6.

### Estado de entrega

- Última capa terminada: capa 4.
- Pruebas directas de vista y conector: 2 archivos y 11 pruebas correctas.
- Regresión de montaje global, hook, sincronización, servicio, utilidades y
  productores: 7 archivos y 32 pruebas correctas.
- Total específico de la capa: 9 archivos y 43 pruebas correctas.
- ESLint específico de vista y conector: código de salida 0.
- La vista no contiene dependencias de estado, router, transporte o navegador;
  el conector no conserva marcado visual ni iconos.
- Siguiente acción exacta: ejecutar únicamente la capa 5, confirmar mediante
  inventario que la rama administrativa individual de `abrirNotificacion` y
  `crearRutaNotificacionAdmin` no tienen un consumidor real, retirarlas junto a
  su prueba si siguen huérfanas, y hacer el barrido de paths antiguos, accesos
  HTTP directos, eventos duplicados e integración de `App` y consumidores de
  imágenes. Ejecutar solo la regresión del módulo y detenerse antes de la
  verificación global de la capa 6.

## Capa 5 — Retiro residual e integración

### Trabajo realizado

- El inventario confirmó que la rama administrativa individual de
  `abrirNotificacion` no era alcanzable: la vista admin abre exclusivamente
  grupos y la vista profesor es la única que usa `onAbrirNotificacion`.
- Se retiraron esa rama, el parámetro `profesor`,
  `crearRutaNotificacionAdmin` y su prueba aislada.
- Se confirmó que la ruta administrativa observable por grupo y la ruta de
  observación del profesor permanecen protegidas y sin cambios.
- Se auditaron paths antiguos, accesos HTTP directos, endpoint y descarga blob,
  contrato y despacho del evento, consumidores de imágenes, frontera de la
  vista y montaje global por rol.
- Se ejecutó la regresión completa de componentes, hooks y utilidades de
  Planeaciones, servicio, páginas relacionadas y composición de `App`.

### Decisiones

- El contrato administrativo individual se eliminó porque no existía ningún
  evento de la vista capaz de invocarlo; mantenerlo habría dejado código muerto
  simulando una ruta soportada.
- No se añadieron compatibilidades ni redirecciones: los contratos reales de
  navegación ya están cubiertos por el conector y las utilidades restantes.
- Los tres consumidores productivos de `useImagenProtegida` permanecen en
  Planeaciones; no se generalizó el hook a otros dominios.
- Los previews locales del formulario y la peculiaridad accesible
  `planeaciónes` se conservaron por pertenecer a contratos distintos o
  preexistentes fuera de una corrección funcional autorizada.

### Resultado del barrido

- No existen `components/ImagenProtegida.jsx`,
  `utils/planeaciones/notificaciones.js` ni sus pruebas antiguas.
- No hay accesos directos a `utils/api`, `api`, `fetch` o `axios` desde
  componentes, hooks o utilidades de Planeaciones.
- El endpoint de notificaciones y `responseType: "blob"` aparecen
  productivamente solo en `services/planeacionesApi.js`.
- El nombre del evento vive en contratos puros; la escucha y el despacho viven
  una sola vez en hooks, y solo los dos productores previstos usan el comando.
- La vista no importa estado, router, servicios ni navegador.
- `App.jsx` conserva el mismo conector para admin y profesor.

### Estado de entrega

- Última capa terminada: capa 5.
- Baseline previo al retiro: 3 archivos y 18 pruebas correctas.
- Regresión completa de Planeaciones: 36 archivos y 138 pruebas correctas.
- ESLint del alcance completo de Planeaciones: código de salida 0.
- Siguiente acción exacta: ejecutar únicamente la capa 6, actualizar el estado
  final de la documentación específica y global, ejecutar
  `pnpm run check:deploy`, ejecutar `git diff --check`, revisar que el diff
  completo pertenezca solo a Planeaciones y su documentación, confirmar que no
  quedan implementaciones antiguas, duplicados ni directorios vacíos, y dejar
  pasos de verificación manual en producción y mensaje para el único commit.

## Capa 6 — Cierre documental y verificación global

### Trabajo realizado

- Se actualizó este documento, el estado del plan maestro y las referencias de
  Planeaciones en `ARQUITECTURA_FRONTEND.md`, `COMPONENTES.md` y
  `CAMBIOS_FRONTEND.md`.
- Se ejecutó la compuerta global completa de pruebas, lint y build.
- Se revisó el alcance de todos los archivos modificados y nuevos, incluidos
  los tests de consumidores y composición necesarios para proteger la
  migración.
- Se repitió el barrido de transporte directo, rutas antiguas, evento local,
  consumidores de imágenes, implementaciones duplicadas y carpetas vacías.

### Decisiones finales

- El módulo conserva un conector global de notificaciones porque integra el
  hook, React Router y el estado local del panel; el marcado reside en una vista
  presentacional separada.
- El evento continúa siendo local al navegador: su nombre es un contrato puro,
  mientras escucha y despacho permanecen en hooks. No se justificó introducir
  Context ni una dependencia nueva.
- `useImagenProtegida` permanece dentro de Planeaciones porque sus tres
  consumidores productivos pertenecen a este dominio. Los previews locales del
  formulario no son una implementación duplicada de descarga autenticada.
- El defecto accesible preexistente `planeaciónes` se conserva; corregirlo sería
  un cambio funcional separado de esta migración.

### Verificación final

- `pnpm run check:deploy`: correcto; 282 archivos y 1542 pruebas pasaron,
  ESLint no reportó errores y el build de producción transformó 379 módulos.
- `git diff --check`: correcto.
- El diff pertenece exclusivamente a Planeaciones, sus pruebas de integración
  y la documentación específica y global correspondiente.
- No existen los cuatro archivos antiguos retirados, no quedan imports hacia
  ellos, no hay implementaciones paralelas del transporte o del evento y no se
  encontraron directorios vacíos en las carpetas de Planeaciones auditadas.

### Riesgos y seguimiento

- No quedan riesgos arquitectónicos abiertos dentro del alcance acordado.
- Permanecen pendientes las operaciones que realizará el usuario: crear el
  único commit, publicar en `origin/main`, revisar el deploy y ejecutar la
  validación manual en producción.

### Verificación manual en producción

1. Iniciar sesión como admin en escritorio y móvil; abrir la campana, comprobar
   contador, agrupación por profesor, carga, vacío y reintento.
2. En móvil, abrir el panel y desplazar la página: debe acompañar al navbar y
   salir del viewport; Escape, clic exterior y navegación deben cerrarlo.
3. Abrir un grupo admin y confirmar la ruta
   `/admin/planeadores-clases?vista=todas&estado=pendiente&profesor_id=...`.
4. Revisar o comentar una planeación como admin y comprobar que la campana se
   actualiza sin mostrar nuevamente el loading inicial.
5. Iniciar sesión como profesor, abrir una observación y confirmar la ruta con
   `asignacion_id`, `fecha`, `plan_id` y `observaciones=1`; confirmar también la
   actualización al marcar la lectura.
6. Dejar la sesión abierta al menos 60 segundos y volver a enfocar o hacer
   visible la pestaña para validar las recargas silenciosas.
7. Abrir imágenes autenticadas desde presentación, evidencias del profesor y
   detalle admin; comprobar carga, ampliación, cambio de imagen y estado de
   error sin resultados obsoletos.

### Entrega

- Última capa terminada: capa 6.
- Siguiente capa pendiente: ninguna; el cierre arquitectónico está completo.
- Siguiente acción exacta: crear un único commit, hacer push a `origin/main`,
  esperar el deploy y ejecutar la verificación manual anterior.
- Mensaje sugerido para el único commit:
  `refactor(planeaciones): cerrar arquitectura de notificaciones e imágenes`.
