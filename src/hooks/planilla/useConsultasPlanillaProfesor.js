import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    listarClasesProfesorPlanilla,
    obtenerPlanillaNotas,
} from "../../services/planillaApi";
import {
    normalizarEstudiantesPlanilla,
    obtenerColumnasVisibles,
} from "../../utils/planilla/notas";
import {
    aplicarPromediosPonderados,
    normalizarPorcentajesPorTipo,
    porcentajesActivos as calcularPorcentajesActivos,
    sumaDePorcentajes,
} from "../../utils/planilla/porcentajes";
import { normalizarSubnotasPorTipo } from "../../utils/planilla/subnotas";

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
    // Subnotas por tipo de nota (docs/funcionalidades/SUBNOTAS_PLANILLA.md).
    // Las calificaciones de cada estudiante viajan dentro de él, en `subnotas`.
    const [subnotasPorTipo, setSubnotasPorTipo] = useState({});
    // Porcentajes por tipo de nota (parte B, paso B4a): `{ "<tipo>": 40 }`.
    const [porcentajesPorTipo, setPorcentajesPorTipo] = useState({});
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
                conSubnotas: true,
                conPorcentajes: true,
            });
            if (!solicitudVigente(planillaControllerRef, controller)) return;

            const columnasVisibles = obtenerColumnasVisibles(data.columnas);
            setColumnas(columnasVisibles);
            setSubnotasPorTipo(normalizarSubnotasPorTipo(data.subnotas, columnasVisibles));
            setPorcentajesPorTipo(normalizarPorcentajesPorTipo(data.porcentajes, columnasVisibles));
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

    // Porcentajes (parte B): se deciden aquí, con las columnas que se ven, y
    // no se toma el `porcentajes_activos` de la respuesta. Así, al borrar un
    // tipo o cambiar un porcentaje, el promedio se actualiza sin recargar.
    // Sin porcentajes activos, `estudiantes` es la misma lista de siempre.
    const porcentajesActivos = calcularPorcentajesActivos(columnas, porcentajesPorTipo);
    const sumaPorcentajes = sumaDePorcentajes(columnas, porcentajesPorTipo);
    const estudiantesConPromedio = useMemo(
        () => aplicarPromediosPonderados(estudiantes, columnas, porcentajesPorTipo),
        [estudiantes, columnas, porcentajesPorTipo],
    );

    return {
        estudiantes: estudiantesConPromedio,
        columnas,
        subnotasPorTipo,
        porcentajesPorTipo,
        porcentajesActivos,
        sumaPorcentajes,
        clases,
        cargarPlanilla,
        setEstudiantes,
        setColumnas,
        setSubnotasPorTipo,
        setPorcentajesPorTipo,
    };
}
