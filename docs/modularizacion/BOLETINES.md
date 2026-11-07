# Modularización: Boletines

## Control

- Estado: Terminado y publicado en `main`.
- Orden: 4.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: `18ce82a94b3ab2a69574b30d4195b0a3624b4ccc`.
- Commit final: `60edcb5`.
- Última actualización: 2026-08-02.

## Objetivo

Separar generación, ingreso docente, orden de materias y presentación de
boletines sin cambiar cálculos, textos guardados ni formato imprimible.

## Alcance confirmado en capa 0

### Flujos activos

1. Generación administrativa:
   `src/pages/Boletin.jsx`, ruta `/boletin`, protegida por
   `AdminRoute`.
2. Ingreso docente:
   `src/pages/IngresoBoletinProfesor.jsx`, ruta
   `/ingreso-boletin`, protegida por `ProtectedRoute` y enlazada como
   `Boletín Final` en la navegación docente.
3. Orden de materias:
   `src/pages/OrdenBoletin.jsx`, compuesto dentro de la ruta `/admin` en
   la pestaña `orden-boletin`.
4. Impresión del boletín:
   `BoletinImprimible.jsx` usa el contrato compartido de
   `src/components/impresion/DocumentoImprimible.jsx`,
   `src/services/printingService.js` y
   `src/styles/print.css`. Estas unidades compartidas se inventariaron, pero no
   se modificaron.

### Legado retirado en capa 6

- `src/components/boletin/Header.jsx`, `Materia.jsx` y `TablaNotas.jsx` se
  eliminaron después de confirmar nuevamente que ninguna raíz activa los
  consumía y que solo existía la referencia interna `Materia` → `TablaNotas`.
- Sus contratos visuales y de datos eran distintos al impreso activo basado en
  `DocumentoImprimible`; no se conservó una implementación duplicada.

### Exclusiones corregidas

- `src/pages/Formulario.jsx` corresponde al `Observador del estudiante` y a la
  ruta `/Formulario`; no pertenece a boletines.
- `src/constants/valoracionesDesarrollo.js` es consumido por Planilla y
  `PlanillaRow`; no se moverá ni modificará desde este módulo.
- `src/pages/CertificadosAdmin.jsx` consume también
  `/boletines/admin/generar/{estudianteId}/{periodo}`. Está fuera del alcance,
  pero obliga a conservar exactamente ese contrato del backend.

## Contratos inventariados

### Transporte HTTP

| Flujo | Método y ruta | Contrato observado |
|---|---|---|
| Generación | `GET /cursos` | Lista de cursos. |
| Generación | `GET /estudiantes` | Lista de estudiantes con `curso_id` e identificadores alternativos de documento. |
| Generación | `GET /boletines/admin/generar/{estudianteId}/{periodo}` | Boletín consolidado; el mismo endpoint es consumido por Certificados. |
| Ingreso docente | `GET /mis-clases/{profesorId}` | Asignaciones del profesor. |
| Ingreso docente | `GET /boletines/referencia/{asignacionId}/{periodo}` | Estudiantes, notas, observaciones y valoraciones de referencia. |
| Ingreso docente | `POST /boletines/guardar` | Un payload por estudiante; `Guardar todo` repite el mismo POST secuencialmente. |
| Orden | `GET /cursos` | Lista de cursos; el primero se selecciona por defecto. |
| Orden | `GET /cursos/{cursoId}/orden-boletin` | Objeto con `items`. |
| Orden | `PUT /cursos/{cursoId}/orden-boletin` | `{ materias: [{ materia_id }] }` en el orden visible. |
| Impresión compartida | `GET /branding` | Identidad institucional usada por `DocumentoImprimible`. |
| Impresión compartida | `GET /plantillas/activa/boletin` | Configuración de la plantilla activa del boletín. |

### Almacenamiento local

- `profesor`: JSON del que se lee `id` para cargar clases y formar la clave de
  periodo del profesor.
- `asignacionId`: se lee al iniciar ingreso docente y se actualiza al cargar
  alumnos.
- `periodo`: respaldo global administrado por `periodoProfesor.js`.
- `periodo_profesor_{profesorId}`: periodo preferido por profesor.

### Transformaciones y payloads que deben conservarse

- La búsqueda administrativa acepta nombre, apellido y los alias de documento
  `documento_identidad`, `documento`, `identificacion` y `cedula`.
- Las filas repetidas de una materia en el boletín generado se consolidan por
  `materia_id` y acumulan sus detalles.
- El promedio general excluye materias con `definitiva === null`; la escala
  numérica y los umbrales de desempeño existentes no se reinterpretan.
- Desarrollo infantil conserva valores `destacado`, `logrado`, `proceso` y
  `apoyo`, sus emojis y el texto visible `Requiere acompañamiento`.
- La observación general del impreso es editable solo en pantalla y no se
  guarda en base de datos.
- Ingreso docente elimina de la vista y del payload la referencia técnica
  `mas_alto`.
- Las clases docentes se deduplican por curso y materia, prefiriendo la
  asignación actualmente seleccionada.
- La definitiva se calcula solo con notas numéricas; para desarrollo,
  `definitiva` y `nota` se envían como `null` y se conserva `valoracion`.
- `Aplicar logros a todos` relaciona campos por referencia y tipo de
  evaluación, con respaldo por índice. El modo `Solo campos vacíos` conserva
  observaciones individuales; `Sobrescribir todos` mantiene el comportamiento
  explícito actual.
- `Guardar todo` conserva las modificaciones individuales y envía un POST por
  estudiante en orden secuencial.
- El orden inicial usa `orden_boletin`, con respaldo `100` y desempate
  alfabético. El guardado transmite únicamente `materia_id` en el orden
  visible.

## Invariantes

- Rutas, protecciones y etiquetas de navegación actuales.
- Formato A4 de `210mm` y desplazamiento horizontal móvil mediante
  `di-documento--boletin` y `di-print-root--scroll-mobile`.
- Orden configurable de materias por curso.
- Ingreso de observaciones y logros por estudiante.
- `Aplicar logros a todos` y `Guardar todo`.
- Preservación de observaciones individuales en el modo de copia a campos
  vacíos.
- Ocultamiento de campos técnicos como `mas_alto`.
- Etiquetas humanas con `translate="no"` en ingreso docente y orden.
- Contratos y payloads del backend descritos en este documento.

## Protección agregada en capa 0

- `src/pages/Boletin.test.jsx` protege búsqueda por alias de
  documento, endpoint de generación, consolidación por materia, valoraciones
  de desarrollo y contrato con `DocumentoImprimible`.
- `src/pages/IngresoBoletinProfesor.test.jsx` protege ocultamiento
  de `mas_alto`, etiquetas no traducibles, copia solo a campos vacíos,
  preservación de casos individuales y payloads de `Guardar todo`.
- `src/pages/OrdenBoletin.test.jsx` protege orden inicial, movimiento,
  etiquetas no traducibles y payload del `PUT`.

## Implementación de capa 1

- `src/utils/boletines/generacionBoletin.js` concentra las constantes propias
  del impreso, alias de documento, filtrado, promedio, desempeño, formato por
  periodo, detección de desarrollo y consolidación de materias.
- `src/utils/boletines/ingresoBoletin.js` concentra las valoraciones propias del
  ingreso docente, normalización de notas visibles, deduplicación de clases,
  estados iniciales, copia masiva inmutable y construcción del payload por
  estudiante.
- `src/utils/boletines/ordenBoletin.js` concentra orden inicial, movimientos,
  orden alfabético y construcción del payload de orden.
- Cada utilidad tiene su prueba unitaria adyacente. Los tres componentes
  activos consumen estas unidades y dejaron de duplicar las transformaciones.
- HTTP, estado, efectos, almacenamiento y decisiones visuales permanecen en
  los componentes; moverlos corresponde a capas posteriores.

## Implementación de capa 2

- `src/services/boletinesApi.js` centraliza los ocho contratos HTTP activos:
  cursos, estudiantes, generación administrativa, clases del profesor,
  referencia docente, guardado por estudiante, consulta del orden y guardado
  del orden.
- El servicio devuelve `data` y propaga los errores originales sin elegir
  alertas ni mensajes visuales.
- Las consultas aceptan señales opcionales de cancelación. Sin señal conservan
  exactamente las llamadas existentes, sin agregar objetos de opciones.
- `Boletin.jsx`, `IngresoBoletinProfesor.jsx` y `OrdenBoletin.jsx` dejaron de
  importar `utils/api.js`; mantienen localmente estado, efectos, secuencias y
  manejo visual de errores.
- La impresión conserva `printingService.js`; no se duplicaron sus endpoints
  compartidos dentro del servicio de boletines.

## Implementación de capa 3

- `useConsultaBoletinesAdministrativos.js` administra carga de cursos y
  estudiantes, filtros por curso y búsqueda, periodo, generación consultada y
  retorno al listado.
- `useConsultaIngresoBoletinProfesor.js` administra clases, asignación, periodo,
  referencia de estudiantes, estados iniciales y sincronización existente con
  `localStorage`.
- `useConsultaOrdenBoletin.js` administra cursos, selección inicial, consulta y
  normalización del orden y mensajes de error de carga.
- Los tres hooks cancelan consultas al desmontarse o cambiar su selección. La
  generación administrativa también descarta una respuesta anterior cuando se
  solicita otro estudiante.
- Los componentes dejaron de contener efectos y llamadas de consulta. Conservan
  alertas y todos los comandos: edición, copia masiva, guardados, movimientos y
  persistencia del orden.
- Los hooks de ingreso y orden exponen temporalmente setters del estado cargado
  para que los comandos existentes sigan funcionando. Esos setters se
  encapsularán en la capa 4, no mediante una abstracción compartida.

## Implementación de capa 4

- `useComandosIngresoBoletinProfesor.js` administra estado editable,
  modificación de observaciones, estados visuales por estudiante, copia masiva,
  guardado individual, `Guardar todo`, confirmaciones y progreso del grupo.
- `useComandosOrdenBoletin.js` administra la copia editable del orden,
  movimientos, posición directa, orden alfabético, persistencia y mensajes del
  comando.
- Ambos hooks resincronizan su estado editable cuando cambia el resultado de su
  hook de consulta, sin mutar los datos consultados.
- Los hooks de consulta de ingreso y orden dejaron de exponer setters de estado
  usados por comandos; ahora entregan únicamente datos iniciales o consultados.
- `IngresoBoletinProfesor.jsx` y `OrdenBoletin.jsx` dejaron de importar
  SweetAlert, servicios de escritura y transformaciones de comandos. Conservan
  únicamente composición y presentación.
- La generación administrativa no requirió hook de comandos: generar un boletín
  es una consulta protegida por el hook de capa 3 y no modifica datos remotos.

## Implementación de capa 5

- `SeleccionBoletinAdministrativo.jsx` presenta los filtros, estados de carga,
  tabla de estudiantes y acción de generación administrativa.
- `BoletinImprimible.jsx` presenta el documento A4, escalas, promedio, materias,
  valoraciones y observación general editable, conservando el contrato con
  `DocumentoImprimible` y las clases de impresión existentes.
- `VistaIngresoBoletinProfesor.jsx` presenta los controles de clase y periodo,
  acciones del grupo, tarjetas de estudiantes, estados visuales y campos de
  observación.
- `VistaOrdenBoletin.jsx` presenta la selección del curso, mensajes, controles
  y lista reordenable de materias.
- Las cuatro vistas reciben datos y callbacks por props. No importan hooks,
  servicios, endpoints, estado ni efectos.
- `Boletin.jsx`, `IngresoBoletinProfesor.jsx` y `OrdenBoletin.jsx` quedaron como
  conectores entre hooks y vistas; se conservan en sus ubicaciones actuales para
  no modificar rutas ni composición antes de la capa 6.
- `Header.jsx`, `Materia.jsx` y `TablaNotas.jsx` no se reutilizaron: sus
  contratos visuales y de datos no corresponden al impreso activo basado en
  `DocumentoImprimible`. Siguen sin consumidores activos y se conservan hasta
  consolidar la composición.

## Implementación de capa 6

- `src/pages/Boletin.jsx`, `IngresoBoletinProfesor.jsx` y `OrdenBoletin.jsx`
  son ahora las raíces de composición de los tres flujos. Cada página conecta
  exclusivamente hooks de dominio con vistas presentacionales.
- `App.jsx` carga las páginas de generación e ingreso mediante los mismos
  `lazy`, conserva `/boletin` con `AdminRoute` y `/ingreso-boletin` con
  `ProtectedRoute`.
- `Admin.jsx` carga `OrdenBoletin` desde `pages` y conserva la pestaña
  `orden-boletin` dentro de `/admin`.
- Las pruebas integradas de las tres raíces se trasladaron junto con sus
  páginas y conservaron los mismos escenarios y contratos.
- Se retiraron los tres conectores anteriores de `components` y los archivos
  legacy `Header.jsx`, `Materia.jsx` y `TablaNotas.jsx` después de confirmar que
  no tenían consumidores activos.

## Cierre de capa 7

- Se sincronizaron `docs/ARQUITECTURA_FRONTEND.md`, `docs/COMPONENTES.md`,
  `docs/CAMBIOS_FRONTEND.md`, el plan maestro y este documento.
- La verificación global confirmó pruebas, lint, entorno de build y bundle de
  producción sin errores.
- El diff completo fue auditado. Los únicos cambios fuera de carpetas propias
  de boletines son los imports de composición en `App.jsx` y `Admin.jsx`, la
  protección correspondiente en `Admin.test.jsx` y la documentación global.
- No quedan transporte HTTP fuera de `boletinesApi.js`, raíces antiguas,
  componentes legacy ni implementaciones duplicadas del módulo.
- La verificación manual previa al commit detectó un render transitorio al
  cambiar entre clases con el mismo estudiante y distinta cantidad de notas.
  `correspondeFormularioAEstudiante` valida que referencias, tipos y cantidad
  de observaciones pertenezcan a la consulta activa antes de mostrar la
  tarjeta. Así se evita mezclar el formulario anterior mientras el hook de
  comandos termina de resincronizarse.
- La regresión quedó protegida tanto en la vista como en el recorrido integrado
  Matemáticas → Ciencias → Matemáticas.

## Verificación de capa 0

- Línea base antes de editar: 77 archivos de prueba y 287 pruebas correctas.
- Pruebas específicas:
  `pnpm test src/components/boletin/Boletin.test.jsx src/components/boletin/IngresoBoletinProfesor.test.jsx src/components/OrdenBoletin.test.jsx`.
- Resultado específico: 3 archivos y 3 pruebas correctas.
- Lint específico de los tres archivos de prueba: correcto.
- `git diff --check`: correcto.
- Alcance del cambio: tres pruebas de boletines y este documento.
- Código productivo modificado en capa 0: ninguno.

## Verificación de capa 1

- Pruebas unitarias de utilidades antes de integrarlas: 3 archivos y 13 pruebas
  correctas.
- Pruebas específicas después de integrar:
  `pnpm test src/utils/boletines/generacionBoletin.test.js src/utils/boletines/ingresoBoletin.test.js src/utils/boletines/ordenBoletin.test.js src/components/boletin/Boletin.test.jsx src/components/boletin/IngresoBoletinProfesor.test.jsx src/components/OrdenBoletin.test.jsx`.
- Resultado integrado: 6 archivos y 16 pruebas correctas.
- Lint específico de componentes, utilidades y pruebas: correcto.
- Límite de capa comprobado: las utilidades no importan React, HTTP, DOM ni
  almacenamiento; las llamadas HTTP continúan en los componentes.

## Verificación de capa 2

- Pruebas del servicio antes de migrar consumidores: 1 archivo y 4 pruebas
  correctas.
- Contrato de cancelación agregado y verificado: 1 archivo y 5 pruebas
  correctas.
- Pruebas específicas integradas:
  `pnpm test src/services/boletinesApi.test.js src/utils/boletines/generacionBoletin.test.js src/utils/boletines/ingresoBoletin.test.js src/utils/boletines/ordenBoletin.test.js src/components/boletin/Boletin.test.jsx src/components/boletin/IngresoBoletinProfesor.test.jsx src/components/OrdenBoletin.test.jsx`.
- Resultado integrado: 7 archivos y 21 pruebas correctas.
- Lint específico de servicio, utilidades, componentes y pruebas: correcto.
- `git diff --check`: correcto.
- Límite confirmado: ninguna importación ni llamada directa a `utils/api.js`
  en los tres componentes activos.

## Verificación de capa 3

- Pruebas de hooks antes de integrarlos: 3 archivos y 8 pruebas correctas.
- Pruebas específicas integradas:
  `pnpm test src/services/boletinesApi.test.js src/utils/boletines/generacionBoletin.test.js src/utils/boletines/ingresoBoletin.test.js src/utils/boletines/ordenBoletin.test.js src/hooks/boletines/useConsultaBoletinesAdministrativos.test.js src/hooks/boletines/useConsultaIngresoBoletinProfesor.test.js src/hooks/boletines/useConsultaOrdenBoletin.test.js src/components/boletin/Boletin.test.jsx src/components/boletin/IngresoBoletinProfesor.test.jsx src/components/OrdenBoletin.test.jsx`.
- Resultado integrado: 10 archivos y 29 pruebas correctas.
- Lint específico de servicio, utilidades, hooks, componentes y pruebas:
  correcto.
- Límite confirmado: no quedan llamadas de consulta en componentes y no hay
  guardados, copia masiva ni reordenamiento dentro de hooks de consulta.

## Verificación de capa 4

- Pruebas de hooks de comandos antes de integrarlos: 2 archivos y 7 pruebas
  correctas.
- Pruebas específicas integradas:
  `pnpm test src/services/boletinesApi.test.js src/utils/boletines/generacionBoletin.test.js src/utils/boletines/ingresoBoletin.test.js src/utils/boletines/ordenBoletin.test.js src/hooks/boletines/useConsultaBoletinesAdministrativos.test.js src/hooks/boletines/useConsultaIngresoBoletinProfesor.test.js src/hooks/boletines/useConsultaOrdenBoletin.test.js src/hooks/boletines/useComandosIngresoBoletinProfesor.test.js src/hooks/boletines/useComandosOrdenBoletin.test.js src/components/boletin/Boletin.test.jsx src/components/boletin/IngresoBoletinProfesor.test.jsx src/components/OrdenBoletin.test.jsx`.
- Resultado integrado: 12 archivos y 36 pruebas correctas.
- Lint específico de servicio, utilidades, hooks, componentes y pruebas:
  correcto.
- Límite confirmado: no quedan implementaciones de comandos en los componentes,
  ni setters de comando expuestos por los hooks de consulta.

## Verificación de capa 5

- Pruebas de vistas antes de integrarlas: 4 archivos y 4 pruebas correctas.
- Pruebas específicas integradas: 16 archivos y 40 pruebas correctas, cubriendo
  servicio, utilidades, hooks de consulta, hooks de comandos, vistas y raíces.
- Lint específico de todas las unidades y pruebas de boletines: correcto.
- `git diff --check`: correcto; solo informa la conversión esperada de LF a
  CRLF del entorno Windows.
- Límite confirmado mediante búsqueda: las cuatro vistas no importan hooks,
  servicios ni API y no contienen `useState` ni `useEffect`.
- El legado no conectado solo mantiene una referencia interna de `Materia.jsx`
  a `TablaNotas.jsx`; ninguna raíz activa lo consume.

## Verificación de capa 6

- Protección previa al traslado: 3 archivos y 3 pruebas de raíces correctas.
- Composición trasladada: 4 archivos y 4 pruebas correctas, incluida la carga
  de `Orden boletín` desde la pestaña administrativa.
- Pruebas específicas integradas: 17 archivos y 41 pruebas correctas.
- Lint específico de `App`, `Admin` y todas las unidades y pruebas de boletines:
  correcto.
- `git diff --check`: correcto; solo informa la conversión esperada de LF a
  CRLF del entorno Windows.
- Límites confirmados: las páginas no importan servicios, API ni utilidades;
  conectan hooks y componentes presentacionales.
- Búsqueda final de capa: no quedan imports de las raíces antiguas, referencias
  a `Header`, `Materia` o `TablaNotas`, ni archivos legacy bajo
  `src/components/boletin`.

## Verificación de capa 7

- Pruebas específicas finales: 17 archivos y 44 pruebas correctas.
- `pnpm run check:deploy`: correcto.
- Suite global: 93 archivos y 330 pruebas correctas.
- ESLint global: correcto.
- Build de producción con Vite: correcto; 225 módulos transformados.
- Validación de entorno de build: `VITE_API_URL` correcta.
- `git diff --check`: correcto; solo informa la conversión esperada de LF a
  CRLF del entorno Windows.
- Auditoría de rutas, guards, imports, endpoints, fronteras, alcance y
  duplicados: correcta.

## Decisiones

- Corregir el inventario antes de extraer: Observador y la constante de
  Planilla quedan fuera de boletines.
- No generalizar todavía las valoraciones de desarrollo. El texto de Planilla
  (`Requiere apoyo`) difiere del texto activo de boletines
  (`Requiere acompañamiento`) y una unificación anticipada cambiaría interfaz.
- Tratar impresión como dependencia compartida ya modularizada; boletines debe
  conservar su contrato, no absorberla ni duplicarla.
- Mantener el endpoint de generación compatible con Certificados aunque ese
  consumidor no se modifique en este módulo.
- Conservar los archivos legacy hasta consolidar composición y comprobar
  consumidores; esa condición se cumplió en la capa 6 y se retiraron.
- Mantener tres utilidades de dominio separadas porque sus contratos son
  distintos; no se creó una abstracción genérica anticipada.
- Mantener las clases y textos visuales dentro de los componentes cuando no
  forman parte de un contrato o transformación de datos.
- No reutilizar `cursosApi.listarCursos`: ese contrato siempre agrega el
  parámetro `estado`, mientras boletines debe conservar `GET /cursos` sin
  opciones. El servicio de boletines comparte una sola función entre sus dos
  consumidores reales.
- Mantener nombres de servicio específicos de boletines para
  `/mis-clases/{profesorId}`; que otros dominios usen la misma ruta no garantiza
  que compartan la misma normalización ni evolución del contrato.
- Separar los tres hooks de consulta porque administración, ingreso docente y
  orden tienen ciclos de carga y estados distintos.
- Mantener la alerta de error de generación en el componente: el hook devuelve
  el error original y no decide textos ni mecanismos visuales.
- Cancelar y descartar respuestas obsoletas sin vaciar anticipadamente los datos
  visibles, conservando la experiencia actual durante recargas.
- Mantener SweetAlert dentro del hook de comandos de ingreso porque las
  confirmaciones y notificaciones son parte de la coordinación imperativa del
  comando; no se trasladó JSX ni se cambiaron textos.
- Mantener dos hooks de comandos separados. Ingreso coordina formularios y
  guardados por estudiante; orden coordina una lista y un único `PUT`.
- Marcar la capa 4 como no necesaria para generación administrativa, ya que no
  existe escritura remota en ese flujo.
- Mantener las vistas en `src/components/boletin` durante esta capa. Mover o
  crear raíces de página corresponde a composición y requiere revisar las rutas
  y la pestaña administrativa en conjunto.
- Extraer cuatro vistas según los flujos reales y mantener subcomponentes de un
  solo consumidor dentro de su archivo; no existe todavía un segundo dominio
  que justifique nuevas abstracciones compartidas.
- No adaptar el legado a la fuerza: reutilizarlo cambiaría el contrato visual y
  duplicaría el modelo del impreso activo.
- Usar páginas separadas para los tres flujos aunque `OrdenBoletin` se componga
  dentro de `Admin`: sigue siendo la raíz de un flujo de dominio y evita que la
  página administrativa absorba sus hooks.
- Actualizar solamente los imports de `App` y `Admin`; rutas, guards, pestañas y
  carga diferida permanecen intactos.

## Riesgos abiertos

- Alterar orden, consolidación o cálculos académicos al extraer utilidades.
- Cambiar accidentalmente números por cadenas en identificadores o periodos de
  los payloads.
- Sobrescribir observaciones individuales durante acciones masivas.
- Cambiar las diferencias visibles entre valoración numérica y desarrollo.
- Romper Certificados al modificar el contrato compartido del endpoint de
  generación.
- Romper formato A4, identidad institucional o desplazamiento móvil al separar
  presentación.
- `Guardar todo` se detiene ante el primer POST fallido y no revierte los
  guardados anteriores; es comportamiento existente y no se corregirá dentro
  de la modularización.
- Los hooks de comandos resincronizan el estado editable al cambiar consulta;
  futuras extracciones presentacionales deben recibir datos y callbacks sin
  duplicar esa sincronización.
- Las pruebas protegen estructura y contratos visibles relevantes, pero la
  fidelidad del salto de página, desplazamiento móvil e impresión A4 requerirá
  verificación manual final con datos reales.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada |
| 1. Utilidades puras | Terminada |
| 2. Servicio HTTP | Terminada |
| 3. Hooks de consulta | Terminada |
| 4. Hooks de comandos | Terminada |
| 5. Presentación | Terminada |
| 6. Composición | Terminada |
| 7. Cierre | Terminada |

## Entrega final

- Capas 0 a 7 terminadas.
- Verificación final: 17 archivos y 44 pruebas específicas; 93 archivos y 330
  pruebas globales; lint y build correctos.
- Commit final publicado: `60edcb5`.
- Mensaje sugerido: `refactor(boletines): modularizar el flujo completo`.

### Verificación manual después del deploy

1. Como administrador, abrir `/boletin`, filtrar por curso, buscar por nombre y
   documento, cambiar el periodo y generar un boletín.
2. Confirmar escalas numéricas y de desarrollo, consolidación de materias,
   promedio, puesto cuando aplique, observaciones y datos institucionales.
3. En escritorio y móvil, comprobar desplazamiento horizontal, botón `Atrás`,
   ancho A4, impresión y guardado como PDF.
4. Como profesor, abrir `/ingreso-boletin`, cambiar clase y periodo, editar y
   guardar un estudiante, aplicar logros solo a campos vacíos y ejecutar
   `Guardar todo` verificando que se conserven excepciones individuales.
5. Como administrador, abrir `/admin` → `Orden boletín`, mover materias con
   flechas y posición, guardar y volver a generar el boletín para confirmar el
   orden persistido.
6. Abrir Certificados y confirmar que la generación compartida sigue operando
   con el mismo endpoint.

## Cambio posterior fuera del plan, 2026-08-28

El módulo sigue **cerrado**. Con orden explícita del usuario se agregó una
función nueva de producto que toca sus archivos: promedio y puesto en boletines
de desarrollo infantil. **No reabre el módulo ni pertenece al plan**, que
excluye funciones nuevas de su alcance; queda anotado aquí solo para que un
asistente posterior no lo lea como divergencia sin explicar al comparar el árbol
con el commit final `60edcb5`.

La documentación viva del cambio está en `docs/CAMBIOS_FRONTEND.md`. Respetó los
límites del módulo: los contratos nuevos viven en `src/utils/boletines/`, la
escala compartida en `src/constants/`, los componentes siguen sin hooks ni HTTP
y las pruebas quedaron junto a las unidades que protegen.

De paso corrigió una duplicación heredada: `VALORACIONES_DESARROLLO` estaba
declarada tres veces y las copias habían divergido en la etiqueta de `apoyo`.
Ahora hay una sola definición y las utilidades la derivan.

El mismo cambio alcanzó al módulo `planilla`, cuya columna de promedio tenía el
hueco equivalente. También está cerrado y tampoco se reabre; queda anotado en
`PLANILLA.md`. El contrato compartido vive en `src/utils/valoracionesDesarrollo.js`,
fuera de ambos módulos.

Verificación: `pnpm run check:deploy` correcto, 283 archivos y 1564 pruebas.
Sin commit ni publicación.

## Cambio posterior fuera del plan, 2026-11-06

El módulo sigue **cerrado**. A pedido del usuario se agregó "Ver cómo queda"
en el ingreso del profesor: una vista previa del boletín con solo su materia y
lo que tiene en pantalla. Detalle en `docs/CAMBIOS_FRONTEND.md`.

Respeta los límites del módulo: el contrato nuevo (`construirMateriaVistaPrevia`)
vive en `src/utils/boletines/`, la coordinación (estudiante abierto, Escape,
bloqueo del fondo) en `hooks/boletines/useVistaPreviaBoletinProfesor.js` y los
componentes siguen sin hooks ni HTTP. `BoletinImprimible.jsx` solo exporta
piezas que ya tenía (`Escala`, `MateriaBoletin` y la ficha, extraída como
`FichaEstudianteBoletin`); el impreso del admin no cambia. Formato A4 de
`210mm` y scroll lateral en celular, igual que el impreso.

El mismo día la vista previa pasó a mostrar también las otras materias del
profesor en ese curso. La consulta vive en un hook de consulta propio
(`useConsultaOtrasMateriasBoletin`, cancelable y una vez por clase y periodo)
y usa el `obtenerReferenciaBoletin` que ya existía: no hay rutas nuevas en
`services/boletinesApi.js`.
