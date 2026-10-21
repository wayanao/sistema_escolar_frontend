import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
    obtenerPrestamos,
    obtenerProfesoresParaPrestamos,
} from "../../services/nominaEgresosPrestamosApi";
import {
    construirParametrosPrestamos,
    normalizarListaPrestamos,
    totalPrestamosPendientes,
} from "../../utils/nominaEgresosPrestamos/prestamos";

const usePrestamos = () => {
    const [prestamos, setPrestamos] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [loadingProfesores, setLoadingProfesores] = useState(true);
    const [loadingPrestamos, setLoadingPrestamos] = useState(false);
    const [actualizando, setActualizando] = useState(false);
    const [historialConsultado, setHistorialConsultado] = useState(false);
    const [error, setError] = useState(null);
    // Qué falló por última vez, para que Reintentar pida eso mismo.
    const [origenError, setOrigenError] = useState(null);
    const [profesorFiltro, setProfesorFiltro] = useState("");
    // De quién es la lista que se ve: recargarla no la esconde, solo avisa
    // que actualiza; la de otra persona sí muestra la carga.
    const profesorMostrado = useRef(null);

    const cargarProfesores = useCallback(async () => {
        try {
            setLoadingProfesores(true);
            setError(null);
            setOrigenError(null);
            const datosProfesores = await obtenerProfesoresParaPrestamos();
            setProfesores(datosProfesores);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los profesores o trabajadores.");
            setOrigenError("profesores");
        } finally {
            setLoadingProfesores(false);
        }
    }, []);

    // Sin profesor elegido no se consulta el backend: el historial vuelve a su
    // estado inicial.
    const cargarPrestamos = useCallback(async (filtroProfesor) => {
        if (!filtroProfesor) {
            setPrestamos([]);
            setHistorialConsultado(false);
            profesorMostrado.current = null;
            return;
        }

        const mismaPersona = profesorMostrado.current === String(filtroProfesor);
        try {
            if (mismaPersona) {
                setActualizando(true);
            } else {
                setLoadingPrestamos(true);
            }
            setError(null);
            setOrigenError(null);
            setHistorialConsultado(true);
            const datosPrestamos = await obtenerPrestamos(
                construirParametrosPrestamos(filtroProfesor)
            );
            setPrestamos(normalizarListaPrestamos(datosPrestamos));
            profesorMostrado.current = String(filtroProfesor);
        } catch (err) {
            console.error(err);
            setError("Error al cargar el historial de préstamos.");
            setOrigenError("historial");
        } finally {
            setLoadingPrestamos(false);
            setActualizando(false);
        }
    }, []);

    useEffect(() => {
        cargarProfesores();
    }, [cargarProfesores]);

    const mostrarHistorialDe = useCallback(
        (profesorId) => {
            setProfesorFiltro(profesorId);
            return cargarPrestamos(profesorId);
        },
        [cargarPrestamos]
    );

    const limpiarFiltro = useCallback(
        () => mostrarHistorialDe(""),
        [mostrarHistorialDe]
    );

    const buscarHistorial = useCallback(() => {
        if (!profesorFiltro) {
            Swal.fire({
                icon: "warning",
                title: "Falta elegir a la persona",
                text: "Selecciona un profesor o trabajador para ver su historial.",
            });
            return;
        }
        cargarPrestamos(profesorFiltro);
    }, [cargarPrestamos, profesorFiltro]);

    const recargarHistorial = useCallback(
        () => cargarPrestamos(profesorFiltro),
        [cargarPrestamos, profesorFiltro]
    );

    const reintentar = useCallback(
        () => (origenError === "profesores" ? cargarProfesores() : recargarHistorial()),
        [origenError, cargarProfesores, recargarHistorial]
    );

    return {
        prestamos,
        totalPendiente: totalPrestamosPendientes(prestamos),
        profesores,
        loadingProfesores,
        loadingPrestamos,
        actualizando,
        historialConsultado,
        error,
        profesorFiltro,
        mostrarHistorialDe,
        limpiarFiltro,
        buscarHistorial,
        recargarHistorial,
        reintentar,
    };
};

export default usePrestamos;
