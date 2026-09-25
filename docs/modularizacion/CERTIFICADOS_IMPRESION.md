# Modularización: Certificados e impresión

## Control

- Estado: Terminado y publicado en `main`. Capas 0 a 7 completas.
- Orden: 6.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: `9394d366a5ba6be6f67e408c551d0c449c836aa8`.
- Commit final: `d730cf1`; ajuste posterior publicado en `63526ed`.
- Última actualización: 2026-08-03.

## Objetivo

Separar consultas, configuración institucional y documentos imprimibles sin
alterar contenido académico, branding ni reglas de impresión.

## Inventario inicial

- `src/pages/CertificadosAdmin.jsx`
- `src/pages/BrandingAdmin.test.jsx`
- `src/pages/BrandingAdmin.jsx`
- `src/components/impresion/DocumentoImprimible.jsx`
- `src/components/certificadosImpresion/SeleccionCertificados.jsx`
- `src/components/certificadosImpresion/SeleccionCertificados.test.jsx`
- `src/components/certificadosImpresion/DatoCertificado.jsx`
- `src/components/certificadosImpresion/CertificadoNotasPreview.jsx`
- `src/components/certificadosImpresion/CertificadoMatriculaPreview.jsx`
- `src/components/certificadosImpresion/ReporteParcialPreview.jsx`
- `src/components/certificadosImpresion/VistasImprimibles.test.jsx`
- `src/components/certificadosImpresion/admin/IdentidadInstitucionalView.jsx`
- `src/components/certificadosImpresion/admin/IdentidadInstitucionalView.test.jsx`
- `src/components/certificadosImpresion/admin/PlantillasAdminView.jsx`
- `src/components/certificadosImpresion/admin/PlantillasAdminView.test.jsx`
- `src/services/printingService.js`
- `src/services/printingService.test.js`
- `src/services/certificadosImpresionApi.js`
- `src/services/certificadosImpresionApi.test.js`
- `src/hooks/certificadosImpresion/useConsultasCertificadosAdmin.js`
- `src/hooks/certificadosImpresion/useConsultasCertificadosAdmin.test.js`
- `src/hooks/certificadosImpresion/usePrintConfig.js`
- `src/hooks/certificadosImpresion/usePrintConfig.test.js`
- `src/hooks/certificadosImpresion/useIdentidadInstitucional.js`
- `src/hooks/certificadosImpresion/useIdentidadInstitucional.test.js`
- `src/hooks/certificadosImpresion/usePlantillasAdmin.js`
- `src/hooks/certificadosImpresion/usePlantillasAdmin.test.js`
- `src/styles/print.css`
- `src/utils/certificadosImpresion/certificados.js`
- `src/utils/certificadosImpresion/certificados.test.js`
- `src/utils/certificadosImpresion/impresion.js`
- `src/utils/certificadosImpresion/impresion.test.js`
- `src/pages/CertificadosAdmin.test.jsx`
- `src/components/impresion/DocumentoImprimible.test.jsx`

`src/components/ReporteEstudiante.jsx`, incluido en el inventario preliminar, no
existe en el commit base. El reporte académico parcial individual y por curso
está implementado dentro de `src/pages/CertificadosAdmin.jsx`.

## Contrato observado en capa 0

### Alcance propio de certificados

- Ruta administrativa `/admin/certificados`, protegida por `AdminRoute` para
  usuarios con rol `admin`.
- Carga base paralela mediante `GET /cursos`, `GET /estudiantes` y
  `GET /materias`.
- Certificado de notas mediante
  `GET /boletines/admin/generar/{estudianteId}/{periodo}`; la opción de todos
  los periodos conserva cuatro consultas, agrega las materias por identificador
  y calcula promedios solo con notas válidas mayores que cero.
- Certificado de matrícula construido con los datos ya cargados de estudiante,
  curso, jornada, estado y año lectivo; no realiza una consulta adicional.
- Reporte académico parcial individual o por curso mediante el mismo contrato
  de boletines y `GET /asistencia/historial/{asignacionId}/{periodo}`. Un fallo
  de asistencia se degrada a cero inasistencias; un boletín fallido se omite y
  se informa en el impreso, salvo que no quede ningún boletín válido.
- Filtros por curso, estado, texto, periodo y materia. No hay acceso directo a
  `localStorage` ni `sessionStorage` dentro de la página.

### Infraestructura de impresión compartida

- Ruta administrativa `/admin/diseno-impresos`, también limitada al rol
  `admin`, con pestañas de identidad institucional y plantillas.
- Branding: `GET /branding`, `PUT /branding`, carga multipart en
  `POST /branding/logo?slot={principal|secundario}` y eliminación en
  `DELETE /branding/logo?slot={principal|secundario}`.
- Plantillas: `GET /plantillas` con filtro opcional `tipo`,
  `GET /plantillas/activa/{tipo}`, activación, duplicación, actualización,
  eliminación y creación bajo `/plantillas`.
- `usePrintConfig` comparte en memoria el branding y la plantilla activa por
  tipo, deduplica solicitudes concurrentes e invalida toda la caché después de
  comandos administrativos.
- `DocumentoImprimible` conserva encabezado, logos, datos institucionales,
  firmas, pie, variables visuales y dos botones que invocan `window.print()`.
  Ante un error de configuración continúa con valores por defecto.
- `print.css` no fija tamaño de papel: se imprime en el que se elija en la
  ventana de imprimir (carta, oficio...). En computador la hoja en pantalla
  mide lo mismo que el papel impreso (ancho carta/oficio, orilla de 8 mm y
  marco); ver `CAMBIOS_FRONTEND.md` (2026-09-24, impresos). En móvil,
  certificados y otros documentos anchos mantienen 210 mm y usan scroll
  horizontal; pestañas, filtros y editores también conservan sus variantes
  responsive existentes.
- Esta infraestructura tiene consumidores en boletines, observaciones,
  cartera, pagos, planeador y ventas. Durante la modularización no se moverá a
  un dominio exclusivo de certificados ni se cambiará su contrato sin proteger
  esos consumidores.

## Invariantes

- Certificados de notas y matrícula.
- Reporte académico parcial individual o por curso.
- Selección de periodo y materia.
- Branding, firmas, encabezados y pie de página.
- Formato A4, scroll móvil y `window.print()`.
- Configuración compartida por los distintos impresos.

## Riesgos iniciales

- Romper dimensiones o estilos de impresión.
- Alterar consolidación académica entre periodos.
- Duplicar carga de branding o configuración.
- Mezclar lógica específica de certificados con infraestructura compartida.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Completa |
| 1. Utilidades puras | Completa |
| 2. Servicio HTTP | Completa |
| 3. Hooks de consulta | Completa |
| 4. Hooks de comandos | Completa |
| 5. Presentación | Completa |
| 6. Composición | Completa |
| 7. Cierre | Completa |

## Primera acción

Completada: se delimitó la infraestructura de impresión compartida frente a
los contratos propios de certificados y se añadieron pruebas de
caracterización para la construcción de reportes y el wrapper imprimible.

## Resultado de la capa 0

### Pruebas agregadas

- `src/pages/CertificadosAdmin.test.jsx`: protege la consolidación y promedio
  de cuatro periodos, los endpoints usados por el reporte parcial, materia,
  detalle, desempeño, inasistencias y la construcción local del certificado de
  matrícula.
- `src/components/impresion/DocumentoImprimible.test.jsx`: protege branding,
  variables de plantilla, clase de scroll móvil, firmas, pie, ambos comandos de
  impresión, limpieza de la clase global y degradación a valores por defecto.

### Verificación

- Línea base en el commit registrado: `pnpm run check:deploy` correcto, con
  111 archivos y 387 pruebas; lint y build correctos.
- Capa 0: `pnpm exec vitest run src/pages/CertificadosAdmin.test.jsx
  src/components/impresion/DocumentoImprimible.test.jsx` correcto, con 2
  archivos y 5 pruebas.
- ESLint específico de los dos archivos nuevos y `git diff --check` correctos.
- La primera ejecución dentro del sandbox no inició Vite por `spawn EPERM`; la
  verificación correcta se ejecutó fuera del sandbox autorizado.

### Decisiones

- La capa 0 no modifica código productivo ni realiza extracciones.
- Las transformaciones académicas permanecen temporalmente en
  `CertificadosAdmin.jsx` hasta la capa 1, protegidas a través del comportamiento
  visible de la página.
- La infraestructura compartida de impresión conserva sus rutas actuales para
  no afectar consumidores de otros dominios.
- No se crea una abstracción compartida nueva: primero se extraerán únicamente
  contratos y transformaciones que ya tienen uso real en este módulo.

### Riesgos abiertos

- `CertificadosAdmin.jsx` concentra consultas, estado, transformaciones y tres
  impresos; las extracciones posteriores deben evitar cambios simultáneos de
  esas responsabilidades.
- Los valores `0` de notas continúan tratándose como ausencia de calificación;
  es comportamiento actual protegido, no una regla reinterpretada.
- Los fallos de asistencia continúan degradándose silenciosamente a una lista
  vacía después de registrar el error en consola.
- La caché de impresión es global al módulo y su invalidación limpia branding y
  todas las plantillas, no solo el tipo editado.

## Resultado de la capa 1

### Extracciones realizadas

- `src/utils/certificadosImpresion/certificados.js` concentra las opciones de
  periodos y estados, normalización de estudiantes y documentos, cálculo de
  definitivas y desempeños, consolidación entre periodos, filtros y construcción
  de los contratos de certificado y reporte parcial.
- La carga académica fallida continúa siendo descartada mediante el estado de
  `Promise.allSettled`; las utilidades reciben las respuestas resueltas y no
  realizan transporte ni deciden mensajes visuales.
- `src/utils/certificadosImpresion/impresion.js` concentra la resolución de URLs
  absolutas para activos del backend. `printingService.js` conserva la
  reexportación `resolveAssetUrl` para no romper su contrato público.
- `CertificadosAdmin.jsx` conserva por ahora estado, efectos, llamadas HTTP y
  presentación, pero deja de definir las transformaciones extraídas. Pasó de
  1128 a 926 líneas sin cambios de textos, rutas ni diseño.

### Pruebas agregadas o ampliadas

- `src/utils/certificadosImpresion/certificados.test.js` protege variantes de
  documento, notas y ceros pendientes, umbrales de desempeño, filtros,
  inmutabilidad de respuestas, consolidación por periodo, materias, asistencia,
  boletines parciales y resumen final por curso.
- `src/utils/certificadosImpresion/impresion.test.js` protege URLs vacías,
  absolutas y relativas con o sin barra inicial.
- Las caracterizaciones de la capa 0 continúan protegiendo los tres impresos y
  el wrapper compartido después de la extracción.

### Verificación

- `pnpm exec vitest run src/utils/certificadosImpresion/certificados.test.js
  src/utils/certificadosImpresion/impresion.test.js
  src/pages/CertificadosAdmin.test.jsx
  src/components/impresion/DocumentoImprimible.test.jsx`: 4 archivos y 14
  pruebas correctas.
- ESLint específico de la página, servicio, utilidades y pruebas modificadas:
  correcto.
- `git diff --check`: correcto.
- Escaneo de las utilidades: sin React, HTTP, DOM ni almacenamiento.

### Decisiones

- Se conservaron nombres, precedencias, fallbacks y estructuras de salida para
  reducir el riesgo de reinterpretar contratos académicos.
- La fecha localizada permanece en la página y se entrega como dato a la
  transformación pura; no se ocultó acceso al reloj dentro de las utilidades.
- La resolución de activos se movió fuera del servicio, pero se reexporta desde
  su ubicación anterior por compatibilidad.
- No se extrajeron llamadas HTTP ni estado React en esta capa.

### Riesgos abiertos

- Resuelto en capa 2: `CertificadosAdmin.jsx` importaba `utils/api.js` y
  coordinaba rutas del backend.
- Resuelto en capa 2: se comprobaron las firmas de catálogos, boletines y
  asistencias antes de reutilizar servicios de otros dominios.
- Resuelto en capa 2: `printingService.js` no contaba con pruebas propias de
  contrato HTTP.

## Resultado de la capa 2

### Servicios consolidados

- `src/services/certificadosImpresionApi.js` es el límite de transporte que
  consume la página de certificados.
- Los contratos idénticos se reutilizan mediante alias: cursos, estudiantes y
  generación administrativa desde `boletinesApi.js`, e historial desde
  `asistenciaApi.js`.
- La única llamada nueva encapsulada es `listarMateriasCertificados`, porque el
  servicio académico existente siempre envía `params.estado` y el contrato
  observado de certificados usa `GET /materias` sin opciones.
- `CertificadosAdmin.jsx` ya no importa `utils/api.js`, no contiene rutas del
  backend y recibe datos desempaquetados por los servicios.
- Las utilidades puras dejaron de conocer la forma `{ data }` de Axios: reciben
  boletines y valores de dominio, manteniendo transporte y transformación en
  capas distintas.
- `printingService.js` permanece como límite HTTP de branding, logos y
  plantillas, con normalización de activos delegada a utilidades.

### Pruebas agregadas o actualizadas

- `src/services/certificadosImpresionApi.test.js` protege las consultas base,
  generación de boletines, historial, señal de cancelación, datos devueltos y
  propagación de errores.
- `src/services/printingService.test.js` protege branding, normalización de
  logos, multipart, slots, filtros, plantilla activa y todos los comandos con
  sus payloads actuales.
- `src/pages/CertificadosAdmin.test.jsx` ahora simula el servicio del módulo en
  lugar de Axios y conserva las mismas caracterizaciones visibles.
- Las pruebas existentes de `boletinesApi.js` y `asistenciaApi.js` se ejecutan
  junto a las del módulo para proteger los contratos reutilizados.

### Verificación

- `pnpm exec vitest run` sobre servicios propios y reutilizados, utilidades,
  página y wrapper: 8 archivos y 30 pruebas correctas.
- ESLint específico de todos los archivos del módulo modificados en las capas
  0 a 2: correcto.
- Escaneo de páginas, componentes y hooks del alcance: sin imports de
  `utils/api.js` ni llamadas HTTP directas.
- `git diff --check`: correcto.

### Decisiones

- Se prefirió reutilizar servicios con uso real en otros dominios antes que
  duplicar las mismas rutas en un servicio nuevo.
- No se reutilizó `materiasApi.listarMaterias` porque añadiría silenciosamente
  `{ params: { estado: undefined } }` a una llamada que antes no enviaba
  configuración.
- El façade del módulo conserva nombres propios de certificados sin cambiar las
  funciones compartidas ni sus consumidores actuales.
- Los servicios devuelven `data` o propagan el error original; los mensajes y
  degradaciones continúan en la página hasta las capas de hooks.
- No se movieron estados, efectos, reintentos ni presentación en esta capa.

### Riesgos abiertos

- Resuelto en capa 3: `CertificadosAdmin.jsx` coordinaba carga inicial,
  consultas disparadas por el usuario y descarte parcial de errores.
- Resuelto en capa 3: las consultas de la página no usaban señales de
  cancelación ni protección ante respuestas antiguas.
- Resuelto en capa 3: `usePrintConfig` carecía de pruebas unitarias propias.
- Los comandos administrativos de branding y plantillas permanecen dentro de
  componentes y no se moverán hasta la capa 4.

## Resultado de la capa 3

### Hooks extraídos

- `useConsultasCertificadosAdmin` concentra la carga paralela de cursos,
  estudiantes y materias; filtros por curso, estado y búsqueda; criterios de
  periodo, materia y año; generación de certificados; reportes parciales;
  estados de carga, progreso, error y documentos resultantes.
- La carga inicial usa una señal compartida y se aborta al desmontar.
- Cada generación remota reemplaza y aborta la consulta anterior. Las
  respuestas antiguas o resueltas después del desmontaje no publican estado.
- Boletines e historiales de asistencia reciben la misma señal de la generación
  vigente. Los fallos no cancelados de asistencia conservan la degradación
  previa a una lista vacía.
- El certificado de matrícula sigue siendo local y conserva los datos ya
  cargados, año, textos y desplazamiento existentes.
- `CertificadosAdmin.jsx` conserva únicamente la pestaña de composición y el
  JSX pendiente de extraer. Pasó de 1128 líneas en la base a 724 líneas.

### Configuración compartida de impresión

- La implementación de `usePrintConfig` se movió a
  `src/hooks/certificadosImpresion/usePrintConfig.js`.
- La reexportación histórica `src/hooks/usePrintConfig.js` se retiró después
  del cierre, cuando una auditoría confirmó que no tenía consumidores activos.
- Se conservan caché de branding por sesión, caché de plantilla por tipo,
  deduplicación de promesas concurrentes, reintento después de error e
  invalidación global.
- Los componentes propios del módulo importan ya la ubicación de dominio.

### Pruebas agregadas o actualizadas

- `useConsultasCertificadosAdmin.test.js` protege carga con señales, filtros,
  cuatro periodos, construcción de reportes, asistencia, cancelación de una
  generación anterior y aborto de carga o generación al desmontar.
- `usePrintConfig.test.js` protege deduplicación concurrente, caché compartida,
  separación por tipo, invalidación, reintento, cambio de tipo y descarte tras
  desmontaje.
- Las caracterizaciones de página y wrapper continúan pasando con los hooks
  reales y los servicios simulados.

### Verificación

- `pnpm exec vitest run` sobre hooks, página, wrapper, servicios propios y
  reutilizados y utilidades: 10 archivos y 42 pruebas correctas.
- ESLint específico de todos los archivos modificados en las capas 0 a 3:
  correcto.
- `git diff --check`: correcto.
- Escaneo de la página: sin efectos, consultas remotas, `AbortController` ni
  coordinación de `window.scrollTo`.
- Escaneo de hooks: una sola implementación real de `usePrintConfig`.

### Decisiones

- La generación de certificados y reportes se considera consulta remota porque
  no muta datos del backend; por eso se cerró en la capa 3.
- `tabActiva` permanece en la página por ser estado local de composición, no de
  dominio ni de consulta.
- Los servicios siguen propagando errores sin mensajes; el hook conserva los
  mensajes existentes que consume la interfaz.
- Todos los consumidores de `usePrintConfig` importan directamente la
  implementación de dominio.
- No se movieron comandos de branding o plantillas ni se extrajo presentación.

### Riesgos abiertos

- Resuelto en capa 4: `IdentidadInstitucional.jsx` combinaba estado editable,
  carga y comandos de guardado, logos e invalidación de caché.
- Resuelto en capa 4: `PlantillasAdmin.jsx` combinaba consulta, selección y
  comandos de activación, duplicación, eliminación y actualización.
- `useConsultasCertificadosAdmin` coordina varios flujos de lectura; las capas
  de presentación y composición deben consumir su contrato sin volver a
  introducir lógica de dominio en JSX.
- La caché de impresión sigue siendo global y su invalidación limpia todos los
  tipos, comportamiento que debe conservar la capa de comandos.

## Resultado de la capa 4

### Hooks de comandos extraídos

- `useIdentidadInstitucional` concentra carga inicial, estado editable,
  normalización de Código DANE, guardado de branding, subida y eliminación de
  logos, estados de progreso, mensajes e invalidación de caché.
- La normalización pura de Código DANE quedó en
  `utils/certificadosImpresion/impresion.js`: elimina caracteres no numéricos y
  conserva el límite actual de 20 dígitos.
- `usePlantillasAdmin` concentra tipo activo, listado, selección, configuración
  editable, recarga y comandos de activación, duplicación, eliminación y
  actualización.
- Las recargas de plantillas descartan respuestas anteriores cuando cambia el
  tipo de documento.
- Se conservaron `prompt` y `confirm` con sus textos exactos. Duplicar no
  invalida la caché; activar, eliminar y guardar configuración sí lo hacen,
  conforme al comportamiento previo.
- No se añadió un flujo de creación de plantillas porque la interfaz actual no
  lo expone.

### Componentes después de la extracción

- `IdentidadInstitucional.jsx` conserva referencias a inputs de archivo y la
  limpieza del valor DOM después de subir; recibe el resto del contrato desde
  el hook.
- `PlantillasAdmin.jsx` y su editor dejaron de mantener estado React propio. El
  editor recibe configuración y callbacks controlados por props.
- Ninguno de los dos componentes importa servicios o invalida caché
  directamente.

### Pruebas agregadas

- Las caracterizaciones de `IdentidadInstitucional` protegen edición, payload,
  normalización, subida, eliminación, confirmación y mensajes visibles.
- Las caracterizaciones de `PlantillasAdmin` protegen activación, duplicación,
  eliminación, edición y payload de configuración.
- `useIdentidadInstitucional.test.js` protege éxito, detalle de error,
  guardado, logos, cancelación e invalidación.
- `usePlantillasAdmin.test.js` protege carga por tipo, configuración controlada,
  todos los comandos, mensajes, detalles de error, confirmaciones, recarga y
  descarte de respuestas antiguas.

### Verificación

- `pnpm exec vitest run` sobre hooks, componentes administrativos, página,
  wrapper, servicios y utilidades: 14 archivos y 55 pruebas correctas.
- ESLint específico de todos los archivos modificados en las capas 0 a 4:
  correcto.
- `git diff --check`: correcto.
- Escaneo de los componentes administrativos: sin imports de servicios,
  invalidación directa, `useState` ni `useEffect`.
- Escaneo de comandos: una sola implementación, ubicada en los hooks del
  dominio.

### Decisiones

- Los hooks de comandos conservan los mensajes actuales porque coordinan la
  recuperación y el resultado que presenta la interfaz.
- Las referencias y eventos de inputs de archivo permanecen en presentación;
  el hook recibe un `File`, no un evento DOM.
- La configuración de plantilla pasó a ser controlada por el hook para evitar
  duplicar borradores entre editor y comando de guardado.
- No se extrajo ni rediseñó JSX en esta capa.

### Riesgos abiertos

- `CertificadosAdmin.jsx` todavía contiene filtros, tabla y tres impresos
  extensos; corresponde separarlos en componentes presentacionales en la capa
  5.
- Identidad y plantillas aún contienen subcomponentes visuales internos que
  deben delimitarse por props sin trasladarles estado de dominio.
- `DocumentoImprimible` es infraestructura compartida por varios dominios; sus
  contratos y estilos no deben especializarse para certificados durante la
  extracción visual.

## Resultado de la capa 5

### Componentes presentacionales extraídos

- `SeleccionCertificados` concentra encabezado, pestañas, errores, filtros,
  selección de periodo y materia, acción por curso, tabla de estudiantes y sus
  estados de carga o lista vacía. Recibe todos los datos y comandos por props.
- `CertificadoNotasPreview`, `CertificadoMatriculaPreview` y
  `ReporteParcialPreview` contienen las tres vistas imprimibles, conservando
  textos, cálculos visibles, estructura de tablas, firmas, clase A4 y contrato
  de `DocumentoImprimible`.
- `DatoCertificado` delimita el bloque visual repetido de etiqueta y valor sin
  introducir estado ni reglas de dominio.
- `IdentidadInstitucionalView` y `PlantillasAdminView` contienen los formularios
  y subcomponentes visuales administrativos como vistas controladas. Las
  referencias y limpieza del input de archivo permanecen en presentación.
- `CertificadosAdmin.jsx` quedó como raíz de composición de 68 líneas: mantiene
  solo la pestaña local, consume el hook de consultas y selecciona la vista que
  corresponde al documento generado.
- Los componentes históricos `IdentidadInstitucional.jsx` y
  `PlantillasAdmin.jsx` quedaron temporalmente como adaptadores mínimos entre
  sus hooks y las vistas. Su consolidación en la raíz de página corresponde a
  la capa 6.

### Pruebas agregadas o conservadas

- `SeleccionCertificados.test.jsx` protege filtros, cambio de pestaña, acciones
  individual y por curso, carga, error y lista vacía mediante su contrato de
  props.
- `VistasImprimibles.test.jsx` protege los títulos, subtítulos, contenido vacío,
  datos de matrícula y comando para volver de las tres vistas extraídas.
- Las pruebas de `IdentidadInstitucionalView` y `PlantillasAdminView` protegen
  eventos de edición, carga de logo, guardado, selección de tipo y comandos
  controlados.
- Las caracterizaciones de página, componentes administrativos y wrapper
  imprimible continúan pasando después de la extracción.

### Verificación

- `pnpm exec vitest run` sobre las unidades propias y los servicios compartidos
  reutilizados por el módulo: 18 archivos y 62 pruebas correctas.
- ESLint específico de todos los archivos modificados en las capas 0 a 5:
  correcto.
- `git diff --check`: correcto.
- Escaneo estructural: filtros, tablas, impresos y subcomponentes visuales
  existen una sola vez dentro de `src/components/certificadosImpresion/`; la
  página de certificados no contiene ya esas implementaciones.

### Decisiones

- Las vistas se mantuvieron controladas por props; no se duplicó estado de
  consultas, comandos ni configuración dentro de presentación.
- Los componentes internos con uso exclusivo de una vista permanecen locales a
  ella. No se crearon abstracciones compartidas sin un segundo consumidor real.
- `DocumentoImprimible` conserva su ubicación y contrato compartidos porque
  sigue siendo infraestructura usada por varios dominios.
- Los adaptadores administrativos no se eliminaron en esta capa para no mezclar
  extracción visual con la consolidación de raíces de composición.

### Riesgos abiertos

- `BrandingAdmin.jsx` todavía compone dos adaptadores que a su vez invocan los
  hooks. La capa 6 debe convertir la página en la raíz explícita de composición
  sin duplicar cargas ni comandos.
- Las vistas imprimibles siguen dependiendo de dimensiones y reglas de
  `print.css`; la verificación final debe conservar que la hoja en pantalla
  coincida con la impresa, el scroll horizontal móvil y ambos comandos de
  impresión.
- La infraestructura de impresión continúa teniendo consumidores externos al
  módulo; el cierre debe revisar duplicados sin mover ni especializar ese
  contrato compartido.

## Resultado de la capa 6

### Páginas consolidadas

- `BrandingAdmin.jsx` es ahora la raíz explícita de composición para identidad
  institucional y plantillas: conecta los hooks del dominio con sus vistas
  controladas y conserva encabezado, textos, pestañas y clases existentes.
- Dos conectores internos pequeños mantienen el montaje condicional previo. El
  hook de plantillas no consulta mientras la pestaña de identidad está activa,
  y cada sección conserva su ciclo de montaje al cambiar de pestaña.
- `CertificadosAdmin.jsx` se confirmó como raíz de composición: conecta
  `useConsultasCertificadosAdmin` con selección y vistas imprimibles, conserva
  solo el estado superior de pestaña y no contiene transporte ni bloques
  visuales extensos.
- Se retiraron `src/components/admin/IdentidadInstitucional.jsx` y
  `src/components/admin/PlantillasAdmin.jsx` porque no tenían otros
  consumidores después de consolidar la página. Sus implementaciones y pruebas
  no quedaron duplicadas.

### Protección de composición

- `src/pages/BrandingAdmin.test.jsx` caracteriza la pestaña inicial, la carga
  diferida de plantillas, el desmontaje visual al cambiar de sección y la
  conexión completa de edición institucional, logos, comandos y configuración
  de plantillas.
- Las pruebas antiguas de los adaptadores fueron sustituidas por la prueba de
  página. Los hooks y las vistas conservan además sus pruebas unitarias junto a
  cada unidad.
- La caracterización se ejecutó antes y después de la consolidación: antes, 7
  archivos y 17 pruebas; después, 5 archivos y 13 pruebas focalizadas.

### Verificación

- `pnpm exec vitest run` sobre las unidades propias y los servicios compartidos
  reutilizados por el módulo: 17 archivos y 61 pruebas correctas.
- ESLint específico de todos los archivos modificados en las capas 0 a 6:
  correcto.
- `git diff --check`: correcto.
- Escaneo de composición: los hooks de consultas y comandos se consumen solo
  desde `CertificadosAdmin.jsx` y `BrandingAdmin.jsx`; las vistas no contienen
  endpoints, Axios, `fetch` ni imports de `utils/api.js`.
- Escaneo de duplicados: no quedan imports, consumidores ni definiciones de los
  adaptadores administrativos retirados. Las rutas continúan apuntando a las
  mismas dos páginas bajo `AdminRoute`.

### Decisiones

- Se conservaron conectores internos en la página en lugar de invocar ambos
  hooks incondicionalmente; esto evita adelantar la consulta de plantillas y
  preserva el comportamiento de montaje por pestaña.
- La página conecta contratos completos mediante props explícitas. No se creó
  un hook combinado porque identidad y plantillas son estados independientes y
  no tienen una coordinación de dominio compartida.
- Las pruebas integradas migraron a la raíz real de composición; no se
  conservaron archivos históricos solo para sostener imports de pruebas.
- No se cambiaron rutas, permisos, payloads, textos, diseño ni estilos de
  impresión en esta capa.

### Riesgos abiertos

- La capa 7 debe ejecutar la verificación global para detectar regresiones en
  los consumidores externos de `DocumentoImprimible`, `printingService` y
  `usePrintConfig`.
- La revisión manual final debe cubrir A4, scroll móvil, branding, firmas y los
  dos comandos que invocan la impresión del navegador.
- El árbol seguirá con cambios acumulados hasta que el usuario cree el único
  commit del módulo; no debe mezclarse otro dominio antes del cierre.

## Resultado de la capa 7

### Documentación sincronizada

- `docs/ARQUITECTURA_FRONTEND.md` registra carpetas, responsabilidades,
  servicios compartidos, rutas y páginas de composición del módulo.
- `docs/COMPONENTES.md` reemplaza las referencias a adaptadores eliminados por
  las vistas, hooks, servicios, utilidades y raíces vigentes.
- `docs/CAMBIOS_FRONTEND.md` registra el cierre, alcance y cifras finales de
  verificación.
- `docs/modularizacion/README.md` marca el módulo como terminado y publicado.

### Verificación final

- Suite específica: 17 archivos y 61 pruebas correctas.
- `pnpm run check:deploy`: correcto; 126 archivos y 440 pruebas globales,
  ESLint correcto y build de producción con 252 módulos transformados.
- `git diff --check`: correcto.
- Rutas `/admin/certificados` y `/admin/diseno-impresos` conservadas bajo
  `AdminRoute`.
- Auditoría de alcance: el diff pertenece únicamente a certificados,
  infraestructura compartida de impresión usada por el módulo y documentación
  autorizada.
- Auditoría de duplicados: no quedan adaptadores administrativos, llamadas HTTP
  en páginas o vistas, ni una segunda implementación de `usePrintConfig`.

### Decisiones de cierre

- `printingService.js`, `DocumentoImprimible.jsx`, `styles/print.css` y la
  implementación de dominio de `usePrintConfig` permanecen compartidos porque
  tienen consumidores reales en varios dominios.
- No se movieron esos contratos a una carpeta exclusiva del módulo ni se
  modificaron sus consumidores externos.
- El cierre quedó publicado en `d730cf1`; el ajuste posterior de reporte parcial
  quedó publicado en `63526ed`.

### Verificación manual recomendada en producción

1. Iniciar sesión como administrador y abrir `/admin/certificados`; confirmar
   carga de cursos y estudiantes, filtros, búsqueda y las tres pestañas.
2. Generar un certificado de notas de un periodo y otro de todos los periodos;
   comprobar materias, docentes, notas, promedio y desempeño.
3. Generar un certificado de matrícula y confirmar estudiante, documento,
   curso, jornada, estado y año lectivo sin consultas académicas adicionales.
4. Generar reportes parciales individual y por curso, filtrando periodo y
   materia; revisar inasistencias, estados y registros omitidos.
5. En escritorio y móvil, comprobar formato A4, scroll horizontal, botón
   `Atrás`, firmas, encabezado y pie. Probar `Descargar PDF` e `Imprimir`.
6. Abrir `/admin/diseno-impresos`; editar y guardar datos institucionales,
   subir/eliminar ambos logos y comprobar mensajes y persistencia.
7. Abrir la pestaña de plantillas; cambiar tipo, activar, duplicar, eliminar una
   personalizada y guardar configuración. Confirmar que los impresos reflejan
   branding y plantilla sin recargar datos duplicados.
8. Revisar al menos un boletín u otro impreso consumidor para confirmar que la
   configuración compartida sigue aplicándose.

### Commit sugerido

`refactor(certificados): modularizar certificados e impresion`

## Ajuste funcional posterior al cierre: reporte parcial en tiempo real

- Después del commit de modularización, el reporte académico parcial se separó
  del contrato del certificado oficial.
- `GET /boletines/admin/reporte-parcial/{estudiante_id}/{periodo}` lee la
  planilla vigente desde `notas_detalle`, conserva la descripción de cada nota
  y recalcula el promedio actual aunque exista un boletín enviado previamente.
- El certificado de notas conserva `/boletines/admin/generar` y no fue alterado
  por este ajuste.
- Verificación frontend: 17 archivos y 62 pruebas específicas; `check:deploy`
  correcto con 126 archivos, 441 pruebas, ESLint y build de 252 módulos.
- Verificación backend: 3 pruebas nuevas y Ruff correctos. La suite completa
  fuera del sandbox obtuvo 189 pruebas correctas y mantuvo 3 fallos
  preexistentes de Super Admin por fechas fijas ya vencidas, ajenos a
  boletines.

## Entrega para el siguiente chat

- Última capa terminada: Capa 7, cierre. Módulo completo.
- Verificación más reciente: 17 archivos y 61 pruebas específicas; 126 archivos
  y 440 pruebas globales; ESLint, build y `git diff --check` correctos.
- Archivos pendientes: ninguno de implementación o documentación. La
  verificación de producción se conserva como seguimiento operativo si todavía
  no fue registrada.
- Riesgos residuales: validación visual dependiente del diálogo nativo de
  impresión y de dispositivos móviles reales.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual de producción como seguimiento operativo.
