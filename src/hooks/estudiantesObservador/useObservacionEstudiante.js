import { useEffect, useState } from "react";
import {
  guardarObservacion,
  obtenerObservacion,
} from "../../services/estudiantesObservadorApi";
import {
  construirGuardadoObservacion,
  crearEstadoGuardadoObservacion,
  normalizarObservacionGuardada,
} from "../../utils/estudiantesObservador/observaciones";

export default function useObservacionEstudiante({
  estudianteId,
  asignacionId,
  periodo,
  habilitado = true,
}) {
  const [conductual, setConductual] = useState("");
  const [cognitivo, setCognitivo] = useState("");
  const [lenguaje, setLenguaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [estadoGuardado, setEstadoGuardado] = useState(
    crearEstadoGuardadoObservacion,
  );
  const [intentoCarga, setIntentoCarga] = useState(0);

  useEffect(() => {
    if (!habilitado) return undefined;

    let activo = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const cargarObservacion = async () => {
      if (!estudianteId || !asignacionId) {
        if (activo) {
          setEstadoGuardado(
            crearEstadoGuardadoObservacion({ cargando: false }),
          );
        }
        return;
      }

      setConductual("");
      setCognitivo("");
      setLenguaje("");
      setErrorCarga(null);
      setEstadoGuardado(crearEstadoGuardadoObservacion());

      try {
        const data = await obtenerObservacion(
          estudianteId,
          asignacionId,
          periodo,
          { signal: controller.signal },
        );
        if (!activo) return;

        if (data) {
          const observacion = normalizarObservacionGuardada(data);
          setConductual(observacion.conductual);
          setCognitivo(observacion.cognitivo);
          setLenguaje(observacion.lenguaje);
          setEstadoGuardado(
            crearEstadoGuardadoObservacion({
              cargando: false,
              guardado: observacion.tieneObservacion,
            }),
          );
          return;
        }
      } catch (error) {
        if (activo) {
          setErrorCarga(
            controller.signal.aborted
              ? new Error("La consulta de la observación superó el tiempo de espera.")
              : error,
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!activo) return;
      setEstadoGuardado(
        crearEstadoGuardadoObservacion({ cargando: false }),
      );
    };

    void cargarObservacion();

    return () => {
      activo = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [asignacionId, estudianteId, habilitado, intentoCarga, periodo]);

  const reintentar = () => {
    setIntentoCarga((intentoActual) => intentoActual + 1);
  };

  const marcarModificado = (setter) => (valor) => {
    setter(valor);
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  };

  const guardar = async () => {
    const { valores, dimensionesDiligenciadas, payload } =
      construirGuardadoObservacion({
        estudianteId,
        asignacionId,
        periodo,
        conductual,
        cognitivo,
        lenguaje,
      });

    if (dimensionesDiligenciadas === 0) return { estado: "vacio" };

    setGuardando(true);
    try {
      await guardarObservacion(payload);
      setConductual(valores.conductual);
      setCognitivo(valores.cognitivo);
      setLenguaje(valores.lenguaje);
      setEstadoGuardado(
        crearEstadoGuardadoObservacion({
          cargando: false,
          guardado: true,
          guardadoEn: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }),
      );
      return { estado: "exito", dimensionesDiligenciadas };
    } catch (error) {
      return {
        estado: "error",
        error,
        detalle: error.response?.data?.detail,
      };
    } finally {
      setGuardando(false);
    }
  };

  return {
    conductual,
    cognitivo,
    lenguaje,
    cambiarConductual: marcarModificado(setConductual),
    cambiarCognitivo: marcarModificado(setCognitivo),
    cambiarLenguaje: marcarModificado(setLenguaje),
    guardando,
    estadoGuardado,
    errorCarga,
    reintentar,
    guardar,
  };
}
