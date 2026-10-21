// Contratos de los avisos que comparten nómina, egresos y préstamos: los tres
// guardan con la misma regla y escriben los pesos igual en sus mensajes.

const aNumero = (valor) => parseFloat(valor) || 0;

// Los pesos de los mensajes: formato colombiano con dos decimales.
export const pesosEnMensaje = (valor) =>
    `$${aNumero(valor).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

// Cada guardado de este módulo es una sola transacción en el backend: si
// respondió con un error, no se guardó nada. Si no respondió, o contestó un
// intermediario porque el servidor no lo hizo, no se sabe: pudo guardarse.
const ESTADOS_SIN_CERTEZA = [502, 503, 504];

export const esRespuestaIncierta = (error) =>
    !error?.response || ESTADOS_SIN_CERTEZA.includes(error.response.status);

// La explicación del backend solo se muestra cuando es un rechazo con texto
// (un 4xx): el texto de un 500 es interno y una lista es un error de formato.
export const explicacionDelRechazo = (error) => {
    const respuesta = error?.response;
    const detalle = respuesta?.data?.detail;
    return respuesta && respuesta.status < 500 && typeof detalle === "string" && detalle.trim()
        ? detalle
        : null;
};
