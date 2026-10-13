import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listarAdmisiones } from "../../services/admisionesApi";
import { listarCursos } from "../../services/cursosApi";
import {
  FILTRO_TODOS,
  LISTA_ADMISIONES_VACIA,
  filtrarAdmisiones,
  mensajeDeErrorAdmision,
  normalizarListaAdmisiones,
} from "../../utils/admisiones/admisiones";

// Hook de consulta de admisiones: la lista del año con sus conteos, el
// filtro y, si se piden, los cursos del año. Las escrituras viven en
// useComandosAdmision. Ver docs/funcionalidades/ENTREVISTA_ADMISION.md.
//
// - El filtro se aplica en el navegador: cambiarlo no pide nada.
// - Una respuesta de un año que ya se dejó atrás se descarta.
// - Los cursos solo los pide la página de admisiones (`cargarCursos`); la
//   tarjeta de Años lectivos solo necesita los conteos.
export default function useConsultasAdmisiones(anioLectivoId, { cargarCursos = false } = {}) {
  const [datos, setDatos] = useState(LISTA_ADMISIONES_VACIA);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState(FILTRO_TODOS);
  const [cursos, setCursos] = useState([]);
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
    cargando,
    error,
    recargar,
  };
}
