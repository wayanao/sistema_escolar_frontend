export const DIAS_SEMANA_HORARIOS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
];

export function formatearHora12(hora24) {
    if (!hora24) return "";
    if (hora24.toLowerCase().includes("am") || hora24.toLowerCase().includes("pm")) {
        return hora24;
    }

    const [horaStr, minutoStr] = hora24.split(":");
    let horaNum = parseInt(horaStr, 10);
    const ampm = horaNum >= 12 ? "PM" : "AM";
    horaNum = horaNum % 12 || 12;
    return `${horaNum}:${minutoStr} ${ampm}`;
}

function obtenerValoresUnicos(horarios, campo) {
    return [...new Set(horarios.map((horario) => horario[campo]))];
}

export function obtenerProfesoresUnicosHorario(horarios) {
    return obtenerValoresUnicos(horarios, "profesor");
}

export function obtenerCursosUnicosHorario(horarios, { ordenar = false } = {}) {
    const cursos = obtenerValoresUnicos(horarios, "curso");
    return ordenar ? cursos.sort() : cursos;
}

export function filtrarCursosHorario(cursos, busqueda) {
    const consulta = busqueda.trim().toLowerCase();
    if (!consulta) return cursos;
    return cursos.filter((curso) => curso.toLowerCase().includes(consulta));
}

export function obtenerHorariosProfesor(horarios, profesor) {
    return horarios.filter((horario) => horario.profesor === profesor);
}

export function obtenerHorariosCurso(horarios, curso) {
    return horarios.filter((horario) => horario.curso === curso);
}

export function obtenerClasesDiaHorario(
    horarios,
    dia,
    { ordenarPorHora = false } = {},
) {
    const clases = horarios.filter((horario) => horario.dia === dia);
    if (!ordenarPorHora) return clases;

    return clases.sort((a, b) =>
        (a.hora_inicio || "").localeCompare(b.hora_inicio || "")
    );
}
