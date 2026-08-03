export const formatMoney = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

export const formatDate = (value) => {
    if (!value) return "—";
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) return String(value).slice(0, 10);
    return fecha.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
};

export const nombreCompleto = (item) =>
    `${item?.apellido || ""} ${item?.nombre || ""}`.trim().replace(/\s+/g, " ");
