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
    return detail || fallback;
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
