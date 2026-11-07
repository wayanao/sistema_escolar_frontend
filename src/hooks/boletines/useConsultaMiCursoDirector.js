import { useCallback, useEffect, useState } from "react";

import {
  listarCursosDirigidos,
  obtenerMiCursoDirector,
} from "../../services/boletinesApi";
import {
  normalizarCursosDirigidos,
  normalizarMiCurso,
} from "../../utils/boletines/miCurso";

/**
 * «Mi curso» del director de grupo en Boletín Final: qué cursos dirige el
 * profesor (para mostrar o no la pestaña), cuál mira, y el ranking de ese
 * curso en el periodo de la pantalla.
 *
 * El ranking solo se pide con la pestaña abierta, y una respuesta vieja (de
 * otro curso o periodo) se descarta.
 */
export default function useConsultaMiCursoDirector({ periodo }) {
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState(null);
  const [vistaMiCurso, setVistaMiCurso] = useState(false);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listarCursosDirigidos({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const lista = normalizarCursosDirigidos(data);
        setCursos(lista);
        setCursoId((actual) => actual ?? lista[0]?.id ?? null);
      })
      .catch((err) => {
        // Si falla, la pestaña simplemente no aparece: el resto de la
        // pantalla funciona igual.
        if (!controller.signal.aborted) {
          console.error("No se pudo saber si el profesor dirige algún curso", err);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!vistaMiCurso || !cursoId || !periodo) return undefined;

    const controller = new AbortController();
    setCargando(true);
    setError(null);
    setDatos(null);

    obtenerMiCursoDirector(cursoId, periodo, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setDatos(normalizarMiCurso(data));
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error("No se pudo cargar el ranking del curso", err);
          setError(err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => controller.abort();
  }, [cursoId, intento, periodo, vistaMiCurso]);

  const mostrarMiCurso = useCallback(() => setVistaMiCurso(true), []);
  const mostrarMisMaterias = useCallback(() => setVistaMiCurso(false), []);
  const cambiarCurso = useCallback((id) => setCursoId(id), []);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return {
    disponible: cursos.length > 0,
    cursos,
    cursoId,
    vistaMiCurso: vistaMiCurso && cursos.length > 0,
    datos,
    cargando,
    error,
    cambiarCurso,
    mostrarMiCurso,
    mostrarMisMaterias,
    reintentar,
  };
}
