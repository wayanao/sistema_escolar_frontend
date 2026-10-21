import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// De qué año son los datos que se ven: el activo no lleva parámetros.
const claveDelAnio = (parametrosAnio) => parametrosAnio?.anio_lectivo_id ?? "activo";
const SIN_DATOS = Symbol("sin datos");

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
export default function useCarteraVencida({ parametrosAnio } = {}) {
    const [resumen, setResumen] = useState(null);
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    // Recargando el mismo año: los datos se quedan a la vista mientras llegan.
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState(null);
    const [hayDatos, setHayDatos] = useState(false);
    const [actualizadoA, setActualizadoA] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [filtroCurso, setFiltroCurso] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    // Sube con cada `recargar`: vuelve a pedir la cartera del mismo año sin
    // recargar la página, que volvería al año activo.
    const [recargas, setRecargas] = useState(0);
    const anioDeLosDatos = useRef(SIN_DATOS);

    useEffect(() => {
        // Si se recarga o cambia el año antes de que llegue la respuesta, la
        // vieja no pisa a la nueva.
        let vigente = true;
        const anio = claveDelAnio(parametrosAnio);
        const mismoAnio = anioDeLosDatos.current === anio;

        const cargar = async () => {
            if (mismoAnio) {
                setActualizando(true);
            } else {
                // Otro año: no se deja a la vista la cartera del anterior.
                setCargando(true);
                setResumen(null);
                setItems([]);
                setHayDatos(false);
            }
            setError(null);
            try {
                const opciones = opcionesConAnio({}, parametrosAnio);
                const [resumenCartera, listaCartera] = await Promise.all([
                    obtenerResumenCarteraVencida(opciones),
                    obtenerDetalleCarteraVencida(opciones),
                ]);
                if (!vigente) return;
                setResumen(resumenCartera);
                setItems(listaCartera || []);
                setHayDatos(true);
                setActualizadoA(new Date());
                anioDeLosDatos.current = anio;
            } catch (errorCarga) {
                if (!vigente) return;
                console.error("Error cargando cartera vencida:", errorCarga);
                setError("No se pudo cargar la cartera vencida.");
            } finally {
                if (vigente) {
                    setCargando(false);
                    setActualizando(false);
                }
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
        actualizando,
        error,
        hayDatos,
        actualizadoA,
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
