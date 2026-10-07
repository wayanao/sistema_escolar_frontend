import { useCallback, useEffect, useState } from "react";
import {
  listarCandidatosMatricula,
  obtenerResumenAnio,
  promoverEstudiantes,
} from "../../services/aniosLectivosApi";
import { listarCursos } from "../../services/cursosApi";

function detalleError(error, respaldo) {
  const detalle = error?.response?.data?.detail;
  return typeof detalle === "string" && detalle.trim() ? detalle : respaldo;
}

export default function usePreparacionMatriculas(anioPreparacion) {
  const anioLectivoId = anioPreparacion?.id ?? null;
  const [cursosOrigen, setCursosOrigen] = useState([]);
  const [cursosDestino, setCursosDestino] = useState([]);
  const [cursoOrigenId, setCursoOrigenId] = useState("");
  const [cursoDestinoId, setCursoDestinoId] = useState("");
  const [candidatos, setCandidatos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [resultadoPromocion, setResultadoPromocion] = useState(null);
  const [cargandoPreparacion, setCargandoPreparacion] = useState(false);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [promoviendo, setPromoviendo] = useState(false);
  const [error, setError] = useState("");

  const recargarPreparacion = useCallback(async ({ signal } = {}) => {
    if (!anioLectivoId) return;
    setCargandoPreparacion(true);
    setError("");
    try {
      const [origen, destino, datosResumen] = await Promise.all([
        listarCursos("activo", { signal }),
        listarCursos("activo", {
          signal,
          parametrosAnio: { anio_lectivo_id: anioLectivoId },
        }),
        obtenerResumenAnio(anioLectivoId, { signal }),
      ]);
      if (signal?.aborted) return;
      setCursosOrigen(origen);
      setCursosDestino(destino);
      setResumen(datosResumen);
    } catch (err) {
      if (signal?.aborted) return;
      setError(detalleError(err, "No se pudo cargar la preparación del año."));
    } finally {
      if (!signal?.aborted) setCargandoPreparacion(false);
    }
  }, [anioLectivoId]);

  useEffect(() => {
    if (!anioLectivoId) {
      setCursosOrigen([]);
      setCursosDestino([]);
      setResumen(null);
      return undefined;
    }
    const controller = new AbortController();
    void recargarPreparacion({ signal: controller.signal });
    return () => controller.abort();
  }, [anioLectivoId, recargarPreparacion]);

  useEffect(() => {
    if (!anioLectivoId || !cursoOrigenId) {
      setCandidatos([]);
      setSeleccionados([]);
      setCargandoCandidatos(false);
      return undefined;
    }

    const controller = new AbortController();
    setCargandoCandidatos(true);
    setError("");
    listarCandidatosMatricula(anioLectivoId, Number(cursoOrigenId), {
      signal: controller.signal,
    })
      .then((datos) => {
        if (controller.signal.aborted) return;
        const lista = datos.candidatos ?? [];
        setCandidatos(lista);
        setSeleccionados(
          lista
            .filter((candidato) => !candidato.matriculado_en_destino)
            .map((candidato) => candidato.id),
        );
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(detalleError(err, "No se pudieron cargar los estudiantes del curso."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoCandidatos(false);
      });

    return () => controller.abort();
  }, [anioLectivoId, cursoOrigenId]);

  const cambiarCursoOrigen = useCallback((valor) => {
    setCursoOrigenId(valor);
    setCursoDestinoId("");
    setResultadoPromocion(null);
  }, []);

  const alternarEstudiante = useCallback((estudianteId) => {
    setSeleccionados((actuales) =>
      actuales.includes(estudianteId)
        ? actuales.filter((id) => id !== estudianteId)
        : [...actuales, estudianteId],
    );
  }, []);

  const promover = useCallback(async () => {
    if (!anioLectivoId || !cursoOrigenId || !cursoDestinoId || !seleccionados.length) {
      return { estado: "validacion" };
    }

    setPromoviendo(true);
    setError("");
    let resultado;
    try {
      resultado = await promoverEstudiantes(anioLectivoId, {
        curso_origen_id: Number(cursoOrigenId),
        curso_destino_id: Number(cursoDestinoId),
        estudiante_ids: seleccionados,
      });
      const nombresPorId = Object.fromEntries(
        candidatos.map((candidato) => [
          candidato.id,
          `${candidato.nombre} ${candidato.apellido}`.trim(),
        ]),
      );
      setResultadoPromocion({ ...resultado, nombresPorId });
      setCandidatos((actuales) =>
        actuales.map((candidato) =>
          seleccionados.includes(candidato.id)
            ? {
                ...candidato,
                matriculado_en_destino: true,
                curso_destino_id: Number(cursoDestinoId),
              }
            : candidato,
        ),
      );
      setSeleccionados([]);
      setCursoDestinoId("");
    } catch (err) {
      setError(detalleError(err, "No se pudo completar la matrícula seleccionada."));
      setPromoviendo(false);
      return { estado: "error", error: err };
    }

    try {
      const datosResumen = await obtenerResumenAnio(anioLectivoId);
      setResumen(datosResumen);
    } catch {
      setError("La matrícula se completó, pero no se pudo actualizar el resumen.");
    }
    setPromoviendo(false);
    return { estado: "exito", resultado };
  }, [
    anioLectivoId,
    candidatos,
    cursoDestinoId,
    cursoOrigenId,
    seleccionados,
  ]);

  return {
    cursosOrigen,
    cursosDestino,
    cursoOrigenId,
    cursoDestinoId,
    candidatos,
    seleccionados,
    resumen,
    resultadoPromocion,
    cargandoPreparacion,
    cargandoCandidatos,
    promoviendo,
    error,
    cambiarCursoOrigen,
    setCursoDestinoId,
    alternarEstudiante,
    promover,
    recargarPreparacion,
  };
}
