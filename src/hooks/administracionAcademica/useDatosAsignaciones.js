import { useCallback, useEffect, useRef, useState } from "react";
import {
    listarAsignaciones,
    listarCursosAsignacion,
    listarMateriasAsignacion,
    listarProfesoresAsignacion,
} from "../../services/asignacionesApi";

export default function useDatosAsignaciones() {
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
            const [profesoresData, cursosData, materiasData, asignacionesData] = await Promise.all([
                listarProfesoresAsignacion(opciones),
                listarCursosAsignacion(opciones),
                listarMateriasAsignacion(opciones),
                listarAsignaciones(opciones),
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
    }, []);

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
