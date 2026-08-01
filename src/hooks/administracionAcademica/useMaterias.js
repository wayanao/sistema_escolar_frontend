import { useCallback, useEffect, useRef, useState } from "react";
import { listarMaterias } from "../../services/materiasApi";

export default function useMaterias() {
    const [materias, setMaterias] = useState([]);
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
            const data = await listarMaterias(estadoFiltro, {
                signal: controller.signal,
            });

            if (solicitudRef.current !== controller || controller.signal.aborted) return;
            setMaterias(data);
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
        materias,
        setMaterias,
        estadoFiltro,
        setEstadoFiltro,
        recargar,
    };
}
