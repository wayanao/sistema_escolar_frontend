import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  guardarFirmaInstitucional,
  guardarMiFirma,
  obtenerFirmaInstitucional,
  obtenerMiFirma,
  quitarFirmaInstitucional,
  quitarMiFirma,
} from "../../services/firmasApi";
import { mensajeErrorFirmaGuardada } from "../../utils/firmas/imagenFirma";
import { mostrarEspera } from "../ventanaExito";

// Firmas guardadas para el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md):
// carga la firma ya guardada y la guarda o la quita. `titular` es
// "institucional" (la del rector(a), pantalla del admin) o "mia" (la del
// profesor de la sesión, «Mi curso»).

const API = {
  institucional: {
    leer: obtenerFirmaInstitucional,
    guardar: guardarFirmaInstitucional,
    quitar: quitarFirmaInstitucional,
  },
  mia: {
    leer: obtenerMiFirma,
    guardar: guardarMiFirma,
    quitar: quitarMiFirma,
  },
};

const MENSAJE_CARGA = "No se pudo cargar la firma guardada.";
const MENSAJE_GUARDAR = "No se pudo guardar la firma. Inténtalo de nuevo.";
const MENSAJE_QUITAR = "No se pudo quitar la firma. Inténtalo de nuevo.";

function fueCancelada(error, signal) {
  return signal?.aborted || error?.name === "AbortError" || error?.code === "ERR_CANCELED";
}

/** `{imagen, actualizado_en}` si hay firma guardada; si no, `null`. */
function firmaDe(respuesta) {
  return respuesta?.imagen ? respuesta : null;
}

export default function useFirmaGuardada(titular) {
  const api = API[titular];
  const [firma, setFirma] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    api
      .leer({ signal: controlador.signal })
      .then((respuesta) => {
        if (!controlador.signal.aborted) setFirma(firmaDe(respuesta));
      })
      .catch((error) => {
        if (fueCancelada(error, controlador.signal)) return;
        setMensajeError(MENSAJE_CARGA);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });
    return () => controlador.abort();
  }, [api]);

  const guardar = useCallback(
    async (imagen) => {
      if (!imagen) return { estado: "sin-imagen" };
      setGuardando(true);
      setMensajeError("");
      const espera = mostrarEspera({ title: "Guardando la firma…" });
      try {
        const respuesta = await api.guardar(imagen);
        setFirma(firmaDe(respuesta));
        espera.exito({ title: "Firma guardada" });
        return { estado: "exito" };
      } catch (error) {
        espera.cerrar();
        const mensaje = mensajeErrorFirmaGuardada(error, MENSAJE_GUARDAR);
        setMensajeError(mensaje);
        return { estado: "error", mensaje };
      } finally {
        setGuardando(false);
      }
    },
    [api],
  );

  const quitar = useCallback(async () => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Quitar la firma?",
      text: "Los boletines volverán a salir con la raya vacía, para firmar a mano.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, quitar la firma",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return { estado: "cancelado" };

    setGuardando(true);
    setMensajeError("");
    const espera = mostrarEspera({ title: "Quitando la firma…" });
    try {
      await api.quitar();
      setFirma(null);
      espera.exito({ title: "Firma quitada" });
      return { estado: "exito" };
    } catch (error) {
      espera.cerrar();
      const mensaje = mensajeErrorFirmaGuardada(error, MENSAJE_QUITAR);
      setMensajeError(mensaje);
      return { estado: "error", mensaje };
    } finally {
      setGuardando(false);
    }
  }, [api]);

  return { firma, cargando, guardando, mensajeError, guardar, quitar };
}
