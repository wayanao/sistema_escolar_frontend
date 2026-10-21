# Funcionalidad: Subnotas y porcentajes en la planilla — Frontend

## Control

- Estado: **A0 (diseño) en `1553574`. En este repo todavía no hay código de
  esta funcionalidad.** El backend de la parte A (A1) quedó escrito el
  2026-10-21, sin commit; su contrato está resumido abajo.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/SUBNOTAS_PLANILLA.md`.** Ahí están
  las decisiones, las propuestas P1 a P12, las tablas, el contrato de la API,
  la parte B (porcentajes) y el orden de publicación. Este documento cubre
  solo la pantalla de la parte A.
- Depende de: el backend de la parte A (pasos A1 y A2) y su migración
  aplicada en producción antes de publicar esta pantalla.
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
  `{ conSubnotas: true }` y agrega `?con_subnotas=true`; sin esa opción manda
  exactamente la misma petición de hoy. Funciones nuevas para crear,
  renombrar, borrar subnotas y guardar las calificaciones de un estudiante.
  Pruebas de rutas y cuerpos en `planillaApi.test.js`.
- `utils/planilla/subnotas.js` (nuevo, puro): normalizar `subnotas` de la
  respuesta, saber si una celda es calculada, la vista previa del promedio en
  centésimas enteras (P7: `(1.0 + 1.01) / 2` da 1.01, no 1.00) y armar los
  cuerpos. Usa `utils/valoracionesDesarrollo.js` para las caritas: es la raíz
  compartida de `utils/`, no otro módulo. Pruebas en `subnotas.test.js`.
- `constants/valoracionesDesarrollo.js`: no cambia. Se agrega una prueba que
  fija los cuatro códigos y valores, gemela de la del backend (**si la escala
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

- **A3 — Contratos:** servicio, utilidades y ganchos, con pruebas. Se puede
  escribir con A1 terminado, aunque A2 no esté aplicado.
- **A4 — Pantalla:** modal, botón, celda calculada y celular. Al terminar,
  documentar en `docs/API_CLIENT.md`, `docs/COMPONENTES.md` y
  `docs/CAMBIOS_FRONTEND.md`.
- **A5 — Prueba en local** con el Colegio Demo: ver el documento principal.

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
- Siguiente acción exacta: en el backend, commit y publicación (migración en
  producción y, en seguida, push). **A3 en este repo** solo con autorización
  explícita; se puede escribir aunque el backend no esté publicado.
- Prompt para retomar:
  `docs/funcionalidades/PROMPT_CONTINUACION_SUBNOTAS_PLANILLA.md`.
