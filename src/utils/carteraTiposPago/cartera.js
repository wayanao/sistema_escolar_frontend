export const calcularTotalesCartera = (lista) =>
    lista.reduce(
        (acc, item) => ({
            total: acc.total + Number(item.total || 0),
            academica: acc.academica + Number(item.deuda_academica || 0),
            inventario: acc.inventario + Number(item.deuda_inventario || 0),
            mora: acc.mora + Number(item.mora || 0),
            cuotas: acc.cuotas + Number(item.cuotas_vencidas || 0),
        }),
        { total: 0, academica: 0, inventario: 0, mora: 0, cuotas: 0 }
    );

export const calcularTotalesCarteraVisible = (lista) =>
    lista.reduce(
        (acc, item) => ({
            total: acc.total + item.total,
            academica: acc.academica + item.deuda_academica,
            inventario: acc.inventario + item.deuda_inventario,
            mora: acc.mora + item.mora,
        }),
        { total: 0, academica: 0, inventario: 0, mora: 0 }
    );

export const obtenerCursosUnicos = (items) => {
    const cursos = new Map();
    items.forEach((item) => cursos.set(item.curso_id, item.curso_nombre));
    return Array.from(cursos.entries()).map(([id, nombre]) => ({ id, nombre }));
};

export const filtrarCartera = (
    items,
    { busqueda = "", filtroCurso = "", filtroTipo = "todos" }
) => {
    const consulta = busqueda.trim().toLowerCase();
    return items.filter((item) => {
        if (filtroCurso && String(item.curso_id) !== String(filtroCurso)) return false;
        if (filtroTipo === "academica" && item.deuda_academica <= 0) return false;
        if (filtroTipo === "inventario" && item.deuda_inventario <= 0) return false;
        if (filtroTipo === "mora" && item.mora <= 0) return false;
        if (consulta) {
            const texto = `${item.nombre} ${item.apellido} ${item.curso_nombre}`.toLowerCase();
            if (!texto.includes(consulta)) return false;
        }
        return true;
    });
};

export const obtenerMaxDeuda = (items) =>
    Math.max(...items.map((item) => item.total), 1);

export const construirCsvCartera = (items) => {
    const headers = [
        "Estudiante",
        "Curso",
        "Deuda Académica",
        "Deuda Inventario",
        "Mora",
        "Total",
        "Cuotas Vencidas",
    ];
    const lines = [headers.join(",")];
    items.forEach((item) => {
        lines.push(
            [
                `"${item.apellido} ${item.nombre}"`,
                `"${item.curso_nombre}"`,
                item.deuda_academica,
                item.deuda_inventario,
                item.mora,
                item.total,
                item.cuotas_vencidas,
            ].join(",")
        );
    });
    return lines.join("\n");
};
