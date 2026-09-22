# Funcionalidad: Listas de Seguimiento por Curso — Frontend

## Control

- Estado: **En diseño. Sin código escrito todavía.** Depende del backend
  (ver `sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`) —
  no puede empezar hasta que los endpoints existan y estén verificados ahí.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- Repos afectados: este repo y `sistema_escolar_api`. Ver también
  `sistema_escolar_api/docs/funcionalidades/LISTAS_SEGUIMIENTO.md`, que
  cubre la parte de datos y endpoints.
- Riesgo inicial: Bajo. Pantalla nueva; no modifica ninguna pantalla,
  servicio ni hook existente.
- Última actualización: 2026-09-21.

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
  `guardarMarcasSeguimiento(cursoId, payload)`.

**Utils** (sin HTTP, sin React):
- `src/utils/listasSeguimiento/columnas.js` — validación de nombre, chequeo
  de duplicado en el cliente antes de la petición (igual a
  `agregarTipoEvaluacion` en planilla).
- `src/utils/listasSeguimiento/marcas.js` — `normalizarListaSeguimiento`,
  `obtenerMarcaCelda` (default `{marcado: false, nota: ""}`),
  `construirPayloadMarcas` a partir de los cambios pendientes.

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

1. `listasSeguimientoApi.js` + utils + sus tests. **Pendiente.**
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

- Última acción terminada: **ninguna.** Diseño cerrado y documentado en
  ambos repos; sin código en ninguno de los dos.
- Siguiente acción exacta: no puede empezar el frontend hasta que el
  backend tenga los cuatro endpoints implementados y verificados (ver el
  documento del backend, "Entrega para el siguiente chat"). Recién ahí
  arranca el paso 1 de este plan.
- No hay commit en ningún repo para este trabajo todavía.
