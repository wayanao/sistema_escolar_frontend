/**
 * Contratos puros de las subnotas de la planilla.
 *
 * Ver `docs/funcionalidades/SUBNOTAS_PLANILLA.md` (P1 a P12). Aquí viven la
 * vista previa del promedio del modal, cuándo una celda es calculada, los
 * cuerpos que se envían y cómo se actualiza la planilla con lo que responde el
 * servidor sin pedirla entera otra vez.
 *
 * **El promedio que queda guardado lo calcula el backend**
 * (`app/core/subnotas_planilla.py`). Este módulo repite la misma fórmula solo
 * para que el profesor vea el resultado mientras escribe: dos decimales, mitad
 * hacia arriba, calculado en centésimas enteras para no depender de cómo
 * redondea un número con decimales.
 *
 * Las subnotas llegan del servidor como `subnotas` por tipo (`{ id, nombre }`)
 * y, en cada estudiante, como `subnotas` con claves de texto
 * (`{ "<subnota_id>": valor }`). Aquí los ids se comparan siempre como texto.
 *
 * Sin HTTP, sin React y sin DOM.
 */
import {
    obtenerValoracion,
    promedioDeValoraciones,
    valoracionDesdePromedio,
} from "../valoracionesDesarrollo";
import { calcularPromedioEstudiante } from "./notas";

/** P11, espejo del backend: hasta 20 subnotas por tipo de nota. */
export const MAXIMO_SUBNOTAS_POR_TIPO = 20;

/** Largo máximo del nombre, el `varchar(60)` de `planilla_subnotas`. */
export const LARGO_MAXIMO_NOMBRE_SUBNOTA = 60;

export const MENSAJE_NOTA_INVALIDA = "Cada subnota debe ser un número entre 1 y 5.";
export const MENSAJE_NOMBRE_VACIO = "Escribe el nombre de la subnota.";
export const MENSAJE_NOMBRE_LARGO = `El nombre admite hasta ${LARGO_MAXIMO_NOMBRE_SUBNOTA} caracteres.`;
export const MENSAJE_NOMBRE_REPETIDO = "Ya existe una subnota con ese nombre en este tipo de nota.";
export const MENSAJE_LIMITE_SUBNOTAS = `Un tipo de nota admite hasta ${MAXIMO_SUBNOTAS_POR_TIPO} subnotas.`;

const claveDeNombre = (texto) => String(texto ?? "").trim().toLowerCase();

const tieneValor = (valor) =>
    valor !== null && valor !== undefined && String(valor).trim() !== "";

// ---------------------------------------------------------------------------
// Lo que llega del servidor
// ---------------------------------------------------------------------------

/**
 * Subnotas por tipo, solo de las columnas que se ven.
 *
 * El servidor ya usa el nombre exacto de cada columna. Una subnota de una
 * columna oculta (o una respuesta sin `subnotas`, como la de un servidor
 * viejo) simplemente no aparece.
 */
export const normalizarSubnotasPorTipo = (subnotas, columnasVisibles) => {
    const fuente = subnotas && typeof subnotas === "object" ? subnotas : {};
    return (Array.isArray(columnasVisibles) ? columnasVisibles : []).reduce(
        (acumulado, columna) => {
            const lista = Array.isArray(fuente[columna]) ? fuente[columna] : [];
            if (lista.length > 0) {
                acumulado[columna] = lista.map(({ id, nombre }) => ({ id, nombre }));
            }
            return acumulado;
        },
        {},
    );
};

/** Las subnotas de un tipo, o una lista vacía. */
export const subnotasDelTipo = (subnotasPorTipo, tipo) =>
    (subnotasPorTipo && subnotasPorTipo[tipo]) || [];

/** Lo que el estudiante tiene calificado en las subnotas de ese tipo. */
export const calificacionesDelTipo = (estudiante, subnotas) => {
    const suyas = estudiante?.subnotas || {};
    return (subnotas || []).reduce((acumulado, { id }) => {
        const clave = String(id);
        if (tieneValor(suyas[clave])) acumulado[clave] = suyas[clave];
        return acumulado;
    }, {});
};

export const contarCalificadas = (estudiante, subnotas) =>
    Object.keys(calificacionesDelTipo(estudiante, subnotas)).length;

/**
 * P1: la celda es calculada si el estudiante tiene al menos una subnota
 * calificada en ese tipo. Entonces no se escribe a mano.
 */
export const esCeldaCalculada = (estudiante, subnotas) =>
    contarCalificadas(estudiante, subnotas) > 0;

/** P3: la celda tiene una nota escrita a mano (sin subnotas que la expliquen). */
export const tieneNotaAMano = (estudiante, tipo, subnotas) =>
    !esCeldaCalculada(estudiante, subnotas)
    && (tieneValor(estudiante?.notas?.[tipo]) || tieneValor(estudiante?.valoraciones?.[tipo]));

/**
 * Lo que muestra una celda calculada: el promedio con dos decimales, o "—" si
 * no hay nada que mostrar. En preescolar la celda muestra la carita, no esto.
 */
export const formatearNotaCalculada = (valor) => {
    const numero = Number(valor);
    return tieneValor(valor) && Number.isFinite(numero) ? numero.toFixed(2) : "—";
};

/** Cuántos estudiantes perderían su calificación si se borra la subnota (P5). */
export const contarCalificacionesDeSubnota = (estudiantes, subnotaId) => {
    const clave = String(subnotaId);
    return (estudiantes || []).filter((est) => tieneValor(est?.subnotas?.[clave])).length;
};

// ---------------------------------------------------------------------------
// Notas y promedio (P2, P7, P8)
// ---------------------------------------------------------------------------

/**
 * La nota escrita, en centésimas enteras y redondeada mitad hacia arriba.
 *
 * Se lee del texto, cifra por cifra: "4.155" son 416 centésimas, como
 * `Decimal("4.155")` en el backend. Con `Math.round(4.155 * 100)` saldría 415,
 * porque 4.155 no se puede guardar exacto como número con decimales. Acepta
 * coma decimal. Devuelve `null` si no es un número escrito normal.
 */
export const aCentesimas = (valor) => {
    const texto = String(valor ?? "").trim().replace(",", ".");
    const partes = /^(\d+)(?:\.(\d*))?$/.exec(texto);
    if (!partes) return null;

    const [, entero, decimales = ""] = partes;
    let centesimas = Number(entero) * 100 + Number((decimales + "00").slice(0, 2));
    if (decimales.length > 2 && Number(decimales[2]) >= 5) centesimas += 1;
    return centesimas;
};

/**
 * Cómo quedaría una nota escrita en una subnota.
 *
 * - `{ vacia: true }`: la casilla está vacía; la subnota no cuenta (P2).
 * - `{ centesimas }`: una nota válida, de 1 a 5, ya con dos decimales.
 * - `{ invalida: true }`: no es un número de 1 a 5. Igual que el backend, el
 *   rango se mira sobre lo escrito, antes de redondear: 0.995 no vale.
 */
export const leerNotaDeSubnota = (valor) => {
    if (!tieneValor(valor)) return { vacia: true };

    const texto = String(valor).trim().replace(",", ".");
    const centesimas = aCentesimas(texto);
    const numero = Number(texto);
    if (centesimas === null || !Number.isFinite(numero) || numero < 1 || numero > 5) {
        return { invalida: true };
    }
    return { centesimas };
};

/**
 * Promedio de centésimas, en dos decimales y mitad hacia arriba, o `null`.
 *
 * 410 y 415 dan 412.5, que queda en 413: 4.13. Es la misma cuenta del
 * backend, toda en enteros.
 */
export const promedioDeCentesimas = (centesimas) => {
    const lista = (centesimas || []).filter(Number.isInteger);
    if (lista.length === 0) return null;
    const total = lista.reduce((suma, valor) => suma + valor, 0);
    const redondeado = Math.floor((2 * total + lista.length) / (2 * lista.length));
    return redondeado / 100;
};

/**
 * Vista previa de la celda a partir de lo que hay escrito en el modal.
 *
 * Numérica: `{ nota }` con dos decimales, o `null` si no hay nada que
 * promediar. Las casillas vacías o mal escritas no cuentan (el modal marca
 * las mal escritas aparte). Desarrollo: `{ valoracion }` con la opción de la
 * escala (P8), o `null`.
 */
export const vistaPreviaDeCelda = (valores, tipoEvaluacion) => {
    const lista = Object.values(valores || {});

    if (tipoEvaluacion === "desarrollo") {
        const opcion = valoracionDesdePromedio(promedioDeValoraciones(lista));
        return opcion ? { valoracion: opcion } : null;
    }

    const nota = promedioDeCentesimas(
        lista.map((valor) => leerNotaDeSubnota(valor).centesimas),
    );
    return nota === null ? null : { nota };
};

// ---------------------------------------------------------------------------
// Lo que escribe el profesor en el modal
// ---------------------------------------------------------------------------

/** Lo que ya tiene el estudiante, como texto para las casillas del modal. */
export const borradorInicial = (estudiante, subnotas) => {
    const calificadas = calificacionesDelTipo(estudiante, subnotas);
    return (subnotas || []).reduce((acumulado, { id }) => {
        const clave = String(id);
        acumulado[clave] = tieneValor(calificadas[clave]) ? String(calificadas[clave]) : "";
        return acumulado;
    }, {});
};

/** Ids de las casillas con una nota mal escrita (solo en numérica). */
export const casillasInvalidas = (borrador, tipoEvaluacion) => {
    if (tipoEvaluacion === "desarrollo") return [];
    return Object.entries(borrador || {})
        .filter(([, valor]) => leerNotaDeSubnota(valor).invalida)
        .map(([clave]) => clave);
};

const mismoValor = (antes, ahora, tipoEvaluacion) => {
    if (tipoEvaluacion === "desarrollo") {
        return String(antes ?? "") === String(ahora ?? "");
    }
    const a = leerNotaDeSubnota(antes);
    const b = leerNotaDeSubnota(ahora);
    if (a.vacia || b.vacia) return Boolean(a.vacia) === Boolean(b.vacia);
    return a.centesimas === b.centesimas;
};

/**
 * Las casillas que cambiaron. 4, "4.0" y "4,00" son la misma nota, así que
 * salir sin tocar nada no gasta una petición.
 */
export const subnotasCambiadas = (original, borrador, tipoEvaluacion) =>
    Object.keys(borrador || {}).filter(
        (clave) => !mismoValor(original?.[clave], borrador[clave], tipoEvaluacion),
    );

/** P4: con lo escrito, el estudiante se queda sin ninguna subnota calificada. */
export const quedaraSinSubnotas = (original, borrador) =>
    Object.values(original || {}).some(tieneValor)
    && !Object.values(borrador || {}).some(tieneValor);

/** Mensaje si el nombre no sirve para una subnota nueva o renombrada, o `null`. */
export const validarNombreSubnota = (nombre, subnotas, { excluirId = null } = {}) => {
    const limpio = String(nombre ?? "").trim();
    if (!limpio) return MENSAJE_NOMBRE_VACIO;
    if (limpio.length > LARGO_MAXIMO_NOMBRE_SUBNOTA) return MENSAJE_NOMBRE_LARGO;

    const repetido = (subnotas || []).some(
        ({ id, nombre: otro }) =>
            String(id) !== String(excluirId) && claveDeNombre(otro) === claveDeNombre(limpio),
    );
    return repetido ? MENSAJE_NOMBRE_REPETIDO : null;
};

/** El tipo ya llegó al máximo de subnotas (P11). */
export const alcanzoElLimite = (subnotas) =>
    (subnotas || []).length >= MAXIMO_SUBNOTAS_POR_TIPO;

// ---------------------------------------------------------------------------
// Cuerpos para el servidor
// ---------------------------------------------------------------------------

export const construirPayloadSubnota = ({ asignacionId, periodo, tipoNota, nombre }) => ({
    asignacion_id: parseInt(asignacionId),
    periodo: parseInt(periodo),
    tipo_nota: tipoNota,
    nombre: String(nombre ?? "").trim(),
});

export const construirPayloadRenombrarSubnota = ({ asignacionId, nombre }) => ({
    asignacion_id: parseInt(asignacionId),
    nombre: String(nombre ?? "").trim(),
});

/**
 * Las calificaciones que cambiaron, listas para `POST /planilla/subnotas/valores`.
 *
 * Solo van las cambiadas: el servidor conserva las demás. Una casilla vacía
 * viaja como `null`. Las notas viajan ya con dos decimales, así el servidor
 * guarda exactamente lo que mostró la vista previa.
 */
export const construirPayloadCalificaciones = ({
    asignacionId,
    periodo,
    tipoNota,
    estudianteId,
    tipoEvaluacion,
    borrador,
    cambiadas,
}) => ({
    asignacion_id: parseInt(asignacionId),
    periodo: parseInt(periodo),
    tipo_nota: tipoNota,
    estudiante_id: estudianteId,
    tipo_evaluacion: tipoEvaluacion === "desarrollo" ? "desarrollo" : "numerica",
    valores: (cambiadas || []).reduce((acumulado, clave) => {
        const valor = borrador?.[clave];
        if (!tieneValor(valor)) {
            acumulado[clave] = null;
        } else if (tipoEvaluacion === "desarrollo") {
            acumulado[clave] = obtenerValoracion(valor) ? valor : null;
        } else {
            acumulado[clave] = leerNotaDeSubnota(valor).centesimas / 100;
        }
        return acumulado;
    }, {}),
});

// ---------------------------------------------------------------------------
// Actualizar la planilla con lo que respondió el servidor
// ---------------------------------------------------------------------------

const conCelda = (estudiante, tipo, { nota = null, valoracion = null, tipoEvaluacion }, columnas) => {
    const actualizado = {
        ...estudiante,
        notas: { ...(estudiante.notas || {}), [tipo]: nota },
        valoraciones: { ...(estudiante.valoraciones || {}), [tipo]: valoracion },
    };
    if (tipoEvaluacion) {
        actualizado.tipos_evaluacion = {
            ...(estudiante.tipos_evaluacion || {}),
            [tipo]: tipoEvaluacion,
        };
    }
    actualizado.promedio = calcularPromedioEstudiante(actualizado, columnas);
    return actualizado;
};

/**
 * El estudiante con la celda y las subnotas que devolvió
 * `POST /planilla/subnotas/valores`. Las subnotas de ese tipo se reemplazan
 * por las de la respuesta, que es lo que quedó guardado.
 */
export const aplicarCalificacionesGuardadas = (estudiante, tipo, subnotas, respuesta, columnas) => {
    const suyas = { ...(estudiante.subnotas || {}) };
    (subnotas || []).forEach(({ id }) => {
        delete suyas[String(id)];
    });
    Object.assign(suyas, respuesta?.subnotas || {});

    return conCelda(
        { ...estudiante, subnotas: suyas },
        tipo,
        {
            nota: respuesta?.nota ?? null,
            valoracion: respuesta?.valoracion ?? null,
            tipoEvaluacion: respuesta?.tipo_evaluacion,
        },
        columnas,
    );
};

/**
 * La planilla después de borrar una subnota: nadie la conserva, y los
 * estudiantes que la tenían calificada reciben su celda recalculada.
 */
export const aplicarSubnotaBorrada = (estudiantes, tipo, subnotaId, celdas, columnas) => {
    const clave = String(subnotaId);
    return (estudiantes || []).map((estudiante) => {
        const suyas = { ...(estudiante.subnotas || {}) };
        const laTenia = Object.prototype.hasOwnProperty.call(suyas, clave);
        delete suyas[clave];
        const sinSubnota = laTenia ? { ...estudiante, subnotas: suyas } : estudiante;

        const celda = celdas?.[String(estudiante.estudiante_id)];
        return celda ? conCelda(sinSubnota, tipo, celda, columnas) : sinSubnota;
    });
};

export const agregarSubnota = (subnotasPorTipo, tipo, subnota) => ({
    ...(subnotasPorTipo || {}),
    [tipo]: [...subnotasDelTipo(subnotasPorTipo, tipo), { id: subnota.id, nombre: subnota.nombre }],
});

export const renombrarSubnota = (subnotasPorTipo, tipo, subnotaId, nombre) => ({
    ...(subnotasPorTipo || {}),
    [tipo]: subnotasDelTipo(subnotasPorTipo, tipo).map((subnota) =>
        String(subnota.id) === String(subnotaId) ? { ...subnota, nombre } : subnota,
    ),
});

export const quitarSubnota = (subnotasPorTipo, tipo, subnotaId) => {
    const restantes = subnotasDelTipo(subnotasPorTipo, tipo).filter(
        (subnota) => String(subnota.id) !== String(subnotaId),
    );
    const siguiente = { ...(subnotasPorTipo || {}) };
    if (restantes.length > 0) siguiente[tipo] = restantes;
    else delete siguiente[tipo];
    return siguiente;
};

/**
 * Lo que responde el backend al escribir a mano una celda calculada (P1).
 * Espejo de `NOTA_CALCULADA` en `app/controllers/planilla_controller.py`.
 */
export const MENSAJE_NOTA_CALCULADA =
    "Esta nota se calcula con sus subnotas. Cámbiala desde las subnotas.";

/**
 * `true` si el error es el 409 de una celda calculada.
 *
 * Se reconoce por el mensaje y no solo por el 409, porque el año lectivo
 * cerrado también responde 409 y ese caso sigue como estaba. Si el backend
 * cambiara el texto, este caso volvería al aviso de siempre ("quedó
 * pendiente"): se degrada sin romper nada.
 */
export const esErrorDeNotaCalculada = (error) =>
    error?.response?.status === 409
    && error?.response?.data?.detail === MENSAJE_NOTA_CALCULADA;

/** Mensaje del servidor si lo trae (`{ detail: "..." }`), o el de respaldo. */
export const mensajeDelServidor = (error, respaldo) => {
    const detalle = error?.response?.data?.detail;
    return typeof detalle === "string" && detalle.trim() ? detalle : respaldo;
};
