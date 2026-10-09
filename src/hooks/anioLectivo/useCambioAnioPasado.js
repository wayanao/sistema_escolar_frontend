import { useCallback, useState } from "react";
import {
  cerrarAnioLectivo,
  reabrirAnioLectivo,
} from "../../services/aniosLectivosApi";
import {
  accionDeAnioPasado,
  confirmacionCoincide,
  mensajeDeErrorAnio,
} from "../../utils/anioLectivo";

// Paso 6.8: reabrir un año cerrado o volver a cerrarlo, escribiendo el año.
// Se confirma un año a la vez. El backend decide si se puede (un solo año
// reabierto a la vez); aquí solo se muestra su respuesta.
//
// `onCambiado` recibe la respuesta del backend; la página la usa para
// recargar los años, así el selector muestra el estado nuevo.
export default function useCambioAnioPasado({ onCambiado } = {}) {
  const [anioEnCambio, setAnioEnCambio] = useState(null);
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const iniciar = useCallback((anio) => {
    setAnioEnCambio(anio);
    setConfirmacion("");
    setMensaje("");
    setError("");
  }, []);

  const cancelar = useCallback(() => {
    setAnioEnCambio(null);
    setConfirmacion("");
  }, []);

  const confirmar = useCallback(async () => {
    const accion = anioEnCambio ? accionDeAnioPasado(anioEnCambio) : null;
    if (!accion || !confirmacionCoincide(confirmacion, anioEnCambio.anio)) {
      return { estado: "validacion" };
    }

    const cambiar = accion.accion === "reabrir" ? reabrirAnioLectivo : cerrarAnioLectivo;
    setGuardando(true);
    setMensaje("");
    setError("");
    let datos;
    try {
      datos = await cambiar(anioEnCambio.id, Number(confirmacion.trim()));
    } catch (err) {
      setError(mensajeDeErrorAnio(err, `No se pudo ${accion.verbo} el año.`));
      setGuardando(false);
      return { estado: "error", error: err };
    }

    setMensaje(
      accion.accion === "reabrir"
        ? `${anioEnCambio.anio} quedó reabierto. Para corregirlo, elígelo en el selector de año.`
        : `${anioEnCambio.anio} quedó cerrado otra vez.`,
    );
    setAnioEnCambio(null);
    setConfirmacion("");
    // El cambio ya ocurrió: si falla recargar los años, no se presenta como
    // fallido para que nadie intente repetirlo.
    try {
      await onCambiado?.(datos);
    } catch {
      setError("No se pudo actualizar la lista de años. Recarga la página.");
    }
    setGuardando(false);
    return { estado: "exito", resultado: datos };
  }, [anioEnCambio, confirmacion, onCambiado]);

  return {
    anioEnCambio,
    confirmacion,
    setConfirmacion,
    guardando,
    mensaje,
    error,
    iniciar,
    cancelar,
    confirmar,
  };
}
