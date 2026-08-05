const COLUMNA_INTERNA_MAS_ALTO = "mas_alto";
const COLUMNAS_INTERNAS_OCULTAS = new Set([COLUMNA_INTERNA_MAS_ALTO]);

export const esColumnaInterna = (valor) =>
    COLUMNAS_INTERNAS_OCULTAS.has(String(valor || "").trim().toLowerCase());

export const obtenerColumnasVisibles = (columnas) =>
    (Array.isArray(columnas) ? columnas : []).filter((col) => !esColumnaInterna(col));

export const formatearEtiquetaColumna = (valor) => {
    const texto = String(valor || "").trim();
    if (!texto) return "";

    const etiquetas = {
        [COLUMNA_INTERNA_MAS_ALTO]: "Más alto",
    };
    const clave = texto.toLowerCase();
    if (etiquetas[clave]) return etiquetas[clave];

    return texto
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
};

export const obtenerNotasVisibles = (notas, columnasVisibles) => {
    const columnas = Array.isArray(columnasVisibles) ? columnasVisibles : [];
    if (columnas.length === 0) return {};

    return columnas.reduce((acumulado, col) => {
        if (Object.prototype.hasOwnProperty.call(notas || {}, col)) {
            acumulado[col] = notas[col];
        }
        return acumulado;
    }, {});
};

export const calcularPromedioNotas = (notas, columnasVisibles) => {
    const valores = (Array.isArray(columnasVisibles) ? columnasVisibles.map((col) => notas?.[col]) : Object.values(notas || {}))
        .filter((valor) => valor !== null && valor !== undefined && String(valor).trim() !== "")
        .map((valor) => Number(valor))
        .filter((valor) => Number.isFinite(valor));

    if (valores.length === 0) return "";

    const promedio = valores.reduce((total, valor) => total + valor, 0) / valores.length;
    return promedio.toFixed(2);
};

export const normalizarNumeroNota = (valor) => Number(String(valor).replace(",", "."));

export const normalizarEstudiantesPlanilla = (estudiantes, columnasVisibles) =>
    (estudiantes || []).map((est) => {
        const notasVisibles = obtenerNotasVisibles(est.notas || {}, columnasVisibles);
        return {
            ...est,
            notas: notasVisibles,
            promedio: calcularPromedioNotas(notasVisibles, columnasVisibles),
        };
    });

export const construirPayloadNota = ({
    estudianteId,
    asignacionId,
    periodo,
    descripcion,
    tipoEvaluacion,
    nota = null,
    valoracion = null,
}) => ({
    estudiante_id: estudianteId,
    asignacion_id: parseInt(asignacionId),
    nota,
    descripcion,
    periodo: parseInt(periodo),
    tipo_evaluacion: tipoEvaluacion,
    valoracion,
});
