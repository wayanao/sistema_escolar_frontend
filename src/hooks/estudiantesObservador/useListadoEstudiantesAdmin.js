import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listarCursosEstudiantes,
  listarEstudiantes,
} from "../../services/estudiantesObservadorApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import { filtrarEstudiantesAdmin } from "../../utils/estudiantesObservador/estudiantes";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// Estudiantes y cursos son los de ese año.
export default function useListadoEstudiantesAdmin({
  habilitado = true,
  parametrosAnio,
} = {}) {
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
      const opciones = opcionesConAnio({}, parametrosAnio);
      const [estudiantesData, cursosData] = await Promise.all([
        listarEstudiantes(estadoFiltro, opciones),
        listarCursosEstudiantes(opciones),
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
  }, [estadoFiltro, habilitado, parametrosAnio]);

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
