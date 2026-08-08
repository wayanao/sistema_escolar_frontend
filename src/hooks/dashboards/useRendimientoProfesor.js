import { useCallback, useEffect, useMemo, useState } from "react";
import {
    obtenerNotasAltasProfesor,
    obtenerNotasBajasProfesor,
} from "../../services/dashboardsApi";
import {
    MATERIA_TODAS,
    construirParametrosRendimiento,
    nombreCursoFiltro,
    nombreMateriaFiltro,
    normalizarNotas,
    obtenerMateriasDelCurso,
} from "../../utils/dashboards/profesor";

// Notas bajas y altas del curso elegido. Las dos consultas viajan en paralelo y
// comparten un solo indicador de carga.
const useRendimientoProfesor = (profesorId, clasesUnicas, cursosProfesor) => {
    const [cursoFiltro, setCursoFiltro] = useState("");
    const [materiaFiltro, setMateriaFiltro] = useState(MATERIA_TODAS);
    const [notasBajas, setNotasBajas] = useState([]);
    const [notasAltas, setNotasAltas] = useState([]);
    const [loadingRendimiento, setLoadingRendimiento] = useState(false);

    const cargarRendimiento = useCallback(async () => {
        if (!profesorId) return;
        // Sin curso elegido se vacía la vista sin llamar al backend.
        if (!cursoFiltro) {
            setNotasBajas([]);
            setNotasAltas([]);
            return;
        }
        setLoadingRendimiento(true);
        try {
            const params = construirParametrosRendimiento(cursoFiltro, materiaFiltro);
            const [bajas, altas] = await Promise.all([
                obtenerNotasBajasProfesor(profesorId, params),
                obtenerNotasAltasProfesor(profesorId, params),
            ]);
            setNotasBajas(normalizarNotas(bajas));
            setNotasAltas(normalizarNotas(altas));
        } catch (error) {
            console.error("Error cargando rendimiento", error);
        } finally {
            setLoadingRendimiento(false);
        }
    }, [cursoFiltro, materiaFiltro, profesorId]);

    // El primer curso disponible se elige solo, y solo mientras no haya uno.
    useEffect(() => {
        if (!cursosProfesor.length || cursoFiltro) return;
        setCursoFiltro(String(cursosProfesor[0].id));
    }, [cursosProfesor, cursoFiltro]);

    useEffect(() => {
        if (!profesorId) return;
        cargarRendimiento();
    }, [profesorId, cargarRendimiento]);

    const materiasDelCurso = useMemo(
        () => obtenerMateriasDelCurso(clasesUnicas, cursoFiltro),
        [clasesUnicas, cursoFiltro],
    );
    const cursoFiltroNombre = useMemo(
        () => nombreCursoFiltro(cursosProfesor, cursoFiltro),
        [cursoFiltro, cursosProfesor],
    );
    const materiaFiltroNombre = useMemo(
        () => nombreMateriaFiltro(materiasDelCurso, materiaFiltro),
        [materiaFiltro, materiasDelCurso],
    );

    // Cambiar de curso devuelve la materia a «todas».
    const cambiarCurso = useCallback((valor) => {
        setCursoFiltro(valor);
        setMateriaFiltro(MATERIA_TODAS);
    }, []);

    return {
        cursoFiltro,
        materiaFiltro,
        materiasDelCurso,
        cursoFiltroNombre,
        materiaFiltroNombre,
        notasBajas,
        notasAltas,
        loadingRendimiento,
        cambiarCurso,
        setMateriaFiltro,
    };
};

export default useRendimientoProfesor;
