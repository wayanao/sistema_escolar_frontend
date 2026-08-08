export const CATEGORIAS_EGRESO = [
    "Compras Institucionales",
    "Pago de Servicios",
    "Mantenimiento",
    "Otros",
];

export const CATEGORIA_EGRESO_INICIAL = "Compras Institucionales";

export const CATEGORIA_EGRESO_RESPALDO = "Otros";

export const obtenerFechaLocal = (ahora) => {
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
};

export const normalizarListaEgresos = (data) => (Array.isArray(data) ? data : []);

export const construirParametrosEgresos = (fechaDesde, fechaHasta) => ({
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
});

export const rangoDeFechasInvertido = (fechaDesde, fechaHasta) =>
    Boolean(fechaDesde && fechaHasta && fechaDesde > fechaHasta);

export const puedeEditarEgreso = (egreso) =>
    egreso.editable !== false && egreso.origen === "manual";

export const formularioDesdeEgreso = (egreso) => ({
    concepto: egreso.concepto || "",
    monto: String(egreso.monto ?? ""),
    fecha: String(egreso.fecha || "").split("T")[0],
    categoria: egreso.categoria || CATEGORIA_EGRESO_RESPALDO,
    notas: egreso.notas || "",
});

// El egreso normalizado es hoy exactamente el cuerpo que aceptan
// POST /api/egresos/ y PUT /api/egresos/:id.
export const normalizarEgreso = (
    { concepto, monto, fecha, categoria, notas },
    fechaPorDefecto
) => ({
    concepto: concepto.trim(),
    monto: Number(monto),
    fecha: fecha || fechaPorDefecto,
    categoria: categoria.trim(),
    notas: notas.trim(),
});

export const validarEgreso = ({ concepto, monto, categoria }) => {
    if (!concepto) {
        return "Debes escribir el concepto del egreso.";
    }

    if (!Number.isFinite(monto) || monto <= 0) {
        return "El monto del egreso debe ser mayor que 0.";
    }

    if (!categoria) {
        return "Debes seleccionar una categoría.";
    }

    return null;
};

export const mensajeConfirmacionEgreso = (egreso, editando) => {
    const accion = editando ? "actualizar" : "registrar";
    const monto = egreso.monto.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `¿Seguro que deseas ${accion} este egreso?\n\nConcepto: ${egreso.concepto}\nMonto: $${monto}\nFecha: ${egreso.fecha}\nCategoría: ${egreso.categoria}`;
};

export const totalEgresos = (egresos) =>
    egresos.reduce((acc, egreso) => acc + Number(egreso.monto || 0), 0);

export const mensajeErrorGuardarEgreso = (error) =>
    error.response?.data?.detail || "No se pudo guardar el egreso.";
