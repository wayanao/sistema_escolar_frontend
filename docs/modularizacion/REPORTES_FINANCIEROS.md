# Modularización: Reportes financieros

## Control

- Estado: Terminado; commit pendiente.
- Orden: 9.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: `ee6f502` (`main` == `origin/main`, working tree limpio al
  iniciar).
- Commit final: Pendiente.
- Última actualización: 2026-08-08 (capa 7, cierre).

## Objetivo

Separar consultas, filtros, consolidaciones y presentación de reportes sin
alterar montos visibles ni interpretación de métodos de pago.

## Inventario confirmado en capa 0

### Página

- `src/pages/ReportesAdmin.jsx` (589 líneas) es la única página del módulo y
  hoy concentra consultas HTTP, estado, transformaciones y presentación.
- Ruta: `/admin/reportes`, registrada en `src/App.jsx` con `AdminRoute`. La
  propia página repite el control de rol (`usuario.rol !== "admin"` →
  `navigate("/login")`), igual que otras páginas ya modularizadas (PAGOS,
  CARTERA_TIPOS_PAGO) antes de su capa de composición.
- Sesión leída desde `localStorage.usuario`. El módulo no escribe
  almacenamiento local.
- Enlazada desde `src/components/NavAdmin.jsx` y desde
  `src/utils/dashboards/admin.js` (accesos rápidos del dashboard
  administrativo). Ambos archivos pertenecen a otros módulos y quedan fuera
  de alcance; solo se documenta la dependencia de navegación entrante.

### Utilidad pura existente

- `src/utils/reportesMediosPago.js` (522 líneas) ya cumple la definición de
  utilidad pura del plan maestro: no hace HTTP, no usa React, no accede al
  DOM ni a almacenamiento. Vive en `src/utils/` en vez de
  `src/utils/reportesFinancieros/`; reubicarla junto con las demás
  transformaciones puras de la página es trabajo de la capa 1, no de esta
  capa.
- No tenía pruebas antes de esta capa.

### Subflujos de la página

1. Carga inicial de `reporteGeneral` al montar y recarga al volver a la
   pestaña (`visibilitychange`).
2. Tarjetas de resumen: ingresos/egresos/balance de hoy y balance general,
   con navegación a detalle desde las tarjetas de ingresos y egresos de hoy.
3. Movimiento mensual (últimos meses con datos) con botones de ingreso/egreso
   por mes que abren el detalle de ese mes.
4. Selector de rango de fechas (`Desde`/`Hasta`) con botones `Ingresos` y
   `Egresos` que validan el rango antes de consultar.
5. Detalle de ingresos o egresos: tabla, filtro por medio de pago (solo
   ingresos), total visible según el filtro activo y scroll automático al
   abrir.
6. Panel fijo de estudiantes por curso (`estudiantes_por_curso`), sin
   interacción propia.

## Contratos HTTP inventariados

Todos los endpoints están bajo `app/routes/reportes.py` en
`sistema_escolar_api`, protegidos por `get_current_active_admin`, y se leyó
su controlador (`app/controllers/reportes_controller.py`) para documentar la
forma real de la respuesta. No se modificó el backend.

| Método | Ruta | Uso actual desde el frontend |
|---|---|---|
| `GET` | `/reportes/general` | Estadísticas generales, ingresos/egresos mensuales y estudiantes por curso. Sin parámetros. |
| `GET` | `/reportes/ingresos-rango` | Detalle de ingresos; `params: { inicio, fin }` en formato `YYYY-MM-DD`. |
| `GET` | `/reportes/egresos-rango` | Detalle de egresos; mismos parámetros que ingresos-rango. |
| `GET` | `/reportes/ingresos-mes/:mes` | Detalle de ingresos de un mes completo (`mes` en formato `YYYY-MM`); sin parámetros adicionales. |

Notas del contrato observado:

- El backend admite `limit`/`offset` opcionales en los tres endpoints de
  detalle y, si se envían, responde `{ total, limit, offset, items }` en vez
  de un arreglo plano. El frontend actual **no envía** esos parámetros, por
  lo que siempre recibe el arreglo plano. `normalizarLista` en la página ya
  tolera ambas formas; no se activa paginación en esta capa por ser una
  función nueva fuera de alcance.
- Forma real de un ingreso (`_formatear_ingreso`): `id`, `estudiante`
  (`"nombre apellido"` o `"Desconocido"`), `monto`, `monto_valido` (`0` si el
  pago está anulado), `fecha` (`dd/mm/aaaa hh:mm`), `descripcion`,
  `tipo_pago`, `estado`, `anulado` (booleano derivado de
  `estado === "Anulado"`), `motivo_anulacion`, `fecha_anulacion`.
- Forma real de un egreso (`_formatear_egreso`): `id`, `concepto`, `monto`,
  `fecha` (`dd/mm/aaaa`), `categoria`, `notas`, `origen` (`"manual"` por
  defecto).
- `tipo_pago` es el **único** campo de medio de pago que produce hoy el
  backend en estos endpoints. Se llena en `pagos_controller.py` uniendo cada
  método con `" + "` y agregando `" - nota"` cuando el método tiene nota
  libre (transferencia o subsidio). Los demás campos que
  `reportesMediosPago.js` sabe leer (`metodos`, `metodos_pago`,
  `medios_pago`, `formas_pago`, `detalle_metodos`, `metodo_pago`,
  `medio_pago`, `forma_pago`, `metodo`, montos por campo como
  `monto_efectivo`) **no los envía el backend actual**; son compatibilidad
  con variantes históricas o de otro origen de datos, y deben conservarse sin
  asumir que están muertos.
- Forma real del reporte general (`reporte_general_controller`):
  `estadisticas_generales` (`total_estudiantes`, `total_profesores`,
  `total_cursos`, `total_materias`, `total_ingresos`, `ingresos_hoy`,
  `total_egresos`, `egresos_hoy`, `balance_general`, `balance_hoy`),
  `estudiantes_por_curso` (`{ curso, cantidad }`), `ingresos_mensuales` y
  `egresos_mensuales` (`{ mes: "YYYY-MM", total }`, últimos 6 meses,
  orden descendente). Ante un error interno el backend responde `200` con
  todos los valores en cero/[] en vez de lanzar; la página no distingue ese
  caso de una cuenta nueva sin movimientos.

## Invariantes

- Filtros por fecha y medio de pago.
- Soporte de pagos simples y combinados (unidos con `" + "` en `tipo_pago`).
- Montos parciales por método **solo cuando el pago los expone** en algún
  campo reconocido (`metodos`, `medios_pago`, `monto_<medio>`, etc.). El
  contrato real actual no los expone; ver riesgo caracterizado abajo.
- Referencias de transferencia, tarjeta y subsidio como nota libre después de
  `" - "` en el texto del método.
- Totales de ingresos y egresos, y su balance, diario y general.
- Compatibilidad con variantes históricas de nombres de campos de medio de
  pago (arreglo, objeto-mapa, cadena JSON, nombres de campo alternos).
- Un pago anulado no aporta al total visible con filtro `"todos"` ni al
  filtrado por medio, pero conserva su fila en la tabla con estilo tachado y
  el motivo de anulación.
- El filtro de medio de pago se reinicia a `"todos"` cada vez que se abre un
  detalle nuevo de ingresos (tarjeta, mes o rango).
- Redirección a `/login` para cualquier sesión sin rol `admin`.
- Recarga automática del reporte general al volver a la pestaña
  (`visibilitychange`).
- Validación de rango: fecha de inicio y fin obligatorias, e inicio no puede
  ser mayor que fin.

## Riesgos iniciales

- Cambiar totales por interpretar incorrectamente un pago mixto.
- Perder compatibilidad con respuestas legacy.
- Duplicar montos al filtrar.
- Mezclar normalización de datos con presentación.

## Riesgos confirmados y decisiones de la capa 0

- **Riesgo real, no un defecto a corregir aquí:** cuando un pago combina
  métodos (`tipo_pago` con `" + "`) y el backend no adjunta monto por
  método, `montoIngresoPorMedio`/`montoVisibleIngreso` no encuentran montos
  positivos por medio y caen al monto total del pago. Esto significa que,
  filtrando por un solo medio de un pago combinado, la tabla muestra el
  monto **total** del pago (no la porción de ese medio) tanto en el total
  del encabezado como en la insignia del método. Es el comportamiento vigente
  hoy en producción y queda protegido con pruebas explícitas en
  `reportesMediosPago.test.js` y `ReportesAdmin.test.jsx`; no se reinterpreta
  en esta migración.
- El reporte general responde `200` con ceros ante un error interno del
  backend; la página no lo distingue de "sin movimientos". Se documenta como
  comportamiento heredado, no se corrige.
- `reportesMediosPago.js` ya es una utilidad pura y no necesita moverse de
  responsabilidad en la capa 1, solo de ubicación física y compañía (junto a
  `formatoMoneda`, `nombreMes`, `finDeMesISO`, `hoyISO` y
  `normalizarLista`, hoy definidos dentro de `ReportesAdmin.jsx`).
- El soporte de `limit`/`offset` en el backend no tiene consumidor en el
  frontend. No se activa: sería una función nueva, fuera del alcance de una
  modularización.
- No se identificó una dependencia compartida real con otro dominio dentro
  de `src/utils`, `src/services` o `src/hooks`; no se crea ninguna
  abstracción compartida en esta capa.
- La capa 0 solo agregó pruebas y documentación; no se modificó código de
  producción, rutas, textos, diseño ni payloads.

## Pruebas de protección

- `src/utils/reportesMediosPago.test.js` (42 pruebas): protege
  `MEDIOS_PAGO_INGRESO`, `obtenerMediosPago` con el contrato real de
  `tipo_pago` (simple, combinado, con nota, subsidio, valor vacío/ausente),
  alias y sinónimos de medios (PSE, Nequi, Daviplata, Bancolombia, datáfono,
  tarjeta crédito/débito, `targeta`, `cash`, `pos`), variantes históricas de
  campos (`metodo_pago`, `forma_pago`, `medio_pago`, arreglo `metodos`,
  cadena JSON en `metodos_pago`, mapa de objeto en `medios_pago`, detalle en
  `detalle_metodos`), `montoIngresoPorMedio`, `montoVisibleIngreso` y
  `montoVisibleMetodoPago` (incluido el riesgo del método combinado sin monto
  propio) y el parseo de montos con separadores regionales de miles/decimales.
- `src/pages/ReportesAdmin.test.jsx` (8 pruebas): protege la redirección para
  sesiones no admin, la carga y presentación del reporte general, la
  apertura del detalle de ingresos de hoy (medios de pago, fila anulada con
  motivo, total con filtro `"todos"`), la apertura del detalle de egresos de
  hoy, el filtrado por medio de pago sobre un pago combinado (incluido el
  caso sin coincidencia), la validación del rango de fechas antes de
  consultar, la carga de detalle por mes con el rango de fechas calculado, y
  la recarga del reporte general al volver a la pestaña.
- No se modificó código productivo del módulo en esta capa.

## Verificación de capa 0

- Antes de modificar: rama `main`, `git status` limpio, `main` en
  `ee6f502` igual a `origin/main`.
- Suite específica:
  `pnpm exec vitest run src/utils/reportesMediosPago.test.js src/pages/ReportesAdmin.test.jsx`
  — 2 archivos, 50 pruebas correctas.
- `pnpm exec eslint src/utils/reportesMediosPago.test.js src/pages/ReportesAdmin.test.jsx`
  — correcto, sin advertencias.
- `git status --porcelain` tras la capa: solo
  `src/utils/reportesMediosPago.test.js` y `src/pages/ReportesAdmin.test.jsx`
  como archivos nuevos; ningún archivo de producción modificado.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta
  no es la última capa del módulo.

## Resultado de la capa 1

### Unidades extraídas

Se creó `src/utils/reportesFinancieros/` con tres unidades puras y pruebas
adyacentes:

- `mediosPago.js`: contenido movido sin cambios desde
  `src/utils/reportesMediosPago.js` (renombre puro, diff vacío). Su prueba se
  trasladó junto con él a `mediosPago.test.js`, solo actualizando la ruta de
  importación.
- `formatos.js`: `formatoMoneda`, `nombreMes`, `finDeMesISO` y `hoyISO`,
  extraídas literalmente desde `ReportesAdmin.jsx` sin cambiar su
  implementación.
- `contratos.js`: `normalizarLista`, extraída literalmente desde
  `ReportesAdmin.jsx`.

`ReportesAdmin.jsx` dejó de definir estas cinco funciones localmente y ahora
las importa desde `utils/reportesFinancieros/`. El único cambio en el
archivo es el bloque de imports; el resto del código productivo permanece
byte a byte igual (verificado con `git diff`).

### Hallazgo importante: dos defectos preexistentes de zona horaria

Al escribir las pruebas de `formatos.js` se confirmaron dos defectos reales
y preexistentes, no introducidos por esta migración:

1. **`hoyISO()` puede mostrar "mañana" como "hoy".** Usa
   `new Date().toISOString()`, que es UTC, sin compensar el desfase local
   antes de recortar la fecha (a diferencia de PAGOS, que sí compensa: ver
   `docs/modularizacion/PAGOS.md`, sección de cálculos caracterizados). Con
   la hora de Bogotá (UTC-5, la zona real de despliegue: el propio backend
   usa `AT TIME ZONE 'America/Bogota'`), desde aproximadamente las 7:00 p.m.
   hasta la medianoche local, `hoyISO()` ya devuelve la fecha del día
   siguiente. Esto afecta el rango por defecto y las tarjetas "Ingresos hoy"
   / "Egresos hoy", que consultarían un día sin movimientos todavía.
2. **`nombreMes()` muestra el mes anterior.** Construye
   `new Date("${mes}-01")`, que `Date` interpreta como medianoche UTC; al
   formatear en America/Bogota esa medianoche UTC todavía es el día anterior
   a las 7:00 p.m., por lo que el mes mostrado retrocede uno. Esto afecta los
   encabezados de "Movimiento mensual", que muestran el nombre de mes
   incorrecto para cada bloque.

Ambos quedan preservados exactamente como estaban — la extracción es fiel
"defecto incluido" — y protegidos con pruebas explícitas en
`formatos.test.js` que fijan la zona horaria (`America/Bogota`, la de
producción) y documentan el valor real devuelto. No se corrigen en esta
migración porque son defectos ajenos al alcance ("no corrijas asuntos
ajenos"); se recomienda abrirlos como tarea o commit separado dado que
afectan la exactitud de un reporte financiero.

> **Actualización posterior al cierre (2026-08-08):** ambos defectos se
> corrigieron en un commit separado, fuera de las capas de esta
> modularización. Ver "Corrección posterior al cierre" al final de este
> documento.

### Verificación de capa 1

- Suite específica:
  `pnpm exec vitest run src/utils/reportesFinancieros/ src/pages/ReportesAdmin.test.jsx`
  — 4 archivos, 66 pruebas correctas (58 de utilidades nuevas + 8 de la
  página, que sigue pasando sin cambios).
- `pnpm exec eslint src/utils/reportesFinancieros/ src/pages/ReportesAdmin.jsx src/pages/ReportesAdmin.test.jsx`
  — correcto, sin advertencias.
- `git diff -- src/pages/ReportesAdmin.jsx` confirma que el único cambio es
  el bloque de imports.
- El renombre de `reportesMediosPago.js` a
  `reportesFinancieros/mediosPago.js` no tiene diff de contenido.
- Búsqueda específica confirmó que no quedan referencias a
  `utils/reportesMediosPago` en el código fuente.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta
  no es la última capa del módulo.

## Resultado de la capa 2

### Servicio HTTP

Se creó `src/services/reportesFinancierosApi.js` como único límite de
transporte del módulo, con los cuatro contratos inventariados en la capa 0:

- `obtenerReporteGeneral()` → `GET /reportes/general`.
- `obtenerIngresosRango(inicio, fin)` → `GET /reportes/ingresos-rango` con
  `{ params: { inicio, fin } }`.
- `obtenerEgresosRango(inicio, fin)` → `GET /reportes/egresos-rango` con
  `{ params: { inicio, fin } }`.
- `obtenerIngresosMes(mes)` → `GET /reportes/ingresos-mes/${mes}`.

Cada función devuelve únicamente `response.data` y no atrapa errores: los
propaga intactos para que `ReportesAdmin.jsx` conserve sus mismos mensajes y
`catch` actuales.

### Integración conservada

- `ReportesAdmin.jsx` dejó de importar `../utils/api` y ya no contiene rutas
  del backend ni el objeto `{ params }` construido a mano. Llama a las
  cuatro funciones del servicio y sigue siendo responsable, por ahora, de
  normalizar con `utils/reportesFinancieros/`, actualizar estado, mostrar
  mensajes (`alert`) y coordinar recargas — nada de eso se movió en esta
  capa.
- La bifurcación `tipo === "egresos"` en `cargarDetalle` se conservó
  literalmente; solo cambió de invocar `api.get(endpoint, ...)` a invocar la
  función del servicio correspondiente.
- Las 8 pruebas de `ReportesAdmin.test.jsx` (que mockean `../utils/api`,
  no el servicio) pasaron sin ninguna modificación después del cambio,
  incluidas las aserciones exactas de URL y `params`. Esto confirma que el
  servicio no alteró el contrato HTTP que esas pruebas ya protegían.
- No se agregaron señales de cancelación, `limit`/`offset` ni parámetros
  nuevos: los contratos actuales no los usan.

### Verificación de capa 2

- `src/services/reportesFinancierosApi.test.js` agrega 5 pruebas que cubren
  los cuatro contratos (URL, método y `params`) y la propagación de errores.
- Suite específica completa:
  `pnpm exec vitest run src/services/reportesFinancierosApi.test.js src/utils/reportesFinancieros/ src/pages/ReportesAdmin.test.jsx`
  — 5 archivos, 71 pruebas correctas.
- `pnpm exec eslint src/services/reportesFinancierosApi.js src/services/reportesFinancierosApi.test.js src/pages/ReportesAdmin.jsx`
  — correcto, sin advertencias.
- Búsqueda específica confirmó que `reportesFinancierosApi.js` es el único
  archivo de producción del módulo que importa `utils/api.js`; la página, sus
  utilidades y sus pruebas ya no lo hacen (el único otro resultado es el
  mock de `../utils/api` dentro de `ReportesAdmin.test.jsx`, que es de
  prueba, no de producción).
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta
  no es la última capa del módulo.

## Resultado de la capa 3

### Hooks de consulta

Se creó `src/hooks/reportesFinancieros/` con dos hooks:

- `useReporteGeneral.js`: propietario de `reporteGeneral` y `loading`.
  Conserva la carga al montar, la recarga por `visibilitychange` y expone
  `cargarDatosIniciales` para el botón `Actualizar`, con el mismo mensaje de
  error y el mismo `console.error` de antes.
- `useDetalleReportes.js`: propietario de `detalle`, `detalleTipo`,
  `detalleTitulo`, `loadingDetalle`, `fechaInicio`, `fechaFin`,
  `rangoActivo`, `filtroMedioIngreso` y la referencia `detalleRef` con su
  efecto de scroll automático. Conserva `cargarDetalle` y `cargarDetalleMes`
  con su validación de fechas, sus mensajes y su misma bifurcación
  ingresos/egresos.

`ReportesAdmin.jsx` dejó de declarar los diez `useState`, el `useRef` y los
tres `useEffect` que administraban este estado remoto; ahora los consume
desde los dos hooks. El resto del archivo (JSX, `useMemo` derivados, control
de acceso) permanece igual.

### Decisión deliberada: setters "en crudo" en vez de wrappers nuevos

Los hooks exponen `setDetalle`, `setDetalleTipo`, `setFechaInicio`,
`setFechaFin` y `setFiltroMedioIngreso` tal cual (no wrappers con nombre de
acción). Es intencional: la página tiene un caso asimétrico real donde solo
los dos botones del panel "Rango de fechas" llaman `setDetalleTipo(tipo)`
**antes** de invocar `cargarDetalle` (una preasignación optimista que las
demás cuatro llamadas a `cargarDetalle`/`cargarDetalleMes` no hacen). Envolver
ese setter en una función con nombre habría obligado a decidir si ese
comportamiento asimétrico —y su condición de carrera si la consulta
falla— se generaliza o no, lo cual es una interpretación fuera del alcance
de una migración de capas. Se prefirió la extracción más fiel: mismos
identificadores, mismo comportamiento, cero JSX reescrito más allá de la
conexión a los hooks.

### Verificación de capa 3

- `useReporteGeneral.test.js`: 5 pruebas (carga inicial, error, recarga
  manual, recarga por `visibilitychange`, no-recarga si se oculta).
- `useDetalleReportes.test.js`: 9 pruebas (estado inicial, validaciones de
  fecha, ingresos por rango con reinicio de filtro, egresos por rango sin
  tocar el filtro, error que conserva el detalle previo, detalle por mes de
  ingresos y de egresos, scroll automático).
- Suite específica completa:
  `pnpm exec vitest run src/hooks/reportesFinancieros/ src/services/reportesFinancierosApi.test.js src/utils/reportesFinancieros/ src/pages/ReportesAdmin.test.jsx`
  — 7 archivos, 85 pruebas correctas. Las 8 pruebas de
  `ReportesAdmin.test.jsx` (escritas contra el `api.get` mockeado antes de
  que existiera el servicio) siguieron pasando sin ninguna modificación,
  confirmando que el comportamiento observable no cambió.
- `pnpm exec eslint src/hooks/reportesFinancieros/ src/pages/ReportesAdmin.jsx`
  — correcto, sin advertencias.
- Búsqueda específica confirmó que ningún archivo de producción del módulo
  importa `utils/api.js` salvo `reportesFinancierosApi.js`.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta
  no es la última capa del módulo.

### Capa 4 (hooks de comandos): No aplica

Con las capas 0-3 completas queda confirmado que el módulo no tiene ningún
comando de escritura propio: los cuatro contratos del servicio son `GET` y
no existe formulario, creación, actualización ni eliminación dentro de
`ReportesAdmin.jsx`. No hay nada que mover a una capa de comandos. Se marca
`No aplica` con esta evidencia, sin crear un hook vacío.

## Resultado de la capa 5

### Componentes extraídos

Se creó `src/components/reportesFinancieros/` con cuatro componentes
presentacionales:

- `ResumenFinanciero.jsx`: las ocho tarjetas de estadísticas (ingresos,
  egresos, balance de hoy, balance general, estudiantes, profesores,
  ingresos y egresos acumulados). Recibe `stats` y tres callbacks
  (`onVerIngresosHoy`, `onVerEgresosHoy`, `onVerEgresosAcumulados`).
- `MovimientoMensual.jsx`: la lista de meses con sus barras de progreso.
  Recibe `mesesFinancieros`, `onVerIngresosMes` y `onVerEgresosMes`.
- `RangoFechasPanel.jsx`: los campos de fecha, los botones
  Ingresos/Egresos y el panel de estudiantes por curso. Recibe las fechas,
  `onCambiarFechaInicio`/`onCambiarFechaFin`,
  `onConsultarIngresos`/`onConsultarEgresos`, `loadingDetalle` y
  `estudiantesPorCurso`.
- `DetalleReportes.jsx`: el panel de detalle completo (selector de medio de
  pago, total, botón Cerrar y las dos tablas con sus estados vacíos).
  Implementado con `React.forwardRef` porque el contenedor raíz necesita el
  mismo `ref` que antes usaba la página para el scroll automático.

Ninguno importa hooks ni el servicio del módulo; solo reciben datos y
callbacks por props, y usan las utilidades puras de formato/medios de pago
igual que antes.

### Integración conservada

`ReportesAdmin.jsx` pasó de 483 a 191 líneas. Conserva:

- el encabezado (título, subtítulo, botón "Actualizar");
- los `useMemo` que derivan `mesesFinancieros`, `detalleIngresosFiltrados`,
  `totalDetalleIngresos` y `totalDetalleEgresos` (no se movieron a los
  componentes: son composición de datos entre el hook de detalle y las
  utilidades del dominio, no presentación);
- los seis manejadores (`verIngresosHoy`, `verEgresosHoy`,
  `verEgresosAcumulados`, `verIngresosMes`, `verEgresosMes`,
  `consultarIngresosPorRango`, `consultarEgresosPorRango`) que antes eran
  closures inline en el JSX y ahora son funciones nombradas que se pasan
  como props;
- la asimetría documentada en la capa 3: `consultarIngresosPorRango` y
  `consultarEgresosPorRango` siguen llamando `setDetalleTipo` antes de
  `cargarDetalle`, exactamente igual que el código original, mientras que
  los demás manejadores no lo hacen.
- el control de acceso, el estado de carga inicial y el `{detalle && (...)}`
  que decide si se compone `DetalleReportes`.

### Verificación de capa 5

- `ResumenFinanciero.test.jsx`: 3 pruebas.
- `MovimientoMensual.test.jsx`: 4 pruebas.
- `RangoFechasPanel.test.jsx`: 3 pruebas (incluida la nota de que la
  etiqueta `Desde`/`Hasta` no está asociada al input mediante `htmlFor`/`id`
  en el JSX original; se conservó esa brecha de accesibilidad tal cual).
- `DetalleReportes.test.jsx`: 8 pruebas, incluida la verificación de que el
  `ref` reenviado apunta al contenedor raíz.
- Suite específica completa:
  `pnpm exec vitest run src/components/reportesFinancieros/ src/hooks/reportesFinancieros/ src/services/reportesFinancierosApi.test.js src/utils/reportesFinancieros/ src/pages/ReportesAdmin.test.jsx`
  — 11 archivos, 103 pruebas correctas. Las 8 pruebas de
  `ReportesAdmin.test.jsx` (sin modificar desde la capa 0) siguen pasando.
- `pnpm exec eslint src/components/reportesFinancieros/ src/pages/ReportesAdmin.jsx`
  — correcto, sin advertencias.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta
  no es la última capa del módulo.

## Resultado de la capa 6

### Auditoría contra los criterios de composición

`ReportesAdmin.jsx` (191 líneas al cerrar la capa 5) todavía contenía
transformaciones puras de tamaño no trivial: `mesesFinancieros` (combinar
ingresos y egresos mensuales, ~20 líneas) y los derivados de detalle
(`detalleIngresos`, `detalleEgresos`, `detalleIngresosFiltrados`,
`totalDetalleIngresos`, `totalDetalleEgresos`). Ambos grupos son
derivaciones puras de estado que ya pertenece por completo a un hook
existente (`reporteGeneral` → `useReporteGeneral`; `detalle`/`detalleTipo`/
`filtroMedioIngreso` → `useDetalleReportes`), así que se movieron a esos
hooks en vez de dejarlos en la página. Es la misma regla que ya aplicaban
los hooks de consulta de PAGOS y CARTERA_TIPOS_PAGO ("calcula ... mediante
las utilidades puras de la capa 1"), aplicada aquí en la capa 6 porque la
capa 1 original solo alcanzó a extraer formateadores y no esta agregación.

### Cambios de esta capa

- Se creó `src/utils/reportesFinancieros/derivaciones.js` con
  `construirMesesFinancieros(ingresosMensuales, egresosMensuales)`,
  extraída literalmente del cálculo que antes vivía en la página.
- `useReporteGeneral.js` ahora expone también `stats`,
  `estudiantesPorCurso` y `mesesFinancieros` (memoizado con
  `construirMesesFinancieros`), calculados a partir de `reporteGeneral` con
  la misma lógica de antes. Sigue exponiendo `reporteGeneral` sin cambios
  para no romper su contrato existente.
- `useDetalleReportes.js` ahora expone también `detalleEgresos`,
  `detalleIngresosFiltrados`, `totalDetalleIngresos` y
  `totalDetalleEgresos`, calculados internamente con las mismas utilidades
  de `mediosPago.js` que ya usaba la página.
- `ReportesAdmin.jsx` pasó de 191 a **136 líneas**. Ya no importa
  `useMemo` ni las utilidades de `mediosPago.js`/`formatos.js` salvo
  `hoyISO` (que sigue usando para los dos botones "hoy"). Solo conserva:
  las dos llamadas a los hooks, el control de acceso, el estado de carga
  inicial, seis funciones de conexión hook↔componente y la composición JSX.

### Decisiones de la capa 6

- Las seis funciones de conexión (`verIngresosHoy`, `verEgresosHoy`,
  `verEgresosAcumulados`, `verIngresosMes`, `verEgresosMes`,
  `consultarIngresosPorRango`, `consultarEgresosPorRango`) permanecen en la
  página: son literalmente "conectar hooks con componentes", la
  responsabilidad central de esta capa, no transformaciones de dominio.
  Moverlas a un hook las alejaría de los componentes que las consumen sin
  ninguna ganancia de reutilización.
- La asimetría de `consultarIngresosPorRango`/`consultarEgresosPorRango`
  (`setDetalleTipo` antes de `cargarDetalle`, documentada en la capa 3) se
  conservó sin cambios.
- No se creó un hook agregador que envuelva `useReporteGeneral` y
  `useDetalleReportes`: son dos consultas independientes con ciclos de vida
  distintos: ocultar esa independencia en un hook combinado no reduciría
  código ni aclararía el contrato, y contradice la decisión ya registrada
  en PAGOS.md sobre no envolver hooks existentes sin reutilización real.
- `reporteGeneral` se conserva en el retorno de `useReporteGeneral` aunque
  la página ya no lo usa directamente, para no romper el contrato probado en
  la capa 3 ni obligar a otro consumidor futuro a leer campos anidados.

### Verificación de capa 6

- `derivaciones.test.js`: 6 pruebas nuevas para `construirMesesFinancieros`.
- `useReporteGeneral.test.js`: 2 pruebas nuevas para los derivados
  (`stats`, `estudiantesPorCurso`, `mesesFinancieros`).
- `useDetalleReportes.test.js`: 3 pruebas nuevas para los derivados de
  detalle (vacíos iniciales, egresos, filtro por medio de pago).
- Suite específica completa:
  `pnpm exec vitest run src/components/reportesFinancieros/ src/hooks/reportesFinancieros/ src/services/reportesFinancierosApi.test.js src/utils/reportesFinancieros/ src/pages/ReportesAdmin.test.jsx`
  — 12 archivos, 114 pruebas correctas. Las 8 pruebas de
  `ReportesAdmin.test.jsx`, sin modificar desde la capa 0, siguen pasando.
- `pnpm exec eslint src/pages/ReportesAdmin.jsx src/hooks/reportesFinancieros/ src/utils/reportesFinancieros/`
  — correcto, sin advertencias.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta
  no es la última capa del módulo.

## Capa 7: cierre final

### Documentación sincronizada

- `docs/modularizacion/README.md` marca el módulo como terminado, con commit
  pendiente, en el orden 9.
- `docs/ARQUITECTURA_FRONTEND.md` registra la nueva sección "Reportes
  financieros" y las cuatro carpetas del dominio
  (`components/`, `hooks/`, `services/`, `utils/`) dentro de "Estructura de
  `src/`".
- `docs/COMPONENTES.md` agrega la sección "Reportes financieros" con la
  página, los cuatro componentes y la nota del comportamiento heredado de
  medios combinados, además de las entradas correspondientes en "Hooks y
  servicios".
- `docs/CAMBIOS_FRONTEND.md` agrega la entrada de cierre con el resumen
  completo del módulo y su verificación final.

### Verificación final

- Suite específica: 12 archivos y 114 pruebas correctas
  (`pnpm exec vitest run src/components/reportesFinancieros/ src/hooks/reportesFinancieros/ src/services/reportesFinancierosApi.test.js src/utils/reportesFinancieros/ src/pages/ReportesAdmin.test.jsx`).
- `pnpm run check:deploy`: correcto.
  - Vitest: 256 archivos y 1340 pruebas correctas.
  - ESLint global: correcto.
  - Build de producción: correcto; 364 módulos transformados
    (`ReportesAdmin-BHvATX2_.js`, 26.98 kB / 6.63 kB gzip).
- `git diff --check`: correcto (solo avisos de fin de línea LF→CRLF propios
  de Windows, sin errores de espacio en blanco).
- El diff (`git status` + `git diff --stat`) contiene únicamente:
  `docs/ARQUITECTURA_FRONTEND.md`, `docs/COMPONENTES.md`,
  `docs/CAMBIOS_FRONTEND.md`, `docs/modularizacion/README.md`,
  `docs/modularizacion/REPORTES_FINANCIEROS.md`, `src/pages/ReportesAdmin.jsx`
  y las carpetas/archivos nuevos de
  `src/components/reportesFinancieros/`, `src/hooks/reportesFinancieros/`,
  `src/services/reportesFinancierosApi.{js,test.js}` y
  `src/utils/reportesFinancieros/`. Ningún otro módulo fue tocado.
- No queda ninguna referencia a `utils/reportesMediosPago` en el código
  fuente; `src/utils/reportesFinancieros/mediosPago.js` es la única
  implementación. `src/services/reportesFinancierosApi.js` es el único
  archivo de producción del módulo que importa `utils/api.js`.
- Las rutas `/reportes/general`, `/reportes/ingresos-rango`,
  `/reportes/egresos-rango` y `/reportes/ingresos-mes/:mes` conservan sus
  parámetros y forma de respuesta originales; no se activó la paginación
  opcional (`limit`/`offset`) que el backend admite pero el frontend nunca
  usó.

### Riesgos conservados fuera de la migración

- Un pago con métodos combinados (`tipo_pago` unido con `" + "`) sin monto
  por método muestra, al filtrar por uno de esos medios, el monto **total**
  del pago en vez de una porción. Comportamiento vigente en producción,
  caracterizado con pruebas explícitas desde la capa 0. **No corregido**: no
  es un defecto de cálculo sino de datos — el backend no persiste el monto
  por método de un pago combinado en ningún lado, así que el frontend no
  puede reconstruirlo. Un arreglo real necesitaría un cambio de esquema en
  `sistema_escolar_api` (columna o tabla nueva) y no tiene datos retroactivos
  para pagos históricos.
- ~~`hoyISO()` toma la fecha en UTC sin compensar el desfase local~~ y
  ~~`nombreMes()` interpreta `"${mes}-01"` como medianoche UTC~~: **corregidos
  el 2026-08-08** en un commit separado. Ver "Corrección posterior al
  cierre" al final de este documento.
- La preasignación optimista de `detalleTipo` en los dos botones del panel
  "Rango de fechas" (antes de que la consulta resuelva) es asimétrica
  respecto a las demás cuatro formas de abrir un detalle; se documentó y
  preservó tal cual en la capa 3. Sin corregir.
- La etiqueta `Desde`/`Hasta` de `RangoFechasPanel.jsx` no está asociada al
  input mediante `htmlFor`/`id` (brecha de accesibilidad preexistente). Sin
  corregir.

El riesgo de medios combinados afecta la exactitud de un reporte financiero
y se recomienda como tarea aparte que involucra al backend.

### Verificación manual en producción

1. Iniciar sesión como administrador y abrir `Admin > Reportes`; confirmar
   que cargan las cuatro tarjetas superiores, el panel de estudiantes/
   profesores/acumulados, el bloque "Movimiento mensual" y el panel "Rango
   de fechas" con estudiantes por curso.
2. Verificar que un usuario sin rol `admin` no pueda acceder a
   `/admin/reportes` (redirección a `/login`).
3. Hacer clic en "Ingresos hoy" y en "Egresos hoy"; confirmar que el
   detalle abre con scroll automático, muestra la tabla correcta y hace
   scroll hasta el bloque.
4. En el detalle de ingresos, cambiar el filtro "Filtrar por medio de
   pago" (Todos/Efectivo/Transferencia/Tarjeta/Subsidio) y confirmar que la
   tabla y el total cambian según el medio elegido, incluidos pagos con
   métodos combinados.
5. Anular un pago de prueba en Pagos (o usar uno ya anulado) y confirmar
   que en Reportes aparece tachado, con badge "Anulado" y motivo visible,
   sin sumar al total.
6. Hacer clic en el nombre de un mes y en sus montos de ingreso/egreso en
   "Movimiento mensual"; confirmar que el detalle correspondiente carga.
   Verificar visualmente si el nombre del mes coincide con el esperado (ver
   riesgo de zona horaria arriba; si no coincide, es el defecto ya
   documentado, no una regresión de esta migración).
7. Elegir un rango de fechas manual, incluida una combinación inválida
   (inicio posterior a fin) para confirmar el aviso, y luego un rango
   válido para "Ingresos" y "Egresos".
8. Hacer clic en "Egresos acumulados" y confirmar que abre el detalle con
   el rango activo más reciente.
9. Cambiar a otra pestaña del navegador y volver; confirmar que el reporte
   general se recarga automáticamente (`visibilitychange`).
10. Revisar en un ancho móvil que las tarjetas, tablas (con scroll
    horizontal) y paneles conservan la disposición responsive.

### Commit sugerido

`refactor(reportes): modularizar el flujo completo`

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-08-08) |
| 1. Utilidades puras | Terminada (2026-08-08) |
| 2. Servicio HTTP | Terminada (2026-08-08) |
| 3. Hooks de consulta | Terminada (2026-08-08) |
| 4. Hooks de comandos | No aplica (2026-08-08): el módulo solo consulta, no tiene comandos de escritura. |
| 5. Presentación | Terminada (2026-08-08) |
| 6. Composición | Terminada (2026-08-08) |
| 7. Cierre | Terminada (2026-08-08) |

## Primera acción

Completada: se agregaron pruebas exhaustivas a `reportesMediosPago.js` y se
documentaron todas las variantes reales e históricas de la respuesta del
backend antes de extraer consultas.

## Entrega final

- Última capa terminada: Capa 7, cierre del módulo.
- Verificación final: 114 pruebas específicas; `check:deploy` (1340 pruebas
  globales), ESLint, build y `git diff --check` correctos.
- Implementación final: `src/pages/ReportesAdmin.jsx` (136 líneas) compone
  `src/components/reportesFinancieros/` con `src/hooks/reportesFinancieros/`;
  los hooks usan `src/services/reportesFinancierosApi.js` y
  `src/utils/reportesFinancieros/`.
- No quedan capas pendientes ni implementaciones antiguas duplicadas.
- Riesgos abiertos: ver "Riesgos conservados fuera de la migración" arriba;
  los dos defectos de zona horaria y el comportamiento de medios combinados
  afectan la exactitud del reporte y se recomiendan como tareas separadas.
- Siguiente acción exacta del usuario: revisar el diff, crear el único
  commit sugerido, hacer push a `origin/main`, esperar el deploy y ejecutar
  la verificación manual de producción registrada arriba.

## Corrección posterior al cierre (2026-08-08)

El módulo ya se había cerrado, commiteado (`51824b8`) y publicado en
`origin/main` cuando se autorizó corregir, como tarea aparte, los dos
defectos de zona horaria de baja complejidad detectados en la capa 1
(`hoyISO()` y `nombreMes()`). El tercer riesgo (medios combinados sin monto
por método) se dejó fuera por requerir un cambio de esquema en el backend.

### Cambios

- `src/utils/reportesFinancieros/formatos.js`:
  - `hoyISO()` ahora compensa el desfase horario local antes de convertir a
    ISO (mismo criterio que `src/utils/pagos/formatos.js#obtenerFechaLocal`),
    en vez de tomar la fecha directamente en UTC.
  - `nombreMes()` ahora construye la fecha con `Date.UTC(...)` y formatea con
    `timeZone: "UTC"` explícito (mismo criterio que
    `src/utils/pagos/formatos.js#formatearPeriodo`), en vez de parsear
    `"${mes}-01"` como fecha local. Sigue sin capitalizar: la página aplica
    la clase visual `capitalize`.
- `src/utils/reportesFinancieros/formatos.test.js`: las dos pruebas que
  caracterizaban el defecto ("riesgo caracterizado…") ahora prueban que el
  defecto ya no ocurre, con el mismo escenario (hora de Bogotá cerca de
  medianoche UTC).
- `src/pages/ReportesAdmin.test.jsx`: dejó de duplicar `formatoMoneda`,
  `hoyISO` y `finDeMesISO`; ahora importa las funciones reales de
  `utils/reportesFinancieros/formatos` para que sus aserciones no se
  desalineen si la implementación vuelve a cambiar.
- No se tocó ninguna firma ni punto de llamada: `hoyISO()` y `nombreMes(mes)`
  conservan los mismos parámetros y tipo de retorno.

### Verificación

- Suite específica:
  `pnpm exec vitest run src/utils/reportesFinancieros/ src/pages/ReportesAdmin.test.jsx src/hooks/reportesFinancieros/ src/components/reportesFinancieros/ src/services/reportesFinancierosApi.test.js`
  — 12 archivos, 114 pruebas correctas.
- `pnpm run check:deploy`: correcto; 256 archivos, 1340 pruebas, ESLint y
  build correctos.
- `git diff --check`: correcto.
- Diff acotado a `src/utils/reportesFinancieros/formatos.js`,
  `src/utils/reportesFinancieros/formatos.test.js` y
  `src/pages/ReportesAdmin.test.jsx`.

### Commit sugerido

`fix(reportes): corregir hoyISO y nombreMes para usar hora local`

### Verificación manual adicional en producción

- Un rato antes de medianoche (o cambiando la hora del sistema de prueba a
  zona horaria Bogotá), confirmar que "Ingresos hoy"/"Egresos hoy" consultan
  el día calendario correcto y no el del día siguiente.
- Confirmar que "Movimiento mensual" muestra el nombre del mes correcto para
  cada bloque (por ejemplo, el bloque más reciente debe decir el mes actual,
  no el anterior).
