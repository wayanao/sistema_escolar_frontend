# Funcionalidad: Gestión de Pagos más clara

## Control

- Estado: **paso 1 en `4acb48f` (2026-11-03), sin publicar.** Pasos 2 y 3
  sin empezar; el paso 2 incluye juntar «Pago pendiente» y «Meses
  adelantados», propuesta del usuario aprobada para el plan el 2026-11-03.
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
2. **"Lo que debe" a la vista.** Cada concepto del año con su deuda y su
   botón "Cobrar", que abre el formulario con ese concepto ya elegido. Sale
   de `GET /estudiantes/:id/deudas`, que ya trae `concepto`, `deuda`,
   `cuotas_vencidas`, `valor_personalizado` y `total_deuda`: el frontend no
   calcula nada nuevo.
   - **Juntar los dos modos del formulario** (propuesta del usuario,
     aprobada para el plan el 2026-11-03). Se quitan los botones «Pago
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

## Preguntas abiertas

Se hacen justo antes del paso que las necesita.

- **Backend, sin prisa (antes del paso 2):** el mes en curso solo se cobra
  cuando vence (`app/services/cartera.py`: «solo cobra la cuota del mes
  actual si ya venció»), y los adelantos empiezan el mes siguiente
  (`_periodos_programados` en `pagos_controller.py`; lo fija
  `test_anio_lectivo_cobros_caracterizacion.py`). Si la pensión vence el 5,
  del 1 al 4 de noviembre el mes de noviembre no sale ni como vencido ni
  como adelanto. Ya pasa hoy, pero con los dos modos juntos se notará más.
  ¿Debe poder pagarse el mes antes de que venza? Lo decide el backend; el
  frontend no.
- **Paso 3:** `GET /estudiantes/:id/valores-pago` no trae los conceptos
  opcionales ni los inactivos, y la lista de hoy sí. Si algún colegio tiene un
  valor personalizado en uno de ellos, dejaría de verse en Pagos. Revisarlo
  antes de empezar el paso 3.
