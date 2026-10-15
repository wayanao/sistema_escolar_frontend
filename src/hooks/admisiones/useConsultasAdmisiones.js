import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listarAdmisiones, obtenerCuestionarioAdmision } from "../../services/admisionesApi";
import { listarCursos } from "../../services/cursosApi";
import {
  FILTRO_TODOS,
  LISTA_ADMISIONES_VACIA,
  filtrarAdmisiones,
  mensajeDeErrorAdmision,
  normalizarListaAdmisiones,
} from "../../utils/admisiones/admisiones";
import { normalizarCuestionario } from "../../utils/admisiones/cuestionario";

const MENSAJE_SIN_CUESTIONARIO =
  "No se pudieron cargar las preguntas del anexo. Lo demás de la entrevista sí se puede guardar.";

// Hook de consulta de admisiones: la lista del año con sus conteos, el
// filtro y, si se piden, los cursos del año y las preguntas del anexo. Las
// escrituras viven en useComandosAdmision. Ver
// docs/funcionalidades/ENTREVISTA_ADMISION.md.
//
// - El filtro se aplica en el navegador: cambiarlo no pide nada.
// - Una respuesta de un año que ya se dejó atrás se descarta.
// - Los cursos solo los pide la página de admisiones (`cargarCursos`); la
//   tarjeta de Años lectivos solo necesita los conteos.
// - Las preguntas del anexo (`cargarCuestionario`, paso E11) son las mismas
//   para todos los años: se piden una sola vez.
export default function useConsultasAdmisiones(
  anioLectivoId,
  { cargarCursos = false, cargarCuestionario = false } = {},
) {
  const [datos, setDatos] = useState(LISTA_ADMISIONES_VACIA);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState(FILTRO_TODOS);
  const [cursos, setCursos] = useState([]);
  const [cuestionario, setCuestionario] = useState([]);
  const [errorCuestionario, setErrorCuestionario] = useState("");
  const solicitudRef = useRef(null);

  const recargar = useCallback(async () => {
    solicitudRef.current?.abort();
    if (!anioLectivoId) {
      solicitudRef.current = null;
      setDatos(LISTA_ADMISIONES_VACIA);
      setError("");
      setCargando(false);
      return;
    }

    const controller = new AbortController();
    solicitudRef.current = controller;
    setCargando(true);
    setError("");
    try {
      const respuesta = await listarAdmisiones(anioLectivoId, { signal: controller.signal });
      if (controller.signal.aborted || solicitudRef.current !== controller) return;
      setDatos(normalizarListaAdmisiones(respuesta));
    } catch (fallo) {
      if (controller.signal.aborted || solicitudRef.current !== controller) return;
      setDatos(LISTA_ADMISIONES_VACIA);
      setError(mensajeDeErrorAdmision(fallo, "No se pudieron cargar las admisiones."));
    } finally {
      if (solicitudRef.current === controller) {
        solicitudRef.current = null;
        setCargando(false);
      }
    }
  }, [anioLectivoId]);

  useEffect(() => {
    void recargar();
    return () => solicitudRef.current?.abort();
  }, [recargar]);

  useEffect(() => {
    if (!cargarCursos || !anioLectivoId) {
      setCursos([]);
      return undefined;
    }
    const controller = new AbortController();
    listarCursos("activo", {
      signal: controller.signal,
      parametrosAnio: { anio_lectivo_id: anioLectivoId },
    })
      .then((lista) => {
        if (!controller.signal.aborted) setCursos(Array.isArray(lista) ? lista : []);
      })
      .catch((fallo) => {
        if (!controller.signal.aborted) console.error("No se pudieron cargar los cursos", fallo);
      });
    return () => controller.abort();
  }, [anioLectivoId, cargarCursos]);

  useEffect(() => {
    if (!cargarCuestionario) return undefined;
    const controller = new AbortController();
    setErrorCuestionario("");
    obtenerCuestionarioAdmision({ signal: controller.signal })
      .then((respuesta) => {
        if (!controller.signal.aborted) setCuestionario(normalizarCuestionario(respuesta));
      })
      .catch((fallo) => {
        if (controller.signal.aborted) return;
        console.error("No se pudieron cargar las preguntas del anexo", fallo);
        setErrorCuestionario(MENSAJE_SIN_CUESTIONARIO);
      });
    return () => controller.abort();
  }, [cargarCuestionario]);

  const visibles = useMemo(
    () => filtrarAdmisiones(datos.admisiones, filtro),
    [datos.admisiones, filtro],
  );

  return {
    ...datos,
    visibles,
    filtro,
    setFiltro,
    cursos,
    cuestionario,
    errorCuestionario,
    cargando,
    error,
    recargar,
  };
}
