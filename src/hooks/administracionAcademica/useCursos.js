import { useCallback, useEffect, useRef, useState } from "react";
import { listarCursos } from "../../services/cursosApi";

export default function useCursos() {
    const [cursos, setCursos] = useState([]);
    const [estadoFiltro, setEstadoFiltro] = useState("activo");
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
            const data = await listarCursos(estadoFiltro, {
                signal: controller.signal,
            });

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
    }, [estadoFiltro]);

    useEffect(() => {
        void recargar();
        return cancelar;
    }, [cancelar, recargar]);

    return {
        cursos,
        setCursos,
        estadoFiltro,
        setEstadoFiltro,
        recargar,
    };
}
