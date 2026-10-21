# Modularización: Nómina, egresos y préstamos

## Control

- Estado: Terminado y publicado en `main`.
- Orden: 11.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: `0a54c019b04ba5159756a9cb2d5c42f32096bb4e`.
- Commit final: `a80cca4`.
- Última actualización: 2026-08-07 (capa 7, cierre).

## Objetivo

Separar los flujos financieros laborales relacionados sin fusionar sus reglas
de negocio ni alterar montos, estados o trazabilidad.

## Inventario confirmado en capa 0

### Nómina

- `src/pages/NominaAdmin.jsx` es hoy página, consultas, comandos,
  transformaciones y presentación en un solo archivo de 312 líneas.
- Contiene el estado de cuenta del personal, el historial buscable de pagos y
  el modal de pago con su cálculo de neto.
- No tiene constantes propias: todo el dominio vive en estado local y en JSX.

### Egresos

- `src/pages/EgresosAdmin.jsx` es hoy página, consulta, comandos,
  transformaciones y presentación en un solo archivo de 324 líneas.
- Contiene el formulario de alta y edición, el filtro por rango de fechas, el
  total del rango y la tabla con la distinción manual/automático.
- Constantes locales: `categorias` (`Compras Institucionales`,
  `Pago de Servicios`, `Mantenimiento`, `Otros`) y el ayudante
  `obtenerFechaLocal()`.

### Préstamos

- `src/pages/PrestamosAdmin.jsx` es hoy página, consultas, comandos,
  transformaciones y presentación en un solo archivo de 326 líneas.
- Contiene el formulario de alta, el filtro por profesor, el total por cobrar y
  la tabla con la acción `Saldar`.
- Constantes locales: ninguna. Los estados `Pendiente` y `Pagado` están
  literales dentro del JSX y de los manejadores.

### Estado inicial del módulo

Al iniciar la migración el módulo eran exactamente tres archivos de producción:
las tres páginas. No había componentes, hooks, servicios ni utilidades propias,
y ninguna de las tres páginas tenía pruebas.

### Entradas, roles y dependencias externas

- Rutas: `/admin/egresos`, `/admin/prestamos` y `/admin/nomina`, las tres bajo
  `AdminRoute` en `src/App.jsx` y las tres cargadas con `lazy`.
- `src/components/NavAdmin.jsx` las expone como `Egresos`, `Préstamos` y
  `Nómina` en escritorio y móvil. La entrada de nómina lleva `translate="no"`.
- El módulo no lee ni escribe `localStorage`. La única lectura relacionada es la
  del control de acceso global.
- `GET /profesores` es una dependencia de datos del módulo de administración
  académica. Se consume en modo lectura y no autoriza a modificar ese dominio.
- Consumidores externos que permanecen fuera de alcance: `ReportesAdmin.jsx` lee
  egresos a través de sus propios endpoints (`/reportes/egresos-rango` y el
  reporte general), nunca a través de `/api/egresos/`. No se toca en esta
  migración y pertenece al módulo 9.
- Ninguna otra página del frontend importa estas tres, ni consume
  `/api/nomina/`, `/api/egresos/` o `/api/prestamos/`.

### Acoplamiento real entre los tres subflujos

El acoplamiento es del backend, no del frontend:

- `POST /api/nomina/pagar` abona los préstamos pendientes del profesor, de más
  antiguo a más reciente, y marca como `Pagado` el que queda saldado.
- El mismo endpoint inserta además un egreso automático con
  `categoria='Pago Nomina'` y `origen='nomina'`, dentro de la misma transacción.
- Por eso el saldo que muestra nómina y las filas no editables que muestra
  egresos son efectos de un solo comando remoto.

En el frontend las tres páginas son independientes: no comparten estado, ni
componentes, ni utilidades, ni se navegan entre sí.

## Contratos HTTP inventariados

| Método | Ruta | Uso actual |
|---|---|---|
| `GET` | `/api/nomina/empleados` | Estado de cuenta del personal. |
| `GET` | `/api/nomina/historial` | Historial completo de pagos de nómina. |
| `POST` | `/api/nomina/pagar` | Registrar el pago y abonar préstamos. |
| `GET` | `/api/egresos/` con `params: { fecha_desde, fecha_hasta }` | Egresos del rango. |
| `POST` | `/api/egresos/` | Crear egreso manual. |
| `PUT` | `/api/egresos/:id` | Actualizar egreso manual. |
| `GET` | `/api/prestamos/` con `params: { profesor_id }` | Historial de un profesor. |
| `POST` | `/api/prestamos/` | Crear préstamo. |
| `PUT` | `/api/prestamos/:id/estado` | Saldar un préstamo. |
| `GET` | `/profesores` | Dependencia externa de solo lectura. |

Contratos de escritura protegidos por caracterización:

- Nómina: `{ profesor_id, salario_base: parseFloat, deduccion_prestamos,
  otros_descuentos, bonificaciones, notas }`. Los cuatro montos numéricos usan
  `parseFloat(...) || 0`, salvo `salario_base`, que no tiene respaldo.
- Egreso: `{ concepto, monto: Number, fecha, categoria, notas }`, con concepto,
  categoría y notas recortadas. La ruta cambia entre `POST /api/egresos/` y
  `PUT /api/egresos/:id` según `egresoEditando`.
- Préstamo: `{ profesor_id: parseInt, monto: Number, fecha, estado:
  "Pendiente", notas }` con notas recortadas.
- Estado de préstamo: `{ estado: "Pagado" }` por `PUT`. El backend rechaza
  cualquier otro valor.

Capacidades del backend que el frontend **no** usa hoy y que no deben adoptarse
durante la migración: `GET /api/prestamos/` sin `profesor_id`, que devuelve
todos los préstamos; `GET /api/egresos/` con fechas nulas; y
`DELETE /api/egresos/:id` y `DELETE /api/prestamos/:id`, que existen solo para
responder `405` y recordar que estos registros no se eliminan. Incorporarlas
sería una función nueva.

## Invariantes

- Nómina usa el sueldo del profesor como salario base.
- Egresos conservan filtros por fecha e historial.
- Préstamos no se eliminan y solo permiten acciones vigentes como `Saldar`.
- Estados, confirmaciones y motivos actuales.
- Reportes deben seguir recibiendo los datos esperados.

### Invariantes precisadas en capa 0

#### Nómina

- Las dos consultas se lanzan juntas con `Promise.all` y comparten un solo
  `loading`, que alimenta los dos textos `Cargando datos...` y
  `Cargando historial...`.
- `GET /api/nomina/empleados` devuelve **todo** el personal, activo o inactivo,
  porque su consulta no filtra por estado.
- Abrir el modal precarga `salario_base` con `String(empleado.sueldo ?? 0)` y
  pone bonos, abono y otras deducciones en `"0"`.
- El neto es `(salario + bonos) - (abono + deducciones)`; cada campo se lee con
  `parseFloat(...) || 0` y se muestra con `toFixed(2)`.
- Un neto negativo se bloquea antes de enviar.
- Un abono mayor que `saldo_prestamos` se bloquea antes de enviar, con un aviso
  que interpola los dos montos sin formatear.
- El campo de abono se deshabilita cuando el saldo es exactamente `0`, y la
  ayuda `Máx: <saldo>` solo aparece cuando el saldo es mayor que `0`.
- El éxito cierra el modal, avisa y relanza las dos consultas. El error deja el
  modal abierto, conserva lo escrito y no recarga.
- El historial solo se pinta cuando hay texto en el buscador; con el buscador
  vacío muestra `🔍 Escriba el nombre...` y nunca la tabla completa.
- El filtro del historial es `h.profesor.toLowerCase().includes(...)`, sin
  recortar el texto buscado.
- El saldo de préstamos se pinta en rojo cuando es mayor que `0` y en verde
  cuando es `0`.

#### Egresos

- La carga inicial consulta siempre el día actual, con `fecha_desde` igual a
  `fecha_hasta`, calculadas con `obtenerFechaLocal()`.
- La respuesta se protege con `Array.isArray(res.data) ? res.data : []`.
- Registrar un egreso **mueve el filtro** a la fecha registrada: cambia `desde`
  y `hasta` a esa fecha y recarga con ella. Actualizar **no** mueve el filtro:
  recarga con el rango vigente.
- La fecha del formulario es opcional; vacía se sustituye por el día actual.
- Las validaciones corren antes de la confirmación: concepto no vacío tras
  recortar, monto finito y mayor que `0`, categoría no vacía.
- La confirmación es un `window.confirm` con concepto, monto en formato
  `es-CO` con dos decimales, fecha y categoría. Cancelar no envía nada.
- Solo se puede editar una fila con `editable !== false` **y**
  `origen === "manual"`; el resto muestra la etiqueta `Automático`.
- El guardado exitoso limpia el formulario y devuelve el encabezado a
  `Registrar Nuevo Egreso`.
- Un rango invertido se rechaza en el cliente y no consulta.
- El total del encabezado suma `Number(monto || 0)` de las filas visibles, no
  del rango completo del backend.
- La categoría inicial del formulario es `Compras Institucionales`; al cargar
  una fila para editar, una categoría ausente se sustituye por `Otros`.

#### Préstamos

- Al abrir solo se consulta `/profesores`. El historial **nunca** se carga
  automáticamente y muestra su recuadro punteado hasta la primera consulta.
- `GET /profesores` sin parámetros devuelve únicamente profesores activos,
  porque el backend usa `estado="activo"` por omisión. Nómina, en cambio,
  lista a todo el personal.
- Elegir un profesor en el filtro consulta de inmediato; elegir el valor vacío
  limpia la lista y vuelve al estado sin consultar, sin llamar al backend.
- `profesor_id` viaja como cadena en los parámetros de la consulta y como
  entero en el payload de creación.
- La confirmación de alta incluye el nombre `Apellido Nombre` del profesor, o
  `Profesor seleccionado` si no se encuentra, el monto en formato `es-CO` y la
  advertencia de que el préstamo no se puede eliminar.
- Tras crear, el filtro salta al profesor del préstamo, el formulario se limpia
  y se consulta su historial.
- `Saldar` solo aparece en filas `Pendiente`; el resto muestra `Saldado`.
- El total por cobrar suma únicamente los préstamos `Pendiente` de la lista
  visible.
- La insignia es amarilla para `Pendiente` y verde para cualquier otro estado.
- Los dos selectores se deshabilitan mientras cargan los profesores.

## Riesgos iniciales

- Son tres subdominios relacionados, pero con contratos diferentes.
- Alterar saldos, fechas o estados financieros.
- Duplicar pagos o perder historial.
- Crear una abstracción compartida demasiado genérica.

## Riesgos y decisiones registrados en capa 0

### Defectos preexistentes que se conservan

Se conservan tal cual, igual que se hizo en inventario y ventas. Se documentan
aquí para atenderlos en commits separados **después** de cerrar el módulo.

- **Doble registro de un pago de nómina.** `Confirmar Pago` no se deshabilita
  mientras la petición está en vuelo y `POST /api/nomina/pagar` no deduplica.
  Un doble clic registra dos nóminas, abona dos veces los préstamos y crea dos
  egresos automáticos. Es el riesgo más alto del módulo.
- **Nómina no confirma antes de pagar.** Egresos y préstamos piden
  `window.confirm`; nómina ejecuta el pago con un solo clic. La asimetría es
  comportamiento vigente.
- **`salario_base` puede viajar como `NaN`.** Es el único monto sin
  `|| 0`. El campo es `required`, así que hoy el navegador bloquea el envío
  vacío, pero el contrato queda expuesto.
- **Fecha por omisión inconsistente.** Egresos usa `obtenerFechaLocal()`, que
  compensa el desfase horario; préstamos usa `new Date().toISOString()`, que es
  UTC. En Colombia, después de las 19:00 locales, un préstamo sin fecha queda
  registrado con la fecha del día siguiente.
- **Los tres subflujos usan `window.alert` y `window.confirm`** mientras el
  resto del sistema ya migró a SweetAlert. Además, Chrome puede silenciarlos si
  el usuario marca `Impedir que esta página cree diálogos adicionales`.
- **Egresos y préstamos tampoco bloquean su botón de envío** durante la
  petición, aunque el `window.confirm` previo reduce mucho la ventana.

### Decisiones de alcance

- Se decidió ejecutar **un solo ciclo de módulo** con tres secuencias internas
  paralelas: cada capa cubre los tres subflujos, pero en archivos separados por
  subdominio. Comparten el ciclo porque comparten el commit y la verificación,
  no las reglas.
- La convención física prevista, siguiendo el módulo de referencia, es
  `utils/nominaEgresosPrestamos/{nomina,egresos,prestamos}.js`,
  `services/nominaEgresosPrestamosApi.js`,
  `hooks/nominaEgresosPrestamos/` y `components/nominaEgresosPrestamos/`.
- **No se fusionan utilidades entre los tres subflujos.** El único candidato
  aparente sería un formateador de moneda, pero nómina y préstamos usan
  `toFixed(2)` en la vista y `es-CO` en las confirmaciones, y egresos usa las
  dos formas en lugares distintos. No hay contrato idéntico comprobado.
- `obtenerFechaLocal` ya existe como función pura e inyectable en
  `src/utils/pagos/formatos.js`, con su prueba. Es el único candidato real a
  utilidad compartida del módulo. La decisión se toma en la capa 1: reutilizarla
  cruzando dominios o replicarla en `utils/nominaEgresosPrestamos/egresos.js`.
  Esta capa no la mueve ni la duplica.
- `GET /profesores` ya tiene transporte en `src/services/profesoresApi.js` como
  `listarProfesores(estado)`. Reutilizarla cambiaría los argumentos del cliente
  Axios, aunque no la petición HTTP. El precedente del proyecto —`pagosApi.js`
  con `/estudiantes`, `carteraTiposPagoApi.js` con `/cursos`— es que cada
  módulo posea su transporte. La decisión se cierra en la capa 2.
- No se abrió ni se modificó `ReportesAdmin.jsx`, `profesoresApi.js`,
  `NavAdmin.jsx` ni `App.jsx`.
- La capa 0 solo agregó caracterización y documentación; no cambió código de
  producción, rutas, textos, diseño ni payloads.

### Rutas no alcanzables desde la interfaz

Se documentan porque la caracterización de página no puede cubrirlas y deberán
protegerse con pruebas unitarias cuando se extraigan:

- El aviso `Solo puedes editar egresos creados manualmente en esta pantalla.`:
  el botón `Editar` solo se pinta para filas manuales.
- El aviso `Debes seleccionar una categoría.`: la categoría es un `select` sin
  opción vacía.
- El aviso `Por favor, selecciona un profesor o trabajador.`: el `select` es
  `required` y el navegador bloquea el envío antes.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-08-07) |
| 1. Utilidades puras | Terminada (2026-08-07) |
| 2. Servicio HTTP | Terminada (2026-08-07) |
| 3. Hooks de consulta | Terminada (2026-08-07) |
| 4. Hooks de comandos | Terminada (2026-08-07) |
| 5. Presentación | Terminada (2026-08-07) |
| 6. Composición | Terminada (2026-08-07) |
| 7. Cierre | Terminada (2026-08-07) |

## Verificación de capa 0

- Antes de modificar: rama `main`, árbol limpio y `HEAD` en
  `0a54c019b04ba5159756a9cb2d5c42f32096bb4e`.
- No existía un hash contradictorio en este documento: el commit base estaba
  marcado para registrarse al iniciar y quedó fijado al `HEAD` publicado.
- No había pruebas previas del módulo que ejecutar: las tres páginas no tenían
  ninguna.
- Verificación específica final:
  `pnpm exec vitest run src/pages/NominaAdmin.test.jsx src/pages/EgresosAdmin.test.jsx src/pages/PrestamosAdmin.test.jsx`
  — 3 archivos, 31 pruebas correctas.
- Caracterización nueva: 9 pruebas de nómina, 10 de egresos y 12 de préstamos.
  Protegen los diez contratos HTTP, sus parámetros y payloads, la carga en
  paralelo de nómina, el cálculo del neto, los dos bloqueos previos al pago, el
  cierre del modal y su conservación ante error, el filtro del historial, el
  salto del filtro de egresos a la fecha registrada, el recorte de textos, el
  rechazo del rango invertido, la distinción manual/automático, la ausencia de
  consulta inicial de préstamos, el salto del filtro tras crear, el saldado y
  los tres mensajes de error de carga.
- ESLint específico sobre las tres páginas y sus tres caracterizaciones:
  correcto.
- `git diff --check`: correcto.
- `git status` solo muestra los tres archivos de prueba nuevos.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

### Nota sobre el entorno de pruebas

`jsdom` sí aplica la validación de `required` al enviar un formulario: un campo
obligatorio vacío impide que se dispare `submit`. Se comprobó de forma empírica
antes de escribir la caracterización, y por eso las pruebas de validación usan
valores que superan la validación del navegador pero fallan la del código, como
un concepto de solo espacios o un monto `0`.

## Implementación de capa 1

### Unidades extraídas

- `src/utils/nominaEgresosPrestamos/nomina.js`: estado inicial del pago con el
  sueldo como salario base, cálculo del neto, las dos validaciones previas al
  pago, el payload del backend y el filtro del historial con su regla de
  visibilidad.
- `src/utils/nominaEgresosPrestamos/egresos.js`: categorías y categoría inicial,
  fecha local, normalización de la lista, parámetros del rango, detección del
  rango invertido, permiso de edición, carga del formulario desde una fila,
  normalización del egreso, validación, mensaje de confirmación, total del
  listado y mensaje de error de guardado.
- `src/utils/nominaEgresosPrestamos/prestamos.js`: estados del dominio,
  normalización de la lista, parámetros de la consulta, resolución del nombre
  del profesor, fecha por defecto, validación, payload, los dos mensajes de
  confirmación, permiso de saldado, total pendiente y mensaje de error de alta.
- Las utilidades no realizan HTTP, no usan React ni DOM, no acceden a
  almacenamiento y no disparan efectos. Las dos que dependen del reloj —
  `obtenerFechaLocal` y `fechaPrestamoPorDefecto`— reciben la fecha por
  parámetro; son las páginas las que siguen leyendo `new Date()`.

### Decisión sobre `obtenerFechaLocal`

- Se **replicó** en `utils/nominaEgresosPrestamos/egresos.js` con la misma firma
  inyectable que ya tiene `utils/pagos/formatos.js`, y con la misma prueba.
- No se reutilizó la de pagos porque importar `utils/pagos/` desde este módulo
  crearía una dependencia hacia una carpeta que pertenece a otro dominio.
- No se promovió a una utilidad transversal porque eso exigiría modificar el
  módulo de pagos, que está fuera de alcance. El plan maestro pide crear
  primero una tarea transversal pequeña y verificable; queda registrada como
  deuda conocida, con dos copias de cuatro líneas y prueba propia cada una.

### Integración conservada

- `NominaAdmin.jsx` conserva las dos consultas en paralelo, el modal, los
  avisos, la recarga posterior y toda la presentación. Solo delega el estado
  inicial del pago, el neto, las validaciones, el payload y el filtro del
  historial.
- `EgresosAdmin.jsx` conserva la carga inicial del día, los dos botones del
  filtro, la confirmación con `window.confirm`, el salto del filtro a la fecha
  registrada y la limpieza del formulario. Solo delega transformaciones puras.
- `PrestamosAdmin.jsx` conserva que el historial no se carga al abrir, la
  confirmación de alta, el salto del filtro al profesor recién prestado y el
  saldado con su recarga.
- `normalizarEgreso` devuelve exactamente el cuerpo que hoy aceptan
  `POST /api/egresos/` y `PUT /api/egresos/:id`, así que sustituye a la vez a la
  normalización y al `payload` que la página armaba por separado. Se documentó
  en el propio archivo para que no se confunda con un formulario.
- `validarEgreso` y `validarPrestamo` reciben los valores ya normalizados, que
  es el orden que tenía el código: primero limpiar, después validar.
- `puedeEditarEgreso` unificó las dos escrituras que existían de la misma regla
  —la negada en el manejador y la afirmada en la tabla— sin cambiar su
  resultado.
- `fechaPrestamoPorDefecto` conserva deliberadamente `toISOString()` en UTC. La
  divergencia con la fecha local de egresos sigue documentada como defecto
  preexistente y **no** se corrigió en esta capa.
- `construirPayloadNomina` conserva que solo `salario_base` viaja sin respaldo
  `|| 0`, y hay una prueba que fija ese `NaN` para que la corrección futura sea
  una decisión explícita y no un accidente.
- `construirPayloadPrestamo` conserva `parseInt(profesorId)` sin base explícita.
- No se movieron endpoints, efectos, mensajes, rutas ni componentes y no se creó
  ninguna abstracción compartida fuera del módulo.

### Decisiones de alcance

- **No se fusionaron utilidades entre los tres subflujos**, como se decidió en
  la capa 0. El único solapamiento real es la llamada a `toLocaleString("es-CO",
  …)` dentro de los mensajes de confirmación de egresos y préstamos: una línea
  dentro de dos textos completamente distintos. Crear un archivo común para eso
  sería una abstracción sin contrato propio.
- No se extrajeron los ternarios de clases ni los formatos monetarios del JSX:
  el color del saldo de préstamos en nómina —que además usa dos paletas
  distintas en la tabla y en el modal—, el color de la insignia de estado en
  préstamos y los `toFixed(2)` incrustados. Son presentación y pertenecen a la
  capa 5, igual que en el módulo de referencia.
- Tampoco se extrajo el nombre del empleado en nómina: la tabla lo muestra como
  `Apellido Nombre` y el modal como `Nombre Apellido`. Unificarlos cambiaría la
  interfaz; se resuelven como dos presentaciones en la capa 5.
- Las tres validaciones inalcanzables desde la interfaz que la capa 0 documentó
  —categoría vacía, profesor sin seleccionar y edición de un egreso automático—
  quedaron protegidas por pruebas unitarias, que es donde sí se pueden ejercer.
- `EgresosAdmin` pasó a inicializar sus dos fechas con la forma diferida de
  `useState`. El valor resultante es el mismo; solo evita recalcular la fecha en
  cada render.

### Verificación de capa 1

- Pruebas unitarias nuevas: 13 de nómina, 14 de egresos y 11 de préstamos.
- Suite específica completa:
  `pnpm exec vitest run src/utils/nominaEgresosPrestamos/ src/pages/NominaAdmin.test.jsx src/pages/EgresosAdmin.test.jsx src/pages/PrestamosAdmin.test.jsx`
  — 6 archivos, 69 pruebas correctas.
- Las 31 caracterizaciones de la capa 0 pasaron **sin modificarse**, que es la
  prueba de que la extracción conservó el comportamiento.
- ESLint específico sobre las tres páginas, sus tres caracterizaciones y las
  seis utilidades y pruebas de `src/utils/nominaEgresosPrestamos/`: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las tres páginas no quedan `parseFloat`,
  `parseInt`, `toLocaleString`, `Array.isArray`, `toISOString`,
  `getTimezoneOffset`, `Number.isFinite`, reducciones ni mensajes de validación
  o de error duplicados. La única aparición restante de `'Pendiente'` es el
  ternario de clases de la insignia, reservado para la capa 5.
- Tamaño de las páginas: nómina 312 → 307 líneas, egresos 324 → 311 y préstamos
  326 → 331. Préstamos crece porque su bloque de importaciones tiene 15 líneas;
  la reducción real de las páginas corresponde a las capas 3 a 6.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 2

### Servicio HTTP

- `src/services/nominaEgresosPrestamosApi.js` centraliza los diez contratos
  inventariados: empleados, historial y pago de nómina; egresos del rango,
  creación y actualización; préstamos de un profesor, creación y saldado; y la
  lista de profesores.
- Las diez funciones devuelven `response.data`. Ninguna página del módulo
  comprueba el código HTTP —a diferencia de inventario, que sí lo hacía—, así
  que exponer `status` habría sido añadir una interfaz sin consumidor.
- El servicio no atrapa errores, no decide mensajes, no usa React y no
  transforma payloads. Los errores de Axios se propagan intactos para que
  `mensajeErrorGuardarEgreso` y `mensajeErrorCrearPrestamo` sigan leyendo
  `response.data.detail`.
- Las consultas con filtro reciben el objeto de parámetros ya construido por las
  utilidades de la capa 1 y solo lo envuelven en `{ params }`. Así los nombres
  `fecha_desde`, `fecha_hasta` y `profesor_id` viven en un único lugar, junto a
  los payloads que ya modelaban el mismo contrato.
- `actualizarEstadoPrestamo(id, estado)` arma `{ estado }` dentro del servicio,
  igual que `actualizarEstadoProductoInventario` en el módulo de referencia,
  porque es un cuerpo de un solo campo que pertenece a la ruta.

### Decisión sobre `GET /profesores`

- Se **posee el transporte** en el servicio del módulo, como
  `obtenerProfesoresParaPrestamos`.
- No se reutilizó `listarProfesores(estado)` de `profesoresApi.js` porque su
  firma envía siempre `{ params: { estado } }`. Con el argumento vacío la
  petición HTTP resultante es la misma, pero los argumentos del cliente Axios
  cambian, y la caracterización de la capa 0 —que fija `api.get("/profesores")`
  sin segundo argumento— lo detecta. Reutilizarla habría obligado a modificar
  una prueba de caracterización, que es justamente lo que no debe ocurrir.
- Es además el criterio que ya aplican `pagosApi.js` con `/estudiantes`,
  `carteraTiposPagoApi.js` con `/cursos` e `inventarioVentasApi.js` con
  `/estudiantes`: cada módulo posee su transporte y no se crea una abstracción
  compartida.
- El nombre lleva el sufijo `ParaPrestamos` para dejar explícito que es una
  dependencia de lectura de otro dominio y no la puerta de entrada al dominio de
  profesores.

### Integración conservada

- `NominaAdmin.jsx` conserva `Promise.all`, el estado de error, la recarga
  posterior al pago y todos los avisos. Las dos consultas ahora se resuelven a
  datos directamente, sin destapar `.data` en la página.
- `EgresosAdmin.jsx` conserva la carga inicial del día, los dos botones del
  filtro, la confirmación y el salto del filtro a la fecha registrada. La
  bifurcación crear/actualizar ya no arma rutas: elige entre dos funciones del
  servicio.
- `PrestamosAdmin.jsx` conserva que el historial no se carga al abrir, el
  cortocircuito cuando no hay profesor elegido, el salto del filtro tras crear y
  el saldado con su recarga.
- Ninguna página del módulo importa `utils/api.js` después de esta capa.
- No se añadieron parámetros, señales de cancelación ni rutas nuevas porque los
  contratos actuales no los tenían. Las capacidades no usadas del backend
  —préstamos sin `profesor_id`, egresos con fechas nulas y los dos `DELETE` que
  responden `405`— siguen sin implementarse.

### Verificación de capa 2

- `src/services/nominaEgresosPrestamosApi.test.js` agrega 7 pruebas que cubren
  los diez contratos, sus métodos, rutas, parámetros, payloads, datos devueltos
  y la propagación de errores.
- Suite específica completa:
  `pnpm exec vitest run src/services/nominaEgresosPrestamosApi.test.js src/utils/nominaEgresosPrestamos/ src/pages/NominaAdmin.test.jsx src/pages/EgresosAdmin.test.jsx src/pages/PrestamosAdmin.test.jsx`
  — 7 archivos, 76 pruebas correctas.
- Las 31 caracterizaciones de la capa 0 volvieron a pasar sin modificarse: siguen
  simulando `utils/api.js`, que ahora alcanzan a través del servicio.
- ESLint específico sobre páginas, caracterizaciones, servicio/prueba y
  utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las tres páginas no queda ninguna
  importación de `utils/api.js`, llamada a Axios ni cadena de endpoint, y que en
  las utilidades las únicas rutas que aparecen están dentro de un comentario.
- Tamaño de las páginas: nómina 307 → 310 líneas, egresos 311 → 315 y préstamos
  331 → 335. Las tres crecen levemente por el bloque de importaciones del
  servicio; la reducción real corresponde a las capas 3 a 6.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 3

### Hook de consultas de nómina

- `src/hooks/nominaEgresosPrestamos/useConsultasNomina.js` es propietario de
  empleados, historial, carga, error y la búsqueda del historial.
- Conserva `Promise.all`, que un solo `loading` alimenta los dos textos
  `Cargando datos...` y `Cargando historial...`, que cada carga limpia el error
  anterior y que el error se publica como estado visible, no como aviso.
- Expone `historialMostrado` y `hayBusqueda` en lugar del historial crudo,
  porque la página nunca usa la lista completa: sin texto buscado el historial
  permanece oculto.
- `searchHistorial` se movió aquí y no al hook de comandos porque es búsqueda
  sobre el resultado de esta consulta, aunque se resuelva en memoria y no
  dispare peticiones.
- Expone `cargarDatos` para la recarga que hoy dispara el pago.

### Hook de egresos

- `src/hooks/nominaEgresosPrestamos/useEgresos.js` es propietario de la lista,
  la carga, el error y el rango de fechas.
- Conserva la consulta inicial del día con `fecha_desde` igual a `fecha_hasta`,
  la protección contra respuestas que no son arreglos y que el indicador de
  carga se enciende en cada consulta.
- Expone tres acciones nombradas en lugar de recargas sueltas:
  `recargarRangoVigente` para el rango actual, `mostrarRangoDeUnDia(fecha)` para
  mover el filtro a un día concreto y consultarlo, y `filtrarHoy`, que es
  `mostrarRangoDeUnDia` con la fecha local.
- Con eso, el salto del filtro a la fecha registrada dejó de ser tres
  instrucciones sueltas en el comando y pasó a ser una sola acción del hook, sin
  cambiar el resultado.
- `buscarPorFechas` conserva el rechazo del rango invertido con su aviso. La
  validación del filtro se quedó en el hook de consulta, no en la página.
- `setFechaDesde` y `setFechaHasta` siguen expuestos crudos porque los campos de
  fecha producen el valor y la página solo lo pasa; nombrarlos no aportaría
  semántica. Es el mismo criterio que la capa 6 de inventario aplicó a
  `setEstadoFiltro`.

### Hook de préstamos

- `src/hooks/nominaEgresosPrestamos/usePrestamos.js` es propietario de
  préstamos, profesores, los dos indicadores de carga, el error, la bandera
  `historialConsultado` y el filtro por profesor.
- Conserva la invariante principal del subflujo: al montar solo consulta
  `/profesores`; el historial nunca se consulta al abrir la página.
- Conserva el cortocircuito cuando no hay profesor elegido, que vacía la lista y
  baja `historialConsultado` sin llamar al backend y sin limpiar el error
  anterior.
- Expone `mostrarHistorialDe(profesorId)`, `limpiarFiltro`, `buscarHistorial` y
  `recargarHistorial`.
- `limpiarFiltro` quedó definido como `mostrarHistorialDe("")`. El
  comportamiento es idéntico al del código anterior, que vaciaba la lista y la
  bandera a mano, porque el cortocircuito hace exactamente eso. La página ya no
  inventa el valor vacío.
- Los dos indicadores de carga permanecen separados: `loadingProfesores`
  deshabilita los selectores y `loadingPrestamos` pinta `Cargando préstamos...`.

### Límites y decisiones

- Las tres páginas ya no declaran `useEffect`, `useCallback`, estado remoto ni
  llamadas de consulta al servicio.
- Tamaño de las páginas: nómina 310 → 286 líneas, egresos 315 → 280 y préstamos
  335 → 274. El `useState` que queda en las tres es de formulario o de modal, y
  corresponde a la capa 4.
- Los errores de carga se conservaron como estado visible en los tres hooks,
  igual que en las páginas originales. No se cambió ninguno por un aviso ni se
  inventó una interfaz de error nueva.
- No se añadieron cancelación, descarte de respuestas antiguas, debounce,
  paginación, sincronización con URL ni almacenamiento porque los flujos
  existentes no los usan.
- Los hooks solo importan servicios y utilidades del módulo; no conocen Axios ni
  endpoints.
- Nómina y egresos usan `loading`; préstamos usa `loadingProfesores` y
  `loadingPrestamos`. Se conservaron los nombres que ya tenían las páginas para
  que el JSX no cambiara en esta capa.

### Verificación de capa 3

- `useConsultasNomina.test.js`: 4 pruebas para carga en paralelo, búsqueda del
  historial, error de carga y recarga que limpia el error anterior.
- `useEgresos.test.js`: 8 pruebas para la consulta del día, la protección de la
  lista, la búsqueda por rango, el rango invertido, el salto a un día, el botón
  `Hoy`, la recarga del rango vigente y el error de carga.
- `usePrestamos.test.js`: 8 pruebas para la carga inicial sin historial, la
  consulta por profesor, la limpieza sin petición, el aviso al buscar sin
  profesor, la búsqueda y recarga del filtro vigente, la protección de la lista
  y los dos errores de carga.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/nominaEgresosPrestamos/ src/services/nominaEgresosPrestamosApi.test.js src/utils/nominaEgresosPrestamos/ src/pages/NominaAdmin.test.jsx src/pages/EgresosAdmin.test.jsx src/pages/PrestamosAdmin.test.jsx`
  — 10 archivos, 96 pruebas correctas.
- Las 31 caracterizaciones de la capa 0 volvieron a pasar sin modificarse.
- ESLint específico sobre páginas, caracterizaciones, hooks/pruebas,
  servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las tres páginas no quedan `useEffect`,
  `useCallback`, llamadas de consulta al servicio ni estado remoto.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 4

### Pago de nómina

- `src/hooks/nominaEgresosPrestamos/usePagoNomina.js` es propietario del modal,
  del empleado seleccionado, de los cinco campos del formulario, del neto y del
  registro del pago.
- Conserva que abrir el modal precarga el salario base con el sueldo del
  empleado y pone bonos, abono y deducciones en `"0"`.
- Conserva las dos validaciones previas con sus textos exactos, que el éxito
  cierra el modal, avisa y recarga las dos tablas, y que un error **deja el
  modal abierto con lo escrito** para reintentar sin recargar.
- Recibe `cargarDatos` del hook de consulta; no duplica estado remoto.

### Formulario de egresos

- `src/hooks/nominaEgresosPrestamos/useFormularioEgreso.js` es propietario del
  formulario, del egreso en edición, de la validación, de la confirmación y de
  la bifurcación crear/actualizar.
- Conserva el rechazo de los egresos automáticos con su aviso, la carga de una
  fila manual recortando la parte horaria de la fecha y la limpieza posterior al
  guardado.
- Recibe `recargarRangoVigente` y `mostrarRangoDeUnDia` del hook de consulta, así
  que la regla de negocio queda legible en una línea: actualizar recarga el rango
  vigente y registrar mueve el filtro al día del egreso creado.

### Comandos de préstamos

- `src/hooks/nominaEgresosPrestamos/useComandosPrestamos.js` es propietario del
  formulario de alta, de su confirmación y del cambio de estado.
- Conserva el orden de las validaciones, la advertencia de que un préstamo no se
  puede eliminar, el salto del filtro al profesor recién prestado y el mensaje
  fijo de error del saldado.
- Se conservó `cambiarEstado(prestamoId, nuevoEstado)` con su parámetro en lugar
  de reducirlo a `saldar(prestamoId)`. Hoy solo se invoca con
  `ESTADO_PRESTAMO_PAGADO`, que es lo único que acepta el backend, pero la página
  ya pasaba una constante nombrada y no un literal inventado; colapsarlo habría
  sido un cambio sin beneficio dentro de una migración.
- Alta y saldado quedaron en un solo hook, como `useFormularioProducto` en
  inventario, que también reunía el formulario del catálogo y el cambio de
  estado por fila.

### Estado de formulario agrupado

- Los tres hooks guardan un único objeto `formulario` con `cambiarCampo(campo,
  valor)`, en lugar de un `useState` por campo. Es el mismo contrato que
  `useFormularioProducto` expone en inventario y el que la capa 5 necesita para
  que las vistas informen cambios por props.
- Los tres `FORMULARIO_VACIO` son constantes de módulo dentro del hook, no de
  `utils`, porque son el estado de arranque del cascarón y no contratos del
  dominio. El de nómina además no es observable: el modal no se pinta hasta que
  se elige un empleado.

### Límites de esta capa

- Las tres páginas ya no declaran `useState` ni contienen `alert`,
  `window.confirm`, payloads, validaciones ni mensajes.
- Tamaño de las páginas: nómina 286 → 238 líneas, egresos 280 → 213 y préstamos
  274 → 209. Lo que queda es JSX y el enlace de hooks con la vista.
- `window.alert` y `window.confirm` permanecen en los hooks de comandos porque
  confirman operaciones y comunican su resultado. No se movieron textos ni se
  introdujo SweetAlert: la inconsistencia con el resto del sistema sigue
  documentada como defecto preexistente y se atiende después del cierre.
- Se renombraron identificadores internos al castellano del resto del módulo
  —`modalOpen` a `modalAbierto`, `selectedEmpleado` a `empleadoSeleccionado`,
  `openModal` a `abrirPago`, `handleGuardar` a `guardarEgreso`—. No hay cambios
  de texto visible, diseño ni comportamiento.
- El botón de pago de nómina sigue sin bloquearse durante la petición: el riesgo
  de doble registro se conserva tal cual y permanece documentado como tarea
  aparte.

### Verificación de capa 4

- `usePagoNomina.test.js`: 7 pruebas para la precarga del sueldo, el recálculo
  del neto, el cierre sin registrar, los dos bloqueos, el registro completo con
  recarga y el error que conserva el modal abierto con lo escrito.
- `useFormularioEgreso.test.js`: 8 pruebas para el estado inicial, el registro
  con salto de filtro, la edición con recarga del rango vigente, el rechazo del
  egreso automático, la validación previa a la confirmación, la cancelación, la
  limpieza y el detalle de error del backend.
- `useComandosPrestamos.test.js`: 8 pruebas para el alta completa, la fecha por
  defecto, el monto inválido, la cancelación, el error con detalle, el saldado
  con recarga, la cancelación del saldado y su error.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/nominaEgresosPrestamos/ src/services/nominaEgresosPrestamosApi.test.js src/utils/nominaEgresosPrestamos/ src/pages/NominaAdmin.test.jsx src/pages/EgresosAdmin.test.jsx src/pages/PrestamosAdmin.test.jsx`
  — 13 archivos, 119 pruebas correctas.
- Las 31 caracterizaciones de la capa 0 volvieron a pasar sin modificarse.
- ESLint específico sobre páginas, caracterizaciones, hooks/pruebas,
  servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las tres páginas no queda `useState`,
  `alert`, `window.confirm`, ni construcción de payloads, validaciones o
  mensajes.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  esta no es la última capa del módulo.

## Implementación de capa 5

### Componentes de nómina

- `EstadoCuentaPersonal.jsx`: tarjeta del estado de cuenta con su tabla,
  indicador de carga, estado vacío, saldo coloreado y botón de pago por fila.
- `HistorialNomina.jsx`: buscador, tabla de pagos, indicador de carga y los dos
  estados vacíos —el que pide escribir un nombre y el que avisa que ese empleado
  no tiene pagos—.
- `ModalPagoNomina.jsx`: cabecera, resumen del empleado con su deuda, los cinco
  campos, el neto y los tres botones. Recibe `empleado` ya resuelto; la decisión
  de mostrarlo permanece en la página porque es composición.

### Componentes de egresos

- `FormularioEgreso.jsx`: los cinco campos, las cuatro categorías, el
  encabezado y los botones que cambian entre registrar y actualizar, y el
  `Cancelar edición` que solo existe en modo edición.
- `HistorialEgresos.jsx`: rango de fechas, botones `Buscar` y `Hoy`, total del
  rango, tabla, estado vacío y la distinción entre fila manual y `Automático`.

### Componentes de préstamos

- `FormularioPrestamo.jsx`: selector de profesor con documento, monto, fecha,
  notas y su botón; el selector se deshabilita mientras cargan los profesores.
- `HistorialPrestamos.jsx`: filtro por profesor, botones `Buscar` y `Limpiar`,
  total por cobrar, recuadro punteado inicial, tabla, insignia de estado y la
  acción `Saldar`.

### Clases pendientes desde las capas 1 y 4

- Se extrajeron a utilidades puras `claseSaldoEmpleado` y `claseDeudaEmpleado`
  —la misma regla con dos paletas distintas, que es justo la razón por la que no
  se podían unificar—, `tieneDeudaDePrestamos`, `puedeAbonarAPrestamos` y
  `claseEstadoPrestamo`.
- Con eso, los componentes ya no contienen ternarios de estado y las cinco
  reglas quedaron protegidas por pruebas unitarias.

### El formato monetario **no** se extrajo

La entrega de la capa 4 anunció que esta capa extraería también los `toFixed(2)`
incrustados. Al abrirlos se comprobó que no son un mismo contrato:

- nómina y préstamos usan `valor.toFixed(2)`, que revienta si el backend
  devuelve `null`;
- egresos usa `Number(valor || 0).toFixed(2)`, que lo tolera y muestra `0.00`.

Unificarlos en un solo formateador obligaría a elegir una de las dos, y
cualquiera de las dos elecciones cambiaría el comportamiento de la otra
pantalla. Se conservan tal cual, incrustados en el JSX, que es además el mismo
criterio que aplicó el módulo de inventario y ventas. Queda documentado como
diferencia conocida, no como deuda a resolver dentro de la migración.

### Compatibilidad visual

- Se movió el JSX existente conservando clases Tailwind, textos, emojis,
  estructura de tablas, breakpoints, desplazamiento horizontal, `required`,
  `title`, `rows` y el `disabled={false}` heredado del campo de bonos.
- Los componentes no administran estado de dominio: todos los cambios se
  comunican mediante callbacks. Los formularios informan cada campo con
  `onCambiarCampo(campo, valor)`, que el hook resuelve con una actualización
  funcional.
- Los componentes solo importan React y utilidades puras del módulo. Ninguno
  conoce hooks, servicios, Axios ni endpoints.
- `NominaAdmin.jsx` quedó en 64 líneas, `EgresosAdmin.jsx` en 62 y
  `PrestamosAdmin.jsx` en 63. Las tres conectan hooks con componentes y solo
  conservan el contenedor, el título y el mensaje de error de la pantalla.

### Verificación de capa 5

- `EstadoCuentaPersonal.test.jsx`: 4 pruebas para carga, estado vacío, colores
  del saldo y el empleado informado al pedir el pago.
- `HistorialNomina.test.jsx`: 4 pruebas para los dos estados vacíos, la fila con
  sus cuatro montos y el buscador con su indicador de carga.
- `ModalPagoNomina.test.jsx`: 4 pruebas para el resumen con el neto, el abono
  deshabilitado sin deuda, el campo informado y los dos cierres más el envío.
- `FormularioEgreso.test.jsx`: 4 pruebas para el modo registro, el modo edición,
  los valores reflejados y los campos informados.
- `HistorialEgresos.test.jsx`: 4 pruebas para el total, la distinción
  manual/automático, la carga con el estado vacío y las acciones del rango.
- `FormularioPrestamo.test.jsx`: 4 pruebas para el listado con documento, el
  selector deshabilitado, los campos informados y el envío.
- `HistorialPrestamos.test.jsx`: 5 pruebas para el recuadro inicial, el total
  con las dos insignias, el historial vacío, las acciones del filtro y el
  saldado, y el indicador de carga.
- Pruebas unitarias nuevas: 3 para las cinco reglas extraídas.
- Suite específica completa:
  `pnpm exec vitest run src/components/nominaEgresosPrestamos/ src/hooks/nominaEgresosPrestamos/ src/services/nominaEgresosPrestamosApi.test.js src/utils/nominaEgresosPrestamos/ src/pages/NominaAdmin.test.jsx src/pages/EgresosAdmin.test.jsx src/pages/PrestamosAdmin.test.jsx`
  — 20 archivos, 151 pruebas correctas.
- Las 31 caracterizaciones de la capa 0 volvieron a pasar sin modificarse
  después de mover todo el JSX.
- ESLint específico sobre páginas, caracterizaciones, componentes/pruebas,
  hooks/pruebas, servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que los siete componentes solo importan React
  y utilidades puras del módulo.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  la capa 7 de cierre todavía está pendiente.

## Implementación de capa 6

### Revisión de las tres raíces

- `src/pages/NominaAdmin.jsx` quedó en 64 líneas, `src/pages/EgresosAdmin.jsx`
  en 62 y `src/pages/PrestamosAdmin.jsx` en 60.
- Las tres importan **solo** React, sus componentes y sus hooks. Ninguna importa
  ya utilidades ni servicios.
- Ninguna contiene endpoints, transformaciones ni bloques visuales. Ninguna lee
  parámetros de ruta porque estas tres pantallas no reciben ninguno; las rutas
  `/admin/nomina`, `/admin/egresos` y `/admin/prestamos` siguen resueltas por
  `App.jsx` bajo `AdminRoute`, sin cambios.

### Primer ajuste: la página inventaba el estado de saldado

- `useComandosPrestamos` exponía `cambiarEstado(prestamoId, nuevoEstado)` y era
  la página la que componía
  `onSaldar={(id) => cambiarEstado(id, ESTADO_PRESTAMO_PAGADO)}`.
- Se reemplazó por `saldarPrestamo(prestamoId)`. El hook conserva la semántica
  de su propio comando y la página solo enlaza una acción ya nombrada.
- Esto revierte la decisión que tomó la capa 4, que conservó el parámetro
  argumentando que la página pasaba una constante nombrada y no un literal. La
  capa 6 es justamente donde se revisa qué sigue componiendo la raíz, y aquí
  seguía componiendo una regla de dominio. Es el mismo ajuste que hizo la capa 6
  de inventario con `setMostrarDropdownEstudiantes`.
- El comportamiento no cambia: `Saldar` era y sigue siendo el único cambio de
  estado existente, y el backend rechaza cualquier valor distinto de `Pagado`.

### Segundo ajuste: los totales se calculaban en la página

- `EgresosAdmin` llamaba a `totalEgresos(egresos)` y `PrestamosAdmin` a
  `totalPrestamosPendientes(prestamos)` dentro del JSX.
- Los dos totales pasaron a los hooks de consulta, que ya son dueños de sus
  listas: `useEgresos` expone `total` y `usePrestamos` expone `totalPendiente`.
- Es el mismo criterio que la capa 3 aplicó a `historialMostrado` en nómina: la
  derivación vive con el dueño del dato, no en la raíz de composición.

### Decisión sobre el cascarón compartido

- El contenedor `p-6`, el título y el párrafo de error permanecen en cada
  página. No se extrajo un componente común.
- La razón es concreta: el aviso de error de nómina usa
  `text-red-600 mb-4 bg-red-50 p-2 rounded` y los de egresos y préstamos usan
  `text-red-500 mb-4`. Un componente compartido tendría que unificar el estilo
  —que sería un cambio visual prohibido en esta migración— o recibir sus clases
  por props, que es la misma línea de JSX con más indirección.
- Además, el contenedor, el título y el error de la pantalla son composición: es
  exactamente lo que una raíz debe conservar.

### Setters crudos que se conservan

- `setFechaDesde`, `setFechaHasta` y `setSearchHistorial` siguen expuestos tal
  cual. En los tres casos el campo produce el valor y la página solo lo pasa,
  sin inventar semántica. Renombrarlos habría sido movimiento sin beneficio, que
  es el mismo criterio que la capa 6 de inventario aplicó a `setEstadoFiltro`.

### Límites finales del módulo

- Las páginas conectan hooks con componentes y componen la pantalla.
- Los componentes solo presentan props y callbacks.
- Los hooks coordinan consultas, formularios y comandos.
- `nominaEgresosPrestamosApi.js` es el único archivo del módulo que conoce
  endpoints y Axios.
- Las utilidades concentran contratos, transformaciones y reglas de clase puras.

### Verificación de capa 6

- Suite específica completa:
  `pnpm exec vitest run src/components/nominaEgresosPrestamos/ src/hooks/nominaEgresosPrestamos/ src/services/nominaEgresosPrestamosApi.test.js src/utils/nominaEgresosPrestamos/ src/pages/NominaAdmin.test.jsx src/pages/EgresosAdmin.test.jsx src/pages/PrestamosAdmin.test.jsx`
  — 20 archivos, 151 pruebas correctas.
- `useComandosPrestamos.test.js` cubre el saldado por su acción nombrada, y
  `useEgresos.test.js` y `usePrestamos.test.js` cubren además los dos totales.
- Las 31 caracterizaciones de la capa 0 volvieron a pasar sin modificarse.
- ESLint específico sobre páginas, caracterizaciones, componentes/pruebas,
  hooks/pruebas, servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  la capa 7 de cierre todavía está pendiente.

## Capa 7: cierre final

### Documentación sincronizada

- `docs/modularizacion/README.md` marca el módulo como terminado con commit
  pendiente.
- `docs/ARQUITECTURA_FRONTEND.md` registra las cuatro carpetas nuevas, la
  sección del dominio con sus rutas y límites, y la cobertura de pruebas.
- `docs/COMPONENTES.md` registra los siete componentes, las tres páginas, los
  hooks, el servicio y las utilidades.
- `docs/CAMBIOS_FRONTEND.md` contiene la entrada consolidada del módulo.

### Verificación final

- Suite específica: 20 archivos y 151 pruebas correctas.
- `pnpm run check:deploy`: correcto.
  - Vitest: 209 archivos y 883 pruebas correctas.
  - ESLint global: correcto.
  - Build de producción: correcto; 325 módulos transformados.
- La suma cuadra con la línea base: el repositorio tenía 189 archivos y 732
  pruebas antes del módulo. 189 + 20 = 209 y 732 + 151 = 883, es decir que el
  módulo agregó exactamente su propia suite y no alteró ninguna otra.
- `git diff --check`: correcto.
- El diff pertenece únicamente a nómina, egresos, préstamos, sus pruebas y la
  documentación específica y global exigida para el cierre. Los tres documentos
  globales cambiaron **solo por adición**: 54, 48 y 42 líneas, sin eliminaciones.
  `docs/modularizacion/README.md` cambió una sola celda de estado.
- Las rutas `/admin/nomina`, `/admin/egresos` y `/admin/prestamos` conservan
  `AdminRoute`. `App.jsx` y `NavAdmin.jsx` no se modificaron.
- `nominaEgresosPrestamosApi.js` es el único archivo del módulo que importa
  `utils/api.js` y contiene sus diez contratos. Ninguna página, componente, hook
  o utilidad del módulo importa Axios ni contiene cadenas de endpoint; las únicas
  apariciones restantes están en las caracterizaciones, que simulan el cliente a
  propósito, y en un comentario de `utils/nominaEgresosPrestamos/egresos.js`.
- No quedan implementaciones antiguas duplicadas: las tres páginas fueron
  reescritas como raíces de composición y no existe una versión paralela del
  estado de cuenta, del historial, del modal de pago ni de los dos formularios.
  El módulo no tenía componentes previos, así que no hubo archivos que eliminar.
- Reducción de las tres páginas: `NominaAdmin.jsx` de 312 a 64 líneas,
  `EgresosAdmin.jsx` de 324 a 62 y `PrestamosAdmin.jsx` de 326 a 60.

### Verificación manual posterior al deploy

1. Iniciar sesión como administrador y abrir `Admin > Nómina`; confirmar que la
   tabla lista a todo el personal con documento, nombre y saldo de préstamos, y
   que el saldo mayor que cero aparece en rojo y el saldo cero en verde.
2. Confirmar que el historial de pagos muestra el aviso
   `🔍 Escriba el nombre de un empleado...` y **ninguna fila** hasta escribir.
   Escribir el apellido de un empleado con pagos y confirmar que aparecen sus
   filas; escribir un texto inexistente y confirmar el aviso de que no hay pagos.
3. Pulsar `Realizar Pago` de un empleado **sin deuda**; confirmar que el salario
   base viene precargado con su sueldo, que el campo `Abonar a Préstamos` está
   deshabilitado y que no aparece la ayuda `Máx:`. Cerrar con `Cancelar`.
4. Pulsar `Realizar Pago` de un empleado **con deuda**; confirmar la ayuda
   `Máx: <saldo>` y que el total neto se recalcula al escribir bonos, abono y
   otras deducciones.
5. Escribir un abono mayor que la deuda y pulsar `Confirmar Pago`; confirmar el
   aviso que lo prohíbe y que **no** se registró nada. Escribir deducciones que
   dejen el neto en negativo y confirmar el otro aviso.
6. Registrar un pago real de prueba con un abono válido; confirmar el aviso de
   éxito, que el modal se cierra, que las dos tablas se recargan y que el saldo
   de préstamos del empleado bajó por el monto abonado.
7. Abrir `Admin > Préstamos`; confirmar que el historial **no** se carga solo y
   muestra el recuadro punteado. Elegir el mismo profesor del paso 6 y confirmar
   que el préstamo abonado refleja el nuevo estado.
8. Pulsar `Buscar` sin profesor elegido y confirmar el aviso. Pulsar `Limpiar` y
   confirmar que el historial vuelve al recuadro punteado y el total a `$0.00`.
9. Registrar un préstamo de prueba sin escribir fecha; confirmar que la
   confirmación muestra el nombre del profesor, el monto en formato colombiano y
   la advertencia de que no se podrá eliminar. Aceptar y confirmar que el filtro
   salta a ese profesor y que su historial aparece con el préstamo `Pendiente`.
10. Pulsar `Saldar` en ese préstamo; confirmar el diálogo, que la insignia pasa a
    verde, que la fila muestra `Saldado` y que el total por cobrar disminuye.
11. Abrir `Admin > Egresos`; confirmar que solo se muestran los egresos del día y
    que el pago de nómina del paso 6 aparece como fila `Automático`, sin botón
    `Editar`.
12. Registrar un egreso de prueba con una fecha distinta de hoy; confirmar la
    confirmación con concepto, monto, fecha y categoría, y que después el filtro
    `Desde`/`Hasta` **salta a esa fecha** y la tabla muestra el egreso creado.
13. Editar ese egreso, cambiar su monto y confirmar que se actualiza y que el
    rango de fechas **no** se mueve. Pulsar `Cancelar edición` en otra fila y
    confirmar que el formulario vuelve a `Registrar Nuevo Egreso`.
14. Poner `Desde` posterior a `Hasta` y pulsar `Buscar`; confirmar el aviso y que
    la tabla no cambia. Pulsar `Hoy` y confirmar que vuelve al día actual.
15. Comprobar en `Admin > Reportes` que los egresos del rango incluyen tanto el
    egreso manual de prueba como el automático de la nómina.
16. En ancho móvil, comprobar que las cuatro tablas conservan desplazamiento
    horizontal, que el modal de nómina cabe en pantalla con su propio scroll y
    que los filtros de egresos y préstamos se apilan.

### Commit sugerido

`refactor(nomina): modularizar nómina, egresos y préstamos`

## Primera acción

Cumplida en la capa 0: nómina, egresos y préstamos quedaron inventariados por
separado, sus dependencias reales están documentadas y los diez contratos HTTP
están protegidos por pruebas antes de extraer utilidades.

## Entrega final

- Última capa terminada: Capa 7, cierre.
- Archivos de producción modificados: `NominaAdmin.jsx`, `EgresosAdmin.jsx` y
  `PrestamosAdmin.jsx` como raíces de composición; siete componentes
  presentacionales; seis hooks; `nominaEgresosPrestamosApi.js` y tres utilidades
  del dominio. No se eliminó ningún archivo porque el módulo no tenía
  componentes previos.
- Riesgos abiertos: ninguno dentro del alcance. Quedan pendientes, **fuera de la
  migración**, los seis defectos preexistentes que esta se conservó a propósito y
  que conviene atender en commits separados:
  1. El botón `Confirmar Pago` de nómina no se bloquea durante la petición, así
     que un doble clic registra dos nóminas, abona dos veces los préstamos y crea
     dos egresos automáticos. Es el más grave.
  2. Nómina paga sin pedir confirmación, a diferencia de egresos y préstamos.
  3. `salario_base` es el único monto sin respaldo `|| 0` y puede viajar `NaN`.
  4. La fecha por defecto de préstamos es UTC y la de egresos es local: en
     Colombia, después de las 19:00 un préstamo sin fecha queda con la del día
     siguiente.
  5. Los tres subflujos usan `window.alert` y `window.confirm` mientras el resto
     del sistema ya migró a SweetAlert.
  6. Egresos y préstamos tampoco bloquean su botón de envío, aunque el
     `window.confirm` previo reduce mucho la ventana.
- Seguimiento (2026-10-20): los defectos 1 y 2, y la parte de nómina del 5,
  quedaron atendidos en el paso 1 de
  `docs/funcionalidades/EXPERIENCIA_CARTERA_NOMINA.md` (el pago se confirma,
  no se envía dos veces y avisa con SweetAlert). El 4 ya se había corregido el
  2026-09-30 (`fechaColombia.js`). El 5 (egresos y préstamos) y el 6 quedaron
  atendidos en el paso 2 del mismo documento: SweetAlert y botones que se
  bloquean mientras guardan.
- Deuda transversal registrada: `obtenerFechaLocal` existe duplicada en
  `utils/pagos/formatos.js` y `utils/nominaEgresosPrestamos/egresos.js`.
  Unificarla exige una tarea que toque el módulo de pagos.
- Diferencia conocida que no es defecto: nómina y préstamos formatean con
  `valor.toFixed(2)` y egresos con `Number(valor || 0).toFixed(2)`.
  **Resuelta el 2026-10-21** (paso 4 de
  `docs/funcionalidades/EXPERIENCIA_CARTERA_NOMINA.md`): los tres usan
  `formatearPesos` de `src/utils/formatoPesos.js`, sin centavos, que además
  tolera un valor vacío.
- Siguiente capa pendiente: Ninguna.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual como seguimiento operativo si todavía no fue
  registrada.
