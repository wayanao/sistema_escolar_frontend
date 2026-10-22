# Funcionalidad: Subnotas y porcentajes en la planilla — Frontend

## Control

- Estado: **Parte A publicada el 2026-10-21.** A0 en `1553574`, A3 en
  `12c2067`, A4 (la pantalla) en `d58fb0e` y `5f9f1b1`, A5 (la prueba en
  local) bien, y push hasta `3fb9831`, publicado en Vercel. El backend de la
  parte A está en producción desde el mismo día (`e36f976`); su contrato está
  resumido abajo. **Parte B: diseño (B0) escrito el 2026-10-21, pendiente
  del visto bueno del usuario**; sin código (ver "Parte B en este repo").
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
  **Hecho el 2026-10-21**, en `12c2067` (ver "Avance del paso A3").
- **A4 — Pantalla:** modal, botón, celda calculada y celular. **Hecho el
  2026-10-21**, en `d58fb0e`, con el ajuste de la rueda del mouse en
  `5f9f1b1` (ver "Avance del paso A4").
- **A5 — Prueba en local** con el Colegio Demo: ver "Paso A5". **Hecho el
  2026-10-21, todo bien** (ver "Avance del paso A5").

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

## Avance del paso A4, 2026-10-21

Autorizado por el usuario el 2026-10-21. Al empezar, `main` estaba limpio con
A3 en `12c2067` (sin push).

**Qué se hizo:**

- `components/planilla/BotonSubnotasPlanilla.jsx` (el botón `▤`),
  `CeldaCalculadaPlanilla.jsx` (la celda que muestra el promedio o la carita
  y cuántas subnotas tiene) y `ModalSubnotasPlanilla.jsx` (el modal). Los tres
  solo presentan.
- `PlanillaRow.jsx` y `PlanillaMobileCard.jsx`: con `subnotasPorTipo` y
  `onAbrirSubnotas`, la celda a mano suma el `▤` y la calculada cambia el
  campo por `CeldaCalculadaPlanilla`. **Sin esas dos props se ven igual que
  antes**: sus 11 pruebas de siempre pasan sin tocarlas.
- `TablaNotasPlanilla.jsx` pasa las dos props. `pages/Planilla.jsx` conecta
  `useComandosSubnotasPlanilla` con el modal.
- `docs/COMPONENTES.md` y `docs/CAMBIOS_FRONTEND.md` al día.

**Detalles de la pantalla** (no cambian ninguna regla del diseño):

- La casilla de cada subnota es de texto con teclado decimal, para aceptar la
  coma ("4,5"). El campo de la planilla sigue siendo numérico, como antes,
  pero sin las flechitas de subir y bajar del navegador: lo pidió el usuario
  al revisar A4. Se quitan con clases de Tailwind (`[appearance:textfield]` y
  `appearance-none` en los botones de subir y bajar), y el build confirma que
  las reglas quedan en el CSS. Después pidió que **la rueda del mouse no
  cambie la nota** y que las flechas del teclado sí: al girar la rueda sobre el
  campo, este suelta el foco y el navegador ya no la sube ni la baja (la página
  sigue bajando). Soltar el foco guarda lo escrito, como un clic afuera, y sin
  cambios no hay petición.
- En preescolar, pulsar otra vez la carita marcada la deja vacía.
- Renombrar se hace en el mismo lugar del nombre: Enter guarda y Esc cancela
  sin cerrar el modal.
- El foco entra en la primera subnota al abrir y al cambiar de estudiante, y
  vuelve a la celda al cerrar.
- Se cierra con la X, con Esc o con un clic en el fondo, fuera del diálogo. Si
  hay cambios sin guardar, el gancho pregunta antes. El clic fuera faltaba en
  la primera versión y se agregó al revisarla contra este documento.
- "Guardando..." sale en el botón Guardar. Agregar, renombrar y borrar se
  avisan en una línea aparte. Mientras tanto nada se puede tocar y Esc no
  cierra.

**Verificación:** 29 pruebas nuevas:

- 20 del modal;
- 1 del formato de la celda calculada, en `utils/planilla/subnotas.test.js`;
- 6 de la fila y la tarjeta con subnotas;
- 2 recorridos completos en `Planilla.test.jsx`. En el primero, una celda a
  mano se abre desde `▤`, se califican dos subnotas, se guarda y la celda
  pasa a calculada **sin recargar la planilla**; luego Anterior y cerrar. En el
  segundo, Enter en la última subnota guarda y pasa al estudiante siguiente.

Más los dos ajustes pedidos al revisar, en la fila y la tarjeta: 2 pruebas
nuevas de la rueda, y la comprobación de las flechitas dentro de 2 pruebas
que ya existían. `pnpm run check:deploy` limpio: **2902 pruebas en 376
archivos**, lint y build correctos. En una corrida intermedia, solo de la planilla, las pruebas de la
página fallaron por tiempo agotado (la máquina estaba cargada); solas y en la
corrida completa pasaron todas. `git diff --check` limpio.

## Paso A5: prueba en local

La hace el usuario. **Solo con el Colegio Demo**, nunca con estudiantes de
`tenant_2005`: el backend local escribe en la base real.

1. Backend local, en `sistema_escolar_api`:
   `.\venv\Scripts\python.exe -m uvicorn app.main:app --reload`. Es el mismo
   código que ya está en Render y la base ya tiene las tablas.
2. Frontend local, en `frontend-react`: `pnpm run dev`.
3. Entrar como **profesor del Colegio Demo** y abrir la planilla de una clase
   de primaria. Crear un tipo de nota de prueba, por ejemplo
   "Prueba subnotas".
4. En un estudiante, pulsar `▤` en esa columna. Agregar dos subnotas ("Taller
   1" y "Quiz") y calificarlas. El promedio cambia mientras se escribe; Enter
   pasa a la de abajo y, en la última, al estudiante siguiente.
5. Cerrar y mirar la celda: muestra el promedio con el número de subnotas y ya
   no tiene campo para escribir. El promedio de la fila también cambió.
6. Abrir otra vez esa celda, cambiar una nota y guardar: la celda se
   actualiza.
7. Renombrar una subnota (las notas no cambian) y borrar otra (avisa cuántas
   calificaciones se pierden y recalcula las celdas).
8. Vaciar todas las subnotas de un estudiante y guardar: la celda queda vacía
   y otra vez se escribe a mano.
9. Probar la vista de celular (herramientas del navegador, modo celular): la
   tarjeta dice "Calculada" y el modal ocupa toda la pantalla.
10. Si el Colegio Demo tiene un curso de preescolar, repetir el punto 4 con
    caritas.
11. Limpiar: borrar el tipo "Prueba subnotas" (se lleva sus subnotas). El
    aviso de borrar debe decir "y sus subnotas".
12. Contarle al asistente qué salió bien y qué no.

Si todo sale bien, el usuario hace el push del frontend y la parte A queda
publicada.

## Avance del paso A5, 2026-10-21

Lo hizo el usuario en su computador, con el backend y el frontend en local y
como profesor del **Colegio Demo**. No se usaron estudiantes de
`tenant_2005`. El asistente no corrió los servidores ni entró a la pantalla:
lo de abajo es lo que contó el usuario.

- **Puntos 3 a 9, primaria: todo bien.** Crear el tipo de prueba, agregar y
  calificar subnotas, el promedio que cambia mientras se escribe, Enter y
  Siguiente, la celda calculada y el promedio de la fila, editar y guardar,
  renombrar, borrar con aviso, vaciar hasta volver a la celda a mano y la
  vista de celular.
- **Punto 10, preescolar: funcionó.** Las subnotas se califican con caritas
  y la celda muestra la carita del promedio.
- **Punto 11, limpieza: hecha.** Se borró el tipo "Prueba subnotas" y el
  aviso decía "y sus subnotas".
- No apareció ningún problema, así que no hubo cambios de código en este
  paso: solo se actualizaron los documentos.

**Verificación al cerrar:** ver "Entrega para el siguiente chat".

## Parte B en este repo (diseño de B0, pendiente del visto bueno)

El diseño completo está en "Avance del paso B0" del documento principal
(preguntas QB1 a QB4 y propuestas PB1 a PB10). Lo que toca a este repo:

- **Hallazgo:** hoy la definitiva del boletín la calcula este repo
  (`utils/boletines/ingresoBoletin.js: crearDatosBoletinInicial`) y el
  servidor la guarda tal como llega. Con porcentajes activos la calculará el
  servidor (PB5), y la pantalla mostrará la que él mande. Sin porcentajes,
  todo sigue igual.
- **Planilla (PB9):** campo opcional "Porcentaje (%)" al crear un tipo; el
  porcentaje en el encabezado de cada columna, con la forma de cambiarlo; la
  suma encima de la tabla y el aviso "Faltan porcentajes: se usa el promedio
  simple" mientras no estén activos. Con porcentajes activos, la columna
  Promedio muestra el ponderado. Sin ningún porcentaje, la planilla se ve
  como hoy.
- **Vista previa:** el cálculo ponderado tiene su gemela en `utils/`, con los
  mismos casos que `app/core/nota_periodo.py` (PB4). Preescolar también
  lleva porcentajes (QB1), con la misma regla de caritas.
- **Contrato previsto (PB8):** `PUT /planilla/tipos/porcentaje` y `GET
  /planilla-excel/...?con_porcentajes=true`. Crear un tipo sigue igual; el
  porcentaje se envía después, con la ruta nueva.
- Ninguna otra pantalla cambia de aspecto. Los certificados y el boletín
  impreso reciben la definitiva del servidor.

## Fuera de alcance

- Lo de la parte B que queda fuera también allí: porcentajes en las tarjetas
  del tablero y en la ficha del estudiante, y copiar porcentajes entre
  periodos.
- Mostrar subnotas fuera de la planilla del profesor.
- Reordenar subnotas arrastrando.

## Entrega para el siguiente chat

- Hecho en este repo: **A0** en `1553574`, **A3** en `12c2067`, **A4** en
  `d58fb0e` y `5f9f1b1`. **A5 (prueba en local) bien el 2026-10-21**, en
  primaria y preescolar (ver "Avance del paso A5").
- **Parte A publicada el 2026-10-21.** El usuario hizo el push (`origin/main`
  en `3fb9831`). El despliegue de `Production` de ese commit en Vercel quedó
  en `success`; el asistente lo comprobó en GitHub, sin entrar a Vercel. El
  backend está en producción desde el mismo día (`e36f976`, migración
  aplicada en los dos colegios y Render Live).
- Verificación al cerrar A5 (solo cambiaron documentos): `pnpm run
  check:deploy` limpio, **2902 pruebas en 376 archivos**, lint y build
  correctos. Una primera corrida, hecha al mismo tiempo que la del backend,
  falló por carga en 3 pruebas que no son de la planilla
  (`IngresoBoletinProfesor`, `PlaneadoresClasesAdmin` y
  `NavegacionesView`); solas pasaron (12 de 12) y la segunda corrida completa
  pasó entera. `git diff --check` limpio.
- **B0 (diseño de la parte B) escrito el 2026-10-21, sin commit**, en el
  documento principal; resumen en "Parte B en este repo". Sin código.
  `check:deploy` al cerrar B0: 2902 pruebas en 376 archivos, lint y build
  correctos (corrida sola, sin otra carga). `git diff --check` limpio.
- Siguiente acción exacta: **que el usuario apruebe las propuestas PB1 a
  PB10.** Después, B1 (caracterización en el backend), solo con
  autorización explícita. El frontend vuelve a tener trabajo en B4.
- Prompt para retomar:
  `docs/funcionalidades/PROMPT_CONTINUACION_SUBNOTAS_PLANILLA.md`.
