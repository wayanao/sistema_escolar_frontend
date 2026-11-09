import { useMemo } from "react";
import { listarClasesProfesorPlanilla } from "../../services/planillaApi";
import {
    asignacionParaPlanilla,
    buscarClase,
    clasesParaPlanilla,
    mensajeSinClase,
    opcionesDeClase,
} from "../../utils/claseDeTrabajo";
import useClaseDeTrabajo from "../useClaseDeTrabajo";

/**
 * Clase y período de la planilla, elegidos en la misma pantalla.
 *
 * Mientras llega la lista de clases (o si no llega) se usa la clase guardada,
 * como antes: la planilla carga a la vez que la lista, sin esperarla. Con la
 * lista ya cargada, la clase guardada solo sirve si se califica: la
 * "Asistencia diaria" de preescolar no lleva notas.
 */
export default function useClasePlanillaProfesor(profesorId) {
    const contexto = useClaseDeTrabajo({
        profesorId,
        listarClases: listarClasesProfesorPlanilla,
        tituloCambiosPendientes: "Hay notas sin guardar",
        textoCambiosPendientes:
            "Algunas notas no se pudieron guardar. Si cambias la clase o el período, se pierden.",
    });
    const { clases, cargandoClases, errorClases, asignacionId, aviso } = contexto;

    const clasesPlanilla = useMemo(() => clasesParaPlanilla(clases), [clases]);
    const opciones = useMemo(() => opcionesDeClase(clasesPlanilla), [clasesPlanilla]);

    const listaLista = !cargandoClases && !errorClases;
    const asignacionEfectiva = listaLista
        ? asignacionParaPlanilla(clases, asignacionId)
        : asignacionId;
    const claseSeleccionada = buscarClase(clasesPlanilla, asignacionEfectiva);

    const sinClase = asignacionEfectiva
        ? null
        : mensajeSinClase({
            cargando: cargandoClases,
            error: errorClases,
            aviso,
            hayOpciones: opciones.length > 0,
            sinOpciones: {
                titulo: "No tienes clases para calificar",
                texto: "Si te falta alguna, pídela a coordinación.",
            },
            elegir: {
                titulo: "Elige arriba la clase que vas a calificar",
                texto: "Cuando la elijas, aquí aparecen tus estudiantes y sus notas.",
            },
        });

    return {
        ...contexto,
        opciones,
        asignacionEfectiva,
        claseSeleccionada,
        sinClase,
    };
}
