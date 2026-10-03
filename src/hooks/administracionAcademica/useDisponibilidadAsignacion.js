import { useEffect, useState } from "react";
import { obtenerDisponibilidadProfesor } from "../../services/asignacionesApi";
import { construirParametrosDisponibilidad } from "../../utils/administracionAcademica/asignaciones";
import { opcionesConAnio } from "../../utils/anioLectivo";

// `parametrosAnio`: el año que mira el admin. La disponibilidad cuenta solo
// las clases del profesor en ese año.
export default function useDisponibilidadAsignacion({
    profesorId,
    dia,
    editandoId,
    parametrosAnio,
}) {
    const [disponibilidad, setDisponibilidad] = useState(null);
    const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

    useEffect(() => {
        if (!profesorId || !dia) {
            setDisponibilidad(null);
            setCargandoDisponibilidad(false);
            return undefined;
        }

        const controller = new AbortController();

        const cargarDisponibilidad = async () => {
            setCargandoDisponibilidad(true);
            try {
                const params = construirParametrosDisponibilidad(dia, editandoId);
                const data = await obtenerDisponibilidadProfesor(
                    profesorId,
                    params,
                    opcionesConAnio({ signal: controller.signal }, parametrosAnio),
                );
                if (!controller.signal.aborted) setDisponibilidad(data);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Error cargando disponibilidad del profesor", error);
                setDisponibilidad(null);
            } finally {
                if (!controller.signal.aborted) setCargandoDisponibilidad(false);
            }
        };

        void cargarDisponibilidad();
        return () => controller.abort();
    }, [profesorId, dia, editandoId, parametrosAnio]);

    return { disponibilidad, cargandoDisponibilidad };
}
