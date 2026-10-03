import { useCallback, useEffect, useRef, useState } from "react";
import {
    listarAsignaciones,
    listarCursosAsignacion,
    listarMateriasAsignacion,
    listarProfesoresAsignacion,
} from "../../services/asignacionesApi";
import { opcionesConAnio } from "../../utils/anioLectivo";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// Cursos y clases son de un año; profesores y materias no.
export default function useDatosAsignaciones({ parametrosAnio } = {}) {
    const [profesores, setProfesores] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [listaAsignaciones, setListaAsignaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const solicitudRef = useRef(null);

    const cancelar = useCallback(() => {
        solicitudRef.current?.abort();
        solicitudRef.current = null;
    }, []);

    const recargar = useCallback(async ({ mostrarCarga = true } = {}) => {
        solicitudRef.current?.abort();
        const controller = new AbortController();
        solicitudRef.current = controller;
        if (mostrarCarga) setCargando(true);

        try {
            const opciones = { signal: controller.signal };
            const opcionesDelAnio = opcionesConAnio(opciones, parametrosAnio);
            const [profesoresData, cursosData, materiasData, asignacionesData] = await Promise.all([
                listarProfesoresAsignacion(opciones),
                listarCursosAsignacion(opcionesDelAnio),
                listarMateriasAsignacion(opciones),
                listarAsignaciones(opcionesDelAnio),
            ]);

            if (solicitudRef.current !== controller || controller.signal.aborted) return;
            setProfesores(profesoresData);
            setCursos(cursosData);
            setMaterias(materiasData);
            setListaAsignaciones(asignacionesData);
        } catch (error) {
            if (solicitudRef.current !== controller || controller.signal.aborted) return;
            console.error("Error cargando datos de asignación", error);
        } finally {
            if (solicitudRef.current === controller && !controller.signal.aborted) {
                solicitudRef.current = null;
                setCargando(false);
            }
        }
    }, [parametrosAnio]);

    useEffect(() => {
        void recargar();
        return cancelar;
    }, [cancelar, recargar]);

    return {
        profesores,
        cursos,
        materias,
        listaAsignaciones,
        cargando,
        recargar,
    };
}
