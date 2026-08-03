export const TIPOS_COBRO = [
    { value: "unico", label: "Único", badge: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "mensual", label: "Mensual", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { value: "anual", label: "Anual", badge: "bg-purple-100 text-purple-800 border-purple-200" },
    { value: "opcional", label: "Opcional", badge: "bg-amber-100 text-amber-800 border-amber-200" },
];

export const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const FILTROS_ESTADO_CONCEPTO = [
    { value: "activo", label: "Activos" },
    { value: "inactivo", label: "Inactivos" },
    { value: "todos", label: "Todos" },
];

export const CONFIG_DEFAULT = {
    descripcion: "",
    tipo_cobro: "unico",
    fecha_limite: "",
    dia_limite_mes: "",
    dias_gracia: 0,
    mora_tipo: "",
    mora_valor: 0,
    mes_inicial: "",
    frecuencia_meses: 1,
    generacion_automatica: false,
    activo: true,
};

export const obtenerTipoCobro = (tipo) =>
    TIPOS_COBRO.find((item) => item.value === tipo) || TIPOS_COBRO[0];

export const evaluarEstadoCartera = (tipoPago) => {
    const tipoCobro = tipoPago.tipo_cobro || "unico";
    const activo = tipoPago.activo !== false;
    const cursosAsignados = (tipoPago.cursos || []).length;

    const razones = [];
    if (!activo) razones.push("está inactivo");
    if (tipoCobro === "opcional") razones.push("es opcional (se cobra solo bajo demanda)");
    if (cursosAsignados === 0) razones.push("no tiene cursos asignados");

    return {
        publicado: razones.length === 0,
        razones,
    };
};

export const crearConfiguracionDesdeDetalle = (data) => ({
    descripcion: data.descripcion ?? "",
    tipo_cobro: data.tipo_cobro ?? "unico",
    fecha_limite: data.fecha_limite ?? "",
    dia_limite_mes: data.dia_limite_mes ?? "",
    dias_gracia: data.dias_gracia ?? 0,
    mora_tipo: data.mora_tipo ?? "",
    mora_valor: data.mora_valor ?? 0,
    mes_inicial: data.mes_inicial ?? "",
    frecuencia_meses: data.frecuencia_meses ?? 1,
    generacion_automatica: !!data.generacion_automatica,
    activo: data.activo !== false,
});

export const crearCursosAsignadosDesdeDetalle = (data) =>
    (data.cursos || []).map((curso) => ({
        curso_id: curso.curso_id,
        curso_nombre: curso.curso_nombre,
        valor: curso.valor ?? 0,
        activo: curso.activo !== false,
    }));

export const crearPayloadTipoPago = (nombre, valor) => ({
    nombre: nombre.trim(),
    valor: parseFloat(valor) || 0,
});

export const crearPayloadConfiguracion = (config) => ({
    descripcion: config.descripcion?.trim() || null,
    tipo_cobro: config.tipo_cobro,
    fecha_limite: config.fecha_limite || null,
    dia_limite_mes: config.dia_limite_mes === "" ? null : Number(config.dia_limite_mes),
    dias_gracia: Number(config.dias_gracia) || 0,
    mora_tipo: config.mora_tipo || null,
    mora_valor: Number(config.mora_valor) || 0,
    mes_inicial: config.mes_inicial === "" ? null : Number(config.mes_inicial),
    frecuencia_meses: Number(config.frecuencia_meses) || 1,
    generacion_automatica: !!config.generacion_automatica,
    activo: !!config.activo,
});

export const crearPayloadCursos = (cursosAsignados) => ({
    cursos: cursosAsignados.map((curso) => ({
        curso_id: curso.curso_id,
        valor: Number(curso.valor) || 0,
        activo: !!curso.activo,
    })),
});

export const obtenerCursosDisponibles = (cursos, cursosAsignados) => {
    const asignados = new Set(cursosAsignados.map((curso) => curso.curso_id));
    return cursos.filter((curso) => !asignados.has(curso.id));
};

export const crearAsignacionCurso = (curso, valor, valorBase) => ({
    curso_id: curso.id,
    curso_nombre: curso.nombre,
    valor: valor !== "" ? Number(valor) : valorBase,
    activo: true,
});

export const agregarCursosFaltantes = (asignadosActuales, cursos, valorBase) => {
    const idsActuales = new Set(asignadosActuales.map((curso) => curso.curso_id));
    const nuevos = cursos
        .filter((curso) => !idsActuales.has(curso.id))
        .map((curso) => crearAsignacionCurso(curso, "", valorBase));
    return [...asignadosActuales, ...nuevos];
};

export const actualizarValorCursoAsignado = (cursosAsignados, cursoId, valor) =>
    cursosAsignados.map((curso) =>
        curso.curso_id === cursoId ? { ...curso, valor: Number(valor) || 0 } : curso
    );

export const toggleCursoAsignado = (cursosAsignados, cursoId) =>
    cursosAsignados.map((curso) =>
        curso.curso_id === cursoId ? { ...curso, activo: !curso.activo } : curso
    );

export const quitarCursoAsignado = (cursosAsignados, cursoId) =>
    cursosAsignados.filter((curso) => curso.curso_id !== cursoId);

export const calcularResumenEstados = (tiposPagos) => {
    const activos = tiposPagos.filter((tipoPago) => tipoPago.activo !== false).length;
    const inactivos = tiposPagos.filter((tipoPago) => tipoPago.activo === false).length;
    return { activo: activos, inactivo: inactivos, todos: tiposPagos.length };
};

export const filtrarTiposPagoPorEstado = (tiposPagos, estadoFiltro) => {
    if (estadoFiltro === "todos") return tiposPagos;
    const debeEstarActivo = estadoFiltro === "activo";
    return tiposPagos.filter((tipoPago) => (tipoPago.activo !== false) === debeEstarActivo);
};

export const obtenerMensajeConceptosVacios = (estadoFiltro) =>
    estadoFiltro === "activo"
        ? "No hay conceptos activos. Puedes revisar Inactivos o crear un nuevo concepto."
        : estadoFiltro === "inactivo"
            ? "No hay conceptos inactivos."
            : "No hay conceptos registrados.";

export const resumirAsignacionCursos = (cursos, cursosAsignados) => {
    const cursosActivos = cursos.filter((curso) => curso.estado !== "inactivo");
    const cursosAsignadosActivos = cursosAsignados.filter(
        (curso) => curso.activo !== false
    ).length;
    const totalCursosActivos = cursosActivos.length;
    return {
        cursosActivos,
        cursosAsignadosActivos,
        totalCursosActivos,
        cursosPendientes: Math.max(0, totalCursosActivos - cursosAsignadosActivos),
    };
};
