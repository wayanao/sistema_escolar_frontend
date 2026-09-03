# Funcionalidad: Nivel académico (Preescolar y Primaria) — Frontend

## Control

- Estado: **Código completo**, verificado localmente. Nada commiteado ni
  publicado.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno: esa
  documentación es solo para migraciones arquitectónicas sin funcionalidad
  nueva.
- Repos afectados: este repo y `sistema_escolar_api`. Ver también
  `sistema_escolar_api/docs/funcionalidades/NIVEL_ACADEMICO.md`, que cubre la
  parte de datos y validación en el servidor.
- Riesgo inicial: Medio.
- Última actualización: 2026-09-02.

## Objetivo

Que el formulario de Cursos permita declarar el nivel académico (Preescolar
o Primaria), y que la pantalla de Planilla y la de Asistencia se adapten a
ese nivel, siempre con el servidor como respaldo de la regla, no solo la
pantalla.

## Motivación

Ver `sistema_escolar_api/docs/funcionalidades/NIVEL_ACADEMICO.md`, sección
Motivación. Resumen: el sistema ya distingue nota numérica de "desarrollo"
(caritas), pero la elección es manual y libre; y la asistencia siempre se
toma por materia, lo que en preescolar duplica el trabajo.

## Fuera de alcance

- Boletines, malla curricular, observador del estudiante, plan de clases,
  pagos: sin cambios.
- Rediseños visuales fuera de lo estrictamente necesario para el selector de
  nivel y el modo jornada.
- Cambios de rutas o de roles.

## Decisiones ya tomadas (con el usuario)

- En preescolar se mantienen las asignaciones por materia para las notas
  (Matemáticas, Lenguaje, Arte...); no se colapsan en un solo bloque.
- La asistencia de preescolar usa una asignación adicional ("Asistencia
  diaria") creada por el administrador desde la pantalla de Asignaciones ya
  existente — no requiere pantalla nueva para crearla.
- El selector de tipo de evaluación en Planilla debe **desaparecer** cuando
  el curso es preescolar (queda fijo en "desarrollo"), no solo quedar
  deshabilitado. Sigue visible e igual que hoy en primaria.
- La validación real de que un curso preescolar no reciba notas numéricas
  vive en el backend; el frontend refleja la regla, no la reemplaza.

## Archivos tocados (implementación real)

**Nuevos:**
- `src/utils/nivelAcademico.js` — espejo de `app/core/nivel_academico.py`:
  `tipoEvaluacionForzado(nivel)` y `esNivelPreescolar(nivel)`, funciones
  puras. Con `src/utils/nivelAcademico.test.js`.

**Modificados:**
- `src/utils/administracionAcademica/cursos.js` — `NIVELES_CURSO`,
  `NIVEL_CURSO_SIN_DEFINIR`, `CLASES_NIVEL_CURSO`,
  `obtenerEtiquetaNivelCurso`, y `construirPayloadCurso` ahora incluye
  `nivel` (convierte `""` a `null` antes de enviarlo).
- `src/components/administracionAcademica/cursos/FormularioCurso.jsx` —
  selector "Nivel".
- `src/components/administracionAcademica/cursos/ListaCursos.jsx` — columna
  "Nivel" con insignia.
- `src/hooks/administracionAcademica/useComandosCursos.js` — `nivel` en el
  formulario, se envía al guardar y se preselecciona al editar.
- `src/components/administracionAcademica/cursos/CrearCurso.jsx` — conecta
  el nuevo prop.
- `src/pages/Planilla.jsx` — oculta `SelectorTipoEvaluacion` y fuerza
  `tipoEvaluacion` a `"desarrollo"` cuando el curso de la clase activa es
  preescolar, sin importar lo que diga `localStorage`.

**Sin cambios, y por qué:**
- `src/pages/Asistencia.jsx`: no requirió ningún cambio (ver más abajo).
- `src/components/planilla/SelectorTipoEvaluacion.jsx`: se oculta desde
  `Planilla.jsx` con un condicional; el componente en sí no necesitó
  cambios.

## El "modo jornada" de Asistencia no requirió código

Se investigó cómo el profesor llega a una asignación en `Asistencia.jsx` y
se encontró que la página **no tiene selector propio**: lee `asignacionId`
de `localStorage`, puesto ahí por `ContextoTrabajoProfesor.jsx` (el
selector "¿Con qué clase vas a trabajar?" del Dashboard del profesor), que
lista **todas** las asignaciones del profesor sin distinción
(`clase.materia - clase.curso - jornada`).

Como la asignación de jornada (`"ASISTENCIA DIARIA"`) es, para el sistema,
una asignación más, **ya aparece en ese selector automáticamente**. El
profesor la elige igual que elegiría "Matemáticas", y `Asistencia.jsx` la
usa sin saber ni necesitar saber que es especial. Es la misma conclusión de
diseño que ya se había aplicado en el backend (no crear una ruta ni tabla
nueva) llevada a su consecuencia lógica en el frontend: no hay nada que
programar aquí.

Queda como mejora de UX opcional, no implementada: distinguir visualmente
esa opción en el selector (ej. un ícono) para que no se confunda con una
materia real. No se hizo porque no fue pedida y el selector ya funciona
correctamente sin ella.

## Cambios de UI (implementados)

| Pantalla | Cambio |
|---|---|
| Formulario de Curso | Selector "Nivel": Preescolar / Primaria / Sin definir. |
| Lista de Cursos | Columna "Nivel" con insignia de color. |
| Planilla | `SelectorTipoEvaluacion` no se muestra si el curso es preescolar; el tipo queda fijo en "desarrollo". |
| Asistencia | Sin cambios de código (ver sección anterior). |

## Invariantes

- Un curso sin nivel definido se ve y se comporta exactamente como hoy.
- Ningún colegio nota cambios hasta que marque un curso con nivel.
- Contratos actuales del backend, rutas, roles y navegación no cambian salvo
  lo descrito aquí.
- Comportamiento responsive actual se conserva.

## Hueco de backend descubierto y cerrado durante esta fase

Al conectar el selector de Cursos se descubrió que
`app/controllers/curso_controller.py` (backend) nunca leía, guardaba ni
devolvía `nivel` pese a estar en el plan desde el inicio. Se corrigió ahí
(ver el documento del backend) antes de continuar; sin eso el selector de
este repo no habría tenido nada real que guardar o mostrar.

También se agregó `c.nivel` a la consulta de `GET /mis-clases/{profesor_id}`
(`app/repositories/asignaciones_repository.py`), que es el endpoint que
alimenta tanto a Planilla como al Dashboard del profesor, para que
`Planilla.jsx` supiera el nivel del curso de la clase activa.

## Riesgos

- `Asistencia.jsx` y sus hooks relacionados no se tocaron: sus pruebas de
  caracterización existentes no se vieron afectadas.
- El nivel de un curso viaja hoy en dos respuestas distintas del backend
  (`GET /cursos` y `GET /mis-clases/:profesorId`); si en el futuro se agrega
  un tercer lugar que necesite el nivel, hay que recordar incluirlo ahí
  también — no hay un solo punto de verdad en el backend para "todas las
  respuestas que exponen un curso".

## Plan de fases (frontend) — completado

1. ~~Capa 0: inventariar y proteger el comportamiento actual.~~ Hecho
   mediante lectura directa del código real, no solo de la documentación.
2. ~~Selector de nivel en el formulario de Cursos + mostrarlo en la lista.~~
   Hecho.
3. ~~Ocultar `SelectorTipoEvaluacion` en Planilla cuando el curso es
   preescolar.~~ Hecho.
4. ~~Modo jornada en Asistencia para preescolar.~~ Resuelto sin código en su
   momento; ver la extensión posterior más abajo, que sí agregó código.
5. ~~Pruebas + `pnpm run check:deploy`.~~ Hecho, ver Verificación abajo.

## Extensión: manejar el rechazo del backend (posterior al cierre inicial)

El usuario preguntó qué pasaba si, en un curso preescolar, se tomaba
asistencia usando una materia normal en vez de "Asistencia diaria". La
respuesta honesta era que el backend no lo impedía. Eligió bloquearlo, y el
backend ahora responde `{"error": "..."}` con status 200 (no lanza una
excepción) cuando eso ocurre — ver
`sistema_escolar_api/docs/funcionalidades/NIVEL_ACADEMICO.md`, sección
"Extensión: validar la asignación de jornada".

Antes de este cambio, `useComandosAsistenciaProfesor.js` **no revisaba** el
contenido de la respuesta de guardado: solo distinguía éxito (la promesa se
resuelve) de fallo real (la promesa se rechaza). Como el rechazo por nivel
académico es un 200 "exitoso" a nivel de red, la maestra habría visto el
mensaje de "Asistencia guardada" aunque en realidad no se guardó nada.

Corregido en `guardarAsistencia`: si la respuesta trae `error`, se muestra
ese mensaje con `icon: "warning"` y **no** se recarga el historial ni se
felicita el guardado. 1 prueba nueva en
`useComandosAsistenciaProfesor.test.js`.

## Verificación

- `pnpm run check:deploy`: exit 0 (test, lint y build en cadena). El log
  detallado de tests no quedó capturado tras el build, pero el exit 0 de la
  cadena confirma que las tres etapas pasaron.
- Se agregaron pruebas en `cursos.test.js`, `FormularioCurso.test.jsx`,
  `ListaCursos.test.jsx`, `useComandosCursos.test.js`, `CrearCurso.test.jsx`,
  `Planilla.test.jsx`, `useComandosAsistenciaProfesor.test.js` y el archivo
  nuevo `nivelAcademico.test.js`.
- `git diff --check`: exit 0, limpio.
- Nada commiteado ni publicado.

## Preguntas abiertas

Ver `sistema_escolar_api/docs/funcionalidades/NIVEL_ACADEMICO.md`, sección
Preguntas abiertas — son compartidas entre ambos repos. Ninguna bloqueaba
este trabajo.

## Entrega para el siguiente chat

- Última acción terminada: código completo de ambos repos para esta
  funcionalidad, verificado localmente.
- Siguiente acción exacta: el usuario decide cuándo aplicar la migración
  real a todos los tenants y publicar (ver "Orden de despliegue obligatorio"
  en el documento del backend) — es lo único que falta para que esto llegue
  a producción.
- No hay commit todavía en ninguno de los dos repos para este trabajo; el
  usuario los hace cuando lo decida.
