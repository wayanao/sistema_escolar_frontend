import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerCuestionarioAdmision } from "../../services/admisionesApi";
import {
  obtenerAdmisionDeEstudiante,
  obtenerDetalleEstudiante,
  obtenerDeudasEstudiante,
  obtenerEstudiante,
} from "../../services/estudiantesObservadorApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import { respuestasLegibles } from "../../utils/cuestionarioAdmision";
import {
  datosDeAdmisionEstudiante,
  normalizarDetalleEstudiante,
  PERIODOS_RESUMEN,
  ultimoPeriodoConNotas,
} from "../../utils/estudiantesObservador/estudiantes";
import { mostrarEspera } from "../ventanaExito";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// El resumen y las deudas de la ficha son los de ese año.
export default function useDetalleEstudianteAdmin({ parametrosAnio } = {}) {
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [detallesEstudiante, setDetallesEstudiante] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  // Notas por periodo (NOTAS_RESUMEN_ESTUDIANTE.md): el periodo que se mira
  // en la tarjeta "Rendimiento". Cambiarlo no pide nada: los cuatro periodos
  // y el año llegan juntos. Cada ficha abre en su último periodo con notas.
  const [periodoResumen, setPeriodoResumen] = useState(PERIODOS_RESUMEN[0]);
  // "Datos de admisión" (paso E6 de la entrevista de admisión): se piden solo
  // si el admin los abre, para no sumar una petición a cada ficha.
  const [datosAdmision, setDatosAdmision] = useState(null);
  const [cargandoDatosAdmision, setCargandoDatosAdmision] = useState(false);
  const [errorDatosAdmision, setErrorDatosAdmision] = useState(null);
  // Paso E11b: las respuestas del anexo de su entrevista, ya en texto. Fallan
  // aparte: si no llegan, los datos de arriba se ven igual.
  const [respuestasAdmision, setRespuestasAdmision] = useState(null);
  const [errorRespuestasAdmision, setErrorRespuestasAdmision] = useState(null);
  // La lista de preguntas es la misma para todos los estudiantes: se pide la
  // primera vez que hace falta y se reusa mientras la página esté abierta.
  const catalogoRef = useRef(null);
  const solicitudRef = useRef(0);
  // La tarjeta de espera de la ficha que se está cargando, para quitarla si
  // se sale de la página antes de que llegue.
  const esperaRef = useRef(null);

  useEffect(
    () => () => {
      solicitudRef.current += 1;
      esperaRef.current?.cerrar();
    },
    [],
  );

  const cerrarModal = useCallback(() => {
    solicitudRef.current += 1;
    setSelectedEstudiante(null);
    setDetallesEstudiante(null);
    setLoadingDetalles(false);
    setErrorDetalle(null);
    setDatosAdmision(null);
    setCargandoDatosAdmision(false);
    setErrorDatosAdmision(null);
    setRespuestasAdmision(null);
    setErrorRespuestasAdmision(null);
  }, []);

  const verDetalles = useCallback(async (estudiante) => {
    const solicitudId = ++solicitudRef.current;
    setSelectedEstudiante(estudiante);
    setDetallesEstudiante(null);
    setLoadingDetalles(true);
    setErrorDetalle(null);
    setDatosAdmision(null);
    setCargandoDatosAdmision(false);
    setErrorDatosAdmision(null);
    setRespuestasAdmision(null);
    setErrorRespuestasAdmision(null);

    // Mientras llega, la tarjeta de espera con la barrita (pedido del usuario
    // el 2026-11-07); la ficha se pinta cuando ya hay datos. Como solo lee, se
    // puede cerrar con Esc o con un clic afuera, y entonces la ficha no se abre.
    const espera = mostrarEspera({
      title: "Cargando el resumen…",
      text: `${estudiante.apellido ?? ""} ${estudiante.nombre ?? ""}`.trim(),
      alCancelar: () => {
        if (solicitudRef.current === solicitudId) cerrarModal();
      },
    });
    esperaRef.current = espera;

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
      const detalles = normalizarDetalleEstudiante(detallesBase, deudasData);
      setDetallesEstudiante(detalles);
      setPeriodoResumen(ultimoPeriodoConNotas(detalles.notas_por_periodo));
    } catch (requestError) {
      if (solicitudRef.current !== solicitudId) return;
      console.error("Error al cargar detalles", requestError);
      setErrorDetalle(requestError);
    } finally {
      if (solicitudRef.current === solicitudId) {
        setLoadingDetalles(false);
        espera.cerrar();
      }
    }
  }, [cerrarModal, parametrosAnio]);

  // Las respuestas de la entrevista, en texto. La lista de preguntas solo se
  // pide si hay respuestas (los estudiantes de antes no tienen) y una vez.
  const leerRespuestas = useCallback(async (admision) => {
    const cuestionario = admision?.cuestionario ?? {};
    let secciones = [];
    if (Object.keys(cuestionario).length > 0) {
      if (!catalogoRef.current) catalogoRef.current = await obtenerCuestionarioAdmision();
      secciones = respuestasLegibles(catalogoRef.current, cuestionario);
    }
    return {
      admisionId: admision?.admision_id ?? null,
      anio: admision?.anio ?? null,
      secciones,
    };
  }, []);

  // Solo al pedirlos: `GET /estudiantes/{id}` y su admisión
  // (`GET /estudiantes/{id}/admision`, paso E11b), a la vez. Si mientras
  // tanto se cierra la ficha o se abre otra, las respuestas se descartan.
  const verDatosAdmision = useCallback(async () => {
    if (!selectedEstudiante) return;
    const solicitudId = solicitudRef.current;
    const vigente = () => solicitudRef.current === solicitudId;
    setCargandoDatosAdmision(true);
    setErrorDatosAdmision(null);
    setErrorRespuestasAdmision(null);
    try {
      const [estudianteRes, admisionRes] = await Promise.allSettled([
        obtenerEstudiante(selectedEstudiante.id),
        obtenerAdmisionDeEstudiante(selectedEstudiante.id),
      ]);
      if (!vigente()) return;
      if (estudianteRes.status === "rejected") throw estudianteRes.reason;
      setDatosAdmision(datosDeAdmisionEstudiante(estudianteRes.value));

      try {
        if (admisionRes.status === "rejected") throw admisionRes.reason;
        const respuestas = await leerRespuestas(admisionRes.value);
        if (vigente()) setRespuestasAdmision(respuestas);
      } catch (errorRespuestas) {
        if (!vigente()) return;
        console.error("Error al cargar las respuestas de la entrevista", errorRespuestas);
        setErrorRespuestasAdmision(errorRespuestas);
      }
    } catch (requestError) {
      if (!vigente()) return;
      console.error("Error al cargar los datos de admisión", requestError);
      setErrorDatosAdmision(requestError);
    } finally {
      if (vigente()) setCargandoDatosAdmision(false);
    }
  }, [selectedEstudiante, leerRespuestas]);

  return {
    selectedEstudiante,
    setSelectedEstudiante,
    detallesEstudiante,
    loadingDetalles,
    errorDetalle,
    periodoResumen,
    cambiarPeriodoResumen: setPeriodoResumen,
    verDetalles,
    cerrarModal,
    datosAdmision,
    cargandoDatosAdmision,
    errorDatosAdmision,
    respuestasAdmision,
    errorRespuestasAdmision,
    verDatosAdmision,
  };
}
