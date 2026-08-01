export const ESTADOS_PROFESOR = [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
];

export const FILTROS_PROFESOR = [
    ...ESTADOS_PROFESOR,
    { value: "todos", label: "Todos" },
];

export const CLASES_ESTADO_PROFESOR = {
    activo: "bg-green-100 text-green-800 border-green-200",
    inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

export function normalizarTextoMayusculas(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleUpperCase("es-CO");
}

export function obtenerMensajeErrorApi(error, fallback) {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map((item) => item.msg || item.message || String(item)).join("\n");
    }
    return detail || fallback;
}

export function obtenerEtiquetaEstadoProfesor(estado) {
    return ESTADOS_PROFESOR.find((item) => item.value === estado)?.label || "Activo";
}

export function construirPayloadProfesor({
    nombre,
    apellido,
    documentoIdentidad,
    email,
    telefono,
    password,
    sueldo,
    estado,
}) {
    return {
        nombre: normalizarTextoMayusculas(nombre),
        apellido: normalizarTextoMayusculas(apellido),
        documento_identidad: documentoIdentidad,
        email: String(email || "").trim().toLocaleLowerCase("es-CO"),
        telefono,
        password,
        sueldo: parseFloat(sueldo) || 0,
        estado,
    };
}

export function filtrarProfesores(profesores, busqueda) {
    const termino = busqueda.toLowerCase();
    return profesores.filter((profesor) =>
        `${profesor.nombre} ${profesor.apellido} ${profesor.documento}`
            .toLowerCase()
            .includes(termino)
    );
}

export function aplicarEstadoProfesor(profesores, profesorId, estado, estadoFiltro) {
    return profesores
        .map((profesor) =>
            profesor.id === profesorId
                ? { ...profesor, estado }
                : profesor
        )
        .filter((profesor) =>
            estadoFiltro === "todos"
                ? true
                : (profesor.estado || "activo") === estadoFiltro
        );
}
