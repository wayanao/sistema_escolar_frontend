import { useCallback, useEffect, useRef, useState } from "react";
import {
  obtenerDetalleEstudiante,
  obtenerDeudasEstudiante,
  obtenerEstudiante,
} from "../../services/estudiantesObservadorApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import {
  datosDeAdmisionEstudiante,
  normalizarDetalleEstudiante,
} from "../../utils/estudiantesObservador/estudiantes";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// El resumen y las deudas de la ficha son los de ese año.
export default function useDetalleEstudianteAdmin({ parametrosAnio } = {}) {
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [detallesEstudiante, setDetallesEstudiante] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  // "Datos de admisión" (paso E6 de la entrevista de admisión): se piden solo
  // si el admin los abre, para no sumar una petición a cada ficha.
  const [datosAdmision, setDatosAdmision] = useState(null);
  const [cargandoDatosAdmision, setCargandoDatosAdmision] = useState(false);
  const [errorDatosAdmision, setErrorDatosAdmision] = useState(null);
  const solicitudRef = useRef(0);

  useEffect(
    () => () => {
      solicitudRef.current += 1;
    },
    [],
  );

  const verDetalles = useCallback(async (estudiante) => {
    const solicitudId = ++solicitudRef.current;
    setSelectedEstudiante(estudiante);
    setDetallesEstudiante(null);
    setLoadingDetalles(true);
    setErrorDetalle(null);
    setDatosAdmision(null);
    setCargandoDatosAdmision(false);
    setErrorDatosAdmision(null);

    try {
      const opciones = opcionesConAnio({}, parametrosAnio);
      const [detallesRes, deudasRes] = await Promise.allSettled([
        obtenerDetalleEstudiante(estudiante.id, opciones),
        obtenerDeudasEstudiante(estudiante.id, opciones),
      ]);

      if (solicitudRef.current !== solicitudId) return;

      if (detallesRes.status === "rejected" && deudasRes.status === "rejected") {
        throw detallesRes.reason;
      }

      if (detallesRes.status === "rejected") {
        console.error(
          "Error al cargar resumen academico del estudiante",
          detallesRes.reason,
        );
      }
      if (deudasRes.status === "rejected") {
        console.error("Error al cargar deudas del estudiante", deudasRes.reason);
      }

      const detallesBase =
        detallesRes.status === "fulfilled" ? detallesRes.value : {};
      const deudasData = deudasRes.status === "fulfilled" ? deudasRes.value : {};
      setDetallesEstudiante(
        normalizarDetalleEstudiante(detallesBase, deudasData),
      );
    } catch (requestError) {
      if (solicitudRef.current !== solicitudId) return;
      console.error("Error al cargar detalles", requestError);
      setErrorDetalle(requestError);
    } finally {
      if (solicitudRef.current === solicitudId) setLoadingDetalles(false);
    }
  }, [parametrosAnio]);

  const cerrarModal = useCallback(() => {
    solicitudRef.current += 1;
    setSelectedEstudiante(null);
    setDetallesEstudiante(null);
    setLoadingDetalles(false);
    setErrorDetalle(null);
    setDatosAdmision(null);
    setCargandoDatosAdmision(false);
    setErrorDatosAdmision(null);
  }, []);

  // Una petición (`GET /estudiantes/{id}`), solo al pedirlos. Si mientras
  // tanto se cierra la ficha o se abre otra, la respuesta se descarta.
  const verDatosAdmision = useCallback(async () => {
    if (!selectedEstudiante) return;
    const solicitudId = solicitudRef.current;
    setCargandoDatosAdmision(true);
    setErrorDatosAdmision(null);
    try {
      const estudiante = await obtenerEstudiante(selectedEstudiante.id);
      if (solicitudRef.current !== solicitudId) return;
      setDatosAdmision(datosDeAdmisionEstudiante(estudiante));
    } catch (requestError) {
      if (solicitudRef.current !== solicitudId) return;
      console.error("Error al cargar los datos de admisión", requestError);
      setErrorDatosAdmision(requestError);
    } finally {
      if (solicitudRef.current === solicitudId) setCargandoDatosAdmision(false);
    }
  }, [selectedEstudiante]);

  return {
    selectedEstudiante,
    setSelectedEstudiante,
    detallesEstudiante,
    loadingDetalles,
    errorDetalle,
    verDetalles,
    cerrarModal,
    datosAdmision,
    cargandoDatosAdmision,
    errorDatosAdmision,
    verDatosAdmision,
  };
}
