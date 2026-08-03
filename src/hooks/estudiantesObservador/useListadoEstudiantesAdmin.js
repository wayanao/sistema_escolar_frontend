import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listarCursosEstudiantes,
  listarEstudiantes,
} from "../../services/estudiantesObservadorApi";
import { filtrarEstudiantesAdmin } from "../../utils/estudiantesObservador/estudiantes";

export default function useListadoEstudiantesAdmin({ habilitado = true } = {}) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [error, setError] = useState(null);
  const solicitudRef = useRef(0);

  const recargar = useCallback(async () => {
    if (!habilitado) return;

    const solicitudId = ++solicitudRef.current;
    setLoading(true);
    setError(null);

    try {
      const [estudiantesData, cursosData] = await Promise.all([
        listarEstudiantes(estadoFiltro),
        listarCursosEstudiantes(),
      ]);

      if (solicitudRef.current !== solicitudId) return;
      setEstudiantes(estudiantesData);
      setCursos(cursosData);
    } catch (requestError) {
      if (solicitudRef.current !== solicitudId) return;
      setError(requestError);
    } finally {
      if (solicitudRef.current === solicitudId) setLoading(false);
    }
  }, [estadoFiltro, habilitado]);

  useEffect(() => {
    if (habilitado) void recargar();
    return () => {
      solicitudRef.current += 1;
    };
  }, [habilitado, recargar]);

  const estudiantesFiltrados = useMemo(
    () => filtrarEstudiantesAdmin(estudiantes, searchTerm),
    [estudiantes, searchTerm],
  );

  return {
    estudiantes,
    setEstudiantes,
    estudiantesFiltrados,
    cursos,
    loading,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    error,
    recargar,
  };
}
