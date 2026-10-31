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

// Lo que se escribe en un campo de pesos (`components/CampoPesos.jsx`): solo
// los dígitos. El punto y la coma se ignoran, así "150.000" y "150,000" son
// ciento cincuenta mil y no 150. Pesos enteros, como los muestra formatearPesos.
export const limpiarPesos = (texto) =>
    String(texto ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");

const esVacio = (valor) => valor === "" || valor === null || valor === undefined;

// El valor del estado ("150000", 150000 o "150000.00") con puntos de miles:
// "150.000". Lo vacío queda vacío para que se vea el ejemplo del campo.
export const separarMiles = (valor) => {
    if (esVacio(valor)) return "";
    const texto = String(valor);
    const numero = Number(texto);
    const digitos = /^\d+$/.test(texto) || !Number.isFinite(numero)
        ? limpiarPesos(texto)
        : String(Math.round(numero));
    return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Dónde queda el cursor después de poner los puntos: detrás del mismo número
// de dígitos que tenía antes, para que no salte al final al corregir en medio.
export const posicionTrasDigitos = (texto, digitos) => {
    if (digitos <= 0) return 0;
    let vistos = 0;
    for (let indice = 0; indice < texto.length; indice += 1) {
        if (/\d/.test(texto[indice])) {
            vistos += 1;
            if (vistos === digitos) return indice + 1;
        }
    }
    return texto.length;
};

// Un campo de texto no tiene `min` ni `max`: este es el aviso que muestra el
// navegador al enviar si el valor se sale del rango, o "" si está bien.
export const avisoRangoPesos = (valor, { min, max } = {}) => {
    if (esVacio(valor)) return "";
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "";
    if (!esVacio(min) && numero < Number(min)) {
        return `El valor mínimo es ${formatearPesos(min)}.`;
    }
    if (!esVacio(max) && numero > Number(max)) {
        return `El valor máximo es ${formatearPesos(max)}.`;
    }
    return "";
};
