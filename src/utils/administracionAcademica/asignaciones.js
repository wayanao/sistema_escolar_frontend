export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
export const MANANA_INICIO = "06:30";
export const MANANA_FIN = "12:30";
export const TARDE_INICIO = "12:30";
export const TARDE_FIN = "18:30";

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

export function estaEnRangoInstitucional(inicio, fin) {
    if (!inicio || !fin) return false;
    const estaEnManana = inicio >= MANANA_INICIO && fin <= MANANA_FIN;
    const estaEnTarde = inicio >= TARDE_INICIO && fin <= TARDE_FIN;
    return estaEnManana || estaEnTarde;
}

export function obtenerAsignacionesCurso(listaAsignaciones, cursoId) {
    return listaAsignaciones
        .filter((asignacion) => String(asignacion.curso_id) === String(cursoId))
        .sort((a, b) => {
            const diaA = DIAS_SEMANA.indexOf(a.dia);
            const diaB = DIAS_SEMANA.indexOf(b.dia);
            if (diaA !== diaB) return diaA - diaB;
            return (a.hora_inicio || "").localeCompare(b.hora_inicio || "");
        });
}

export function construirParametrosDisponibilidad(dia, editandoId) {
    const params = { dia };
    if (editandoId) params.excluir_asignacion_id = editandoId;
    return params;
}

export function construirPayloadAsignacion({
    profesorId,
    cursoId,
    materiaId,
    dia,
    horaInicio,
    horaFin,
}) {
    return {
        profesor_id: parseInt(profesorId, 10),
        curso_id: parseInt(cursoId, 10),
        materia_id: parseInt(materiaId, 10),
        dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
    };
}

function buscarMateriaConOtroProfesor({
    listaAsignaciones,
    cursoId,
    materiaId,
    profesorId,
    asignacionIdActual,
}) {
    return listaAsignaciones.find((asignacion) =>
        String(asignacion.id) !== String(asignacionIdActual || "")
        && String(asignacion.curso_id) === String(cursoId)
        && String(asignacion.materia_id) === String(materiaId)
        && String(asignacion.profesor_id) !== String(profesorId)
    );
}

export function validarAsignacion({
    cursoId,
    profesorId,
    materiaId,
    dia,
    horaInicio,
    horaFin,
    cursoSeleccionado,
    listaAsignaciones,
    editandoId,
}) {
    if (!cursoId || !profesorId || !materiaId || !dia || !horaInicio || !horaFin) {
        return "Completa curso, profesor, materia, día y horas.";
    }
    if (horaInicio >= horaFin) {
        return "La hora de inicio debe ser anterior a la hora de fin.";
    }
    if (!estaEnRangoInstitucional(horaInicio, horaFin)) {
        return `El horario debe estar dentro de ${MANANA_INICIO}-${MANANA_FIN} o ${TARDE_INICIO}-${TARDE_FIN}.`;
    }

    const jornada = (cursoSeleccionado?.jornada || "").toLowerCase();
    if ((jornada.includes("mañan") || jornada.includes("manan")) && horaFin > MANANA_FIN) {
        return `El curso es jornada Mañana: la clase debe terminar antes o a las ${MANANA_FIN}.`;
    }
    if (jornada.includes("tarde") && horaInicio < TARDE_INICIO) {
        return `El curso es jornada Tarde: la clase debe comenzar a partir de las ${TARDE_INICIO}.`;
    }

    const conflictoProfesor = buscarMateriaConOtroProfesor({
        listaAsignaciones,
        cursoId,
        materiaId,
        profesorId,
        asignacionIdActual: editandoId,
    });
    if (conflictoProfesor) {
        return `Esta materia ya está asignada en este curso al profesor ${conflictoProfesor.profesor_nombre || ""}.`;
    }

    return null;
}
