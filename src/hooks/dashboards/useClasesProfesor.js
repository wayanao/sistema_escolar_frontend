import { useCallback, useEffect, useMemo, useState } from "react";
import { obtenerClasesProfesor } from "../../services/dashboardsApi";
import {
    FILTRO_JORNADA_AMBAS,
    MENSAJE_ERROR_CLASES,
    agruparClasesPorJornada,
    agruparHorarioPorJornada,
    buscarClasePorAsignacion,
    construirHorarioProfesor,
    deduplicarClases,
    normalizarClases,
    obtenerCursosProfesor,
    obtenerJornadasVisibles,
    ordenarClasesConHorario,
    tieneDosJornadas,
} from "../../utils/dashboards/profesor";

// Clases asignadas del profesor y el horario semanal que se deriva de ellas.
// Un fallo aquí no bloquea inasistencias, cumpleaños ni rendimiento, pero sí
// deja sin cursos al filtro de rendimiento, así que publica su error para que
// las tres secciones que dependen de él puedan distinguirlo de «no tienes
// clases».
const useClasesProfesor = (profesorId, asignacionId, descartarAsignacionInvalida) => {
    const [clases, setClases] = useState([]);
    const [horarioAsignado, setHorarioAsignado] = useState([]);
    const [loadingClases, setLoadingClases] = useState(true);
    const [errorClases, setErrorClases] = useState("");
    const [filtroJornada, setFiltroJornada] = useState(FILTRO_JORNADA_AMBAS);

    const cargarClases = useCallback(async () => {
        if (!profesorId) return;
        setLoadingClases(true);
        setErrorClases("");
        try {
            const data = normalizarClases(await obtenerClasesProfesor(profesorId));
            setClases(data);
            descartarAsignacionInvalida(data);
            setHorarioAsignado(construirHorarioProfesor(data));
        } catch (error) {
            console.error("Error cargando clases", error);
            setClases([]);
            setHorarioAsignado([]);
            setErrorClases(MENSAJE_ERROR_CLASES);
        } finally {
            setLoadingClases(false);
        }
    }, [descartarAsignacionInvalida, profesorId]);

    useEffect(() => {
        cargarClases();
    }, [cargarClases]);

    // El selector deduplica por curso y materia; el horario sí pinta cada franja.
    const clasesUnicas = useMemo(() => deduplicarClases(clases), [clases]);
    const claseSeleccionada = useMemo(
        () => buscarClasePorAsignacion(clasesUnicas, asignacionId),
        [asignacionId, clasesUnicas],
    );
    const cursosProfesor = useMemo(() => obtenerCursosProfesor(clases), [clases]);

    const clasesConHorario = useMemo(
        () => ordenarClasesConHorario(horarioAsignado),
        [horarioAsignado],
    );
    const clasesPorJornada = useMemo(
        () => agruparClasesPorJornada(clasesConHorario),
        [clasesConHorario],
    );
    const horarioPorJornada = useMemo(
        () => agruparHorarioPorJornada(clasesPorJornada),
        [clasesPorJornada],
    );
    const hayDosJornadas = tieneDosJornadas(clasesPorJornada);
    const jornadasVisibles = obtenerJornadasVisibles(filtroJornada, clasesPorJornada);

    return {
        loadingClases,
        errorClases,
        clasesUnicas,
        claseSeleccionada,
        cursosProfesor,
        clasesConHorario,
        clasesPorJornada,
        horarioPorJornada,
        filtroJornada,
        setFiltroJornada,
        hayDosJornadas,
        jornadasVisibles,
    };
};

export default useClasesProfesor;
