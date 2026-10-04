import { useCallback, useEffect, useMemo, useState } from "react";
import {
    obtenerDetalleCarteraVencida,
    obtenerResumenCarteraVencida,
} from "../../services/carteraTiposPagoApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import {
    calcularTotalesCarteraVisible,
    filtrarCartera,
    obtenerCursosUnicos,
    obtenerMaxDeuda,
} from "../../utils/carteraTiposPago/cartera";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
export default function useCarteraVencida({ parametrosAnio } = {}) {
    const [resumen, setResumen] = useState(null);
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroCurso, setFiltroCurso] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    // Sube con cada `recargar`: vuelve a pedir la cartera del mismo año sin
    // recargar la página, que volvería al año activo.
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        // Si se recarga o cambia el año antes de que llegue la respuesta, la
        // vieja no pisa a la nueva.
        let vigente = true;

        const cargar = async () => {
            setCargando(true);
            try {
                const opciones = opcionesConAnio({}, parametrosAnio);
                const [resumenCartera, listaCartera] = await Promise.all([
                    obtenerResumenCarteraVencida(opciones),
                    obtenerDetalleCarteraVencida(opciones),
                ]);
                if (!vigente) return;
                setResumen(resumenCartera);
                setItems(listaCartera || []);
            } catch (error) {
                if (vigente) console.error("Error cargando cartera vencida:", error);
            } finally {
                if (vigente) setCargando(false);
            }
        };
        cargar();

        return () => {
            vigente = false;
        };
    }, [parametrosAnio, recargas]);

    const recargar = useCallback(() => setRecargas((anterior) => anterior + 1), []);

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
        recargar,
    };
}
