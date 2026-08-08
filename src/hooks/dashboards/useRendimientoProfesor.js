import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    obtenerNotasAltasProfesor,
    obtenerNotasBajasProfesor,
} from "../../services/dashboardsApi";
import {
    MATERIA_TODAS,
    MENSAJE_ERROR_RENDIMIENTO,
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
    const [errorRendimiento, setErrorRendimiento] = useState("");
    // Cambiar de curso o de materia lanza una consulta nueva sin esperar a la
    // anterior. Se numeran para que una respuesta tardía no pise a la vigente.
    const peticionRef = useRef(0);

    const cargarRendimiento = useCallback(async () => {
        if (!profesorId) return;
        // Sin curso elegido se vacía la vista sin llamar al backend.
        if (!cursoFiltro) {
            peticionRef.current += 1;
            setNotasBajas([]);
            setNotasAltas([]);
            setErrorRendimiento("");
            return;
        }
        const peticion = (peticionRef.current += 1);
        const vigente = () => peticion === peticionRef.current;

        setLoadingRendimiento(true);
        setErrorRendimiento("");
        try {
            const params = construirParametrosRendimiento(cursoFiltro, materiaFiltro);
            const [bajas, altas] = await Promise.all([
                obtenerNotasBajasProfesor(profesorId, params),
                obtenerNotasAltasProfesor(profesorId, params),
            ]);
            if (!vigente()) return;
            setNotasBajas(normalizarNotas(bajas));
            setNotasAltas(normalizarNotas(altas));
        } catch (error) {
            console.error("Error cargando rendimiento", error);
            if (!vigente()) return;
            setNotasBajas([]);
            setNotasAltas([]);
            setErrorRendimiento(MENSAJE_ERROR_RENDIMIENTO);
        } finally {
            if (vigente()) setLoadingRendimiento(false);
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
        errorRendimiento,
        cambiarCurso,
        setMateriaFiltro,
    };
};

export default useRendimientoProfesor;
