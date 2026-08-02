import { useEffect, useMemo, useState } from "react";

import {
  listarCursosBoletines,
  obtenerOrdenBoletin,
} from "../../services/boletinesApi";
import { ordenarPorBoletin } from "../../utils/boletines/ordenBoletin";

export default function useConsultaOrdenBoletin() {
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [materias, setMaterias] = useState([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [cargandoOrden, setCargandoOrden] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errorCursos, setErrorCursos] = useState(null);
  const [errorOrden, setErrorOrden] = useState(null);

  const cursoSeleccionado = useMemo(
    () => cursos.find((curso) => String(curso.id) === String(cursoId)),
    [cursoId, cursos],
  );

  useEffect(() => {
    const controller = new AbortController();

    const cargarCursos = async () => {
      setCargandoCursos(true);
      setErrorCursos(null);

      try {
        const respuesta = await listarCursosBoletines({
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const data = Array.isArray(respuesta) ? respuesta : [];
        setCursos(data);
        if (data.length > 0) {
          setCursoId((actual) => actual || String(data[0].id));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error cargando cursos", error);
          setErrorCursos(error);
          setMensaje("No se pudieron cargar los cursos.");
        }
      } finally {
        if (!controller.signal.aborted) setCargandoCursos(false);
      }
    };

    void cargarCursos();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!cursoId) {
      setMaterias([]);
      setCargandoOrden(false);
      return undefined;
    }

    const controller = new AbortController();

    const cargarOrden = async () => {
      setCargandoOrden(true);
      setMensaje("");
      setErrorOrden(null);

      try {
        const respuesta = await obtenerOrdenBoletin(cursoId, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const data = Array.isArray(respuesta?.items) ? respuesta.items : [];
        setMaterias(ordenarPorBoletin(data));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error cargando orden del boletín", error);
          setMaterias([]);
          setErrorOrden(error);
          setMensaje(
            error?.response?.data?.detail ||
              "No se pudo cargar el orden del boletín.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setCargandoOrden(false);
      }
    };

    void cargarOrden();
    return () => controller.abort();
  }, [cursoId]);

  return {
    cargandoCursos,
    cargandoOrden,
    cursoId,
    cursos,
    cursoSeleccionado,
    errorCursos,
    errorOrden,
    materias,
    mensaje,
    cambiarCurso: setCursoId,
  };
}
