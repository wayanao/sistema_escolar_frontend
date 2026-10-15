# Funcionalidad: Entrevista de admisión — Frontend

## Control

- Estado: **E4 a E6 en producción (2026-10-14, informado por el usuario)**:
  E4 `22b3dcf`, E5 `ae5240a`, E6 `f50ef7b`; el repo estaba igual a GitHub
  ese día. El backend (E1 a E3) también, según el usuario, y el E7 del
  backend está en GitHub (`24a9a3c`). Queda por decidir si se borra
  `crearEstudianteEnPreparacion` (propuesto para el E7). **Ampliación del
  2026-10-14: las preguntas del anexo del colegio con casillas para
  chulear.** Diseño (E8) terminado; a este repo le toca el **E11** (ver
  "Preguntas del anexo (paso E11)"), dividido en **E11a** (la página de
  admisiones: commit `ca810ea`, sin subir) y **E11b** (las respuestas en la
  ficha del estudiante: escrito el 2026-10-15, sin commit). Con el E11b
  termina el código de la ampliación; el E12 (imprimir) es opcional.
- Tipo: función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md`.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/ENTREVISTA_ADMISION.md`**: ahí
  están lo que se encontró, la investigación, las decisiones, qué va en cada
  formulario, la tabla, las rutas y el plan completo. Este documento cubre
  solo las pantallas.
- Vive en la preparación del año lectivo (decisión del usuario). Ver
  `docs/funcionalidades/ANIO_LECTIVO.md`.
- Depende de: los pasos E1 a E3 del backend (migración y rutas) en
  producción antes de usar las pantallas allá.
- Última actualización: 2026-10-15.

## Objetivo

1. Registrar aspirantes nuevos del año en preparación, hacerles la entrevista
   y dejar el resultado: aprobado o no aprobado.
2. Matricular a un aspirante aprobado sin volver a digitar lo que ya se
   escribió.
3. Que el formulario del estudiante deje de pedir lo que pasó a la entrevista.

## Decisiones ya tomadas (con el usuario, 2026-10-12)

Detalle en el documento principal. Las que cambian pantallas:

- Solo estudiantes **nuevos**. La promoción de quien continúa no cambia.
- **Bloquea:** un estudiante nuevo en el año en preparación solo se crea
  desde una admisión aprobada. Por eso "Crear estudiante en 2027" (en
  Estudiantes y en "Continuar la preparación") se reemplaza por el camino de
  admisiones.
- Resultados: Pendiente, Aprobado, No aprobado (este último pide el motivo).
- El frontend no decide nada de esto: el backend valida el año, la
  autorización, el motivo y quién se puede matricular; la pantalla oculta
  botones por comodidad y muestra el mensaje del backend tal cual.

Propuestas del asistente, **confirmadas por el usuario el 2026-10-13**: el
reparto de campos (tabla del documento principal), copiar a la ficha del
estudiante al matricular, una página propia para admisiones a la que se llega
desde la preparación del año, y poder borrar una admisión no matriculada.

Decidido el mismo día: **quien entrevista se escribe a mano** (campo de
texto), no se elige de los usuarios del sistema.

## Arquitectura (según las capas del proyecto)

Módulo nuevo `admisiones`, con la misma estructura que los demás:

| Pieza | Archivo propuesto | Qué hace |
|---|---|---|
| Servicio | `src/services/admisionesApi.js` | Único punto HTTP: listar, registrar, ver, editar, resultado, borrar y matricular |
| Contrato puro | `src/utils/admisiones/` | Estado inicial, normalizar respuestas, armar cuerpos, validar, etiquetas de resultado |
| Consultas | `src/hooks/admisiones/useConsultasAdmisiones.js` | Lista del año, filtro por resultado, recarga |
| Comandos | `src/hooks/admisiones/useComandosAdmision.js` | Registrar, editar entrevista, resultado, borrar, matricular |
| Vistas | `src/components/admisiones/` | Lista, formulario del aspirante, formulario de la entrevista, resultado |
| Página | `src/pages/AdmisionesAdmin.jsx` | Ruta `/admin/anios-lectivos/admisiones` (`AdminRoute`) |

- El año viene del proveedor de años lectivos (`useAnioLectivo`): la página
  trabaja con el año en `preparacion`. Sin año en preparación, dice cómo
  crearlo y no muestra nada más.
- Ningún módulo importa de `utils/` de otro módulo (regla del `CLAUDE.md`).
  Lo que se comparta con Estudiantes (por ejemplo, los tipos de documento) se
  sube a `src/constants/` o a la raíz de `src/utils/`.

## Pantallas

### Acceso desde la preparación del año

En la página de años lectivos, con un año en preparación, una tarjeta
"Admisiones {año}" con los conteos (pendientes, aprobados, no aprobados,
matriculados) y el botón "Ir a admisiones". Reemplaza al enlace "Crear
estudiante en {año}" de "Continuar la preparación".

### Página de admisiones

- Lista de aspirantes del año con su resultado (filtro por resultado) y
  botón "Nuevo aspirante".
- **Nuevo aspirante:** nombre, apellidos, tipo y número de documento, fecha
  de nacimiento, curso del año al que aspira (los cursos de ese año),
  acudiente (nombre, parentesco, teléfono) y la **autorización de datos**
  (casilla obligatoria y quién autoriza), con un texto corto que explique
  para qué se usan los datos.
- **Entrevista** (por aspirante): fecha, quién entrevistó, quiénes
  asistieron, estudios anteriores (colegio, año cursado, preescolar, EBP,
  motivo del retiro, paz y salvo), ocupación del padre y de la madre, con
  quién vive, qué espera la familia y observaciones.
- **Resultado:** Aprobado o No aprobado (este pide el motivo). Se puede
  cambiar mientras no esté matriculado.
- **Matricular** (solo aprobados): abre la ficha del estudiante con los datos
  del aspirante ya puestos; el admin completa dirección, salud y padres y
  guarda. Después, la admisión queda de solo consulta con el enlace al
  estudiante.
- **Exalumno que vuelve** (decisión 11 del documento principal): si la
  admisión trae `aviso_documento`, matricular usa ese mismo estudiante y
  **reemplaza su ficha** como `PUT /estudiantes/{id}`. Por eso, en ese caso,
  la ficha se llena con lo que el estudiante ya tiene (leyéndolo por
  `aviso_documento.estudiante_id`) y encima los datos del aspirante; si no,
  se perderían datos como `condicion_diagnostico`.
- Móvil: tarjetas en una columna, formularios a ancho completo, botones a
  ancho completo (como el resto de años lectivos).

### Formulario del estudiante (paso E6)

- Sale la sección "Estudios Anteriores" y la ocupación del padre y de la
  madre.
- El cuerpo no cambia: los campos siguen en el estado inicial (vacíos al
  crear en el año activo) y, al editar, se devuelve lo que ya tenía el
  estudiante. No se pierde ningún dato.
- La ficha del estudiante muestra, de solo lectura, "Datos de admisión": lo
  que se copió de su entrevista o, en estudiantes de antes, lo que ya tenían
  guardado. (Hecho en el E6 con un botón "Ver datos de admisión" que los pide
  solo si se usa.)

### Preguntas del anexo (paso E11)

La lista completa (55 preguntas, cómo se responde cada una y lo que no se
agrega), las decisiones 12 a 16 y las rutas están en el documento
principal, "Preguntas del anexo (pasos E8 a E12)". Aquí, solo cómo se ven.

- **La lista la manda el backend** (`GET /admisiones/cuestionario`). La
  página la pide una vez al abrir Admisiones y arma el formulario con ella:
  este repo no tiene una copia de las preguntas que se pueda desactualizar,
  y no decide qué respuesta es válida (lo revisa el backend).
- **Secciones que se abren y se cierran**, una por sección del anexo
  (Familia, Vivienda, Salud…), debajo de la entrevista de hoy. Así 55
  preguntas no quedan en una página interminable.
- **Casillas para chulear**, según el tipo:

  | Tipo | Cómo se ve | Cómo está hecho |
  |---|---|---|
  | Sí / No | `[ ] No  [✓] Sí`; si la respuesta lo pide, aparece el cuadro del detalle | Botones de opción agrupados con su pregunta (`fieldset` y `legend`), dibujados como cuadritos; tocar otra vez la chuleada la desmarca |
  | Una opción | Igual, con sus opciones; "Otro" abre un cuadro | Igual que Sí / No |
  | Varias | `[✓] Desayuno  [ ] Almuerzo  [✓] Cena`; "Ninguno" borra las demás | Casillas de verificación (`checkbox`) |
  | Número | Cuadro solo para números, con mínimo y máximo | `input` de número |
  | Texto | Cuadro corto o grande | Los `CampoTexto` y `CampoArea` de hoy |

  Por qué botones de opción y no casillas en Sí / No: un lector de pantalla
  anuncia "elige una" en vez de "marca varias", y el teclado funciona como
  en cualquier formulario. Para quien lo usa, se ven igual: cuadritos.
- Al cambiar una respuesta, el cuadro de detalle u "Otro" que ya no aplica se
  esconde y se vacía, para que no se envíe algo que el backend rechazaría.
  La 26 (qué profesional) solo aparece si la 25 es "Sí".
- Celular y tablet: las casillas bajan una debajo de otra, con espacio
  suficiente para tocarlas con el dedo; las secciones, a ancho completo.
- Una admisión matriculada (`editable` falso) muestra todo de solo consulta,
  como hoy.
- **Ayuda de "No aprobado" (decisión 14):** a la que ya existe ("la admisión
  no puede negarse por religión, origen o composición de la familia") se le
  agrega que un diagnóstico, una discapacidad, la salud o la situación
  familiar tampoco pueden ser el motivo.
- **Ficha del estudiante:** "Ver datos de admisión" muestra además las
  respuestas, por sección y solo las respondidas (por ejemplo "Dificultad
  motora: Sí — Usa plantillas ortopédicas"). Sin admisión, "Sin entrevista
  de admisión". Las pide `GET /estudiantes/{estudiante_id}/admision` (E10).
- Capas: el formato de las respuestas para leerlas lo usan dos módulos
  (`admisiones` y `estudiantesObservador`), así que va en la raíz de
  `src/utils/` (regla del `CLAUDE.md`), por ejemplo
  `src/utils/cuestionarioAdmision.js`. Lo que solo usa el formulario
  (estado inicial, vaciar el detalle, armar el bloque) va en
  `src/utils/admisiones/`.

#### Contrato del backend para el E11 (su paso E10, 2026-10-14)

Completo en `sistema_escolar_api/docs/API_ENDPOINTS.md`, "Admisiones" →
"Preguntas del anexo (paso E10)". Lo que más importa aquí:

- `GET /admisiones/cuestionario`: `{secciones: [{clave, titulo, preguntas:
  [{numero, clave, texto, tipo, ...}]}]}`. Tipos: `si_no` (trae `opciones`
  Sí y No, y a veces `detalle: {con, texto, maximo}`), `una` y `varias`
  (`opciones`, a veces `otro: {texto, maximo}`; `varias` a veces
  `exclusiva`), `numero` (`minimo`, `maximo`), `texto` y `texto_largo`
  (`maximo`, a veces `ayuda`). La 26 trae `depende_de`.
- Respuestas en `cuestionario`: `si_no` → `{respuesta, detalle?}`; `una` →
  `{opcion, otro?}`; `varias` → `{marcadas, otro?}`; `numero` → entero;
  texto → texto. Sin responder = la clave no está.
- `GET /admisiones/{id}` y las respuestas de `POST`/`PUT` traen
  `cuestionario` (`{}` si no hay). En `PUT`, **no mandar `cuestionario`
  deja las respuestas como estaban**; mandarlo reemplaza el bloque entero.
  Un error de revisión llega como `422` con un texto en español que nombra
  la pregunta.
- `GET /estudiantes/{estudiante_id}/admision` → `{admision_id, anio,
  fecha_entrevista, cuestionario}`, todo `null` y `{}` si el estudiante no
  tiene admisión.

## Plan de pasos de este repo

Numeración compartida con el backend (plan completo en el documento
principal).

| Paso | Qué |
|---|---|
| E4 | Página de admisiones: servicio, contrato, hooks, vistas, ruta y tarjeta de acceso. Lista, nuevo aspirante, entrevista y resultado. **Hecho el 2026-10-13** (`22b3dcf`); en producción el 2026-10-14 |
| E5 | Matricular desde una admisión aprobada; quitar "Crear estudiante en {año}" de Estudiantes y de "Continuar la preparación". **Hecho el 2026-10-13** (`ae5240a`); en producción el 2026-10-14 |
| E6 | Formulario del estudiante sin lo que pasó a la entrevista; "Datos de admisión" en la ficha. **Hecho el 2026-10-13** (`f50ef7b`); en producción el 2026-10-14 |
| E8 | Diseño de las preguntas del anexo (solo documentos, en los dos repos). **Hecho el 2026-10-14** |
| E11a | Preguntas del anexo en la página de admisiones: secciones, casillas, guardar con la entrevista y ayuda ampliada de "No aprobado". **Escrito el 2026-10-14, sin commit**; se publica después de que el E10 del backend esté **Live** |
| E11b | Las respuestas en "Datos de admisión" de la ficha del estudiante (`GET /estudiantes/{estudiante_id}/admision`). **Escrito el 2026-10-15, sin commit** |
| E12 | **Opcional, solo si el usuario lo pide:** imprimir la entrevista con las firmas (`DocumentoImprimible`) |

Cada paso empieza con caracterización, escribe las pruebas antes del código,
termina con `pnpm run check:deploy` y `git diff --check`, actualiza este
documento y se detiene antes del siguiente.

## Pruebas

- `src/utils/admisiones/*.test.js`: normalizar, cuerpos, validación,
  etiquetas.
- `src/services/admisionesApi.test.js`: rutas y cuerpos de cada llamada.
- Hooks: carga, filtro, respuestas viejas descartadas, cada comando y sus
  errores con el mensaje del backend.
- Página: flujo completo (registrar → entrevista → aprobar → matricular) y
  "no aprobado" con motivo.
- Formulario del estudiante: lo que sale ya no se ve; el cuerpo al crear y al
  editar no cambia.
- Preguntas del anexo (E11): cada tipo de pregunta (chulear, desmarcar,
  detalle que aparece y se vacía, "Ninguno" que borra las demás, la 26 que
  depende de la 25), el bloque que se envía, el cuerpo de hoy sin cambios
  mientras no se toquen las preguntas, la lista pedida una sola vez, solo
  consulta en una matriculada, la ayuda de "No aprobado" y las respuestas en
  la ficha.

## Fuera de alcance

- Cualquier regla de admisión decidida en el frontend: la decide el backend.
- Estudiantes que llegan a mitad del año activo, prueba diagnóstica, lista de
  espera y formato impreso (ver el documento principal; el impreso quedó como
  E12, opcional).
- Una copia de la lista de preguntas en este repo: la manda el backend.

## Preguntas abiertas

Las mismas del documento principal. Las de antes de E1 (reparto de campos y
propuestas), la de quién entrevista y la del exalumno que vuelve quedaron
respondidas el 2026-10-13. Para este repo no queda ninguna abierta antes de
E4.

Para el E5: el contrato de todas las rutas (cuerpos, respuestas,
errores, `editable`, `aviso_documento`, resultado y matricular) está en
`sistema_escolar_api/docs/API_ENDPOINTS.md`, sección "Admisiones". La
pantalla oculta botones con `editable`, no con su propia regla.

## Avance del paso E4 (2026-10-13)

- Autorizado explícitamente por el usuario ("Empezar el E4", elegido frente a
  probar primero E2 y E3 en local). Al iniciar, los dos repos estaban en
  `main` y limpios, sin subir: backend `d099c29` (E3), frontend `0e13fb1`.
- Caracterización antes de tocar: una prueba nueva en
  `FormularioEstudianteAdmin.test.jsx` fija las opciones de tipo de documento
  y paz y salvo (pasó antes y después del cambio). Línea base de los tres
  archivos que se iban a tocar (formulario, Años lectivos y `App`): 55
  pruebas pasando.
- Pruebas primero, 76 nuevas en total; antes del código fallaban los 9
  archivos nuevos y las pruebas de la tarjeta y de la ruta.
  - `utils/admisiones/admisiones.test.js` y `formularios.test.js`: leer la
    lista, etiquetas, filtro en el navegador, conteos, mensajes (también un
    422 en lista), estado inicial, llenar desde el backend, cuerpos
    (recortados, vacíos como `null`, registrar solo el aspirante, editar con
    la entrevista, resultado aparte) y validación.
  - `services/admisionesApi.test.js`: rutas y cuerpos de las seis llamadas.
  - `hooks/admisiones/`: la lista (sin año no pide; filtrar no pide; cursos
    solo si se piden; respuesta vieja descartada; mensaje del backend) y los
    comandos (validación sin llamar al backend, registrar y pasar a la ficha,
    errores del backend, guardar entrevista, resultado con motivo, borrar,
    cambiar de año cierra todo).
  - Vistas: tarjeta, lista (filtros, insignias, vacío) y ficha (guardar,
    resultado, solo consulta si no es `editable`, aviso del documento).
  - `pages/AdmisionesAdmin.test.jsx`: el flujo completo con el backend
    doblado. `AniosLectivosAdmin.test.jsx`: la tarjeta (una petición, solo con
    año en preparación). `App.test.jsx`: la ruta es de admin y un profesor
    termina en `/login`.
- Código:
  - `services/admisionesApi.js`; `utils/admisiones/admisiones.js` y
    `formularios.js`; `hooks/admisiones/useConsultasAdmisiones.js` y
    `useComandosAdmision.js`; `components/admisiones/` (tarjeta, encabezado,
    lista, nuevo aspirante, ficha, formularios del aspirante y la entrevista,
    resultado y campos); `pages/AdmisionesAdmin.jsx`; la ruta en `App.jsx`;
    la tarjeta en `AniosLectivosAdmin.jsx`.
  - `constants/documentosEstudiante.js`: tipos de documento y paz y salvo,
    sacados del formulario del estudiante, que ahora los importa.
- Decisiones de detalle (dentro del diseño):
  - El filtro se aplica en el navegador: cambiarlo no pide nada (meta del
    usuario de bajar peticiones). La lista trae todo el año y es corta.
  - Al registrar, la página abre la ficha del aspirante para seguir con la
    entrevista, sin otra petición (el backend responde la admisión completa).
  - La página usa siempre el año en preparación, no el del selector, y el
    selector no aparece en ella.
  - "Borrar" (decisión 9) quedó en la ficha, con confirmación; no estaba en la
    fila del E4 de la tabla pero sí en el servicio y los comandos del diseño.
  - El motivo de "No aprobado" lleva una ayuda: un motivo objetivo, y que la
    admisión no puede negarse por religión, origen o composición de la
    familia.
  - "Crear estudiante en {año}" sigue en "Continuar la preparación": se quita
    en el E5, junto con "Matricular".
  - Sin entrada nueva en el menú: se llega desde Años lectivos.
- Verificación: 130 pruebas de los archivos del paso; `pnpm run
  check:deploy` → **2485 pruebas en 364 archivos**, lint y build limpios;
  `git diff --check` limpio. Una corrida intermedia de `check:deploy`, ya
  solo con cambios de documentos, falló con "9 unhandled errors" (355
  archivos, 2405 pruebas): es la falla al azar por carga de la máquina ya
  conocida. La siguiente corrida de todas las pruebas y la de `check:deploy`
  completo pasaron sin errores. **No se ha visto en un navegador ni contra un
  backend real.**

## Avance del paso E5 (2026-10-13)

- Autorizado explícitamente por el usuario ("Empezar el E5", elegido frente a
  probar primero en local). Al iniciar, los dos repos estaban en `main` y
  limpios, sin subir: backend `2c4a796`, frontend `22b3dcf` (el E4).
- Lo que se encontró: `useFormularioEstudianteAdmin` ya aceptaba
  `crearEstudianteFn` (así creaba Estudiantes en preparación), de modo que
  matricular reutiliza el mismo formulario, su validación y su cuerpo, sin
  copiarlos ni importar `utils/` de otro módulo. "Crear estudiante en {año}"
  estaba en "Continuar la preparación" (enlace a Estudiantes) y en
  Estudiantes ("Nuevo Estudiante" con el alta directa).
- Pruebas primero: 23 nuevas y una reescrita; antes del código fallaban 19.
  - `useFormularioEstudianteAdmin.test.js`: `abrirConDatos` (ficha vacía con
    datos encima; para un exalumno parte de su ficha y guarda por el alta
    indicada, nunca editando; si no se puede leer, no abre).
  - `FormularioEstudianteAdmin.test.jsx`: título y botón opcionales.
  - `formularios.test.js`: `datosParaMatricular` (datos del aspirante y de la
    entrevista sin vacíos; el curso siempre, vacío si no hay).
  - `admisionesApi.test.js`: la ruta de matricular.
  - `useComandosAdmision.test.js`: `matricularConFicha` (deja la admisión de
    solo consulta, mensaje del backend y recarga; si falla, su mensaje y
    vuelve a lanzar el error) y `avisarError`.
  - `FichaAdmisionView.test.jsx`: "Matricular" solo para un aprobado sin
    matricular, según el resultado guardado; aviso de exalumno; botón
    ocupado.
  - `AdmisionesAdmin.test.jsx`: matricular de punta a punta (ficha llena,
    cuerpo enviado, admisión de solo consulta), exalumno, rechazo del
    backend y cancelar.
  - `AniosLectivosAdmin.test.jsx`: ya no hay "Crear estudiante en 2027".
  - `EstudiantesAdmin.anioLectivo.test.jsx`: **reescrita a propósito** la que
    fijaba el alta directa en preparación; ahora fija que no hay alta, que
    hay un aviso con "Ir a admisiones" y que no se envía nada. Una nueva:
    en un año cerrado no hay aviso.
- Código:
  - `services/admisionesApi.js`: `matricularAdmision`.
  - `utils/admisiones/formularios.js`: `datosParaMatricular`.
  - `hooks/admisiones/useComandosAdmision.js`: `matricularConFicha` y
    `avisarError`.
  - `hooks/estudiantesObservador/useFormularioEstudianteAdmin.js`:
    `abrirConDatos`. `FormularioEstudianteAdmin.jsx`: `titulo` y
    `textoBoton` opcionales. Lo de siempre no cambia.
  - `components/admisiones/FichaAdmisionView.jsx` (la sección "Matricular en
    {año}") y `MatricularAdmisionView.jsx` (nuevo).
  - `pages/AdmisionesAdmin.jsx`: compone la ficha del estudiante dentro de
    `MatricularAdmisionView`; cambiar de aspirante, empezar uno nuevo o
    cerrar cierra la ficha del estudiante.
  - `pages/AniosLectivosAdmin.jsx`: fuera el enlace. `pages/EstudiantesAdmin.jsx`:
    en preparación ya no hay alta (solo consulta) y sí un aviso con "Ir a
    admisiones".
- Decisiones de detalle:
  - La ficha se llena con los datos del aspirante y lo de la entrevista
    (estudios anteriores y ocupación de los padres; el backend los copia
    igual). Para un exalumno, primero lo que ya tiene (`GET
    /estudiantes/{id}`), porque el backend reemplaza su ficha como un
    `PUT`, y encima lo del aspirante. El curso siempre es el de la
    admisión (o vacío), nunca el de otro año.
  - "Matricular" mira el resultado guardado, no el que se está eligiendo.
  - `crearEstudianteEnPreparacion` (en `aniosLectivosApi.js`, con su prueba)
    quedó sin uso. **No se borró**: se pregunta al usuario.
- Verificación: 174 pruebas de los archivos del paso; `pnpm run
  check:deploy` → **2508 pruebas en 364 archivos**, lint y build limpios;
  `git diff --check` limpio. Una corrida anterior falló con 9 pruebas por
  tiempo agotado (5000 ms) en 8 archivos que no tienen que ver; solos
  pasaron (41 pruebas) y la corrida completa siguiente pasó entera. **No se
  ha visto en un navegador ni contra un backend real.**

## Avance del paso E6 (2026-10-13)

- Autorizado explícitamente por el usuario ("Empezar el E6", elegido frente a
  probar primero en local). Al iniciar, los dos repos estaban en `main` y
  limpios, sin subir: backend `4aac410`, frontend `ae5240a` (el E5). El
  usuario pidió que se le explicara mejor la pregunta de borrar
  `crearEstudianteEnPreparacion`; se le explicó y se propuso decidirla en el
  E7.
- Lo que se encontró: la ficha del estudiante (`DetalleEstudianteAdmin`)
  recibe la fila de la lista (`GET /estudiantes`), que no trae esos ocho
  datos, y `/detalles` y `/deudas` tampoco. Solo `GET /estudiantes/{id}`
  los tiene. Se eligió pedirlos **con un botón**, solo si se usan, en vez de
  sumar una petición a cada ficha (meta del usuario de bajar peticiones);
  cambiarlo a "siempre" es pequeño si el usuario lo prefiere. Cambiar el
  backend para incluirlos en `/detalles` no estaba en este paso.
- Pruebas primero: 14 nuevas; antes del código fallaban las que dependían de
  él.
  - `FormularioEstudianteAdmin.test.jsx`: ya no pide estudios anteriores ni
    la ocupación de los padres; lo demás de la familia sigue. **Ajustadas a
    propósito**: la de secciones (ya no espera "Estudios Anteriores") y la de
    caracterización del E4 (ya no fija "Paz y salvo").
  - `estudiantes.test.js`: `datosDeAdmisionEstudiante` (los ocho, en el
    orden del backend, vacío como `null`).
  - `useDetalleEstudianteAdmin.test.js`: abrir la ficha no los pide; verlos
    sí, una vez; se olvidan al cerrar o abrir otra; respuesta vieja
    descartada; error. Dos de estas se corrigieron después de escribir el
    código: llamaban a "ver" en el mismo `act` que "abrir", antes de que la
    ficha estuviera abierta, y una pasaba sin comprobar nada.
  - `DetalleEstudianteAdmin.test.jsx`: botón, datos con raya si están
    vacíos, "sin datos", cargando, error con reintento, y sin la sección si
    no se pasa quien los pida.
  - `EstudiantesAdmin.test.jsx`: editar conserva esos datos aunque no se
    vean (como el precedente de los descuentos) y la ficha los pide solo al
    pulsar. `AdmisionesAdmin.test.jsx`: ya no busca "Nombre Colegio
    Anterior" en la ficha de Matricular (el cuerpo sigue llevándolo).
- Código:
  - `constants/documentosEstudiante.js`: `DATOS_DE_ADMISION_EN_LA_FICHA`, que
    usan `utils/admisiones/formularios.js` (en lugar de su propia lista) y
    `utils/estudiantesObservador/estudiantes.js`
    (`datosDeAdmisionEstudiante`).
  - `FormularioEstudianteAdmin.jsx`: fuera la sección y las dos ocupaciones;
    los teléfonos de los padres pasaron a media columna para que cada padre
    quede en dos filas parejas.
  - `useDetalleEstudianteAdmin.js` (`verDatosAdmision` y su estado),
    `DetalleEstudianteAdmin.jsx` (la sección) y `EstudiantesAdmin.jsx` (la
    conexión).
- Consecuencia aceptada en el diseño: un estudiante creado a mitad del año
  activo, sin admisión, ya no tiene dónde registrar esos datos.
- Verificación: `pnpm run check:deploy` → **2522 pruebas en 364 archivos**,
  lint y build limpios, en una sola corrida; `git diff --check` limpio.
  **No se ha visto en un navegador ni contra un backend real.**

## Avance del paso E8 (2026-10-14)

- Solo documentos, en los dos repos; detalle en el "Avance del paso E8" del
  documento principal. Aquí: el estado en "Control", la sección "Preguntas
  del anexo (paso E11)", los pasos E8, E11 y E12 en el plan, pruebas, fuera
  de alcance y esta entrega.
- Visto al diseñar: la ayuda de "No aprobado" ya existe desde el E4
  (`ResultadoAdmisionView.jsx`); el E11 la amplía. "Datos de admisión" de la
  ficha (E6) lee hoy `GET /estudiantes/{id}`; las respuestas del anexo
  llegarán por la ruta nueva del E10.
- Sin código. Verificación: `pnpm run check:deploy` → **2524 pruebas en 364
  archivos**, lint y build limpios; en el backend, `scripts/verify.py` →
  2429 pasan; `git diff --check` limpio en los dos repos.

## Avance del paso E11a (2026-10-14)

- Autorizado por el usuario con "continúa", respondiendo a la propuesta del
  E11 como único paso siguiente. Al iniciar, los dos repos en `main` y
  limpios: backend con el E10 en el commit `eb53e2e`, sin subir; este repo
  con `f8856c2` (documentos), sin subir. El asistente dividió el E11 en E11a
  (esta página) y E11b (la ficha del estudiante, otro módulo), para revisar
  cada parte por separado.
- Línea base antes de tocar: 122 pruebas en los 10 archivos de admisiones y
  Años lectivos, todas pasando.
- Pruebas primero, 53 nuevas; antes del código fallaban 17 y no cargaban
  los dos archivos nuevos:
  - `utils/admisiones/cuestionario.test.js` (nuevo): leer la lista y las
    respuestas guardadas; chulear, cambiar y desmarcar al tocar otra vez; el
    detalle y "Otro" que se pierden al cambiar; "Ninguno" que borra las
    demás y otra que quita "Ninguno"; la 26 solo con la 25 en "Sí"; cuántas
    van respondidas; el bloque que se envía (recortado, en orden, sin lo
    vacío ni lo que ya no corresponde); la revisión de los números.
  - `services/admisionesApi.test.js`: la ruta de la lista, con y sin señal.
  - `useConsultasAdmisiones.test.js`: la lista solo si se pide (la tarjeta
    de Años lectivos no la pide), una sola vez aunque cambie el año, y su
    error sin tapar la lista de aspirantes.
  - `useComandosAdmision.test.js`: las respuestas al abrir; **sin tocarlas,
    el cuerpo del `PUT` es el de siempre**; tocadas, el bloque entero y
    limpio; guardar otra vez sin tocar no lo repite; un número fuera de rango
    no llama al backend y dice cuál pregunta; corregirlo quita el error;
    cerrar las olvida.
  - `CuestionarioAdmisionView.test.jsx` (nuevo): secciones cerradas con
    "x de y"; abrir; chulear; tocar otra vez la marcada; el detalle y "Otro"
    solo cuando corresponden; números y textos con sus límites; la 26; solo
    consulta; una sección con error se abre sola; la lista que no llegó.
  - `FichaAdmisionView.test.jsx` y `pages/AdmisionesAdmin.test.jsx`: las
    preguntas dentro del formulario; la ayuda ampliada; la lista pedida una
    vez; guardar sin tocar no manda el bloque; chulear y guardar lo manda; sin
    lista, lo demás se guarda igual. **Ajustado a propósito:** el doble del
    servicio de la página (y el del hook de consultas) ahora incluye
    `obtenerCuestionarioAdmision`.
- Código:
  - `services/admisionesApi.js`: `obtenerCuestionarioAdmision`.
  - `utils/admisiones/cuestionario.js` (nuevo): `normalizarCuestionario`,
    `respuestasDesdeAdmision`, `aplicarCambio`, `preguntaVisible`,
    `contarRespondidas`, `construirCuestionario` y `validarCuestionario`.
  - `hooks/admisiones/useConsultasAdmisiones.js`: `cargarCuestionario`,
    `cuestionario` y `errorCuestionario`.
  - `hooks/admisiones/useComandosAdmision.js`: recibe `cuestionario`;
    `respuestas`, `erroresCuestionario` y `cambiarRespuesta`; `guardarFicha`
    agrega el bloque solo si se tocó y la lista llegó.
  - `components/admisiones/CuestionarioAdmisionView.jsx` y
    `PreguntaCuestionarioView.jsx` (nuevos); `FichaAdmisionView.jsx` (las
    monta dentro del formulario, con valores por defecto: sin lista queda
    como antes); `ResultadoAdmisionView.jsx` (la ayuda, decisión 14);
    `pages/AdmisionesAdmin.jsx` (el cableado).
- Decisiones de detalle (dentro del diseño):
  - Las secciones son botones con `aria-expanded`, no `<details>`: se
    comportan igual en todos los navegadores y en las pruebas. Empiezan
    cerradas; el título dice "x de y" respondidas, y una sección con un error
    se abre sola. El aviso de arriba nombra la pregunta del error, por si
    está lejos.
  - Los cuadritos: el `input` real queda oculto a la vista (`sr-only`) y se
    dibuja un cuadro con ✓ (Tailwind `peer-checked`), con foco visible y
    al menos 44 px de alto para el dedo.
  - El texto "Ninguna es obligatoria. Para quitar una respuesta, toca otra
    vez la casilla marcada." va arriba de las secciones.
  - Los números se escriben en un cuadro numérico y se revisan antes de
    enviar (entero y en su rango); lo demás lo limitan los propios cuadros
    (`maxLength`).
- Verificación en "Entrega para el siguiente chat". **No se ha visto en un
  navegador ni contra un backend real.**
- El usuario hizo el commit: `ca810ea` (sin subir al iniciar el E11b).

## Avance del paso E11b (2026-10-15)

- Autorizado por el usuario con "continua", respondiendo a la propuesta del
  E11b como único paso siguiente. Al iniciar, los dos repos en `main` y
  limpios, sin subir: backend `bcf2fa8` (encima del E10, `eb53e2e`), este
  repo `ca810ea` (el E11a). No consta si el usuario probó el E11a en local.
- Pruebas primero, 18 nuevas; antes del código fallaban 12 y no cargaba el
  archivo nuevo:
  - `utils/cuestionarioAdmision.test.js` (nuevo): solo las respondidas, por
    sección y en orden, con su número; el detalle y "Otro" después de una
    raya ("Sí — Usa plantillas", "Empleada, Hermanos, Otro — La vecina"); una
    opción que la lista ya no tiene, tal cual; sin respuestas o sin lista,
    nada; lo vacío no cuenta.
  - `services/estudiantesObservadorApi.test.js`: la ruta nueva.
  - `useDetalleEstudianteAdmin.test.js`: los datos y la admisión a la vez;
    sin respuestas no se pide la lista; con respuestas, en texto; la lista
    una sola vez para varias fichas; si la admisión o la lista fallan, los
    datos de siempre se ven igual y el error queda aparte; cerrar o abrir
    otra ficha las olvida. **Ajustado a propósito:** los dobles del hook
    incluyen la ruta nueva y la lista de preguntas.
  - `DetalleEstudianteAdmin.test.jsx`: respuestas por sección con su
    pregunta; admisión sin respuestas; estudiante sin admisión; error sin
    esconder los datos de siempre; nada antes de pedirlos.
  - `pages/EstudiantesAdmin.test.jsx`: **ajustada a propósito** la que
    decía "una petición más": ahora son dos (la ficha y su admisión), y sin
    respuestas no se pide la lista de preguntas.
- Código:
  - `services/estudiantesObservadorApi.js`: `obtenerAdmisionDeEstudiante`.
  - `utils/cuestionarioAdmision.js` (nuevo, en la raíz de `utils/`, como
    decía el diseño): `respuestasLegibles(catalogo, cuestionario)`.
  - `hooks/estudiantesObservador/useDetalleEstudianteAdmin.js`: pide las dos
    cosas con `Promise.allSettled`; `respuestasAdmision` y
    `errorRespuestasAdmision`; la lista de preguntas en un `ref`, pedida con
    `admisionesApi.obtenerCuestionarioAdmision` (otro módulo usa el servicio
    de cursos de la misma forma).
  - `components/estudiantesObservador/admin/DetalleEstudianteAdmin.jsx`: el
    bloque "Respuestas de la entrevista (admisión {año})" debajo de los
    datos de siempre. `pages/EstudiantesAdmin.jsx`: el cableado.
- Decisiones de detalle (dentro del diseño):
  - Peticiones al pulsar "Ver datos de admisión": antes 1, ahora 2; 3 la
    primera vez que un estudiante tiene respuestas. Abrir la ficha sigue sin
    pedir nada de esto.
  - Las respuestas son datos sensibles (salud, familia): se ven solo en la
    ficha del admin y solo al pedirlas, como el resto de "Datos de admisión".
- Verificación en "Entrega para el siguiente chat". **No se ha visto en un
  navegador ni contra un backend real.**

## Entrega para el siguiente chat

- Estado al 2026-10-14: **E4 a E6 en producción**, según el usuario, igual
  que el backend (E1 a E3); el **E7** del backend está en GitHub
  (`24a9a3c`). Ninguna pantalla se había visto antes en un navegador ni
  contra un backend real (no consta una prueba en local).
- 2026-10-14: **E8 terminado** (diseño de las preguntas del anexo, solo
  documentos). A este repo le toca el **E11**, que espera al E9 (migración) y
  al E10 (rutas) del backend, con el E10 en **Live**.
- 2026-10-14: el **E9** del backend quedó en producción (la columna
  `cuestionario`) y el **E10** quedó escrito en el backend, sin commit. Su
  contrato está arriba, en "Contrato del backend para el E11". Aquí solo
  cambió este documento.
- 2026-10-14: **E11a escrito, sin commit** (ver su avance): las preguntas del
  anexo en la página de admisiones. Verificación: las 175 pruebas de
  admisiones y Años lectivos pasan (122 antes); `pnpm run check:deploy` →
  **2577 pruebas en 366 archivos** (antes 2524 en 364), lint y build
  limpios, en una sola corrida; `git diff --check` limpio.
- 2026-10-15: **E11b escrito, sin commit** (ver su avance): las respuestas
  en la ficha del estudiante. Verificación: las 110 pruebas del módulo de
  estudiantes pasan; `pnpm run check:deploy` → **2595 pruebas en 367
  archivos** (antes 2577 en 366), lint y build limpios, en una sola corrida;
  `git diff --check` limpio. Con él termina el código de la ampliación.
- Siguiente acción exacta: el usuario prueba **en local** el E11a y el E11b
  juntos (backend con el E10 y este frontend, con el Colegio Demo o una rama
  de Neon, nunca con `tenant_2005`: el backend local escribe en la base
  real): en Admisiones, abrir un aspirante, abrir una sección, chulear,
  desmarcar, escribir un detalle, guardar y volver a abrir; aprobarlo y
  matricularlo; en Estudiantes, abrir su ficha y "Ver datos de admisión".
  Es la primera vez que el bloque pasa por PostgreSQL. Después: commit del
  E11b; para publicar, primero el backend (E10) con Render en **Live** y
  después este frontend (E11a y E11b). El E12 (imprimir) solo si el usuario
  lo pide. Sigue recomendada
  la prueba de humo del E7 en producción con el Colegio Demo. Si el usuario
  dice que sí a borrar `crearEstudianteEnPreparacion` (sin uso desde el E5,
  recomendado), ese cambio es de este repo: la función en
  `services/aniosLectivosApi.js` y su prueba.
- Prompt para retomar: `docs/funcionalidades/PROMPT_CONTINUACION_ENTREVISTA_ADMISION.md`.
