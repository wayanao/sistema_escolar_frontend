// Contratos y transformaciones puras del subdominio del profesor: el panel
// principal y sus dos rankings, que solo se alcanzan desde él y comparten su
// contexto de trabajo.
// Incluye también las reglas de clase de Tailwind que la capa 5 extrajo de la
// página, igual que hizo el módulo de referencia con `claseEstadoPrestamo`.

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export const JORNADAS = ["Mañana", "Tarde"];

export const JORNADA_MANANA = "Mañana";

export const JORNADA_TARDE = "Tarde";

export const FILTRO_JORNADA_AMBAS = "Ambas";

export const MATERIA_TODAS = "todas";

export const LIMITE_PLANEACIONES_RECIENTES = 5;

export const PARAMETROS_PLANEACIONES_RECIENTES = {
    limit: LIMITE_PLANEACIONES_RECIENTES,
    offset: 0,
};

export const MENSAJE_ERROR_PLANEACIONES_RECIENTES =
    "No se pudieron cargar las planeaciones recientes.";

export const MENSAJE_ERROR_CLASES = "No se pudieron cargar tus clases.";

export const MENSAJE_ERROR_INASISTENCIAS = "No se pudieron cargar las inasistencias.";

export const MENSAJE_ERROR_RENDIMIENTO = "No se pudo cargar el rendimiento del curso.";

export const MENSAJE_ERROR_RANKING = "No se pudo cargar el ranking.";

export const RUTA_RANKING_BAJO = "/ranking-rendimiento";

export const RUTA_RANKING_MEJOR = "/ranking-mejor-rendimiento";

// El corte institucional entre jornadas son las 12:30.
const MINUTOS_CORTE_JORNADA = 12 * 60 + 30;

export const obtenerOrdenDia = (dia) => {
    const orden = DIAS_SEMANA.indexOf(dia);
    return orden === -1 ? DIAS_SEMANA.length : orden;
};

export const formatearHora12 = (hora24) => {
    if (!hora24) return "";
    if (hora24.toLowerCase().includes("am") || hora24.toLowerCase().includes("pm")) return hora24;

    const [horaStr, minutoStr = "00"] = hora24.split(":");
    let horaNum = parseInt(horaStr, 10);
    const ampm = horaNum >= 12 ? "PM" : "AM";
    horaNum = horaNum % 12 || 12;
    return `${horaNum}:${minutoStr} ${ampm}`;
};

export const ordenarPorHora = (a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || "");

export const obtenerJornadaClase = (clase) => {
    const jornada = String(clase?.jornada || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    if (jornada.includes("manan")) return JORNADA_MANANA;
    if (jornada.includes("tarde")) return JORNADA_TARDE;

    const [hora = "0", minuto = "0"] = String(clase?.hora_inicio || "").split(":");
    const minutosInicio = Number(hora) * 60 + Number(minuto);
    return minutosInicio < MINUTOS_CORTE_JORNADA ? JORNADA_MANANA : JORNADA_TARDE;
};

// A diferencia del panel de administración, aquí el resto del nombre sí baja a
// minúsculas.
export const capitalizarInicial = (valor) => {
    const texto = String(valor || "").trim();
    return texto
        ? texto.charAt(0).toLocaleUpperCase("es-CO") + texto.slice(1).toLocaleLowerCase("es-CO")
        : "";
};

export const nombreCompletoProfesor = (profesor) =>
    profesor ? `${profesor.nombre || ""} ${profesor.apellido || ""}`.trim() : "";

export const primerNombreProfesor = (profesor) =>
    capitalizarInicial(
        (profesor?.nombre || nombreCompletoProfesor(profesor) || "profe").trim().split(/\s+/)[0],
    );

export const formatearFechaPlaneacion = (valor) => {
    if (!valor) return "Sin fecha";
    const fechaPlaneacion = new Date(String(valor).includes("T") ? valor : `${valor}T00:00:00`);
    if (Number.isNaN(fechaPlaneacion.getTime())) return String(valor);

    return new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(fechaPlaneacion);
};

export const formatearPromedio = (valor) => Number(valor).toFixed(2);

export const normalizarClases = (data) => data || [];

export const normalizarNotas = (data) => data || [];

export const normalizarInasistencias = (data) =>
    Array.isArray(data) ? data : data ? [data] : [];

export const contieneAsignacion = (clases, asignacionId) =>
    new Set(clases.map((clase) => String(clase.id))).has(String(asignacionId));

export const construirHorarioProfesor = (clases) =>
    clases.map((asignacion) => ({
        id: asignacion.id,
        horario_id: asignacion.horario_id || asignacion.id,
        materia: asignacion.materia,
        curso: asignacion.curso,
        curso_id: asignacion.curso_id,
        jornada: asignacion.jornada,
        dia: asignacion.dia,
        hora_inicio: asignacion.hora_inicio,
        hora_fin: asignacion.hora_fin,
    }));

// Una asignación repetida en varios días ocupa una sola opción del selector.
export const deduplicarClases = (clases) => {
    const vistos = new Map();
    for (const clase of clases) {
        const cursoKey =
            clase.curso_id || `${(clase.curso || "").trim().toLowerCase()}|${obtenerJornadaClase(clase)}`;
        const key = `${cursoKey}|${(clase.materia || "").trim().toLowerCase()}`;
        if (!vistos.has(key)) {
            vistos.set(key, clase);
        }
    }
    return Array.from(vistos.values());
};

export const buscarClasePorAsignacion = (clasesUnicas, asignacionId) =>
    clasesUnicas.find((clase) => String(clase.id) === String(asignacionId)) || null;

export const obtenerCursosProfesor = (clases) => {
    const vistos = new Map();
    for (const clase of clases) {
        if (!clase.curso_id) continue;
        const key = String(clase.curso_id);
        if (!vistos.has(key)) {
            vistos.set(key, {
                id: clase.curso_id,
                nombre: clase.curso,
                jornada: obtenerJornadaClase(clase),
            });
        }
    }
    return Array.from(vistos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export const obtenerMateriasDelCurso = (clasesUnicas, cursoId) =>
    clasesUnicas
        .filter((clase) => String(clase.curso_id) === String(cursoId))
        .sort((a, b) => (a.materia || "").localeCompare(b.materia || ""));

export const nombreCursoFiltro = (cursos, cursoId) => {
    const curso = cursos.find((item) => String(item.id) === String(cursoId));
    return curso ? `${curso.nombre} - ${curso.jornada}` : "Curso";
};

export const nombreMateriaFiltro = (materias, materiaId) => {
    if (materiaId === MATERIA_TODAS) return "Todas las materias";
    return (
        materias.find((clase) => String(clase.id) === String(materiaId))?.materia || "Materia"
    );
};

export const ordenarClasesConHorario = (horarioAsignado) =>
    horarioAsignado
        .filter((clase) => clase.dia && clase.hora_inicio && clase.hora_fin)
        .sort((a, b) => {
            const diaA = obtenerOrdenDia(a.dia);
            const diaB = obtenerOrdenDia(b.dia);
            if (diaA !== diaB) return diaA - diaB;
            return ordenarPorHora(a, b);
        });

export const agruparClasesPorJornada = (clasesConHorario) =>
    JORNADAS.reduce((acc, jornada) => {
        acc[jornada] = clasesConHorario.filter((clase) => obtenerJornadaClase(clase) === jornada);
        return acc;
    }, {});

export const agruparHorarioPorJornada = (clasesPorJornada) =>
    JORNADAS.reduce((acc, jornada) => {
        acc[jornada] = DIAS_SEMANA.reduce((dias, dia) => {
            dias[dia] = clasesPorJornada[jornada].filter((clase) => clase.dia === dia);
            return dias;
        }, {});
        return acc;
    }, {});

export const tieneDosJornadas = (clasesPorJornada) =>
    JORNADAS.every((jornada) => clasesPorJornada[jornada].length > 0);

export const obtenerJornadasDisponibles = (clasesPorJornada) =>
    JORNADAS.filter((jornada) => clasesPorJornada[jornada].length > 0);

export const obtenerJornadasVisibles = (filtroJornada, clasesPorJornada) =>
    filtroJornada === FILTRO_JORNADA_AMBAS || !clasesPorJornada[filtroJornada]?.length
        ? obtenerJornadasDisponibles(clasesPorJornada)
        : [filtroJornada];

export const construirParametrosRendimiento = (cursoId, materiaId) => {
    const params = { curso_id: cursoId };
    if (materiaId !== MATERIA_TODAS) {
        params.asignacion_id = materiaId;
    }
    return params;
};

export const normalizarPlaneacionesRecientes = (data) =>
    Array.isArray(data) ? data.slice(0, LIMITE_PLANEACIONES_RECIENTES) : [];

export const buscarPlaneacion = (planeaciones, planId) =>
    planeaciones.find((item) => String(item.id) === String(planId));

export const construirRutaPlaneacion = (asignacionId, plan) => {
    if (!plan?.fecha) return "";

    const params = new URLSearchParams({
        asignacion_id: String(asignacionId),
        fecha: String(plan.fecha).split("T")[0],
        presentacion: "1",
    });

    return `/plan-de-clases?${params.toString()}`;
};

const MEDALLAS_PODIO = ["🥇 1", "🥈 2", "🥉 3"];

export const etiquetaPuestoMejorRendimiento = (index) => MEDALLAS_PODIO[index] ?? index + 1;

// ── Reglas de clase ─────────────────────────────────────────────────────────

export const JORNADA_ESTILOS = {
    Mañana: {
        panel: "border-sky-200",
        header: "bg-sky-50 text-sky-900",
        badge: "bg-sky-100 text-sky-800",
        rango: "06:30 - 12:30",
    },
    Tarde: {
        panel: "border-orange-200",
        header: "bg-orange-50 text-orange-900",
        badge: "bg-orange-100 text-orange-800",
        rango: "12:30 - 18:30",
    },
};

const JORNADA_SELECTOR_ESTILOS = {
    Mañana: { icono: "☀" },
    Tarde: { icono: "◐" },
};

export const iconoJornada = (jornada) => JORNADA_SELECTOR_ESTILOS[jornada]?.icono;

const HORARIO_DIA_ESTILOS = {
    Lunes: {
        panel: "border-purple-400 bg-purple-50/20",
        header: "bg-purple-700",
        headerMobile: "text-purple-900",
        card: "border-l-purple-600 hover:border-purple-300",
        time: "text-purple-700",
    },
    Martes: {
        panel: "border-emerald-400 bg-emerald-50/20",
        header: "bg-emerald-700",
        headerMobile: "text-emerald-900",
        card: "border-l-emerald-600 hover:border-emerald-300",
        time: "text-emerald-700",
    },
    Miércoles: {
        panel: "border-amber-400 bg-amber-50/20",
        header: "bg-amber-600",
        headerMobile: "text-amber-900",
        card: "border-l-amber-600 hover:border-amber-300",
        time: "text-amber-700",
    },
    Jueves: {
        panel: "border-rose-400 bg-rose-50/20",
        header: "bg-rose-700",
        headerMobile: "text-rose-900",
        card: "border-l-rose-600 hover:border-rose-300",
        time: "text-rose-700",
    },
    Viernes: {
        panel: "border-slate-400 bg-slate-50/40",
        header: "bg-slate-700",
        headerMobile: "text-slate-900",
        card: "border-l-slate-600 hover:border-slate-400",
        time: "text-slate-700",
    },
};

const HORARIO_DIA_ESTILO_BASE = {
    panel: "border-gray-200 bg-gray-50",
    header: "bg-purple-700",
    headerMobile: "text-gray-800",
    card: "border-l-purple-500 hover:border-purple-200",
    time: "text-purple-700",
};

export const obtenerEstiloHorarioDia = (dia) =>
    HORARIO_DIA_ESTILOS[dia] || HORARIO_DIA_ESTILO_BASE;

// Con una sola jornada, la insignia del encabezado toma la que tenga clases.
export const jornadaUnicaDe = (clasesPorJornada) =>
    clasesPorJornada[JORNADA_MANANA].length > 0 ? JORNADA_MANANA : JORNADA_TARDE;

// El color del promedio bajo lo decide el campo `color` que envía el backend.
export const claseNotaBaja = (color) =>
    color === "red" ? "text-red-500" : color === "yellow" ? "text-yellow-500" : "text-green-500";
