# Funcionalidad: Firma del acudiente en el observador — Frontend

## Control

- Estado: **diseñado el 2026-10-27, nada implementado.**
- Tipo: función nueva de producto. No es un módulo de `docs/modularizacion/`.
- **El documento principal es
  `sistema_escolar_api/docs/funcionalidades/FIRMA_OBSERVADOR.md`**, con las
  decisiones, la tabla, los permisos, la API y el orden de publicación. Este
  documento cubre las pantallas y la impresión.
- Depende de que el paso 1 del backend esté publicado, con sus endpoints y la
  migración en producción. **El paso 2 no empieza antes.**
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
  principal).

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
