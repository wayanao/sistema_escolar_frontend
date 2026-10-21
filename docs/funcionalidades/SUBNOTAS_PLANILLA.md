# Funcionalidad: Subnotas y porcentajes en la planilla — Frontend

## Control

- Estado: **A0 (diseño) en `1553574`. A3 (contratos) escrito y verificado el
  2026-10-21, sin commit.** La pantalla (A4) no ha empezado, así que el
  profesor todavía no ve nada nuevo. El backend de la parte A está en
  producción desde el 2026-10-21 (`e36f976`); su contrato está resumido
  abajo.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/SUBNOTAS_PLANILLA.md`.** Ahí están
  las decisiones, las propuestas P1 a P12, las tablas, el contrato de la API,
  la parte B (porcentajes) y el orden de publicación. Este documento cubre
  solo la pantalla de la parte A.
- Depende de: el backend de la parte A (pasos A1 y A2) y su migración
  aplicada en producción antes de publicar esta pantalla. **Cumplido el
  2026-10-21.**
- Última actualización: 2026-10-21.

## Dónde se ve

Solo en la **Planilla de notas del profesor** (`src/pages/Planilla.jsx`, ruta
`/planilla`), en escritorio y en celular. Ninguna otra pantalla cambia en la
parte A: boletín, reporte parcial y tableros siguen leyendo la celda, que se
guarda donde siempre.

## Cómo se ve

```
│ Estudiante │ Cognitivo   │ Procedimental │ Actitudinal │ Promedio │
│ Ana Gómez  │  3.80 ▤3    │   [4.5] ▤     │  [5.0] ▤    │   4.43   │
│ Luis Pérez │  [4.0] ▤    │   [3.5] ▤     │  [4.0] ▤    │   3.83   │
```

- `[4.0]`: celda a mano. Se escribe como hoy, con el mismo campo, el mismo
  guardado al salir de la celda y las mismas validaciones.
- `▤`: botón pequeño dentro de la celda que abre el modal de subnotas de ese
  estudiante en ese tipo. Nombre accesible: "Subnotas de Cognitivo de Ana
  Gómez".
- `3.80 ▤3`: **celda calculada** (P1): tiene al menos una subnota calificada.
  Muestra el promedio sin campo para escribir, con el número de subnotas
  calificadas y el texto de ayuda "Calculada con 3 subnotas". Al hacerle clic
  se abre el modal.
- En preescolar, la celda calculada muestra la carita del promedio (P8) en vez
  de los cuatro botones de caritas.
- En la parte A, el **Promedio** de la fila sigue siendo el promedio simple de
  las celdas, como hoy. Los porcentajes llegan con la parte B.

### El modal

```
┌ Ana Gómez · Cognitivo ─────────────────────── ✕ ┐
│  Taller 1   [ 4.0 ]                             │
│  Quiz       [ 3.0 ]                             │
│  Parcial    [ 4.4 ]                             │
│  + Agregar subnota (para todo el curso)         │
│                                                 │
│  Promedio: 3.80  → pasa a la celda              │
│  [← Anterior]        [Guardar]   [Siguiente →]  │
└─────────────────────────────────────────────────┘
```

- Muestra las subnotas del tipo, que son las mismas para todo el curso
  (decisión 5), con la calificación de este estudiante. Las que no tiene
  aparecen vacías.
- **El promedio se actualiza mientras se escribe** (vista previa con la misma
  fórmula del servidor: P2, P7 y P8). Lo que queda guardado es lo que
  devuelve el servidor.
- **Enter** pasa a la subnota de abajo. En la última, Enter equivale a
  "Siguiente".
- **Siguiente** y **Anterior** guardan (si hubo cambios) y pasan al estudiante
  de abajo o de arriba en el mismo orden de la planilla, sin cerrar el modal.
  Si el guardado falla, el modal se queda en el mismo estudiante con el aviso.
- **+ Agregar subnota** pide el nombre y la crea para todo el curso. Desde el
  menú de cada subnota se puede renombrar o borrar. Borrar pide confirmación
  y dice cuántas calificaciones del curso se borran (P5).
- Si la celda tenía una nota escrita a mano, el modal lo dice arriba: "Nota
  escrita a mano: 4.0. Al guardar subnotas se reemplaza por su promedio"
  (P3).
- Si se vacían todas las subnotas del estudiante, el modal avisa que la celda
  queda vacía para escribirla a mano (P4).
- **Cerrar con cambios sin guardar** (✕, Escape o clic fuera) pide
  confirmación, igual que Cartera ya no deja perder cambios sin aviso.
- Preescolar: cada subnota se califica con los mismos cuatro botones de
  caritas de la planilla, y el promedio se muestra como carita.
- En celular el modal ocupa toda la pantalla, con los botones abajo.
- Accesibilidad: `role="dialog"` y `aria-modal="true"`, como
  `components/nominaEgresosPrestamos/ModalPagoNomina.jsx`; el foco entra en la
  primera subnota y vuelve a la celda al cerrar.

### Otros cambios visibles

- El aviso de **Eliminar tipo** agrega "y sus subnotas" cuando el tipo las
  tiene (P6).
- Si el servidor responde `409` al escribir a mano en una celda que ya es
  calculada (pasa con una pestaña vieja), se muestra su mensaje y se recarga
  la planilla.

## Arquitectura (según las capas del proyecto)

- `services/planillaApi.js`: `obtenerPlanillaNotas` acepta
  `{ conSubnotas: true }` y agrega `con_subnotas=true` en los `params` de
  axios (la ruta no cambia); sin esa opción manda exactamente la misma
  petición de hoy. Funciones nuevas para crear,
  renombrar, borrar subnotas y guardar las calificaciones de un estudiante.
  Pruebas de rutas y cuerpos en `planillaApi.test.js`.
- `utils/planilla/subnotas.js` (nuevo, puro): normalizar `subnotas` de la
  respuesta, saber si una celda es calculada, la vista previa del promedio en
  centésimas enteras (P7: `(1.0 + 1.01) / 2` da 1.01, no 1.00) y armar los
  cuerpos. Usa `utils/valoracionesDesarrollo.js` para las caritas: es la raíz
  compartida de `utils/`, no otro módulo. Pruebas en `subnotas.test.js`.
- `constants/valoracionesDesarrollo.js`: no cambia. La prueba que fija los
  cuatro códigos y valores **ya existía** en `utils/valoracionesDesarrollo.test.js`;
  en A3 solo se le anotó que es la gemela de la del backend (**si la escala
  cambia, cambia en los dos repos**).
- `hooks/planilla/useConsultasPlanillaProfesor.js`: pide la planilla con
  subnotas y guarda en su estado las subnotas por tipo y las calificaciones de
  cada estudiante.
- `hooks/planilla/useComandosSubnotasPlanilla.js` (nuevo): qué estudiante y
  qué tipo está abierto, lo escrito sin guardar, guardar, Anterior/Siguiente,
  crear, renombrar y borrar con confirmación. Después de guardar actualiza
  solo la celda y el promedio de ese estudiante con lo que devolvió el
  servidor, **sin recargar la planilla entera**.
- `components/planilla/ModalSubnotasPlanilla.jsx` (nuevo, solo presenta).
  `PlanillaRow.jsx` y `PlanillaMobileCard.jsx` reciben el botón `▤` y la celda
  calculada.
- `pages/Planilla.jsx`: conecta el gancho nuevo con el modal.
- `pages/Planilla.test.jsx`: un flujo de caracterización completo (abrir el
  modal, calificar, Siguiente, ver la celda calculada) y la prueba de que, sin
  subnotas, la planilla se ve y guarda como hoy.

## Contrato del backend (fijado en su paso A1, 2026-10-21)

Resumen. El detalle está en "Contrato de la API" del documento principal y en
`sistema_escolar_api/docs/API_ENDPOINTS.md`, sección "Planilla". Los errores
llegan como `{ detail: "<mensaje en español>" }`, listo para mostrar.

- `GET /planilla-excel/{asignacion_id}/{periodo}?con_subnotas=true`: claves
  nuevas `subnotas` (por tipo, con el nombre exacto de la columna: `[{ id,
  nombre }]` en orden de creación) y, en cada estudiante, `subnotas` (`{
  "<subnota_id>": 4.0 }` o el código de la carita). Sin el parámetro,
  respuesta idéntica a la de hoy (Asistencia no cambia).
- `POST /planilla/subnotas` con `{ asignacion_id, periodo, tipo_nota, nombre
  }` → `201` `{ id, tipo_nota, nombre }`. `404` tipo inexistente, `409`
  nombre repetido, `422` límite de 20 o columna interna.
- `PUT /planilla/subnotas/{id}` con `{ asignacion_id, nombre }` → `{ id,
  nombre }`. `404` / `409`.
- `DELETE /planilla/subnotas/{id}?asignacion_id=` → `{ mensaje,
  calificaciones_borradas, celdas: { "<estudiante_id>": { nota, valoracion } }
  }`.
- `POST /planilla/subnotas/valores` con `{ asignacion_id, periodo, tipo_nota,
  estudiante_id, tipo_evaluacion, valores: { "<subnota_id>": valor | null } }`
  → `{ estudiante_id, tipo_nota, tipo_evaluacion, nota, valoracion, subnotas
  }`. **Solo toca las subnotas que llegan.** `422` si una calificación no
  sirve o una subnota no es del tipo; `403` si el estudiante no es del curso.
- `POST /planilla/nota` responde `409` si la celda es calculada.
- `DELETE /planilla/tipo` borra también las subnotas del tipo.
- Permiso y año lectivo como en el resto de la planilla (`403`, `409`).

## Plan por pasos de este repo

- **A3 — Contratos:** servicio, utilidades y ganchos, con pruebas.
  **Hecho el 2026-10-21, sin commit** (ver "Avance del paso A3").
- **A4 — Pantalla:** modal, botón, celda calculada y celular. Al terminar,
  documentar en `docs/COMPONENTES.md` y `docs/CAMBIOS_FRONTEND.md`
  (`docs/API_CLIENT.md` ya quedó al día en A3).
- **A5 — Prueba en local** con el Colegio Demo: ver el documento principal.

## Avance del paso A3, 2026-10-21

Autorizado por el usuario el 2026-10-21, con el backend de la parte A ya en
producción. Al empezar, `main` estaba al día con `origin/main` y solo tenía
sin commit los documentos de la publicación. **Lo que ve el profesor no
cambia en este paso.**

**Qué se hizo:**

- `services/planillaApi.js`: `obtenerPlanillaNotas(..., { conSubnotas })` y
  `crearSubnotaPlanilla`, `renombrarSubnotaPlanilla`,
  `eliminarSubnotaPlanilla` y `guardarCalificacionesSubnotas`. 5 pruebas
  nuevas, entre ellas que sin `conSubnotas` la petición es exactamente la de
  siempre.
- `utils/planilla/subnotas.js` (nuevo, puro), con 40 pruebas. La nota
  escrita se lee cifra por cifra para redondear mitad hacia arriba igual que
  el `Decimal` del backend ("4.155" da 4.16; `Math.round` daría 4.15). El
  rango se mira sobre lo escrito, como en el backend (0.995 no vale). Fija los
  mismos casos que `tests/test_subnotas_planilla_calculo.py`: 3.80, 4.13, 1.01
  y el empate de caritas en 4.5.
- `hooks/planilla/useConsultasPlanillaProfesor.js`: pide la planilla con
  subnotas y expone `subnotasPorTipo` y `setSubnotasPorTipo`.
- `hooks/planilla/useComandosSubnotasPlanilla.js` (nuevo), con 17 pruebas
  sobre un estado real de planilla. Solo envía las subnotas que cambiaron
  ("4", "4.0" y "4,00" son la misma nota). Aplica en la planilla la celda que
  devuelve el servidor. Siguiente y Anterior guardan antes de moverse y se
  quedan si falla. Al cerrar con cambios pregunta. Crear, renombrar y borrar
  validan antes (nombre repetido, límite de 20) y el borrado dice cuántas
  calificaciones se pierden.
- `hooks/planilla/useComandosPlanillaProfesor.js`, 3 pruebas nuevas:
  - El `409` de una celda calculada avisa con el mensaje del servidor,
    recarga y no deja la nota pendiente. Se reconoce por el texto exacto de
    `NOTA_CALCULADA` del backend, porque el año cerrado también responde
    `409` y ese caso no se quiso cambiar. Si el texto cambiara en el backend,
    vuelve al aviso de siempre sin romper nada.
  - El aviso de eliminar un tipo dice "y sus subnotas" cuando las tiene
    (P6).
- `pages/Planilla.jsx`: solo pasa `subnotasPorTipo` al gancho de comandos.
  `Planilla.test.jsx` se ajustó a propósito: la planilla ahora se pide con
  `params: { con_subnotas: true }`.
- `docs/API_CLIENT.md` y `docs/CAMBIOS_FRONTEND.md` al día.

**Verificación:** `pnpm run check:deploy` limpio en una sola corrida: **2871
pruebas en 375 archivos** (eran 2805 en 373: 66 nuevas), lint y build
correctos. `git diff --check` limpio.

## Fuera de alcance

- Los porcentajes por tipo (parte B): campo de porcentaje al crear el tipo,
  porcentaje en el encabezado y suma. Se diseñan en B0.
- Mostrar subnotas fuera de la planilla del profesor.
- Reordenar subnotas arrastrando.

## Entrega para el siguiente chat

- Hecho: **A0 (diseño), 2026-10-21, sin commit.** No hay código de esta
  funcionalidad.
- Verificación de A0 (solo documentos): `pnpm run check:deploy` pasó 2804 de
  2805 pruebas. La que falló (`IngresoBoletinProfesor.test.jsx`) pasa sola (2
  de 2): fue el fallo al azar por carga de la máquina. Lint y build pasan por
  separado y `git diff --check` está limpio.
- 2026-10-21: el usuario aprobó las propuestas P1 a P12, y el backend
  terminó A1 y A2: código, migración probada en una rama de Neon y esquema
  base regenerado. Todo sin commit y sin publicar. Su contrato quedó en
  "Contrato del backend".
- 2026-10-21: **el backend de la parte A quedó en producción** (`e36f976`,
  migración aplicada en los dos colegios y Render Live). Las rutas nuevas ya
  responden; la planilla de hoy no las usa.
- 2026-10-21: **A3 hecho, sin commit** (ver "Avance del paso A3").
  `check:deploy`: 2871 pruebas, lint y build limpios.
- Siguiente acción exacta: **A4 (pantalla)**, solo con autorización
  explícita. Conectar `useComandosSubnotasPlanilla` en `Planilla.jsx`,
  `ModalSubnotasPlanilla.jsx` nuevo, y en `PlanillaRow.jsx` y
  `PlanillaMobileCard.jsx` el botón `▤` y la celda calculada (con
  `esCeldaCalculada` y `contarCalificadas`). Más el flujo de caracterización
  en `Planilla.test.jsx`.
- Prompt para retomar:
  `docs/funcionalidades/PROMPT_CONTINUACION_SUBNOTAS_PLANILLA.md`.
