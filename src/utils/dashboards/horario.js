// Reglas del horario del panel del profesor (2026-11-10): las clases de un día
// en tarjetas, con su estado de hoy y lo que se puede hacer desde cada una.
// Sin HTTP, sin React y sin DOM: todo sale de `/mis-clases`, que ya se carga.
import { esAsignacionDeJornada, NIVEL_PREESCOLAR } from "../nivelAcademico";
import {
    DIAS_SEMANA,
    JORNADA_MANANA,
    JORNADA_TARDE,
    MINUTOS_CORTE_JORNADA,
    formatearHora12,
    obtenerJornadaClase,
} from "./profesor";

export const DIAS_CORTOS = {
    Lunes: "Lun",
    Martes: "Mar",
    Miércoles: "Mié",
    Jueves: "Jue",
    Viernes: "Vie",
};

export const ESTADO_AHORA = "ahora";
export const ESTADO_SIGUIENTE = "siguiente";
export const ESTADO_TERMINADA = "terminada";

/** "07:30:00" → 450. Sin hora válida, `null`. */
export const aMinutos = (hora) => {
    const [h, m] = String(hora || "").split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
};

export const claveClase = (clase) =>
    `${clase.horario_id || clase.id}-${clase.dia}-${clase.hora_inicio}`;

/** Las clases de cada día de la semana escolar, ordenadas por hora. */
export const agruparClasesPorDia = (clases) => {
    const porDia = Object.fromEntries(DIAS_SEMANA.map((dia) => [dia, []]));
    for (const clase of Array.isArray(clases) ? clases : []) {
        if (porDia[clase.dia]) porDia[clase.dia].push(clase);
    }
    for (const dia of DIAS_SEMANA) {
        porDia[dia].sort((a, b) => (aMinutos(a.hora_inicio) ?? 0) - (aMinutos(b.hora_inicio) ?? 0));
    }
    return porDia;
};

/** El día que se muestra al entrar: hoy, o el lunes si hoy no hay colegio. */
export const diaInicialHorario = (hoy) => (DIAS_SEMANA.includes(hoy) ? hoy : DIAS_SEMANA[0]);

/**
 * El estado de cada clase de hoy, en el mismo orden: «ahora» si está en
 * curso, «terminada» si ya pasó y «siguiente» la primera que falta por
 * empezar. Las demás, `null`.
 */
export const estadosDeClasesDeHoy = (clasesDelDia, minutosAhora) => {
    let siguienteMarcada = false;
    return clasesDelDia.map((clase) => {
        const inicio = aMinutos(clase.hora_inicio);
        const fin = aMinutos(clase.hora_fin);
        if (inicio === null || fin === null) return null;
        if (minutosAhora >= fin) return ESTADO_TERMINADA;
        if (minutosAhora >= inicio) return ESTADO_AHORA;
        if (!siguienteMarcada) {
            siguienteMarcada = true;
            return ESTADO_SIGUIENTE;
        }
        return null;
    });
};

/**
 * Lo que se puede hacer desde la tarjeta de una clase. En preescolar la
 * asistencia se toma una vez al día con «Asistencia diaria» (que no lleva
 * notas), y sus materias solo llevan notas.
 */
export const accionesDeClase = (clase) => {
    if (esAsignacionDeJornada(clase.materia)) {
        return { asistencia: true, planilla: false, textoAsistencia: "Tomar asistencia del día" };
    }
    if (clase.nivel === NIVEL_PREESCOLAR) {
        return { asistencia: false, planilla: true, textoAsistencia: "" };
    }
    return { asistencia: true, planilla: true, textoAsistencia: "Tomar asistencia" };
};

/** «3 clases · de 7:00 AM a 12:30 PM», o `""` sin clases. */
export const resumenDelDia = (clasesDelDia) => {
    if (!clasesDelDia.length) return "";
    const cantidad = `${clasesDelDia.length} ${clasesDelDia.length === 1 ? "clase" : "clases"}`;
    const primera = clasesDelDia[0];
    const ultima = clasesDelDia[clasesDelDia.length - 1];
    return `${cantidad} · de ${formatearHora12(primera.hora_inicio)} a ${formatearHora12(ultima.hora_fin)}`;
};

/** «Empieza en 25 min» o «Empieza en 1 h 10 min» si falta poco (3 horas o
 * menos); si no, `""`. */
export const textoFaltaParaEmpezar = (clase, minutosAhora) => {
    const inicio = aMinutos(clase.hora_inicio);
    if (inicio === null) return "";
    const falta = inicio - minutosAhora;
    if (falta <= 0 || falta > 180) return "";
    const horas = Math.floor(falta / 60);
    const minutos = falta % 60;
    if (!horas) return `Empieza en ${minutos} min`;
    return minutos ? `Empieza en ${horas} h ${minutos} min` : `Empieza en ${horas} h`;
};

/** Duración en palabras: «45 min», «1 hora», «1 h 30 min». */
export const duracionClase = (clase) => {
    const inicio = aMinutos(clase.hora_inicio);
    const fin = aMinutos(clase.hora_fin);
    if (inicio === null || fin === null || fin <= inicio) return "";
    const total = fin - inicio;
    const horas = Math.floor(total / 60);
    const minutos = total % 60;
    if (!horas) return `${minutos} min`;
    if (!minutos) return horas === 1 ? "1 hora" : `${horas} horas`;
    return `${horas} h ${minutos} min`;
};

/** La jornada que va a esta hora: mañana hasta las 12:30, tarde después. */
export const jornadaEnCurso = (minutosAhora) =>
    minutosAhora < MINUTOS_CORTE_JORNADA ? JORNADA_MANANA : JORNADA_TARDE;

/**
 * Las clases del día partidas por jornada, solo si el profesor tiene clases
 * en las dos (si no, un solo grupo sin título). `jornadaPrimero` (la que está
 * en curso, solo hoy) va de primera; sin ella, mañana y después tarde.
 */
export const separarPorJornada = (clasesDelDia, hayDosJornadas, jornadaPrimero = "") => {
    if (!hayDosJornadas) return [{ jornada: "", clases: clasesDelDia }];
    const grupos = [];
    for (const clase of clasesDelDia) {
        const jornada = obtenerJornadaClase(clase);
        const grupo = grupos.find((g) => g.jornada === jornada);
        if (grupo) grupo.clases.push(clase);
        else grupos.push({ jornada, clases: [clase] });
    }
    const orden = (jornada) => (jornada === jornadaPrimero ? 0 : jornada === JORNADA_MANANA ? 1 : 2);
    return grupos.sort((a, b) => orden(a.jornada) - orden(b.jornada));
};
