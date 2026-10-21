// Los pesos colombianos sin centavos: "$ 1.500.000". Decidido con el usuario
// el 2026-10-21 para Nómina, Préstamos y Egresos; es el mismo formato que ya
// usa Cartera (`utils/carteraTiposPago/formatos.js`, `formatMoney`). Vive aquí
// porque es de más de un módulo (regla del CLAUDE.md).
const FORMATO_PESOS = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

// Lo vacío o lo que no es un número se muestra como $ 0.
export const formatearPesos = (valor) => {
    const numero = Number(valor);
    return FORMATO_PESOS.format(Number.isFinite(numero) ? numero : 0);
};
