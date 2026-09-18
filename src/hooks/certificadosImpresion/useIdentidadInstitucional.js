import { useCallback, useEffect, useState } from "react";

import {
  deleteLogo,
  getBranding,
  updateBranding,
  uploadLogo,
} from "../../services/printingService";
import { normalizarCampoIdentidad } from "../../utils/certificadosImpresion/impresion";
import { invalidatePrintCache } from "./usePrintConfig";

export default function useIdentidadInstitucional() {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    let cancelado = false;
    getBranding()
      .then((data) => {
        if (!cancelado) setBranding(data);
      })
      .catch((error) => {
        if (cancelado) return;
        console.error(error);
        setMensaje({
          tipo: "error",
          texto: "No se pudo cargar la identidad institucional.",
        });
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const cambiarCampo = useCallback((campo, valor) => {
    const valorNormalizado = normalizarCampoIdentidad(campo, valor);
    setBranding((actual) => ["membrete", "aprobacion_resolucion", "color_texto"].includes(campo)
      ? {
          ...actual,
          configuracion_extra: {
            ...actual?.configuracion_extra,
            [campo]: valorNormalizado,
          },
        }
      : { ...actual, [campo]: valorNormalizado });
  }, []);

  const guardar = useCallback(async () => {
    if (!branding) return { estado: "sin-datos" };
    setGuardando(true);
    setMensaje(null);
    try {
      const data = await updateBranding(branding);
      setBranding(data);
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: "Datos guardados correctamente." });
      return { estado: "exito", data };
    } catch (error) {
      console.error(error);
      const detalle = error?.response?.data?.detail || error.message;
      setMensaje({ tipo: "error", texto: `Error al guardar: ${detalle}` });
      return { estado: "error", error };
    } finally {
      setGuardando(false);
    }
  }, [branding]);

  const subirLogo = useCallback(async (file, slot) => {
    if (!file) return { estado: "sin-archivo" };
    setMensaje(null);
    try {
      const data = await uploadLogo(file, slot);
      setBranding((actual) => ({
        ...actual,
        [slot === "principal" ? "logo_principal_url" : "logo_secundario_url"]: data.url,
      }));
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: `Logo ${slot} actualizado.` });
      return { estado: "exito", data };
    } catch (error) {
      console.error(error);
      const detalle = error?.response?.data?.detail || error.message;
      setMensaje({ tipo: "error", texto: `Error al subir logo: ${detalle}` });
      return { estado: "error", error };
    }
  }, []);

  const eliminarLogo = useCallback(async (slot) => {
    if (!window.confirm(`¿Eliminar el logo ${slot}?`)) {
      return { estado: "cancelado" };
    }
    try {
      const data = await deleteLogo(slot);
      setBranding((actual) => ({
        ...actual,
        [slot === "principal" ? "logo_principal_url" : "logo_secundario_url"]: null,
      }));
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: `Logo ${slot} eliminado.` });
      return { estado: "exito", data };
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: "error", texto: "No se pudo eliminar el logo." });
      return { estado: "error", error };
    }
  }, []);

  return {
    branding,
    guardando,
    loading,
    mensaje,
    cambiarCampo,
    eliminarLogo,
    guardar,
    subirLogo,
  };
}
