# Funcionalidad: Firma del acudiente en el observador — Frontend

## Control

- Estado: **paso 2 (la pantalla) construido el 2026-10-27, sin publicar.**
  Pasa `pnpm run check:deploy`. Falta la prueba en local contra la rama
  `prueba-firma-observador` de Neon y, después, publicar. El paso 3 (la firma
  en el impreso) viene después. Ver "Avance del paso 2".
- Tipo: función nueva de producto. No es un módulo de `docs/modularizacion/`.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/FIRMA_OBSERVADOR.md`**, con las
  decisiones, la tabla, los permisos, la API y el orden de publicación. Este
  documento cubre las pantallas y la impresión.
- Depende de que el paso 1 del backend esté publicado, con sus endpoints y la
  migración en producción. **Cumplido el 2026-10-27** (backend `c195fff`).
- Última actualización: 2026-10-27.

## Dónde se ve

- **Profesor:** en la bitácora del estudiante (`src/pages/Observador.jsx`, en
  `VistaObservadorEstudiante`).
- **Admin:** en la ficha del estudiante (`ObservadorEnFichaAdmin.jsx`). Hoy es de
  solo lectura, y lo único que gana es el botón de firmar (decisión 3 del
  documento principal).

## Cada anotación

- **Sin firma, si el servidor dice `puede_firmar`:** aparece el botón **"Firmar
  con el acudiente"** en el encabezado (`EncabezadoAnotacion`), junto a
  `[Editar]`.
- **Firmada:** lleva un sello, por ejemplo "Firmada por Ana Gómez (madre) ·
  27/10/2026, 10:15 · ante Prof. Pérez", y ya no muestra `[Editar]`. Si el
  servidor dice `integra: false`, el sello lo advierte.
- Los botones no son la regla, son comodidad visual, igual que `[Editar]` hoy.
  Quien decide es el servidor (`403` / `409`).

## La ventana de firma

1. Arriba va **el texto completo de la anotación**, que es lo que el acudiente
   lee.
2. **¿Quién firma?** Hay un botón para el papá y otro para la mamá de la ficha,
   con su nombre y documento (los trae `firmantes-sugeridos`). También está
   "Otro acudiente", que pide nombre, tipo y número de documento, y parentesco.
3. **Recuadro de firma**, para firmar con el dedo, un lápiz o el mouse. Tiene un
   botón "Borrar".
4. Casilla **"El acudiente leyó esta anotación"**.
5. **"Guardar firma"**, que solo se activa cuando todo lo anterior está completo.

Después de guardar, si quedan anotaciones pendientes que el usuario puede
firmar, aparece **"Firmar la siguiente"**. Los datos de quien firma se
recuerdan, pero **la firma se dibuja de nuevo**, porque la decisión 2 es una
firma por anotación. Esos datos solo se recuerdan mientras la ventana sigue
abierta; no se guardan en el navegador.

En el celular la ventana ocupa toda la pantalla y el recuadro usa todo el ancho.

Errores:

- `409`, porque ya está firmada o porque la anotación cambió: se recarga la
  bitácora y se avisa.
- `403`: se avisa que no hay permiso.
- Falla de red: se puede reintentar sin perder el trazo.

## El recuadro de firma

- Es un componente propio, con `<canvas>` y eventos de puntero (dedo, lápiz y
  mouse). **No usa librerías nuevas**, en línea con la actualización de
  seguridad.
- Exporta un PNG reducido, de menos de 100 KB, que es el límite del servidor.
- Sabe si está vacío, así que no deja guardar una firma en blanco.

## Impresión (paso 3)

- En `ObservadorImprimible`, debajo de cada anotación firmada va la imagen de la
  firma con el nombre, el documento, el parentesco, la fecha y la hora, y quién
  la tomó.
- Las imágenes se piden una sola vez, al imprimir
  (`GET /observador/{estudiante_id}/firmas`), y no al pintar la bitácora.
- El pie (`firmasObservador`) se decide en el paso 3 (P2 del documento
  principal). **Decidido al construirlo: la raya «Firma del Acudiente» se
  queda.**

## Avance del paso 3 (2026-11-18)

Construido junto con la firma del director de grupo en el impreso del admin
(`docs/funcionalidades/FIRMAS_BOLETIN.md`, "Ampliación"), sin cambios en el
backend para esta parte.

- **`ImpresionObservador`** (nuevo, conector): solo se monta mientras se
  imprime y usa **`useFirmasImpresionObservador`** (nuevo), que pide las firmas
  cada vez que se abre el impreso. Una firma tomada hace un momento ya sale.
  `ObservadorImprimible` sigue siendo presentacional y recibe
  `firmasAcudiente`, `firmaDirector`, `cargandoFirmas` y `errorFirmas`.
- **Firma del acudiente:** bajo cada anotación firmada, la imagen y
  «Firmó Pedro Rojas (padre) · Cédula 1234567 · 27/oct/2026, 10:15 · ante Sara
  Díaz» (`textoFirmaImpresa`). En papel, el documento va **completo**; en
  pantalla, enmascarado (P3). En la vista por dimensión va en cada bloque de la
  anotación, igual que el sello en pantalla. Si `integra` es `false`, el papel
  también lo advierte.
- **Firma del director de grupo** (solo la ficha del admin, `conFirmaDirector`):
  `GET /firmas/director-grupo/{estudiante_id}`, con el año que mira el admin.
  Con firma, la raya lleva su nombre y su firma; sin firma, su nombre y un
  aviso antes de imprimir; sin director, la raya de siempre. El profesor nunca
  la pide.
- **Avisos, solo en pantalla** (`no-print`): «Cargando las firmas…» mientras
  llegan; si una consulta falla, el impreso sale con las rayas vacías y lo
  dice. Cada consulta cae por su lado (`Promise.allSettled`).
- Pruebas: `useFirmasImpresionObservador.test.js` (nuevo) y casos nuevos en
  `impresion.test.js`, `ObservadorImprimible.test.jsx`,
  `ObservadorEnFichaAdmin.test.jsx`, `pages/Observador.test.jsx`,
  `observadorApi.test.js` y `firmasApi.test.js`.

## Dónde va el código (patrón del proyecto)

| Capa | Archivo |
|---|---|
| Servicio | `services/observadorApi.js`: `firmarAnotacion`, `obtenerFirmantesSugeridos` y `obtenerFirmasParaImprimir` |
| Contratos puros | `utils/observador/firma.js`: validar al firmante, enmascarar el documento y armar el envío |
| Hook de comando | `hooks/observador/useFirmaAnotacion.js` |
| Componentes | `components/observador/VentanaFirmaAnotacion.jsx`, `RecuadroFirma.jsx` y `SelloFirma.jsx` |

## Invariantes

1. La bitácora se sigue cargando con **una sola petición** (invariante 1 del
   observador).
2. Los botones y los sellos son cosméticos; la regla vive en el servidor.
3. No se puede guardar una firma vacía ni sin marcar la casilla de lectura.
4. Los datos del firmante no se guardan en `localStorage`.

## Pruebas

- `utils/observador/firma.js`: las validaciones y el enmascarado.
- Servicio: rutas, cuerpo y cancelación.
- Hook: guardar, el `409` y el reintento.
- Ventana: "Guardar firma" desactivado hasta completar, y el firmante recordado
  en "Firmar la siguiente".
- Página: el flujo completo, y que una anotación firmada no muestre `[Editar]`.

## Plan

Son los pasos 2 y 3 del documento principal. Cada uno se cierra con
`pnpm run check:deploy` y con una prueba en local con el Colegio Demo antes de
publicar.

## Avance del paso 2 (2026-10-27)

Construido como se describe arriba. Ajustes que salieron al construirlo:

- **El documento llega ya enmascarado del servidor.** La pantalla no
  enmascara nada; solo muestra `firmante_documento_enmascarado`.
- **La ventana no se cierra al tocar fuera**, a diferencia de la de subnotas.
  Un dedo que se resbala mientras alguien firma no puede borrar lo hecho.
- **Los botones van en su propia barra, fuera del `<fieldset>`**, y solo el
  cuerpo se desplaza. En la primera prueba del usuario (2026-10-27), con el
  `<fieldset>` repartiendo el alto, la ventana creció por debajo de la pantalla
  y "Guardar firma" no se veía. Ahora el fieldset solo deshabilita los campos
  mientras se guarda, y el fondo también se puede desplazar como red de
  seguridad. Hay una prueba que lo fija.
- **Va en un portal sobre `document.body`, en `z-[60]`.** En la ficha del
  admin, la ventana de firma queda por encima de la ficha, que también es una
  ventana (`z-50`).
- **`useFirmaAnotacion` entrega `propsVentana`.** La página del profesor y la
  ficha del admin montan la ventana igual, sin repetir la lista de props.
- **`TIPOS_DOCUMENTO_ACUDIENTE` pasó a `src/constants/documentosEstudiante.js`.**
  Son «Cédula» y «Cédula Extranjera», que estaban escritos a mano en
  `FormularioEstudianteAdmin.jsx`. La ficha y la firma usan ahora la misma
  lista, y así el papá y la mamá sugeridos encajan en una opción. La ficha se
  ve igual. La firma añade «Pasaporte», «PPT» y «Otro», y si la ficha trae otro
  valor, lo agrega en vez de perderlo.
- **Sin firmantes sugeridos, la ventana se llena a mano.** Pasa con un `403` o
  con un fallo de la consulta; las sugerencias no son necesarias.

Pruebas:

- Nuevas: `utils/observador/firma.test.js`, `hooks/observador/useFirmaAnotacion.test.js`,
  `RecuadroFirma.test.jsx`, `SelloFirma.test.jsx` y `VentanaFirmaAnotacion.test.jsx`.
- Ampliadas: el servicio, `formulario.test.js`, `AnotacionObservador.test.jsx`,
  `VistaObservadorEstudiante.test.jsx`, `ObservadorEnFichaAdmin.test.jsx` y
  `pages/Observador.test.jsx`, que ahora incluye el flujo completo de firmar.
- jsdom no dibuja: `src/test/lienzoFalso.js` cambia el contexto del `<canvas>`
  por uno que acepta los trazos.
- `pnpm run check:deploy`: **3095 pruebas** en 388 archivos (antes 3033 en 383),
  lint limpio y build con 505 módulos.

Falta la prueba en local. Una firma no se borra, así que el backend local debe
apuntar a la rama `prueba-firma-observador` de Neon, que ya tiene la tabla, y
no a producción.

## Ampliación: firmar un periodo de una vez (2026-10-27)

El usuario pidió, mientras probaba, poder firmar todo un periodo de una vez sin
quitar la firma individual. Eligió que el acudiente vea **todas las anotaciones
pendientes del periodo** y firme una sola vez (no una firma por dimensión).

- **Botón «Firmar un periodo»** en la bitácora, junto a «Nueva anotación». Solo
  sale si hay algo pendiente que el usuario pueda firmar (`puede_firmar`). Abre
  con el periodo del selector si tiene pendientes; si no, con el primero que
  tenga (`periodoParaFirmar`).
- **La misma ventana en modo periodo.** Muestra:
  - todas las anotaciones que se firman, con su texto completo;
  - botones para cambiar de periodo (`Periodo 2 (3)`);
  - la casilla "El acudiente leyó estas N anotaciones";
  - "Guardar firma (N)".

  Al guardar, dice "Firma guardada en N anotaciones".
- **La lista se congela al abrir.** El acudiente firma exactamente lo que vio,
  aunque la bitácora se recargue. Cambiar de periodo borra el trazo y la
  casilla, porque lo que se firma ya es otra cosa; quien firma se conserva.
- `services/observadorApi.js`: `firmarAnotacionesDelPeriodo` envía la lista
  exacta `[{id, version}]` (`construirPayloadFirmaPeriodo`), nunca el número
  del periodo.
- Si una de las anotaciones no se puede firmar, el servidor no firma ninguna
  y la pantalla recarga la bitácora.
- `check:deploy` con la carga habitual de esta máquina: 8 procesos de Vitest
  no alcanzaron a arrancar ("Timeout starting forks runner"), sin ninguna
  prueba fallida. Corriendo por partes: **3112 pruebas en 388 archivos**, lint y
  build correctos.
