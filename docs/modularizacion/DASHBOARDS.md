# Modularización: Dashboards y rankings

## Control

- Estado: Terminado y publicado en `main`.
- Orden: 12.
- Riesgo inicial: Medio/alto.
- Flujo Git: `main` directo.
- Commit base: `a80cca4a9b2c1865147ec4a9e328aa2009fb7826`.
- Commit final: `8195b29` — `refactor(dashboards): modularizar dashboards y rankings`.
- Última actualización: 2026-08-08 (cierre del listado de defectos).

### Commits posteriores a la migración

Los defectos preexistentes que la migración conservó a propósito se atendieron
después, uno por commit, para que cada corrección sea reversible por separado:

| Commit | Defecto |
|---|---|
| `9d15b0c` | 1 — distinguir el fallo de red del dato en cero |
| `f5247fb` | 4 — descartar las respuestas superadas de las consultas |
| `651a049` | 7 — usar SweetAlert en los avisos del profesor |
| `a9189f0` | 2 y 3 — redirigir con el router en vez de recargar |
| `dd67002` | 5 — quitar la supresión de dependencias del efecto de cartera |

Los defectos 6 y 8 se aceptaron sin corregir, con su razón registrada al final
de este documento.

## Objetivo

Separar consultas agregadas, secciones independientes y presentación de los
dashboards por rol sin cambiar accesos, métricas ni navegación.

## Inventario confirmado en capa 0

### Dashboard de administrador

- `src/pages/AdminDashboard.jsx`, 343 líneas. Exporta el componente `Admin`.
- Contiene la tarjeta destacada de cartera vencida, los cuatro accesos
  principales, el saludo y el bloque de cumpleaños.
- Constantes locales: `formatMoney` (`es-CO`/`COP` sin decimales),
  `capitalizarInicial`, `dashboardCardStyles` (una hoja de estilos inyectada con
  `<style>` para la animación de las tarjetas) y el arreglo `cards`, declarado
  **dentro** del componente y por lo tanto recreado en cada render.

### Dashboard de administrador no enrutado

- `src/pages/DashboardAdmin.jsx`, 71 líneas.
- **No está referenciado por `App.jsx` ni por ningún componente del frontend.**
  Es una versión anterior y más simple del panel de administración, con tres
  tarjetas en lugar de cuatro y sin cartera ni cumpleaños.
- Se documenta aquí porque el inventario inicial del módulo lo incluía. La capa
  0 **no lo tocó** y **no le agregó caracterización**: escribir pruebas para
  código inalcanzable lo consolidaría en lugar de resolverlo. La decisión sobre
  su eliminación se registra más abajo.

### Dashboard del profesor

> **2026-11-10, rediseño:** arriba `EncabezadoPanelProfesor` (saludo, día,
> período de trabajo y cumpleaños); luego `HorarioDelDia` (un día a la vez,
> tarjetas `TarjetaClaseHorario` que entran a la clase: guardan `asignacionId`
> con `useEntrarAClaseProfesor` y abren Asistencia o Planilla), con su lógica
> pura en `utils/dashboards/horario.js` y la hora de Colombia en
> `utils/fechaColombia.js`; `useAhora` refresca la hora cada minuto para
> «Ahora / Siguiente». Debajo, «Cómo van tus estudiantes»: el filtro y las
> tres tarjetas sobre `TarjetaResultadoProfesor`. `useClasesProfesor` entrega
> `clasesPorDia` y `hayDosJornadas`; ya no tiene el filtro de jornada.
> Se borraron `HorarioSemanal`, `PanelJornada` y sus utilidades
> (`agruparHorarioPorJornada`, `obtenerJornadasVisibles`,
> `obtenerJornadasDisponibles`, `jornadaUnicaDe`, `obtenerEstiloHorarioDia`,
> `FILTRO_JORNADA_AMBAS`). Sin peticiones nuevas: todo sale de lo que ya se
> cargaba.

> **2026-11-09:** se quitó del panel la tarjeta «¿Con qué clase vas a
> trabajar?» (`ContextoTrabajoProfesor.jsx`) y el selector de planeaciones
> recientes (`usePlaneacionesRecientes`, `obtenerPlaneacionesRecientes` y sus
> utilidades). Cada pantalla elige su clase y su período arriba.
> `useContextoProfesor` quedó con la sesión y el saludo; `useClasesProfesor`
> ya no resuelve ni descarta una clase elegida. Las secciones de abajo que los
> mencionan son el registro de cómo era.

- `src/pages/DashboardProfesor.jsx`, 1005 líneas. Es el archivo más grande del
  módulo y la raíz de la ruta `/`.
- Reúne en un solo archivo: el contexto de trabajo (clase, período y fecha), el
  selector de planeaciones recientes con su caché, el horario semanal por
  jornada, el filtro de rendimiento por curso y materia, el ranking de
  inasistencias y las dos tarjetas de rendimiento con sus accesos a los
  rankings.
- Constantes locales: `DIAS_SEMANA`, `JORNADAS`, `JORNADA_ESTILOS`,
  `JORNADA_SELECTOR_ESTILOS`, `HORARIO_DIA_ESTILOS`, `HORARIO_DIA_ESTILO_BASE`.
- Ayudantes locales: `obtenerEstiloHorarioDia`, `obtenerOrdenDia`,
  `formatearHora12`, `ordenarPorHora`, `obtenerJornadaClase`,
  `capitalizarInicial` y `formatearFechaPlaneacion`.
- Nueve `useState`, seis `useMemo`, cuatro `useCallback`, cuatro `useEffect` y
  un `useRef` que sostiene la caché de planeaciones.

### Dashboard del super admin

- `src/pages/SuperAdminDashboard.jsx`, 431 líneas.
- Contiene el resumen por estado, la tabla de tenants, el alta de colegios y el
  cambio de estado con motivo y auditoría.
- Constantes locales: `ESTADOS`, `estadoStyles`, `estadosCriticos`.
- Ayudantes locales: `escapeHtml`, `todayIso` y `passwordErrors`.
- Es el único subdominio del módulo con comandos de escritura.

### Rankings del profesor

- `src/pages/RankingRendimiento.jsx`, 108 líneas. Exporta el componente
  `RankingBajoRendimiento`; el archivo y la ruta no llevan «bajo».
- `src/pages/RankingMejorRendimiento.jsx`, 112 líneas.
- Son dos páginas casi idénticas: mismo guardián, mismo origen de
  `asignacionId` y `periodo`, misma estructura de tabla y mismo botón de
  regreso. Cambian el endpoint, los colores, los textos, la insignia y el podio
  con medallas del ranking de mejores.

### Componente compartido

- `src/components/dashboard/CumpleanosSemana.jsx`, 118 líneas.
- Es el único componente presentacional que ya existía y el único elemento
  realmente compartido entre dos subdominios: lo usan el panel de admin y el del
  profesor, cada uno con su propio texto vacío.
- Calcula los días restantes y la edad contra el reloj del sistema mediante
  `obtenerInfoCumpleanos`, y ordena la lista antes de pintarla.

### Estado inicial del módulo

Al iniciar la migración el módulo eran siete archivos y 2188 líneas: seis
páginas —una de ellas inalcanzable— y un componente. No había hooks, servicios
ni utilidades propias, y **ninguno de los siete archivos tenía pruebas**.

### Entradas, roles y dependencias externas

- Rutas y guardianes en `src/App.jsx`:
  - `/` → `DashboardProfesor` bajo `ProtectedRoute` (admin o profesor).
  - `/dashboard-admin` → `AdminDashboard` bajo `AdminRoute`.
  - `/ranking-rendimiento` y `/ranking-mejor-rendimiento` bajo `ProtectedRoute`.
  - `/super-admin` → `SuperAdminLayout`, que monta `SuperAdminDashboard` bajo
    `SuperAdminRoute`. Es la única pantalla del módulo fuera del `Layout` común.
  - Las seis páginas enrutadas se cargan con `lazy`.
- Además del guardián de ruta, cuatro páginas repiten su propio control de
  acceso leyendo `localStorage`. Son dos capas de verificación superpuestas y
  las dos se conservan.
- Almacenamiento local que el módulo lee o escribe: `usuario`, `profesor`,
  `asignacionId` y `periodo`/`periodo_profesor_<id>` a
  través de `utils/periodoProfesor.js`.
- `src/utils/periodoProfesor.js` es una utilidad **transversal ya existente**,
  compartida con asistencia, planilla, boletines, malla curricular,
  planeaciones, observador y `Formulario`. El módulo la consume tal cual y no la
  mueve ni la modifica.
- `asignacionId` ya no lo escribe el panel: desde el 2026-11-09 lo eligen y
  escriben Planilla, Asistencia, Planeador anual y rankings. Asistencia
  arranca siempre en la fecha de hoy.
- Ningún otro módulo consume los endpoints `/dashboard/*`; son exclusivos de
  este módulo.
- Ninguna otra página importa estas seis, salvo `App.jsx`.

## Contratos HTTP inventariados

| Método | Ruta | Uso actual |
|---|---|---|
| `GET` | `/cartera/mora/resumen` | «Por cobrar este año», «Los 5 que más deben» y «Deuda por curso» del panel de admin (desde el 2026-11-11; antes, la tarjeta de cartera vencida). |
| `GET` | `/cartera/puntualidad` | «Pagan siempre a tiempo» y «Los que mejor pagan» del panel de admin (desde el 2026-11-11, paso 4). Sin parámetros; solo admin y solo lee. |
| `GET` | `/dashboard/cumpleanos/admin` con `params: { dias: 7 }` | Cumpleaños de la semana, vista admin. |
| `GET` | `/mis-clases/:profesorId` | Clases y horario del profesor. |
| `GET` | `/dashboard/inasistencias/:profesorId` | Ranking de inasistencias por curso. |
| `GET` | `/dashboard/cumpleanos/profesor/:profesorId` con `params: { dias: 7 }` | Cumpleaños de los cursos asignados. |
| `GET` | `/dashboard/notas-bajas/:profesorId` con `params: { curso_id, asignacion_id? }` | Estudiantes con bajo rendimiento. |
| `GET` | `/dashboard/notas-altas/:profesorId` con `params: { curso_id, asignacion_id? }` | Mejores estudiantes. |
| `GET` | `/dashboard/ranking/:asignacionId/:periodo` | Ranking de bajo rendimiento. |
| `GET` | `/dashboard/ranking-mejor/:asignacionId/:periodo` | Ranking de mejores estudiantes. |
| `GET` | `/super-admin/tenants` | Lista de colegios. |
| `POST` | `/super-admin/tenants` | Alta de colegio con su admin inicial. |
| `PATCH` | `/super-admin/tenants/:id/estado` | Cambio de estado con motivo. |
| `GET` | `/super-admin/tenants/:id/estado-auditoria` | Historial de cambios de estado. |
| `POST` | `/super-admin/tenants/:id/pagos` | Registrar el pago: mueve la fecha de próximo pago (desde el 2026-10-26). |

Son dieciséis contratos, protegidos por la caracterización de la página.
`POST /super-admin/tenants/:id/pagos` y `GET /cartera/puntualidad` se
agregaron después del cierre de la capa.

Contratos de escritura protegidos:

- Alta de colegio: `{ nombre, codigo, admin_nombre, admin_email, admin_password,
  fecha_inicio, fecha_proximo_pago, dias_gracia, notas }`. Nombre, admin y notas
  se recortan; `codigo` y `admin_email` se recortan **y** se bajan a minúsculas;
  `dias_gracia` viaja como número con respaldo `0`.
- Cambio de estado: `{ estado, motivo }` con el motivo recortado. `estado` es uno
  de `activo`, `en_mora`, `suspendido`, `cancelado`.

Capacidades del backend que el frontend **no** usa hoy y que no deben adoptarse
durante la migración:

- `dias` de los dos endpoints de cumpleaños acepta `0..31`; el frontend siempre
  envía `7`.
- `GET /plan-de-clases/:asignacionId` acepta además `fecha` y un `limit` de
  hasta `50`; el dashboard solo pide `limit: 5, offset: 0`.
- `curso_id` y `asignacion_id` de notas altas y bajas son opcionales en el
  backend; el dashboard nunca consulta sin `curso_id`.

## Invariantes

- Contenido y accesos según rol.
- Cumpleaños, inasistencias y rendimiento como secciones independientes.
- Rankings por curso.
- Estados parciales de carga y error.
- Navegación actual hacia los módulos.

### Invariantes precisadas en capa 0

#### Panel de administrador

- Sin `usuario` en almacenamiento, o con un rol distinto de `admin`, la página
  llama `navigate("/login")`, devuelve `null` y **no dispara ninguna consulta**.
- Las consultas son independientes (cartera, puntualidad y cumpleaños, cada
  una con su bandera `activo`). El fallo de una no afecta a las otras ni a las
  tarjetas. Desde el paso 4 (2026-11-11) son tres: se sumó
  `GET /cartera/puntualidad`.
- Orden de la maqueta Mosaico (paso 4, 2026-11-11): «Por cobrar este año» con
  «Pagan siempre a tiempo»; «Los 5 que más deben» con «Los que mejor pagan»;
  «Deuda por curso» con «Accesos rápidos»; el muro de cumpleaños al final.
- «Pagan siempre a tiempo» (anillo) y «Los que mejor pagan» (botones «Todo el
  colegio» / «Por curso»; al tocar un curso se abren ahí mismo sus mejores,
  con oro, plata y bronce; 5 cursos y «Ver los N cursos») solo pintan lo que
  manda el backend: qué es a tiempo, quién entra al ranking y el orden se
  deciden allá (`app/services/puntualidad.py`). Cargando
  (`Calculando quién paga a tiempo…`), error y «todavía no vence ninguna
  mensualidad» son estados distintos. El porcentaje va sin decimales y nunca
  dice 100 % si alguien se atrasó ni 0 % si alguien paga a tiempo. «Ocultar
  valores» no los toca: no tienen montos.
- Desde el 2026-11-11 (rediseño, paso 1) la cartera se reparte en tres
  tarjetas: «Por cobrar este año», «Los 5 que más deben» y «Deuda por curso».
  Cargando, error y cartera al día son estados distintos: mientras carga dicen
  `Cargando la cartera…` y un fallo nunca se lee como `Cartera al día`. La
  mora se resta de `total_academico` (el backend ya la incluye en la deuda de
  cada concepto) y `total_anios_anteriores` va aparte. «Cobrar» navega a
  `/admin/pagos` con `state: { estudiante_id }`. «Ocultar valores» tapa los
  montos con `$ •••••••` y no se guarda. Antes había una sola tarjeta de
  cartera vencida (`TarjetaCarteraVencida`, sin uso desde ese día).
- Los cuatro accesos conservan su orden y sus rutas: `/admin/pagos`,
  `/admin/estudiantes`, `/admin` y `/admin/reportes`.
- Desde el 2026-11-11 los accesos son `<button type="button">` y siguen
  respondiendo a `Enter` y espacio con su propio manejador; cualquier otra
  tecla no navega. La accesibilidad de teclado queda protegida.
- El saludo usa el primer nombre con la inicial en mayúscula y **no** baja el
  resto a minúsculas, a diferencia del panel del profesor.
- Desde el 2026-11-11 los cumpleaños van en `MuroCumpleanos` (ver «Muro de
  cumpleaños», abajo), al final del panel, con el texto
  `Esta semana no hay estudiantes activos de cumpleaños.`. Antes iban en
  `CumpleanosSemana`, que quedó sin uso.

#### Panel del profesor

- Sin `profesor` en almacenamiento la página ejecuta
  `window.location.href = "/login"` —una recarga completa, no una navegación de
  router— y no consulta nada.
- Al montar lanza tres consultas independientes: clases, inasistencias y
  cumpleaños. Cada una tiene su propio indicador de carga y ninguna bloquea a
  las demás.
- El selector de clases **deduplica** por curso y materia: la clave es
  `curso_id` —o `curso|jornada` si no hay `curso_id`— más la materia en
  minúsculas. Una asignación que aparece en varios días ocupa una sola opción.
- El horario semanal, en cambio, **no** deduplica: pinta cada franja.
- Cada opción se rotula `«materia - curso - icono jornada»`, con `☀` para mañana
  y `◐` para tarde.
- `obtenerJornadaClase` normaliza el texto de `jornada` sin tildes; si no
  reconoce «manan» ni «tarde», deduce la jornada por `hora_inicio`, con el corte
  en las 12:30.
- El filtro de jornada solo aparece cuando **ambas** jornadas tienen clases; con
  una sola se muestra una insignia. Elegir una jornada vacía revierte a mostrar
  las disponibles.
- El primer curso disponible se selecciona solo, y solo mientras no haya uno
  elegido. Los cursos se ordenan por nombre.
- Cambiar de curso devuelve la materia a `todas`.
- El rendimiento consulta notas bajas y altas **en paralelo**, con
  `{ curso_id }` y, solo si hay materia concreta, `{ asignacion_id }`.
- Sin curso seleccionado el rendimiento se vacía **sin llamar al backend**.
- Los dos botones de ranking navegan siempre: desde el 2026-11-09 la clase se
  elige en el propio ranking (antes exigían una clase elegida en el panel).
- Una inasistencia devuelta como objeto suelto —y no como arreglo— se envuelve
  en una lista de un elemento.
- Los promedios se pintan con `toFixed(2)` y el color del bajo rendimiento sale
  del campo `color` que envía el backend.
- El saludo capitaliza la inicial y **baja el resto a minúsculas**.
- Desde el 2026-11-11 los cumpleaños salieron del encabezado
  (`EncabezadoPanelProfesor` ya no los recibe) y van en `MuroCumpleanos`, al
  final del panel, con el texto `Esta semana no hay cumpleaños en tus cursos.`.

#### Muro de cumpleaños (admin y profesor, desde el 2026-11-11)

- `components/dashboards/MuroCumpleanos.jsx`: banderines con «CUMPLEAÑOS», la
  cinta «de la semana» y un globo por estudiante (`GloboCumpleanos`) con el
  día («Hoy», «Mañana», «Viernes 13»), el nombre, el curso y los años. Los
  datos salen de `globosDeCumpleanos` (`utils/dashboards/cumpleanos.js`); sin
  peticiones nuevas.
- Los de hoy (hasta `MAX_GLOBOS_SUELTOS = 3`) son `GloboDeHoy`: esperan 1,4 s
  meciéndose en el muro, se sueltan y pasean sin parar por una curva cerrada al
  azar dentro de lo que se ve (`useGloboSuelto` + `utils/dashboards/globos.js`,
  con `offset-path` y `element.animate`). Van en un portal fijo a la pantalla,
  con `z-20`: por debajo del encabezado del celular (`z-40`), la barra de abajo
  (`z-30`) y los menús (`z-50`). Solo el globo recibe clics; al tocarlo o
  pasarle el ratón se zarandea. En el muro queda su silueta con «¡Salió a
  volar!». Sin `offset-path`, sin `element.animate` (como en las pruebas) o con
  «reducir movimiento», se queda en el muro.
- Colores de fiesta sin rosado ni azul (`PALETAS_GLOBO`): la ficha del
  estudiante no guarda si es niña o niño.
- La letra gótica (Grenze Gotisch) se pide a Google Fonts al aparecer el muro
  (`useFuenteGotica`, como `useFuentesLogin`); mientras llega, letra con
  serifa. Estilos y movimientos en `src/index.css` (`muro-fiesta`,
  `letra-gotica`, `globo-flotar`, `globo-vaiven`, `globo-meneo`).

#### Panel del super admin

- La lista se consulta al montar y cada carga limpia el error anterior.
- El resumen cuenta por estado con `suspendido` como respaldo cuando el tenant
  no trae `estado`, y `total` suma siempre.
- La fila muestra `Sin fecha` cuando no hay próximo pago, `0 dias` cuando no hay
  `dias_gracia`, y la línea `Manual: <estado>` solo cuando el estado manual
  difiere del calculado.
- El selector de estado se compara contra `estado_manual || estado`: elegir el
  estado manual vigente **no** abre confirmación ni envía nada, aunque el estado
  calculado sea otro.
- `suspendido` y `cancelado` exigen motivo: icono `warning`, etiqueta
  `Motivo obligatorio`, botón rojo `#dc2626` y un validador que rechaza el texto
  en blanco. Los demás estados usan `question`, `Motivo opcional` y verde.
- El éxito reemplaza la fila con la respuesta del backend; el error avisa y deja
  la tabla intacta.
- El historial vacío avisa con `Sin historial`; el historial con filas se pinta
  como HTML dentro del diálogo, **escapando** fecha, estados, motivo y
  responsable.
- El alta valida en este orden: campos obligatorios, formato de correo, reglas
  de contraseña, formato del código, fechas completas, orden de las fechas y
  días de gracia no negativos.
- Las reglas de contraseña se acumulan en un solo mensaje: mínimo 10 caracteres,
  una mayúscula, una minúscula y un número.
- El colegio creado se **agrega al final** de la lista en memoria; no se
  reordena ni se vuelve a consultar.
- El error de creación muestra `detail` solo cuando es una cadena; en cualquier
  otro caso usa el texto genérico.

#### Rankings

- Desde el 2026-11-09 la clase y el período se eligen **en el propio ranking**
  (`useClaseRankingProfesor` + `SelectorClaseTrabajo` dentro de
  `SeleccionClaseRanking`), con las mismas claves de `localStorage` que el
  panel, Planilla y Asistencia. No se ofrece la «Asistencia diaria» de
  preescolar. `useRankingProfesor(consulta, { asignacionId, periodo })` recibe
  la elección de la página y descarta respuestas de una elección anterior.
- Sin `profesor` redirigen a `/login` sin consultar.
- Sin clase elegida ya no avisan ni vuelven a `/`: piden elegirla
  (`AvisoSinClaseElegida`).
- Mientras cargan pintan el círculo giratorio debajo del selector.
- Un fallo de la consulta deja la lista vacía: la pantalla muestra el mismo
  estado vacío que cuando no hay estudiantes. No hay estado de error.
- El ranking de mejores marca el podio con `🥇 1`, `🥈 2`, `🥉 3` y numera al
  resto; el de bajo rendimiento numera desde `1` sin medallas.

#### Cumpleaños de la semana

- Ordena por días restantes y desempata por nombre completo.
- Quien no tiene fecha válida se ordena al final con un peso de `999` y no
  recibe etiqueta.
- Las etiquetas son `Hoy`, `Mañana` y `En N días`, con `· Cumple N años` cuando
  la edad es positiva.
- Carga, error y vacío se excluyen en ese orden: con `loading` no se pinta la
  lista aunque haya datos, y con `error` tampoco.
- El contador del encabezado muestra `Consultando...` mientras carga y
  `«N en D días»` después.
- Los respaldos son `Estudiante` para el nombre y `Sin curso` para el curso.

## Riesgos iniciales

- Son tres subdominios relacionados, pero con contratos y roles diferentes.
- Bloquear todo el dashboard por el fallo de una sección.
- Duplicar consultas agregadas.
- Cambiar permisos al extraer tarjetas o accesos.

## Riesgos y decisiones registrados en capa 0

### Defectos preexistentes que se conservan

Se conservan tal cual, igual que en inventario y en nómina. Se documentan aquí
para atenderlos en commits separados **después** de cerrar el módulo.

- **Un fallo de red se ve igual que un dato en cero.** Es el riesgo más
  importante del módulo y aparece **cinco** veces:
  - si `/mis-clases/:id` falla, el selector muestra `Sin clases asignadas`, el
    horario `No tienes clases con horario asignado todavía` y el filtro
    `Sin cursos asignados`;
  - si `/cartera/mora/resumen` falla, la tarjeta muestra `Cartera al día`;
  - si `/dashboard/inasistencias/:id` falla, se lee `No hay datos disponibles`;
  - si notas bajas o altas fallan, se lee `No hay estudiantes con...`;
  - si un ranking falla, se lee el estado vacío con su emoji de celebración.
  En los cinco casos el error solo llega a `console.error`. La caracterización
  fija este comportamiento para que cualquier cambio futuro sea deliberado.
  El de `/mis-clases/:id` es el más dañino porque **encadena**: sin clases no hay
  cursos, y sin cursos el filtro de rendimiento ni siquiera consulta, así que un
  solo fallo apaga tres secciones del panel del profesor a la vez.
- **`DashboardAdmin.jsx` es código muerto.** No lo enruta `App.jsx` ni lo
  importa nadie. Convive con `AdminDashboard.jsx`, que sí está enrutado y hace
  más cosas. Los nombres casi idénticos son una trampa de mantenimiento.
- **Tres páginas redirigen con `window.location.href`** en lugar de usar el
  router: el panel del profesor y los dos rankings. Provoca una recarga completa
  de la aplicación.
- **`AdminDashboard` navega durante el render.** El guardián llama a `navigate`
  en el cuerpo del componente, no en un efecto. Funciona hoy, pero es un efecto
  secundario en fase de render.
- **Cancelación inconsistente.** Solo el efecto de cumpleaños del panel de admin
  y el de planeaciones recientes usan bandera `activo`. Las demás consultas
  pueden asignar estado después de desmontar.
- **El efecto de cartera silencia `react-hooks/exhaustive-deps`** con un
  `eslint-disable` y depende de `usuario`, que se recalcula en cada render.
- **La caché de planeaciones recientes nunca se invalida.** Vive en un `useRef`
  indexado por asignación, sin expiración, durante toda la vida de la página.
  Su alcance real es más estrecho de lo que parece: crear una planeación exige
  navegar a `/plan-de-clases`, y ese cambio de ruta desmonta
  `DashboardProfesor`, así que al volver la caché ya no existe y se vuelve a
  consultar. La ventana de datos viejos se limita a otra pestaña, otro
  dispositivo, o un cambio del administrador mientras el profesor mantiene el
  panel abierto. Queda registrado como defecto de baja gravedad.
- **`crearColegio` lee sus valores del DOM** con `document.getElementById`
  dentro de `preConfirm`. Es el mayor obstáculo de extracción del módulo: la
  validación y el payload están acoplados al diálogo.
- **El panel del profesor y los rankings usan `window.alert`** mientras el resto
  del sistema ya migró a SweetAlert.
- **`cards` se declara dentro del componente** en el panel de admin, así que el
  arreglo y sus objetos se recrean en cada render.

### Decisiones de alcance

- Se ejecutará **un solo ciclo de módulo** con cuatro secuencias internas por
  subdominio —admin, profesor, super admin y el componente compartido—, en
  archivos separados. Comparten el ciclo y la verificación, no las reglas.
- La convención física prevista, siguiendo el módulo de referencia, es
  `utils/dashboards/`, `services/dashboardsApi.js`, `hooks/dashboards/` y
  componentes de presentación por subdominio.
- **Queda pendiente decidir la carpeta de componentes.** Ya existe
  `src/components/dashboard/` en singular, con `CumpleanosSemana.jsx` dentro. La
  alternativa es reutilizarla o crear `components/dashboards/` y mover el
  componente. Se decide en la capa 5; mover un archivo hoy solo generaría ruido
  en el diff.
- **No se fusionan contratos entre roles.** Admin, profesor y super admin no
  comparten endpoints, ni forma de respuesta, ni permisos.
- **Los dos rankings sí son candidatos reales a compartir presentación.** Son
  casi idénticos y viven en el mismo subdominio, así que no violan la regla de
  «dos o más dominios». La decisión concreta —un componente de tabla con props o
  dos componentes hermanos— se toma en la capa 5, con la caracterización de las
  dos páginas como red de seguridad.
- `CumpleanosSemana` ya es compartido con uso real en dos subdominios y se
  conserva como está.
- **Tres contratos ya tienen transporte en servicios de otros módulos, y las
  llamadas son idénticas**, a diferencia de lo que ocurrió en nómina con
  `/profesores`:
  - `GET /mis-clases/:id` → `planeacionesApi.listarClasesProfesor(profesorId)`;
  - `GET /plan-de-clases/:id` con `{ limit, offset }` →
    `planeacionesApi.listarHistorialPlanesProfesor(asignacionId, { limit, offset })`;
  - `GET /cartera/mora/resumen` → `carteraTiposPagoApi.obtenerResumenCarteraVencida()`.
  Como los argumentos del cliente Axios coinciden exactamente, reutilizarlas
  **no** rompería la caracterización. El precedente del proyecto es que cada
  módulo posea su transporte; aquí hay un argumento verificable en contra. La
  decisión se cierra en la capa 2 y se documentará con su razón.
- **La eliminación de `DashboardAdmin.jsx` no se ejecuta todavía.** Es la única
  candidata a borrado del módulo y su eliminación es un cambio de inventario, no
  una extracción. Se propondrá en la capa 6 o 7, con la comprobación de que
  ninguna ruta ni importación lo alcanza, y solo con autorización explícita.
- `utils/periodoProfesor.js` no se toca: es transversal, ya está fuera de las
  páginas y lo usan siete módulos.
- No se abrieron ni se modificaron `App.jsx`, `NavAdmin.jsx`, `NavProfesor.jsx`,
  `NavSuperAdmin.jsx`, `planeacionesApi.js` ni `carteraTiposPagoApi.js`.
- La capa 0 solo agregó caracterización y documentación; **no cambió una sola
  línea de código de producción**, ni rutas, textos, diseño o payloads.

### Notas sobre el entorno de pruebas

- `window.location` es reemplazable en el `jsdom` de este proyecto —su descriptor
  es `configurable`—, así que las tres redirecciones duras sí quedaron
  caracterizadas sustituyendo el objeto y restaurándolo después.
- `CumpleanosSemana` depende del reloj, así que su prueba fija la fecha del
  sistema con `vi.setSystemTime`. Es el primer archivo del repositorio que usa
  temporizadores simulados en una prueba de componente.
- `crearColegio` no se puede ejercer por la interfaz porque SweetAlert está
  simulado y su diálogo no existe. La caracterización captura el `preConfirm` de
  la llamada, monta en el documento los mismos campos que el diálogo pintaría y
  lo ejecuta. Así quedan protegidos el payload y las siete validaciones sin
  depender de la librería.
- El formato de fecha `es-CO` con mes corto produce `5 de ago de 2026` en el ICU
  de Node de este entorno; las pruebas fijan ese texto.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-08-07) |
| 1. Utilidades puras | Terminada (2026-08-07) |
| 2. Servicio HTTP | Terminada (2026-08-07) |
| 3. Hooks de consulta | Terminada (2026-08-08) |
| 4. Hooks de comandos | Terminada (2026-08-08); No aplica en los otros tres subdominios |
| 5. Presentación | Terminada (2026-08-08) |
| 6. Composición | Terminada (2026-08-08) |
| 7. Cierre | Terminada (2026-08-08) |

## Verificación de capa 0

- Antes de modificar: rama `main`, árbol limpio y `HEAD` en
  `a80cca4a9b2c1865147ec4a9e328aa2009fb7826`.
- No existía un hash contradictorio en este documento: el commit base estaba
  marcado para registrarse al iniciar y quedó fijado al `HEAD` publicado.
- No había pruebas previas del módulo que ejecutar: los siete archivos no tenían
  ninguna.
- Línea base del repositorio antes de la capa: 209 archivos y 883 pruebas
  correctas.
- Verificación específica final:
  `pnpm exec vitest run src/pages/AdminDashboard.test.jsx src/pages/DashboardProfesor.test.jsx src/pages/SuperAdminDashboard.test.jsx src/pages/RankingRendimiento.test.jsx src/pages/RankingMejorRendimiento.test.jsx src/components/dashboard/CumpleanosSemana.test.jsx`
  — 6 archivos, 78 pruebas correctas.
- Caracterización nueva: 12 pruebas del panel de admin, 24 del panel del
  profesor, 20 del super admin, 8 del ranking de bajo rendimiento, 7 del de
  mejores y 7 del componente de cumpleaños.
- Protegen los catorce contratos HTTP con sus rutas, parámetros y payloads; los
  cuatro guardianes de acceso; la independencia de las secciones ante un fallo;
  la deduplicación del selector de clases; la agrupación del horario por jornada
  y su filtro; la deducción de jornada por hora; la persistencia del contexto de
  trabajo y el descarte de la clase obsoleta; la selección automática del primer
  curso y el reinicio de la materia; la caché de planeaciones recientes; la
  navegación a la planeación en modo presentación; los dos guardianes de los
  rankings; el resumen por estado del super admin; la comparación contra el
  estado manual; el motivo obligatorio; el escapado del historial; las siete
  validaciones del alta; y el orden, las etiquetas y los estados de
  `CumpleanosSemana`.
- ESLint específico sobre los siete archivos del módulo y las seis
  caracterizaciones: correcto.
- `git diff --check`: correcto.
- `git status` solo muestra los seis archivos de prueba nuevos. Ningún archivo
  de producción fue modificado.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 1

### Unidades extraídas

- `src/utils/dashboards/cumpleanos.js`: el rango de días, los parámetros de la
  consulta, la normalización de la respuesta, el mensaje de error compartido,
  el nombre completo del estudiante, el cálculo de días, edad y etiqueta, y el
  ordenamiento de la lista.
- `src/utils/dashboards/admin.js`: los cuatro accesos principales, la ruta de
  cartera vencida, el formato de moneda, la capitalización del saludo, el
  guardián de rol, la regla de mora, el texto del resumen de mora y la tecla de
  activación de las tarjetas.
- `src/utils/dashboards/profesor.js`: días de la semana, jornadas, los valores
  `todas` y `Ambas`, los parámetros de planeaciones recientes, las rutas de los
  dos rankings, los tres mensajes del subdominio, el orden de los días, el
  formato de 12 horas, la deducción de jornada, la capitalización propia, los
  nombres del profesor, el formato de fecha de planeaciones, el formato de
  promedio, las cuatro normalizaciones de respuesta, la deduplicación de clases,
  el armado del horario, los cursos y materias del filtro, sus nombres visibles,
  la agrupación por jornada y por día, el filtro de jornadas, los parámetros de
  rendimiento, la búsqueda de planeación, la ruta de presentación y la etiqueta
  del podio.
- `src/utils/dashboards/superAdmin.js`: los estados, el escapado de HTML, la
  fecha del día, las reglas de contraseña, la normalización de la lista, el
  resumen por estado, el estado manual, la exigencia de motivo, el texto de
  confirmación, el validador del motivo, los dos payloads, la normalización y
  validación del alta, el mensaje de error del backend y el HTML del historial.
- Las utilidades no realizan HTTP, no usan React ni DOM, no acceden a
  almacenamiento y no disparan efectos.

### Dependencias del reloj

Siguiendo el precedente de `obtenerFechaLocal` en nómina, las dos funciones que
dependían del reloj lo reciben por parámetro obligatorio:

- `obtenerInfoCumpleanos(fechaNacimiento, ahora)` y `ordenarCumpleanos(lista,
  ahora)`.
- `fechaIsoDeHoy(ahora)`, que sustituye a `todayIso()`.

`CumpleanosSemana` calcula `new Date()` **una vez por render** y lo pasa a las
dos llamadas, en lugar de leer el reloj dentro de cada comparación y cada
tarjeta como hacía antes. El resultado visible es idéntico: solo un render que
cruzara la medianoche podría distinguirlos, y ahora el componente es coherente
consigo mismo dentro de un mismo render.

### Lo que se quedó fuera a propósito

- **Los mapas de clases de Tailwind.** `JORNADA_ESTILOS`,
  `JORNADA_SELECTOR_ESTILOS`, `HORARIO_DIA_ESTILOS`, `HORARIO_DIA_ESTILO_BASE`,
  `obtenerEstiloHorarioDia`, `estadoStyles` y la hoja `dashboardCardStyles`
  siguen en las páginas. Son presentación y corresponden a la capa 5, igual que
  `claseEstadoPrestamo` en el módulo de referencia.
- **La lectura de los campos del diálogo del super admin.** `leerCamposTenant()`
  se quedó en la página porque toca el DOM. Lo que sí se extrajo es lo que viene
  después: normalizar los valores crudos y validarlos. Con eso, `preConfirm`
  pasó de 45 a 9 líneas y las siete validaciones quedaron cubiertas por pruebas
  unitarias, que es donde sí se pueden ejercer sin SweetAlert.
- **El HTML del formulario de alta**, que sigue como plantilla dentro de
  `crearColegio`. Se mueve con el comando en la capa 4.
- **`ACCESOS_ADMIN` sí salió**, aunque lleve colores, porque es un catálogo de
  navegación constante. Además dejó de recrearse en cada render, que era uno de
  los defectos registrados en la capa 0; el resultado visible no cambia.

### Decisiones de alcance

- **Los dos rankings comparten archivo de utilidades con el panel del profesor.**
  Solo se alcanzan desde él, dependen de su `asignacionId` y de su período, y
  `formatearPromedio` es exactamente el mismo contrato en las tres pantallas:
  `Number(valor).toFixed(2)`. Aquí sí se unificó, a diferencia de nómina, donde
  las dos formas de formatear diferían de verdad y unificarlas habría cambiado
  el comportamiento de una pantalla.
- **Las dos `capitalizarInicial` no se unificaron.** La del admin conserva el
  resto del nombre tal como llega y la del profesor lo baja a minúsculas.
  Fusionarlas cambiaría un saludo visible. Cada subdominio conserva la suya y
  las dos tienen prueba propia.
- **`cumpleanos.js` es el único archivo compartido entre subdominios**, y lo es
  porque la sección ya estaba compartida por dos páginas antes de la migración.
  No se creó ninguna otra abstracción común.
- Los textos de estado vacío de cumpleaños siguen en el JSX de cada página: son
  presentación específica de cada panel, no un contrato. El mensaje de error sí
  se extrajo, porque las dos páginas lo escribían idéntico en su manejador.
- `PARAMETROS_PLANEACIONES_RECIENTES` se exporta como constante porque solo se
  pasa a Axios como `params` y nadie la modifica.
- `validarTenantNuevo` devuelve una cadena vacía cuando todo es válido, y
  conserva el orden exacto de las siete comprobaciones.
- No se tocaron `App.jsx`, los tres componentes de navegación,
  `utils/periodoProfesor.js`, `planeacionesApi.js` ni `carteraTiposPagoApi.js`.
- No se movieron endpoints, efectos, rutas ni componentes, y ningún defecto
  preexistente se corrigió: el fallo de red sigue viéndose como un dato en cero,
  las redirecciones duras siguen ahí y la caché de planeaciones sigue sin
  invalidarse.

### Verificación de capa 1

- Pruebas unitarias nuevas: 12 de admin, 13 de cumpleaños, 42 del profesor y 31
  del super admin.
- Suite específica completa:
  `pnpm exec vitest run src/utils/dashboards/ src/pages/AdminDashboard.test.jsx src/pages/DashboardProfesor.test.jsx src/pages/SuperAdminDashboard.test.jsx src/pages/RankingRendimiento.test.jsx src/pages/RankingMejorRendimiento.test.jsx src/components/dashboard/CumpleanosSemana.test.jsx`
  — 10 archivos, 176 pruebas correctas.
- **Las 78 caracterizaciones de la capa 0 pasaron sin modificarse**, que es la
  prueba de que la extracción conservó el comportamiento.
- Suite completa del repositorio: 219 archivos y 1059 pruebas correctas. Cuadra
  con la línea base: 209 + 10 archivos y 883 + 176 pruebas, es decir que el
  módulo agregó exactamente su propia suite y no alteró ninguna otra.
- ESLint específico sobre las cinco páginas, sus caracterizaciones, el
  componente y las cuatro utilidades con sus pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las cinco páginas y el componente no
  quedan `toFixed`, `Array.isArray`, `parseInt`, `localeCompare`, `reduce(`,
  `URLSearchParams`, `toLocaleUpperCase`, `toISOString`, `Intl.` ni
  `escapeHtml`. La única aparición restante de `new Map()` es la caché de
  planeaciones recientes, que es estado y corresponde a la capa 3.
- Tamaño de los archivos: `AdminDashboard.jsx` 343 → 301 líneas,
  `DashboardProfesor.jsx` 1005 → 931, `SuperAdminDashboard.jsx` 431 → 357 y
  `CumpleanosSemana.jsx` 118 → 86. Los dos rankings crecen —108 → 112 y
  112 → 117— por su bloque de importaciones; la reducción real corresponde a las
  capas 3 a 6.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 2

### Servicio HTTP

- `src/services/dashboardsApi.js` centraliza los catorce contratos
  inventariados, agrupados por subdominio: los dos del panel de admin, los seis
  del panel del profesor, los dos rankings y los cuatro del super admin.
- Las catorce funciones devuelven `response.data`. Ninguna página del módulo
  comprueba el código HTTP, así que exponer `status` habría sido añadir una
  interfaz sin consumidor.
- El servicio no atrapa errores, no decide mensajes, no usa React y no
  transforma payloads. Los errores de Axios se propagan intactos para que
  `mensajeErrorCrearTenant` siga leyendo `response.data.detail`.
- Las consultas con filtro reciben el objeto de parámetros ya construido por las
  utilidades de la capa 1 —`construirParametrosCumpleanos`,
  `construirParametrosRendimiento` y `PARAMETROS_PLANEACIONES_RECIENTES`— y solo
  lo envuelven en `{ params }`.
- Las dos consultas sin parámetros —el resumen de cartera y los dos rankings—
  llaman a `api.get(url)` con un solo argumento, exactamente como antes.

### Decisión sobre los tres contratos que ya existían en otros servicios

La capa 0 registró que tres contratos ya tenían transporte fuera del módulo y
que, a diferencia de lo ocurrido en nómina con `/profesores`, las llamadas eran
**idénticas**, así que reutilizarlas no habría roto la caracterización:

- `GET /mis-clases/:id` → `planeacionesApi.listarClasesProfesor`;
- `GET /plan-de-clases/:id` → `planeacionesApi.listarHistorialPlanesProfesor`;
- `GET /cartera/mora/resumen` → `carteraTiposPagoApi.obtenerResumenCarteraVencida`.

Se decidió **poseer el transporte** en el servicio del módulo. Las razones:

- Es el criterio que ya aplican los cuatro módulos cerrados: `pagosApi.js` con
  `/estudiantes`, `carteraTiposPagoApi.js` con `/cursos`,
  `inventarioVentasApi.js` con `/estudiantes` y `nominaEgresosPrestamosApi.js`
  con `/profesores`. Romper la convención en el módulo 12 obligaría a explicar
  por qué en cada revisión posterior.
- Reutilizar crearía una dependencia de los dashboards hacia servicios que
  pertenecen a otros dominios. Un cambio de firma en
  `listarHistorialPlanesProfesor` —que hoy recibe `{ limit, offset }`— rompería
  el panel del profesor sin que ninguna prueba de planeaciones lo advirtiera.
- El costo real de no reutilizar son nueve líneas de transporte.
- El argumento en contra sigue siendo válido y queda registrado: el plan maestro
  permite compartir cuando el contrato es común y hay dos dominios usándolo. Se
  eligió la consistencia con el resto del proyecto y el menor acoplamiento, no
  la ausencia de duplicación.

Los dos consumos de otro dominio llevan comentario explícito en el servicio, y
`obtenerResumenCarteraParaDashboard` lleva además el sufijo que ya usó nómina
con `obtenerProfesoresParaPrestamos`, para dejar claro que es una lectura de
apoyo y no la puerta de entrada al dominio de cartera.

### Integración conservada

- `AdminDashboard.jsx` conserva sus dos efectos independientes, la bandera
  `activo` del efecto de cumpleaños, el `console.error` silencioso de cartera y
  el `eslint-disable` del efecto con dependencias vacías.
- `DashboardProfesor.jsx` conserva las tres consultas del montaje, el
  `Promise.all` del rendimiento, el cortocircuito sin curso, la caché de
  planeaciones recientes y su bandera `activo`.
- `SuperAdminDashboard.jsx` conserva el `Promise` único de carga, el alta que
  agrega al final de la lista sin reordenar, el reemplazo de la fila actualizada
  y los cuatro diálogos.
- Los dos rankings conservan sus guardianes, el estado de carga y el estado
  vacío ante error.
- Ninguna página, componente ni utilidad del módulo importa ya `utils/api.js`.
- No se añadieron parámetros, señales de cancelación ni rutas nuevas: las
  capacidades del backend que el frontend no usa —`dias` distinto de 7, el
  parámetro `fecha` y el `limit` de hasta 50 de planeaciones, y las consultas de
  rendimiento sin `curso_id`— siguen sin implementarse.

### Verificación de capa 2

- `src/services/dashboardsApi.test.js` agrega 8 pruebas que cubren los catorce
  contratos, sus métodos, rutas, parámetros, payloads, datos devueltos y la
  propagación de errores.
- Suite específica completa:
  `pnpm exec vitest run src/services/dashboardsApi.test.js src/utils/dashboards/ src/pages/AdminDashboard.test.jsx src/pages/DashboardProfesor.test.jsx src/pages/SuperAdminDashboard.test.jsx src/pages/RankingRendimiento.test.jsx src/pages/RankingMejorRendimiento.test.jsx src/components/dashboard/CumpleanosSemana.test.jsx`
  — 11 archivos, 184 pruebas correctas.
- **Las 78 caracterizaciones de la capa 0 volvieron a pasar sin modificarse**:
  siguen simulando `utils/api.js`, que ahora alcanzan a través del servicio.
- Suite completa del repositorio: 220 archivos y 1067 pruebas correctas, es
  decir 209 + 11 y 883 + 184 respecto de la línea base.
- ESLint específico sobre páginas, caracterizaciones, componente,
  utilidades/pruebas y servicio/prueba: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que ninguna página, componente ni utilidad del
  módulo importa `utils/api.js`, llama a Axios ni contiene cadenas de endpoint.
  Las únicas apariciones restantes son la ruta de navegación
  `/plan-de-clases?...` en `utils/dashboards/profesor.js` —que es una URL del
  router, no del backend— y un comentario en `utils/dashboards/superAdmin.js`.
- Tamaño de las páginas: `AdminDashboard.jsx` 301 → 300 líneas,
  `DashboardProfesor.jsx` 931 → 938, `SuperAdminDashboard.jsx` 357 → 360,
  `RankingRendimiento.jsx` 112 → 111 y `RankingMejorRendimiento.jsx` 117 → 116.
  Las dos que crecen lo hacen por su bloque de importaciones del servicio; la
  reducción real corresponde a las capas 3 a 6.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 3

### Un hook por sección, no uno por página

La entrega de la capa 2 anunciaba un solo hook de consultas para el panel del
profesor. Al abrirlo se optó por **un hook por sección**, que es además la
granularidad que ya usan administración académica —once hooks— e inventario:

- `useDashboardAdmin`: usuario, resumen de cartera y cumpleaños del admin.
- `useContextoProfesor`: identidad del profesor, su guardián y el contexto de
  trabajo —clase, período y fecha— con su persistencia.
- `useClasesProfesor`: clases, horario semanal, filtro de jornada y todas las
  derivaciones del selector.
- `useInasistenciasProfesor`, `useCumpleanosProfesor`,
  `useRendimientoProfesor` y `usePlaneacionesRecientes`: las otras cuatro
  secciones del panel del profesor.
- `useTenants`: lista, resumen y recarga del super admin.
- `useRankingProfesor`: las dos páginas de ranking.

La razón es la invariante central del módulo: cada sección debe poder fallar o
cargar sin bloquear a las demás. Con un hook por sección esa independencia deja
de ser una convención dentro de un archivo grande y pasa a ser una frontera real
que las pruebas pueden ejercer por separado.

### El hook compartido de rankings

- `useRankingProfesor(consultarRanking)` recibe la función del servicio y
  concentra el guardián, la lectura de `asignacionId` y período, el estado de
  carga y el manejo del error. Las dos páginas solo cambian la consulta.
- Es un hook compartido dentro de un mismo subdominio, no entre dominios: los
  dos rankings pertenecen al profesor y solo se alcanzan desde su panel. La capa
  0 ya lo había registrado como candidato real.
- Con eso, `RankingRendimiento.jsx` bajó de 111 a 74 líneas y
  `RankingMejorRendimiento.jsx` de 116 a 82.
- El hook **no** devuelve `navigate`: cada página llama a `useNavigate()` para su
  propio botón «Volver al Dashboard», porque la navegación de la pantalla es
  composición.

### Invariantes conservadas

- El panel de admin mantiene sus dos efectos separados: cartera sin bandera de
  cancelación y con su `eslint-disable`, cumpleaños con bandera `activo`. La
  inconsistencia es la que ya existía y sigue documentada.
- El panel del profesor conserva el orden de arranque —clases, inasistencias,
  cumpleaños—, porque los efectos se ejecutan en el orden en que se declaran los
  hooks. El guardián queda en `useContextoProfesor`, que se declara primero.
- `descartarAsignacionInvalida` sigue comparando contra `localStorage` y no
  contra el estado, igual que antes. Vive en `useContextoProfesor` y
  `useClasesProfesor` la invoca al terminar su carga: así el dueño del contexto
  sigue siendo quien lo modifica.
- La caché de planeaciones recientes conserva su `useRef` y su ausencia de
  invalidación; sigue registrada como defecto preexistente.
- Inasistencias y rendimiento conservan su error silencioso; cumpleaños conserva
  su error como estado visible. Los tres comportamientos llevan comentario en su
  hook para que la diferencia sea deliberada.
- `useTenants` expone `agregarTenant` y `reemplazarTenant(tenantId, actualizado)`
  en lugar de un `setTenants` crudo. El segundo recibe el identificador de la
  fila editada, no el de la respuesta, que es exactamente lo que hacía la página.
- `useRendimientoProfesor` expone `cambiarCurso`, que ya incluye el reinicio de
  la materia a «todas»; la página dejó de componer esa regla.
- No se añadieron cancelación, descarte de respuestas antiguas, debounce ni
  paginación donde no existían.
- Los hooks solo importan el servicio y las utilidades del módulo; ninguno conoce
  Axios ni endpoints.

### Setters crudos que se conservan

`setFiltroJornada` y `setMateriaFiltro` siguen expuestos tal cual: el control
produce el valor y la página solo lo pasa, sin inventar semántica. Es el mismo
criterio que la capa 6 de inventario aplicó a `setEstadoFiltro`.

### Verificación de capa 3

- Pruebas nuevas por hook: 6 de `useDashboardAdmin`, 6 de `useTenants`, 8 de
  `useContextoProfesor`, 8 de `useClasesProfesor`, 4 de
  `useInasistenciasProfesor`, 4 de `useCumpleanosProfesor`, 8 de
  `useRendimientoProfesor`, 6 de `usePlaneacionesRecientes` y 5 de
  `useRankingProfesor`. En total 9 archivos y 55 pruebas.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/dashboards/ src/services/dashboardsApi.test.js src/utils/dashboards/ src/pages/AdminDashboard.test.jsx src/pages/DashboardProfesor.test.jsx src/pages/SuperAdminDashboard.test.jsx src/pages/RankingRendimiento.test.jsx src/pages/RankingMejorRendimiento.test.jsx src/components/dashboard/CumpleanosSemana.test.jsx`
  — 20 archivos, 239 pruebas correctas.
- **Las 78 caracterizaciones de la capa 0 volvieron a pasar sin modificarse.**
- Suite completa del repositorio: 229 archivos y 1122 pruebas correctas, es
  decir 209 + 20 y 883 + 239 respecto de la línea base.
- ESLint específico sobre páginas, caracterizaciones, componente,
  utilidades/pruebas, hooks/pruebas y servicio/prueba: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las cinco páginas **no queda ningún**
  `useEffect`, `useCallback`, `useMemo` ni `useRef`. El único `useState` que
  sobrevive es `savingId` en el super admin, que es progreso de un comando y
  corresponde a la capa 4.
- Tamaño de las páginas: `AdminDashboard.jsx` 300 → 252 líneas,
  `DashboardProfesor.jsx` 938 → 728, `SuperAdminDashboard.jsx` 360 → 342,
  `RankingRendimiento.jsx` 111 → 74 y `RankingMejorRendimiento.jsx` 116 → 82.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 4

### No aplica en tres de los cuatro subdominios

El panel de administración, el del profesor y los dos rankings son de **solo
lectura**: no tienen formularios de dominio, ni guardado, ni eliminación, ni
confirmaciones. Sus únicos controles editables —clase, período, fecha, curso,
materia y jornada— son filtros y contexto de consulta, y ya viven en los hooks
de la capa 3. Para ellos esta capa se marca como **No aplica**.

El super administrador es el único subdominio con escrituras, y es el que se
migró aquí.

### Alta de colegios

- `src/hooks/dashboards/useAltaTenant.js` es propietario del diálogo, de la
  lectura de sus campos, del `preConfirm`, del alta remota y de los dos avisos de
  resultado.
- Recibe `agregarTenant` del hook de consulta, así que la regla queda legible en
  una línea: el colegio creado se agrega al final de la lista, sin reordenar ni
  volver a consultar.
- `leerCamposTenant()` se quedó en el hook porque toca el DOM. Es la única
  función del módulo que lo hace, y está aislada en trece líneas junto al
  comando que la necesita.
- Conserva el orden completo: validar antes de confirmar, cortar en
  `showValidationMessage` con el primer mensaje, y solo entonces enviar.

### Cambio de estado y auditoría

- `src/hooks/dashboards/useEstadoTenant.js` es propietario de `savingId`, del
  cambio de estado con su motivo y de la consulta del historial.
- Las dos acciones giran alrededor del mismo dato —el estado de un colegio y su
  rastro— así que comparten hook, igual que `useComandosPrestamos` reunió el alta
  y el saldado en el módulo de nómina.
- `verHistorial` es técnicamente una lectura, pero se comporta como un comando:
  se dispara desde un botón por fila, no alimenta ninguna sección de la pantalla
  y su resultado vive y muere dentro de un diálogo. Por eso está aquí y no en la
  capa 3.
- Conserva que elegir el estado manual vigente no abre confirmación ni envía
  nada, el motivo obligatorio de `suspendido` y `cancelado`, el reemplazo de la
  fila por el identificador de la fila editada, y que un error deja la tabla
  intacta.

### El marcado del diálogo se movió a utilidades

- `htmlFormularioTenant(hoy)` quedó en `utils/dashboards/superAdmin.js`, junto a
  `htmlHistorialTenant`, que ya vivía ahí desde la capa 1.
- Son los dos constructores de marcado de diálogo del subdominio, los dos son
  funciones puras y los dos tienen prueba unitaria. Dejar uno en utilidades y el
  otro incrustado en el hook habría sido una asimetría sin razón.
- Su prueba fija los nueve identificadores, que son el contrato que después lee
  `leerCamposTenant`. Si alguien renombra un campo, la prueba lo detecta antes de
  que el payload viaje incompleto.

### Límites de esta capa

- `SuperAdminDashboard.jsx` bajó de 342 a **152 líneas** y ya no contiene
  `useState`, `Swal`, `document.getElementById`, payloads, validaciones ni
  mensajes. Lo que queda es JSX y el enlace de hooks con la vista.
- Los avisos siguen en SweetAlert, con los mismos textos, iconos, colores,
  temporizadores y anchos. No se cambió ninguno.
- El módulo completo ya no tiene `window.alert` salvo los dos guardianes del
  profesor —el del panel y el de los rankings—, que están en hooks de consulta y
  siguen registrados como defecto preexistente.

### Verificación de capa 4

- `useAltaTenant.test.js`: 6 pruebas para el formulario con sus fechas del día,
  la cancelación, el payload normalizado, el bloqueo por formulario inválido, el
  alta completa con su aviso y el detalle de error del backend.
- `useEstadoTenant.test.js`: 9 pruebas para los dos casos sin confirmación, el
  motivo obligatorio, el motivo opcional, el guardado con motivo recortado, la
  cancelación, el error, el historial vacío, el historial escapado y su error de
  carga.
- Pruebas unitarias nuevas: 2 para `htmlFormularioTenant`.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/dashboards/ src/services/dashboardsApi.test.js src/utils/dashboards/ src/pages/AdminDashboard.test.jsx src/pages/DashboardProfesor.test.jsx src/pages/SuperAdminDashboard.test.jsx src/pages/RankingRendimiento.test.jsx src/pages/RankingMejorRendimiento.test.jsx src/components/dashboard/CumpleanosSemana.test.jsx`
  — 22 archivos, 256 pruebas correctas.
- **Las 78 caracterizaciones de la capa 0 volvieron a pasar sin modificarse**,
  incluidas las que ejercen el `preConfirm` capturado del diálogo.
- Suite completa del repositorio: 231 archivos y 1139 pruebas correctas, es
  decir 209 + 22 y 883 + 256 respecto de la línea base.
- ESLint específico sobre páginas, caracterizaciones, componente,
  utilidades/pruebas, hooks/pruebas y servicio/prueba: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en `SuperAdminDashboard.jsx` no queda
  `useState`, `Swal` ni `document.getElementById`.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 5

### Decisión sobre la carpeta de componentes

- `src/components/dashboard/` pasó a `src/components/dashboards/` con `git mv`,
  y `CumpleanosSemana.jsx` y su prueba viajaron dentro.
- La razón es la convención del proyecto: la carpeta de componentes lleva el
  nombre del módulo, como `components/inventarioVentas/` o
  `components/nominaEgresosPrestamos/`. Las otras tres capas del módulo ya usan
  el plural —`utils/dashboards/`, `hooks/dashboards/` y `dashboardsApi.js`—, así
  que dejar el singular habría fijado una asimetría permanente.
- El movimiento es interno al módulo, así que no invade otro dominio.

### Los componentes se anidan por rol

La primera versión de esta capa dejó los catorce componentes planos, siguiendo a
`components/nominaEgresosPrestamos/`. Se corrigió antes de cerrar la capa: el
precedente cercano no es nómina sino el **módulo de referencia**, que separa
`components/planeaciones/admin/` y `components/planeaciones/profesor/`.
`administracionAcademica` anida en cinco subcarpetas, y `certificadosImpresion` y
`estudiantesObservador` usan exactamente la forma que este módulo necesita: lo
compartido en la raíz y lo específico de cada rol en su subcarpeta.

Nómina tenía siete componentes y tres subdominios; dashboards tiene catorce y
tres roles, más cerca de planeaciones (quince) que de nómina.

```text
src/components/dashboards/
├── CumpleanosSemana.jsx     compartido por admin y profesor
├── admin/
├── profesor/
└── superAdmin/
```

Hooks y utilidades quedan planos porque **ningún módulo del repositorio anida
`src/hooks/` ni `src/utils/`**; ahí la separación se expresa con un archivo por
subdominio —`admin.js`, `profesor.js`, `superAdmin.js`, `cumpleanos.js`— y con
el subdominio en el nombre de cada hook.

### Componentes del panel de administración

En `components/dashboards/admin/`:

- `TarjetaCarteraVencida.jsx`: la tarjeta destacada con sus dos estados, la
  deuda formateada, la insignia de conteo y la activación por teclado.
- `AccesosAdmin.jsx`: el encabezado, la rejilla de los cuatro accesos y la hoja
  `dashboardCardStyles`, que se movió con la rejilla porque solo estiliza sus
  tarjetas.

### Componentes del panel del profesor

En `components/dashboards/profesor/`:

- `ContextoTrabajoProfesor.jsx`: clase, período, fecha y el selector de
  planeaciones recientes con sus cuatro estados y su indicador de carga propio.
- `HorarioSemanal.jsx`: encabezado, conteo por jornada, filtro o insignia, y los
  estados de carga y vacío.
- `PanelJornada.jsx`: una jornada completa, con su vista móvil apilada y su
  rejilla de cinco días en escritorio. Era `renderHorarioJornada`, una función de
  cien líneas dentro del componente.
- `FiltroRendimiento.jsx`: los dos selectores encadenados de curso y materia.
- `TarjetaInasistencias.jsx`, `TarjetaBajoRendimiento.jsx` y
  `TarjetaMejorRendimiento.jsx`: las tres tarjetas de resultados.
- `TablaRankingBajo.jsx` y `TablaRankingMejor.jsx`: las dos pantallas de ranking,
  que pertenecen al subdominio del profesor porque solo se alcanzan desde su
  panel.

### Componentes del super admin

En `components/dashboards/superAdmin/`: `ResumenTenants.jsx` y
`TablaTenants.jsx`.

### Las tablas de ranking quedaron como hermanas, no como una compartida

La capa 0 registró los dos rankings como candidatos a compartir presentación. Al
abrirlos se contaron sus diferencias: la columna de puesto —numerada frente a
medallas—, el color de la fila al pasar el cursor, el color del promedio, el
texto y el color de la insignia, el resaltado del primer puesto, el emoji del
estado vacío y su texto. Son siete diferencias sobre una estructura de tabla de
cuatro columnas.

Un solo componente habría necesitado siete props, cuatro de ellas cadenas de
clases de Tailwind, y el resultado sería la misma cantidad de JSX con una capa
de indirección encima. Es exactamente el criterio que la capa 6 de nómina aplicó
al cascarón compartido de sus tres páginas. Se dejaron como dos componentes
hermanos, cada uno con su comentario explicando por qué.

Lo mismo se aplicó a `TarjetaBajoRendimiento` y `TarjetaMejorRendimiento`: en la
primera el color del promedio lo decide el campo `color` del backend y en la
segunda es fijo, así que no comparten ni siquiera esa regla.

### Reglas de clase movidas a utilidades

Siguiendo lo que hizo la capa 5 del módulo de referencia con
`claseEstadoPrestamo`, los mapas de clases salieron del JSX y quedaron como
utilidades puras con prueba propia:

- En `utils/dashboards/profesor.js`: `JORNADA_ESTILOS`, `iconoJornada`,
  `obtenerEstiloHorarioDia` con su paleta base, `jornadaUnicaDe` y
  `claseNotaBaja`.
- En `utils/dashboards/superAdmin.js`: `claseEstadoTenant`, que conserva que un
  estado desconocido se pinta como suspendido.

La hoja `dashboardCardStyles` **no** se movió a utilidades: no es una regla que
elija clases, es una hoja de estilos CSS que se inyecta con `<style>`. Vive con
el componente que la usa.

### Compatibilidad visual

- El JSX se movió conservando clases de Tailwind, textos, emojis, estructura de
  tablas, breakpoints, desplazamiento horizontal, `aria-label`, `aria-pressed`,
  `aria-busy`, `role="button"`, `tabIndex` y el escalonado de la animación de las
  tarjetas.
- Los componentes no administran estado de dominio: todos los cambios se
  comunican por callbacks.
- Ningún componente importa hooks, servicios ni Axios; solo React y utilidades
  puras del módulo.

### Verificación de capa 5

- Pruebas nuevas de componentes: 4 de `TarjetaCarteraVencida`, 4 de
  `AccesosAdmin`, 2 de `ResumenTenants`, 6 de `TablaTenants`, 3 de
  `TablaRankingBajo`, 3 de `TablaRankingMejor`, 8 de `ContextoTrabajoProfesor`,
  5 de `PanelJornada`, 7 de `HorarioSemanal`, 4 de `FiltroRendimiento`, 3 de
  `TarjetaInasistencias`, 5 de `TarjetaBajoRendimiento` y 4 de
  `TarjetaMejorRendimiento`.
- Pruebas unitarias nuevas: 6 para las reglas de clase del profesor y 2 para la
  del super admin.
- Suite específica completa:
  `pnpm exec vitest run src/components/dashboards/ src/hooks/dashboards/ src/services/dashboardsApi.test.js src/utils/dashboards/ src/pages/AdminDashboard.test.jsx src/pages/DashboardProfesor.test.jsx src/pages/SuperAdminDashboard.test.jsx src/pages/RankingRendimiento.test.jsx src/pages/RankingMejorRendimiento.test.jsx`
  — 35 archivos, 323 pruebas correctas.
- **Las 78 caracterizaciones de la capa 0 volvieron a pasar sin modificarse**
  después de mover todo el JSX.
- Suite completa del repositorio: 244 archivos y 1206 pruebas correctas, es
  decir 209 + 35 y 883 + 323 respecto de la línea base.
- ESLint específico sobre páginas, caracterizaciones, componentes/pruebas,
  hooks/pruebas, utilidades/pruebas y servicio/prueba: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que ningún componente del módulo importa hooks
  ni servicios.
- La suite completa y ESLint se volvieron a ejecutar después de anidar los
  componentes por rol: 244 archivos, 1206 pruebas y lint correctos, sin tocar
  ninguna prueba.
- Tamaño de las páginas: `AdminDashboard.jsx` 252 → **53** líneas,
  `DashboardProfesor.jsx` 728 → **182**, `SuperAdminDashboard.jsx` 152 → **63**,
  `RankingRendimiento.jsx` 74 → **42** y `RankingMejorRendimiento.jsx` 82 → **42**.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  la capa 7 de cierre todavía está pendiente.

## Implementación de capa 6

### Primer ajuste: la página componía reglas de dominio

`DashboardProfesor.jsx` resolvía dos reglas que no le corresponden:

- `abrirPlaneacionReciente` buscaba la planeación en la lista y armaba su ruta.
  Ahora `usePlaneacionesRecientes` expone `rutaDePlaneacion(planId)`, que
  devuelve la ruta o una cadena vacía, y la página solo navega. Es el mismo
  ajuste que hizo la capa 6 de nómina con `saldarPrestamo`.
- `irARanking` comprobaba `asignacionId` y escribía el aviso. Ahora
  `useContextoProfesor` expone `exigirClaseElegida()`, que avisa y responde si se
  puede continuar. El dueño del contexto es quien decide si hay clase elegida.

La navegación se quedó en la página, que es lo que el plan le asigna: la raíz
lee rutas, conecta hooks con componentes y conserva la navegación.

### Segundo ajuste: los componentes informan valores, no eventos

`ContextoTrabajoProfesor` recibía manejadores de evento crudos y la página
escribía tres adaptadores `(e) => cambiarX(e.target.value)`. Ahora el componente
desenvuelve el valor e informa `onCambiarAsignacion(valor)`, igual que ya hacía
`FiltroRendimiento`. La página pasa las acciones del hook directamente.

Es además el contrato que usa el módulo de referencia: los componentes reportan
valores por callback y no obligan a la raíz a conocer el DOM.

### Tercer ajuste: el rango de cumpleaños viaja con su consulta

La página pasaba `diasRango={DIAS_RANGO_CUMPLEANOS}` importando la constante,
mientras el hook consultaba con esa misma constante por su cuenta. Eran dos
lugares que podían divergir sin que nada lo detectara.

Ahora `useDashboardAdmin` y `useCumpleanosProfesor` devuelven
`diasRangoCumpleanos`, así que lo que se pinta es exactamente lo que se
consultó.

### Cuarto ajuste: las páginas de ranking ya no conocen el servicio

Cada página pasaba su función de servicio a `useRankingProfesor`. Ahora
`useRankingProfesor.js` exporta además `useRankingBajoRendimiento` y
`useRankingMejorRendimiento`, dos envoltorios de una línea. Las dos páginas
importan solo un hook y un componente.

### Quinto ajuste: el saludo del admin sale de su hook

`useDashboardAdmin` devuelve `esAdministrador` y `nombreAdmin`, igual que
`useContextoProfesor` ya devolvía `nombreProfesor`. La página dejó de leer
`usuario` y de llamar a `esAdmin` y `primerNombreAdmin`.

### Lo que se conserva en las raíces

- **El contenedor, el título y el saludo** de cada pantalla. Es lo que el módulo
  de referencia dejó en sus tres páginas.
- **El guardián de `AdminDashboard.jsx`**, que llama a `navigate("/login")`
  durante el render. Es control de acceso de la pantalla, o sea composición, y
  moverlo a un efecto cambiaría el momento de la redirección. El defecto de
  navegar en fase de render sigue registrado y **no** se corrigió aquí.
- **Las constantes de ruta** `RUTA_CARTERA_VENCIDA`, `RUTA_RANKING_BAJO` y
  `RUTA_RANKING_MEJOR`. Son destinos de navegación, que es responsabilidad
  explícita de la raíz.
- **El indicador de carga a pantalla completa** de los dos rankings y **los dos
  botones de encabezado** del super admin: composición decidiendo qué mostrar.
- **`setFiltroJornada` y `setMateriaFiltro`** siguen expuestos crudos: el control
  produce el valor y la raíz solo lo pasa, sin inventar semántica.

### Eliminación de `DashboardAdmin.jsx`

Con autorización explícita del usuario se eliminó `src/pages/DashboardAdmin.jsx`,
la página inalcanzable que la capa 0 documentó. Comprobaciones previas:

- ningún archivo de `src/` la importa;
- no aparece en `App.jsx`, ni estática ni con `lazy`;
- no hay importaciones dinámicas hacia ella;
- no se había tocado desde el commit inicial `295634e`.

Era una implementación antigua y duplicada del panel de administración —tres
tarjetas en lugar de cuatro, sin cartera ni cumpleaños—, así que su eliminación
cumple el criterio del plan de no dejar implementaciones antiguas duplicadas. La
línea que la menciona en `docs/COMPONENTES.md` se retira en la capa 7.

### Límites finales del módulo

- Las páginas conectan hooks con componentes, conservan la navegación y componen
  la pantalla.
- Los componentes solo presentan props y callbacks.
- Los hooks coordinan consultas, contexto y comandos.
- `dashboardsApi.js` es el único archivo del módulo que conoce endpoints y Axios.
- Las utilidades concentran contratos, transformaciones y reglas de clase puras.

### Verificación de capa 6

- Pruebas nuevas: 1 de `useContextoProfesor` para `exigirClaseElegida`, 2 de
  `usePlaneacionesRecientes` para `rutaDePlaneacion`, 1 de `useDashboardAdmin`
  para el saludo y el rango, y 1 de `useRankingProfesor` para los dos envoltorios.
- Pruebas ajustadas: `useDashboardAdmin.test.js` pasó de comprobar `usuario` a
  comprobar `esAdministrador`, y `ContextoTrabajoProfesor.test.jsx` pasó de
  `toHaveBeenCalled()` a comprobar el valor informado. Son pruebas de las capas 3
  y 5, no caracterizaciones; ninguna de las 78 de la capa 0 se tocó.
- Suite específica completa: 35 archivos, 328 pruebas correctas.
- **Las 78 caracterizaciones de la capa 0 volvieron a pasar sin modificarse.**
- Suite completa del repositorio: 244 archivos y 1211 pruebas correctas.
- Build de producción: correcto después de eliminar la página muerta.
- ESLint específico sobre páginas, caracterizaciones, componentes/pruebas,
  hooks/pruebas, utilidades/pruebas y servicio/prueba: correcto.
- `git diff --check`: correcto.
- Tamaño final de las raíces: `AdminDashboard.jsx` **58** líneas,
  `DashboardProfesor.jsx` **168**, `SuperAdminDashboard.jsx` **63**,
  `RankingRendimiento.jsx` **41** y `RankingMejorRendimiento.jsx` **41**.
- Las cinco importan solo `react-router-dom`, sus componentes, sus hooks y —dos
  de ellas— las constantes de ruta a las que navegan.

## Capa 7: cierre final

### Documentación sincronizada

- `docs/modularizacion/README.md` marca el módulo como terminado con commit
  pendiente.
- `docs/ARQUITECTURA_FRONTEND.md` registra las cuatro carpetas nuevas, la
  sección del dominio con sus rutas, guardianes y límites, y la cobertura de
  pruebas.
- `docs/COMPONENTES.md` registra los catorce componentes con sus notas, los once
  hooks, el servicio y las utilidades, y retira `DashboardAdmin.jsx` de la lista
  de páginas existentes.
- `docs/CAMBIOS_FRONTEND.md` contiene la entrada consolidada del módulo.

### Verificación final

- Suite específica: 35 archivos y 328 pruebas correctas.
- `pnpm run check:deploy`: correcto.
  - Vitest: 244 archivos y 1211 pruebas correctas.
  - ESLint global: correcto.
  - Build de producción: correcto; 354 módulos transformados.
- La suma cuadra con la línea base: el repositorio tenía 209 archivos y 883
  pruebas antes del módulo. 209 + 35 = 244 y 883 + 328 = 1211, es decir que el
  módulo agregó exactamente su propia suite y no alteró ninguna otra.
- `git diff --check`: correcto.
- El diff pertenece únicamente a dashboards, sus pruebas y la documentación
  específica y global exigida para el cierre. Los tres documentos globales
  cambiaron **solo por adición** —74, 54 y 42 líneas— salvo dos eliminaciones
  deliberadas: la línea de `DashboardAdmin.jsx` en `COMPONENTES.md` y la celda de
  estado en `docs/modularizacion/README.md`.
- Las cinco rutas conservan sus guardianes. `App.jsx`, `NavAdmin.jsx`,
  `NavProfesor.jsx`, `NavSuperAdmin.jsx`, `utils/periodoProfesor.js`,
  `planeacionesApi.js` y `carteraTiposPagoApi.js` no se modificaron.
- `dashboardsApi.js` es el único archivo del módulo que importa `utils/api.js` y
  contiene sus catorce contratos. Ninguna página, componente, hook o utilidad
  importa Axios ni contiene cadenas de endpoint; las únicas apariciones restantes
  están en las caracterizaciones, que simulan el cliente a propósito, en la ruta
  de navegación `/plan-de-clases?...` y en un comentario.
- No quedan implementaciones antiguas duplicadas: `src/components/dashboard/` en
  singular ya no existe y `src/pages/DashboardAdmin.jsx` fue eliminado.
- Inventario final del módulo: 4 utilidades, 11 hooks, 14 componentes, 1
  servicio y 5 páginas, cada uno con su prueba al lado.
- Reducción de las páginas: `DashboardProfesor.jsx` de 1005 a 168 líneas,
  `SuperAdminDashboard.jsx` de 431 a 63, `AdminDashboard.jsx` de 343 a 58,
  `RankingRendimiento.jsx` de 108 a 41, `RankingMejorRendimiento.jsx` de 112 a
  41 y `CumpleanosSemana.jsx` de 118 a 86.

### Verificación manual posterior al deploy

1. Iniciar sesión como **profesor** y abrir `/`. Confirmar el saludo con su
   primer nombre y que las tres secciones cargan por separado: horario semanal,
   cumpleaños de la semana y ranking de inasistencias.
2. En `¿Con qué clase vas a trabajar?`, confirmar que el selector lista **una
   sola opción por curso y materia**, con el icono ☀ o ◐ según la jornada.
   Elegir una clase y confirmar que aparece el bloque `Planeaciones recientes de
   <materia>` con hasta cinco entradas.
3. Elegir una planeación y confirmar que abre `/plan-de-clases` en modo
   presentación con la fecha correcta. Volver atrás, cambiar de clase y volver a
   la primera: el listado debe aparecer sin recargar, porque está cacheado.
4. Cambiar el período y la fecha de trabajo; abrir `Asistencia` y confirmar que
   llegan con la misma clase, período y fecha. Es el contrato de contexto que
   comparten los módulos académicos.
5. Volver al panel y confirmar el horario semanal: si el profesor tiene clases en
   las dos jornadas debe aparecer el filtro `Ambas / Mañana / Tarde`; si solo
   tiene una, la insignia de esa jornada. Comprobar que las franjas se muestran
   en formato de 12 horas y que los días sin clases dicen `Sin clases`.
6. En `Filtro de rendimiento`, confirmar que el primer curso queda elegido solo.
   Cambiar a otra materia y comprobar que las dos tarjetas se recargan; cambiar
   de curso y confirmar que la materia vuelve a `Todas las materias del curso`.
7. Sin clase elegida, pulsar `Ver ranking por materia` y confirmar el aviso.
   Elegir una clase y confirmar que los dos rankings abren y muestran el período
   correcto en su descripción. En el de mejores, confirmar las medallas 🥇🥈🥉 en
   los tres primeros puestos.
8. Iniciar sesión como **administrador** y abrir `/dashboard-admin`. Confirmar la
   tarjeta de cartera: en rojo con la deuda, el conteo y la mora si hay
   estudiantes en mora, o en verde con `Cartera al día` si no los hay.
9. Recorrer los cuatro accesos principales con `Tab` y abrirlos con `Enter` y con
   la barra espaciadora; confirmar que llegan a pagos, estudiantes, gestión
   académica y reportes. Comprobar que la animación de entrada se escalona.
10. Confirmar que el bloque de cumpleaños lista a los estudiantes ordenados por
    cercanía, con las etiquetas `Hoy`, `Mañana` o `En N días` y la edad que
    cumplen, y que el contador dice `N en 7 días`.
11. Iniciar sesión como **super administrador** y abrir `/super-admin`. Confirmar
    el resumen de cinco cifras y que la tabla lista los colegios con su código,
    schema, próximo pago y días de gracia.
12. Cambiar un colegio a `suspendido`; confirmar que el diálogo es de advertencia,
    que **exige motivo** y que al guardar la fila cambia de estado. Repetir con
    `en_mora` y confirmar que ahí el motivo es opcional.
13. Elegir en el selector el estado manual que ya tiene un colegio y confirmar que
    **no abre confirmación ni envía nada**.
14. Pulsar `Ver` en un colegio con cambios registrados y confirmar el historial
    con fecha, cambio, motivo y responsable. Pulsar `Ver` en uno sin cambios y
    confirmar el aviso `Sin historial`.
15. Pulsar `Crear colegio` y probar las validaciones: nombre vacío, correo
    inválido, contraseña corta, código con guion medio y próximo pago anterior al
    inicio. Crear uno válido y confirmar que aparece al final de la lista.
16. En ancho móvil, comprobar que el horario semanal apila los días en tarjetas,
    que la tabla de tenants conserva desplazamiento horizontal, que las tarjetas
    de accesos del admin se apilan y que los filtros de rendimiento se acomodan
    en una columna.

### Commit sugerido

`refactor(dashboards): modularizar dashboards y rankings`

## Primera acción

Cumplida en la capa 0: los subdominios quedaron definidos por rol, cada sección
quedó protegida frente al fallo de las demás, los catorce contratos están
cubiertos por pruebas y las dependencias reales están documentadas antes de
extraer nada.

## Entrega final

- Última capa terminada: Capa 7, cierre.
- Archivos de producción: cinco páginas convertidas en raíces de composición,
  catorce componentes presentacionales, once hooks, `dashboardsApi.js` y cuatro
  utilidades de dominio. Se eliminó `src/pages/DashboardAdmin.jsx` y se renombró
  `src/components/dashboard/` a `src/components/dashboards/`.
- Riesgos abiertos: ninguno. De los ocho defectos preexistentes que la migración
  conservó a propósito, **seis se corrigieron** en commits posteriores y **dos se
  aceptaron de forma explícita**, con su razón registrada abajo. El listado queda
  cerrado:
  1. ~~Un fallo de red se ve igual que un dato en cero.~~ **CORREGIDO** en un
     commit posterior a la migración. Los cinco hooks afectados —clases, cartera,
     inasistencias, rendimiento y rankings— publican su error como estado y sus
     componentes lo pintan con paleta propia. Las cuatro caracterizaciones que
     fijaban el comportamiento silencioso se actualizaron a propósito, que es
     justo para lo que se escribieron.
  2. ~~Tres pantallas redirigen con `window.location.href`.~~ **CORREGIDO** en
     un commit posterior a la migración. Los hooks informan `sesionInvalida` y
     las páginas devuelven `<Navigate to="/login" />`, igual que los guardianes
     de `App.jsx`. Ya no hay recarga completa de la aplicación.
  3. ~~`AdminDashboard` llama a `navigate` durante el render.~~ **CORREGIDO** en
     el mismo commit: devuelve `<Navigate to="/login" />` en vez de provocar un
     efecto secundario en fase de render.
  4. ~~La cancelación es inconsistente y provoca una carrera de respuestas.~~
     **CORREGIDO** en un commit posterior a la migración. Las siete consultas del
     módulo numeran sus peticiones y descartan las respuestas superadas, así que
     una respuesta tardía ya no puede pisar a la vigente.
  5. ~~El efecto de cartera silencia `react-hooks/exhaustive-deps`.~~
     **CORREGIDO** en un commit posterior a la migración. Los dos efectos
     hermanos dependen ahora del booleano `esAdministrador`, cuya identidad sí es
     estable, y el `eslint-disable` desapareció. Una prueba rerenderiza el hook y
     comprueba que sigue habiendo una sola petición por sección.
  6. **ACEPTADO sin corregir.** La caché de planeaciones recientes nunca se
     invalida. Su alcance real es estrecho: crear una planeación exige navegar a
     `/plan-de-clases`, y ese cambio de ruta desmonta `DashboardProfesor`, así
     que al volver la caché ya no existe y se vuelve a consultar. La ventana de
     datos viejos se limita a otra pestaña, otro dispositivo o un cambio del
     administrador con el panel abierto. Añadir invalidación sería complejidad
     para un caso que casi no ocurre.
  7. ~~El panel del profesor y los rankings usan `window.alert`.~~ **CORREGIDO**
     en un commit posterior a la migración. Los dos avisos son SweetAlert, como
     el resto del sistema, así que Chrome ya no puede silenciarlos.
  8. **ACEPTADO sin corregir.** `crearColegio` lee sus valores del DOM con
     `document.getElementById`, porque el formulario lo pinta SweetAlert como
     una cadena de HTML. Los nueve identificadores están escritos dos veces
     —en `htmlFormularioTenant` y en `leerCamposTenant`— sin que nada obligue a
     que coincidan. La razón de aceptarlo está detallada abajo.
- Diferencia conocida que no es defecto: las dos `capitalizarInicial` divergen a
  propósito —la del admin conserva el resto del nombre y la del profesor lo baja
  a minúsculas—, y las tablas de ranking y las tarjetas de rendimiento son
  hermanas por diseño, no variantes de un componente común.
- Siguiente capa pendiente: Ninguna.

### Por qué se aceptó el defecto 8 sin corregirlo

El alta de colegios es la operación más consecuente del sistema: crea el esquema
`tenant_<codigo>` en la base de datos, clona las tablas de la plantilla, copia
las plantillas de impresión, crea la cuenta del primer administrador del colegio
y registra su suscripción. Aun así, la decisión fue no tocarla ahora.

**El impacto real es mucho menor de lo que sugiere el enunciado.** Se revisó
campo por campo, contra el backend, qué pasaría si alguien renombra un `id` en
un archivo y no en el otro:

- Nombre, código, admin nombre, admin correo y contraseña: la validación del
  formulario los bloquea con `Completa colegio, codigo y admin inicial.`.
- Fecha de inicio y próximo pago: bloqueadas con
  `Completa las fechas de suscripcion.`. Además `TenantCreate` las declara
  obligatorias y el controlador valida el formato, así que aunque se colaran el
  backend respondería `422` y el diálogo mostraría el motivo.
- **Días de gracia**: es el único con consecuencia silenciosa.
  `Number(undefined || 0)` da `0`, y la validación acepta el cero, así que el
  colegio quedaría sin período de gracia y se suspendería al primer pago
  vencido. Se ve en la tabla (`0 dias`) justo después, pero no hay pantalla para
  corregirlo: el único comando disponible es el cambio de estado.
- **Notas**: se perderían en silencio. Cosmético.

O sea: siete de nueve campos fallan a la vista y uno solo puede tomar un valor
incorrecto sin avisar. Y ese riesgo ya está mitigado, porque la prueba unitaria
de `htmlFormularioTenant` fija los nueve identificadores: un renombrado rompe la
prueba antes de llegar a producción.

**Las dos alternativas evaluadas y descartadas:**

- *Generar el HTML y la lectura desde un único descriptor de campos.* Elimina la
  duplicación de los nueve `id`, pero los campos no son uniformes —ocho `input` y
  un `textarea`, cinco tipos distintos, un `min`, tres valores por defecto y una
  clase de dos columnas—, así que el generador necesitaría unas seis ramas
  condicionales. Cambia HTML plano y legible por un pequeño motor de plantillas,
  para cerrar un riesgo que la prueba ya cubre.
- *Sustituir SweetAlert por un modal React con campos controlados,* como los
  otros siete modales del proyecto. Es la solución de fondo y dejaría el diálogo
  consistente con el resto de la aplicación, pero **cambia su aspecto** y obliga
  a reponer a mano lo que SweetAlert da hecho: trampa de foco, cierre con `Esc`,
  clic en el fondo y accesibilidad. Eso es un rediseño, no una corrección de
  deuda.

**Cuándo reabrirlo:** el día que ese formulario cambie por una razón de producto
—añadir un campo, modificar el flujo de alta—, hacerlo entonces como modal React.
Así el rediseño se paga una sola vez y con una justificación funcional detrás.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual como seguimiento operativo si todavía no fue
  registrada.

## Después del cierre: registrar el pago de un colegio (2026-10-26)

El super admin no podía reactivar a un colegio que pagó. El estado efectivo
sale de la fecha de próximo pago, y elegir `activo` en el selector no le gana a
una fecha vencida; esa fecha solo se fijaba al crear el colegio. Requirió la
ruta nueva del backend `POST /super-admin/tenants/{tenant_id}/pagos`.

- `services/dashboardsApi.js`: `registrarPagoTenant`.
- `utils/dashboards/superAdmin.js`: `sumarUnMes`, `sugerirProximoPago` (un mes
  después del pago vigente o, si el colegio va atrasado, de hoy),
  `validarFechaPago` (posterior a hoy, la misma regla del backend),
  `construirPayloadPago`, `textoPagoRegistrado`, `mensajeErrorPago` y
  `htmlFormularioPago`.
- `hooks/dashboards/usePagoTenant.js` (nuevo): el comando. Usa el mismo diálogo
  de SweetAlert que el alta, con dos campos leídos del DOM, y el título va como
  texto plano (`titleText`). Si algún día el alta pasa a modal React (ver la
  deuda de arriba), este diálogo debe pasar con ella.
- `TablaTenants`: columna «Pago» con el botón «Registrar pago», deshabilitado
  en la fila que se está guardando.
- Si el colegio sigue sin quedar activo después del pago, es por su estado
  manual, y el aviso lo dice.
- Pruebas: utilidades, servicio, hook (`usePagoTenant.test.js`), tabla y una de
  la página con el flujo completo.
