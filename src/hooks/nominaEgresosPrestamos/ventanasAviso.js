import Swal from "sweetalert2";

// Los textos de este módulo traen saltos de línea; así la ventana los respeta.
export const TEXTO_CON_SALTOS = { htmlContainer: "whitespace-pre-line" };

// Abre una ventana de aviso y cumple la promesa cuando terminó de cerrarse.
// Al cerrar, SweetAlert devuelve la pantalla a donde estaba: una bajada
// automática que empiece antes quedaría cortada a medio camino.
export const avisarYEsperarCierre = (opciones) =>
    new Promise((resolve) => {
        Swal.fire({ customClass: TEXTO_CON_SALTOS, ...opciones, didClose: () => resolve() });
    });
