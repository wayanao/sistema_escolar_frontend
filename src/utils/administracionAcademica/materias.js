export const ESTADOS_MATERIA = [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
];

export const FILTROS_MATERIA = [
    ...ESTADOS_MATERIA,
    { value: "todos", label: "Todos" },
];

export const CLASES_ESTADO_MATERIA = {
    activo: "bg-green-100 text-green-800 border-green-200",
    inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

const CODIGO_MATERIA_USADA_EN_OTRO_ANIO = "materia_usada_en_otro_anio";

export function normalizarNombreMateria(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleUpperCase("es-CO");
}

export function obtenerMensajeErrorMateria(error, fallback) {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map((item) => item.msg || item.message || String(item)).join("\n");
    }
    if (detail && typeof detail === "object") {
        return detail.mensaje || fallback;
    }
    return detail || fallback;
}

export function obtenerAvisoMateriaUsadaEnOtroAnio(error) {
    const detail = error?.response?.data?.detail;
    if (
        error?.response?.status !== 409
        || !detail
        || typeof detail !== "object"
        || detail.codigo !== CODIGO_MATERIA_USADA_EN_OTRO_ANIO
        || typeof detail.mensaje !== "string"
        || !detail.mensaje.trim()
    ) {
        return null;
    }

    return {
        codigo: detail.codigo,
        mensaje: detail.mensaje,
    };
}

export function obtenerEtiquetaEstadoMateria(estado) {
    return ESTADOS_MATERIA.find((item) => item.value === estado)?.label || "Activo";
}

export function construirPayloadMateria({ nombre, estado }) {
    return {
        nombre: normalizarNombreMateria(nombre),
        estado,
    };
}

export function aplicarEstadoMateria(materias, materiaId, estado, estadoFiltro) {
    return materias
        .map((materia) =>
            materia.id === materiaId
                ? { ...materia, estado }
                : materia
        )
        .filter((materia) =>
            estadoFiltro === "todos"
                ? true
                : (materia.estado || "activo") === estadoFiltro
        );
}
