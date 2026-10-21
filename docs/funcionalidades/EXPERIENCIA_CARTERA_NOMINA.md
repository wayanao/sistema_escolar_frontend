# Funcionalidad: Saber qué pasa al guardar en Cartera, Nómina, Préstamos y Egresos

## Control

- Estado: **Completo en código.** Pasos 0 y 1 en `9a61a8a`, paso 2 en
  `9306cb5` (2026-10-20), paso 3 en `9b88cd3` y paso 4 (montos y detalles)
  hecho el 2026-10-21, sin commit. Queda solo lo anotado para el backend.
- Tipo: mejora de pantallas que ya existen. No es un módulo de
  `modularizacion/` y no cambia ninguna petición al backend.
- Repos: **solo este**. El usuario lo precisó el 2026-10-20: «lo que quiero
  mejorar es frontend, o sea los guardando, los auto scroll y las demás cosas
  que el usuario necesita para saber cómo está actuando la página». Lo del
  backend queda anotado en "Para el backend" y fuera de este trabajo.
- Pedido del usuario (2026-10-20): «en cartera en nomina, prestamos y egreso
  quiero mejorar la experiencia de usuario, los diferentes componentes, saber
  que esta pasando al guardar, antes de ejecutar esto revisa bien los
  faltantes».
- Alcance entendido: Cartera vencida (`/admin/cartera-vencida`), Tipos de pago
  (`/admin/tipos-pagos`), Nómina (`/admin/nomina`), Préstamos
  (`/admin/prestamos`) y Egresos (`/admin/egresos`). Pagos, Inventario y Punto
  de venta están en el mismo menú "Cartera", pero no se pidieron (ver "Fuera de
  alcance").
- Línea base, antes de cambiar nada (2026-10-20): las pruebas de
  `components/`, `hooks/`, `utils/` y el servicio de `nominaEgresosPrestamos` y
  `carteraTiposPago`, más las siete pruebas de sus páginas
  (`NominaAdmin`, `EgresosAdmin`, `PrestamosAdmin`, `CarteraVencidaAdmin` y su
  `.anioLectivo`, `TiposPagosAdmin` y su `.anioLectivo`), con
  `--maxWorkers=2` → **35 archivos, 230 pruebas correctas**.

## Cómo se revisó

Para cada acción que guarda, cinco preguntas:

1. ¿El botón se bloquea mientras guarda, para no guardar dos veces?
2. ¿Dice que está trabajando (texto y círculo que gira)?
3. ¿Pide confirmación cuando no se puede deshacer, con los datos y los montos?
4. ¿Avisa cuando terminó bien, y qué cambió?
5. ¿Avisa cuando falla, y si se guardó o no?

Además: qué se ve cuando falla la carga, si se pierden cambios sin aviso y cómo
se leen los montos.

Modelos que ya existen en el sistema y se van a copiar, no inventar:

- `hooks/pagos/useRegistroPago.js`: `registrandoPago` impide el doble envío
  (línea 33), confirma con los montos (97-106), el éxito dice qué se aplicó
  (148-158) y el error separa «el servidor lo rechazó» de «no se pudo
  conectar» (169-175).
- Año lectivo, ajuste del 2026-10-12: `components/anioLectivo/SpinnerView.jsx`
  y `AvisoTrabajandoView.jsx`. Admisiones ya importa `SpinnerView` desde
  `anioLectivo/`, así que se reutiliza igual y no se crea otro.

## Inventario por pantalla

### Nómina (`/admin/nomina`)

- **N1. Se puede pagar dos veces.** `Confirmar Pago`
  (`ModalPagoNomina.jsx:94`) no se bloquea y `registrarPago`
  (`usePagoNomina.js:39`) no revisa si ya está enviando. El backend no evita
  repetidos, así que un doble clic registra dos nóminas, abona dos veces los
  préstamos y crea dos egresos automáticos. Es el riesgo más alto de este
  inventario (ya anotado como defecto 1 en `modularizacion/NOMINA_EGRESOS_PRESTAMOS.md`).
- **N2. Paga sin confirmar** (`usePagoNomina.js:52`), a diferencia de egresos y
  préstamos. Importa más porque una nómina no se puede anular desde la app: el
  backend no tiene ruta para eso (`routes/nomina.py`).
- **N3. El aviso de éxito es fijo y a veces falso**: «Pago de nómina
  registrado exitosamente y préstamos abonados.» (`usePagoNomina.js:58`) sale
  aunque el abono sea 0. No muestra el número de referencia que el backend sí
  devuelve (`nomina_id`, el mismo `#N-…` del historial) ni los montos.
- **N4. El error no dice si el pago quedó.** Siempre «Ocurrió un error al
  procesar el pago de nómina.» (`usePagoNomina.js:63`). Si se cae la conexión
  después de que el servidor guardó, el usuario reintenta y paga dos veces. El
  backend responde `500` con el texto interno del error
  (`routes/nomina.py:22`); ese texto no debe mostrarse tal cual.
- **N5. Ventanas del navegador** (`alert`): tres en `usePagoNomina.js`. El resto
  del sistema usa SweetAlert y Chrome puede silenciarlas.
- **N6. Mientras guarda, `Cancelar` y `✕` siguen activos**: se puede cerrar el
  modal sin ver el resultado.
- **N7. Después de pagar, las dos tablas desaparecen** y se lee «Cargando
  datos...» y «Cargando historial...» (`useConsultasNomina.js:19`): la página
  salta.
- N8. Las dos validaciones (abono mayor que la deuda, neto negativo) solo se
  ven al pulsar el botón, no mientras se escribe.
- N9. Montos sin separador de miles: `$1500000.00`
  (`EstadoCuentaPersonal.jsx:36`, `HistorialNomina.jsx:51-54`,
  `ModalPagoNomina.jsx:34`, `:63` y `:86`); el aviso del abono los pone sin
  formato (`utils/nominaEgresosPrestamos/nomina.js:40`).
- N10. El error de carga (`NominaAdmin.jsx:34`) no tiene «Reintentar».
- N11. Sin deuda, el campo de abono se bloquea sin explicar por qué
  (`ModalPagoNomina.jsx:59`).
- N12. El `✕` no tiene nombre para lectores de pantalla y `Esc` no cierra el
  modal (`ModalPagoNomina.jsx:20`).

### Préstamos (`/admin/prestamos`)

- **P1. `Registrar Préstamo` no se bloquea ni dice «Registrando...»**
  (`FormularioPrestamo.jsx:62`, `useComandosPrestamos.js:58`). La confirmación
  previa reduce el riesgo de duplicar, pero no se ve que trabaja.
- **P2. No hay aviso de éxito**: el formulario se limpia y el historial salta a
  la persona, en silencio (`useComandosPrestamos.js:67-70`).
- **P3. `Saldar` no dice lo importante.** La confirmación es «¿Marcar este
  préstamo como Pagado?» (`utils/nominaEgresosPrestamos/prestamos.js:57`): no
  dice de quién, cuánto, que no se puede deshacer (el backend solo acepta
  `Pagado`, `prestamo_controller.py:92`) ni que ya no se descontará en nómina.
  El botón de la fila no cambia mientras guarda, no hay aviso de éxito y el
  error es fijo, sin el detalle del backend (`useComandosPrestamos.js:86`).
- P4. Ventanas del navegador: cinco en `useComandosPrestamos.js` y una en
  `usePrestamos.js:79`.
- P5. Montos sin separador de miles (`HistorialPrestamos.jsx:61` y `:94`).
- P6. Muestra el monto original y no lo que falta: necesita el backend (B1).
- P7. El error al cargar profesores no tiene «Reintentar».

### Egresos (`/admin/egresos`)

- **E1. `Registrar/Actualizar Egreso` no se bloquea ni dice «Guardando...»**
  (`FormularioEgreso.jsx:67`, `useFormularioEgreso.js:64-70`).
- **E2. No hay aviso de éxito** (`useFormularioEgreso.js:73`): el formulario se
  limpia y, al registrar, el filtro salta a la fecha del egreso sin decirlo.
- **E3. Al pulsar `Editar`, no se nota.** El formulario de arriba cambia a
  «Editar Egreso», pero la página no sube ni marca la fila: si se está abajo, en
  la tabla, no se ve.
- E4. Ventanas del navegador: cuatro en `useFormularioEgreso.js` y una en
  `useEgresos.js:60`.
- E5. El error muestra el `detail` del backend; si llega una lista (error de
  formato, `422`) se lee «[object Object]». Es poco probable porque el
  frontend valida antes. Tampoco separa «sin conexión».
- E6. La etiqueta `Automático` (`HistorialEgresos.jsx:97`) no explica que viene
  de un pago de nómina y que no se edita aquí.
- E7. Montos sin separador de miles (`HistorialEgresos.jsx:57` y `:86`).
- E8. «Cargando egresos...» es texto suelto y el error de carga no tiene
  «Reintentar».

### Cartera vencida (`/admin/cartera-vencida`)

No guarda nada (consulta, imprime, exporta y lleva a Pagos), pero:

- **C1. Un error se ve como «nadie debe».** Si falla la carga, el error solo va
  a la consola (`useCarteraVencida.js:42-43`), los indicadores quedan en $0 y la
  tabla dice «🎉 No hay estudiantes en mora con estos filtros»
  (`VistaCarteraVencida.jsx:530-534`). Ya anotado como riesgo abierto en
  `modularizacion/CARTERA_TIPOS_PAGO.md`.
- C2. `Actualizar` recarga toda la página mirando el año activo
  (`CarteraVencidaAdmin.jsx:66-68`): se pierden los filtros y la fila abierta.
  El hook ya tiene `recargar`, que vuelve a pedir sin recargar.
- C3. Mientras carga, solo un círculo sin texto (`VistaCarteraVencida.jsx:352-357`).
- C4. Abrir el detalle de un estudiante solo funciona con el mouse (la fila
  tiene `onClick`, no es un botón).

### Tipos de pago (`/admin/tipos-pagos`)

- **T1. `Guardar/Actualizar Concepto` no se bloquea ni dice «Guardando...»**
  (`VistaAdministrarTiposPago.jsx:181`, `useFormularioTipoPago.js:18`). Con
  doble clic, el primero crea el concepto y el segundo muestra «Concepto
  duplicado»: parece que falló.
- **T2. Los cambios sin guardar se pierden sin aviso.** `✕ Cerrar` o
  `⚙️ Configurar` en otro concepto descartan lo editado en la configuración y en
  los cursos sin preguntar (`useConsultasTiposPago.js:70`,
  `TiposPagosAdmin.jsx:33-37`). Los cursos sí avisan que hay cambios
  pendientes; la configuración no.
- **T3. Un error se ve como «no hay nada».** Si falla la lista o los cursos, el
  error solo va a la consola (`useConsultasTiposPago.js:31-38` y `:46-48`) y la
  pantalla dice «No hay conceptos registrados» o «0 de 0 cursos».
- T4. Al pulsar `✏️`, el formulario de arriba cambia pero la página no sube
  (igual que E3).
- T5. El detalle muestra «Cargando...» como texto suelto.
- T6. El aviso «Migración pendiente» le muestra al admin un comando de Python
  (`useConfiguracionTipoPago.js:84`). Solo se anota.

## Desplazamiento automático (auto scroll)

Dónde la página debe llevar la pantalla sola, porque lo que cambió queda fuera
de la vista:

- Nómina (paso 1, hecho): «Revisar el historial» baja hasta el historial de la
  persona. Al pagar no hace falta bajar: el modal no mueve la página y la fila
  pagada queda resaltada donde estaba.
- Egresos (paso 2, hecho): `Editar` sube al formulario, le pasa el foco a su
  título y marca la fila que se edita (E3). Al guardar, cuando se cierra el
  aviso, baja a la fila guardada si no se ve. El foco va al título y no al
  concepto a propósito: un campo abriría el teclado del celular y taparía
  medio formulario.
- Préstamos (paso 2, hecho): al registrar, cuando se cierra el aviso, baja al
  préstamo nuevo (ya en el historial de la persona) si no se ve, y lo resalta.
- En los dos, si no se sabe si quedó, «Revisar el historial» baja hasta él.
- Tipos de pago (paso 3, hecho): `⚙️ Configurar` baja al panel de
  configuración, que aparece debajo de la lista (si hubo que preguntar por
  cambios sin guardar, cuando se cierra esa ventana); `✏️` sube al formulario
  y le pasa el foco a su título (T4), como en Egresos; al guardar un concepto,
  baja a su fila si no se ve.
- Cartera vencida (paso 3, hecho): `Imprimir` y `Imprimir curso` muestran el
  documento desde arriba, y `← Atrás` deja la lista donde estaba. Aquí el
  salto es inmediato (`behavior: "auto"`), porque cambia la vista entera.

Regla aprendida en el paso 1: si se baja justo después de cerrar una ventana
de SweetAlert, esperar a su `didClose`. Al cerrarse, SweetAlert devuelve la
pantalla a donde estaba (`window.scrollTo`, en `restoreActiveElement`) y
cortaría la bajada a medio camino.

## Para el backend (fuera de este trabajo: el usuario pidió solo frontend)

- **B1. Préstamos muestra el monto original, no lo que falta.**
  `GET /api/prestamos/` no devuelve `pagado` (`prestamo_controller.py:19`),
  pero el pago de nómina sí abona por partes (`nomina_controller.py:81-85`).
  Ejemplo: préstamo de $500.000 con $200.000 descontados en nómina → Nómina
  dice que debe $300.000; Préstamos dice $500.000 y su «Total por cobrar»
  también. Arreglo: que el backend devuelva `pagado`; después el frontend
  muestra «Abonado» y «Falta» y suma lo que falta.
- B2. Nómina no tiene protección contra pagos repetidos en el servidor. El
  bloqueo del paso 1 evita el doble clic, pero no dos pestañas abiertas ni un
  reintento después de perder la conexión.
- B3. El egreso automático de una nómina dice «Pago de Nómina - Profesor ID 12»
  (`nomina_controller.py:121`), no el nombre.
- B4. Caso concreto de un error ya anotado en general en `ANIO_LECTIVO.md`
  del backend ("Hallazgos fuera de alcance": los `CURRENT_DATE` de la base
  corren en UTC): la nómina y su egreso toman esa fecha
  (`nomina_controller.py:120` y el valor por omisión de `nomina.fecha`), así
  que desde las 7 p. m. quedan con la fecha de mañana y el egreso no sale en
  «hoy» en Egresos.

## Plan por pasos

Uno a la vez, con el visto bueno del usuario antes de cada uno. Pruebas
primero: se escriben, se ve que fallan y después se cambia el código. Ninguna
petición cambia. Las pruebas que hoy simulan `alert` y `confirm` (ocho
archivos del módulo de nómina) se ajustan a propósito para simular SweetAlert.

1. **Nómina** (N1-N7 y N10): bloquear `Confirmar Pago`, `Cancelar` y `✕`
   mientras guarda, con círculo y «Registrando pago...»; confirmar antes con el
   resumen (persona, neto, abono, que no se puede anular y que crea un egreso);
   éxito con el número `#N-…` y los montos (el abono solo si hubo); error que
   separa «el servidor lo rechazó» de «no se sabe si quedó: revise el historial
   antes de reintentar», sin mostrar el texto interno del `500`; recargar sin
   esconder las tablas; «Reintentar» si falla la carga.
2. **Préstamos y Egresos** (P1-P4, P7, E1-E5, E8): botones bloqueados con
   «Registrando...»/«Guardando...»; avisos de éxito (y, en egresos, a qué fecha
   saltó el filtro); `Saldar` con persona, monto y «no se puede deshacer»;
   errores con el detalle del backend cuando es texto; al editar un egreso,
   subir al formulario y marcar la fila; «Reintentar».
3. **Cartera vencida y Tipos de pago** (C1-C3, T1-T5): error con «Reintentar»
   en vez de «no hay nada»; `Actualizar` sin recargar la página; «Guardando...»
   en el concepto; aviso antes de perder cambios sin guardar; al editar un
   concepto, subir al formulario.
4. **Montos y detalles** (N8, N9, N11, N12, P5, E6, E7, C4): pesos con
   separador de miles en Nómina, Préstamos y Egresos; validaciones de nómina
   mientras se escribe; explicaciones cortas; `Esc` y teclado.

Decisiones técnicas ya tomadas (no necesitan al usuario):

- Ventanas con SweetAlert, como Pagos. Los éxitos de dinero van en ventana que
  se cierra a mano, no en un aviso que desaparece solo, porque no se deshacen.
- Círculo que gira: `components/anioLectivo/SpinnerView.jsx`, como Admisiones.
- Formato de pesos (paso 4): en la raíz de `src/utils/`, que es donde el
  `CLAUDE.md` pone lo que usan dos o más módulos. Las copias que ya tienen
  Pagos (`formatearMoneda`) y Cartera (`formatMoney`) no se tocan en este
  trabajo.

Cómo probar en local: el backend local escribe en la base real. Probar con el
Colegio Demo y montos pequeños, y saber antes que **un pago de nómina no se
puede anular desde la app**: queda en el historial y crea su egreso.

## Paso 1 — Nómina (hecho el 2026-10-20, sin commit)

Qué ve el usuario:

- `Confirmar Pago` abre «¿Registrar este pago de nómina?» con la persona, los
  cinco valores y el neto en pesos colombianos, y el aviso de que no se puede
  anular y que también queda como egreso. «Revisar» vuelve al formulario.
- Mientras guarda: «Registrando pago...» con círculo; campos, `Cancelar` y
  `✕` bloqueados. Un segundo clic no envía nada (N1).
- Al terminar: «Pago registrado» con `#N-…`, el neto y, si hubo, lo abonado.
  La fila queda en verde con «✓ Pago #N-… registrado» (cada persona pagada
  con la página abierta conserva su marca). Las tablas se recargan sin
  desaparecer: «Actualizando...» junto al título y `Realizar Pago` bloqueado
  hasta tener los saldos nuevos (así no se abona contra un saldo viejo).
- Si el servidor respondió con error: «No se registró el pago» y «No se guardó
  nada» (el texto interno de un `500` no se muestra; el de un `4xx`, sí). El
  modal sigue abierto con lo escrito, como antes.
- Si no respondió (o `502`, `503`, `504`): «No sabemos si el pago quedó
  registrado». Recarga las tablas y ofrece «Revisar el historial» (cierra el
  modal, escribe el nombre en el buscador y baja al historial) o «Seguir aquí».
- Si falla la carga: el aviso rojo trae «Reintentar».

Archivos: `utils/nominaEgresosPrestamos/nomina.js` (textos de confirmación,
éxito y error, y la búsqueda de una persona en el historial),
`hooks/nominaEgresosPrestamos/usePagoNomina.js` y `useConsultasNomina.js`,
`components/nominaEgresosPrestamos/ModalPagoNomina.jsx`,
`EstadoCuentaPersonal.jsx` y `HistorialNomina.jsx`, `pages/NominaAdmin.jsx`, y
sus pruebas. El círculo es `components/anioLectivo/SpinnerView.jsx`.

Pruebas: escritas primero; 36 fallaron antes del código. Se ajustaron a
propósito las que esperaban `alert` y las que daban por hecho que recargar
escondía las tablas. Suite del módulo (`components`, `hooks`, `utils`,
servicio y las tres páginas): 20 archivos, 176 pruebas correctas.
`pnpm run check:deploy` con 2,9 GB libres: 2692 de 2693 pruebas en 369
archivos; falló por tiempo una de `IngresoBoletinProfesor.test.jsx` (no tocado),
que pasa sola. Lint y build aparte: correctos. Falta una corrida limpia de
`check:deploy` antes de subir.

Cómo probarlo en local sin guardar nada: abrir Nómina, `Realizar Pago`,
`Confirmar Pago` y ver el resumen; elegir «Revisar». Para ver «Registrando
pago...» y el aviso final hay que registrar un pago de verdad: el backend local
escribe en la base real y **un pago de nómina no se puede anular desde la
app**. Si se quiere, en el Colegio Demo, con alguien sin préstamos y un monto
pequeño.

## Paso 2 — Préstamos y Egresos (hecho el 2026-10-20, sin commit)

Qué ve el usuario en Préstamos:

- `Registrar Préstamo` confirma en una ventana del sistema con la persona, el
  monto y la fecha. Mientras guarda: «Registrando préstamo...» con círculo y
  el formulario bloqueado; un segundo clic no envía nada (P1).
- Al terminar: «Préstamo registrado» con monto, persona y fecha; el historial
  pasa a esa persona, el préstamo nuevo queda en verde y la página baja hasta
  él al cerrar el aviso (P2).
- `Saldar` pregunta «¿Saldar este préstamo?» con persona, monto y fecha, y
  avisa que ya no se descontará en la nómina y que no se puede deshacer.
  Mientras salda, ese botón dice «Saldando...» y los demás esperan; al
  terminar, «Préstamo saldado» y la fila queda en verde (P3).
- Errores: el rechazo del backend se explica con su texto y «No se guardó
  nada» / «No cambió nada»; sin respuesta, «No sabemos si...», se recarga el
  historial para revisarlo y, al registrar, se ofrece bajar a él. Lo escrito
  se conserva para reintentar.
- Recargar el historial de la misma persona ya no lo esconde
  («Actualizando...»); el de otra persona sí muestra «Cargando préstamos...».
  Si falla una carga, «Reintentar» pide de nuevo lo que falló (P7). Mientras
  cargan los profesores, el selector dice «Cargando profesores...».

Qué ve el usuario en Egresos:

- `Registrar/Actualizar Egreso` confirma con concepto, monto, fecha y
  categoría. Mientras guarda: «Registrando egreso...» o «Guardando
  cambios...», formulario bloqueado y `Editar` en espera (E1).
- Al terminar: «Egreso registrado» (dice que abajo se ven los egresos de ese
  día, porque el filtro salta a esa fecha) o «Egreso actualizado» con cómo
  quedó; la fila queda en verde y la página baja a ella al cerrar el aviso
  (E2).
- `Editar` sube al formulario (con borde ámbar y la frase «Estás cambiando un
  egreso que ya está en la lista.») y la fila queda en ámbar con «Editando»
  (E3).
- Errores como en préstamos; sin respuesta al registrar se muestran los
  egresos de ese día para revisarlo (E5). Recargar el mismo rango no esconde la
  tabla; si falla la carga, «Reintentar» (E8).
- Las ventanas del navegador de los dos subflujos pasaron a SweetAlert (P4,
  E4), también los avisos de buscar sin persona y de fechas al revés.

Archivos nuevos: `utils/nominaEgresosPrestamos/avisos.js` (los pesos de los
mensajes y la regla «no se guardó nada» / «no se sabe», compartidos por los
tres subflujos; nómina ahora la usa) y
`hooks/nominaEgresosPrestamos/ventanasAviso.js` (la ventana con saltos de
línea y la espera a que se cierre; mismo patrón que
`hooks/planeaciones/notificacionesPlaneadoresSync.js`). Cambiados: los
hooks, componentes, utilidades y páginas de préstamos y egresos, y sus
pruebas. Se retiraron `mensajeConfirmacionEstadoPrestamo`,
`mensajeErrorCrearPrestamo` y `mensajeErrorGuardarEgreso`, reemplazados por
los nuevos mensajes; `mensajeConfirmacionPrestamo` y
`mensajeConfirmacionEgreso` dejan la pregunta al título de la ventana.

Pruebas: escritas primero; fallaron 44 de préstamos y 39 de egresos antes del
código. Se ajustaron a propósito las que esperaban `alert`/`confirm`, las que
daban por hecho que recargar escondía la tabla, la que esperaba `onSaldar(id)`
(ahora recibe el préstamo) y las de errores sin código HTTP (un rechazo real
siempre lo trae). Suite del módulo: 22 archivos, 226 pruebas correctas, sin
advertencias. `pnpm run check:deploy` con 2,8 GB libres: 2739 de 2741; las dos
que fallaron por tiempo (`AniosLectivosAdmin`, `CrearProfesor`) no se tocaron y
pasan solas. Lint y build aparte: correctos.

Cómo probarlo en local sin guardar nada: en Egresos, `Editar` en una fila (la
página sube al formulario y la fila queda en ámbar) y luego `Cancelar
edición`; o `Registrar Egreso` y elegir «Revisar» en la confirmación. En
Préstamos, `Saldar` y «Cancelar». Registrar o saldar de verdad escribe en la
base real: un préstamo no se elimina y saldar no se deshace.

## Paso 3 — Cartera vencida y Tipos de pago (hecho el 2026-10-21, sin commit)

Qué ve el usuario en Cartera vencida:

- Mientras carga: el círculo y «Cargando cartera vencida...» (C3).
- Si falla la carga: un aviso rojo con «Reintentar» y **sin** indicadores en
  $0 ni «🎉 No hay estudiantes en mora», que hacían pasar un error por «nadie
  debe» (C1). Si falla al actualizar con datos a la vista, los datos se quedan
  y un aviso dice que no se pudo actualizar y de qué hora son.
- `Actualizar` ya no recarga la página entera, tampoco en el año activo:
  vuelve a pedir la cartera, el botón dice «Actualizando...» y se conservan
  filtros y fila abierta (C2). Debajo de los botones, «Actualizado a las …».
- Al cambiar de año no queda a la vista la cartera del año anterior mientras
  carga.
- `Imprimir` muestra el documento desde arriba y `← Atrás` deja la lista donde
  estaba.

Qué ve el usuario en Tipos de pago:

- La lista dice «Cargando conceptos...» la primera vez; si falla, un aviso con
  «Reintentar» en vez de «No hay conceptos registrados» (T3). Al recargarla
  después de guardar, «Actualizando...» sin esconderla. Los cursos igual:
  «Cargando cursos...» o su error con «Reintentar» en vez de «0 de 0» (T3).
- El formulario tiene título: «Nuevo concepto» o «Editar concepto» (con borde
  ámbar y qué concepto se cambia). `Guardar/Actualizar Concepto` dice
  «Guardando...», bloquea el formulario y no envía dos veces (T1). Al crear,
  el aviso dice que el concepto quedó como Borrador y qué falta para que
  cobre (configurarlo y asignarle cursos); la fila queda en verde.
- Cambios sin guardar (T2): la configuración avisa «Hay cambios de
  configuración sin guardar.» (los cursos ya lo hacían), y `✕ Cerrar` o
  `⚙️ Configurar` en otro concepto preguntan antes de descartarlos
  («Descartar cambios» / «Seguir editando»).
- El detalle dice «Cargando configuración...» (T5) y los botones de guardar
  configuración y cursos muestran el círculo mientras guardan.

Corregido de paso (no estaba en el inventario): si fallaba la carga del
detalle de un concepto, el panel quedaba abierto con la configuración y los
cursos **del concepto abierto antes**, y guardar los habría aplicado al
concepto equivocado. Ahora el panel se cierra con el aviso «No se pudo abrir
«…»».

Lo que no cubre: si con cambios sin guardar se sale de la pantalla por el
menú o se recarga el navegador, no se pregunta (la app usa `BrowserRouter`,
sin el bloqueo de navegación de React Router).

Archivos: `hooks/carteraTiposPago/usePanelConfiguracion.js` (nuevo: abre y
cierra el panel preguntando antes de perder cambios), los hooks de cartera,
consultas, formulario y configuración de tipos de pago, las dos vistas, las dos
páginas y sus pruebas. Se ajustó a propósito en
`CarteraVencidaAdmin.anioLectivo.test.jsx` la prueba que fijaba que
`Actualizar` recargaba la página en el año activo, y en
`useFormularioTipoPago.test.js` las que esperaban los avisos «Éxito» de antes.

Pruebas: escritas primero; 38 fallaron antes del código. Módulo de cartera y
tipos de pago (hooks, vistas, servicio, utilidades y las cuatro pruebas de
página): 16 archivos, 119 pruebas correctas, sin advertencias. `pnpm run
check:deploy` limpio en una sola corrida: 2783 pruebas en 372 archivos, lint y
build correctos.

Cómo probarlo en local sin guardar nada: en Cartera vencida, poner un filtro y
pulsar `Actualizar` (no recarga la página y el filtro sigue); `Imprimir` en un
estudiante de abajo y luego `← Atrás`. En Tipos de pago, `⚙️ Configurar`,
cambiar «Días de gracia» y pulsar `✕ Cerrar`: debe preguntar; elegir «Seguir
editando» y luego «Descartar cambios» para no guardar nada.

## Paso 4 — Montos y detalles (hecho el 2026-10-21, sin commit)

Decisión del usuario (2026-10-21, a la pregunta abierta del paso): **«sin
centavos»**, como ya muestran Cartera vencida y Tipos de pago.

Qué ve el usuario:

- Nómina, Préstamos y Egresos escriben los pesos como Colombia y sin centavos:
  «$ 1.500.000» en tablas, totales, el modal de pago y las ventanas de
  confirmación y de éxito (N9, P5, E7). Lo que tenga centavos se redondea al
  peso más cercano al mostrarlo; los datos guardados no cambian. Los ejemplos
  de los campos pasaron a pesos enteros («Ej. 1500000», «Ej. 500000», «Ej.
  150000»).
- Nómina avisa mientras se escribe, junto al campo, que el abono no puede
  pasar la deuda o que el total quedó negativo, y `Confirmar Pago` espera
  hasta que se corrija (N8; antes salía una ventana al pulsar). Sin deuda, el
  abono bloqueado explica «Sin préstamos pendientes» (N11). El modal es un
  diálogo con nombre que recibe el foco al abrir y se cierra con `Esc` (salvo
  mientras registra; N12).
- Egresos explica la etiqueta `Automático`: debajo de la tabla, cuando hay
  alguno, «lo registra un pago de nómina y no se edita en esta pantalla», y
  al pasar el mouse sobre la etiqueta (E6).
- Cartera vencida: el ▶ de cada estudiante es un botón, así que el detalle
  también se abre con el teclado (C4); la fila sigue abriéndose con el mouse.

Decisiones técnicas: el formato vive en `src/utils/formatoPesos.js`
(`formatearPesos`), en la raíz porque es de más de un módulo; Pagos y Cartera
conservan sus copias (tarea aparte). `Esc` se escucha dentro del diálogo y no
en toda la página: si hay una ventana de aviso encima, su `Esc` no cierra
también el pago. `validarPagoNomina` se conserva al enviar, como respaldo.

Pruebas: escritas primero; fallaron 42 antes del código. Se ajustaron a
propósito los montos esperados con centavos, los ejemplos de los campos que
las pruebas usan para encontrarlos y las dos pruebas de la página de nómina
que esperaban la ventana al pulsar `Confirmar Pago` con datos imposibles.
`pnpm run check:deploy` limpio en una sola corrida: 2796 pruebas en 373
archivos, lint y build correctos.

Cómo probarlo en local sin guardar nada: en Nómina, `Realizar Pago` a alguien
con préstamos, escribir un abono mayor que su deuda (sale el aviso rojo y
`Confirmar Pago` espera) y cerrar con `Esc`.

## Preguntas abiertas

- Ninguna. La del paso 4 (con o sin centavos) se respondió: sin centavos.

## Fuera de alcance

- Pagos y Punto de venta ya bloquean su botón y avisan bien
  (`useRegistroPago.js:33`, `useCarritoVenta.js:74`).
- Inventario: guardar un producto no bloquea el botón
  (`useFormularioProducto.js:46`). Solo se anota.
- Que Préstamos liste solo profesores activos y Nómina a todo el personal es
  comportamiento documentado en la modularización; no se cambia aquí.
