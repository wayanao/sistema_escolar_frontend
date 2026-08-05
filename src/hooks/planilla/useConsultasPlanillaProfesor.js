import { useCallback, useEffect, useRef, useState } from "react";
import {
    listarClasesProfesorPlanilla,
    obtenerPlanillaNotas,
} from "../../services/planillaApi";
import {
    normalizarEstudiantesPlanilla,
    obtenerColumnasVisibles,
} from "../../utils/planilla/notas";

function iniciarSolicitud(ref) {
    ref.current?.abort();
    const controller = new AbortController();
    ref.current = controller;
    return controller;
}

function solicitudVigente(ref, controller) {
    return ref.current === controller && !controller.signal.aborted;
}

export default function useConsultasPlanillaProfesor({
    profesorId,
    asignacionId,
    periodo,
    onClaseNoDisponible,
}) {
    const [estudiantes, setEstudiantes] = useState([]);
    const [columnas, setColumnas] = useState([]);
    const [clases, setClases] = useState([]);
    const clasesControllerRef = useRef(null);
    const planillaControllerRef = useRef(null);
    const onClaseNoDisponibleRef = useRef(onClaseNoDisponible);

    useEffect(() => {
        onClaseNoDisponibleRef.current = onClaseNoDisponible;
    }, [onClaseNoDisponible]);

    const cargarClases = useCallback(async () => {
        if (!profesorId) return;

        const controller = iniciarSolicitud(clasesControllerRef);
        const data = await listarClasesProfesorPlanilla(profesorId, {
            signal: controller.signal,
        });
        if (!solicitudVigente(clasesControllerRef, controller)) return;

        console.log("CLASES:", data);
        setClases(data);
    }, [profesorId]);

    const cargarPlanilla = useCallback(async () => {
        const controller = iniciarSolicitud(planillaControllerRef);

        try {
            const data = await obtenerPlanillaNotas(asignacionId, periodo, {
                signal: controller.signal,
            });
            if (!solicitudVigente(planillaControllerRef, controller)) return;

            const columnasVisibles = obtenerColumnasVisibles(data.columnas);
            setColumnas(columnasVisibles);
            setEstudiantes(normalizarEstudiantesPlanilla(data.data || [], columnasVisibles));
        } catch (error) {
            if (!solicitudVigente(planillaControllerRef, controller)) return;

            console.error("Error cargando planilla", error);
            if (error.response?.status === 403) {
                onClaseNoDisponibleRef.current?.();
            }
        }
    }, [asignacionId, periodo]);

    const cancelarSolicitudClases = useCallback(() => {
        clasesControllerRef.current?.abort();
    }, []);

    const cancelarSolicitudPlanilla = useCallback(() => {
        planillaControllerRef.current?.abort();
    }, []);

    useEffect(() => {
        if (profesorId && asignacionId && periodo) {
            void cargarClases();
        }
        return cancelarSolicitudClases;
    }, [profesorId, asignacionId, periodo, cargarClases, cancelarSolicitudClases]);

    useEffect(() => {
        if (asignacionId && periodo) {
            void cargarPlanilla();
        }
        return cancelarSolicitudPlanilla;
    }, [asignacionId, periodo, cargarPlanilla, cancelarSolicitudPlanilla]);

    return {
        estudiantes,
        columnas,
        clases,
        cargarPlanilla,
        setEstudiantes,
        setColumnas,
    };
}
