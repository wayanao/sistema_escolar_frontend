# Funcionalidad: Certificados nuevos (paz y salvo, conducta, aprobado y costos)

## Control

- Estado: **pasos 1 y 2 construidos, sin commit** (2026-11-05). El botón
  "Atrás" de las vistas de certificados también cambió de lugar (ver "Botón
  Atrás").
- Tipo: función nueva de producto dentro del módulo `certificadosImpresion`
  (`docs/modularizacion/CERTIFICADOS_IMPRESION.md`).
- Pantalla: `/admin/certificados` (`CertificadosAdmin.jsx`).
- Backend: **no hace falta cambiarlo** con el plan de abajo. Todo sale de
  datos que ya existen o se guarda en `configuracion_extra` del branding, un
  campo libre que el backend guarda sin revisar (ahí ya viven el membrete y la
  resolución de aprobación).
- Última actualización: 2026-11-05.

## Pedido

El usuario quiere cuatro certificados nuevos —paz y salvo, conducta, aprobado
y costos educativos— y elegir el documento en un menú desplegable en vez de
pestañas. El de costos se debe poder editar antes de imprimir. Mandó fotos de
los modelos que hoy hace el colegio en Word.

## Lo que llevan los modelos

Los cinco modelos tienen la misma forma; solo cambia una frase del medio:

1. Encabezado del colegio: logo, nombre, NIT, DANE, resolución y lema. Ya lo
   pone `DocumentoImprimible`.
2. "LA SUSCRITA DIRECTORA DEL CENTRO EDUCATIVO …".
3. "CERTIFICA:".
4. "Que **el niño / la niña** NOMBRE, identificado(a) con **R.C. / T.I.** No.
   NÚMERO, … el grado **GRADO** del nivel de **Educación Preescolar / Básica
   Primaria** del año lectivo **AÑO** …".
5. "Se expide la presente certificación a solicitud del interesado en
   **CIUDAD**, a los **veinte (20)** días del mes de **enero** de **AÑO**."
6. "Atentamente," y la firma: nombre, cédula con su lugar de expedición y
   cargo.
7. Pie con dirección, teléfonos y correo. Ya lo pone `DocumentoImprimible`.

| Certificado | Frase del medio | Dato especial | De dónde sale |
|---|---|---|---|
| Paz y salvo | "quien cursó el grado … se encuentra a paz y salvo con nuestra institución" | Que no deba nada vencido | `GET /cartera/mora` (cartera del backend) |
| Conducta | "cursó el grado … con una conducta descriptiva en DESEMPEÑO ALTO" | El desempeño | Lo elige el admin al imprimir: Superior, Alto, Básico o Bajo |
| Aprobado | "cursó y aprobó en esta institución el grado …" | — | Lo decide el admin al imprimir |
| Costos educativos | "se encuentra matriculado(a) … Con los siguientes costos educativos: • Matrícula • Pensión" | La lista de costos | `GET /estudiantes/{id}/valores-pago` (`valor_a_pagar`, ya con su precio personalizado), editable antes de imprimir |

## Qué tiene el sistema y qué falta

Ya tiene: nombre, `tipo_documento` ("Registro Civil", "Tarjeta de
Identidad"…, de donde salen "R.C." y "T.I."), número de documento, curso,
`nivel` del curso (`preescolar` o `primaria`), año lectivo (selector de año),
lo que paga cada estudiante y quién está en mora.

Falta, y cómo se resuelve:

- **Niño o niña**: la ficha no guarda el sexo. Un botón "Niño / Niña" junto a
  la hoja, que no se imprime.
- **Quién firma** (nombre, cédula y lugar, cargo), la **ciudad** de
  expedición y la frase "La suscrita directora…": hoy los certificados salen
  con la línea de firma vacía. Se agregan en *Diseño de impresos → Identidad
  institucional*, dentro de `configuracion_extra`.
- **Conducta**: no se guarda en ningún lado; se elige al imprimir.

## Pasos

1. **Menú "Tipo de documento" en vez de pestañas** — construido, sin commit.
   Mismas tres opciones de antes; las nuevas se agregan en sus pasos.
2. **Firma, ciudad y frase de encabezado en Identidad institucional** —
   construido, sin commit.
3. Conducta y aprobado, con el formato de los modelos.
4. Paz y salvo.
5. Costos educativos, editable antes de imprimir. Lo editado es solo para esa
   impresión: no cambia los precios de Tipos de pago.

## Avance del paso 1

- `SeleccionCertificados.jsx`: las pestañas pasan a un `<select>` con
  etiqueta "Tipo de documento" (`TIPOS_DOCUMENTO`). Ocupa todo el ancho en el
  celular y hasta `max-w-sm` desde `md`. Las props siguen llamándose
  `tabActiva` y `onCambiarTab`, para no tocar la página ni el hook.
- Pruebas: `SeleccionCertificados.test.jsx` (prueba nueva: el menú tiene las
  tres opciones y ya no hay pestañas), `CertificadosAdmin.test.jsx` y
  `CertificadosAdmin.anioLectivo.test.jsx` eligen en el menú en vez de hacer
  clic en la pestaña.

## Avance del paso 2

- *Diseño de impresos → Identidad institucional*, dentro de "Datos
  institucionales" y antes de los colores: grupo nuevo **"Certificados: firma
  y lugar"** con cinco campos, que se guardan con el mismo "Guardar cambios":

  | Campo | Clave en `configuracion_extra` |
  |---|---|
  | Frase antes de «CERTIFICA:» (dos líneas) | `certificado_encabezado` |
  | Nombre de quien firma | `firmante_nombre` |
  | Cargo de quien firma | `firmante_cargo` |
  | Documento de quien firma (tal como sale: "C.C. … de …") | `firmante_documento` |
  | Ciudad donde se expiden | `ciudad_expedicion` |

- La lista de claves que van en `configuracion_extra` quedó en un solo lugar:
  `CAMPOS_IDENTIDAD_EXTRA` (`utils/certificadosImpresion/impresion.js`). El
  hook la usa en vez de tener la lista escrita a mano.
- `IdentidadInstitucionalView.jsx`: el dibujo de cada campo pasó a
  `CampoTexto`, para usarlo en los dos grupos. Los campos de antes no
  cambian.
- Todavía **ningún impreso usa estos datos**: los leen los certificados
  nuevos desde el paso 3.
- Pruebas: `IdentidadInstitucionalView.test.jsx` (los cinco campos se ven y
  avisan el cambio) y `useIdentidadInstitucional.test.js` (se guardan en
  `configuracion_extra` sin borrar lo que ya había).

## Botón Atrás

Pedido del usuario el 2026-11-05 ("ubica mejor el botón de echar para
atrás"). Era fijo en la esquina de arriba a la izquierda de la pantalla y,
con el menú lateral nuevo, quedaba encima del menú (computador) y de la barra
de arriba (celular).

- Ahora va arriba de la hoja, dentro de la página, alineado con el borde
  izquierdo del papel: `BotonAtrasCertificado.jsx`, usado por las vistas de
  notas, matrícula y reporte parcial (y por los certificados nuevos).
- Al bajar por un documento largo, el botón ya no acompaña: hay que subir.
- **Otros nueve impresos** tienen el mismo botón fijo en la esquina y no se
  tocaron: boletín, cartera vencida, entrevista de admisión, observaciones,
  volante de venta, listas de seguimiento, malla curricular, observador y
  comprobante de pago.
- Prueba: `VistasImprimibles.test.jsx` revisa que el botón no sea fijo.

## Preguntas abiertas

Se hacen justo antes del paso que las necesita.

- **Paso 3**: ¿el certificado de matrícula actual pasa también al formato de
  los modelos? ¿"cursa" si el año está abierto y "cursó" si ya terminó, o
  siempre "cursó" como en los modelos? ¿Los certificados de notas y matrícula
  también ponen el nombre de quien firma? Hoy sacan la línea vacía con
  "Director(a)".
- **Paso 4**: si piden un paz y salvo y el estudiante debe, ¿se bloquea o se
  deja imprimir con aviso? Ojo: la cartera cuenta solo lo vencido; los meses
  que aún no llegan no cuentan como deuda.

## Fuera por ahora

- La imagen de la firma escaneada: necesitaría un lugar nuevo para subirla en
  el backend (hoy solo hay logo principal y secundario). Se firma a mano en el
  papel.
