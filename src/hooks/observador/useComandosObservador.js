import { useCallback, useState } from "react";
import {
  crearAnotacion,
  editarAnotacion,
} from "../../services/observadorApi";
import {
  construirPayloadAnotacionNueva,
  construirPayloadEdicionAnotacion,
  puedeGuardarAnotacion,
} from "../../utils/observador/formulario";
import { mostrarEspera } from "../ventanaExito";

/**
 * Guardar y corregir anotaciones. **No hay comando de borrado, y no debe
 * añadirse**: nadie borra una anotación.
 */

const MENSAJE_INCOMPLETA = "Escribe al menos una observación antes de guardar.";
const MENSAJE_FALLO = "No se pudo guardar la anotación. Intenta de nuevo.";

// Lo que dicen la tarjeta de espera y la de éxito (ventanaExito.js).
export const TITULOS_NUEVA = { espera: "Guardando anotación…", exito: "Anotación guardada" };
export const TITULOS_CORRECCION = { espera: "Guardando corrección…", exito: "Anotación corregida" };

/** El servidor manda un texto listo para enseñar en sus errores conocidos -403,
 * 404, 422-. Un 422 de validación de FastAPI, en cambio, llega como lista de
 * objetos: eso no se le enseña a nadie. */
function mensajeDelServidor(error) {
  const detalle = error?.response?.data?.detail;
  return typeof detalle === "string" && detalle.trim() ? detalle : MENSAJE_FALLO;
}

export default function useComandosObservador() {
  const [guardando, setGuardando] = useState(false);

  const ejecutar = useCallback(async (formulario, enviar, titulos) => {
    if (!puedeGuardarAnotacion(formulario)) {
      return { estado: "incompleta", mensaje: MENSAJE_INCOMPLETA };
    }

    setGuardando(true);
    // Una sola espera (pedido del usuario el 2026-11-07): la tarjeta sale al
    // oprimir y pasa a éxito sin cerrarse. Si falla, se quita y el error sale
    // en el formulario, que conserva lo escrito.
    const espera = mostrarEspera({ title: titulos.espera });
    try {
      await enviar();
      espera.exito({ title: titulos.exito });
      return { estado: "exito" };
    } catch (error) {
      espera.cerrar();
      return { estado: "error", mensaje: mensajeDelServidor(error) };
    } finally {
      setGuardando(false);
    }
  }, []);

  const guardarNueva = useCallback(
    (formulario, { estudianteId, periodo }) =>
      ejecutar(
        formulario,
        () =>
          crearAnotacion(
            construirPayloadAnotacionNueva(formulario, { estudianteId, periodo }),
          ),
        TITULOS_NUEVA,
      ),
    [ejecutar],
  );

  const guardarCorreccion = useCallback(
    (formulario, anotacionId) =>
      ejecutar(
        formulario,
        () => editarAnotacion(anotacionId, construirPayloadEdicionAnotacion(formulario)),
        TITULOS_CORRECCION,
      ),
    [ejecutar],
  );

  return { guardando, guardarNueva, guardarCorreccion };
}
