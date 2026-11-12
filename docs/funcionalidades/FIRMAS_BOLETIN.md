# Firmas guardadas para el boletín (frontend)

El documento principal, con las decisiones del usuario, la base de datos y la
API, está en el backend:
`sistema_escolar_api/docs/funcionalidades/FIRMAS_BOLETIN.md`. Aquí va lo del
frontend.

## Resumen

Pedido del 2026-11-12: que los boletines salgan firmados. Firman el rector(a)
(raya "Director(a)") y el director de grupo (raya "Director de Grupo"). La firma
del rector la sube el admin en Identidad institucional; la de cada director de
grupo la pone él mismo desde «Mi curso». En los certificados, la firma del
rector será opcional.

## Módulo `firmas`

Sigue las capas de siempre y lo comparten dos pantallas (Identidad
institucional y «Mi curso»):

| Capa | Archivo | Qué hace |
| --- | --- | --- |
| Servicio | `services/firmasApi.js` | `/firmas/institucional` y `/firmas/mia`: leer, guardar, quitar. |
| Reglas puras | `utils/firmas/imagenFirma.js` | Qué es tinta, quitar motas, recorte, tamaño, peso, fecha, mensajes. |
| Navegador | `hooks/firmas/lienzoFirma.js` | Abre la foto o el trazo y mueve los píxeles en un canvas. |
| Consulta y comando | `hooks/firmas/useFirmaGuardada.js` | Carga la firma guardada; la guarda o la quita, con la ventana de espera y éxito de siempre. |
| Edición | `hooks/firmas/useEditorFirma.js` | La firma nueva antes de guardarla: foto o dedo. |
| Pantalla | `components/firmas/CuadroFirma.jsx` | El cuadro: firma guardada sobre su raya, foto, dedo, quitar. |

El recuadro para firmar con el dedo es el del observador
(`components/observador/RecuadroFirma.jsx`), con una `etiqueta` nueva para el
nombre que leen los lectores de pantalla.

## Cómo se prepara la imagen

Lo que se guarda es siempre un PNG con solo la tinta, de un color oscuro
parejo (`#0f172a`, el del trazo del recuadro), con fondo transparente,
recortado a la firma, de hasta 900 × 300 px y menos de 100 KB.

1. La foto se achica a 1600 px por el lado más largo.
2. **Qué es tinta:** lo más oscuro que el 70 % del papel **de alrededor**. El
   papel se mide por bloques de 32 px (el brillo que deja abajo el 90 % de
   cada bloque) y se mezcla entre bloques vecinos. Con el papel de toda la foto,
   la sombra de una esquina pasaba por tinta y estiraba el recorte. Se vio el
   2026-11-12 con una foto de prueba.
3. **Motas** (solo en fotos): las manchas sueltas de menos de 16 píxeles se
   borran. Bastaba un punto de polvo para estirar el recorte. El punto de una
   «i» hecho con lapicero suele ser más grande y se queda. El trazo con el dedo
   no quita motas: un toque corto es parte de la firma.
4. Si más del 30 % es tinta, o el papel de toda la foto es muy oscuro: "La foto
   está muy oscura…". Si no queda tinta: "No se ve ninguna firma…".
5. Recorte con 8 px de margen. Si pasa de 100 KB, se reintenta al 70 % y al
   50 %; si aun así pesa mucho, se avisa.

Prueba en un navegador real (Edge oculto, 2026-11-12), con una foto falsa de
2000 × 1500 que tenía luz desigual, sombra en una esquina, grano y polvo:
salió de 900 × 231 px y 49,5 KB, en 108 ms. El trazo del recuadro salió de
717 × 189 px y 18 KB. Una hoja en blanco dio el aviso.

## Pasos

1. Backend: ver el documento principal.
2. **Identidad institucional** (`pages/BrandingAdmin.jsx`): cuadro "Firma del
   rector(a)" debajo de los logos. Como los logos, se guarda solo, sin
   «Guardar cambios». Botones: "Subir foto de la firma", "Firmar aquí con el
   dedo" y, con firma, "Quitar firma" (pregunta antes). La foto muestra "Así va
   a salir:" antes de guardar. **Construido el 2026-11-12, sin commit.**
3. **«Mi curso»** (`pages/IngresoBoletinProfesor.jsx`, `MiFirmaPanel`).
   **Construido el 2026-11-12, sin commit.**
   - Cuadro "Tu firma para los boletines" arriba del ranking.
   - Solo se monta con «Mi curso» abierto: los profesores que no dirigen curso
     no hacen ninguna petición de más.
   - `CuadroFirma` con `variante="profesor"`, pensado para profesores mayores:
     - sin firma: un solo botón grande, "Firmar con el dedo", y la foto como
       enlace ("o subir una foto de tu firma");
     - con firma: un renglón con la firma, "✓ Tu firma ya sale en los
       boletines de tu curso", "Cambiar mi firma" y "Quitar mi firma";
     - firmando: "Guardar mi firma" y el enlace "¿Prefieres una foto de tu
       firma? Súbela aquí".
4. **Boletín** (adelantado al 3 a pedido del usuario). **Construido el
   2026-11-12, sin commit.**
   - `utils/boletines/firmasBoletin.js`: las dos firmas y los avisos.
     - Debajo de la raya va el nombre y el cargo cuando se saben: el
       firmante de Identidad institucional, y el director de grupo con
       "Director(a) de grupo".
     - Sin nombre, lo de siempre ("Director(a)", "Director de Grupo").
   - Quién firma por el colegio lo lee `utils/firmanteInstitucional.js`, que
     comparten boletín y certificados (antes vivía en los utils de
     certificados).
   - `DocumentoImprimible`: cada firma acepta `imagen`.
     - `.di-firmas__imagen` la pone sobre la raya con posición absoluta,
       hasta 64 px de alto.
     - En el boletín, 24 de los 40 px de aire antes de las firmas pasaron a
       ser relleno, para que la imagen quede dentro del bloque que no se parte
       entre hojas. El alto total es el mismo; los demás impresos no
       cambiaron.
   - Aviso amarillo arriba de la hoja (`no-print`) cuando falta la firma del
     rector(a) o la del director de grupo. Sin director asignado, no se le
     pide.
   - Visto con Edge oculto: las dos firmas se apoyan sobre su raya, sin tocar
     la observación general.
5. **Certificados.** **Construido el 2026-11-12, sin commit.**
   - Casilla «Con la firma del rector(a)» (`OpcionFirmaRector`) en la barra de
     arriba, **desmarcada en cada certificado** (lo recomendado; el usuario
     dijo "sigue lo que recomiendas").
   - Está en los cinco formales (matrícula, conducta, aprobado, paz y salvo,
     costos) y en el de notas; en el de notas, solo en la raya del rector(a).
     El reporte parcial no la lleva: sus rayas son de Coordinación y Dirección.
   - `useFirmaParaImprimir` pide la firma al abrir el primer certificado, no
     en la lista, y una sola vez por visita.
   - Sin firma guardada, la casilla no se puede marcar y dice dónde subirla.
   - En los certificados, 24 de los 50 px antes de las firmas pasaron a
     relleno, como en el boletín. El alto total es el mismo.
