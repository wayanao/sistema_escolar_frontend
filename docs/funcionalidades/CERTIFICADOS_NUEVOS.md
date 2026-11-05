# Funcionalidad: Certificados nuevos (paz y salvo, conducta, aprobado y costos)

## Control

- Estado: **los cinco pasos construidos, sin commit** (2026-11-05). Falta
  la prueba del usuario en local. El botón
  "Atrás" de las vistas de certificados también cambió de lugar (ver "Botón
  Atrás").
- Tipo: función nueva de producto dentro del módulo `certificadosImpresion`
  (`docs/modularizacion/CERTIFICADOS_IMPRESION.md`).
- Pantalla: `/admin/certificados` (`CertificadosAdmin.jsx`).
- Backend: **no hace falta cambiarlo** con el plan de abajo. Todo sale de
  datos que ya existen o se guarda en `configuracion_extra` del branding, un
  campo libre que el backend guarda sin revisar (ahí ya viven el membrete y la
  resolución de aprobación). El tipo de documento sale de la ficha
  (`GET /estudiantes/{id}`, que ya existía): la lista de estudiantes no lo
  trae. Lo que debe, para el paz y salvo, de `GET /estudiantes/{id}/deudas` y
  `GET /api/ventas/pendientes/{id}`, que también existían (las usa Pagos).
  Los costos, de `GET /estudiantes/{id}/valores-pago` (la usa Año lectivo al
  matricular).
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
3. **Conducta y aprobado, con el formato de los modelos** — construido, sin
   commit. La matrícula pasó también a ese formato.
4. **Paz y salvo, solo si no debe nada** — construido, sin commit.
5. **Costos educativos, editable sobre la hoja** — construido, sin commit.
   Lo editado es solo para esa impresión: no cambia los precios de Tipos de
   pago.

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
- Desde el paso 3 los usan matrícula, conducta, aprobado y la firma de
  dirección del certificado de notas.
- Pruebas: `IdentidadInstitucionalView.test.jsx` (los cinco campos se ven y
  avisan el cambio) y `useIdentidadInstitucional.test.js` (se guardan en
  `configuracion_extra` sin borrar lo que ya había).

## Decisiones del paso 3

Tomadas el 2026-11-05; el usuario siguió las tres recomendaciones.

1. El certificado de matrícula pasa también al formato de los modelos. Deja
   el recuadro (documento, curso, jornada, estado), la jornada y el texto
   general de antes ("…para los fines que estime convenientes…").
2. "cursa" si el año sigue abierto y "cursó" si ya cerró **o** el estudiante
   está retirado o egresado. En la matrícula: "se encuentra matriculado(a)" o
   "estuvo matriculado(a)". El aprobado dice siempre "cursó y aprobó".
3. Los certificados de notas y matrícula firman con el nombre, el documento y
   el cargo configurados. Sin configurar, la línea vacía con "Director(a)" de
   antes. La segunda firma de notas ("Secretaria academica") no cambia.

## Avance del paso 3

- Menú: "Certificado de conducta" y "Certificado de aprobado". No piden
  periodo ni año (usan el que se mira); el botón dice "Generar conducta" o
  "Generar aprobado".
- Al generar (matrícula, conducta o aprobado) se pide la ficha
  (`obtenerFichaEstudianteCertificado`, con cancelación). Si falla: "No se
  pudo cargar la ficha del estudiante." y no se abre el certificado. El curso
  y el estado salen de la lista del año, no de la ficha.
- El año: la matrícula usa el campo editable de siempre; conducta y aprobado,
  el año que se mira.
- `CertificadoFormal.jsx`, la hoja común:
  1. La frase antes de «CERTIFICA:» (si está configurada; si no, la hoja
     empieza en «CERTIFICA:»).
  2. «CERTIFICA:» espaciado.
  3. El párrafo, con nombre, grado y desempeño en negrita y en mayúsculas.
  4. "Se expide la presente certificación a solicitud del interesado en
     CIUDAD, a los veinte (20) días del mes de enero de 2026." Sin ciudad, sin
     "en CIUDAD". El día 1 dice "al primer (01) día".
  5. "Atentamente," y la firma de `DocumentoImprimible`.
- Opciones arriba de la hoja, que no se imprimen:
  - **"En el texto decir"**: el(la) estudiante (al abrir), el niño, la niña,
    el estudiante, la estudiante. Cambia "identificado/a" y "matriculado/a".
    Vuelve a neutro con cada estudiante.
  - **"Desempeño"** (solo conducta): Superior, Alto, Básico o Bajo. Sin
    elegir, "DESEMPEÑO ________", para llenarlo a mano.
- Lo que falta en la ficha también sale en raya (sin número de documento,
  sin curso).
- Textos: `utils/certificadosImpresion/certificadosFormales.js`, con pruebas
  en `certificadosFormales.test.js`.
- `DocumentoImprimible`: la firma acepta `documento` (entre nombre y cargo),
  y `firmas` y `children` pueden ser funciones que reciben el branding. Así
  los certificados leen quién firma y la ciudad sin pedirlos aparte. Los
  demás impresos no cambian.

## Paso 4: paz y salvo

Decisión del 2026-11-05 (el usuario siguió la recomendación): **si debe algo,
no se expide**, y se muestra qué debe para que se registre el pago primero.
Un paz y salvo firmado con deuda deja al colegio sin cómo cobrarla.

Qué cuenta como deuda (todo lo calcula el backend; la pantalla solo suma):

- Lo del año **vencido a hoy**, con su mora (`GET /estudiantes/{id}/deudas`).
  Las mensualidades que todavía no llegan no cuentan.
- Lo de **años anteriores** (`deuda_anios_anteriores`, en la misma respuesta).
- Las **ventas fiadas** con saldo, como uniformes (`GET
  /api/ventas/pendientes/{id}`): "a paz y salvo con nuestra institución"
  incluye lo que se le vendió.

De qué año:

- Las deudas se piden **sin año** (el activo), aunque se mire un año pasado:
  esa respuesta trae también los años anteriores, y así no se expide a quien
  debe meses de este año.
- Si responde 404 (no está matriculado en el año activo, como un egresado) y
  se mira otro año, se piden las de ese año.
- No se usa `GET /cartera/mora`: en el año activo solo trae estudiantes
  activos, y un retirado (quien más pide paz y salvo) saldría a paz y salvo
  debiendo.

En la pantalla:

- Menú: "Certificado de paz y salvo"; botón "Generar paz y salvo".
- Si debe: no abre la hoja y sale un aviso arriba de la tabla
  (`AvisoDeudaPazSalvo.jsx`): "No se puede expedir el paz y salvo: NOMBRE
  debe $ X.", "Registra el pago en Pagos y vuelve a generarlo. Solo cuenta lo
  vencido a hoy.", la lista (concepto, "Año 2025" o la venta, y su valor) y
  "Cerrar". Se quita también al cambiar de documento o al generar otro.
- Si no puede revisar la deuda (falla la consulta): "No se pudo revisar si el
  estudiante está a paz y salvo." y no lo abre.
- Si no debe: la hoja con el formato de los modelos, "quien cursa/cursó el
  grado … del año lectivo …, se encuentra a paz y salvo con nuestra
  institución."

## Paso 5: costos educativos

Pedido del usuario el 2026-11-05: "los costos son editables desde la
impresión". Se editan **sobre la misma hoja**, donde se imprimen; al abrir
salen llenos con lo que paga el estudiante (la recomendación).

- Menú: "Certificado de costos educativos"; botón "Generar costos".
- Al generar pide, junto con la ficha, `GET /estudiantes/{id}/valores-pago`
  del año que se mira: cada concepto con `valor_a_pagar`, que ya trae el
  precio del curso o el valor personalizado del estudiante. El backend deja
  fuera los opcionales y los inactivos. Sin matrícula en ese año responde 404,
  y se muestra su mensaje.
- El texto es el de la matrícula ("se encuentra / estuvo matriculado(a) en
  esta institución en el grado …") y debajo "Con los siguientes costos
  educativos:" con una viñeta por costo, como el modelo.
- En pantalla cada viñeta es un campo de concepto y uno de pesos
  (`CampoPesos`, con puntos de miles), con una ✕ para quitarla; debajo,
  "+ Agregar costo". Arriba de la hoja, un aviso: "Los costos se cambian sobre
  la hoja. Es solo para esta impresión: no cambia los precios de Tipos de
  pago."
- En el papel solo sale el texto: "Matrícula: $ 280.000". Los campos y
  botones llevan `print:hidden` y el texto `hidden print:inline` (revisado en
  el CSS del build). Una fila sin concepto no se imprime; sin valor, solo el
  concepto. Sin ningún costo, no se imprime la lista ni "Con los siguientes…".
- Lo editado vive en `useCostosCertificado` mientras la hoja está abierta y
  vuelve a lo del estudiante al generar otro. No se guarda.
- Archivos: `CertificadoCostosPreview.jsx`, `useCostosCertificado.js`,
  `costosDesdeValoresPago` y `textoCosto` en `certificadosFormales.js`,
  `obtenerValoresPagoCertificado` en el servicio. `CertificadoFormal` recibe
  `despuesDelParrafo` para la lista.

## Botón Atrás

Pedido del usuario el 2026-11-05 ("ubica mejor el botón de echar para
atrás"). Era fijo en la esquina de arriba a la izquierda de la pantalla y,
con el menú lateral nuevo, quedaba encima del menú (computador) y de la barra
de arriba (celular).

- Ahora va arriba de la hoja, dentro de la página, alineado con el borde
  izquierdo del papel: `BarraCertificado.jsx`, usado por todas las vistas de
  certificados. A su derecha van las opciones de impresión.
- Al bajar por un documento largo, el botón ya no acompaña: hay que subir.
- **Otros nueve impresos** tienen el mismo botón fijo en la esquina y no se
  tocaron: boletín, cartera vencida, entrevista de admisión, observaciones,
  volante de venta, listas de seguimiento, malla curricular, observador y
  comprobante de pago.
- Prueba: `VistasImprimibles.test.jsx` revisa que el botón no sea fijo.

## Preguntas abiertas

Se hacen justo antes del paso que las necesita.

- Ninguna. Pendiente solo la prueba del usuario en local y, si la quiere, la
  imagen de la firma (abajo).

## Fuera por ahora

- La imagen de la firma escaneada: necesitaría un lugar nuevo para subirla en
  el backend (hoy solo hay logo principal y secundario). Se firma a mano en el
  papel.
