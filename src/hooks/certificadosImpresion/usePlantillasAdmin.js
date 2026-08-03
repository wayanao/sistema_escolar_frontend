import { useCallback, useEffect, useRef, useState } from "react";

import {
  activarPlantilla,
  actualizarPlantilla,
  duplicarPlantilla,
  eliminarPlantilla,
  listarPlantillas,
} from "../../services/printingService";
import { invalidatePrintCache } from "./usePrintConfig";

export default function usePlantillasAdmin() {
  const [tipoActivo, setTipoActivo] = useState("boletin");
  const [plantillas, setPlantillas] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const solicitudRef = useRef(0);
  const seleccionadaRef = useRef(null);

  const seleccionarPlantilla = useCallback((plantilla) => {
    seleccionadaRef.current = plantilla;
    setSeleccionada(plantilla);
    setConfig(plantilla?.config_json || {});
  }, []);

  const recargar = useCallback(async () => {
    const solicitudId = ++solicitudRef.current;
    setLoading(true);
    try {
      const data = await listarPlantillas(tipoActivo);
      if (solicitudRef.current !== solicitudId) return { estado: "cancelado" };
      setPlantillas(data);
      if (
        seleccionadaRef.current
        && !data.some((plantilla) => plantilla.id === seleccionadaRef.current.id)
      ) {
        seleccionadaRef.current = null;
        setSeleccionada(null);
        setConfig({});
      }
      return { estado: "exito", data };
    } catch (error) {
      if (solicitudRef.current !== solicitudId) return { estado: "cancelado" };
      console.error(error);
      setMensaje({ tipo: "error", texto: "Error al cargar plantillas." });
      return { estado: "error", error };
    } finally {
      if (solicitudRef.current === solicitudId) setLoading(false);
    }
  }, [tipoActivo]);

  useEffect(() => {
    seleccionadaRef.current = null;
    setSeleccionada(null);
    setConfig({});
    void recargar();
    return () => {
      solicitudRef.current += 1;
    };
  }, [recargar]);

  const actualizarCampoConfig = useCallback((campo, valor) => {
    setConfig((actual) => ({ ...actual, [campo]: valor }));
  }, []);

  const activar = useCallback(async (id) => {
    try {
      const data = await activarPlantilla(id);
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: "Plantilla activada." });
      await recargar();
      return { estado: "exito", data };
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: "error", texto: "Error al activar." });
      return { estado: "error", error };
    }
  }, [recargar]);

  const duplicar = useCallback(async (plantilla) => {
    const nombre = window.prompt(
      "Nombre de la copia:",
      `${plantilla.nombre} (mi versión)`,
    );
    if (!nombre) return { estado: "cancelado" };
    try {
      const data = await duplicarPlantilla(plantilla.id, nombre);
      setMensaje({
        tipo: "ok",
        texto: "Plantilla duplicada. Ya puedes editarla.",
      });
      await recargar();
      return { estado: "exito", data };
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: "error", texto: "Error al duplicar." });
      return { estado: "error", error };
    }
  }, [recargar]);

  const eliminar = useCallback(async (plantilla) => {
    if (!window.confirm(`¿Eliminar la plantilla "${plantilla.nombre}"?`)) {
      return { estado: "cancelado" };
    }
    try {
      const data = await eliminarPlantilla(plantilla.id);
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: "Plantilla eliminada." });
      await recargar();
      return { estado: "exito", data };
    } catch (error) {
      console.error(error);
      const detalle = error?.response?.data?.detail || error.message;
      setMensaje({ tipo: "error", texto: `Error: ${detalle}` });
      return { estado: "error", error };
    }
  }, [recargar]);

  const guardarConfig = useCallback(async () => {
    const plantilla = seleccionadaRef.current;
    if (!plantilla) return { estado: "sin-seleccion" };
    try {
      const data = await actualizarPlantilla(plantilla.id, {
        config_json: config,
      });
      invalidatePrintCache();
      setMensaje({ tipo: "ok", texto: "Configuración guardada." });
      await recargar();
      return { estado: "exito", data };
    } catch (error) {
      console.error(error);
      const detalle = error?.response?.data?.detail || error.message;
      setMensaje({ tipo: "error", texto: `Error al guardar: ${detalle}` });
      return { estado: "error", error };
    }
  }, [config, recargar]);

  return {
    config,
    loading,
    mensaje,
    plantillas,
    seleccionada,
    tipoActivo,
    activar,
    actualizarCampoConfig,
    duplicar,
    eliminar,
    guardarConfig,
    recargar,
    seleccionarPlantilla,
    setTipoActivo,
  };
}
