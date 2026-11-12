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
3. «Mi curso»: "Guardar mi firma" para el director de grupo.
4. Boletín: cada firma sobre su raya; sin firma, la raya vacía y un aviso.
5. Certificados: la firma del rector(a), opcional.
