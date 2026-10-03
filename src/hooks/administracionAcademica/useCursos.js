import { useCallback, useEffect, useRef, useState } from "react";
import { listarCursos } from "../../services/cursosApi";
import { listarProfesores } from "../../services/profesoresApi";
import { opcionesConAnio } from "../../utils/anioLectivo";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// Los profesores no tienen año.
export default function useCursos({ parametrosAnio } = {}) {
    const [cursos, setCursos] = useState([]);
    const [estadoFiltro, setEstadoFiltro] = useState("activo");
    const [profesores, setProfesores] = useState([]);
    const solicitudRef = useRef(null);

    const cancelar = useCallback(() => {
        solicitudRef.current?.abort();
        solicitudRef.current = null;
    }, []);

    const recargar = useCallback(async () => {
        solicitudRef.current?.abort();
        const controller = new AbortController();
        solicitudRef.current = controller;

        try {
            const data = await listarCursos(
                estadoFiltro,
                opcionesConAnio({ signal: controller.signal }, parametrosAnio),
            );

            if (solicitudRef.current !== controller || controller.signal.aborted) return;
            setCursos(data);
        } catch (error) {
            if (solicitudRef.current !== controller || controller.signal.aborted) return;
            console.error(error);
        } finally {
            if (solicitudRef.current === controller) {
                solicitudRef.current = null;
            }
        }
    }, [estadoFiltro, parametrosAnio]);

    useEffect(() => {
        void recargar();
        return cancelar;
    }, [cancelar, recargar]);

    useEffect(() => {
        const controller = new AbortController();

        listarProfesores("activo", { signal: controller.signal })
            .then((data) => {
                if (!controller.signal.aborted) setProfesores(data);
            })
            .catch((error) => {
                if (!controller.signal.aborted) console.error(error);
            });

        return () => controller.abort();
    }, []);

    return {
        cursos,
        setCursos,
        estadoFiltro,
        setEstadoFiltro,
        profesores,
        recargar,
    };
}
