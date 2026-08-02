import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  generarBoletinAdministrativo,
  listarCursosBoletines,
  listarEstudiantesBoletines,
} from "../../services/boletinesApi";
import { filtrarEstudiantes } from "../../utils/boletines/generacionBoletin";

export default function useConsultaBoletinesAdministrativos() {
  const [cargando, setCargando] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [periodo, setPeriodo] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [boletinData, setBoletinData] = useState(null);
  const [cargandoBoletin, setCargandoBoletin] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [errorBoletin, setErrorBoletin] = useState(null);
  const consultaBoletinRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    const cargarBase = async () => {
      setCargando(true);
      setErrorCarga(null);

      try {
        const [dataCursos, dataEstudiantes] = await Promise.all([
          listarCursosBoletines({ signal: controller.signal }),
          listarEstudiantesBoletines({ signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setCursos(dataCursos);
        setEstudiantes(dataEstudiantes);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error cargando base de datos", error);
          setErrorCarga(error);
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    void cargarBase();
    return () => controller.abort();
  }, []);

  useEffect(
    () => () => {
      consultaBoletinRef.current?.abort();
    },
    [],
  );

  const estudiantesFiltrados = useMemo(
    () => filtrarEstudiantes(estudiantes, cursoSeleccionado, busqueda),
    [busqueda, cursoSeleccionado, estudiantes],
  );

  const consultarBoletin = useCallback(
    async (estudianteId) => {
      consultaBoletinRef.current?.abort();
      const controller = new AbortController();
      consultaBoletinRef.current = controller;
      setCargandoBoletin(true);
      setErrorBoletin(null);

      try {
        const data = await generarBoletinAdministrativo(estudianteId, periodo, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return { cancelado: true };
        setBoletinData(data);
        return { data };
      } catch (error) {
        if (controller.signal.aborted) return { cancelado: true };
        setErrorBoletin(error);
        return { error };
      } finally {
        if (consultaBoletinRef.current === controller) {
          consultaBoletinRef.current = null;
          setCargandoBoletin(false);
        }
      }
    },
    [periodo],
  );

  const limpiarBoletin = useCallback(() => {
    setBoletinData(null);
    setErrorBoletin(null);
  }, []);

  return {
    boletinData,
    busqueda,
    cargando,
    cargandoBoletin,
    cursoSeleccionado,
    cursos,
    errorBoletin,
    errorCarga,
    estudiantesFiltrados,
    periodo,
    cambiarBusqueda: setBusqueda,
    cambiarCurso: setCursoSeleccionado,
    cambiarPeriodo: setPeriodo,
    consultarBoletin,
    limpiarBoletin,
  };
}
