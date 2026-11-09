import { useMemo } from "react";
import { listarClasesProfesorAsistencia } from "../../services/asistenciaApi";
import {
    buscarClase,
    clasesParaAsistencia,
    mensajeSinClase,
    opcionesDeClase,
    resolverAsignacionAsistencia,
} from "../../utils/claseDeTrabajo";
import { NIVEL_PREESCOLAR } from "../../utils/nivelAcademico";
import useClaseDeTrabajo from "../useClaseDeTrabajo";

/**
 * Clase y período de la asistencia, elegidos en la misma pantalla.
 *
 * Es la misma elección de la planilla, salvo en preescolar: si la clase
 * guardada es una materia de un curso de preescolar, la asistencia se toma
 * con la "Asistencia diaria" de ese curso, sin que el profesor la busque.
 * Ese cambio no se guarda: al volver a la planilla sigue su materia.
 *
 * Mientras llega la lista de clases (o si no llega) se usa la clase guardada,
 * como antes; el servidor sigue rechazando una materia de preescolar al
 * guardar.
 */
export default function useClaseAsistenciaProfesor(profesorId) {
    const contexto = useClaseDeTrabajo({
        profesorId,
        listarClases: listarClasesProfesorAsistencia,
        tituloCambiosPendientes: "Tienes asistencia sin guardar",
        textoCambiosPendientes:
            "Si cambias la clase, el período o la fecha, se pierde lo que marcaste.",
    });
    const { clases, cargandoClases, errorClases, asignacionId, aviso } = contexto;

    const clasesAsistencia = useMemo(() => clasesParaAsistencia(clases), [clases]);
    const opciones = useMemo(() => opcionesDeClase(clasesAsistencia), [clasesAsistencia]);

    const listaLista = !cargandoClases && !errorClases;
    const resuelta = listaLista
        ? resolverAsignacionAsistencia(clases, asignacionId)
        : { asignacionId, cursoSinJornada: "" };
    const asignacionEfectiva = resuelta.asignacionId;
    const claseSeleccionada = buscarClase(clasesAsistencia, asignacionEfectiva);
    const esPreescolar = claseSeleccionada?.nivel === NIVEL_PREESCOLAR;

    let sinClase = null;
    if (!asignacionEfectiva && resuelta.cursoSinJornada) {
        sinClase = {
            titulo: "Este curso toma asistencia con «Asistencia diaria»",
            texto:
                `En preescolar, la asistencia de ${resuelta.cursoSinJornada} se toma una vez al día `
                + "con la clase «Asistencia diaria», y esa clase no está a tu nombre. "
                + "Si te corresponde, pídela a coordinación.",
        };
    } else if (!asignacionEfectiva) {
        sinClase = mensajeSinClase({
            cargando: cargandoClases,
            error: errorClases,
            aviso,
            hayOpciones: opciones.length > 0,
            sinOpciones: {
                titulo: "No tienes clases para tomar asistencia",
                texto: "Si te falta alguna, pídela a coordinación.",
            },
            elegir: {
                titulo: "Elige arriba la clase",
                texto: "Cuando la elijas, aquí aparece la lista para tomar asistencia.",
            },
        });
    }

    return {
        ...contexto,
        opciones,
        asignacionEfectiva,
        claseSeleccionada,
        esPreescolar,
        sinClase,
    };
}
