/**
 * Contratos puros de los porcentajes por tipo de nota en la planilla.
 *
 * Ver la parte B de `docs/funcionalidades/SUBNOTAS_PLANILLA.md` (QB1, QB2 y
 * PB2 a PB4). **Es la gemela de `app/core/nota_periodo.py` del backend**, con
 * los mismos casos de prueba: cuándo están activos los porcentajes (todo o
 * nada), cuánto suman y la nota ponderada.
 *
 * **La nota oficial la calcula el backend.** Este módulo la repite solo para
 * mostrar el promedio de la planilla mientras el profesor trabaja. La cuenta
 * va en centésimas enteras, mitad hacia arriba, igual que el servidor.
 *
 * Los porcentajes llegan del servidor como `porcentajes` (`{ "<tipo>": 40 }`,
 * con el nombre exacto de la columna). Los tipos se comparan sin mayúsculas ni
 * espacios en los extremos, como `LOWER(TRIM(...))` en el backend.
 *
 * Sin HTTP, sin React y sin DOM.
 */
import { valorDeValoracion, valoracionDesdePromedio } from "../valoracionesDesarrollo";
import { esColumnaInterna } from "./notas";
import { leerNotaDeSubnota } from "./subnotas";

/** PB2: porcentajes enteros de 1 a 100. */
export const PORCENTAJE_MINIMO = 1;
export const PORCENTAJE_MAXIMO = 100;

/** QB2: los porcentajes cuentan solo cuando suman exactamente esto. */
export const SUMA_COMPLETA = 100;

// Los mismos textos del backend (`porcentajes_planilla_controller.py`).
export const MENSAJE_PORCENTAJE_INVALIDO = "El porcentaje debe ser un número entero de 1 a 100.";
export const MENSAJE_SUMA_EXCEDIDA = "Los porcentajes de esta planilla no pueden sumar más de 100 %.";

/** PB9: el aviso de la planilla mientras los porcentajes no están completos. */
export const MENSAJE_FALTAN_PORCENTAJES = "Faltan porcentajes: se usa el promedio simple.";

const claveDeTipo = (tipo) => String(tipo ?? "").trim().toLowerCase();

const tieneValor = (valor) =>
    valor !== null && valor !== undefined && String(valor).trim() !== "";

/**
 * `false` para las columnas internas (`mas_alto`, "Desde React"): no se ven,
 * así que no llevan porcentaje ni cuentan para completar los 100.
 */
export const admitePorcentaje = (tipo) =>
    !esColumnaInterna(tipo) && claveDeTipo(tipo) !== "desde react";

const porcentajesPorClave = (porcentajes) => {
    const mapa = new Map();
    Object.entries(porcentajes || {}).forEach(([tipo, valor]) => {
        mapa.set(claveDeTipo(tipo), Number(valor));
    });
    return mapa;
};

const clavesVisibles = (columnas) =>
    new Set((columnas || []).filter(admitePorcentaje).map(claveDeTipo));

/** Suma de los porcentajes de los tipos que están en la planilla. */
export const sumaDePorcentajes = (columnas, porcentajes) => {
    const mapa = porcentajesPorClave(porcentajes);
    let suma = 0;
    clavesVisibles(columnas).forEach((clave) => {
        if (mapa.has(clave)) suma += mapa.get(clave);
    });
    return suma;
};

/** QB2, todo o nada: cada tipo visible tiene su porcentaje y suman 100. */
export const porcentajesActivos = (columnas, porcentajes) => {
    const claves = clavesVisibles(columnas);
    const mapa = porcentajesPorClave(porcentajes);
    if (claves.size === 0) return false;
    for (const clave of claves) {
        if (!mapa.has(clave)) return false;
    }
    return sumaDePorcentajes(columnas, porcentajes) === SUMA_COMPLETA;
};

/**
 * PB4: `{ valor, valoracion }` de la nota ponderada, o `null` sin nada que
 * ponderar.
 *
 * `celdas` son `[tipo, nota, valoracion]`. Solo pesan las celdas con valor de
 * un tipo con porcentaje; una vacía no cuenta y su peso se reparte entre las
 * demás. En primaria, una nota fuera de 1 a 5 no cuenta (igual que el
 * backend) y `valoracion` es `null`. En preescolar (`"desarrollo"`), las
 * caritas se pasan a número, `valor` es ese promedio con dos decimales y
 * `valoracion` la opción de la escala más cercana, con empate hacia la más
 * alta.
 */
export const notaPonderada = (celdas, porcentajes, tipoEvaluacion = "numerica") => {
    const mapa = porcentajesPorClave(porcentajes);
    let total = 0;
    let pesos = 0;

    (celdas || []).forEach(([tipo, nota, valoracion]) => {
        const peso = mapa.get(claveDeTipo(tipo));
        if (!peso || !admitePorcentaje(tipo)) return;

        let centesimas = null;
        if (tipoEvaluacion === "desarrollo") {
            const valor = valorDeValoracion(valoracion);
            if (valor !== null) centesimas = valor * 100;
        } else if (tieneValor(nota)) {
            centesimas = leerNotaDeSubnota(nota).centesimas ?? null;
        }
        if (centesimas === null) return;

        total += centesimas * peso;
        pesos += peso;
    });

    if (pesos === 0) return null;

    // Mitad hacia arriba con enteros: piso de (total / pesos + 1/2).
    const valor = Math.floor((2 * total + pesos) / (2 * pesos)) / 100;
    if (tipoEvaluacion !== "desarrollo") return { valor, valoracion: null };
    return { valor, valoracion: valoracionDesdePromedio(total / pesos / 100) };
};

const tieneCaritas = (estudiante, columnas) =>
    (columnas || []).some((columna) => valorDeValoracion(estudiante?.valoraciones?.[columna]) !== null);

/**
 * El promedio ponderado de un estudiante, como texto con dos decimales, o
 * cadena vacía. Prefiere las caritas cuando las tiene, igual que
 * `calcularPromedioEstudiante` de `./notas`.
 */
export const calcularPromedioPonderado = (estudiante, columnas, porcentajes) => {
    const desarrollo = tieneCaritas(estudiante, columnas);
    const celdas = (columnas || []).map((columna) => [
        columna,
        desarrollo ? null : estudiante?.notas?.[columna],
        desarrollo ? estudiante?.valoraciones?.[columna] : null,
    ]);
    const resultado = notaPonderada(celdas, porcentajes, desarrollo ? "desarrollo" : "numerica");
    return resultado ? resultado.valor.toFixed(2) : "";
};

/**
 * La planilla con el promedio ponderado, si los porcentajes están activos.
 *
 * Sin porcentajes activos devuelve **la misma lista**, sin tocarla: el
 * promedio de siempre queda tal cual (QB4).
 */
export const aplicarPromediosPonderados = (estudiantes, columnas, porcentajes) => {
    if (!porcentajesActivos(columnas, porcentajes)) return estudiantes;
    return (estudiantes || []).map((estudiante) => ({
        ...estudiante,
        promedio: calcularPromedioPonderado(estudiante, columnas, porcentajes),
    }));
};

// ---------------------------------------------------------------------------
// Lo que llega del servidor y lo que se le envía
// ---------------------------------------------------------------------------

/**
 * Los porcentajes de la respuesta, solo de las columnas que se ven. Una
 * respuesta sin `porcentajes` (un servidor viejo) da un objeto vacío.
 */
export const normalizarPorcentajesPorTipo = (porcentajes, columnasVisibles) => {
    const fuente = porcentajes && typeof porcentajes === "object" ? porcentajes : {};
    return (columnasVisibles || []).reduce((acumulado, columna) => {
        if (admitePorcentaje(columna) && Number.isInteger(fuente[columna])) {
            acumulado[columna] = fuente[columna];
        }
        return acumulado;
    }, {});
};

/** Los porcentajes con lo que respondió `PUT /planilla/tipos/porcentaje`. */
export const aplicarPorcentajeGuardado = (porcentajesPorTipo, respuesta) => {
    const siguiente = { ...(porcentajesPorTipo || {}) };
    if (respuesta?.porcentaje === null || respuesta?.porcentaje === undefined) {
        delete siguiente[respuesta?.tipo_nota];
    } else {
        siguiente[respuesta.tipo_nota] = respuesta.porcentaje;
    }
    return siguiente;
};

export const construirPayloadPorcentaje = ({ asignacionId, periodo, tipoNota, porcentaje }) => ({
    asignacion_id: parseInt(asignacionId),
    periodo: parseInt(periodo),
    tipo_nota: tipoNota,
    porcentaje: porcentaje ?? null,
});

// ---------------------------------------------------------------------------
// Lo que escribe el profesor
// ---------------------------------------------------------------------------

/**
 * Un porcentaje escrito: `{ porcentaje }` si es un entero de 1 a 100 (con o
 * sin "%"), `{ vacio: true }` si no hay nada y `{ invalido: true }` si no
 * sirve. 33.5 no sirve: los porcentajes son enteros (PB2).
 */
export const leerPorcentajeEscrito = (texto) => {
    if (!tieneValor(texto)) return { vacio: true };
    const limpio = String(texto).trim().replace(/\s*%$/, "");
    if (!/^\d+$/.test(limpio)) return { invalido: true };
    const porcentaje = Number(limpio);
    if (porcentaje < PORCENTAJE_MINIMO || porcentaje > PORCENTAJE_MAXIMO) return { invalido: true };
    return { porcentaje };
};

/**
 * Lo que se enviará para el porcentaje de `tipo`, o el mensaje que lo
 * impide. Vacío quita el porcentaje (`null`). La suma no cuenta el porcentaje
 * que el tipo tenía, y un tipo nuevo, que todavía no es columna, también
 * cuenta. El backend vuelve a comprobarlo con la clase bloqueada.
 */
export const validarPorcentajeNuevo = ({ columnas, porcentajes, tipo, texto }) => {
    const leido = leerPorcentajeEscrito(texto);
    if (leido.vacio) return { porcentaje: null };
    if (leido.invalido) return { error: MENSAJE_PORCENTAJE_INVALIDO };

    const otros = Object.fromEntries(
        Object.entries(porcentajes || {}).filter(([otro]) => claveDeTipo(otro) !== claveDeTipo(tipo)),
    );
    if (sumaDePorcentajes(columnas, otros) + leido.porcentaje > SUMA_COMPLETA) {
        return { error: MENSAJE_SUMA_EXCEDIDA };
    }
    return { porcentaje: leido.porcentaje };
};
