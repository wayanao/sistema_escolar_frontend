import { obtenerClasesProfesor } from "../../services/dashboardsApi";
import useClaseDeMateria from "../useClaseDeMateria";

// Los rankings solo leen: no hay cambios sin guardar que preguntar.
const TEXTOS = {
    sinOpciones: {
        titulo: "No tienes clases con notas",
        texto: "Si te falta alguna, pídela a coordinación.",
    },
    elegir: {
        titulo: "Elige arriba la clase",
        texto: "Cuando la elijas, aquí aparece su ranking del período.",
    },
};

/**
 * Clase y período de los rankings, elegidos en la misma pantalla (antes se
 * leían del panel y, sin clase, una alerta devolvía al panel).
 */
export default function useClaseRankingProfesor(profesorId) {
    return useClaseDeMateria({
        profesorId,
        listarClases: obtenerClasesProfesor,
        textos: TEXTOS,
    });
}
