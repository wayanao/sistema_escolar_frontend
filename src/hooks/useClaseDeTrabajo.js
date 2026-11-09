import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../constants/colores";
import { CLAVE_ASIGNACION_PROFESOR } from "../utils/claseDeTrabajo";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../utils/periodoProfesor";

export const MENSAJE_ERROR_CLASES_TRABAJO =
    "No se pudieron cargar tus clases. Revisa la conexión e intenta de nuevo.";

export const MENSAJE_CLASE_NO_DISPONIBLE =
    "La clase que tenías elegida ya no está asignada a ti. Elige otra arriba.";

const leerAsignacionGuardada = () => localStorage.getItem(CLAVE_ASIGNACION_PROFESOR) || "";

/**
 * La clase y el período con los que trabaja el profesor, elegidos dentro de
 * la propia pantalla (Planilla, Asistencia). Los dos se recuerdan en las
 * mismas claves que ya usaban el panel y los demás módulos, así que lo que se
 * elige en una pantalla aparece elegido en la otra.
 *
 * `listarClases(profesorId, { signal })` es la función del servicio del
 * módulo que usa el hook: el transporte sigue en cada módulo.
 *
 * Si la pantalla tiene cambios sin guardar (lo informa con
 * `informarCambiosPendientes`), cambiar la clase o el período pregunta antes.
 */
export default function useClaseDeTrabajo({
    profesorId,
    listarClases,
    tituloCambiosPendientes = "Hay cambios sin guardar",
    textoCambiosPendientes = "Si cambias la clase o el período, se pierden.",
}) {
    const [asignacionId, setAsignacionId] = useState(leerAsignacionGuardada);
    const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
    const [aviso, setAviso] = useState("");
    const [intento, setIntento] = useState(0);
    // `clave` dice para qué carga es el resultado: mientras no coincida con
    // la vigente, la lista está cargando.
    const [carga, setCarga] = useState({ clave: null, clases: [], error: "" });
    const listarClasesRef = useRef(listarClases);
    const cambiosPendientesRef = useRef(false);

    useEffect(() => {
        listarClasesRef.current = listarClases;
    }, [listarClases]);

    const claveCarga = profesorId ? `${profesorId}|${intento}` : null;

    useEffect(() => {
        if (!claveCarga) return undefined;

        const controller = new AbortController();
        Promise.resolve()
            .then(() => listarClasesRef.current(profesorId, { signal: controller.signal }))
            .then((data) => {
                if (controller.signal.aborted) return;
                setCarga({ clave: claveCarga, clases: Array.isArray(data) ? data : [], error: "" });
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                console.error("Error cargando clases", error);
                setCarga({ clave: claveCarga, clases: [], error: MENSAJE_ERROR_CLASES_TRABAJO });
            });

        return () => controller.abort();
    }, [claveCarga, profesorId]);

    const cargandoClases = Boolean(claveCarga) && carga.clave !== claveCarga;

    const informarCambiosPendientes = useCallback((hay) => {
        cambiosPendientesRef.current = Boolean(hay);
    }, []);

    // Pregunta solo si hay algo sin guardar. El botón lleno es quedarse.
    const confirmarCambio = useCallback(async () => {
        if (!cambiosPendientesRef.current) return true;

        const resultado = await Swal.fire({
            icon: "warning",
            title: tituloCambiosPendientes,
            text: textoCambiosPendientes,
            showCancelButton: true,
            confirmButtonText: "Cambiar sin guardar",
            cancelButtonText: "Seguir aquí",
            confirmButtonColor: "#64748b",
            cancelButtonColor: MORADO_BOTON,
            reverseButtons: true,
            focusCancel: true,
        });
        return Boolean(resultado?.isConfirmed);
    }, [textoCambiosPendientes, tituloCambiosPendientes]);

    const cambiarAsignacion = useCallback(async (valor) => {
        if (!(await confirmarCambio())) return false;

        const siguiente = String(valor || "");
        setAsignacionId(siguiente);
        setAviso("");
        if (siguiente) localStorage.setItem(CLAVE_ASIGNACION_PROFESOR, siguiente);
        else localStorage.removeItem(CLAVE_ASIGNACION_PROFESOR);
        return true;
    }, [confirmarCambio]);

    const cambiarPeriodo = useCallback(async (valor) => {
        if (!(await confirmarCambio())) return false;

        setPeriodo(guardarPeriodoProfesor(valor));
        return true;
    }, [confirmarCambio]);

    // El servidor dijo que la clase ya no es del profesor: se olvida sin
    // preguntar y la pantalla explica por qué quedó sin clase.
    const descartarAsignacion = useCallback((motivo = MENSAJE_CLASE_NO_DISPONIBLE) => {
        setAsignacionId("");
        setAviso(motivo);
        localStorage.removeItem(CLAVE_ASIGNACION_PROFESOR);
    }, []);

    const reintentarClases = useCallback(() => setIntento((actual) => actual + 1), []);

    return {
        clases: carga.clases,
        cargandoClases,
        errorClases: cargandoClases ? "" : carga.error,
        reintentarClases,
        asignacionId,
        cambiarAsignacion,
        descartarAsignacion,
        aviso,
        periodo,
        cambiarPeriodo,
        confirmarCambio,
        informarCambiosPendientes,
    };
}
