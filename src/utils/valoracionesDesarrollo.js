/**
 * Contratos puros de la escala de desarrollo infantil.
 *
 * Traducen entre caritas y números en las dos direcciones:
 *
 * - al guardar, un conjunto de caritas produce el promedio numérico que se
 *   envía como `definitiva`, de modo que el estudiante entre en el puesto del
 *   curso igual que en una materia numérica;
 * - al mostrar, ese promedio vuelve a ser una carita, porque el boletín de
 *   desarrollo nunca exhibe números.
 *
 * Ambas equivalencias se derivan de `VALORACIONES_DESARROLLO`: cambiar allí un
 * `valor` mueve la escala completa sin tocar este archivo.
 *
 * Sin HTTP, sin React y sin DOM.
 */
import { VALORACIONES_DESARROLLO } from "../constants/valoracionesDesarrollo";

/** Opción de la escala cuyo código coincide, o `null` si no existe. */
export const obtenerValoracion = (valoracion) =>
    VALORACIONES_DESARROLLO.find((opcion) => opcion.value === valoracion) || null;

/** Equivalencia numérica de una carita, o `null` si el código no pertenece a la escala. */
export const valorDeValoracion = (valoracion) =>
    obtenerValoracion(valoracion)?.valor ?? null;

/**
 * Promedio numérico de un conjunto de caritas.
 *
 * Ignora los códigos vacíos o desconocidos en vez de contarlos como cero: una
 * casilla sin calificar no puede bajar el promedio. Devuelve `null` cuando no
 * queda ninguna carita válida, que es lo que distingue "sin calificar" de un
 * promedio real.
 */
export const promedioDeValoraciones = (valoraciones) => {
    const valores = (valoraciones || [])
        .map(valorDeValoracion)
        .filter((valor) => valor !== null);

    if (valores.length === 0) return null;

    const suma = valores.reduce((total, valor) => total + valor, 0);
    return suma / valores.length;
};

/**
 * Carita que corresponde a un promedio numérico.
 *
 * Elige la opción cuyo `valor` esté más cerca del promedio; ante un empate gana
 * la más alta, porque la escala se recorre en orden descendente. Así 4.33 es
 * "Logrado" y 4.5 es "Destacado".
 *
 * Devuelve `null` si el promedio no es un número, para que quien muestre pueda
 * distinguir "sin calificar" de una valoración baja.
 */
export const valoracionDesdePromedio = (promedio) => {
    const numero = Number(promedio);
    if (promedio === null || promedio === undefined || Number.isNaN(numero)) {
        return null;
    }

    return VALORACIONES_DESARROLLO.reduce((masCercana, opcion) =>
        Math.abs(opcion.valor - numero) < Math.abs(masCercana.valor - numero)
            ? opcion
            : masCercana,
    );
};

/** `true` si alguna de las evaluaciones recibidas es de desarrollo. */
export const esEvaluacionDesarrollo = (evaluaciones) =>
    (evaluaciones || []).some(
        (evaluacion) => evaluacion?.tipo_evaluacion === "desarrollo",
    );
