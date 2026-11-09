import { obtenerAsignacionesProfesor } from "../../services/mallaCurricularApi";
import useClaseDeMateria from "../useClaseDeMateria";

const TEXTOS = {
    tituloCambiosPendientes: "Tienes cambios sin guardar",
    textoCambiosPendientes:
        "Si cambias la clase o el período, se pierde lo que escribiste en el planeador.",
    sinOpciones: {
        titulo: "No tienes clases para planear",
        texto: "Si te falta alguna, pídela a coordinación.",
    },
    elegir: {
        titulo: "Elige arriba la clase que vas a planear",
        texto: "Cuando la elijas, aquí aparece su planeador del período.",
    },
};

/**
 * Clase y período del planeador anual, elegidos en la misma pantalla (antes
 * se leían del panel). La «Asistencia diaria» de preescolar no se planea: no
 * se ofrece.
 */
export default function useClasePlaneadorProfesor(profesorId) {
    return useClaseDeMateria({
        profesorId,
        listarClases: obtenerAsignacionesProfesor,
        textos: TEXTOS,
    });
}
