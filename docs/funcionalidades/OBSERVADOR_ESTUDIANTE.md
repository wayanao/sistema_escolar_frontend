# Funcionalidad: Observador del estudiante unificado — Frontend

## Control

- Estado: **Fase 1 terminada el 2026-09-09.** La pantalla existe y **lee**: el
  profesor entra por «Observador» en Control Académico, elige un alumno y ve su
  bitácora agrupada por dimensión. Todavía **no se puede escribir** —eso es la
  fase 2— y la entrada del admin sigue leyendo las observaciones viejas.
  La pantalla vieja (`/Formulario`) sigue intacta y en producción.
- Tipo: Función nueva de producto. **No** es un módulo de la migración
  arquitectónica de `docs/modularizacion/` y no debe confundirse con uno.
- Repos afectados: este repo (`frontend-react`) y `sistema_escolar_api`. Ver
  también `sistema_escolar_api/docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`,
  que cubre tabla, endpoints y permisos. **El backend va primero**: esta
  pantalla no debe depender de endpoints que no existan.
- Riesgo inicial: Medio. Sustituye una pantalla que los profesores usan hoy.
- Última actualización: 2026-09-09.

## Objetivo

Reemplazar la pantalla actual —que lista todos los alumnos del curso, cada uno
con su formulario de una materia y un periodo— por **una página por estudiante**
con su bitácora completa: todas las anotaciones que le han hecho todos sus
profesores, a lo largo del año.

## Motivación

- Hoy la profesora solo ve **lo que ella misma escribió en su materia**. No hay
  panorama del niño.
- Hoy, al guardar, **se pisa lo anterior**. No queda historial.
- **Arregla el fallo que el usuario reportó.** La pantalla actual monta un
  componente por alumno y cada uno hace su propia petición. Medido el
  2026-09-03: con 12 alumnos tarda 16-20 s y el hook aborta a los 10 s, y por
  eso sale «No pudimos recuperar la observación guardada». Al cargar **un solo
  estudiante**, el problema desaparece por diseño.

## Fuera de alcance

- **Subir el timeout de 10 s de `useObservacionEstudiante`.** Cambiaría «sale un
  error» por «la página tarda 20 segundos», que es peor: el profesor no sabría
  si está rota. Decidido con el usuario.
- Consumir un endpoint masivo por asignación. Se descartó: esta funcionalidad
  lo vuelve innecesario.
- Adjuntar archivos o fotos a una anotación. No se pidió.

## Decisiones ya tomadas (con el usuario)

| # | Decisión |
|---|---|
| 1 | Página aparte, **un estudiante a la vez** |
| 2 | Todo profesor del alumno ve **todas** las anotaciones |
| 3 | El botón **Editar** solo aparece en las anotaciones propias |
| 4 | **No hay botón de borrar**, para nadie |
| 5 | Se mantienen los tres campos: conductual, cognitivo, lenguaje |
| 6 | Cada anotación se marca **positiva o negativa** |
| 7 | Vista principal **agrupada por dimensión**; botón para ver por fecha |
| 8 | El selector de periodo **no oculta** nada; incluye la opción «Todos» |
| 9 | Autocorrección de mayúsculas **al salir del campo**, no mientras escribe |
| 10 | Impresión con dos opciones: **todo** o **solo mis anotaciones** |
| 11 | **La materia no se muestra**, y por ahora ni se guarda | Decidido el 2026-09-08, después de darle dos vueltas. Ver abajo |
| 12 | **El nivel del curso va en el título**, en los dos niveles | «Pepito · Primaria», «Juanito · Preescolar». Una vez, no en cada anotación |

## Por dónde se entra

Decidido con el usuario el 2026-09-08. Cierra la pregunta abierta 1.

### Profesor: un elemento nuevo en «Control Académico»

En `src/utils/autenticacion/navegacion.js`, dentro del grupo `control`, **justo
debajo** de «Observaciones». La entrada vieja **se queda**: conviven hasta que el
usuario ordene retirarla.

```
Control Académico
   ├─ Planilla
   ├─ Asistencia
   ├─ Observaciones          ← la vieja, /Formulario, intacta
   └─ Observador             ← la nueva
```

El profesor ya tiene una asignación elegida en `localStorage.asignacionId`,
igual que hoy. La pantalla nueva lista **solo los nombres** de sus alumnos —una
petición, la que ya hace `usePlanillaObservador`— y al pulsar uno abre su
bitácora completa con **una sola petición más**.

**Ahí es donde muere el fallo del usuario.** La vieja monta un componente por
alumno y cada uno pide lo suyo: 12 peticiones, 16-20 s, y el hook aborta a los
10 s. La nueva pide de uno en uno, cuando se abre.

> **Nota para el futuro**, no una decisión: al entrar así, la asignación **sí**
> se conoce, y con ella la materia. Si algún día se quiere volver a etiquetar
> las anotaciones con su materia, sale gratis y sin preguntarle nada a nadie.
> Ver «Por qué la materia no se muestra».

### Admin: donde ya está, sin mover nada

Estudiantes → ficha del alumno → sección «Observador», en
`src/components/estudiantesObservador/admin/DetalleEstudianteAdmin.jsx`. **Mismo
sitio y mismo aspecto.** Lo único que cambia es de dónde salen los datos: la
bitácora nueva completa —todas las anotaciones, de todos los profesores— en vez
de las observaciones viejas.

Las 68 viejas **no desaparecen**: se copian a la bitácora nueva (fase 4 del
backend, autorizada). Llegan sin marca de positiva/negativa y sin fecha, porque
el modelo viejo no guardaba ninguna de las dos, y se ordenan al final. Sí
conservan profesor, materia y periodo.

## Pantallas

### Vista principal: agrupada por dimensión

Es la que el usuario describió textualmente. Agrupa por campo y dentro lista a
los profesores:

**Los dos niveles se ven igual.** El nivel va **una sola vez** en el título y la
anotación lleva solo profesora, fecha y periodo:

```
OBSERVADOR DE PEPITO PÉREZ · Primaria     Periodo: [Todos ▾]   [Imprimir ▾]

                                      [ Por dimensión | Por fecha ]

━━ CONDUCTUAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔴 Prof. Ana · 20/mar · P1
     Se para mucho.                                  [Editar]

  🔴 Prof. Luis · 18/mar · P1
     Hace desorden.

━━ COGNITIVO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🟢 Prof. Luis · 18/mar · P1
     Mucha creatividad en los trabajos.

  🟢 Prof. Ana · 10/mar · P1
     Mejoró bastante en las tablas.                  [Editar]
```

En preescolar, idéntico; solo cambia la palabra del título:

```
OBSERVADOR DE JUANITO · Preescolar        Periodo: [Todos ▾]   [Imprimir ▾]
```

Un curso **sin nivel** (`null`) no pone nada tras el nombre.

Una anotación aparece bajo **cada dimensión que tenga texto**. Si solo trae
`conductual`, solo sale en ese bloque.

`[Editar]` se pinta **únicamente** si `anotacion.profesor_id` coincide con el
profesor de la sesión. Es comodidad visual: **la regla de verdad la impone el
servidor**, y el frontend no debe ser la única defensa.

### Vista alterna: por fecha

Mismo dato, orden cronológico, lo más nuevo arriba:

```
20/mar · Prof. Ana · Matemáticas · P1 · 🔴
   Conductual: se para mucho.                        [Editar]

18/mar · Prof. Luis · Artística · P1 · 🟢
   Cognitivo: mucha creatividad en los trabajos.
```

Es un **cambio de presentación, no de datos**: se pide una sola vez y se pinta
de dos maneras. No debe provocar una segunda petición.

### Formulario de anotación nueva

- Los tres campos de siempre.
- Un selector obligatorio: `( ) Positiva  ( ) Negativa`.
- El periodo se toma del que esté activo.
- Se mantiene la validación actual: **al menos un campo con contenido**.

## Por qué la materia no se muestra

Decidido con el usuario el 2026-09-08, **después de cambiar de idea dos veces**.
Queda escrito el recorrido porque el porqué importa más que la conclusión.

**Primera idea:** cápsula sutil con la materia en primaria, nada en preescolar.

**Lo que la tumbó fue un dato, no una opinión.** Para poner esa etiqueta hay que
saber de qué materia habla la anotación, y se midió: en `tenant_2005`, solo el
**27%** de los pares profesor-curso tienen **una sola** materia. El **73%**
restante da varias —una profesora da **9** en PRIMERO-A—. En `tenant_colegio_1`
es el 75%. **El servidor no puede deducirla.** No es cuestión de programarlo
mejor: el dato es ambiguo de verdad.

Eso dejaba dos salidas, y ninguna salía gratis:

- **Que la profesora la elija** en cada anotación. Fricción en cada guardado,
  para un dato secundario.
- **Deducirla del sitio desde el que entra** (su planilla de Matemáticas). Sin
  fricción, pero **ata la página a una única puerta de entrada**: dejaría de
  poder abrirse desde un listado de alumnos.

**Decisión: por ahora, ninguna de las dos.** No se muestra la materia y no se le
pide nada a nadie. El nivel en el título, y las anotaciones limpias. El nombre
de la profesora ya dice quién observó.

**Lo que se pierde, dicho claro:** no queda registrado en qué clase pasó. Se
aceptó a conciencia. Si algún día hace falta, la columna `materia` **ya existe
en la base** —se creó ese mismo día antes de este cambio de idea— y está vacía,
esperando. No es código muerto que borrar.

### El nivel, que sí se muestra

Son **tres** casos, no dos:

| Nivel del curso | En el título |
|---|---|
| `preescolar` | «· Preescolar» |
| `primaria` | «· Primaria» |
| **sin nivel** (`null`) | nada |

El tercero no es teórico: al decidirlo había **20 cursos sin nivel** en
`tenant_colegio_1`. No poner nada es la regla que el resto del proyecto ya
aplica: un curso sin nivel definido no fuerza nada. Ver `src/utils/nivelAcademico.js`
y su espejo `app/core/nivel_academico.py`.

**Va una vez en el título y no en cada anotación** porque toda la página es el
mismo niño del mismo curso: repetir la palabra veinte veces es ruido.

**El backend ya lo sirve**: `nivel` llega **fuera** de las anotaciones, y
**también cuando el alumno no tiene ninguna** —que hoy es el caso de todos—, así
que la pantalla siempre puede escribir su título.

## Autocorrección de mayúsculas

Decidido con el usuario:

- Mayúscula en la **primera letra** del texto.
- Mayúscula después de `.`, `?` y `!`.
- **No** después de `,`, `;` ni `:` — pondría «Se para, Hace desorden».
- De paso, arregla los espacios que falten tras el punto.

```
Escribe:   se para mucho.hace desorden.es muy ruidoso
Queda:     Se para mucho. Hace desorden. Es muy ruidoso
```

**Cuándo se aplica: al salir del campo** (`onBlur`), nunca mientras teclea.
Corregir letra por letra hace saltar el cursor y el usuario siente que la
pantalla pelea con él.

El servidor aplica la misma corrección al guardar. El frontend es la comodidad;
el servidor, la garantía. Que la lógica esté en los dos sitios es deliberado.

**Defecto conocido y aceptado:** con abreviaturas se pasa de listo
(`etc. y luego` → `etc. Y luego`). Es raro en una observación y todos los
sistemas que hacen esto lo tienen. No se complica por eso.

## Impresión

Se **reutiliza** `DocumentoImprimible` (`src/components/impresion/`), que ya
acepta `tipo="observaciones"` y aplica la identidad del colegio (logo, colores)
y la plantilla activa. No hay que construir nada nuevo.

```
[ Imprimir ▾ ]
   ├─ Todo el observador
   └─ Solo mis anotaciones
```

- **Todo el observador** — anotaciones de todos los profesores. Es el documento
  oficial que va a la carpeta del alumno.
- **Solo mis anotaciones** — únicamente las de quien imprime. Para una reunión
  con el acudiente sobre su materia.

**Se imprime lo que se está viendo.** Si el selector marca «Periodo 2», sale el
periodo 2; si marca «Todos», sale el año completo. Sin sorpresas.

Firmas, decididas con el usuario:

| Reporte | Firmas |
|---|---|
| Todo el observador | Director de grupo (o coordinador) · Acudiente |
| Solo mis anotaciones | Ese profesor · Acudiente |

## Invariantes

1. **Una sola petición** para pintar la bitácora. Cambiar de vista o de
   agrupación **no** dispara otra.
2. **No hay botón de borrar** en ninguna vista.
3. `[Editar]` solo en anotaciones propias — y es cosmético: la regla vive en el
   servidor.
4. El selector de periodo **nunca oculta** historial: siempre existe «Todos».
5. La autocorrección se aplica **al salir del campo**, jamás en cada tecla.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Construir la pantalla antes de que existan los endpoints | Backend primero. No empezar la fase 2 sin la fase 2 del backend cerrada |
| Quitar la pantalla vieja antes de que la nueva funcione | La vieja se deja intacta hasta que la nueva esté verificada |
| Reaparece el N+1 si se lista el curso con las bitácoras de todos | La página es de **un** estudiante. Si algún día se hace un listado, se diseña aparte |
| La autocorrección estropea texto ya escrito al editar | Aplicarla solo al salir de un campo que el usuario tocó, no al cargar |

## Cómo quedó construida la fase 1

Cinco cosas que no estaban escritas antes y que conviene no volver a discutir.

**Módulo aparte, no dentro de `estudiantesObservador/`.** El código nuevo vive
en `services/observadorApi.js`, `hooks/observador/`, `components/observador/`,
`utils/observador/` y `pages/Observador.jsx`. El motivo es la fase 4: cuando el
usuario ordene retirar la pantalla vieja, se borra `estudiantesObservador/` sin
arrastrar nada de esto. Mezclarlos habría convertido esa limpieza en una
operación delicada.

**El buscador de la lista filtra en local.** La lista de alumnos llega en una
petición —la que ya hacía la planilla— y escribir en el buscador no vuelve a
preguntar nada. Tampoco hay botón «Buscar»: filtra al teclear. La pantalla vieja
obligaba a pulsarlo.

**Cambiar de periodo sí vuelve a consultar; cambiar de agrupación, no.** El
filtro lo aplica el servidor, que para eso acepta `?periodo=N`. Las respuestas
que llegan tarde se descartan, así que cambiar rápido de periodo no deja la
pantalla mostrando el anterior. El invariante 1 habla de la agrupación y la
vista, no del periodo: son consultas distintas.

**Un periodo roto nunca deja al alumno sin bitácora.** `periodoParaConsulta`
devuelve «el año entero» ante cualquier valor que no sea 1-4. Si mandara la
etiqueta rota, el servidor respondería `422` y la profesora vería un error en
vez de su historial.

**Tres estados que no se pueden confundir**, y hay prueba de cada uno:

| Lo que pasa | Lo que dice la pantalla |
|---|---|
| Cargando | «Cargando el observador...» |
| `404` del servidor | «No encontramos a ese estudiante.» |
| Lista vacía, sin filtro | «Todavía nadie le ha escrito nada a este estudiante.» |
| Lista vacía, con periodo filtrado | «No hay anotaciones en este periodo. Elige «Todos» para ver el año entero.» |

Las dos últimas filas son la misma respuesta del servidor y **dicen cosas
distintas a propósito**: el periodo no puede ocultar historial en silencio, así
que si el filtro está puesto la pantalla dice en voz alta cómo ver el año
entero.

**Las heredadas se marcan «Sin marcar», con un círculo blanco.** Decisión de
presentación tomada al construir: las copiadas de la tabla vieja llegan con
`positiva` en `null` y sin fecha. Se muestran con ⚪ y «Sin fecha» en vez de
elegirles un color o inventarles un día. Un `false` —negativa de verdad— nunca
se pinta igual que un `null`, y hay prueba que lo fija.

## Plan de fases (frontend)

**Fase 1 — Lectura — TERMINADA el 2026-09-09**
1. ~~Servicio y hook para `GET /observador/{estudiante_id}`~~:
   `src/services/observadorApi.js` y
   `src/hooks/observador/useObservadorEstudiante.js`.
2. ~~Página nueva con la vista por dimensión~~: `src/pages/Observador.jsx` y
   `src/components/observador/`.
3. ~~Selector de periodo con «Todos» por defecto~~.
4. ~~Entrada del profesor~~: ruta `/observador` en `src/App.jsx` y el elemento
   «Observador» en `src/utils/autenticacion/navegacion.js`, justo debajo de
   «Observaciones». La vieja se queda.
5. ~~Pruebas~~: 76, verificadas con mutaciones. Compuerta completa en verde:
   **1648 pruebas**, `lint` y `build`.

**Lo que la fase 1 NO hizo, y hay que saberlo:**

- **La entrada del admin sigue como estaba.** `DetalleEstudianteAdmin.jsx`
  continúa mostrando las observaciones viejas. Cambiarle el origen de los datos
  toca una pantalla que ya funciona, así que se hace aparte y con su propia
  orden.
- **No se probó contra producción**, porque el backend de esta funcionalidad
  **todavía no está publicado**: los seis commits que lo implementan siguen sin
  subir. La base de datos sí tiene la tabla. Contra `localhost` la pantalla
  funciona.

**Fase 2 — Escritura** (requiere fase 3 del backend: **lo está desde el
2026-09-08**)
4. Formulario de anotación nueva con el selector positiva/negativa.
5. Edición de anotación propia.
6. Autocorrección de mayúsculas en `onBlur`.

**Fase 3 — Presentación**
7. Botón de cambio a vista por fecha.
8. Impresión con las dos opciones.

**Fase 4 — Retirada** (solo cuando el usuario lo confirme)
9. Quitar la pantalla vieja (`src/pages/Formulario.jsx` y los componentes de
   `src/components/estudiantesObservador/` que queden sin uso, incluido
   `useCargaObservacionVisible`, que existe únicamente para disimular el N+1).

## Preguntas abiertas

1. ~~**¿Desde dónde se entra a la página?**~~ **Resuelta el 2026-09-08**, ver
   «Por dónde se entra». El profesor, por un elemento nuevo en Control
   Académico; el admin, por donde ya entra hoy. **Esta lista se quedó sin
   actualizar ese día y decía que seguía abierta; queda corregido.**
2. ~~**¿La pantalla vieja se retira o convive?**~~ **Conviven**, decidido el
   2026-09-08, hasta que el usuario ordene retirarla. Es la fase 4.
3. **¿Qué periodo se usa al escribir si el profesor no tiene ninguno guardado?**
   Hoy `obtenerPeriodoProfesor` cae a `"1"`. **No afecta a la fase 1**: la
   lectura arranca en «Todos» y sin periodo el servidor devuelve el año entero,
   así que la pantalla nunca depende de ese valor. Sí hay que responderla
   **antes de la fase 2**, porque una anotación nueva sí nace con un periodo
   encima y esa etiqueta se queda escrita.

## Entrega para el siguiente chat

- Última acción terminada: **Fase 1 (lectura), el 2026-09-09.** Existe la
  pantalla `/observador`: lista de alumnos con una petición, bitácora del alumno
  al abrirlo, agrupada por dimensión, con el nivel en el título y el selector de
  periodo en «Todos». 76 pruebas propias, verificadas con mutaciones. Compuerta
  completa en verde: **1648 pruebas**, `pnpm run lint` y `pnpm run build`.
- **Sin publicar, en los dos repos.** El backend de esta funcionalidad tiene
  seis commits locales sin subir y **no está desplegado**; este repo tiene los
  suyos. La base de datos de producción **sí** tiene ya la tabla y sus índices,
  aplicados el 2026-09-08. Orden correcto para publicar: **primero el backend**,
  después el frontend. Al revés, la pantalla nueva pediría un endpoint que en
  producción no existe.
- **La bitácora está vacía.** Falta ejecutar, en el repo del backend, la
  migración `20260908_observador_anotaciones_historicas.sql` y después
  `scripts/copiar_observaciones_al_observador.py`, que trae las 68 anotaciones
  viejas. Hasta entonces la pantalla nueva dirá, con razón, que nadie ha escrito
  nada. Comprobar con `SELECT count(*) FROM <tenant>.observador_anotaciones`.
- **El fallo original sigue vivo en la pantalla vieja**, y seguirá mientras
  `/Formulario` sea la que usan los profesores. La nueva no lo hereda: convierte
  doce peticiones en una, y hay prueba que lo fija por aserción
  (`src/pages/Observador.test.jsx`).
- Lo que **no** hace todavía esta pantalla: escribir, editar, la vista por
  fecha, imprimir, y la autocorrección de mayúsculas. Son las fases 2 y 3.
- **La entrada del admin sigue sin tocar.** `DetalleEstudianteAdmin.jsx` lee
  todavía las observaciones viejas. Cambiarle el origen de los datos es un paso
  aparte, sobre una pantalla que hoy funciona, y necesita su propia orden.
- Contrato que consume la pantalla, por si hay que revisarlo:
  `GET /observador/{estudiante_id}` → `{"nivel": ..., "anotaciones": [...]}`,
  `?periodo=N` opcional entre 1 y 4, `404` solo si el estudiante no existe.
  `nivel` llega **fuera** de las anotaciones y también cuando no hay ninguna.
- Contratos de escritura que la fase 2 va a necesitar, ya listos en el
  servidor:
  - `POST /observador` → `201` con `{"id": N}`. Cuerpo: `estudiante_id`,
    `periodo` (1-4), `positiva`, y los tres campos de texto. **No mandes
    `profesor_id`**: sale del token y el servidor ignora el del cuerpo. El
    cuerpo **no** lleva `asignacion_id` ni `materia`.
  - `PUT /observador/{anotacion_id}` → cuerpo: `positiva` y los tres textos.
    **No** lleva `estudiante_id` ni `periodo`. `403` si la anotación no es tuya,
    `404` si no existe.
  - **No existe `DELETE`**, y no debe pedirse.
  - El servidor aplica la misma autocorrección de mayúsculas al guardar
    (`app/core/texto_observador.py`), así que la de la pantalla es comodidad y
    no la garantía.
  - `profesor_id` viaja en cada anotación para que la pantalla decida si pinta
    `[Editar]`. Es **cosmético**: la regla de verdad la impone el servidor.
- Siguiente acción exacta: que el usuario **autorice la Fase 2** (escribir y
  editar). Antes de empezarla hay que responder la pregunta abierta 3: qué
  periodo lleva una anotación nueva si el profesor no tiene ninguno guardado.
  Una instrucción genérica como «continúa» no basta.
