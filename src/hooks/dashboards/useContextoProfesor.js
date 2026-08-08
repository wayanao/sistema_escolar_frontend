import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../../utils/periodoProfesor";
import {
    MENSAJE_RANKING_SIN_CLASE,
    contieneAsignacion,
    primerNombreProfesor,
} from "../../utils/dashboards/profesor";

// Contexto de trabajo del profesor: la clase, el período y la fecha que otros
// módulos leen del almacenamiento local. `fechaAsistencia` es la misma clave que
// usa Asistencia.
const useContextoProfesor = () => {
    const [asignacionId, setAsignacionId] = useState(
        localStorage.getItem("asignacionId") || "",
    );
    const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
    const [fecha, setFecha] = useState(localStorage.getItem("fechaAsistencia") || "");

    const profesorStorage = localStorage.getItem("profesor");
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    const profesorId = profesor?.id;

    useEffect(() => {
        if (!profesorId) {
            window.location.href = "/login";
        }
    }, [profesorId]);

    const cambiarAsignacion = useCallback((valor) => {
        setAsignacionId(valor);
        localStorage.setItem("asignacionId", valor);
    }, []);

    const cambiarPeriodo = useCallback((valor) => {
        setPeriodo(valor);
        guardarPeriodoProfesor(valor);
    }, []);

    const cambiarFecha = useCallback((valor) => {
        setFecha(valor);
        localStorage.setItem("fechaAsistencia", valor);
    }, []);

    // La clase guardada que ya no está asignada se descarta. Se compara contra
    // el almacenamiento y no contra el estado, igual que antes.
    const descartarAsignacionInvalida = useCallback((clases) => {
        const asignacionGuardada = localStorage.getItem("asignacionId") || "";
        if (asignacionGuardada && !contieneAsignacion(clases, asignacionGuardada)) {
            localStorage.removeItem("asignacionId");
            setAsignacionId("");
        }
    }, []);

    // Los rankings exigen una clase elegida. Avisa y responde si se puede seguir.
    // El aviso no se espera: quien llama necesita la respuesta de inmediato para
    // decidir si navega.
    const exigirClaseElegida = useCallback(() => {
        if (asignacionId) return true;
        Swal.fire({
            icon: "warning",
            title: "Elige una clase",
            text: MENSAJE_RANKING_SIN_CLASE,
            confirmButtonColor: "#059669",
        });
        return false;
    }, [asignacionId]);

    return {
        profesorId,
        nombreProfesor: primerNombreProfesor(profesor),
        asignacionId,
        periodo,
        fecha,
        cambiarAsignacion,
        cambiarPeriodo,
        cambiarFecha,
        descartarAsignacionInvalida,
        exigirClaseElegida,
    };
};

export default useContextoProfesor;
