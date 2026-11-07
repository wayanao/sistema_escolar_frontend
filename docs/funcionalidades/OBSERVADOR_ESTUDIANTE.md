# Funcionalidad: Observador del estudiante unificado — Frontend

## Control

- Estado: **Fases 1, 2 y 3 terminadas.** Las dos primeras el 2026-09-09 -leer y
  escribir-, y la 3 el 2026-09-10: vista por fecha e impresión. Solo queda la
  fase 4, retirar la pantalla vieja, que **espera tu orden**. Ese mismo 09 la
  pantalla **dejó de depender de una clase elegida**. El profesor entra por «Observador»
  en Control Académico, ve a **todos** sus alumnos agrupados por curso, abre uno,
  lee su bitácora agrupada por dimensión, añade anotaciones y corrige las suyas.
  El **admin ya ve la misma bitácora que el profesor** en la ficha del alumno,
  en solo lectura, desde el 2026-09-10. Ese mismo día **se ocultó la pantalla
  vieja**: fuera del menú y con su dirección redirigida a la nueva. Su código
  sigue entero.
- Tipo: Función nueva de producto. **No** es un módulo de la migración
  arquitectónica de `docs/modularizacion/` y no debe confundirse con uno.
- Repos afectados: este repo (`frontend-react`) y `sistema_escolar_api`. Ver
  también `sistema_escolar_api/docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`,
  que cubre tabla, endpoints y permisos. **El backend va primero**: esta
  pantalla no debe depender de endpoints que no existan.
- Riesgo inicial: Medio. Sustituye una pantalla que los profesores usan hoy.
- Última actualización: 2026-09-10.

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
| 6 | ~~Cada anotación se marca **positiva o negativa**~~ **Revertida el 2026-09-09**: se quitó. Ver «Por qué se quitó la marca» |
| 7 | Vista principal **agrupada por dimensión**; botón para ver por fecha |
| 8 | El selector de periodo **no oculta** nada; incluye la opción «Todos» |
| 9 | Autocorrección de mayúsculas **al salir del campo**, no mientras escribe |
| 10 | Impresión con dos opciones: **todo** o **solo mis anotaciones** |
| 11 | **La materia no se muestra**, y por ahora ni se guarda | Decidido el 2026-09-08, después de darle dos vueltas. Ver abajo |
| 12 | **El nivel del curso va en el título**, en los dos niveles | «Pepito · Primaria», «Juanito · Preescolar». Una vez, no en cada anotación |
| 13 | **El periodo de una anotación nueva sale del Dashboard** | Decidido el 2026-09-09. No se pregunta y no se puede cambiar en el formulario. Ver abajo |
| 14 | **Es una pestaña suelta del menú**, no un hijo de Control Académico | Decidido el 2026-09-09. Ese grupo son tareas de la clase elegida, y esta pantalla ya no depende de ninguna |

## Por dónde se entra

Decidido con el usuario el 2026-09-08. Cierra la pregunta abierta 1.

### Profesor: un elemento nuevo en «Control Académico»

En `src/utils/autenticacion/navegacion.js`, como **pestaña suelta**, fuera de
Control Académico. La entrada vieja **se queda** dentro del grupo: conviven hasta
que el usuario ordene retirarla.

```
Dashboard
Control Académico
   ├─ Planilla
   └─ Asistencia
Planeación Académica
Observador                   ← la nueva, suelta
Boletín Final
```

> **La vieja se ocultó el 2026-09-10.** «Observaciones» salió del menú, en
> escritorio y en móvil, y `/Formulario` **redirige a `/observador`**: quien
> tuviera la dirección guardada llega a donde quería ir, no a una página en
> blanco. **El código sigue entero**: ocultar es quitar tres líneas, y volver
> atrás es devolverlas. Borrarlo es la fase 4 y sigue sin hacerse.

Los dos grupos van juntos y las pestañas sueltas después. El orden se fijó así
el 2026-09-09, a petición del usuario.

> **Movida fuera del grupo el 2026-09-09**, a petición del usuario. Nació dentro
> de Control Académico, donde están las tareas de **la clase elegida**: planilla,
> asistencia, observaciones. El Observador dejó de ser eso el mismo día —es una
> pantalla **por estudiante** y ya no depende de ninguna clase—, así que estaba
> en el cajón equivocado.

**El menú móvil está escrito a mano**, en `NavProfesorView.jsx`, aparte de
`PROFESOR_DESKTOP_ITEMS`. Un elemento nuevo puede quedarse solo en escritorio sin
que nadie lo note: pasó con este entre el 2026-09-09 y esa misma tarde. Hay
prueba que exige que aparezca en los dos.

> **Ya no aplica desde el 2026-11-04:** el menú lateral arma PC, tablet y
> celular con `PROFESOR_DESKTOP_ITEMS`, y `NavProfesorView.jsx` se borró. En el
> celular el Observador va en la barra de abajo (`PROFESOR_BARRA_INFERIOR`).

La pantalla lista **solo los nombres** de sus alumnos —una petición— y al pulsar
uno abre su bitácora completa con **una sola petición más**.

> **Corregido el 2026-09-09.** Esto decía que la pantalla usaba la asignación
> elegida en `localStorage.asignacionId`, y así se construyó. El usuario lo
> cuestionó —«no quiero que dependa de la asignación»— y tenía razón: el
> observador es del niño, no de la materia. Ahora la lista sale de
> `GET /observador/mis-estudiantes` y trae a los alumnos de **todos** sus
> cursos. Ver «Entrar sin elegir clase», más abajo.

**Ahí es donde muere el fallo del usuario.** La vieja monta un componente por
alumno y cada uno pide lo suyo: 12 peticiones, 16-20 s, y el hook aborta a los
10 s. La nueva pide de uno en uno, cuando se abre.

> **Esta nota quedó obsoleta el 2026-09-09.** Decía que, al entrar por una
> asignación, la materia se conocía gratis y se podría volver a etiquetar las
> anotaciones con ella. Ya no: la pantalla entra sin clase, así que **la materia
> no se conoce por la puerta de entrada**. Si algún día se quiere, habrá que
> preguntársela a la profesora. Es exactamente el precio que se pagó, y se pagó
> a sabiendas.

### Admin: donde ya está — HECHO el 2026-09-10

Estudiantes → ficha del alumno → sección «Observador», en
`src/components/estudiantesObservador/admin/DetalleEstudianteAdmin.jsx`. **Mismo
sitio**: el coordinador no tiene que ir a ninguna pantalla nueva, y las notas,
las deudas y el inventario del alumno siguen al lado.

Lo que cambió es **qué** ve ahí. Antes: una lista plana de registros de la tabla
vieja, cada uno con su materia. Ahora: **la misma vista que ve la profesora**,
montada tal cual —`VistaObservadorEstudiante`—, con la bitácora completa de
todos los profesores.

**Se reutiliza el componente entero, no una copia parecida.** Es lo único que
garantiza que el coordinador vea exactamente lo mismo; dos pantallas separadas
acabarían diciendo cosas distintas del mismo niño.

Tres diferencias, todas porque **el admin solo mira** (decisión 9):

| | Profesor | Admin |
|---|---|---|
| Escribir y corregir | Sí, lo suyo | **No.** El servidor responde `403`, y ni se le pintan los botones |
| Imprimir | Las dos opciones | **Solo el documento general.** «Solo mis anotaciones» le saldría en blanco: no tiene ninguna |
| Título y «Volver a la lista» | Sí | No: la ficha ya dice de quién es |

Decidido con el usuario el 2026-09-10: «que el admin vea todo centralizado del
estudiante».

Las 68 viejas **no desaparecen**: ya están copiadas en la bitácora nueva. Llegan
sin fecha porque el modelo viejo no la guardaba, y se ordenan al final. Sí
conservan profesor, materia y periodo.

> **Detalle que se descubrió mirando los datos reales**: las profesoras
> escribían la fecha **dentro del texto** («07 de septiembre de 2026 ⏎ Durante el
> desarrollo…»), porque el sistema viejo no la guardaba. Con la bitácora nueva ya
> no les hace falta.

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
  Prof. Ana · 20/mar · P1        ← el nombre, en el color de Ana
     Se para mucho.                                  [Editar]

  Prof. Luis · 18/mar · P1
     Hace desorden.

━━ COGNITIVO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Prof. Luis · 18/mar · P1
     Mucha creatividad en los trabajos.

  Prof. Ana · 10/mar · P1
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
20/mar · Prof. Ana · P1
   Conductual: se para mucho.                        [Editar]

18/mar · Prof. Luis · P1
   Cognitivo: mucha creatividad en los trabajos.
```

> El dibujo original llevaba la materia y el círculo de color. Los dos
> desaparecieron después —la materia el 2026-09-08, la marca el 2026-09-09—, y
> el dibujo se corrigió al construir la vista, en la fase 3.

Es un **cambio de presentación, no de datos**: se pide una sola vez y se pinta
de dos maneras. No debe provocar una segunda petición.

### Formulario de anotación nueva

- Los tres campos de siempre.
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

## Por qué se quitó la marca de positiva o negativa

Decidido por el usuario el 2026-09-09. **Revierte la decisión 6**, que era una de
las que el documento pedía no reabrir; el usuario es quien las tomó y quien las
puede cambiar.

Se quitó **del todo**: ni se pregunta al guardar, ni se pinta el círculo de
color al leer. Media medida no valía: dejar solo la parte de mostrar habría
puesto un ⚪ «sin marcar» permanente en cada anotación nueva, que es ruido.

**La columna `positiva` no se borra.** Se jubila, como `materia`:

- sigue en la tabla y el endpoint la sigue devolviendo, así que volver atrás es
  cambiar solo la pantalla, sin otra migración;
- las filas nuevas nacen con `NULL`;
- **las cuatro que ya tenían marca la conservan.** Editar una anotación ya **no**
  toca ese campo, así que corregir una tilde no borra lo que hubiera.

Efecto secundario bueno: **corregir una heredada ya no obliga a marcarla.** Antes
el `PUT` exigía la marca, así que arreglar una errata en una anotación copiada de
la tabla vieja obligaba a inventarle una etiqueta que nunca tuvo.

## Un color por profesor

Pedido por el usuario el 2026-09-10, para distinguir de un vistazo quién escribió
cada anotación. **Solo frontend**: el `profesor_id` ya venía en cada anotación.

Se colorea **el nombre**, y solo el nombre; la fecha y el periodo se quedan
grises. El nombre sigue escrito, así que **el color acompaña, no sustituye**:
quien no distinga dos tonos lee exactamente lo mismo que antes.

**El color sale del `profesor_id`, no del nombre.** El id es estable: dos
profesoras que se llamen igual no comparten color, cambiarle el nombre a una no
le cambia el suyo, y el mismo profesor sale del mismo tono en la bitácora de
todos sus alumnos. Eso último es lo que hace que el color signifique algo.

### Lo simple ganó, y se midió

El reparto es `profesor_id % 8`. Antes de elegirlo se comprobó contra los **16
cursos reales** de los dos colegios:

| Reparto | Cursos con dos profesores del mismo color |
|---|---|
| Resto (`id % 8`) | **0 de 16** |
| Hash multiplicativo | **6 de 16** |

El hash parecía más fino y era peor. El motivo: los profesores de un mismo curso
tienen ids seguidos —39, 40, 42, 44—, y el resto los separa uno a uno mientras
que el hash los revuelve y los junta. Ocho colores sobran: el curso con más
docentes tiene **5**.

### La trampa de Tailwind

Las clases van escritas **enteras y literales** en `coloresProfesor.js`. Tailwind
lee el código fuente para decidir qué CSS genera, así que componerlas
—`` `text-${color}-700` ``— las dejaría fuera de la hoja de estilos: el nombre
saldría sin color y **ningún error lo avisaría**.

Hay prueba que lo fija, y **lee el archivo**, no el valor: componerlas da
exactamente la misma cadena en memoria. La primera versión de esa prueba
comprobaba el valor y no detectaba la mutación; se corrigió. Además, tras
`pnpm run build` se verificó que los ocho colores aparecen en el CSS generado.

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
  con el acudiente.

> La versión anterior decía «para una reunión sobre **su materia**». Quedó
> obsoleta el 2026-09-08, cuando se decidió que la anotación no guarda la
> materia. Corregido al construir la fase 3.

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

> **Este párrafo quedó obsoleto el 2026-09-09**, cuando se quitó la marca. Decía
> cómo se pintaban las heredadas —⚪ «Sin marcar»— frente a una negativa de
> verdad. Hoy no se pinta ninguna. Lo que sigue vigente es «Sin fecha»: las
> heredadas no tienen fecha y no se les inventa.

## Cómo quedó construida la fase 2

**El periodo de una anotación nueva sale del Dashboard.** Decisión 13, tomada
por el usuario el 2026-09-09 sobre tres opciones. Se descartó poner un selector
en el formulario -«para que no haya embolate»-.

Es un dato **irreversible**: `PUT` no cambia el periodo y `DELETE` no existe, así
que una etiqueta equivocada se queda escrita para siempre. Consecuencias que se
asumieron y hay que conocer:

- Si el profesor **nunca eligió** periodo -docente nuevo, navegador nuevo, datos
  borrados-, `obtenerPeriodoProfesor` cae al **1**, y la anotación nace
  etiquetada como periodo 1 aunque el colegio vaya por el 3. **Deuda anotada, no
  corre prisa**: si un día aparece, la salida es la tercera opción que se
  descartó -no dejar guardar hasta que elija-.
- Lo que sí se hizo, sin añadir un control: el formulario **dice** en qué
  periodo va a quedar («Se guardará en el Periodo 3, el que tienes activo»).
  Informar no es preguntar, y un dato que no se puede corregir después tiene que
  poder verse antes.

**El selector de la pantalla y el periodo de escritura son cosas distintas.** El
selector filtra lo que se ve; el del Dashboard etiqueta lo que se escribe. Si al
guardar el selector estaba filtrando otro periodo, lo recién escrito no
aparecería y la profesora creería que no se guardó, así que **la pantalla pasa
sola a «Todos»**. Cambiar el selector ya dispara la recarga, de modo que sigue
siendo una sola petición. Hay prueba que cuenta las peticiones.

**El formulario se pinta una sola vez, arriba.** Vale para una anotación nueva y
para corregir una propia. No se pinta en el sitio de la anotación porque una
anotación aparece bajo **cada** dimensión que tenga texto: el formulario saldría
tres veces.

**La corrección de mayúsculas solo toca campos que la profesora tocó.** Abrir
una anotación vieja y pasar por encima de un campo sin escribir nada **no** le
reescribe el texto. Era el riesgo que el documento tenía anotado desde el
diseño. `useFormularioAnotacion` lleva la cuenta de los campos tocados, y
`reiniciar` la borra: sin eso, cerrar un formulario y abrir otro arrastraría la
marca.

**El espejo con el servidor se comprobó, no se supuso.**
`src/utils/observador/texto.js` y `app/core/texto_observador.py` se ejecutaron
sobre los mismos once casos —incluidos «¿por qué», «ávila», «mide 1.75 metros» y
la abreviatura «etc.»— y devolvieron exactamente lo mismo.

**Un 422 de FastAPI no se le enseña a nadie.** Los errores conocidos del
servidor -403, 404- traen un texto listo para mostrar y se muestra tal cual. Un
422 de validación llega como lista de objetos con nombres internos, así que en
ese caso sale un mensaje propio.

**Editar una heredada obliga a marcarla.** Las copiadas de la tabla vieja no
traen positiva ni negativa, y el `PUT` la exige. Al abrirlas para corregir, el
formulario arranca sin marca y no deja guardar hasta elegir una.

## Entrar sin elegir clase

Añadido el 2026-09-09, a petición del usuario: «no quiero que dependa de la
asignación».

**La premisa era correcta.** La anotación no guarda nada de la materia. La clase
solo servía para saber a quién listar, porque el único endpoint que lo hacía era
`GET /planilla/{asignacion_id}`.

Las dos salidas sin tocar el backend estaban descartadas, y por motivos fuertes:

- **Pedir las clases y luego los alumnos de cada una.** Con 6 cursos son **7
  peticiones**. Sería reconstruir el N+1 justo en la pantalla que existe para
  matarlo.
- **`GET /estudiantes`.** Devuelve **todos los niños del colegio**, sin filtrar
  por profesor.

Así que se añadió `GET /observador/mis-estudiantes` en el backend. Detalles en
`sistema_escolar_api/docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.

**Salió más rápido que lo que reemplaza**, medido contra la base real con un
profesor de 6 cursos:

| Petición | Qué devuelve | Tiempo |
|---|---|---|
| `GET /observador/mis-estudiantes` | **81 alumnos, 6 cursos** | **1,35 s** |
| `GET /planilla/212`, lo de antes | los de **una** clase | 2,0 – 3,3 s |

### La lista va agrupada por curso

81 nombres seguidos no se leen. Se agrupan por curso, con el número de alumnos
al lado del encabezado, y el buscador arriba filtra en local sin volver a
preguntar nada.

El orden lo pone el servidor —curso y apellido—; el frontend solo parte la lista
en bloques y **no reordena**.

### Lo que se quitó

- La pantalla ya no lee `localStorage.asignacionId`, y ya **no** suelta el
  `alert` que echaba al inicio cuando no había clase elegida. Hay prueba de que
  no aparece ni aunque haya una guardada.
- Ya no usa `usePlanillaObservador`. Ese hook **no se toca**: la pantalla vieja
  (`/Formulario`) lo sigue usando y se irá con ella en la fase 4.

### Un 403 no es un fallo

Si quien entra no es profesor, el servidor responde `403` y la pantalla dice
«Esta pantalla es para profesores. Abre el observador desde la ficha del
estudiante», que es la verdad: el admin entra por ahí. Cualquier otro fallo dice
otra cosa y ofrece reintentar.

## Cómo quedó construida la fase 3

**Las dos vistas comparten el encabezado.** Quién escribió la anotación y cuándo
vive en `EncabezadoAnotacion.jsx`, que usan las dos. Si cada una lo dibujara por
su cuenta, podrían acabar diciendo cosas distintas de la misma anotación.

**La vista por fecha es la de dimensión del revés.** Por dimensión, una anotación
se **reparte** entre varios bloques —uno por cada campo con texto—; por fecha,
una anotación es **una tarjeta** que enumera sus campos. Mismo dato, dos maneras
de mirarlo: cambiar de vista **no pide nada al servidor**, y hay prueba que
cuenta las peticiones.

**No se reordena nada.** El servidor ya manda las anotaciones de la más nueva a
la más vieja, con las heredadas —que no tienen fecha— al final. La vista por
fecha solo descarta las que no tienen texto.

### La impresión

**Se reutiliza `DocumentoImprimible`**, que ya aplica la identidad del colegio
—logo, colores— y la plantilla activa para `tipo="observaciones"`. No se
construyó ningún impreso nuevo, tal y como decía el diseño.

**Sale lo que se está viendo**, y son dos cosas: el periodo del selector **y** la
agrupación que esté puesta. El menú de imprimir solo decide **de quién** son las
anotaciones, nunca de cuándo.

**En papel no se pinta el color del profesor.** Un documento que puede acabar
fotocopiado en blanco y negro no puede apoyarse en el color, y no hace falta: el
nombre está escrito. Hay prueba que lo fija.

**El periodo va escrito en el subtítulo** —«Año completo» o «Periodo 2»—. El
impreso se archiva y se enseña meses después: sin eso, nadie sabría si tiene
delante el año entero o un trozo.

Un detalle que la prueba encontró y el código no tenía: un periodo inesperado
imprimía **«Periodo undefined» en papel**. Ahora `etiquetaPeriodoImpreso`
reutiliza la misma validación que decide qué se le pide al servidor, así que todo
lo que no sea 1-4 sale como «Año completo», que es justo lo que la pantalla está
enseñando.

**Si no hay nada que imprimir lo dice**, en vez de sacar una hoja con membrete y
firmas vacía. Pasa de verdad con «Solo mis anotaciones» cuando el profesor aún no
ha escrito ninguna.

### Un detalle del compilador de React

La pantalla decide entre el impreso y la vista normal con un **ternario en el
único `return`**, no con un `return` temprano. `pnpm run lint` rechaza el
segundo: el compilador de React no puede conservar la memoización si el
componente vuelve antes de tiempo.

## Ocultar la pantalla vieja, que no es retirarla

Hecho el 2026-09-10, a petición del usuario. **Son dos cosas muy distintas y
conviene no confundirlas:**

| | Ocultar (hecho) | Retirar (fase 4, pendiente) |
|---|---|---|
| Qué pasa | Sale del menú y su dirección redirige | Se borra el código |
| Volver atrás | Devolver tres líneas | Recuperar de git |

Son **tres sitios**, no uno:

1. `src/utils/autenticacion/navegacion.js` — el menú de escritorio.
2. `src/components/autenticacion/NavProfesorView.jsx` — el menú móvil, que en
   este proyecto **está escrito a mano aparte**. Ya se olvidó una vez.
3. `src/App.jsx` — la ruta.

**La dirección se conserva y redirige a `/observador`**, en vez de borrarla. Una
profesora con la página guardada en su navegador llega a donde quería ir; si se
borrara la ruta, vería una página en blanco sin entender por qué. Hay prueba en
`src/App.test.jsx` que lo fija.

### Por qué esto importaba más de lo que parece

Mientras las dos pantallas convivían, **lo que se escribía en la vieja no
aparecía en la nueva** hasta volver a ejecutar el script de copia. No se perdía
nada, pero el observador nuevo iba con retraso. Ocultar la vieja corta esa
divergencia de raíz.

De hecho pasó: entre la primera copia y el día de publicar, las profesoras
escribieron **4 observaciones más** en la vieja. El script las recogió sin
duplicar nada, que es justo para lo que se hizo idempotente.

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
   «Observaciones». La vieja se queda. **El 2026-09-09 dejó de exigir una clase
   elegida**, ver «Entrar sin elegir clase».
5. ~~Pruebas~~: 61 propias, más una existente del menú actualizada, todas
   verificadas con mutaciones. Compuerta completa en verde: **1648 pruebas**,
   `lint` y `build`.

**Lo que la fase 1 NO hizo, y hay que saberlo:**

- **La entrada del admin sigue como estaba.** `DetalleEstudianteAdmin.jsx`
  continúa mostrando las observaciones viejas. Cambiarle el origen de los datos
  toca una pantalla que ya funciona, así que se hace aparte y con su propia
  orden.
- **No se probó contra producción**, porque el backend de esta funcionalidad
  **todavía no está publicado**: los seis commits que lo implementan siguen sin
  subir. La base de datos sí tiene la tabla. Contra `localhost` la pantalla
  funciona.

**Fase 2 — Escritura — TERMINADA el 2026-09-09**
4. ~~Formulario de anotación nueva con el selector positiva/negativa~~:
   `src/components/observador/FormularioAnotacionObservador.jsx` y
   `src/hooks/observador/useFormularioAnotacion.js`.
5. ~~Edición de anotación propia~~: `[Editar]` solo en las propias, y
   `src/hooks/observador/useComandosObservador.js` para las dos escrituras.
6. ~~Autocorrección de mayúsculas en `onBlur`~~: `src/utils/observador/texto.js`,
   espejo comprobado de `app/core/texto_observador.py`.
7. ~~Pruebas~~: 56 nuevas, verificadas con mutaciones. Compuerta completa en
   verde: **1705 pruebas**, `lint` y `build`.

**Fase 3 — Presentación — TERMINADA el 2026-09-10**
7. ~~Botón de cambio a vista por fecha~~:
   `src/components/observador/AnotacionCronologica.jsx` y el conmutador de la
   vista. **No dispara ninguna petición**, y hay prueba que las cuenta.
8. ~~Impresión con las dos opciones~~:
   `src/components/observador/ObservadorImprimible.jsx` y
   `src/utils/observador/impresion.js`.
9. ~~Pruebas~~: 38 nuevas, verificadas con mutaciones. Compuerta completa en
   verde: **1778 pruebas**, `lint` y `build`.

**Fase 4 — Retirada** (solo cuando el usuario lo confirme)
9. Quitar la pantalla vieja (`src/pages/Formulario.jsx` y los componentes de
   `src/components/estudiantesObservador/` que queden sin uso, incluido
   `useCargaObservacionVisible`, que existe únicamente para disimular el N+1).

## Guardar con una sola espera (2026-11-07)

Pedido del usuario: que guardar en el observador sea "enseguida" y sin
"muchos pasos", como en Gestión de Pagos. Al oprimir "Guardar" sale la
tarjeta «Guardando anotación…» (o «Guardando corrección…») y pasa a
«Anotación guardada» (o «corregida») sin cerrarse; el formulario se cierra y
la bitácora se recarga como antes. Si falla, la tarjeta se quita y el error
sale en el formulario, que conserva lo escrito. El botón ya no dice
"Guardando...", solo se bloquea. Lo hace `useComandosObservador.js` con
`mostrarEspera` (`src/hooks/ventanaExito.js`). La pantalla vieja
(`Observaciones.jsx`, oculta desde el 2026-09-10) no se tocó para esto.

## Preguntas abiertas

1. ~~**¿Desde dónde se entra a la página?**~~ **Resuelta el 2026-09-08**, ver
   «Por dónde se entra». El profesor, por un elemento nuevo en Control
   Académico; el admin, por donde ya entra hoy. **Esta lista se quedó sin
   actualizar ese día y decía que seguía abierta; queda corregido.**
2. ~~**¿La pantalla vieja se retira o convive?**~~ **Conviven**, decidido el
   2026-09-08, hasta que el usuario ordene retirarla. Es la fase 4.
3. ~~**¿Qué periodo se usa al escribir si el profesor no tiene ninguno
   guardado?**~~ **Resuelta el 2026-09-09: el del Dashboard**, y si no hay
   ninguno, el `"1"` al que `obtenerPeriodoProfesor` ya cae hoy. Sin selector en
   el formulario. Ver «Cómo quedó construida la fase 2» para lo que eso implica
   y cuál sería la salida si algún día molesta.

**No queda ninguna abierta.** La única deuda anotada es la de arriba: un
profesor sin periodo guardado escribe en el 1 sin enterarse. No corre prisa.

### ~~Deuda: la asignación como única puerta~~ — RESUELTA el 2026-09-09

La pantalla exigía una asignación elegida, y el usuario preguntó por qué si el
observador no depende de la materia. Tenía razón, y se arregló el mismo día: se
añadió `GET /observador/mis-estudiantes` en el backend y la pantalla dejó de
leer `localStorage.asignacionId`. Ver «Entrar sin elegir clase».

## Entrega para el siguiente chat

- Última acción terminada: **se ocultó la pantalla vieja**, el 2026-09-10.
  Fuera del menú -escritorio y móvil- y `/Formulario` redirigido a
  `/observador`. **Su código sigue entero**: ocultar no es retirar.
- Compuerta completa en verde: **1794 pruebas**, `pnpm run lint` y
  `pnpm run build`. 54 nuevas ese día, verificadas con mutaciones.
- **El observador está completo para los dos roles.** El profesor lee, escribe,
  corrige, cambia de vista e imprime, sin depender de ninguna clase elegida; el
  coordinador ve lo mismo en la ficha del alumno, sin poder escribir, e imprime
  el documento general.
- **Sin publicar, en los dos repos.** El backend tiene nueve commits locales sin
  subir. **El backend va primero**: la pantalla depende de
  `GET /observador/mis-estudiantes` y de que el servidor ya no exija la marca de
  positiva o negativa, y ninguna de las dos cosas está en producción.
- Las 68 anotaciones heredadas **ya están copiadas** en la bitácora, y hay
  cuatro filas más de las pruebas del usuario. Nadie borra anotaciones: si esas
  cuatro sobran, hay que quitarlas por base de datos.
- **La ficha del admin ya monta la vista del profesor**, en solo lectura, desde
  el 2026-09-10. Ver «Admin: donde ya está». El admin **no** tiene lista de
  alumnos —recibe un `403`— y no debe tenerla: entra por la ficha del
  estudiante. `detalles.observaciones` de `GET /estudiantes/{id}/detalles`
  **dejó de usarse** en el frontend; el endpoint sigue devolviéndolo y nadie lo
  ha tocado.
- **Las 72 observaciones viejas están copiadas**, incluidas las 4 que las
  profesoras escribieron después de la primera copia. El script es idempotente
  y no duplicó nada, comprobado contando filas de origen repetidas. La tabla
  `observaciones` sigue intacta.
- Lo único que queda del plan es la **fase 4: retirar la pantalla vieja**
  (`src/pages/Formulario.jsx` y lo que quede sin uso en
  `src/components/estudiantesObservador/`, incluido `useCargaObservacionVisible`,
  que existe solo para disimular el N+1). **Espera una orden explícita del
  usuario**, y no debería darse hasta que lo nuevo lleve un tiempo en producción.
- Deudas anotadas, ninguna urgente: un profesor sin periodo guardado escribe en
  el periodo 1 sin enterarse; y el menú móvil de `NavProfesorView.jsx` está
  escrito a mano, aparte de `PROFESOR_DESKTOP_ITEMS` —hay prueba que ata su
  orden, pero la duplicación sigue ahí—.
- Siguiente acción exacta: **publicar**, en orden, o esperar a que el usuario
  ordene la fase 4. Una instrucción genérica como «continúa» no basta para
  retirar la pantalla vieja.
