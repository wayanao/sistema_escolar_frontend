# Funcionalidad: Director de grupo en el boletín — Frontend

## Control

- Estado: **Código completo, verificado localmente**. `pnpm run check:deploy`
  (test + lint + build) en verde: 307 archivos, 1836 pruebas. Nada
  commiteado ni publicado.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- Repos afectados: este repo y `sistema_escolar_api`. Ver también
  `sistema_escolar_api/docs/funcionalidades/DIRECTOR_GRUPO.md`, que cubre la
  parte de datos y validación en el servidor.
- Riesgo inicial: Bajo.
- Última actualización: 2026-09-15.

## Objetivo

Que el formulario de Cursos permita asignar un profesor como director de
grupo, y que el boletín impreso muestre su nombre como **dato informativo
aparte**, sin reemplazar la línea de firma a mano ya existente.

## Motivación

Ver `sistema_escolar_api/docs/funcionalidades/DIRECTOR_GRUPO.md`, sección
Motivación. Resumen: el boletín ya tenía "Director de Grupo" como etiqueta
fija de firma, sin nombre — a propósito, porque se firma en físico. El
usuario pidió que el nombre real también apareciera, aparte de esa firma.

## Decisiones ya tomadas (con el usuario)

- Dato informativo aparte, no reemplaza la línea de firma a mano.
- Se asigna por curso (formulario de Cursos), no hay pantalla nueva.
- Se ubica junto a los chips de Grado/Periodo/Fecha en la caja del nombre del
  estudiante del boletín, en la misma línea, solo cuando el curso tiene uno
  asignado (no se muestra "Sin asignar" en el boletín impreso).

## Archivos tocados (implementación real)

**Nuevos:**
- `src/utils/administracionAcademica/cursos.test.js` — no existía cobertura
  previa de `construirPayloadCurso`; se agregó junto con este cambio.

**Modificados:**
- `src/utils/administracionAcademica/cursos.js` — `DIRECTOR_GRUPO_SIN_DEFINIR`
  y `construirPayloadCurso` ahora incluye `director_grupo_id` (convierte `""`
  a `null` antes de enviarlo, mismo patrón que `nivel`).
- `src/hooks/administracionAcademica/useCursos.js` — carga profesores activos
  (`listarProfesores("activo")`, ya existía en `profesoresApi.js`) para
  alimentar el selector; expone `profesores`.
- `src/hooks/administracionAcademica/useComandosCursos.js` —
  `director_grupo_id` en el formulario, se envía al guardar y se preselecciona
  al editar.
- `src/components/administracionAcademica/cursos/FormularioCurso.jsx` —
  selector "Director de grupo" (opción "Sin asignar" + lista de profesores).
- `src/components/administracionAcademica/cursos/CrearCurso.jsx` — conecta
  `profesores` (de `useCursos`) y `director_grupo_id` (de
  `useComandosCursos`) a `FormularioCurso`.
- `src/components/boletin/BoletinImprimible.jsx` — chip "Director de grupo"
  junto a Grado/Periodo/Fecha, solo si `boletinData.director_grupo` existe.
  No requirió tocar ningún hook de boletín: el dato llega en `boletinData`
  sin transformación (ver más abajo).

**Sin cambios, y por qué:**
- `src/hooks/boletines/useConsultaBoletinesAdministrativos.js`: no
  transforma la respuesta del backend, solo la guarda tal cual
  (`setBoletinData(data)`). Al backend agregar `director_grupo` al JSON, el
  dato llega solo, sin whitelist de campos que actualizar.
- `src/services/profesoresApi.js`, `src/services/cursosApi.js`: ya exponían
  todo lo necesario (`listarProfesores`, `crearCurso`/`actualizarCurso` con
  paso genérico del payload); no se creó ningún endpoint ni función nueva.

## Cambios de UI (implementados)

| Pantalla | Cambio |
|---|---|
| Formulario de Curso | Selector "Director de grupo": lista de profesores activos o "Sin asignar". |
| Boletín impreso | Chip "Director de grupo" junto a Grado/Periodo/Fecha, solo si el curso tiene uno asignado. La línea de firma a mano de "Director de Grupo" no cambia. |

## Invariantes

- Un curso sin director de grupo asignado se ve y se comporta exactamente
  igual que hoy; el boletín no muestra el chip.
- Ningún colegio nota cambios hasta que un administrador asigne un director
  de grupo a un curso.
- La lista de Cursos (`ListaCursos.jsx`) no cambia: no se agregó columna ni
  insignia para este dato (ver "Fuera de alcance" en el documento del
  backend).
- Contratos actuales del backend, rutas, roles y navegación no cambian salvo
  lo descrito aquí.

## Riesgos

- El selector de "Director de grupo" solo lista profesores `activo`
  (`listarProfesores("activo")`). Si un profesor se desactiva después de ser
  asignado, el curso conserva la referencia (el backend no la limpia al
  desactivar, solo al borrar el profesor) pero no aparece en la lista para
  reasignarlo hasta reactivarlo — comportamiento aceptado, no se pidió otra
  cosa.
- El nombre del director de grupo no se resuelve en `GET /cursos`
  (solo `director_grupo_id`); si en el futuro otra pantalla necesita mostrar
  el nombre desde el listado de cursos, hay que agregarlo ahí explícitamente
  — no hay un punto único de verdad en el backend para "todas las respuestas
  que exponen un curso" (mismo riesgo documentado en
  `NIVEL_ACADEMICO.md`).

## Verificación

- `pnpm run check:deploy`: exit 0 (test, lint y build en cadena). 307
  archivos de prueba, 1836 pruebas.
- Pruebas nuevas/actualizadas: `cursos.test.js` (nuevo), `useCursos.test.js`,
  `useComandosCursos.test.js`, `FormularioCurso.test.jsx`,
  `CrearCurso.test.jsx`, `BoletinImprimible.test.jsx`.
- Nada commiteado ni publicado.

## Preguntas abiertas

Ver `sistema_escolar_api/docs/funcionalidades/DIRECTOR_GRUPO.md`, sección
Preguntas abiertas — compartida entre ambos repos (mostrar el nombre en la
lista de Cursos). No bloquea este trabajo.

## Entrega para el siguiente chat

- Última acción terminada: código completo de ambos repos para esta
  funcionalidad, verificado localmente.
- Siguiente acción exacta: el usuario decide cuándo aplicar la migración
  real a los tenants operativos y publicar (ver "Orden de despliegue
  obligatorio" en el documento del backend) — es lo único que falta para que
  esto llegue a producción. El código del frontend puede publicarse en el
  mismo push que el backend, ya que el chip del boletín no rompe nada si
  `director_grupo` no llega en la respuesta (simplemente no se muestra).
- No hay commit todavía en ninguno de los dos repos para este trabajo; el
  usuario los hace cuando lo decida.
