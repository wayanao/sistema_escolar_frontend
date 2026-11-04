# Funcionalidad: Gestión de Pagos más clara

## Control

- Estado: **paso 1 construido el 2026-11-03, sin commit**; falta la prueba
  en local. Pasos 2 y 3 sin empezar.
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
   - Propuesta (2026-11-03, sin aprobar): el usuario preguntó por los dos
     botones de arriba del formulario. Están bien ubicados, pero «Pago
     pendiente» se puede leer como «un pago que falta hacer»: cambiarlos a
     «Lo que debe» y «Adelantar meses», que encajan con este paso.
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

- **Paso 3:** `GET /estudiantes/:id/valores-pago` no trae los conceptos
  opcionales ni los inactivos, y la lista de hoy sí. Si algún colegio tiene un
  valor personalizado en uno de ellos, dejaría de verse en Pagos. Revisarlo
  antes de empezar el paso 3.
