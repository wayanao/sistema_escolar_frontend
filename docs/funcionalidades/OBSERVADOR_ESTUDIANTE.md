# Funcionalidad: Observador del estudiante unificado — Frontend

## Control

- Estado: **Diseñado, nada implementado.** No hay página, componente ni hook
  nuevo. Este documento recoge las decisiones tomadas con el usuario el
  2026-09-04 y el plan de fases.
- Tipo: Función nueva de producto. **No** es un módulo de la migración
  arquitectónica de `docs/modularizacion/` y no debe confundirse con uno.
- Repos afectados: este repo (`frontend-react`) y `sistema_escolar_api`. Ver
  también `sistema_escolar_api/docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`,
  que cubre tabla, endpoints y permisos. **El backend va primero**: esta
  pantalla no debe depender de endpoints que no existan.
- Riesgo inicial: Medio. Sustituye una pantalla que los profesores usan hoy.
- Última actualización: 2026-09-08.

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

## Plan de fases (frontend)

**Fase 1 — Lectura** (requiere fase 2 del backend cerrada: **lo está desde el
2026-09-08**, así que esta fase ya puede empezar)
1. Servicio y hook para `GET /observador/{estudiante_id}`.
2. Página nueva con la vista por dimensión.
3. Selector de periodo con «Todos» por defecto.

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

1. **¿Desde dónde se entra a la página?** ¿Desde el listado de estudiantes,
   desde la planilla, desde el menú? No se decidió.
2. **¿La pantalla vieja se retira o convive?** El usuario no lo dijo. Por
   defecto conviven hasta que él ordene retirarla.
3. **¿Qué pasa si el profesor no tiene periodo activo en `localStorage`?** Hoy
   `obtenerPeriodoProfesor` cae a `"1"`. Con «Todos» por defecto quizá deje de
   importar; confirmar.

## Entrega para el siguiente chat

- Última acción terminada: **ninguna.** Solo existe este documento y su
  equivalente de backend.
- Estado del repo relacionado: la pantalla actual del observador
  (`src/pages/Formulario.jsx`, `src/components/estudiantesObservador/`,
  `src/hooks/estudiantesObservador/`) **sigue en producción y sin cambios**. El
  fallo que el usuario reportó **sigue vivo** y es intermitente: con 2
  peticiones simultáneas tarda 8-9,7 s y el límite son 10 s, así que a veces
  carga y a veces no.
- Estado del backend al 2026-09-08: **completo**. Leer, crear y editar, con
  prueba de extremo a extremo contra la base real. **Ya no bloquea nada de este
  repo.** Ver `sistema_escolar_api/docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
- Endpoints de escritura:
  - `POST /observador` → `201` con `{"id": N}`. Cuerpo: `estudiante_id`,
    `periodo` (1-4), `positiva`, y los tres campos de texto. **No mandes
    `profesor_id`**: sale del token y el servidor ignora el del cuerpo.
  - `PUT /observador/{anotacion_id}` → cuerpo: `positiva` y los tres textos.
    **No** lleva `estudiante_id` ni `periodo`. `403` si la anotación no es tuya,
    `404` si no existe.
  - **No existe `DELETE`**, y no debe pedirse.
- El servidor aplica la misma autocorrección de mayúsculas al guardar, así que
  la de esta pantalla es comodidad, no la garantía. Espejo:
  `app/core/texto_observador.py`.
- Lo que devuelve el endpoint:

  ```json
  {
    "nivel": "primaria",
    "anotaciones": [
      {
        "id": 12, "profesor_id": 7, "profesor": "Ana Gómez",
        "materia": "Matemáticas", "periodo": 1, "positiva": false,
        "conductual": "...", "cognitivo": "", "lenguaje": "",
        "creada_en": "...", "editada_en": null, "editada_por": null
      }
    ]
  }
  ```

  Ordenado de la más nueva a la más vieja. `?periodo=N` es opcional y se valida
  entre 1 y 4; **sin él devuelve el año entero**, que es el caso por defecto.
- `nivel` va fuera de las anotaciones y **llega aunque `anotaciones` esté
  vacío**: la pantalla puede escribir «Pepito · Preescolar» antes de que exista
  la primera anotación. Puede ser `null` si el curso no está clasificado; en ese
  caso se trata como primaria.
- **`404` significa que el estudiante no existe**, y es distinto de una lista
  vacía, que significa que todavía nadie le ha escrito nada. Son dos mensajes
  distintos en pantalla; no los mezcles.
- `profesor_id` viaja para que la pantalla decida si pinta `[Editar]`. Es
  **cosmético**: la regla de verdad la impone el servidor.
- Siguiente acción exacta: que el usuario **autorice la Fase 1 del frontend**
  (servicio, hook y página con la vista por dimensión). Ya no hay nada del
  backend que lo bloquee, y las fases 1 y 2 de aquí podrían hacerse seguidas.
- **Sigue sin responderse la pregunta abierta 1: desde dónde se entra a la
  página.** Ya no condiciona el modelo de datos —eso se resolvió al descartar la
  materia—, pero sí hay que decidirlo antes de montar la navegación.
