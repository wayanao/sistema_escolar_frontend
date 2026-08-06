# Modularización: Inventario y ventas

## Control

- Estado: Terminado; commit pendiente.
- Orden: 10.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: `e8a11bcdf32e92a0002a5b2b9032031161db09ad`.
- Commit final: Pendiente.
- Última actualización: 2026-08-06.

## Objetivo

Separar catálogo, estado operativo, ventas, cargos y anulaciones sin modificar
existencias, valores ni relaciones con pagos.

## Inventario confirmado en capa 0

### Catálogo de productos

- `src/pages/InventarioAdmin.jsx` es hoy página, consulta, comandos,
  transformaciones y presentación en un solo archivo de 283 líneas.
- Contiene el filtro de estado, el formulario de alta/edición, la tabla de
  productos y el cambio de estado por fila.
- Constantes locales: `ESTADOS_PRODUCTO` (activo/inactivo), `FILTROS_PRODUCTO`
  (activo/inactivo/todos), `estadoLabel` y `estadoClasses`.

### Caja y cargos al estudiante

- `src/pages/VentasAdmin.jsx` es hoy página, consultas, carrito, comando de
  venta, anulación y volante imprimible en un solo archivo de 430 líneas.
- Contiene el catálogo vendible, el carrito, el buscador de estudiantes, el
  historial de cargos y la vista de impresión.

### Corrección del inventario inicial

- `src/components/FacturaModerna.jsx` estaba listado en la versión previa de
  este documento pero **no existe** en el repositorio. La impresión real se
  resuelve con `src/components/impresion/DocumentoImprimible.jsx`.
- Al iniciar la migración el módulo eran exactamente dos archivos de
  producción: las dos páginas. No había componentes, hooks, servicios ni
  utilidades propias.

### Entradas, roles y dependencias externas

- Rutas: `/admin/inventario` y `/admin/ventas`, ambas bajo `AdminRoute` en
  `src/App.jsx` y ambas cargadas con `lazy`.
- `src/components/NavAdmin.jsx` las expone como `Inventario` y `Punto de Venta`
  en escritorio y móvil.
- El módulo no lee ni escribe `localStorage`. La única lectura relacionada es la
  del control de acceso global.
- `GET /estudiantes` es una dependencia de datos del módulo de estudiantes. Se
  consume en modo lectura y no autoriza a modificar ese dominio.
- `DocumentoImprimible` es una dependencia compartida estable. No se modifica ni
  se duplica en este módulo.
- Consumidores externos del dominio que permanecen fuera de alcance:
  `CarteraVencidaAdmin` muestra deuda de inventario y ventas pendientes, y
  `PagosAdmin` y `DetalleEstudianteAdmin` leen ventas del estudiante. Ninguno se
  toca en esta migración.

## Contratos HTTP inventariados

| Método | Ruta | Uso actual |
|---|---|---|
| `GET` | `/inventario` con `params: { estado }` | Catálogo administrativo por estado. |
| `POST` | `/inventario` | Crear producto. |
| `PUT` | `/inventario/:id` | Actualizar producto. |
| `PATCH` | `/inventario/:id/estado` | Activar o desactivar producto. |
| `GET` | `/api/ventas/` | Historial completo de cargos. |
| `POST` | `/api/ventas/` | Registrar el cargo del carrito. |
| `POST` | `/api/ventas/:id/anular` | Anular un cargo con motivo. |
| `GET` | `/estudiantes` | Dependencia externa de solo lectura. |

Contratos de escritura protegidos por caracterización:

- Producto: `{ nombre, costo: parseFloat, precio_venta: parseFloat,
  stock_actual: parseInt(…, 10), estado }`. La ruta cambia entre `POST` y
  `PUT /inventario/:id` según `editingId`.
- Estado de producto: `{ estado }` por `PATCH`; la respuesta puede traer
  `estado` y en ese caso tiene prioridad sobre el valor solicitado.
- Venta: `{ estudiante_id: parseInt, tipo_venta: "Credito", total, notas,
  detalles: [{ inventario_id, cantidad, precio_unitario, subtotal }] }`.
- Anulación: `{ motivo: value.trim() }`.

Capacidades del backend que el frontend **no** usa hoy y que no deben adoptarse
durante la migración: `limit`, `offset`, `busqueda` y `solo_con_stock` en
`/inventario`; `limit`, `offset`, `busqueda`, `estudiante_id` y `estado` en
`/api/ventas/`; y `GET /api/ventas/pendientes/:estudiante_id`. Incorporarlas
sería una función nueva.

## Invariantes

- Estados activo, inactivo y todos.
- Creación y actualización de productos.
- Registro y anulación de ventas.
- Asociación de ventas pendientes con estudiantes y pagos.
- Montos, cantidades y disponibilidad.
- Presentación de factura cuando corresponda.

### Invariantes precisadas en capa 0

- El filtro de inventario arranca en `activo` y cada cambio dispara una consulta
  nueva con ese `estado`.
- Cambiar el estado de un producto **no** recarga el listado: actualiza la lista
  en memoria y descarta las filas que dejan de cumplir el filtro activo.
- El spinner de inventario solo aparece en la carga inicial; los cambios de
  filtro no lo reactivan.
- El formulario exige los cuatro campos y muestra `Atención` antes de enviar.
- El éxito se decide por `res.status >= 200 && res.status < 300`.
- La insignia de stock se pinta en rojo cuando `stock_actual <= 5`.
- La caja solo ofrece productos `estado=activo` y además con
  `stock_actual > 0`; ese segundo filtro es del cliente.
- El carrito nunca supera el `stock_actual` del producto, ni al añadir ni al
  incrementar la cantidad.
- Toda venta es `tipo_venta: "Credito"`; `Público General` está explícitamente
  prohibido.
- El volante se arma en memoria con el carrito y la fecha local; del backend
  solo se usa `res.data.id`.
- El historial de cargos solo se muestra cuando hay un estudiante escrito o un
  estudiante recién cargado, y filtra por `estudiante_id`.
- La anulación exige un motivo de al menos 5 caracteres, admite hasta 300 y
  envía el texto recortado.
- Una venta anulada conserva su fila, muestra el motivo y ya no ofrece `Anular`.

## Riesgos iniciales

- Alterar stock o registrar ventas duplicadas.
- Perder trazabilidad de anulaciones.
- Mezclar productos inactivos con disponibilidad operativa.
- Romper integración con pagos.

## Riesgos y decisiones registrados en capa 0

- `VentasAdmin.jsx` usa `window.alert` mientras `InventarioAdmin.jsx` usa
  SweetAlert. La inconsistencia es comportamiento vigente y se conserva; se
  documenta como deuda de producto, no se unifica dentro de la migración.
- `VentasAdmin.jsx` declara `const [, setLoading] = useState(true)`: escribe el
  estado de carga pero nunca lo lee, por lo que la caja no tiene indicador
  visual. Se conserva tal cual; agregar uno sería una función nueva.
- `notas` existe como estado y viaja en el payload, pero ninguna vista permite
  escribirlo: siempre se envía `""`. El campo se conserva en el contrato.
- El botón `Cargar al Estudiante` no se deshabilita mientras la petición está en
  vuelo, así que un doble clic puede registrar dos cargos. Es un riesgo real y
  preexistente; corregirlo excede la migración y debe atenderse en una tarea
  aparte.
- `handleAgregarAlCarrito` usa `parseInt(productoId)` sin base explícita. Se
  conserva el comportamiento; solo se moverá tal cual si esa comparación llega a
  extraerse.
- Las cifras se formatean con `toLocaleString()` sin locale fijo, de modo que el
  separador depende del entorno. Las pruebas comparan contra `toLocaleString()`
  para no fijar un formato que hoy no está fijado.
- El error de carga de la caja solo avisa con `alert` y el de inventario con
  SweetAlert; ninguno deja estado de error consultable. Se conserva.
- Se decidió no abrir ni modificar `PagosAdmin.jsx`,
  `CarteraVencidaAdmin.jsx` ni el dominio de estudiantes, y no crear
  abstracciones compartidas nuevas.
- La capa 0 solo agregó caracterización y documentación; no cambió código de
  producción, rutas, textos, diseño ni payloads.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-08-06) |
| 1. Utilidades puras | Terminada (2026-08-06) |
| 2. Servicio HTTP | Terminada (2026-08-06) |
| 3. Hooks de consulta | Terminada (2026-08-06) |
| 4. Hooks de comandos | Terminada (2026-08-06) |
| 5. Presentación | Terminada (2026-08-06) |
| 6. Composición | Terminada (2026-08-06) |
| 7. Cierre | Terminada (2026-08-06) |

## Verificación de capa 0

- Antes de modificar: rama `main`, árbol limpio y `main == origin/main` en
  `e8a11bcdf32e92a0002a5b2b9032031161db09ad`.
- No existía un hash contradictorio en este documento: el commit base estaba
  marcado para registrarse al iniciar y quedó fijado al `HEAD` publicado.
- Prueba previa de la dependencia compartida:
  `pnpm exec vitest run src/components/impresion/DocumentoImprimible.test.jsx`
  — 1 archivo, 2 pruebas correctas.
- Verificación específica final:
  `pnpm exec vitest run src/pages/InventarioAdmin.test.jsx src/pages/VentasAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 3 archivos, 12 pruebas correctas.
- Caracterización nueva: 4 pruebas de inventario y 6 pruebas de ventas.
  Protegen endpoints y parámetros, filtro por estado, payloads de creación,
  edición y cambio de estado, actualización local sin recarga, filtrado por
  stock, tope del carrito, total, bloqueo sin estudiante, payload de la venta a
  crédito, refresco posterior, payload de anulación con motivo recortado y el
  volante imprimible con `tipo="volante_venta"`.
- ESLint específico sobre las dos páginas y sus dos caracterizaciones: correcto.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta no
  es la última capa del módulo.

## Implementación de capa 1

### Unidades extraídas

- `src/utils/inventarioVentas/inventario.js`: estados y filtros del producto,
  formulario inicial, estado efectivo con respaldo en `activo`, etiqueta y
  clases de estado, verbo de la confirmación, validación del formulario, carga
  del formulario desde un producto, payload del producto, rango HTTP exitoso,
  coincidencia con el filtro y actualización local del listado.
- `src/utils/inventarioVentas/ventas.js`: catálogo vendible, subtotal y total,
  transformaciones inmutables del carrito, payload de la venta a crédito,
  nombre del estudiante y del cliente del volante, armado del volante, búsqueda
  de estudiantes, resolución del estudiante del historial, filtro de ventas,
  permiso de anulación, validación del motivo, payload de anulación y mensaje
  de error de anulación.
- Las utilidades no realizan HTTP, no usan React ni DOM, no acceden a
  almacenamiento y no disparan efectos.

### Integración conservada

- `InventarioAdmin.jsx` conserva consultas, comandos, confirmaciones, mensajes,
  estado del formulario y toda la presentación. Solo delega constantes,
  validación, payload y la actualización local del listado.
- `VentasAdmin.jsx` conserva las tres consultas, el comando de venta, la
  anulación con SweetAlert, los avisos con `alert`, el volante y la
  composición visual. Solo delega transformaciones puras.
- `agregarProductoAlCarrito` devuelve `{ carrito, sinStock }` para que el aviso
  de stock agotado siga decidiéndose en la página. La utilidad no muestra
  mensajes.
- `construirPayloadVenta` recalcula el total con `calcularTotalVenta`, que es la
  misma reducción que alimenta el total visible; el valor enviado no cambia.
- `construirVolanteVenta` conserva la copia del carrito y recibe la fecha ya
  formateada, porque `new Date().toLocaleDateString()` es un efecto local que
  permanece en la página.
- El historial calcula una sola vez `ventasDelEstudiante`, que antes se filtraba
  dos veces con la misma expresión. El resultado visible es idéntico.
- No se movieron endpoints, efectos, mensajes, rutas ni componentes y no se creó
  ninguna abstracción compartida fuera del módulo.

### Decisiones de alcance

- No se extrajo el formato monetario. Hoy vive como `${valor.toLocaleString()}`
  incrustado en el JSX; convertirlo en utilidad alteraría el marcado sin
  beneficio de contrato. Corresponde revisarlo en la capa 5 si aporta.
- Tampoco se extrajeron los ternarios de clases que solo existen dentro del
  JSX: la insignia de stock bajo en inventario y las clases de fila, total y
  estado de una venta anulada. Son presentación y pertenecen a la capa 5.
  `claseEstadoProducto` sí se movió porque ya era un mapa constante del módulo.
- `parseInt` sin base se conservó donde ya estaba, tanto en el payload de la
  venta como en las búsquedas locales de la página.
- El texto del validador del motivo se mantuvo literal en lugar de componerlo
  con la constante mínima, para no depender de una interpolación al conservar
  un mensaje visible.

### Verificación de capa 1

- Pruebas unitarias nuevas: 13 pruebas de inventario y 18 pruebas de ventas.
- Suite específica completa:
  `pnpm exec vitest run src/utils/inventarioVentas/inventario.test.js src/utils/inventarioVentas/ventas.test.js src/pages/InventarioAdmin.test.jsx src/pages/VentasAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 5 archivos, 43 pruebas correctas.
- Las diez caracterizaciones de la capa 0 pasaron sin modificarse, que es la
  prueba de que la extracción conservó el comportamiento.
- ESLint específico sobre las dos páginas, sus caracterizaciones y todas las
  utilidades y pruebas de `src/utils/inventarioVentas/`: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las páginas no quedan payloads
  duplicados, filtros de stock, reducciones de total ni comparaciones del rango
  HTTP.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` como cierre
  porque esta no es la última capa del módulo.

## Implementación de capa 2

### Servicio HTTP

- `src/services/inventarioVentasApi.js` centraliza los ocho contratos
  inventariados: inventario por estado, creación, actualización y cambio de
  estado del producto; ventas, estudiantes, registro de venta y anulación.
- Las consultas devuelven `response.data`. Crear, actualizar y cambiar el estado
  del producto devuelven `{ status, data }` porque la interfaz existente
  comprueba el rango HTTP antes de mostrar éxito y el cambio de estado además
  lee `data.estado`.
- Registrar y anular una venta devuelven los datos del backend; el registro los
  usa para el identificador del volante y la anulación los ignora hoy.
- El servicio no atrapa errores, no decide mensajes, no usa React y no
  transforma payloads. Los errores de Axios se propagan intactos.
- `obtenerInventario(estado)` sirve a las dos páginas: el catálogo administrativo
  pasa su filtro y la caja pasa `"activo"`. No se duplicó el transporte.

### Integración conservada

- `InventarioAdmin.jsx` conserva carga, recarga por filtro, validación,
  confirmaciones, mensajes y estados visuales. La bifurcación crear/actualizar
  ya no arma rutas: elige entre dos funciones del servicio.
- `VentasAdmin.jsx` conserva las tres consultas en paralelo, el aviso con
  `alert` al fallar la carga, el registro del cargo, el refresco posterior y la
  anulación con SweetAlert.
- Ninguna página del módulo importa `utils/api.js` después de esta capa.
- No se añadieron parámetros, señales de cancelación ni rutas nuevas porque los
  contratos actuales no los tenían. Las capacidades de paginación del backend
  siguen sin usarse.

### Decisiones de alcance

- `GET /estudiantes` se expone como `obtenerEstudiantesParaVentas` dentro del
  servicio del módulo en lugar de importar el servicio de otro dominio. Es el
  mismo criterio que ya aplican `pagosApi.js` con `/estudiantes` y
  `carteraTiposPagoApi.js` con `/cursos`: cada módulo posee su transporte y no
  se crea una abstracción compartida.
- La función del servicio se llama `anularVenta` y la página la importa como
  `anularVentaRemota` para no chocar con su manejador local, que en la capa 4
  pasará a un hook de comandos.

### Verificación de capa 2

- `src/services/inventarioVentasApi.test.js` agrega 6 pruebas que cubren los
  ocho contratos, métodos, rutas, parámetros, payloads, datos y estado
  devueltos, y la propagación de errores.
- Suite específica completa:
  `pnpm exec vitest run src/services/inventarioVentasApi.test.js src/utils/inventarioVentas/inventario.test.js src/utils/inventarioVentas/ventas.test.js src/pages/InventarioAdmin.test.jsx src/pages/VentasAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 6 archivos, 49 pruebas correctas.
- Las caracterizaciones de la capa 0 volvieron a pasar sin modificarse: siguen
  simulando `utils/api.js`, que ahora alcanzan a través del servicio.
- ESLint específico sobre páginas, caracterizaciones, servicio/prueba y
  utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las dos páginas no quedan
  importaciones de `utils/api.js`, llamadas a Axios ni cadenas de endpoint.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` como cierre
  porque esta no es la última capa del módulo.

## Implementación de capa 3

### Hook del catálogo

- `src/hooks/inventarioVentas/useInventario.js` es propietario de productos,
  carga, filtro de estado y recarga.
- Conserva el arranque en `activo`, la consulta por cada cambio de filtro, el
  mensaje de consola y el aviso de SweetAlert al fallar, y que la carga siempre
  termina.
- El spinner sigue apareciendo solo en la carga inicial: los cambios de filtro
  no reactivan `loading`, porque nunca vuelve a ponerse en `true`.
- Expone `aplicarEstadoLocal(productoId, estado)` para que el comando de cambio
  de estado siga actualizando la lista en memoria y descartando las filas que
  dejan de cumplir el filtro, sin volver a consultar.
- Expone `cargarInventario` para las recargas que hoy dispara el formulario.

### Hook de consultas de la caja

- `src/hooks/inventarioVentas/useConsultasVentas.js` es propietario de las tres
  consultas en paralelo, del catálogo vendible y del historial de cargos.
- Conserva `Promise.all`, el filtro de existencias sobre el inventario activo,
  el `console.error` y el `alert` de error, y expone `cargarDatos` para el
  refresco posterior a una venta o a una anulación.
- Conserva el estado de carga heredado que se escribe pero nunca se lee, y por
  eso no lo expone: publicar un `loading` que hoy no tiene consumidor invitaría
  a añadir un indicador que la caja nunca tuvo.

### Límites y decisiones

- Las páginas ya no declaran `useEffect`, estado remoto ni llamadas al
  servicio de consulta.
- `InventarioAdmin.jsx` pasó de 283 a 244 líneas y `VentasAdmin.jsx` de 430 a
  395. Ambas conservan formularios, carrito, comandos y presentación, que
  corresponden a las capas 4 y 5.
- El derivado `ventasDelEstudiante` permanece en `VentasAdmin.jsx` porque
  depende de `estudianteId` y `estudianteFiltroId`, que son estado de selección
  y de comando; su dueño será el hook de la capa 4.
- El aviso de error de carga se conservó dentro de cada hook en lugar de
  exponer un estado de error nuevo. Mantiene el comportamiento actual y evita
  inventar una interfaz de error que no existía.
- No se añadieron cancelación, descarte de respuestas antiguas, debounce,
  paginación, sincronización con URL ni almacenamiento porque los flujos
  existentes no los usan.
- Los hooks solo importan servicios y utilidades del módulo; no conocen Axios ni
  endpoints.

### Verificación de capa 3

- `useInventario.test.js`: 5 pruebas para carga inicial, recarga por filtro,
  actualización local sin consulta, error de carga y recarga bajo demanda.
- `useConsultasVentas.test.js`: 4 pruebas para carga paralela, filtro de
  existencias, error de carga y refresco bajo demanda.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/inventarioVentas/useInventario.test.js src/hooks/inventarioVentas/useConsultasVentas.test.js src/services/inventarioVentasApi.test.js src/utils/inventarioVentas/inventario.test.js src/utils/inventarioVentas/ventas.test.js src/pages/InventarioAdmin.test.jsx src/pages/VentasAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 8 archivos, 58 pruebas correctas.
- Las caracterizaciones de la capa 0 volvieron a pasar sin modificarse.
- ESLint específico sobre páginas, caracterizaciones, hooks/pruebas,
  servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en las páginas no quedan `useEffect`,
  llamadas de consulta al servicio ni estado remoto.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` como cierre
  porque esta no es la última capa del módulo.

## Implementación de capa 4

### Formulario y estado del producto

- `src/hooks/inventarioVentas/useFormularioProducto.js` es propietario de
  `formData`, `showForm`, `editingId`, la validación, el guardado y el cambio de
  estado con su confirmación.
- Recibe `cargarInventario` y `aplicarEstadoLocal` del hook de consulta; no
  duplica estado remoto.
- Conserva la bifurcación crear/actualizar, la comprobación del rango HTTP, los
  textos de éxito y error, y el aviso de campos obligatorios.
- Conserva que la confirmación de cambio de estado se cancela sin efectos, que
  un estado destino igual al actual no consulta al backend y que un cambio
  aceptado actualiza la lista en memoria sin recargar.
- Si el producto en edición es el mismo que cambió de estado, el formulario
  sincroniza su campo `estado`, como antes.
- `alternarFormulario` reproduce el comportamiento existente del botón: al
  cerrarlo limpia el formulario y al abrirlo conserva lo que hubiera.

### Carrito y registro del cargo

- `src/hooks/inventarioVentas/useCarritoVenta.js` es propietario del carrito, la
  búsqueda y selección del estudiante, las notas, el estudiante del historial y
  la última venta.
- Conserva el tope por `stock_actual`, los avisos con `alert`, el payload a
  crédito, el volante armado en memoria con la fecha local, la limpieza
  posterior y el refresco de stock e historial.
- Expone `estudiantesFiltrados`, `ventasDelEstudiante` y
  `hayEstudianteEnHistorial` para que la página no vuelva a derivar.
- Un fallo al registrar conserva el carrito y la selección, igual que antes.
- El botón de cargo sigue sin bloquearse durante la petición: el riesgo de doble
  envío se conserva tal cual y permanece documentado como tarea aparte.

### Anulación

- `src/hooks/inventarioVentas/useAnulacionVenta.js` es propietario del diálogo
  con motivo, el envío recortado y el refresco posterior.
- Conserva el validador de cinco caracteres, el límite de 300, los colores y
  textos del diálogo, y el mensaje de error tomado del detalle del backend.
- Ignora las ventas ya anuladas y respeta la cancelación sin efectos.

### Límites de esta capa

- `InventarioAdmin.jsx` pasó de 244 a 161 líneas y ya no declara `useState`,
  SweetAlert, payloads ni llamadas al servicio.
- `VentasAdmin.jsx` pasó de 395 a 280 líneas. Su único `useState` restante es
  `vistaVolante`, que es navegación de la propia pantalla, no estado de
  dominio; se resolverá al consolidar la página.
- SweetAlert y `alert` permanecen en los hooks de comandos porque confirman
  operaciones y comunican su resultado; no se movieron textos ni se introdujo un
  sistema de notificaciones nuevo, y se conservó deliberadamente que inventario
  use SweetAlert y la caja use `alert`.
- El estado se dividió en tres hooks en lugar de uno para que carrito, cargo y
  anulación conserven responsabilidades separadas, como en el módulo de
  referencia.

### Verificación de capa 4

- `useFormularioProducto.test.js`: 7 pruebas para validación, creación,
  actualización, cambio de estado confirmado, estado igual al actual,
  cancelación y alternancia del formulario.
- `useCarritoVenta.test.js`: 7 pruebas para tope de stock, cantidades y
  eliminación, búsqueda y selección, bloqueos del cargo, registro completo,
  historial del último estudiante y error de registro.
- `useAnulacionVenta.test.js`: 4 pruebas para el diálogo y el motivo recortado,
  venta ya anulada, cancelación y error con detalle del backend.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/inventarioVentas/ src/services/inventarioVentasApi.test.js src/utils/inventarioVentas/ src/pages/InventarioAdmin.test.jsx src/pages/VentasAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 11 archivos, 76 pruebas correctas.
- Las caracterizaciones de la capa 0 volvieron a pasar sin modificarse.
- ESLint específico sobre páginas, caracterizaciones, hooks/pruebas,
  servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que en `InventarioAdmin.jsx` no queda estado
  local, SweetAlert ni comandos, y que en `VentasAdmin.jsx` solo permanece el
  estado de la vista imprimible.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` como cierre
  porque esta no es la última capa del módulo.

## Implementación de capa 5

### Vista de inventario

- `src/components/inventarioVentas/VistaInventario.jsx` contiene encabezado,
  botón de alternancia, formulario de alta y edición, filtro de estado, tabla,
  insignias de stock y estado, estado vacío y spinner de carga.
- Recibe productos, carga, filtro, formulario y callbacks por props. No importa
  hooks, servicios, Axios ni SweetAlert.
- El formulario informa cada campo con `onCambiarCampo(campo, valor)`, que el
  hook resuelve con una actualización funcional del estado.

### Vista de caja y volante

- `src/components/inventarioVentas/VistaVentas.jsx` contiene catálogo, carrito,
  totales, buscador de estudiantes con su desplegable, historial de cargos,
  estados vacíos y la acción de anular.
- `src/components/inventarioVentas/VolanteVenta.jsx` contiene la vista
  imprimible completa y sigue usando `DocumentoImprimible` con
  `tipo="volante_venta"`.
- El retardo de 200 ms al perder el foco del buscador permanece en la vista
  porque es una ayuda de interfaz, no estado de dominio.

### Clases pendientes desde la capa 1

- Se extrajeron a utilidades puras `claseStockProducto` con su umbral
  `STOCK_BAJO`, y `claseFilaVenta`, `claseEstadoVenta` y `claseTotalVenta`.
- Con eso, las vistas ya no contienen ternarios de estado y las cuatro reglas
  quedaron protegidas por pruebas unitarias.

### Compatibilidad visual

- Se movió el JSX existente conservando clases Tailwind, textos, emojis,
  estructura de tablas, breakpoints, desplazamiento horizontal y el atributo
  `required` de los campos.
- Las vistas no administran estado de dominio: todos los cambios se comunican a
  la página mediante callbacks.
- `InventarioAdmin.jsx` quedó en 44 líneas y `VentasAdmin.jsx` en 65. Ambas
  conectan hooks con vistas; la única decisión que conservan es cuál de las dos
  pantallas de ventas se muestra.

### Verificación de capa 5

- `VistaInventario.test.jsx`: 5 pruebas para carga, tabla con insignias, estado
  vacío, callbacks de filtro/edición/estado y formulario en modo edición.
- `VistaVentas.test.jsx`: 8 pruebas para catálogo, carrito vacío y con
  renglones, callbacks del carrito y del cargo, búsqueda y selección, los dos
  estados vacíos del historial, la distinción de una venta anulada y el acceso
  al volante.
- Pruebas unitarias nuevas: 2 para las cuatro reglas de clases extraídas.
- Suite específica completa:
  `pnpm exec vitest run src/components/inventarioVentas/ src/hooks/inventarioVentas/ src/services/inventarioVentasApi.test.js src/utils/inventarioVentas/ src/pages/InventarioAdmin.test.jsx src/pages/VentasAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 13 archivos, 91 pruebas correctas.
- Las caracterizaciones de la capa 0 volvieron a pasar sin modificarse después
  de mover todo el JSX.
- ESLint específico sobre páginas, caracterizaciones, vistas/pruebas,
  hooks/pruebas, servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- La búsqueda específica confirmó que las vistas solo importan utilidades puras
  del módulo.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` como cierre
  porque la capa final todavía está pendiente.

## Implementación de capa 6

### Revisión de las dos raíces

- `src/pages/InventarioAdmin.jsx` quedó en 44 líneas: conecta `useInventario` y
  `useFormularioProducto` con `VistaInventario` y nada más.
- `src/pages/VentasAdmin.jsx` quedó en 66 líneas: conecta los tres hooks de la
  caja con `VistaVentas` y decide si muestra el volante.
- Ninguna contiene endpoints, transformaciones ni bloques visuales. Ninguna lee
  parámetros de ruta porque estas dos pantallas no reciben ninguno; las rutas
  `/admin/inventario` y `/admin/ventas` siguen resueltas por `App.jsx` bajo
  `AdminRoute`, sin cambios.

### Único ajuste real de esta capa

- `useCarritoVenta` exponía el setter crudo `setMostrarDropdownEstudiantes` y
  era la página la que inventaba los valores `true` y `false` en dos funciones
  anónimas.
- Se reemplazó por `abrirDropdownEstudiantes` y `cerrarDropdownEstudiantes`. El
  hook conserva la semántica de su propio estado y la página solo enlaza
  acciones ya nombradas.
- No se aplicó el mismo cambio a `setEstadoFiltro` de `useInventario`: allí la
  vista produce el valor y la página solo lo pasa, sin inventar semántica.
  Renombrarlo habría sido movimiento sin beneficio.

### Decisión sobre el estado de la vista imprimible

- `vistaVolante` permanece en `VentasAdmin.jsx`. Es navegación entre dos
  pantallas de la propia ruta, no estado de dominio, y se corresponde con el
  criterio ya aplicado en cartera, donde el estado de expansión y de reporte se
  conservó en la página.
- Moverlo a un hook habría creado un hook sin dominio propio solo para vaciar la
  página, lo que el plan desaconseja expresamente.

### Límites finales del módulo

- Las páginas leen la ruta, conectan hooks con vistas y componen la pantalla.
- Las vistas solo presentan props y callbacks.
- Los hooks coordinan consultas, formularios y comandos.
- `inventarioVentasApi.js` es el único archivo del módulo que conoce endpoints y
  Axios.
- Las utilidades concentran contratos, transformaciones y reglas de clase puras.

### Verificación de capa 6

- Suite específica completa:
  `pnpm exec vitest run src/components/inventarioVentas/ src/hooks/inventarioVentas/ src/services/inventarioVentasApi.test.js src/utils/inventarioVentas/ src/pages/InventarioAdmin.test.jsx src/pages/VentasAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 13 archivos, 91 pruebas correctas.
- `useCarritoVenta.test.js` cubre además la apertura y el cierre del desplegable
  mediante las acciones nombradas.
- ESLint específico sobre páginas, caracterizaciones, vistas/pruebas,
  hooks/pruebas, servicio/prueba y utilidades/pruebas: correcto.
- `git diff --check`: correcto.
- No se ejecutaron `pnpm run check:deploy` ni la revisión final del diff porque
  la capa 7 de cierre todavía está pendiente.

## Capa 7: cierre final

### Documentación sincronizada

- `docs/modularizacion/README.md` marca el módulo como terminado con commit
  pendiente.
- `docs/ARQUITECTURA_FRONTEND.md` registra carpetas, responsabilidades, rutas,
  límites finales del dominio y la cobertura de pruebas.
- `docs/COMPONENTES.md` registra vistas, páginas, hooks, servicio y utilidades.
- `docs/CAMBIOS_FRONTEND.md` contiene la entrada consolidada del módulo.

### Verificación final

- Suite específica: 13 archivos y 91 pruebas correctas.
- `pnpm run check:deploy`: correcto.
  - Vitest: 189 archivos y 726 pruebas correctas.
  - ESLint global: correcto.
  - Build de producción: correcto; 308 módulos transformados.
- `git diff --check`: correcto.
- El diff pertenece únicamente a inventario, ventas, sus pruebas y la
  documentación específica y global exigida para el cierre. Los dos documentos
  globales cambiaron solo por adición: 41 y 30 líneas, sin eliminaciones.
- Las rutas `/admin/inventario` y `/admin/ventas` conservan `AdminRoute`.
  `App.jsx` y `NavAdmin.jsx` no se modificaron.
- `inventarioVentasApi.js` es el único archivo del módulo que importa
  `utils/api.js` y contiene sus ocho contratos. Ninguna página, vista, hook o
  utilidad del módulo importa Axios ni contiene cadenas de endpoint; las únicas
  apariciones restantes están en las caracterizaciones, que simulan el cliente a
  propósito.
- No quedan implementaciones antiguas duplicadas: las dos páginas fueron
  reescritas como raíces de composición y no existe una versión paralela del
  catálogo, del carrito, del historial ni del volante.
- `src/components/FacturaModerna.jsx`, que el inventario inicial de este
  documento listaba, no existe: pertenece al dominio de pagos como
  `src/components/pagos/FacturaModerna.jsx` desde el módulo 7 y no forma parte
  de este alcance.

### Verificación manual posterior al deploy

1. Iniciar sesión como administrador y abrir `Admin > Inventario`; confirmar que
   el filtro arranca en `Activos`, que la tabla muestra stock, costo, venta,
   utilidad, margen y estado, y que el stock igual o menor a cinco aparece en
   rojo.
2. Cambiar el filtro a `Inactivos` y a `Todos`; confirmar que la lista se
   recarga en cada cambio y que no reaparece el spinner de carga inicial.
3. Crear un producto de prueba con decimales en costo y precio; confirmar el
   aviso de éxito, que el formulario se cierra y que la lista se recarga.
4. Editar ese producto, cambiar su costo y confirmar el aviso de actualización.
5. Desactivar ese producto desde el selector de su fila; confirmar el texto de
   la confirmación, que la fila desaparece del filtro `Activos` sin recargar la
   página y que reaparece en `Todos`.
6. Abrir `Admin > Punto de Venta`; confirmar que solo se ofrecen productos
   activos con existencias y que el producto desactivado no aparece.
7. Añadir un producto al carrito hasta agotar su stock; confirmar el aviso de
   stock, el ajuste con `+` y `-`, el subtotal por renglón y el total.
8. Intentar cargar sin estudiante; confirmar el aviso que prohíbe Público
   General.
9. Buscar un estudiante, seleccionarlo y registrar el cargo; confirmar el aviso
   de éxito, que el carrito se vacía, que el historial del estudiante aparece y
   que el stock del catálogo disminuyó.
10. Abrir `Imprimir Volante de Pago`; confirmar cliente, condición `Cargo
    Pendiente`, renglones, total y formato A4, y volver con `← Volver`.
11. Anular ese cargo de prueba; confirmar que exige un motivo de al menos cinco
    caracteres, que la fila queda en rojo con el motivo visible, que ya no
    ofrece `Anular` y que el stock regresó al catálogo.
12. Comprobar en `Admin > Cartera > Cartera Vencida` que la deuda de inventario
    del estudiante refleja el cargo y su anulación, sin registrar pagos de
    prueba.
13. En ancho móvil, comprobar que la tabla de inventario y la de cargos
    conservan desplazamiento horizontal y que el catálogo y el carrito se
    apilan.

### Commit sugerido

`refactor(inventario): modularizar inventario y ventas`

## Corrección posterior al cierre: doble registro de un cargo

Esta corrección **no forma parte de la migración**. Se documenta aquí porque el
defecto se detectó durante la capa 0 y se conservó a propósito hasta cerrar el
módulo.

- Defecto: `procesarVenta` no impedía un segundo envío mientras la petición
  seguía en vuelo. Un doble clic registraba dos ventas, duplicaba la deuda del
  estudiante y descontaba el stock dos veces. `POST /api/ventas/` no deduplica.
- Arreglo: estado `registrandoVenta` en `useCarritoVenta`, con retorno inmediato
  si ya hay un registro en curso y liberación en `finally`; y botón
  deshabilitado con texto `Cargando...` en `VistaVentas`.
- Las validaciones de carrito vacío y estudiante obligatorio siguen antes del
  bloqueo, para no dejar el botón inutilizable.
- Un error libera el bloqueo y conserva carrito y estudiante para reintentar.
- Pruebas nuevas: 3. Suite específica: 13 archivos y 94 pruebas correctas.
  `pnpm run check:deploy`: correcto; 189 archivos y 729 pruebas.
- Commit sugerido, separado del de la migración:
  `fix(ventas): evitar doble registro de un cargo`

## Corrección posterior al cierre: retroalimentación de la caja

Tampoco forma parte de la migración. Atiende dos defectos que la capa 0
documentó y que se conservaron hasta cerrar el módulo.

- El estado de carga se escribía pero ninguna vista lo leía, así que el catálogo
  mostraba su estado vacío durante la consulta inicial. `useConsultasVentas`
  expone `cargando` y `VistaVentas` reutiliza el spinner del inventario.
- Los seis `window.alert` pasaron a `Swal.fire` conservando los textos exactos.
  Además del estilo, evita que Chrome silencie los avisos cuando el usuario
  marca `Impedir que esta página cree diálogos adicionales`, lo que podía
  ocultar `Error procesando la venta`.
- Pruebas nuevas: 3. Suite específica: 13 archivos y 97 pruebas correctas.
  `pnpm run check:deploy`: correcto; 189 archivos y 732 pruebas.
- Commit sugerido: `fix(ventas): mejorar la retroalimentación de la caja`

## Primera acción

Cumplida en la capa 0: catálogo, ventas, anulaciones y facturación quedaron
inventariados por separado y los payloads y la actualización local están
protegidos por pruebas antes de extraer servicios.

## Entrega final

- Última capa terminada: Capa 7, cierre.
- Archivos de producción modificados: `InventarioAdmin.jsx` y `VentasAdmin.jsx`
  como raíces de composición, tres vistas presentacionales, cinco hooks,
  `inventarioVentasApi.js` y dos utilidades del dominio. No se eliminó ningún
  archivo porque el módulo no tenía componentes previos.
- Riesgos abiertos: el campo `notas` viaja siempre vacío por no tener control en
  la interfaz. Los demás defectos preexistentes que esta migración conservó a
  propósito se atendieron después del cierre, en commits separados.
- Siguiente capa pendiente: Ninguna.
- Siguiente acción exacta: el usuario crea el único commit del módulo, hace push
  a `origin/main`, espera el deploy y ejecuta la verificación manual.
