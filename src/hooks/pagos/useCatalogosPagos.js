import { useCallback, useEffect, useState } from "react";
import pagosApi from "../../services/pagosApi";
import { normalizarTiposPagos } from "../../utils/pagos/contratos";

export default function useCatalogosPagos({ alErrorEstudiantes, parametrosAnio } = {}) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [tiposPagos, setTiposPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarEstudiantes = useCallback(async () => {
    try {
      const data = await pagosApi.obtenerEstudiantes();
      setEstudiantes(data);
    } catch (error) {
      console.error("Error cargando estudiantes:", error);
      alErrorEstudiantes?.(error);
    } finally {
      setLoading(false);
    }
  }, [alErrorEstudiantes]);

  const cargarCursos = useCallback(async () => {
    try {
      const data = await pagosApi.obtenerCursos();
      setCursos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando cursos:", error);
      setCursos([]);
    }
  }, []);

  useEffect(() => {
    cargarEstudiantes();
    cargarCursos();
  }, [cargarCursos, cargarEstudiantes]);

  useEffect(() => {
    let vigente = true;

    const cargarTiposPagos = async () => {
      try {
        const data = parametrosAnio?.anio_lectivo_id
          ? await pagosApi.obtenerTiposPagos({ parametrosAnio })
          : await pagosApi.obtenerTiposPagos();
        if (vigente) setTiposPagos(normalizarTiposPagos(data));
      } catch (error) {
        console.error("Error cargando tipos de pagos:", error);
        if (vigente) setTiposPagos([]);
      }
    };

    cargarTiposPagos();
    return () => {
      vigente = false;
    };
  }, [parametrosAnio]);

  return {
    estudiantes,
    cursos,
    tiposPagos,
    loading,
  };
}
