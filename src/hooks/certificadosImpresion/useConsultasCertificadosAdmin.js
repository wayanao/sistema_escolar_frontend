import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  generarBoletinCertificado,
  generarReporteParcialCertificado,
  listarCursosCertificados,
  listarEstudiantesCertificados,
  listarHistorialAsistenciaCertificados,
  listarMateriasCertificados,
  obtenerFichaEstudianteCertificado,
} from "../../services/certificadosImpresionApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import { construirCertificadoFormal } from "../../utils/certificadosImpresion/certificadosFormales";
import {
  MATERIA_TODAS,
  PERIODOS_NUMERICOS,
  construirBoletinesValidos,
  construirCertificadoNotas,
  construirEstudiantesReporte,
  construirResumenReporteParcial,
  crearMapaCursos,
  filtrarEstudiantesCertificados,
  filtrarEstudiantesCurso,
  obtenerAsignacionIds,
} from "../../utils/certificadosImpresion/certificados";

// Los que usan el formato de los modelos del colegio (CertificadoFormal).
const TIPOS_CERTIFICADO_FORMAL = ["matricula", "conducta", "aprobado"];

function esCancelacion(error, signal) {
  return signal.aborted || error?.name === "AbortError" || error?.code === "ERR_CANCELED";
}

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// Cursos, estudiantes, boletines y reportes parciales son los de ese año; las
// materias son un catálogo y el historial de asistencia parte de una clase.
// `anioCerrado`: si el año que mira ya cerró, los certificados dicen "cursó".
export default function useConsultasCertificadosAdmin({
  parametrosAnio,
  anioLectivoPropuesto,
  anioCerrado = false,
} = {}) {
  const anioLectivoSugerido = String(
    anioLectivoPropuesto ?? new Date().getFullYear(),
  );
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState("1");
  const [periodoReporte, setPeriodoReporte] = useState("1");
  const [materiaReporte, setMateriaReporte] = useState(MATERIA_TODAS);
  const [anioLectivo, setAnioLectivo] = useState(anioLectivoSugerido);
  const [loading, setLoading] = useState(true);
  const [generandoId, setGenerandoId] = useState(null);
  const [generandoCurso, setGenerandoCurso] = useState(false);
  const [certificado, setCertificado] = useState(null);
  const [certificadoFormal, setCertificadoFormal] = useState(null);
  const [reporteParcial, setReporteParcial] = useState(null);
  const [error, setError] = useState("");
  const consultaRef = useRef(null);

  useEffect(() => {
    setAnioLectivo(anioLectivoSugerido);
  }, [anioLectivoSugerido]);

  useEffect(() => {
    const controller = new AbortController();

    const cargarBase = async () => {
      setLoading(true);
      setError("");
      try {
        const opcionesDelAnio = opcionesConAnio({ signal: controller.signal }, parametrosAnio);
        const [datosCursos, datosEstudiantes, datosMaterias] = await Promise.all([
          listarCursosCertificados(opcionesDelAnio),
          listarEstudiantesCertificados(opcionesDelAnio),
          listarMateriasCertificados({ signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setCursos(datosCursos || []);
        setEstudiantes(datosEstudiantes || []);
        setMaterias(datosMaterias || []);
      } catch (requestError) {
        if (esCancelacion(requestError, controller.signal)) return;
        console.error("Error cargando base para certificados", requestError);
        setError("No se pudo cargar la informacion base.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void cargarBase();
    return () => controller.abort();
  }, [parametrosAnio]);

  useEffect(
    () => () => {
      const controller = consultaRef.current;
      consultaRef.current = null;
      controller?.abort();
    },
    [],
  );

  const cursosPorId = useMemo(() => crearMapaCursos(cursos), [cursos]);

  const estudiantesFiltrados = useMemo(
    () => filtrarEstudiantesCertificados(estudiantes, {
      busqueda,
      cursoSeleccionado,
      estadoFiltro,
    }),
    [busqueda, cursoSeleccionado, estadoFiltro, estudiantes],
  );

  const iniciarConsulta = useCallback(({ estudianteId = null, esCurso = false } = {}) => {
    consultaRef.current?.abort();
    const controller = new AbortController();
    consultaRef.current = controller;
    setGenerandoId(estudianteId);
    setGenerandoCurso(esCurso);
    setError("");
    return controller;
  }, []);

  const finalizarConsulta = useCallback((controller) => {
    if (consultaRef.current !== controller) return;
    consultaRef.current = null;
    setGenerandoId(null);
    setGenerandoCurso(false);
  }, []);

  const generarCertificado = useCallback(async (estudianteId) => {
    const controller = iniciarConsulta({ estudianteId });
    try {
      const estudiante = estudiantes.find((item) => item.id === estudianteId);
      const curso = cursosPorId.get(estudiante?.curso_id);
      const periodosConsultar = periodo === "todos"
        ? PERIODOS_NUMERICOS
        : [Number(periodo)];
      const boletines = await Promise.all(
        periodosConsultar.map((periodoItem) =>
          generarBoletinCertificado(
            estudianteId,
            periodoItem,
            opcionesConAnio({ signal: controller.signal }, parametrosAnio),
          )),
      );
      if (controller.signal.aborted) return { cancelado: true };
      const data = construirCertificadoNotas({
        boletines,
        periodosConsultar,
        periodo,
        estudiante,
        curso,
      });
      setCertificado(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return { data };
    } catch (requestError) {
      if (esCancelacion(requestError, controller.signal)) return { cancelado: true };
      console.error("Error generando certificado", requestError);
      setError(
        requestError?.response?.data?.detail
          || "No se pudo generar el certificado.",
      );
      return { error: requestError };
    } finally {
      finalizarConsulta(controller);
    }
  }, [cursosPorId, estudiantes, finalizarConsulta, iniciarConsulta, parametrosAnio, periodo]);

  // Matrícula, conducta y aprobado: piden la ficha por el tipo de documento.
  // El año de la matrícula es el que se puede editar en la pantalla; el de
  // los demás, el que mira el admin.
  const generarCertificadoFormal = useCallback(async (tipo, estudianteId) => {
    const controller = iniciarConsulta({ estudianteId });
    try {
      const estudiante = estudiantes.find((item) => item.id === estudianteId);
      if (!estudiante) {
        setError("No se encontro el estudiante seleccionado.");
        return { error: new Error("Estudiante no encontrado") };
      }

      const ficha = await obtenerFichaEstudianteCertificado(estudianteId, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return { cancelado: true };
      const data = construirCertificadoFormal({
        tipo,
        estudiante,
        ficha,
        curso: cursosPorId.get(estudiante.curso_id),
        anioLectivo: tipo === "matricula"
          ? anioLectivo || anioLectivoSugerido
          : anioLectivoSugerido,
        anioCerrado,
      });
      setCertificadoFormal(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return { data };
    } catch (requestError) {
      if (esCancelacion(requestError, controller.signal)) return { cancelado: true };
      console.error("Error generando certificado", requestError);
      setError(
        requestError?.response?.data?.detail
          || "No se pudo cargar la ficha del estudiante.",
      );
      return { error: requestError };
    } finally {
      finalizarConsulta(controller);
    }
  }, [
    anioCerrado,
    anioLectivo,
    anioLectivoSugerido,
    cursosPorId,
    estudiantes,
    finalizarConsulta,
    iniciarConsulta,
  ]);

  const construirReporteParcialRemoto = useCallback(async (
    estudiantesObjetivo,
    alcance,
    controller,
  ) => {
    const periodoNumero = Number(periodoReporte);
    const materiaIdFiltro = materiaReporte === MATERIA_TODAS
      ? null
      : Number(materiaReporte);
    const respuestas = await Promise.allSettled(
      estudiantesObjetivo.map((estudiante) =>
        generarReporteParcialCertificado(
          estudiante.id,
          periodoNumero,
          opcionesConAnio({ signal: controller.signal }, parametrosAnio),
        )),
    );
    if (controller.signal.aborted) return { cancelado: true };

    const boletinesValidos = construirBoletinesValidos(
      respuestas,
      estudiantesObjetivo,
      periodoNumero,
      materiaIdFiltro,
    );

    if (!boletinesValidos.length) {
      throw new Error("No se pudo cargar informacion academica para los filtros seleccionados.");
    }

    const asignacionIds = obtenerAsignacionIds(boletinesValidos);
    const asistenciaPorAsignacion = new Map();

    await Promise.all(
      asignacionIds.map(async (asignacionId) => {
        try {
          const historial = await listarHistorialAsistenciaCertificados(
            asignacionId,
            periodoNumero,
            { signal: controller.signal },
          );
          asistenciaPorAsignacion.set(
            asignacionId,
            Array.isArray(historial) ? historial : [],
          );
        } catch (requestError) {
          if (!esCancelacion(requestError, controller.signal)) {
            console.error("Error cargando asistencia para reporte parcial", requestError);
          }
          asistenciaPorAsignacion.set(asignacionId, []);
        }
      }),
    );
    if (controller.signal.aborted) return { cancelado: true };

    const estudiantesReporte = construirEstudiantesReporte({
      boletinesValidos,
      cursosPorId,
      asistenciaPorAsignacion,
      periodoNumero,
    });
    const errores = respuestas.filter(
      (respuesta) => respuesta.status === "rejected",
    ).length;
    const data = construirResumenReporteParcial({
      alcance,
      periodoNumero,
      materiaIdFiltro,
      materias,
      cursosPorId,
      cursoSeleccionado,
      fecha: new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      estudiantesReporte,
      errores,
    });
    setReporteParcial(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return { data };
  }, [
    cursoSeleccionado,
    cursosPorId,
    materiaReporte,
    materias,
    parametrosAnio,
    periodoReporte,
  ]);

  const generarReporteParcialEstudiante = useCallback(async (estudianteId) => {
    const controller = iniciarConsulta({ estudianteId });
    try {
      const estudiante = estudiantes.find((item) => item.id === estudianteId);
      if (!estudiante) {
        setError("No se encontro el estudiante seleccionado.");
        return { error: new Error("Estudiante no encontrado") };
      }
      return await construirReporteParcialRemoto(
        [estudiante],
        "estudiante",
        controller,
      );
    } catch (requestError) {
      if (esCancelacion(requestError, controller.signal)) return { cancelado: true };
      console.error("Error generando reporte academico parcial", requestError);
      setError(
        requestError?.response?.data?.detail
          || requestError?.message
          || "No se pudo generar el reporte academico parcial.",
      );
      return { error: requestError };
    } finally {
      finalizarConsulta(controller);
    }
  }, [construirReporteParcialRemoto, estudiantes, finalizarConsulta, iniciarConsulta]);

  const generarReporteParcialCurso = useCallback(async () => {
    const controller = iniciarConsulta({ esCurso: true });
    try {
      if (!cursoSeleccionado) {
        setError("Selecciona un curso para generar el reporte academico parcial del grupo.");
        return { error: new Error("Curso no seleccionado") };
      }

      const estudiantesCurso = filtrarEstudiantesCurso(
        estudiantes,
        cursoSeleccionado,
        estadoFiltro,
      );

      if (!estudiantesCurso.length) {
        setError("No hay estudiantes en el curso y estado seleccionados.");
        return { error: new Error("Curso sin estudiantes") };
      }

      return await construirReporteParcialRemoto(
        estudiantesCurso,
        "curso",
        controller,
      );
    } catch (requestError) {
      if (esCancelacion(requestError, controller.signal)) return { cancelado: true };
      console.error("Error generando reporte academico parcial por curso", requestError);
      setError(
        requestError?.response?.data?.detail
          || requestError?.message
          || "No se pudo generar el reporte academico parcial.",
      );
      return { error: requestError };
    } finally {
      finalizarConsulta(controller);
    }
  }, [
    construirReporteParcialRemoto,
    cursoSeleccionado,
    estadoFiltro,
    estudiantes,
    finalizarConsulta,
    iniciarConsulta,
  ]);

  const generarSegunTab = useCallback((tabActiva, estudianteId) => {
    if (TIPOS_CERTIFICADO_FORMAL.includes(tabActiva)) {
      void generarCertificadoFormal(tabActiva, estudianteId);
      return;
    }
    if (tabActiva === "reporte-parcial") {
      void generarReporteParcialEstudiante(estudianteId);
      return;
    }
    void generarCertificado(estudianteId);
  }, [
    generarCertificado,
    generarCertificadoFormal,
    generarReporteParcialEstudiante,
  ]);

  return {
    anioLectivo,
    busqueda,
    certificado,
    certificadoFormal,
    cursoSeleccionado,
    cursos,
    cursosPorId,
    error,
    estadoFiltro,
    estudiantesFiltrados,
    generandoCurso,
    generandoId,
    loading,
    materiaReporte,
    materias,
    periodo,
    periodoReporte,
    reporteParcial,
    generarCertificado,
    generarCertificadoFormal,
    generarReporteParcialCurso,
    generarReporteParcialEstudiante,
    generarSegunTab,
    limpiarCertificado: () => setCertificado(null),
    limpiarCertificadoFormal: () => setCertificadoFormal(null),
    limpiarError: () => setError(""),
    limpiarReporteParcial: () => setReporteParcial(null),
    setAnioLectivo,
    setBusqueda,
    setCursoSeleccionado,
    setEstadoFiltro,
    setMateriaReporte,
    setPeriodo,
    setPeriodoReporte,
  };
}
