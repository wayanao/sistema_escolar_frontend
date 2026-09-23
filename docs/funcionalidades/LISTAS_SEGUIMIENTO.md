# Funcionalidad: Listas de Seguimiento por Curso — Frontend

## Control

- Estado: **Terminado. Los cinco pasos hechos (2026-09-22) y, con el backend
  también cerrado, la propuesta completa.** La pantalla funciona de punta a
  punta y se probó a mano en el navegador contra el backend real. 124 pruebas
  propias en este repo.
- **Hay una ampliación en diseño, sin código todavía:** una casilla para
  crear la misma columna en todos los cursos de golpe. Ver la sección
  "Ampliación" más abajo, y el diseño completo en el documento del backend.
- La condición para empezar ya se cumplió: el backend tiene los cuatro
  endpoints, la migración aplicada a los dos tenants y su SQL ensayado contra
  PostgreSQL real. Ver
  `sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- Repos afectados: este repo y `sistema_escolar_api`. Ver también
  `sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`, que
  cubre la parte de datos y endpoints.
- Riesgo inicial: Bajo. Pantalla nueva; no modifica ninguna pantalla,
  servicio ni hook existente.
- Última actualización: 2026-09-22.

## Objetivo

Pantalla de admin, "Listas de Seguimiento", donde por curso se puedan crear
columnas con nombre libre y marcar cada alumno con un check + una nota corta
por columna.

## Motivación

Ver `sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`,
sección Motivación. Resumen: el admin no tiene hoy dónde llevar registros
propios por curso (ej. quién asistió a un evento, quién compró un libro)
fuera de notas y pagos.

## Decisiones ya tomadas (con el usuario)

- Columnas independientes por curso (sin selector para "aplicar a varios
  cursos a la vez"). **Matizado el 2026-09-22:** se añadirá una casilla
  "crear en todos los cursos", pero sigue sin haber selector de cursos y las
  columnas siguen siendo independientes; lo que se crea son copias. Ver
  "Ampliación".
- Cada celda: check + nota corta opcional, no solo un booleano.
- Nombre en el menú y en la pantalla: "Listas de Seguimiento", para no
  confundirla con la "Planilla" del profesor (notas).
- Guardado de marcas **en lote**: los cambios (check y nota) se juntan en
  memoria y se mandan todos juntos con un botón "Guardar cambios" +
  confirmación — no una petición por click ni por tecla escrita en la nota.
- Alta/baja de columna sí es una acción instantánea con confirmación (no
  entra al lote de "Guardar cambios"), igual que ya funciona en la gestión
  de tipos de evaluación de la Planilla del profesor.
- Sin selector de curso compartido: este módulo pide su propio `GET /cursos`
  y arma su propio `<select>`, como ya hacen Boletín y Tipos de Pago (no se
  extrae un componente común hasta que haga falta, política ya establecida
  del proyecto).

## Archivos a crear (según el plan — nada implementado todavía)

**Servicio** (único punto HTTP del módulo):
- `src/services/listasSeguimientoApi.js` —
  `obtenerCursosListasSeguimiento()`, `obtenerListaSeguimiento(cursoId)`,
  `crearColumnaSeguimiento(cursoId, nombre)`,
  `eliminarColumnaSeguimiento(cursoId, columnaId)`,
  `guardarMarcasSeguimiento(cursoId, payload)`. **Hecho (2026-09-22)**, con
  `listasSeguimientoApi.test.js`. Las cinco aceptan `{ signal }` para
  cancelar, como el resto de servicios del proyecto, y ninguna decide
  mensajes de UI: dejan pasar el error para que lo traduzcan los hooks.

**Utils** (sin HTTP, sin React):
- `src/utils/listasSeguimiento/columnas.js` — validación de nombre, chequeo
  de duplicado en el cliente antes de la petición. **Hecho (2026-09-22).**
  Ojo con lo que dice la línea de arriba: se pensó copiar la regla de
  `agregarTipoEvaluacion` de planilla, que compara con
  `trim().toLowerCase()`, y **no sirve**. El índice único del backend además
  colapsa los espacios interiores, así que escribir `"Compró  el libro"` con
  `"Compró el libro"` ya creada pasaría el filtro del navegador y el
  servidor respondería 409. `normalizarNombreColumna` replica la regla del
  backend entera: recorta, colapsa interiores y sube a mayúsculas. Sigue
  siendo solo comodidad — la verdad la tiene el backend y el 409 hay que
  tratarlo igual, porque entre el chequeo y la petición otra pestaña puede
  crear la misma columna.
- `src/utils/listasSeguimiento/marcas.js` — `normalizarListaSeguimiento`,
  `obtenerMarcaCelda` (default `{marcado: false, nota: ""}`),
  `construirPayloadMarcas` a partir de los cambios pendientes. **Hecho
  (2026-09-22).** Dos cosas para los pasos 2 y 3:
    - **Se agregó `claveCelda(estudianteId, columnaId)`**, que no estaba en
      este plan. Existe para que los cambios pendientes se guarden indexados
      por celda, y con eso sea **estructuralmente imposible** mandar la misma
      celda dos veces: el backend rechaza el lote entero con 422 si eso pasa,
      porque escribe todo en una sentencia y PostgreSQL la aborta. El hook de
      comando del paso 2 tiene que guardar los cambios en un `Map` o un objeto
      con esa clave, **no en un array**.
    - `construirPayloadMarcas` recorta la nota pero **no la corta** a 240
      caracteres. Cortar texto sin avisar es peor que el error; avisar es
      trabajo de la pantalla, con `LIMITE_NOTA_SEGUIMIENTO`.

**Hooks** (consulta y comando separadas):
- `src/hooks/listasSeguimiento/useConsultasListasSeguimiento.js` — **Hecho
  (2026-09-22)**, 16 pruebas. Carga los cursos al montar y la lista al elegir
  uno. Cancela la petición anterior con el patrón de `useCursos.js`
  (`solicitudRef` + `AbortController`): sin eso, elegir 1A y enseguida 2B
  puede terminar pintando los alumnos de 1A bajo el título de 2B, sin nada en
  pantalla que lo delate. Devuelve también `setLista`, que usa el hook de
  comando para agregar una columna recién creada sin recargar toda la lista.
- `src/hooks/listasSeguimiento/useComandosListasSeguimiento.js` — **Hecho
  (2026-09-22)**, 18 pruebas. Lo que hay que saber antes de tocarlo:
    - Los cambios pendientes viven en un **`Map` indexado por `claveCelda`**,
      nunca en un array. Es lo que hace imposible mandar la misma celda dos
      veces.
    - **Volver al valor guardado retira el cambio en vez de apuntarlo.** Sin
      eso, marcar y desmarcar la misma casilla dejaría el botón "Guardar
      cambios" encendido sin nada que guardar.
    - **Borrar una columna descarta los cambios pendientes de esa columna**, y
      solo de esa. Si se quedaran, el siguiente guardado mandaría celdas de una
      columna que ya no existe y el backend rechazaría el lote **entero** con
      422, incluidas las celdas buenas.
    - **Cambiar de curso descarta lo pendiente.** Conservarlo aplicaría las
      marcas de un curso sobre otro, que es peor que perderlas. Avisar antes
      de cambiar es trabajo de la pantalla: para eso el hook expone
      `hayCambios`.
    - Al guardar bien, **limpia lo pendiente antes de recargar**. Al revés, si
      la recarga fallara, lo ya guardado seguiría marcado como pendiente y el
      usuario lo mandaría dos veces.
    - El **409 al crear** se trata aunque la comprobación local diga que el
      nombre está libre: entre una cosa y otra, otra pestaña puede haber
      creado la misma columna.

**Componentes** (presentacionales, sin `services/`). **Los seis hechos
(2026-09-22)**, con 38 pruebas entre todos:
- `VistaListasSeguimiento.jsx` — la pantalla entera: selector de curso,
  estados de vacío, carga y error, y el resto de piezas. Todo por props.
- `GestionColumnasSeguimiento.jsx` — alta y baja de columnas. El borrado va
  por chip, con un botón en cada columna, y **no** con un desplegable como en
  la Planilla del profesor: aquí las columnas ya están a la vista en la
  cabecera, y elegir en una lista aparte la que estás mirando es un paso de
  más. El texto del campo es estado **local** del componente: es un borrador
  de interfaz, no estado de dominio, y se limpia solo cuando `onCrear`
  devuelve `true`.
- `TablaSeguimiento.jsx` — pinta **las dos vistas a la vez** (tabla y
  tarjetas) y esconde una con CSS, en vez de medir la ventana en JavaScript,
  que en la primera pintada todavía no sabe el ancho real. Consecuencia para
  quien escriba pruebas: un nombre aparece más de una vez en el DOM, así que
  hay que buscar el sitio concreto (`columnheader`, `article`) y no el texto
  suelto.
- `SeguimientoRow.jsx` y `SeguimientoMobileCard.jsx` — la misma celda en dos
  formas. **Comparten los nombres accesibles** (`"<columna>: <apellido>
  <nombre>"` para el check, `"Nota de <columna> para ..."` para la nota), así
  que lo que se prueba en una vale para la otra y un lector de pantalla oye lo
  mismo. La nota lleva `maxLength={LIMITE_NOTA_SEGUIMIENTO}`: se corta **al
  escribir**, que es donde el usuario lo ve, no al enviar, que lo perdería sin
  avisar.
- `BarraGuardadoSeguimiento.jsx` — cuenta los cambios y ofrece guardar o
  descartar. Se habilita con **un** cambio. La vista la esconde si el curso no
  tiene columnas o no tiene alumnos: una barra que nunca se puede usar solo
  estorba.

**Página y ruteo. Todo hecho (2026-09-22)**, con 5 líneas agregadas en
total a los archivos compartidos y ninguna borrada:
- `src/pages/ListasSeguimientoAdmin.jsx` — composición, sin HTTP directo.
  Lleva **una sola** decisión propia, y es porque necesita a los dos hooks a
  la vez: avisar antes de cambiar de curso si hay marcas sin guardar. El hook
  de comando las descarta a propósito —aplicarlas a otro curso sería peor que
  perderlas—, pero descartarlas en silencio sí sería una trampa, así que
  preguntar es trabajo de la pantalla.
- `src/App.jsx` — ruta `/admin/listas-seguimiento` dentro de `AdminRoute`,
  con `React.lazy` como el resto.
- `src/utils/autenticacion/navegacion.js` — ítem nuevo en
  `ADMIN_DESKTOP_ITEMS`, grupo "academica", al final.
- `src/components/autenticacion/NavAdminView.jsx` — el mismo ítem, a mano,
  en el bloque mobile de "academica". **Este archivo no se genera a partir
  de `navegacion.js`** — hay que tocar los dos o el ítem solo aparece en
  desktop.
- `src/utils/autenticacion/navegacion.test.js` — hubo que tocarlo también, y
  no es opcional: congela el árbol entero del menú admin con `toStrictEqual`,
  a propósito, para que un ítem nuevo no se cuele sin declararse. Es la misma
  clase de guardián que el censo de repositorios del backend; se declara el
  ítem y ya.

Cada archivo de código lleva su `*.test.js`/`*.test.jsx` junto, más un test
de integración del flujo crítico en `ListasSeguimientoAdmin.test.jsx`.

## Cambios de UI (planeados)

| Pantalla | Cambio |
|---|---|
| Admin → Listas de Seguimiento (nueva) | Elegir curso, ver el listado de alumnos, crear/borrar columnas, marcar celdas (check + nota corta), guardar cambios en lote con confirmación. |
| Menú admin (desktop y mobile) | Nueva entrada "Listas de Seguimiento" en el grupo Académica. |

## Invariantes

- No modifica ninguna pantalla, hook ni servicio existente (Planilla,
  Asistencia, Boletín, Tipos de Pago, etc.).
- Sigue la convención de capas de `CLAUDE.md`: página sin HTTP directo,
  componentes sin importar `services/`, un único punto HTTP por módulo.

## Ampliación: crear una columna en todos los cursos (2026-09-22)

**En diseño. Sin código escrito todavía.** El diseño completo, las decisiones
y el plan de fases están en
`sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`, sección
"Ampliación". Aquí solo lo que toca a las pantallas.

### Qué se ve

Una casilla junto al campo de nombre, en `GestionColumnasSeguimiento`:
**"Crear en todos los cursos"**. Marcada, el botón de agregar deja de crear la
columna en el curso que estás viendo y la crea en todos los cursos activos que
aún no la tengan.

Al terminar, un aviso honesto con lo que devuelve el backend:
"Creada en 9 cursos. 2 ya la tenían."

### Tres cosas que no son evidentes

1. **Con la casilla marcada, un nombre repetido deja de ser un error.** Hoy
   `validarNombreColumna` bloquea si el curso actual ya tiene esa columna.
   Con la casilla marcada eso es justo lo contrario de lo que se quiere:
   escribir un nombre que el curso actual ya tiene significa "créala en los
   demás". El backend salta los que la tengan, así que la comprobación local
   de duplicado **no debe aplicarse** en ese modo. Las otras dos
   validaciones —vacío y largo— sí siguen.
2. **Después de crear en todos hay que recargar, no agregar a la grilla.** El
   alta normal se puede agregar a mano porque la respuesta trae `id` y
   `nombre` de esa columna. La creación masiva devuelve conteos, no la
   columna del curso actual, así que lo correcto es volver a pedir la lista.
3. **Puede no crear nada y no ser un error.** Si todos los cursos ya la
   tienen, `creadas` es 0. El aviso debe decirlo con naturalidad ("Todos los
   cursos ya la tenían"), no como un fallo.

### Archivos que tocaría

- `src/services/listasSeguimientoApi.js` — una función nueva,
  `crearColumnaEnTodosLosCursos(nombre)`.
- `src/hooks/listasSeguimiento/useComandosListasSeguimiento.js` — el modo
  nuevo en `crearColumna`, y el aviso con los conteos.
- `src/components/listasSeguimiento/GestionColumnasSeguimiento.jsx` — la
  casilla. Es estado **local** del componente, como el texto del nombre: es
  un borrador de interfaz, no estado de dominio.
- `src/pages/ListasSeguimientoAdmin.jsx` — solo si hace falta cablear algo
  nuevo; la idea es que no.

No toca `utils/listasSeguimiento/marcas.js` ni ninguno de los componentes de
la grilla.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Los dos archivos de menú (`navegacion.js` y `NavAdminView.jsx`) no se sincronizan solos | Tocar los dos explícitamente al implementar; ya es un problema conocido en otros módulos admin. |
| Guardar la nota en cada tecla generaría demasiadas peticiones | Se sigue el patrón de Asistencia: cambios en memoria + un solo guardado en lote con confirmación (ver "Decisiones ya tomadas"). |
| Copiar de Asistencia también la regla de "no se puede guardar hasta marcar a todos" | No corresponde acá: en este módulo es normal que la mayoría de las celdas queden sin marcar. El botón de guardar debe habilitarse con al menos un cambio pendiente, no con la grilla completa. |

## Plan de fases (frontend) — no empieza hasta que el backend esté verificado

1. `listasSeguimientoApi.js` + utils + sus tests. **Hecho (2026-09-22).**
   40 pruebas: 10 del servicio, 14 de `columnas.js` y 16 de `marcas.js`.
2. Hooks de consulta y de comando + sus tests. **Hecho (2026-09-22).**
   34 pruebas: 16 del de consulta y 18 del de comando.
3. Componentes + sus tests. **Hecho (2026-09-22).** 38 pruebas entre los
   seis.
4. Página, ruta y menú (los dos archivos) + test de integración. **Hecho
   (2026-09-22).** 12 pruebas en `ListasSeguimientoAdmin.test.jsx`, que
   cubren el flujo crítico completo —elegir curso, marcar, guardar— y dos
   guardas de que la entrada de menú está en los **dos** archivos.
5. Documentación (`docs/API_CLIENT.md`, `docs/RUTAS_FRONTEND.md`,
   `docs/ROLES_UI.md`, `docs/CAMBIOS_FRONTEND.md`). **Hecho (2026-09-22).**

## Preguntas abiertas

Ver `sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`,
sección Preguntas abiertas — compartidas entre ambos repos. No bloquean
empezar el backend.

## Entrega para el siguiente chat

- Última acción terminada: **paso 4 del "Plan de fases"**, el 2026-09-22.
  Con él la pantalla ya funciona de punta a punta.
  - `5fe6998` — el servicio, los dos utils y sus pruebas (paso 1).
  - `f27660b` — los dos hooks y sus pruebas (paso 2).
  - `a70326d` — los seis componentes y sus pruebas (paso 3).
  - El paso 4 agrega `src/pages/ListasSeguimientoAdmin.jsx` y su test de
    integración, y toca cuatro archivos compartidos con **5 líneas en total**:
    `App.jsx`, `navegacion.js`, `NavAdminView.jsx` y `navegacion.test.js`.
    **Sin commit todavía.** Ninguno de los cuatro pasos está pusheado.
- Verificación: `pnpm run check:deploy` pasa entero — **1967 pruebas en 319
  archivos, lint limpio, build correcto**. `git diff --check`: limpio.
- **Falta una guarda que este proyecto ya echó de menos una vez.**
  `NavegacionesView.test.jsx` tiene una prueba que ata el menú móvil de
  profesor al de escritorio, escrita después de que «Observador» se quedara
  solo en escritorio sin que nadie lo notara. **Para admin esa prueba no
  existe.** Como el encargo pedía no tocar el menú admin más allá de los dos
  archivos, la guarda de esta funcionalidad se dejó dentro de
  `ListasSeguimientoAdmin.test.jsx`: protege esta entrada, pero no las demás.
  Escribir la prueba general de admin sigue pendiente y no es de esta
  propuesta.
- Dos errores de pruebas que conviene no repetir:
  - En el paso 2, la prueba de cancelación resolvía la primera petición al
    instante, así que cuando llegaba la segunda ya había terminado y no había
    nada que abortar. Para probar una cancelación, la primera tiene que seguir
    en vuelo; se deja colgada a propósito con `new Promise(() => {})`.
  - En el paso 3, dos pruebas buscaban un nombre con `getByText` y fallaban
    por encontrarlo varias veces. No era un fallo del componente: tabla y
    tarjeta se pintan las dos, así que el mismo texto sale más de una vez. Hay
    que buscar el sitio concreto.
- Un error que encontraron las pruebas en el paso 1 y conviene no repetir:
  `construirPayloadMarcas` convertía los ids con `Number(valor)`, y en
  JavaScript `Number(null)` vale **0**, no `NaN`. Una celda sin columna habría
  viajado como `columna_id: 0`, un id que parece válido, y el backend la
  habría rechazado con un 422 difícil de entender. Está arreglado y comentado
  en el propio archivo.
- El backend está terminado y verificado, así que nada de aquí en adelante
  está bloqueado por él. Los cuatro endpoints y sus respuestas están en
  `sistema_escolar_api/docs/API_ENDPOINTS.md`, sección "Listas de
  seguimiento".
- **Probada a mano en el navegador el 2026-09-22, y funciona.** Lo hizo el
  usuario contra el backend real. Con eso queda cerrado el último hueco de
  verificación que quedaba: las 124 pruebas automáticas doblan el servicio,
  así que hasta ese momento ninguna petición real había salido de este código
  ni el backend le había respondido nunca. Cada eslabón estaba probado por
  separado —el SQL contra PostgreSQL en el ensayo del backend, las rutas
  contra la aplicación real, la pantalla contra dobles—, pero la cadena
  entera no.
- Documentación transversal actualizada (paso 5): `docs/API_CLIENT.md` (los
  cinco endpoints que consume el módulo y las tres reglas del contrato que
  conviene no perder de vista), `docs/RUTAS_FRONTEND.md` (la ruta, la entrada
  de menú y la nota de UX de que **no** es documento A4), `docs/ROLES_UI.md`
  (la entrada nueva, y que la protección real la da el router admin-only del
  backend) y `docs/CAMBIOS_FRONTEND.md` (la entrada del 2026-09-22).
- **Siguiente acción exacta: ninguna de esta propuesta.** Los dos repos están
  terminados. Lo que queda son dos cosas que **no** son de esta funcionalidad:
  - **Pushear.** Nada está pusheado en ninguno de los dos repos. En
    `sistema_escolar_api` un push a `main` despliega producción
    automáticamente, así que el backend debería publicarse **antes** que el
    frontend: al revés, la pantalla existiría contra unos endpoints que
    todavía no responden. La migración ya está aplicada a los dos tenants, así
    que ese paso no falta.
  - **La guarda del menú admin, que ya no falta.** El 2026-09-22 se agregó a
    `src/components/autenticacion/NavegacionesView.test.jsx` la prueba gemela
    de la de profesor: compara los **destinos** del menú móvil de admin con
    los de `ADMIN_DESKTOP_ITEMS`, desplegando cada grupo, y falla si un
    destino existe en un menú y falta en el otro. Se comprobó que detecta de
    verdad quitando temporalmente la entrada móvil de esta funcionalidad.
    Dos cosas que dejó a la vista:
    - No compara los **textos**, solo los destinos, porque hoy no coinciden
      en una entrada: escritorio dice «Gestión de Pagos» y móvil «Pagos», los
      dos a `/admin/pagos`. Es anterior a esta propuesta y la prueba de
      contratos ya lo fija; igualarlos no es de esta guarda.
    - La guarda concreta de esta entrada sigue además dentro de
      `ListasSeguimientoAdmin.test.jsx`, que comprueba etiqueta y destino en
      los dos menús.
- Preguntas abiertas: sigue sin responder la del año lectivo, en el documento
  del backend. No bloquea nada; si algún día se reutiliza el mismo curso de un
  año al siguiente, las columnas del año anterior seguirán apareciendo y habrá
  que borrarlas a mano.
- La documentación transversal (`docs/API_CLIENT.md`, `docs/RUTAS_FRONTEND.md`,
  `docs/ROLES_UI.md`, `docs/CAMBIOS_FRONTEND.md`) va en el paso 5 de este
  plan, no en cada paso. Todavía no se ha tocado ninguna.
