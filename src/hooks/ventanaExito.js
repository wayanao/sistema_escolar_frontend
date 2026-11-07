import Swal from "sweetalert2";

// Ventana de éxito de toda la app (pedido del usuario el 2026-11-07): la misma
// tarjeta blanca de «Guardando el grupo…» del Boletín Final, con un chulito
// verde pequeño a la izquierda del título. Todas se cierran solas (decidido
// con el usuario el mismo día) y una barrita morada se va llenando hasta que
// se cierra. Sigue siendo SweetAlert, así que se espera y se prueba igual que
// antes; el aspecto vive en `.ventana-exito` (src/index.css).

/**
 * Lo que dura una ventana de éxito (la de entrar, 1 s). Eran 4 s y luego 2 s:
 * el usuario dijo las dos veces que la barrita tardaba mucho (2026-11-07). Una
 * barrita que se llena parece algo que todavía carga, así que va rápido.
 */
export const TIEMPO_PARA_LEER = 1200;

// Después de una espera la barrita ya venía llenándose: termina en este
// tiempo y la ventana se cierra a los TIEMPO_PARA_LEER.
const FIN_TRAS_ESPERA = 400;

const CLASE_VENTANA = "ventana-exito";
const CLASE_ESPERA = "ventana-exito--espera";

// Chulito dibujado a mano, como los íconos de la landing (sin librerías).
const CHULITO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// El círculo que gira de «Guardando el grupo…».
const GIRO = '<span class="ventana-espera__giro" aria-hidden="true"></span>';

// Barrita de la espera: es una sola petición y no se sabe cuánto tarda, así
// que se llena rápido al comienzo y cada vez más despacio, sin llegar al final.
const BARRA_ESPERA =
  '<div class="ventana-espera__barra" role="progressbar" aria-label="Esperando que termine">' +
  "<div></div></div>";

// Barrita de la ventana de éxito: se llena mientras sigue abierta y llega al
// final justo cuando se cierra. La de SweetAlert (timerProgressBar) se vaciaba
// y el usuario la pidió al revés. `desde` (%) deja seguir la de la espera sin
// volver a empezar.
function barraQueSeLlena(milisegundos, desde = 0) {
  return (
    '<div class="ventana-exito__barra" aria-hidden="true" ' +
    `style="--duracion: ${Number(milisegundos)}ms; --desde: ${Number(desde)}%"><div></div></div>`
  );
}

/**
 * Opciones de SweetAlert de la ventana de éxito. Recibe las de siempre
 * (`title`, `text`, `timer`, `didClose`…); sin `timer` dura
 * `TIEMPO_PARA_LEER`. Un `customClass` se suma a las clases de la tarjeta (por
 * ejemplo, para respetar los saltos de línea). Las pruebas la usan para
 * comparar la ventana completa.
 */
export function opcionesVentanaExito({ timer = TIEMPO_PARA_LEER, customClass, ...opciones } = {}) {
  return {
    icon: "success",
    iconHtml: CHULITO,
    timer,
    footer: barraQueSeLlena(timer),
    showConfirmButton: false,
    customClass: {
      container: "ventana-exito-fondo",
      popup: CLASE_VENTANA,
      ...customClass,
    },
    ...opciones,
  };
}

/** Abre la ventana de éxito y devuelve la promesa de SweetAlert (se cumple al cerrarse). */
export function mostrarExito(opciones) {
  return Swal.fire(opcionesVentanaExito(opciones));
}

// --- Una sola espera (pedido del usuario el 2026-11-07, Gestión de Pagos) ---
// Al oprimir guardar sale la misma tarjeta con el círculo que gira y la
// barrita llenándose; cuando el servidor responde, esa tarjeta pasa a la de
// éxito sin cerrarse y la barrita sigue hasta el final. Así no hay una espera
// en el botón y otra después.

/** Lo que dice la tarjeta de espera mientras se guarda. */
export const TEXTO_ESPERA = "No cierres ni cambies de página hasta que termine.";

/**
 * Opciones de la tarjeta de espera. Mientras se guarda no se puede cerrar (ni
 * con Esc ni por fuera): o pasa a la de éxito o la cambia la ventana de error.
 * Una carga que solo lee (`cancelable`) sí se puede cerrar.
 */
export function opcionesVentanaEspera({ title, text = TEXTO_ESPERA, cancelable = false } = {}) {
  return {
    iconHtml: GIRO,
    title,
    text,
    footer: BARRA_ESPERA,
    showConfirmButton: false,
    allowOutsideClick: cancelable,
    allowEscapeKey: cancelable,
    customClass: {
      container: "ventana-exito-fondo",
      popup: `${CLASE_VENTANA} ${CLASE_ESPERA}`,
    },
  };
}

/**
 * Lo que cambia la tarjeta de espera a la de éxito sin cerrarla. Es la de
 * éxito menos `timer`, que SweetAlert no deja poner en una ventana ya abierta
 * (lo pone `mostrarEspera`). La barrita sigue desde `desde` (%) y termina
 * rápido: ya venía llenándose durante la espera.
 */
export function opcionesExitoTrasEspera({ timer = TIEMPO_PARA_LEER, desde = 0, ...opciones } = {}) {
  const exito = opcionesVentanaExito({ ...opciones, timer });
  delete exito.timer;
  return {
    ...exito,
    footer: barraQueSeLlena(Math.min(FIN_TRAS_ESPERA, timer), desde),
    allowOutsideClick: true,
    allowEscapeKey: true,
  };
}

// Cuánto se llenó la barrita de la espera (0 a 100), para seguir desde ahí.
function avanceDeLaEspera() {
  const relleno = Swal.getFooter()?.querySelector(".ventana-espera__barra > div");
  const total = relleno?.parentElement?.getBoundingClientRect().width;
  if (!relleno || !total) return 0;
  return Math.min(100, Math.round((relleno.getBoundingClientRect().width / total) * 100));
}

/**
 * Abre la tarjeta de espera y devuelve `exito(opciones)`, que la convierte en
 * la de éxito y la cierra cuando la barrita llega al final. Si algo falla,
 * basta con abrir la ventana de error (SweetAlert cambia una por otra) o, si
 * el error se muestra en la misma pantalla, con `cerrar()`.
 * Con `alCancelar`, la tarjeta se puede cerrar con Esc o con un clic afuera
 * (sirve para cargas que solo leen) y entonces se llama `alCancelar`.
 */
export function mostrarEspera({ alCancelar, ...opciones } = {}) {
  const alCerrarse = Swal.fire(opcionesVentanaEspera({ ...opciones, cancelable: Boolean(alCancelar) }));
  const ventanaEspera = Swal.getPopup();
  if (alCancelar) {
    // Solo si la cerró la persona; `cerrar()` y `Swal.close()` no traen motivo.
    alCerrarse?.then?.((resultado) => {
      if (resultado?.dismiss === "esc" || resultado?.dismiss === "backdrop") alCancelar();
    });
  }
  return {
    cerrar() {
      if (Swal.isVisible() && Swal.getPopup() === ventanaEspera) Swal.close();
    },
    exito({ timer = TIEMPO_PARA_LEER, ...opcionesExito } = {}) {
      Swal.update(opcionesExitoTrasEspera({ ...opcionesExito, timer, desde: avanceDeLaEspera() }));
      // Solo se cierra si sigue abierta esta misma ventana: si la cerraron con
      // un clic afuera o se abrió otra, no se toca.
      const ventana = Swal.getPopup();
      setTimeout(() => {
        if (Swal.isVisible() && Swal.getPopup() === ventana) Swal.close();
      }, timer);
    },
  };
}
