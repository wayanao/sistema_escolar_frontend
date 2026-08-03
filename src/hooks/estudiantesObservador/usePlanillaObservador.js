import { useCallback, useEffect, useRef, useState } from "react";
import { listarPlanillaObservador } from "../../services/estudiantesObservadorApi";
import { filtrarEstudiantesObservador } from "../../utils/estudiantesObservador/estudiantes";

export default function usePlanillaObservador(asignacionId) {
  const [busqueda, setBusqueda] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(Boolean(asignacionId));
  const [error, setError] = useState(null);
  const solicitudRef = useRef(0);

  useEffect(() => {
    const solicitudId = ++solicitudRef.current;

    if (!asignacionId) {
      setEstudiantes([]);
      setFiltrados([]);
      setCargando(false);
      setError(null);
      return undefined;
    }

    setCargando(true);
    setError(null);

    listarPlanillaObservador(asignacionId)
      .then((data) => {
        if (solicitudRef.current !== solicitudId) return;
        setEstudiantes(data);
        setFiltrados(data || []);
      })
      .catch((requestError) => {
        if (solicitudRef.current !== solicitudId) return;
        setError(requestError);
      })
      .finally(() => {
        if (solicitudRef.current === solicitudId) setCargando(false);
      });

    return () => {
      solicitudRef.current += 1;
    };
  }, [asignacionId]);

  const buscarEstudiantes = useCallback(() => {
    if (!estudiantes || estudiantes.length === 0) return false;
    setFiltrados(filtrarEstudiantesObservador(estudiantes, busqueda));
    return true;
  }, [busqueda, estudiantes]);

  return {
    busqueda,
    setBusqueda,
    estudiantes,
    filtrados,
    cargando,
    error,
    buscarEstudiantes,
  };
}
