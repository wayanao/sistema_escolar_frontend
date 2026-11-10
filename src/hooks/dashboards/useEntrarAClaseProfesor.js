import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CLAVE_ASIGNACION_PROFESOR } from "../../utils/claseDeTrabajo";

export const RUTA_ASISTENCIA = "/asistencia";
export const RUTA_PLANILLA = "/planilla";

// Entrar a una clase desde el horario del panel: la deja elegida (la misma
// clave que leen Planilla, Asistencia y las demás pantallas) y abre la
// pantalla pedida, que llega con esa clase ya puesta.
export default function useEntrarAClaseProfesor() {
    const navigate = useNavigate();

    return useCallback((clase, ruta) => {
        localStorage.setItem(CLAVE_ASIGNACION_PROFESOR, String(clase.id));
        navigate(ruta);
    }, [navigate]);
}
