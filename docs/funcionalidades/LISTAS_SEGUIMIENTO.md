# Funcionalidad: Listas de Seguimiento por Curso — Frontend

## Control

- Estado: **Paso 1 de 5 hecho.** Existen el servicio y los dos archivos de
  utils, con 40 pruebas. Faltan hooks, componentes, página y documentación:
  pasos 2 a 5.
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
  cursos a la vez").
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
- `src/hooks/listasSeguimiento/useConsultasListasSeguimiento.js`
- `src/hooks/listasSeguimiento/useComandosListasSeguimiento.js`

**Componentes** (presentacionales, sin `services/`):
- `src/components/listasSeguimiento/VistaListasSeguimiento.jsx`
- `src/components/listasSeguimiento/GestionColumnasSeguimiento.jsx`
- `src/components/listasSeguimiento/TablaSeguimiento.jsx`
- `src/components/listasSeguimiento/SeguimientoRow.jsx`
- `src/components/listasSeguimiento/SeguimientoMobileCard.jsx`
- `src/components/listasSeguimiento/BarraGuardadoSeguimiento.jsx`

**Página y ruteo:**
- `src/pages/ListasSeguimientoAdmin.jsx` — composición, sin HTTP directo.
- `src/App.jsx` — ruta `/admin/listas-seguimiento`, dentro de `AdminRoute`.
- `src/utils/autenticacion/navegacion.js` — ítem nuevo en
  `ADMIN_DESKTOP_ITEMS`, grupo "academica".
- `src/components/autenticacion/NavAdminView.jsx` — el mismo ítem, a mano,
  en el bloque mobile de "academica". **Este archivo no se genera a partir
  de `navegacion.js`** — hay que tocar los dos o el ítem solo aparece en
  desktop.

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

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Los dos archivos de menú (`navegacion.js` y `NavAdminView.jsx`) no se sincronizan solos | Tocar los dos explícitamente al implementar; ya es un problema conocido en otros módulos admin. |
| Guardar la nota en cada tecla generaría demasiadas peticiones | Se sigue el patrón de Asistencia: cambios en memoria + un solo guardado en lote con confirmación (ver "Decisiones ya tomadas"). |
| Copiar de Asistencia también la regla de "no se puede guardar hasta marcar a todos" | No corresponde acá: en este módulo es normal que la mayoría de las celdas queden sin marcar. El botón de guardar debe habilitarse con al menos un cambio pendiente, no con la grilla completa. |

## Plan de fases (frontend) — no empieza hasta que el backend esté verificado

1. `listasSeguimientoApi.js` + utils + sus tests. **Hecho (2026-09-22).**
   40 pruebas: 10 del servicio, 14 de `columnas.js` y 16 de `marcas.js`.
2. Hooks de consulta y de comando + sus tests. **Pendiente.**
3. Componentes + sus tests. **Pendiente.**
4. Página, ruta y menú (los dos archivos) + test de integración.
   **Pendiente.**
5. Documentación (`docs/API_CLIENT.md`, `docs/RUTAS_FRONTEND.md`,
   `docs/ROLES_UI.md`, `docs/CAMBIOS_FRONTEND.md`). **Pendiente.**

## Preguntas abiertas

Ver `sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`,
sección Preguntas abiertas — compartidas entre ambos repos. No bloquean
empezar el backend.

## Entrega para el siguiente chat

- Última acción terminada: **paso 1 del "Plan de fases"**, el 2026-09-22.
  Agrega `src/services/listasSeguimientoApi.js`,
  `src/utils/listasSeguimiento/columnas.js`,
  `src/utils/listasSeguimiento/marcas.js` y sus tres archivos de pruebas.
  **Sin commit todavía.**
- Verificación: `pnpm run check:deploy` pasa entero — **1883 pruebas en 310
  archivos, lint limpio, build correcto**. `git diff --check`: limpio. No se
  tocó ningún archivo existente: los seis son nuevos.
- Un error que encontraron las pruebas y conviene no repetir: la primera
  versión de `construirPayloadMarcas` convertía los ids con `Number(valor)`,
  y en JavaScript `Number(null)` vale **0**, no `NaN`. Una celda sin columna
  habría viajado como `columna_id: 0`, un id que parece válido, y el backend
  la habría rechazado con un 422 difícil de entender. Está arreglado y
  comentado en el propio archivo.
- El backend está terminado y verificado, así que nada de aquí en adelante
  está bloqueado por él. Los cuatro endpoints y sus respuestas están en
  `sistema_escolar_api/docs/API_ENDPOINTS.md`, sección "Listas de
  seguimiento".
- Siguiente acción exacta: paso 2 del "Plan de fases",
  `src/hooks/listasSeguimiento/useConsultasListasSeguimiento.js` y
  `useComandosListasSeguimiento.js`, con sus pruebas. Tres cosas a tener
  presentes al escribirlos:
  - los cambios pendientes van indexados por `claveCelda`, no en un array
    (ver arriba el porqué);
  - el botón de guardar se habilita con **al menos un cambio pendiente**, no
    con la grilla completa: copiar de Asistencia la regla de "no se puede
    guardar hasta marcar a todos" no corresponde aquí, y ya está anotado en
    "Riesgos y mitigación";
  - el 409 al crear una columna hay que tratarlo aunque el chequeo local haya
    dicho que el nombre estaba libre.
  **No iniciado.**
- La documentación transversal (`docs/API_CLIENT.md`, `docs/RUTAS_FRONTEND.md`,
  `docs/ROLES_UI.md`, `docs/CAMBIOS_FRONTEND.md`) va en el paso 5 de este
  plan, no en cada paso. Todavía no se ha tocado ninguna.
