import { useCallback, useEffect, useRef, useState } from "react";
import {
  listarClasesProfesorAsistencia,
  listarHistorialAsistencia,
  obtenerPlanillaAsistencia,
} from "../../services/asistenciaApi";

const MENSAJE_ERROR_HISTORIAL =
  "No se pudo cargar el historial de inasistencias. Intenta recargar.";

function esperarReintento(ms, signal) {
  return new Promise((resolve) => {
    const terminar = (continuar) => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", cancelar);
      resolve(continuar);
    };
    const cancelar = () => terminar(false);
    const timeoutId = setTimeout(() => terminar(true), ms);

    if (signal?.aborted) cancelar();
    else signal?.addEventListener("abort", cancelar, { once: true });
  });
}

function iniciarSolicitud(ref) {
  ref.current?.abort();
  const controller = new AbortController();
  ref.current = controller;
  return controller;
}

function solicitudVigente(ref, controller) {
  return ref.current === controller && !controller.signal.aborted;
}

export default function useConsultasAsistenciaProfesor({
  asignacionId,
  periodo,
  profesorId,
  habilitado,
  onClaseNoDisponible,
}) {
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [historialListo, setHistorialListo] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [clases, setClases] = useState([]);
  const estudiantesControllerRef = useRef(null);
  const clasesControllerRef = useRef(null);
  const historialControllerRef = useRef(null);
  const onClaseNoDisponibleRef = useRef(onClaseNoDisponible);

  useEffect(() => {
    onClaseNoDisponibleRef.current = onClaseNoDisponible;
  }, [onClaseNoDisponible]);

  const cancelarSolicitudes = useCallback(() => {
    estudiantesControllerRef.current?.abort();
    clasesControllerRef.current?.abort();
    historialControllerRef.current?.abort();
  }, []);

  const cargarEstudiantes = useCallback(async () => {
    if (!habilitado || !asignacionId || !periodo) return;

    const controller = iniciarSolicitud(estudiantesControllerRef);

    try {
      const data = await obtenerPlanillaAsistencia(asignacionId, periodo, {
        signal: controller.signal,
      });
      if (!solicitudVigente(estudiantesControllerRef, controller)) return;

      setEstudiantes(data.data || []);
    } catch (error) {
      if (!solicitudVigente(estudiantesControllerRef, controller)) return;

      console.error("Error cargando estudiantes", error);
      if (error.response?.status === 403) onClaseNoDisponibleRef.current?.();
    }
  }, [asignacionId, habilitado, periodo]);

  const cargarClases = useCallback(async () => {
    if (!habilitado || !profesorId) return;

    const controller = iniciarSolicitud(clasesControllerRef);

    try {
      const data = await listarClasesProfesorAsistencia(profesorId, {
        signal: controller.signal,
      });
      if (!solicitudVigente(clasesControllerRef, controller)) return;

      setClases(data);
    } catch (error) {
      if (!solicitudVigente(clasesControllerRef, controller)) return;

      console.error("Error cargando clases", error);
    }
  }, [habilitado, profesorId]);

  const cargarHistorial = useCallback(async () => {
    if (!habilitado || !asignacionId || !periodo) return;

    const controller = iniciarSolicitud(historialControllerRef);
    setCargandoHistorial(true);
    setHistorialListo(false);
    setErrorHistorial("");

    try {
      let data = [];
      let ultimoError = null;

      for (let intento = 0; intento < 2; intento += 1) {
        try {
          data = await listarHistorialAsistencia(asignacionId, periodo, {
            signal: controller.signal,
          });
          if (!solicitudVigente(historialControllerRef, controller)) return;

          ultimoError = null;
          break;
        } catch (error) {
          if (!solicitudVigente(historialControllerRef, controller)) return;

          ultimoError = error;
          if (intento === 0) {
            const continuar = await esperarReintento(700, controller.signal);
            if (!continuar) return;
          }
        }
      }

      if (ultimoError) throw ultimoError;
      if (!solicitudVigente(historialControllerRef, controller)) return;

      setHistorial(Array.isArray(data) ? data : []);
      setHistorialListo(true);
    } catch (error) {
      if (!solicitudVigente(historialControllerRef, controller)) return;

      console.error("Error cargando historial de asistencia", error);
      if (error.response?.status === 403) {
        onClaseNoDisponibleRef.current?.();
        return;
      }
      setHistorial([]);
      setErrorHistorial(MENSAJE_ERROR_HISTORIAL);
    } finally {
      if (solicitudVigente(historialControllerRef, controller)) {
        setCargandoHistorial(false);
      }
    }
  }, [asignacionId, habilitado, periodo]);

  useEffect(() => {
    if (!habilitado) {
      cancelarSolicitudes();
      setEstudiantes([]);
      setClases([]);
      setHistorial([]);
      setCargandoHistorial(false);
      setHistorialListo(false);
      setErrorHistorial("");
      return undefined;
    }

    void cargarEstudiantes();
    void cargarClases();
    void cargarHistorial();

    return cancelarSolicitudes;
  }, [cancelarSolicitudes, cargarClases, cargarEstudiantes, cargarHistorial, habilitado]);

  return {
    estudiantes,
    clases,
    historial,
    cargandoHistorial,
    historialListo,
    errorHistorial,
    cargarHistorial,
  };
}
