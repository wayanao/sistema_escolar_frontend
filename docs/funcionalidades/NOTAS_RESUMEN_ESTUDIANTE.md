# Funcionalidad: Notas por periodo en el resumen del estudiante — Frontend

## Control

- Estado: **paso 2 (este documento) construido el 2026-10-31, sin commit y
  sin probar en el navegador.** El backend (paso 1) se publicó ese mismo día
  (`a7560e0`). Ver "Avance del paso 2".
- Tipo: mejora del resumen del estudiante del admin
  (`components/estudiantesObservador/admin/DetalleEstudianteAdmin.jsx`).
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/NOTAS_RESUMEN_ESTUDIANTE.md`**,
  con las decisiones, la regla de la nota, la respuesta y el orden. Este
  documento cubre la pantalla.
- Depende del paso 1 del backend publicado. **El paso 2 no empieza antes.**
- Última actualización: 2026-10-31.

## La tarjeta "Rendimiento"

1. Arriba, botones **"Periodo 1", "Periodo 2", "Periodo 3", "Periodo 4" y
   "Todo el año"**. Uno queda marcado.
2. Al abrir la ficha se marca **el último periodo con notas**. Sin ninguna
   nota en el año, el Periodo 1.
3. Debajo, lo del periodo escogido:
   - **Promedio General**, solo si hay materias con número. En preescolar no
     aparece.
   - **Inasistencias** del periodo; en "Todo el año", el total.
   - Las materias en el orden del boletín. Cada una muestra:
     - su **nota con un decimal**, en verde desde 3,0 y en rojo por debajo,
       como hoy;
     - o su **carita**, con el nombre de la escala (por ejemplo "Logrado"),
       en preescolar;
     - o **"Sin nota"**.
4. Si el periodo no tiene ninguna nota: "No hay notas en este periodo".

Cambiar de periodo **no hace ninguna petición**: la respuesta trae los cuatro
y el año.

## Compatibilidad

- Si el backend todavía no trae `notas_por_periodo`, la tarjeta se ve como
  hoy, con `notas` y `promedio_general`. No pasa en producción porque el
  backend sale primero, pero así no se rompe nada si el orden se invierte.
- `normalizarDetalleEstudiante` ya rellena lo que falta; se le suman los dos
  campos nuevos.

## Dónde va el código (patrón del proyecto)

| Capa | Archivo |
|---|---|
| Contratos puros | `utils/estudiantesObservador/estudiantes.js`: normalizar `notas_por_periodo` e `inasistencias_por_periodo`, `ultimoPeriodoConNotas` y `rendimientoDelPeriodo` (las filas que pinta la tarjeta). Las caritas salen de `utils/valoracionesDesarrollo.js` y `constants/valoracionesDesarrollo.js`, que ya son compartidos |
| Hook | `hooks/estudiantesObservador/useDetalleEstudianteAdmin.js`: el periodo escogido. Al abrir otra ficha vuelve al último con notas |
| Componente | `DetalleEstudianteAdmin.jsx`: los botones y la lista, por props. Puede salir a un `RendimientoEstudianteAdmin.jsx` propio, porque la tarjeta crece |

No hace falta un servicio nuevo: es la misma `obtenerDetalleEstudiante`.

## Invariantes

1. Una sola petición al abrir la ficha, como hoy.
2. Ningún cálculo de notas en el frontend: muestra lo que manda el backend.
   Solo traduce la carita a su nombre.
3. Preescolar nunca muestra números.

## Pruebas

- Utils: normalizar con y sin los campos nuevos, el último periodo con
  notas, las filas de un periodo y de "Todo el año", y una carita traducida.
- Hook: el periodo inicial y que vuelva al cambiar de estudiante.
- Componente: los cinco botones, una materia numérica, una de preescolar sin
  promedio general, "Sin nota" y las inasistencias del periodo.
- Que cambiar de periodo no llame al servicio.

## Plan

Es el paso 2 del documento principal. Se cierra con `pnpm run check:deploy`
y con una prueba en local con el Colegio Demo, con un estudiante de primaria
y uno de preescolar, antes de publicar.

## Avance del paso 2 (2026-10-31)

Construido como en el diseño. La tarjeta salió a un componente propio,
`RendimientoEstudianteAdmin.jsx`, que también conserva la tarjeta de antes
para cuando no llega `notas_por_periodo`.

- La nota va con un decimal (`toFixed(1)`), igual que el reporte parcial.
- La carita sale de `obtenerValoracion` (`utils/valoracionesDesarrollo.js`),
  con su emoji y su nombre.
- `rendimientoDelPeriodo` no calcula notas: solo elige la celda del periodo
  o del año que mandó el backend.

Verificación: `pnpm run check:deploy` → **3205 pruebas en 395 archivos**,
lint y build correctos. Pruebas nuevas:

- en `estudiantes.test.js`, normalizar sin los campos nuevos, el último
  periodo con notas, un periodo, "Todo el año", preescolar y un periodo sin
  notas;
- en el hook, el periodo inicial por ficha y que cambiar no pide nada;
- en el componente, los cinco botones, los colores, la carita sin promedio,
  "Sin nota" y la tarjeta de antes.

Para la prueba en local, el Colegio Demo tiene:

- el estudiante 1, de primaria, con notas en los 4 periodos;
- el estudiante 9, de preescolar, con "Logrado" en Sociales, periodo 1.
