# Funcionalidad: Gestión de Pagos más clara

## Control

- Estado: **pasos 1 y 2a en `4acb48f` y `fda883f` (2026-11-03), sin
  publicar. Paso 2b construido el 2026-11-03, sin commit; falta la prueba
  en local.** El paso 3 sin empezar.
- Tipo: mejora de una pantalla que ya existe (`/admin/pagos`,
  `pages/PagosAdmin.jsx`). No es un módulo de `modularizacion/`.
- Repos: **solo este**. No cambia ninguna petición al backend, ni cómo se
  calculan las deudas, ni cómo se registra un pago: cambia dónde y cómo se
  muestran las cosas.
- Pedido del usuario (2026-11-03): «en gestion de pago, donde cobra lo que
  debe el estudiante quiero mejorar la experiencia de esa pagina y los pagos,
  la parte de personalizacion de pagos por estudiante confunde un poco y el
  botom de nueva factura esta como oculto». Aprobó el plan de tres pasos y
  el paso 1 («hazlo»).
- Línea base, antes de cambiar nada (2026-11-03): pruebas de Pagos (la
  página, `components/pagos`, `hooks/pagos`, `utils/pagos` y `pagosApi`) →
  **18 archivos, 90 pruebas correctas**.

## Qué se encontró

El botón para cobrar se pierde:

- "+ Nuevo Pago/Factura" era pequeño y estaba en la esquina. Debajo, el
  recuadro morado de valores personalizados, siempre abierto y con su propio
  botón morado, se llevaba la atención.
- El formulario se abría debajo de ese recuadro; en un portátil podía quedar
  fuera de la vista.
- Lo que el estudiante debe en el año solo se ve abriendo el formulario y
  desplegando "Concepto de Pago".

Los valores personalizados confunden:

- Se configuran de vez en cuando (una beca, un acuerdo), pero estaban siempre
  abiertos.
- La lista ofrece todos los conceptos activos del colegio
  (`GET /tipos-pagos`), no solo los del curso del estudiante. Uno de otro
  curso lo rechaza el backend al guardar («Este concepto no esta asignado al
  curso del estudiante.»).
- Muestra el valor general del concepto ("base"), no el precio de su curso,
  y los campos no tienen título: solo el texto gris de ejemplo.

## Plan (un paso a la vez, con visto bueno)

1. **Botón visible y formulario arriba.** Hecho el 2026-11-03 (ver abajo).
2. **"Lo que debe" a la vista.** El usuario dijo «sigue el paso 2» el
   2026-11-03; se hace en dos partes para probar cada una por separado:
   - **2a. Lo que debe con su "Cobrar".** Hecho el 2026-11-03 (ver abajo).
     Cada concepto del año con su deuda y su botón "Cobrar", que abre el
     formulario con ese concepto ya elegido. Sale de lo que ya se consultaba:
     `GET /estudiantes/:id/deudas`, los cargos de inventario y los meses
     vencidos. El frontend no calcula ninguna deuda. **Ojo:**
     `cuotas_vencidas` cuenta todas las cuotas que ya vencieron, pagadas o
     no; los meses por pagar salen de `GET /pagos/vencidos/opciones/:id`.
   - **2b. Juntar los dos modos del formulario** (propuesta del usuario,
     aprobada para el plan el 2026-11-03; hecho ese día, ver abajo, solo en
     el frontend). Se quitan los botones «Pago
     pendiente» y «Meses adelantados» de arriba del formulario: al elegir un
     concepto mensual se ven sus meses vencidos y, ahí mismo, la opción de
     adelantar. No se pierde ninguna forma de pagar (cargos de inventario,
     conceptos no mensuales y abono libre siguen igual). Reemplaza la idea
     de solo renombrar esos dos botones. Condiciones:
     1. **Siguen siendo dos cobros.** Los vencidos van por `POST /pagos`,
        que rechaza meses que no han vencido (`_preparar_aplicaciones_pago`),
        y el adelanto por `POST /pagos/adelanto`. Un pago es una cosa o la
        otra; las dos son dos pagos y dos recibos, como hoy. Nada de mandar
        dos peticiones seguidas como si fueran un solo pago: si una falla,
        queda medio pago. Juntarlos en uno exigiría cambiar el backend.
     2. **Un concepto al día no sale en la lista.**
        `GET /estudiantes/:id/deudas` solo trae los que tienen deuda
        (`_formatear_resumen_deudas`). Hay que sumar los conceptos de
        `GET /pagos/adelanto/opciones/:id`, que hoy se pide solo al tocar
        «Meses adelantados»: pasaría a pedirse al abrir el formulario, una
        petición más.
     3. **El mes en curso, antes de vencer, no sale en ninguna lista** (ver
        "Preguntas abiertas"). La pantalla no debe inventarlo.
     4. **Toca cómo se arma el pago**, no solo la vista: `useFormularioPago`
        y `useRegistroPago`. Las pruebas que fijan los dos payloads en
        `PagosAdmin.test.jsx` tienen que seguir dando exactamente lo mismo.
3. **Valores personalizados claros.** El mismo diseño de "Valores de pago"
   al matricular (`components/anioLectivo/ValoresPagoMatriculaView.jsx`),
   con `GET /estudiantes/:id/valores-pago`: solo los conceptos que se le
   cobran, el precio de su curso y lo que paga. Guardar y quitar siguen con
   las rutas de hoy.

## Paso 1 (2026-11-03)

- El botón se llama **"💰 Cobrar"** (antes "+ Nuevo Pago/Factura"): más
  grande, verde y a lo ancho en celular. Es el mismo nombre del botón de
  Cartera vencida que trae a esta pantalla. Con el formulario abierto dice
  "Cancelar" en gris, para que no parezca la acción principal.
- Orden del panel: nombre y botón → año del pago (si aparece) → deudas de
  años anteriores (si hay) → **formulario** → valores personalizados →
  historial.
- **Valores personalizados empieza cerrado.** La barra dice "Usa los valores
  normales de su curso" o, en morado, "1 concepto con valor personalizado"
  ("2 conceptos…"). Se abre con un clic y vuelve a empezar cerrado al elegir
  otro estudiante. Adentro, el formulario y la lista no cambian.
- Cambio respecto al dibujo que aprobó el usuario: el recuadro va **encima
  del historial**, no al final, porque con muchos pagos quedaba muy abajo.
- Archivos: `pages/PagosAdmin.jsx`,
  `components/pagos/ValoresPersonalizadosPago.jsx` y sus dos pruebas. No
  cambian hooks, servicio, utilidades, payloads ni mensajes.
- Pruebas nuevas: la barra cerrada con su conteo, y que "Cobrar" abre el
  formulario antes de los valores personalizados y del historial. Las que
  usaban "+ Nuevo Pago/Factura" o editaban un valor personalizado ahora usan
  "Cobrar" y abren la barra primero, como haría una persona.
- Verificación: pruebas de Pagos → **18 archivos, 92 pruebas correctas**
  (las 90 de antes y 2 nuevas). `pnpm run check:deploy` se cortó por carga
  del equipo (2,8 GB libres, «Timeout waiting for worker to respond»); por
  tandas con `--maxWorkers=2` → **395 archivos, 3207 pruebas correctas**, y
  lint y build aparte, correctos. Conviene repetir `check:deploy` antes de
  subir, con el equipo más libre.

### Prueba en local

Con un estudiante que tenga deuda y otro con un valor personalizado:

1. Elegir el estudiante: arriba a la derecha está "💰 Cobrar".
2. Darle clic: el formulario aparece arriba, a la vista.
3. La barra "Valores personalizados" está cerrada y dice si tiene alguno; al
   abrirla todo funciona como antes.
4. Al elegir otro estudiante, la barra vuelve a estar cerrada.
5. Desde Cartera vencida, "Cobrar" sigue abriendo el formulario del
   estudiante.

## Paso 2a (2026-11-03)

- **Recuadro "Lo que debe en 2026"** (`components/pagos/ResumenDeudaPago.jsx`)
  entre el año del pago y las deudas de años anteriores. Una fila por
  concepto con deuda y por cargo de inventario: nombre, valor y detalle
  («3 meses pendientes», «Ya abonó $100.000», «Incluye mora de $20.000»,
  «Cargo de inventario») y la etiqueta «Valor personalizado» cuando el
  backend la marca. Arriba, el total de lo que se ve.
- **Cada fila tiene su "Cobrar"** (`cobrarPendiente` en
  `useFormularioPago`): abre el formulario limpio, igual que el botón de
  arriba, y elige ese concepto como lo haría la lista "Concepto de Pago". El
  pago que se arma es el mismo de siempre (lo fija una prueba de la página).
- Las filas y el total salen de `crearResumenDeuda`
  (`utils/pagos/resumenDeuda.js`). Los meses vienen de las opciones
  vencidas, no de `cuotas_vencidas`. El total se suma en centavos.
- **Nunca dice "Al día" sin saberlo.** Mientras consulta dice «Consultando
  lo que debe...»; si falla la consulta de deudas o de cargos de
  inventario, avisa con «Reintentar» y no muestra un total incompleto.
  Para eso `useConsultasEstudiantePagos` ahora expone `cargandoDeudas`,
  `errorDeudas`, `cargandoVentas` y `errorVentas`. Antes, un fallo dejaba
  la lista vacía sin avisar.
- Mientras se consulta, los "Cobrar" de las filas no se pueden usar: así no
  se elige un concepto mensual antes de que lleguen sus meses.
- Arreglo incluido: al elegir otro estudiante se limpian los cargos de
  inventario del anterior; antes se veían un momento.
- En celular y tablet, al abrir el formulario (con "Cobrar" de arriba, con
  el de una fila o al llegar desde Cartera vencida) la pantalla baja hasta
  él, porque ahora queda debajo de lo que debe. En computador no se mueve.
- En un año que no es el activo no hay cargos de inventario, como en el
  formulario.
- No cambia ninguna petición: son las mismas consultas de antes.
- Archivos nuevos: `utils/pagos/resumenDeuda.js`,
  `components/pagos/ResumenDeudaPago.jsx` y sus pruebas. Cambian:
  `useConsultasEstudiantePagos.js`, `useFormularioPago.js`,
  `pages/PagosAdmin.jsx` y sus pruebas.
- Pruebas: Pagos pasa de 92 a **107** (4 de la regla, 5 del recuadro, 2 de
  cada hook y 2 de la página: el pago desde "Cobrar Pensión" y que en
  celular baja hasta el formulario).
- Verificación: `pnpm run check:deploy` → **397 archivos, 3222 pruebas
  correctas**, lint y build correctos, en una sola corrida (2,7 GB libres).
  Como incluye el paso 1, también cierra la verificación pendiente de ese
  paso.

### Prueba en local (paso 2a)

Con un estudiante que deba una pensión de varios meses:

1. Elegirlo: arriba aparece "Lo que debe" con la pensión, sus meses
   pendientes y el total.
2. Darle "Cobrar" en la fila de la pensión: el formulario abre con la
   pensión elegida y el mes más antiguo marcado.
3. Registrar el pago: el recuadro se actualiza y el pago sale en el
   historial.
4. Con un estudiante sin deudas: dice "Al día".

## Paso 2b (2026-11-03)

El usuario aprobó hacerlo solo en el frontend («continua») después de la
pregunta del mes en curso (ver "Preguntas abiertas").

- Se quitaron los botones «Pago pendiente» y «Meses adelantados» de arriba
  del formulario, y la lista «Concepto mensual» del adelanto.
- **Una sola lista «Concepto de Pago»:** cargos de inventario, conceptos con
  deuda y, en un grupo aparte, «Al día: adelantar meses», con los conceptos
  mensuales sin deuda que se pueden adelantar
  (`conceptosAlDiaParaAdelantar` en `utils/pagos/contratos.js`). Uno sin
  meses por adelantar sale deshabilitado, «Sin meses disponibles», como en
  la lista de antes.
- Elegir un concepto al día abre directo el adelanto. Elegir uno mensual con
  deuda abre sus meses pendientes y, si le quedan meses por adelantar, la
  elección **«Pagar lo que debe | Adelantar meses»**. Cambiar entre las dos
  conserva el concepto y la fecha escrita (`cambiarModoPago`).
- Siguen siendo dos cobros, sin cambios: `POST /pagos` y
  `POST /pagos/adelanto`. Un pago es una cosa o la otra.
- **Petición nueva:** `GET /pagos/adelanto/opciones/:id` al abrir el
  formulario ("Cobrar" de arriba, "Cobrar" de una fila o llegada desde
  Cartera vencida) y al cambiar de año con el formulario abierto. Antes solo
  se pedía al tocar «Meses adelantados».
- Si esa consulta falla, debajo de la lista sale el aviso con «Reintentar».
- Abrir el formulario quedó en una sola función (`abrirLimpio`), que ya no
  pide datos dentro de la actualización del estado de React.
- El mes en curso, antes de su fecha límite, sigue sin aparecer: es la regla
  del backend y no se tocó.
- Archivos: `FormularioPago.jsx`, `useFormularioPago.js`,
  `utils/pagos/contratos.js`, `PagosAdmin.jsx` y sus pruebas.
- Pruebas: Pagos pasa de 107 a **116** (1 de la regla, 3 del formulario, 4
  del hook y 1 de la página: un estudiante al día adelanta desde la lista).
  Se adaptaron 6 que buscaban los botones quitados; las que fijan lo que se
  envía al backend dan exactamente lo mismo.
- Verificación: `pnpm run check:deploy` → **397 archivos, 3231 pruebas
  correctas**, lint y build correctos, en una sola corrida.

### Prueba en local (paso 2b)

1. Con un estudiante que deba pensión: "Cobrar", elegir la pensión. Sale
   «Pagar lo que debe» con sus meses; al tocar «Adelantar meses» salen los
   meses futuros con el aviso de la deuda vencida.
2. Con un estudiante al día: "Cobrar"; en la lista, el grupo «Al día:
   adelantar meses». Al elegir la pensión abre directo el adelanto.
3. Registrar un adelanto y revisar que salga en el historial.

## Preguntas abiertas

Se hacen justo antes del paso que las necesita.

- **Resuelta el 2026-11-03: el mes en curso.** Solo se cobra cuando vence
  (`app/services/cartera.py`: «solo cobra la cuota del mes actual si ya
  venció»), y los adelantos empiezan el mes siguiente
  (`_periodos_programados` en `pagos_controller.py`; lo fija
  `test_anio_lectivo_cobros_caracterizacion.py`). El usuario notó que se
  configura en Tipos de pago: con «Día de vencimiento» 1 y sin días de
  gracia, el mes se cobra desde el día 1 (vacío equivale al último día del
  mes). Pero esa fecha también lo vuelve vencido: sale en Cartera vencida y,
  si el concepto tiene mora, la suma desde ese día. Decisión: el 2b solo en
  el frontend. Separar «desde cuándo se puede cobrar» de «desde cuándo hay
  mora» queda para el backend, cuando un colegio con mora lo necesite.
- **Paso 3:** `GET /estudiantes/:id/valores-pago` no trae los conceptos
  opcionales ni los inactivos, y la lista de hoy sí. Si algún colegio tiene un
  valor personalizado en uno de ellos, dejaría de verse en Pagos. Revisarlo
  antes de empezar el paso 3.
