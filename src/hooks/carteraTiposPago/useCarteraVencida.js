import { useEffect, useMemo, useState } from "react";
import {
    obtenerDetalleCarteraVencida,
    obtenerResumenCarteraVencida,
} from "../../services/carteraTiposPagoApi";
import {
    calcularTotalesCarteraVisible,
    filtrarCartera,
    obtenerCursosUnicos,
    obtenerMaxDeuda,
} from "../../utils/carteraTiposPago/cartera";

export default function useCarteraVencida() {
    const [resumen, setResumen] = useState(null);
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroCurso, setFiltroCurso] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("todos");

    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const [resumenCartera, listaCartera] = await Promise.all([
                    obtenerResumenCarteraVencida(),
                    obtenerDetalleCarteraVencida(),
                ]);
                setResumen(resumenCartera);
                setItems(listaCartera || []);
            } catch (error) {
                console.error("Error cargando cartera vencida:", error);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    const cursosUnicos = useMemo(() => obtenerCursosUnicos(items), [items]);

    const itemsFiltrados = useMemo(
        () => filtrarCartera(items, { busqueda, filtroCurso, filtroTipo }),
        [items, busqueda, filtroCurso, filtroTipo]
    );

    const totales = useMemo(
        () => calcularTotalesCarteraVisible(itemsFiltrados),
        [itemsFiltrados]
    );

    const maxDeuda = useMemo(() => obtenerMaxDeuda(itemsFiltrados), [itemsFiltrados]);

    const cursoSeleccionado = useMemo(() => {
        if (!filtroCurso) return null;
        return cursosUnicos.find(
            (curso) => String(curso.id) === String(filtroCurso)
        ) || null;
    }, [cursosUnicos, filtroCurso]);

    return {
        resumen,
        items,
        cargando,
        busqueda,
        setBusqueda,
        filtroCurso,
        setFiltroCurso,
        filtroTipo,
        setFiltroTipo,
        cursosUnicos,
        itemsFiltrados,
        totales,
        maxDeuda,
        cursoSeleccionado,
    };
}
