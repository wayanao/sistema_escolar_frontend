# Funcionalidad: Gestión de Pagos más clara

## Control

- Estado: **pasos 1 a 4 en `4acb48f`, `fda883f`, `efc789e`, `2658caf` y
  `c066dfc`, sin publicar. Paso 5 (historial cerrado, con el pago recién
  registrado) construido el 2026-11-04, sin commit; falta la prueba en
  local.**
- **Pruebas en local:** el backend local escribe en la base real (rama
  `production` de Neon), donde vive el colegio real `tenant_2005`.
  Registrar pagos o guardar valores de prueba solo en el Colegio Demo
  (`tenant_colegio_1`).
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
   las rutas de hoy. Hecho el 2026-11-03 (ver abajo).

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

En el Colegio Demo, con un estudiante que deba una pensión de varios meses:

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

En el Colegio Demo:

1. Con un estudiante que deba pensión: "Cobrar", elegir la pensión. Sale
   «Pagar lo que debe» con sus meses; al tocar «Adelantar meses» salen los
   meses futuros con el aviso de la deuda vencida.
2. Con un estudiante al día: "Cobrar"; en la lista, el grupo «Al día:
   adelantar meses». Al elegir la pensión abre directo el adelanto.
3. Registrar un adelanto y revisar que salga en el historial.

## Paso 3 (2026-11-03)

El usuario preguntó si afecta Año lectivo: no. El recuadro de matricular se
reutiliza tal cual y los valores se guardan con las mismas rutas que Pagos y
matricular ya compartían. Aprobado con «continua».

- Al abrir «Valores personalizados» se ve el recuadro de matricular
  (`components/anioLectivo/ValoresPagoMatriculaView.jsx`, sin cambios): una
  fila por concepto que se le cobra en el año del pago, con «Precio del
  curso», lo que paga, «Valor para este estudiante», «Motivo», «Guardar» y
  «Volver al precio del curso». Su «Cerrar» cierra el recuadro.
- Se quitó la lista con todos los conceptos activos del colegio y su valor
  «base», y la lista de valores con «Editar» y «Quitar».
- Las filas se piden al abrir el recuadro
  (`GET /estudiantes/:id/valores-pago`, con el año solo si no es el
  activo). Guardar o volver al precio usa el mismo `PUT` y `DELETE`;
  después se piden otra vez las filas, lo que debe y sus meses. El conteo de
  la barra sigue saliendo de `valores-pago-personalizados`, que se pide al
  elegir el estudiante, como antes.
- Los avisos de guardado y de error salen dentro del recuadro, como en
  matricular. Volver al precio pide confirmación («¿Volver al precio del
  curso?»).
- Si se elige otro estudiante o año mientras carga o guarda, la respuesta
  tardía se descarta y no toca la pantalla del estudiante nuevo. Arreglo
  incluido: antes, un guardado lento podía recargar las deudas del
  estudiante anterior en la pantalla del nuevo.
- El recuadro empieza cerrado con cada estudiante y cada año (`key`).
- Archivos: `ValoresPersonalizadosPago.jsx`,
  `useValoresPersonalizadosPago.js`, `PagosAdmin.jsx` y sus pruebas. Nada
  de `anioLectivo` cambia.
- Pruebas: Pagos pasa de 116 a **122** (el hook pasa de 3 a 8 pruebas y el
  recuadro de 3 a 4; en la página se reescribió la de valores
  personalizados). Las 7 del recuadro de matricular siguen igual.
- Verificación: `pnpm run check:deploy` → **397 archivos, 3237 pruebas
  correctas**, lint y build correctos, en la segunda corrida. La primera
  falló por carga del equipo en `IngresoBoletinProfesor.test.jsx`, que pasa
  sola y no tiene que ver con Pagos.

### Prueba en local (paso 3)

En el Colegio Demo, no en el 2005:

1. Elegir un estudiante y abrir «Valores personalizados»: sale una fila por
   concepto, con el precio del curso.
2. Escribir un valor en la mensualidad y «Guardar»: dice «Se guardó…» y
   «Lo que debe» cambia.
3. «Volver al precio del curso»: pide confirmación y vuelve al precio.

## Paso 4 (2026-11-04): solo «Lo que debe»

Pedido del usuario después del paso 3: «me gusta más la nueva ventana, lo que
debe, ¿me puedo quedar solo con esa?», y al aprobarlo: «que el botón cobrar
sea verde, que sea notorio, que esa caja no ocupe mucho espacio, y cuando
seleccione la deuda haga auto scroll para cobrar».

- **Se cobra solo desde «Lo que debe».** Se quitó la lista «Concepto de
  Pago» del formulario y el «Cobrar» general de arriba. El formulario
  muestra el concepto elegido como texto («Concepto: Pensión»).
- **Cada deuda tiene un «💰 Cobrar» verde lleno.** Los conceptos mensuales
  al día salen en el mismo recuadro, con «Al día · $X por mes · N meses
  por adelantar» y un botón «Adelantar» igual de verde. Sin meses por
  adelantar dicen «Al día · Sin meses por adelantar», sin botón. No suman al
  total.
- **Recuadro más compacto:** menos relleno, letra más pequeña y el detalle de
  cada fila en una línea chica.
- **Al pulsar «Cobrar» o «Adelantar» la pantalla baja hasta el formulario**,
  en cualquier pantalla (antes, solo en celular). Al elegir un estudiante
  sigue bajando al panel solo en celular.
- **Desde Cartera vencida** se llega con el estudiante elegido y lo que debe a
  la vista; ya no abre el formulario solo, porque no se sabe qué concepto.
- **Los meses para adelantar se piden al elegir el estudiante** (para mostrar
  las filas al día), al cambiar de año y después de registrar un pago,
  anularlo o cambiar un valor personalizado. Ya no al abrir el formulario.
  Si esa consulta falla, el recuadro lo avisa con su propio «Reintentar» y
  conserva el total.
- Se quitaron `toggleFormularioPago` y `abrirFormulario` de
  `useFormularioPago`: eran del botón general y de la llegada desde Cartera.
  `cobrarPendiente` pasó a llamarse `cobrarConcepto` y también abre el
  adelanto de un concepto al día.
- No cambia lo que se envía al backend: las pruebas de los pagos (normal,
  métodos combinados, adelanto por monto, adelanto de un concepto al día y
  otro año) dan exactamente lo mismo.
- Archivos: `ResumenDeudaPago.jsx`, `FormularioPago.jsx`,
  `utils/pagos/resumenDeuda.js`, `useFormularioPago.js`,
  `useRegistroPago.js`, `useAnulacionPago.js`,
  `useValoresPersonalizadosPago.js`, `PagosAdmin.jsx` y sus pruebas.
- Pruebas: Pagos pasa de 122 a **125**.
- Verificación: `pnpm run check:deploy` → **397 archivos, 3240 pruebas
  correctas**, lint y build correctos, en la segunda corrida. La primera
  falló por carga del equipo en `TiposPagosAdmin.test.jsx`, que pasa sola y
  no tiene que ver con Pagos.

### Prueba en local (paso 4)

En el Colegio Demo, no en el 2005:

1. Elegir un estudiante con deuda: en «Lo que debe», cada fila tiene su
   «💰 Cobrar» verde. Al pulsarlo, la pantalla baja al formulario con ese
   concepto.
2. Con un estudiante al día: la mensualidad sale «Al día» con «Adelantar»
   (o «Sin meses por adelantar» si ya no quedan meses este año).

## Paso 5 (2026-11-04): historial cerrado, con el pago recién registrado

Pedido del usuario: «con el historial de pago, quiero que solo se muestre el
pago recién, y que si no se hace un pago no se abran todos por sí solos, sino
que haya un botón para desplegar», y al aprobarlo: «que sea bien diseñado ese
botón».

- **Al elegir un estudiante el historial sale cerrado**, solo con el botón
  «🧾 Ver historial de pagos · N pagos registrados» (ancho completo, ícono,
  conteo y flecha que gira; `aria-expanded`). Abierto dice «Ocultar
  historial».
- **Al registrar un pago se ve solo ese pago**, en un recuadro verde «✓ Pago
  recién registrado», con su «Imprimir Recibo» a la mano. Se olvida al elegir
  otro estudiante.
- Un pago normal con varios métodos crea **una fila por método** en el
  backend, y `POST /pagos` devuelve un id o una lista de ids
  (`registrar_pago_controller`); `POST /pagos/adelanto` devuelve un id.
  `idsDelPagoRegistrado` (`utils/pagos/contratos.js`) los deja siempre como
  lista, así que el recuadro muestra todas las filas del pago.
- El historial llega del más reciente al más viejo (`ORDER BY id DESC`) y se
  sigue pidiendo completo: no cambia ninguna petición.
- Imprimir y anular no cambian.
- Archivos: `HistorialPagos.jsx`, `useRegistroPago.js` (avisa con
  `alRegistrar` qué pagos creó), `utils/pagos/contratos.js`,
  `PagosAdmin.jsx` y sus pruebas.
- Pruebas: Pagos pasa de 125 a **131**.
- Verificación: `pnpm run check:deploy` → **397 archivos, 3246 pruebas
  correctas**, lint y build correctos, en una sola corrida.

### Prueba en local (paso 5)

En el Colegio Demo: elegir un estudiante con pagos (el historial sale
cerrado), registrar un pago (sale solo ese, con «Imprimir Recibo») y abrir
el historial con el botón.

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
- **Resuelta el 2026-11-03: paso 3.** `GET /estudiantes/:id/valores-pago`
  no trae los conceptos opcionales ni los inactivos, y la lista de antes sí:
  un valor personalizado en uno de ellos dejaría de verse en Pagos (no se
  borra). El usuario: «solo me importa mensualidad y es el colegio 2005».
  La mensualidad es activa y mensual, así que sale.
