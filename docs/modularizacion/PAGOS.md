# Modularización: Pagos

## Control

- Estado: Terminado y publicado en `main`.
- Orden: 7.
- Riesgo inicial: Muy alto.
- Flujo Git: `main` directo.
- Commit base: `eb24e2ad5cf2b4291af649ff5d9cc0e279e3c85d`.
- Commit final: `0f74233`.
- Última actualización: 2026-08-04.

## Objetivo

Separar de forma incremental el registro de pagos, deudas, mensualidades,
adelantos, subsidios y métodos combinados sin cambiar reglas financieras.

## Inventario inicial

- Ruta protegida: `/admin/pagos`, registrada en `src/App.jsx` mediante
  `AdminRoute`.
- Raíz actual: `src/pages/PagosAdmin.jsx`.
- Comprobante propio: `src/components/FacturaModerna.jsx`.
- Dependencia compartida conservada sin cambios:
  `src/components/impresion/DocumentoImprimible.jsx`, con tipo
  `voucher_pago`.
- Entrada desde cartera u otra pantalla: `location.state.estudiante_id`; una
  vez consumida se limpia con navegación `replace` sobre la misma ruta.
- Sesión leída desde `localStorage.usuario`. La página admite únicamente el rol
  `admin` y redirige a `/login` cuando falta o no coincide.
- Dependencias contractuales con otros dominios: estudiantes, cursos, tipos de
  pago, cartera/deudas y ventas pendientes. Se consumen desde PAGOS, pero no se
  moverá ni modificará su implementación durante este módulo.

## Mapa de subflujos

1. Carga inicial de estudiantes, cursos y tipos de pago activos.
2. Búsqueda local de estudiantes y resolución del curso mostrado mediante
   `curso_nombre`, `curso` o la lista de cursos.
3. Selección manual o preselección por navegación; carga coordinada del
   historial, ventas pendientes, deudas, cuotas vencidas y valores
   personalizados.
4. Administración del valor personalizado de un concepto para el estudiante:
   consultar, crear/actualizar y retirar.
5. Pago normal de una venta pendiente o una deuda académica.
6. Pago de conceptos mensuales mediante una o varias cuotas vencidas; la más
   antigua se propone inicialmente y se conserva el modo de abono libre.
7. Adelanto de mensualidades por cantidad de meses completos.
8. Adelanto o subsidio por monto, distribuido secuencialmente entre los meses
   disponibles hasta diciembre.
9. Selección de uno o varios métodos (`efectivo`, `tarjeta`, `transferencia`,
   `subsidio`) con nota libre para transferencia o subsidio.
10. Historial, impresión del comprobante y anulación con motivo confirmado.

## Contratos HTTP actuales

| Operación | Contrato observado |
|---|---|
| Cargar estudiantes | `GET /estudiantes`; usa `response.data` como arreglo. |
| Cargar cursos | `GET /cursos`; normaliza a arreglo o `[]`. |
| Cargar conceptos | `GET /tipos-pagos`; normaliza a arreglo y excluye `activo === false`. |
| Historial | `GET /pagos/:estudianteId`; usa `response.data` en el orden del backend. |
| Deudas | `GET /estudiantes/:estudianteId/deudas`; usa `response.data.deudas || []`. |
| Ventas pendientes | `GET /api/ventas/pendientes/:estudianteId`; usa `response.data`. |
| Cuotas vencidas | `GET /pagos/vencidos/opciones/:estudianteId`; usa `response.data.opciones` o `[]`. |
| Opciones de adelanto | `GET /pagos/adelanto/opciones/:estudianteId`; usa `response.data.opciones` o `[]`. |
| Valores personalizados | `GET /estudiantes/:estudianteId/valores-pago-personalizados`; usa arreglo o `[]`. |
| Guardar valor personalizado | `PUT /estudiantes/:estudianteId/valores-pago-personalizados/:tipoPagoId` con `{ valor: number, motivo: string, activo: true }`; reemplaza la lista con `response.data.valores || []`. |
| Retirar valor personalizado | `DELETE /estudiantes/:estudianteId/valores-pago-personalizados/:tipoPagoId`. |
| Pago normal | `POST /pagos` con el contrato detallado abajo. |
| Adelanto | `POST /pagos/adelanto` con el contrato detallado abajo. |
| Anulación | `POST /pagos/:pagoId/anular` con `{ motivo: string }`. |

### Payload de pago normal

- Parte del estado editable con `estudiante_id`, `descripcion`, `fecha`,
  `monto`, `metodos` y, cuando corresponda, `venta_id` y `aplicaciones`.
- Elimina los campos exclusivos de adelanto:
  `tipo_pago_id_adelanto`, `cantidad_meses`, `modalidad_adelanto` y
  `monto_distribuir`.
- Elimina `venta_id` cuando es falso y `aplicaciones` cuando está vacío.
- Convierte `aplicaciones[].tipo_pago_id` y `aplicaciones[].monto` a número.
- Conserva actualmente `monto` y `metodos[].monto` como valores de formulario
  (cadenas). Esta diferencia es parte del contrato caracterizado y no debe
  cambiarse silenciosamente.

### Payload de adelanto

- Envía `estudiante_id`, `tipo_pago_id`, `fecha` y `metodos`.
- Convierte `tipo_pago_id` y cada `metodos[].monto` a número.
- En modalidad de meses agrega `cantidad_meses: number`.
- En modalidad por monto agrega `monto_distribuir: number` y no envía
  `cantidad_meses`.

## Cálculos e invariantes caracterizados

- La fecha inicial es la fecha local en formato `YYYY-MM-DD`, compensando el
  desfase horario antes de convertir a ISO.
- Los periodos `YYYY-MM` se presentan en español con fecha UTC para evitar que
  cambie el mes por zona horaria.
- La distribución de adelantos trabaja en centavos redondeados, aplica el monto
  en orden sobre cada saldo y devuelve tanto aplicaciones como valor sin
  distribuir.
- El adelanto por cantidad suma los saldos de los primeros `cantidad_meses`
  disponibles; no usa una multiplicación ciega por el valor unitario.
- Un monto por distribuir se rechaza si es menor o igual a cero o si queda saldo
  sin mes asignado dentro de la capacidad disponible hasta diciembre.
- Para deuda o venta normal se impide registrar un monto superior al saldo
  seleccionado; un abono inferior sigue permitido.
- En conceptos mensuales se exige una aplicación seleccionada salvo que el
  usuario active explícitamente el abono libre.
- La selección de cuotas recalcula el total con la suma de sus saldos y, si hay
  un solo método, sincroniza su monto.
- Todos los métodos elegidos deben tener monto positivo y su suma con
  `parseFloat` debe ser estrictamente igual al monto total.
- La confirmación de cuotas informa meses y total. La confirmación de adelanto
  por monto informa la distribución y advierte, sin absorberla, una deuda
  vencida del mismo concepto.
- `registrandoPago` evita un segundo envío mientras el primero está en curso.
- Tras un registro correcto se recargan historial, ventas, deudas y cuotas
  vencidas. Tras una anulación se realizan las mismas cuatro recargas.
- El comprobante conserva número `FAC-` con seis dígitos, datos del estudiante,
  fecha, descripción y total.
- La estructura responsive actual (lista/panel, rejillas móviles y vista fija
  de impresión) queda fuera de cualquier rediseño durante la migración.

## Invariantes

- Pago normal de deudas académicas e inventario.
- Selección de meses vencidos y abonos parciales.
- Meses adelantados completos o distribuidos.
- Validación de capacidad hasta diciembre.
- Subsidio con referencia libre.
- Métodos combinados cuya suma coincide con el total.
- Confirmaciones y manejo de errores actuales.

## Riesgos iniciales

- Es el archivo más grande y combina varios subflujos financieros.
- Alterar montos, saldos, periodos o asignación de pagos.
- Duplicar envíos o aceptar sumas inconsistentes.
- Acoplamiento con cartera, inventario y reportes.

## Riesgos abiertos después de la capa 0

- Los conceptos se relacionan en varios puntos por nombre y en otros por ID;
  una extracción debe conservar ambas reglas hasta que exista evidencia para
  unificar el contrato.
- La igualdad estricta entre sumas decimales es comportamiento vigente y puede
  ser sensible a representación flotante; se protege sin corregirla en esta
  migración.
- Pago normal y adelanto convierten montos en momentos distintos. Homogeneizar
  tipos podría alterar el backend y no forma parte de esta capa.
- Las opciones de adelanto se normalizan dentro de la página con fallbacks de
  `saldo`, `estado` y `total_disponible`; mover esta lógica requiere pruebas
  unitarias antes de reemplazarla.
- Las consultas actuales no tienen cancelación ni descarte de respuestas
  antiguas. La capa de hooks deberá conservar la pantalla y evitar introducir
  carreras durante la extracción.
- `FacturaModerna` pertenece a PAGOS, pero `DocumentoImprimible` es compartido
  con certificados e impresión y permanecerá fuera del módulo.
- Los endpoints de ventas, deudas, cursos y tipos de pago son dependencias; no
  autorizan cambios en esos módulos.

## Pruebas de protección

- `src/pages/PagosAdmin.test.jsx` caracteriza:
  - endpoints de carga inicial y selección;
  - payload normal de una cuota mensual con métodos combinados;
  - distribución parcial de un adelanto y su payload numérico.
- `src/components/pagos/FacturaModerna.test.jsx` protege identificación, estudiante,
  concepto, fecha y total del comprobante.
- No se modificó código productivo en la capa 0.

## Decisiones de la capa 0

- Se protege primero el comportamiento observable desde la página, sin exportar
  helpers internos ni anticipar la capa de utilidades.
- `FacturaModerna` queda clasificado como componente propio de PAGOS y podrá
  moverse al directorio del dominio en la capa de presentación, manteniendo su
  contrato de props.
- Los contratos consumidos de cartera, ventas y tipos de pago se documentan,
  pero sus archivos fuente permanecen fuera del alcance.
- La capa 1 deberá separar funciones puras por responsabilidad y solo conservar
  constantes dentro del dominio cuando tengan uso real.

## Resultado de la capa 1

Se creó `src/utils/pagos/` con unidades puras y pruebas adyacentes:

- `formatos.js`: fecha local con reloj recibido explícitamente, moneda con el
  locale vigente del entorno y periodos en español mediante UTC.
- `calculos.js`: distribución secuencial en centavos, aplicaciones de cuotas,
  suma de periodos y proyección del adelanto por cantidad.
- `contratos.js`: métodos admitidos, estados iniciales nuevos, normalización de
  tipos/opciones y builders de payload normal y adelantado.

`PagosAdmin.jsx` consume estas utilidades y dejó de implementar localmente:

- fecha y formateadores;
- estado inicial del pago y del valor personalizado;
- lista de métodos de pago;
- normalización de tipos de pago, cuotas vencidas y adelantos;
- distribución, aplicaciones y totales por periodos;
- poda y conversión de los dos payloads de registro.

No se movieron llamadas HTTP, efectos, estado React, confirmaciones, mensajes ni
JSX. Tampoco se modificaron `FacturaModerna` ni componentes compartidos.

### Decisiones de la capa 1

- El reloj se obtiene en la página y se entrega a `crearPagoInicial`; así la
  utilidad permanece determinista sin cambiar el momento en que se inicializa o
  reinicia el formulario.
- `formatearMoneda` conserva deliberadamente el locale implícito y
  `formatearPeriodo` conserva UTC. No se homogeneizaron formatos.
- El payload normal conserva `monto` y montos de métodos como cadenas; solo sus
  aplicaciones se convierten a número. El payload adelantado mantiene sus
  conversiones numéricas originales.
- La normalización conserva la diferencia entre `??` para saldos/totales y
  `||` para el estado, incluidos ceros explícitos.
- Los cálculos por cantidad y por monto siguen separados porque el segundo
  redondea y limita en centavos, mientras el primero suma los saldos recibidos
  sin reinterpretarlos.
- No se extrajeron selectores pequeños ni transiciones de formulario que
  pertenecen a los futuros hooks; se evitó anticipar otra capa.

### Pruebas de la capa 1

- `src/utils/pagos/formatos.test.js`: 3 pruebas.
- `src/utils/pagos/calculos.test.js`: 4 pruebas.
- `src/utils/pagos/contratos.test.js`: 7 pruebas.
- Las 4 pruebas de caracterización de la capa 0 continúan correctas.
- Resultado acumulado específico: 18 pruebas correctas en 5 archivos y lint
  específico correcto.

## Resultado de la capa 2

Se creó `src/services/pagosApi.js` como único límite de transporte HTTP del
módulo. Encapsula los 14 contratos inventariados:

- estudiantes, cursos y tipos de pago;
- historial, deudas, ventas pendientes y valores personalizados;
- opciones vencidas y de adelanto;
- guardar y retirar valores personalizados;
- registrar pago normal, registrar adelanto y anular pago.

`PagosAdmin.jsx` dejó de importar `src/utils/api.js` y ya no contiene rutas del
backend. Continúa siendo responsable, por ahora, de invocar el servicio,
normalizar sus datos con `src/utils/pagos/`, actualizar estados, mostrar
mensajes y coordinar recargas.

### Decisiones de la capa 2

- El servicio devuelve únicamente `response.data`; no expone la respuesta de
  Axios a la página.
- El servicio no atrapa errores. Propaga la misma instancia para que la página
  conserve los mensajes y fallbacks existentes.
- Payloads y parámetros llegan al cliente HTTP sin transformaciones nuevas;
  sus conversiones permanecen en los builders puros de la capa 1.
- Las normalizaciones de tipos, opciones y arreglos permanecen fuera del
  servicio porque son contratos de dominio, no transporte.
- Se conservaron exactamente rutas con prefijos distintos, incluida
  `/api/ventas/pendientes/:estudianteId`; no se intentó homogeneizarlas.
- Se retiró de la página la comprobación redundante de `response.status`: el
  cliente Axios configurado solo resuelve respuestas HTTP exitosas y propaga
  las demás al `catch` existente. Mensajes, recargas y flujo visual no cambian.
- No se crearon hooks ni se movieron estados, efectos, confirmaciones o
  comandos de React en esta capa.

### Pruebas de la capa 2

- `src/services/pagosApi.test.js`: 15 pruebas que cubren las 9 consultas, los 5
  comandos y la propagación de errores.
- Las 18 pruebas de caracterización y utilidades de las capas anteriores
  continúan correctas.
- Resultado acumulado específico: 33 pruebas correctas en 6 archivos y lint
  específico correcto.

## Resultado de la capa 3

Se creó `src/hooks/pagos/` con tres límites de consulta:

- `useCatalogosPagos.js`: carga inicial de estudiantes, cursos y tipos de pago
  activos; conserva el indicador de carga ligado a estudiantes.
- `useConsultasEstudiantePagos.js`: estudiante seleccionado, historial, deudas,
  ventas pendientes, cuotas vencidas y valores personalizados; expone las
  recargas individuales que consumen los comandos actuales.
- `useOpcionesAdelanto.js`: consulta bajo demanda, normalización, carga, error y
  limpieza de las opciones de adelanto.

`PagosAdmin.jsx` dejó de administrar estados y funciones HTTP de consulta. La
página conserva la preselección desde `location.state`, conecta la selección
con el formulario y continúa coordinando comandos, confirmaciones, mensajes y
JSX.

### Decisiones de la capa 3

- Los catálogos se siguen solicitando en paralelo al montar la pantalla. El
  estado `loading` conserva la semántica anterior y finaliza con la consulta de
  estudiantes, no con un `Promise.all` nuevo.
- El error inicial de estudiantes se comunica a la página mediante callback
  para conservar el mismo `Swal`; los hooks no importan librerías visuales.
- Seleccionar un estudiante inicia las mismas cinco consultas independientes y
  limpia únicamente opciones vencidas y su error antes de recargar.
- Las opciones de adelanto permanecen bajo demanda. Se distinguen la limpieza
  completa de opciones/error y la limpieza exclusiva de opciones que ocurre
  después de registrar correctamente.
- La actualización local de valores personalizados se expone desde el hook para
  que los comandos existentes mantengan su respuesta inmediata; esos comandos
  no se movieron todavía.
- No se agregaron debounce, paginación, sincronización URL ni almacenamiento
  porque el flujo actual no los utiliza.
- No se añadió cancelación ni descarte de respuestas antiguas: hacerlo cambiaría
  una carrera preexistente y excedería esta extracción. El riesgo queda abierto
  para una tarea funcional separada o una autorización explícita.
- La preselección y limpieza de `location.state` permanecen en la página por ser
  composición de ruta, no una consulta de dominio.

### Pruebas de la capa 3

- `src/hooks/pagos/useCatalogosPagos.test.js`: 2 pruebas.
- `src/hooks/pagos/useConsultasEstudiantePagos.test.js`: 3 pruebas.
- `src/hooks/pagos/useOpcionesAdelanto.test.js`: 3 pruebas.
- Las 33 pruebas de capas anteriores continúan correctas.
- Resultado acumulado específico: 41 pruebas correctas en 9 archivos y lint
  específico correcto.

## Resultado de la capa 4

Se completó la extracción de estado editable, transiciones y comandos en cuatro
hooks de `src/hooks/pagos/`:

- `useFormularioPago.js`: administra apertura, cierre y reinicio del formulario,
  modo normal/adelantado, abono libre, cuotas, métodos, campos editables y todos
  los valores derivados que utiliza la presentación.
- `useValoresPersonalizadosPago.js`: administra el formulario de valor
  personalizado y coordina guardar o retirar el ajuste del estudiante.
- `useRegistroPago.js`: valida, confirma y registra pagos normales o adelantados,
  conserva los payloads de la capa 1 y coordina las cuatro recargas posteriores.
- `useAnulacionPago.js`: confirma el motivo, anula el pago y coordina las mismas
  recargas de historial, ventas, deudas y cuotas vencidas.

`PagosAdmin.jsx` dejó de duplicar esos estados, cálculos derivados, validaciones,
confirmaciones y llamadas de comandos. Conserva la composición de ruta, búsqueda
local, selección del comprobante para impresión y el JSX actual.

### Decisiones de la capa 4

- Las confirmaciones y notificaciones de un comando permanecen junto al hook que
  coordina ese comando. Se conservaron literalmente sus textos, iconos,
  validaciones y botones; no se introdujo un sistema compartido de mensajes.
- Los hooks reciben las recargas de consulta como dependencias. Así no duplican
  transporte HTTP ni acoplan entre sí los hooks de consulta y comandos.
- `useFormularioPago` conserva la selección automática de la primera cuota
  vencida y la sincronización de un único método con el total, protegidas antes
  de retirar las implementaciones de la página.
- El registro sigue bloqueando reenvíos, mantiene la igualdad estricta vigente
  entre total y métodos y usa sin cambios los builders de payload puros.
- Guardar un valor personalizado reemplaza la lista con la respuesta del backend;
  retirarlo conserva la actualización local inmediata y las recargas existentes.
- La impresión y `location.state` permanecen en la página porque pertenecen a la
  composición visual y de ruta. No se anticipó la extracción de componentes.
- No se corrigieron las carreras, conversiones ni relaciones por nombre/ID
  documentadas como riesgos; cambiar esos comportamientos queda fuera de esta
  migración.

### Pruebas de la capa 4

- `src/hooks/pagos/useFormularioPago.test.js`: 4 pruebas.
- `src/hooks/pagos/useValoresPersonalizadosPago.test.js`: 3 pruebas.
- `src/hooks/pagos/useRegistroPago.test.js`: 3 pruebas.
- `src/hooks/pagos/useAnulacionPago.test.js`: 3 pruebas.
- Las 41 pruebas de capas anteriores continúan correctas.
- Resultado acumulado específico: 54 pruebas correctas en 13 archivos y lint
  específico correcto.

## Resultado de la capa 5

Se creó `src/components/pagos/` con seis unidades de presentación controladas
mediante datos y callbacks:

- `ListaEstudiantesPagos.jsx`: búsqueda controlada, carga, estado vacío,
  selección y resumen de documento/curso.
- `ValoresPersonalizadosPago.jsx`: formulario, estado de guardado, lista de
  ajustes y acciones de editar o quitar.
- `FormularioPago.jsx`: presentación completa de pago normal, cuotas vencidas,
  adelantos, distribución, fecha, total y métodos combinados.
- `HistorialPagos.jsx`: estado vacío, pagos vigentes/anulados y acciones de
  impresión o anulación.
- `ComprobantePago.jsx`: vista fija, retorno y composición con el wrapper de
  impresión compartido.
- `FacturaModerna.jsx`: cuerpo del voucher trasladado desde
  `src/components/FacturaModerna.jsx` sin cambiar su contrato de props.

`PagosAdmin.jsx` dejó de contener esos bloques visuales y pasó de enlazar JSX
extenso a componer los componentes del dominio con los hooks ya extraídos. La
página conserva por ahora la ruta, autorización, preselección, búsqueda local,
resolución del curso, selección coordinada y comprobante activo.

### Decisiones de la capa 5

- Todos los componentes reciben datos, indicadores y callbacks por props. No
  importan hooks de PAGOS ni conocen endpoints o el servicio HTTP.
- `FormularioPago` conserva un contrato explícito aunque sea amplio: agruparlo
  en un objeto nuevo habría ocultado dependencias y anticipado la consolidación
  de la página de la capa 6.
- Los componentes importan únicamente constantes y formateadores puros cuando
  son necesarios para presentar el mismo contenido.
- `FacturaModerna` y su prueba se movieron juntos. El número, fallbacks, fecha,
  tabla, totales, clases y `forwardRef` permanecen iguales.
- `DocumentoImprimible` continúa en `src/components/impresion/` porque es una
  dependencia compartida real con otros dominios; PAGOS solo lo compone.
- Se conservaron literalmente textos, etiquetas, estructura responsive,
  estados de carga/error/vacío y clases visuales. No se agregaron controles ni
  comportamientos.
- La página mantiene el estado local de búsqueda e impresión y sus helpers de
  composición. Moverlos o concluir que no requieren otra extracción se evaluará
  exclusivamente en la capa 6.

### Pruebas de la capa 5

- `src/components/pagos/ListaEstudiantesPagos.test.jsx`: 2 pruebas.
- `src/components/pagos/ValoresPersonalizadosPago.test.jsx`: 2 pruebas.
- `src/components/pagos/FormularioPago.test.jsx`: 2 pruebas.
- `src/components/pagos/HistorialPagos.test.jsx`: 3 pruebas.
- `src/components/pagos/ComprobantePago.test.jsx`: 2 pruebas.
- `src/components/pagos/FacturaModerna.test.jsx`: 1 prueba trasladada con la
  unidad.
- `src/pages/PagosAdmin.test.jsx` pasó de 3 a 6 pruebas de caracterización para
  proteger también búsqueda, valores personalizados, historial, impresión y
  anulación antes de retirar el JSX.
- Las 54 pruebas de las capas anteriores, incluida la prueba trasladada del
  comprobante, continúan correctas.
- Resultado acumulado específico: 68 pruebas correctas en 18 archivos y lint
  específico correcto.

## Resultado de la capa 6

Se auditó `PagosAdmin.jsx` después de la extracción presentacional. La página
ya funciona como raíz de composición y no necesitó otra modificación
productiva:

- lee `location.state.estudiante_id`, la sesión y la ruta actual;
- conecta los siete hooks de consultas, formulario y comandos;
- conserva navegación, selección coordinada y apertura automática;
- administra únicamente búsqueda local y comprobante activo como estado de
  interfaz;
- compone `ListaEstudiantesPagos`, `ValoresPersonalizadosPago`,
  `FormularioPago`, `HistorialPagos` y `ComprobantePago`.

No quedan endpoints, llamadas al servicio, payloads, reglas financieras,
normalizaciones ni bloques visuales extensos dentro de la página.

### Decisiones de la capa 6

- La búsqueda y el pago seleccionado para imprimir permanecen en la raíz porque
  son estado local de composición, no estado remoto ni reglas del dominio.
- El filtro de texto y la resolución de nombre de curso son transformaciones
  pequeñas ligadas a los datos que la página entrega al listado. Crear otro hook
  o utilidad solo para ocultarlas no reduciría duplicación ni aclararía el
  contrato.
- `handleEstudianteSelect` permanece como coordinador explícito entre selección,
  preparación del formulario y reinicio de estados dependientes. Es una
  responsabilidad propia de la raíz.
- No se creó un hook agregador para envolver los siete hooks existentes: la
  página debe mostrar cómo se conectan consultas, comandos y presentación, y
  una capa adicional ocultaría esas dependencias sin reutilización real.
- La preselección continúa limpiando `location.state` mediante navegación
  `replace` y conserva la apertura del formulario. La autorización continúa
  redirigiendo a `/login` sin alterar roles ni rutas.
- La ausencia de cambios productivos en esta capa es deliberada: la extracción
  de la capa 5 ya dejó la página en la arquitectura objetivo y otra migración
  habría sido meramente cosmética.

### Pruebas de la capa 6

- `src/pages/PagosAdmin.test.jsx` agregó 2 pruebas para proteger:
  - redirección a `/login` cuando la sesión no es de administrador;
  - preselección desde `location.state`, apertura del formulario, consultas y
    limpieza del estado de navegación.
- La selección manual continúa protegida por la caracterización existente.
- Resultado acumulado específico: 70 pruebas correctas en 18 archivos y lint
  específico correcto.

## Resultado de la capa 7

Se cerró el módulo y se sincronizó la documentación:

- `docs/modularizacion/README.md` marca PAGOS como terminado con commit
  pendiente.
- `docs/ARQUITECTURA_FRONTEND.md` registra componentes, hooks, servicio,
  utilidades y responsabilidades finales del dominio.
- `docs/COMPONENTES.md` reemplaza la ubicación antigua del comprobante y
  documenta las seis unidades presentacionales.
- `docs/CAMBIOS_FRONTEND.md` incorpora el cierre y sus verificaciones.

### Verificación final

- Suite específica: 70 pruebas correctas en 18 archivos.
- `pnpm run check:deploy`: correcto.
  - 167 archivos de prueba y 592 pruebas globales correctas.
  - ESLint global correcto.
  - Build de producción correcto con 289 módulos transformados.
- `git diff --check`: correcto.
- Rama final revisada: `main` sobre el commit base
  `eb24e2ad5cf2b4291af649ff5d9cc0e279e3c85d`.
- El diff contiene únicamente PAGOS y su documentación específica/global.
- Las rutas HTTP aparecen solo en `src/services/pagosApi.js`; página y
  componentes no importan transporte.
- Payloads, normalizaciones y cálculos tienen una única implementación bajo
  `src/utils/pagos/`.
- Registro, valores personalizados y anulación tienen una única implementación
  de comando bajo `src/hooks/pagos/`.
- Se retiró `src/components/FacturaModerna.jsx`; su única implementación vive
  en `src/components/pagos/FacturaModerna.jsx` y no quedan imports antiguos.

### Riesgos conservados fuera de la migración

- La relación de conceptos por nombre o ID se mantiene según cada contrato
  existente.
- Pago normal y adelantado conservan conversiones distintas de montos.
- La igualdad estricta de la suma de métodos y la aritmética decimal vigente no
  se reinterpretaron.
- Las consultas conservan la política anterior frente a respuestas obsoletas;
  no se añadió cancelación como cambio funcional silencioso.

### Verificación manual en producción

1. Entrar como administrador a `/admin/pagos`; confirmar carga, búsqueda,
   selección y curso visible. Verificar que un usuario sin rol admin no acceda.
2. Abrir PAGOS desde `Cobrar` en cartera; confirmar estudiante preseleccionado,
   formulario abierto y ausencia de reapertura al recargar.
3. Registrar un pago pendiente de concepto mensual: revisar mes más antiguo,
   selección múltiple, abono libre, total y confirmación de periodos.
4. Registrar un pago con dos métodos y confirmar que sus montos sumen el total;
   revisar nota de transferencia.
5. Registrar un adelanto por meses completos y otro por monto/subsidio; revisar
   distribución, límite hasta diciembre y referencia del subsidio.
6. Crear, editar y retirar un valor personalizado; confirmar actualización de
   deuda y cuotas.
7. Abrir el comprobante, imprimir o guardar como PDF y volver al historial.
8. Anular un pago con motivo válido; confirmar estado `Anulado`, deuda y
   recargas posteriores.

### Commit sugerido

`refactor(pagos): modularizar el flujo completo`

## Estrategia adicional

La capa 0 debe dividir el módulo en subflujos documentados. Puede requerir más
de un chat y más de un hook de formulario. No se debe extraer todo en una sola
edición.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-08-04) |
| 1. Utilidades puras | Terminada (2026-08-04) |
| 2. Servicio HTTP | Terminada (2026-08-04) |
| 3. Hooks de consulta | Terminada (2026-08-04) |
| 4. Hooks de comandos | Terminada (2026-08-04) |
| 5. Presentación | Terminada (2026-08-04) |
| 6. Composición | Terminada (2026-08-04) |
| 7. Cierre | Terminada (2026-08-04) |

## Primera acción

Completada: se creó el mapa de subflujos, endpoints, payloads y cálculos, y se
agregaron pruebas de caracterización antes de mover estado React.

## Entrega final

- Última capa terminada: Capa 7, cierre del módulo.
- Verificación final: 70 pruebas específicas; `check:deploy`, ESLint, build y
  `git diff --check` correctos.
- Implementación final: `src/pages/PagosAdmin.jsx` compone
  `src/components/pagos/` y `src/hooks/pagos/`; los hooks usan
  `src/services/pagosApi.js` y `src/utils/pagos/`.
- No quedan capas pendientes ni implementaciones antiguas duplicadas.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual de producción registrada arriba como seguimiento
  operativo si todavía no fue ejecutada.
