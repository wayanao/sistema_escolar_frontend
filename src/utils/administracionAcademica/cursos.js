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

export const NIVEL_CURSO_SIN_DEFINIR = "";

export const NIVELES_CURSO = [
    { value: NIVEL_CURSO_SIN_DEFINIR, label: "Sin definir" },
    { value: "preescolar", label: "Preescolar" },
    { value: "primaria", label: "Primaria" },
];

export const CLASES_NIVEL_CURSO = {
    preescolar: "bg-pink-100 text-pink-800 border-pink-200",
    primaria: "bg-blue-100 text-blue-800 border-blue-200",
};

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

export function obtenerEtiquetaNivelCurso(nivel) {
    return NIVELES_CURSO.find((item) => item.value === (nivel || ""))?.label
        || "Sin definir";
}

export function construirPayloadCurso({ nombre, jornada, estado, nivel }) {
    return {
        nombre: normalizarNombreCurso(nombre),
        jornada,
        estado,
        // Un curso "sin definir" viaja como null, nunca como cadena vacía: el
        // backend solo acepta null, "preescolar" o "primaria".
        nivel: nivel || null,
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
