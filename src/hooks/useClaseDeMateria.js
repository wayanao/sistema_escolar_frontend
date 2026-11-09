import { useMemo } from "react";
import {
    asignacionDeMateria,
    buscarClase,
    clasesDeMateria,
    mensajeSinClase,
    opcionesDeClase,
} from "../utils/claseDeTrabajo";
import useClaseDeTrabajo from "./useClaseDeTrabajo";

/**
 * Clase y período de una pantalla que trabaja con materias reales (Planilla,
 * Planeador anual, rankings): ofrece todas las clases menos la «Asistencia
 * diaria» de preescolar.
 *
 * Mientras llega la lista de clases (o si no llega) se usa la clase guardada,
 * como antes: la pantalla carga a la vez que la lista, sin esperarla. Con la
 * lista ya cargada, la clase guardada solo sirve si es de una materia.
 *
 * `textos` trae lo propio de cada pantalla: la pregunta por cambios sin
 * guardar (`tituloCambiosPendientes`, `textoCambiosPendientes`) y qué decir
 * sin clases (`sinOpciones`) o sin elegir (`elegir`).
 */
export default function useClaseDeMateria({ profesorId, listarClases, textos }) {
    const contexto = useClaseDeTrabajo({
        profesorId,
        listarClases,
        tituloCambiosPendientes: textos.tituloCambiosPendientes,
        textoCambiosPendientes: textos.textoCambiosPendientes,
    });
    const { clases, cargandoClases, errorClases, asignacionId, aviso } = contexto;

    const clasesMateria = useMemo(() => clasesDeMateria(clases), [clases]);
    const opciones = useMemo(() => opcionesDeClase(clasesMateria), [clasesMateria]);

    const listaLista = !cargandoClases && !errorClases;
    const asignacionEfectiva = listaLista
        ? asignacionDeMateria(clases, asignacionId)
        : asignacionId;
    const claseSeleccionada = buscarClase(clasesMateria, asignacionEfectiva);

    const sinClase = asignacionEfectiva
        ? null
        : mensajeSinClase({
            cargando: cargandoClases,
            error: errorClases,
            aviso,
            hayOpciones: opciones.length > 0,
            sinOpciones: textos.sinOpciones,
            elegir: textos.elegir,
        });

    return {
        ...contexto,
        opciones,
        asignacionEfectiva,
        claseSeleccionada,
        sinClase,
    };
}
