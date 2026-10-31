# Funcionalidad: Nombres de los cuadros del plan de clase — Frontend

## Control

- Estado: **publicado el 2026-10-31** (`860af97`; Vercel terminó bien). El
  backend (paso 1) salió ese mismo día, con la migración en producción. Ver
  "Avance del paso 2".
- Tipo: función nueva de producto. No es un módulo de
  `docs/modularizacion/`; vive dentro del módulo `planeaciones`.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/NOMBRES_CUADROS_PLAN.md`**, con las
  decisiones, la lista de cuadros, la tabla, los permisos, la API y el orden de
  publicación. Este documento cubre la ventana del admin y las pantallas.
- Depende de que el paso 1 del backend esté publicado, con la migración en
  producción. **El paso 2 no empieza antes.**
- Última actualización: 2026-10-31.

## La ventana "Nombres de los cuadros" (admin)

Se abre con un botón **"Nombres de los cuadros"** en el encabezado de
Planeaciones de clase (`EncabezadoPlaneacionesAdmin.jsx`, ruta
`/admin/planeadores-clases`). Es una ventana sobre la página y no una ruta
nueva: `/admin/planeadores-clases/:planId` ya existe y una ruta hermana se
confundiría con ella.

1. Arriba, un **aviso fijo**: *"Cambiar el nombre no cambia lo que recibe el
   cuadro ni borra lo escrito. Los planes que ya existen se verán con el
   nombre nuevo."*
2. Una fila por cuadro, nueve en total, en el orden del formulario del
   profesor. Cada fila tiene:
   - el nombre original en pequeño ("Original: Logro");
   - el campo **Nombre**;
   - el campo **Texto de ayuda**, solo en los siete cuadros de texto;
   - **Qué recibe**: "Texto. Acepta enlaces: los de YouTube se reproducen
     dentro de la clase y los demás se abren en otra pestaña", o "Un archivo:
     imagen PNG, JPG o WEBP de hasta 5 MB, o un PDF de hasta 15 MB".
3. Botones: **"Guardar"**, **"Volver a los originales"** y **"Cancelar"**.
   "Volver a los originales" solo cambia lo que se está editando, sin
   guardar; por eso no pide confirmación. Se guarda con "Guardar", y
   "Cancelar" lo descarta.

Reglas de la ventana:

- Antes de enviar revisa que ningún nombre quede vacío, que no pase de 60
  caracteres, que la ayuda no pase de 150 y que **no haya dos cuadros con el
  mismo nombre**. El backend no puede revisar esto último, porque solo ve los
  renombrados.
- Solo envía los cuadros que quedaron distintos del original. Escribir a mano
  el nombre original equivale a no renombrarlo.
- Si no pudo leer los nombres actuales, muestra el error con "Reintentar" y
  **"Guardar" queda desactivado** (invariante 5 del documento principal).
- Al guardar, el detalle del plan que esté abierto usa los nombres nuevos sin
  recargar.
- En el celular ocupa toda la pantalla.

## Dónde cambian los nombres

| Vista | Archivo | Qué cambia |
|---|---|---|
| Formulario del profesor | `GuiaDidacticaProfesor.jsx`, `EvidenciasPlanProfesor.jsx` | El nombre y la ayuda de los siete cuadros, y el nombre de los dos archivos |
| Presentación de la clase | `PresentacionClaseProfesor.jsx` | Los títulos y el texto alternativo de las imágenes |
| Detalle del admin | `DetallePlaneacionAdmin.jsx` | Los títulos y los nombres de las evidencias |

- **Tema** sale como título del plan, sin nombre, en la presentación y en el
  detalle del admin. Renombrarlo solo cambia el formulario.
- **"Actividad en clase"** (`competencias`) conserva su nombre fijo; solo
  aparece en planes viejos.
- Antes el admin veía "Estándar" y "Evidencia de desarrollo cognitivo". El
  usuario eligió el 2026-10-31 la opción A de la P1 del documento principal:
  el original es el nombre del formulario del profesor. Así, el admin ve
  ahora "Estándar / Lineamientos curriculares" y "Actividad a desarrollar".

## Dónde va el código (patrón del proyecto)

| Capa | Archivo |
|---|---|
| Contratos puros | `utils/planeaciones/cuadros.js`: `CUADROS_PLAN` (clave, nombre y ayuda originales, qué recibe), aplicar los nombres del colegio, validar y armar el envío. Los tamaños de "qué recibe" salen de `utils/planeaciones/evidencias.js`, sin repetirlos |
| Servicio | `services/planeacionesApi.js`: `obtenerCuadrosPlan` y `guardarCuadrosPlan` |
| Hook de consulta | `hooks/planeaciones/useCuadrosPlan.js`: una petición por página; si falla, usa los originales y avisa del error |
| Hook de comando | `hooks/planeaciones/useEdicionCuadrosPlanAdmin.js`: estado editable, validación, guardar y volver a los originales |
| Componente | `components/planeaciones/admin/VentanaCuadrosPlanAdmin.jsx` |
| Páginas | `PlanDeClases.jsx` y `PlaneadoresClasesAdmin.jsx` pasan los nombres a los componentes por props |

Los componentes siguen siendo de presentación: reciben los nombres por props
y no llaman al servicio.

## Invariantes

1. Ninguna pantalla escribe a mano el nombre de un cuadro. Todos salen de
   `cuadros.js` más lo que guardó el colegio.
2. Si la lectura de nombres falla, el profesor planea con los originales, sin
   bloqueo.
3. La ventana no guarda sin haber leído los nombres actuales.
4. El botón del admin es comodidad visual; el backend exige el rol.
5. Una sola petición más por apertura de página, no por cambio de fecha o de
   clase.

## Pruebas

- `utils/planeaciones/cuadros.js`: aplicar los nombres; validar vacío, largo y
  repetido; armar el envío solo con los distintos; los textos de "qué recibe".
- Servicio: rutas y cuerpo.
- Hooks: la falla devuelve los originales; guardar; no guardar sin haber leído.
- Ventana: el aviso visible, "qué recibe" en cada fila, "Guardar" desactivado
  con error y "Volver a los originales".
- Páginas: un nombre cambiado aparece en el formulario, en la presentación y en
  el detalle del admin, y el conteo de peticiones antes y después.

## Plan

Es el paso 2 del documento principal. Se cierra con `pnpm run check:deploy` y
con una prueba en local con el Colegio Demo antes de publicar.

Si el backend local apunta a la base de producción, esa prueba renombra los
cuadros del Colegio Demo de verdad. Se deshace con "Volver a los originales".

## Avance del paso 2 (2026-10-31)

Construido como en el diseño, con estos ajustes:

- **Una lectura para todo Planeaciones del admin.** `useCuadrosPlan` va en
  `PlaneadoresClasesAdmin`, el componente que elige entre la bandeja y el
  detalle, y no en cada uno. La bandeja la usa para la ventana y el detalle
  para los títulos. Abrir otro plan no vuelve a pedir los nombres.
- **"Volver a los originales" no guarda por sí solo** (ver arriba). Por eso
  no hace falta confirmación.
- **Si la ventana se abre antes de que termine la lectura,** muestra
  "Cargando los nombres actuales..." y, en cuanto llegan, los campos con lo
  leído. Mientras el admin no escriba, los valores salen de lo leído
  (`useEdicionCuadrosPlanAdmin`).
- **Después de guardar,** la ventana se cierra, el encabezado dice "Nombres
  guardados." y la página usa los nombres nuevos sin volver a pedirlos
  (`reemplazar`).
- Los nombres no dependen del año que mira el admin: se pueden cambiar
  también mirando un año cerrado.

Verificación:

- `pnpm run check:deploy`: **3173 pruebas en 393 archivos**, lint y build
  correctos.
- Pruebas nuevas:
  - `utils/planeaciones/cuadros.test.js`;
  - los dos hooks;
  - `VentanaCuadrosPlanAdmin.test.jsx`;
  - las dos llamadas en `planeacionesApi.test.js`;
  - en `PlanDeClases.test.jsx`: los nombres del colegio en el formulario y
    en la presentación, con una sola petición, y que una falla de lectura
    no bloquea al profesor;
  - en `PlaneadoresClasesAdmin.test.jsx`: renombrar desde la bandeja manda
    la lista completa, y el detalle usa los nombres del colegio.

Publicación: el usuario hizo el commit (`860af97`) y el push el 2026-10-31, y
Vercel terminó bien ("Deployment has completed").
