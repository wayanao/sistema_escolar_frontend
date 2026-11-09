import { useCallback, useState } from "react";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../../utils/periodoProfesor";
import {
    contieneAsignacion,
    primerNombreProfesor,
} from "../../utils/dashboards/profesor";

// Contexto de trabajo del profesor: la clase y el período que otros módulos
// leen del almacenamiento local. La fecha ya no se elige aquí: Asistencia
// arranca siempre en la de hoy y se cambia allí mismo.
const useContextoProfesor = () => {
    const [asignacionId, setAsignacionId] = useState(
        localStorage.getItem("asignacionId") || "",
    );
    const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());

    // Se lee una vez al montar. Leerlo (y convertirlo) en cada render impedía
    // al compilador de React conservar estables las funciones de abajo.
    const [profesor] = useState(() => {
        const profesorStorage = localStorage.getItem("profesor");
        return profesorStorage ? JSON.parse(profesorStorage) : null;
    });
    const profesorId = profesor?.id;

    const cambiarAsignacion = useCallback((valor) => {
        setAsignacionId(valor);
        localStorage.setItem("asignacionId", valor);
    }, []);

    const cambiarPeriodo = useCallback((valor) => {
        setPeriodo(valor);
        guardarPeriodoProfesor(valor);
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

    return {
        // Un hook no puede devolver JSX: informa que no hay sesión y la página
        // decide el redirect con el router, sin recargar la aplicación.
        sesionInvalida: !profesorId,
        profesorId,
        nombreProfesor: primerNombreProfesor(profesor),
        asignacionId,
        periodo,
        cambiarAsignacion,
        cambiarPeriodo,
        descartarAsignacionInvalida,
    };
};

export default useContextoProfesor;
