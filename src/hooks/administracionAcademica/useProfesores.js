import { useCallback, useEffect, useRef, useState } from "react";
import { listarProfesores } from "../../services/profesoresApi";

export default function useProfesores() {
    const [profesores, setProfesores] = useState([]);
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
            const data = await listarProfesores(estadoFiltro, {
                signal: controller.signal,
            });

            if (solicitudRef.current !== controller || controller.signal.aborted) return;
            setProfesores(data);
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
        profesores,
        setProfesores,
        estadoFiltro,
        setEstadoFiltro,
        recargar,
    };
}
