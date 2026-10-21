import { esRespuestaIncierta, explicacionDelRechazo, pesosEnMensaje } from "./avisos";

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

// La pregunta (registrar o actualizar) va en el título de la ventana; este es
// el cuerpo.
export const mensajeConfirmacionEgreso = (egreso) =>
    `Concepto: ${egreso.concepto}\nMonto: ${pesosEnMensaje(egreso.monto)}\nFecha: ${egreso.fecha}\nCategoría: ${egreso.categoria}`;

// Registrar mueve el filtro al día del egreso: el aviso lo dice.
export const mensajeExitoEgreso = (egreso, editando) =>
    editando
        ? `«${egreso.concepto}» quedó con ${pesosEnMensaje(egreso.monto)}, fecha ${egreso.fecha} y categoría ${egreso.categoria}.`
        : `«${egreso.concepto}» por ${pesosEnMensaje(egreso.monto)} quedó registrado con fecha ${egreso.fecha}.\nAbajo ves los egresos de ese día.`;

export const totalEgresos = (egresos) =>
    egresos.reduce((acc, egreso) => acc + Number(egreso.monto || 0), 0);

export const avisoErrorGuardarEgreso = (error, editando) => {
    if (esRespuestaIncierta(error)) {
        return {
            incierto: true,
            titulo: editando
                ? "No sabemos si el cambio quedó guardado"
                : "No sabemos si el egreso quedó registrado",
            texto:
                "Se perdió la comunicación con el servidor antes de recibir su respuesta.\n\n" +
                (editando
                    ? "Recargamos el historial: revisa el egreso antes de intentarlo de nuevo."
                    : "Abajo ves los egresos de ese día: revisa si ya aparece antes de intentarlo de nuevo."),
        };
    }
    const explicacion = explicacionDelRechazo(error);
    return {
        incierto: false,
        titulo: editando ? "No se guardaron los cambios" : "No se registró el egreso",
        texto: explicacion
            ? `${explicacion}\n\nNo se guardó nada.`
            : "El servidor no pudo guardar el egreso. No se guardó nada; puedes intentarlo de nuevo.",
    };
};
