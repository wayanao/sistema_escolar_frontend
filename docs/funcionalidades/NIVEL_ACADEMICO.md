# Funcionalidad: Nivel académico (Preescolar y Primaria) — Frontend

## Control

- Estado: **Propuesta, pendiente de aprobación. Nada implementado.**
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno: esa
  documentación es solo para migraciones arquitectónicas sin funcionalidad
  nueva.
- Repos afectados: este repo y `sistema_escolar_api`. Ver también
  `sistema_escolar_api/docs/funcionalidades/NIVEL_ACADEMICO.md`, que cubre la
  parte de datos y validación en el servidor.
- Riesgo inicial: Medio.
- Última actualización: 2026-09-01.

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

## Inventario de archivos existentes que este cambio toca

- `src/utils/administracionAcademica/cursos.js`
- `src/components/administracionAcademica/cursos/FormularioCurso.jsx`
- `src/components/administracionAcademica/cursos/ListaCursos.jsx` (mostrar el
  nivel en la tabla)
- `src/hooks/administracionAcademica/useComandosCursos.js`
- `src/components/planilla/SelectorTipoEvaluacion.jsx`
- `src/pages/Asistencia.jsx`
- `src/utils/planilla/notas.js` (a revisar en la capa 0: si ya calcula algo
  relacionado con `tipo_evaluacion` que deba conocer el nivel del curso)

No inventariado todavía en detalle: cómo "mis clases" / el listado de
asignaciones que consume `Asistencia.jsx` debería exponer el nivel del curso
o identificar cuál asignación es la de "Asistencia diaria". Se define en la
capa 0 de implementación, no aquí.

## Cambios de UI previstos

| Pantalla | Cambio |
|---|---|
| Formulario de Curso | Selector "Nivel": Preescolar / Primaria / Sin definir. |
| Lista de Cursos | Mostrar el nivel como columna o insignia. |
| Planilla | `SelectorTipoEvaluacion` no se muestra si el curso es preescolar. |
| Asistencia | Si el curso activo es preescolar, entra directo a la asignación de jornada en vez de mostrar el selector de materia. Si es primaria, sigue igual que hoy. |

## Invariantes

- Un curso sin nivel definido se ve y se comporta exactamente como hoy.
- Ningún colegio nota cambios hasta que marque un curso con nivel.
- Contratos actuales del backend, rutas, roles y navegación no cambian salvo
  lo descrito aquí.
- Comportamiento responsive actual se conserva.

## Riesgos iniciales

- `Asistencia.jsx` y sus hooks relacionados (ver
  `docs/modularizacion/ASISTENCIA.md`) ya están modularizados; hay que
  extender su comportamiento sin romper sus pruebas de caracterización
  existentes.
- Confirmar en la capa 0 si el nivel del curso llega ya en la respuesta de
  "mis clases" del profesor o si hace falta un cambio adicional de contrato
  para exponerlo (a coordinar con el backend).

## Plan de fases (frontend)

1. Capa 0: inventariar con precisión los archivos de arriba, confirmar cómo
   llega (o no) el nivel del curso a la pantalla de Asistencia, y proteger
   con pruebas de caracterización el comportamiento actual antes de tocar
   nada.
2. Selector de nivel en el formulario de Cursos + mostrarlo en la lista.
3. Ocultar `SelectorTipoEvaluacion` en Planilla cuando el curso es
   preescolar.
4. Modo jornada en Asistencia para preescolar.
5. Pruebas + `pnpm run check:deploy`.

## Preguntas abiertas

Ver `sistema_escolar_api/docs/funcionalidades/NIVEL_ACADEMICO.md`, sección
Preguntas abiertas — son compartidas entre ambos repos.

## Entrega para el siguiente chat

- Última fase terminada: ninguna. Esto es una propuesta, no hay código
  escrito.
- Siguiente acción exacta: esperar aprobación del usuario y respuesta a las
  preguntas abiertas. El backend debe ir primero (columna `nivel` disponible)
  antes de que el frontend pueda consumirla.
- No hay commit base todavía porque no se ha tocado código de producto.
