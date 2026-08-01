export const ESTADOS_CURSO = [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
];

export const FILTROS_CURSO = [
    ...ESTADOS_CURSO,
    { value: "todos", label: "Todos" },
];

export const JORNADA_CURSO_INICIAL = "Mañana";

export const JORNADAS_CURSO = [
    { value: "Mañana", label: "🌅 Mañana" },
    { value: "Tarde", label: "🌇 Tarde" },
];

export const CLASES_ESTADO_CURSO = {
    activo: "bg-green-100 text-green-800 border-green-200",
    inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

export function normalizarNombreCurso(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleUpperCase("es-CO");
}

export function obtenerMensajeErrorCurso(error, fallback) {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map((item) => item.msg || item.message || String(item)).join("\n");
    }
    return detail || fallback;
}

export function obtenerEtiquetaEstadoCurso(estado) {
    return ESTADOS_CURSO.find((item) => item.value === estado)?.label || "Activo";
}

export function construirPayloadCurso({ nombre, jornada, estado }) {
    return {
        nombre: normalizarNombreCurso(nombre),
        jornada,
        estado,
    };
}

export function aplicarEstadoCurso(cursos, cursoId, estado, estadoFiltro) {
    return cursos
        .map((curso) =>
            curso.id === cursoId
                ? { ...curso, estado }
                : curso
        )
        .filter((curso) =>
            estadoFiltro === "todos"
                ? true
                : (curso.estado || "activo") === estadoFiltro
        );
}
