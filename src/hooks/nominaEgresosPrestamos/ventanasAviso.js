import { mostrarExito } from "../ventanaExito";

// Los textos de este módulo traen saltos de línea; así la ventana los respeta.
export const TEXTO_CON_SALTOS = { htmlContainer: "whitespace-pre-line" };

// Abre la ventana de éxito común (se cierra sola) y cumple la promesa cuando
// terminó de cerrarse. Al cerrar, SweetAlert devuelve la pantalla a donde
// estaba: una bajada automática que empiece antes quedaría cortada a medio
// camino.
export const avisarExitoYEsperarCierre = (opciones) =>
    new Promise((resolve) => {
        mostrarExito({ customClass: TEXTO_CON_SALTOS, ...opciones, didClose: () => resolve() });
    });
