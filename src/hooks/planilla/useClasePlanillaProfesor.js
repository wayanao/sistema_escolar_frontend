import { listarClasesProfesorPlanilla } from "../../services/planillaApi";
import useClaseDeMateria from "../useClaseDeMateria";

const TEXTOS = {
    tituloCambiosPendientes: "Hay notas sin guardar",
    textoCambiosPendientes:
        "Algunas notas no se pudieron guardar. Si cambias la clase o el período, se pierden.",
    sinOpciones: {
        titulo: "No tienes clases para calificar",
        texto: "Si te falta alguna, pídela a coordinación.",
    },
    elegir: {
        titulo: "Elige arriba la clase que vas a calificar",
        texto: "Cuando la elijas, aquí aparecen tus estudiantes y sus notas.",
    },
};

/**
 * Clase y período de la planilla, elegidos en la misma pantalla. La
 * «Asistencia diaria» de preescolar no lleva notas: no se ofrece.
 */
export default function useClasePlanillaProfesor(profesorId) {
    return useClaseDeMateria({
        profesorId,
        listarClases: listarClasesProfesorPlanilla,
        textos: TEXTOS,
    });
}
