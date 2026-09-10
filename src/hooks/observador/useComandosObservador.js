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

/**
 * Guardar y corregir anotaciones. **No hay comando de borrado, y no debe
 * añadirse**: nadie borra una anotación.
 */

const MENSAJE_INCOMPLETA =
  "Escribe al menos una observación y marca si es positiva o negativa.";
const MENSAJE_FALLO = "No se pudo guardar la anotación. Intenta de nuevo.";

/** El servidor manda un texto listo para enseñar en sus errores conocidos -403,
 * 404, 422-. Un 422 de validación de FastAPI, en cambio, llega como lista de
 * objetos: eso no se le enseña a nadie. */
function mensajeDelServidor(error) {
  const detalle = error?.response?.data?.detail;
  return typeof detalle === "string" && detalle.trim() ? detalle : MENSAJE_FALLO;
}

export default function useComandosObservador() {
  const [guardando, setGuardando] = useState(false);

  const ejecutar = useCallback(async (formulario, enviar) => {
    if (!puedeGuardarAnotacion(formulario)) {
      return { estado: "incompleta", mensaje: MENSAJE_INCOMPLETA };
    }

    setGuardando(true);
    try {
      await enviar();
      return { estado: "exito" };
    } catch (error) {
      return { estado: "error", mensaje: mensajeDelServidor(error) };
    } finally {
      setGuardando(false);
    }
  }, []);

  const guardarNueva = useCallback(
    (formulario, { estudianteId, periodo }) =>
      ejecutar(formulario, () =>
        crearAnotacion(
          construirPayloadAnotacionNueva(formulario, { estudianteId, periodo }),
        ),
      ),
    [ejecutar],
  );

  const guardarCorreccion = useCallback(
    (formulario, anotacionId) =>
      ejecutar(formulario, () =>
        editarAnotacion(anotacionId, construirPayloadEdicionAnotacion(formulario)),
      ),
    [ejecutar],
  );

  return { guardando, guardarNueva, guardarCorreccion };
}
