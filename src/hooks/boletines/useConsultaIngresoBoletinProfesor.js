import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listarClasesProfesorBoletines,
  obtenerEstadoPorcentajesBoletin,
  obtenerReferenciaBoletin,
} from "../../services/boletinesApi";
import {
  crearDatosBoletinInicial,
  crearEstadoGuardadoInicial,
  deduplicarClases,
  hayPorcentajesIncompletos,
  normalizarEstudiantesReferencia,
} from "../../utils/boletines/ingresoBoletin";
import {
  guardarPeriodoProfesor,
  obtenerPeriodoProfesor,
} from "../../utils/periodoProfesor";

export default function useConsultaIngresoBoletinProfesor() {
  const [asignacionId, setAsignacionId] = useState(
    () => localStorage.getItem("asignacionId") || "",
  );
  const [clases, setClases] = useState([]);
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorClases, setErrorClases] = useState(null);
  const [errorAlumnos, setErrorAlumnos] = useState(null);
  // Porcentajes por tipo de nota, paso B4c (PB11): para avisar al guardar.
  const [porcentajesIncompletos, setPorcentajesIncompletos] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const cargarClases = async () => {
      try {
        const profesor = JSON.parse(localStorage.getItem("profesor"));
        if (!profesor) return;
        const data = await listarClasesProfesorBoletines(profesor.id, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setClases(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error al cargar clases", error);
          setErrorClases(error);
        }
      }
    };

    void cargarClases();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!asignacionId || !periodo) {
      setCargando(false);
      return undefined;
    }

    const controller = new AbortController();
    localStorage.setItem("asignacionId", asignacionId);

    const cargarAlumnos = async () => {
      setCargando(true);
      setErrorAlumnos(null);
      setPorcentajesIncompletos(false);

      try {
        // Las dos lecturas van a la vez. Si la de los porcentajes falla, el
        // boletín carga igual y simplemente no avisa.
        const [data, estadoPorcentajes] = await Promise.all([
          obtenerReferenciaBoletin(asignacionId, periodo, {
            signal: controller.signal,
          }),
          obtenerEstadoPorcentajesBoletin(asignacionId, periodo, {
            signal: controller.signal,
          }).catch((error) => {
            if (!controller.signal.aborted) {
              console.error("No se pudo saber si hay porcentajes incompletos", error);
            }
            return null;
          }),
        ]);
        if (controller.signal.aborted) return;
        const estudiantesVisibles = normalizarEstudiantesReferencia(data);
        setEstudiantes(estudiantesVisibles);
        setPorcentajesIncompletos(hayPorcentajesIncompletos(estadoPorcentajes));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error al cargar alumnos", error);
          setErrorAlumnos(error);
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    void cargarAlumnos();
    return () => controller.abort();
  }, [asignacionId, periodo]);

  const clasesUnicas = useMemo(
    () => deduplicarClases(clases, asignacionId),
    [asignacionId, clases],
  );

  const datosIniciales = useMemo(
    () => crearDatosBoletinInicial(estudiantes),
    [estudiantes],
  );

  const estadoGuardadoInicial = useMemo(
    () => crearEstadoGuardadoInicial(estudiantes),
    [estudiantes],
  );

  const cambiarPeriodo = useCallback((valor) => {
    setPeriodo(valor);
    guardarPeriodoProfesor(valor);
  }, []);

  return {
    asignacionId,
    cargando,
    clasesUnicas,
    datosIniciales,
    errorAlumnos,
    errorClases,
    estadoGuardadoInicial,
    estudiantes,
    periodo,
    porcentajesIncompletos,
    cambiarAsignacion: setAsignacionId,
    cambiarPeriodo,
  };
}
