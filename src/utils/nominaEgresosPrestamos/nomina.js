const aNumero = (valor) => parseFloat(valor) || 0;

export const estadoInicialPagoNomina = (empleado) => ({
    salarioBase: String(empleado.sueldo ?? 0),
    bonificaciones: "0",
    abonoPrestamo: "0",
    otrosDescuentos: "0",
    notas: "",
});

export const calcularTotalNomina = ({
    salarioBase,
    bonificaciones,
    abonoPrestamo,
    otrosDescuentos,
}) =>
    (aNumero(salarioBase) + aNumero(bonificaciones)) -
    (aNumero(abonoPrestamo) + aNumero(otrosDescuentos));

export const validarPagoNomina = ({
    empleado,
    salarioBase,
    bonificaciones,
    abonoPrestamo,
    otrosDescuentos,
}) => {
    const total = calcularTotalNomina({
        salarioBase,
        bonificaciones,
        abonoPrestamo,
        otrosDescuentos,
    });

    if (total < 0) {
        return "El total a pagar no puede ser negativo.";
    }

    const abono = aNumero(abonoPrestamo);
    if (abono > empleado.saldo_prestamos) {
        return `El abono al préstamo ($${abono}) no puede ser mayor que su deuda pendiente ($${empleado.saldo_prestamos}).`;
    }

    return null;
};

export const construirPayloadNomina = ({
    empleado,
    salarioBase,
    bonificaciones,
    abonoPrestamo,
    otrosDescuentos,
    notas,
}) => ({
    profesor_id: empleado.id,
    salario_base: parseFloat(salarioBase),
    deduccion_prestamos: aNumero(abonoPrestamo),
    otros_descuentos: aNumero(otrosDescuentos),
    bonificaciones: aNumero(bonificaciones),
    notas,
});

// La tabla y el modal pintan la misma regla con dos paletas distintas.
export const claseSaldoEmpleado = (saldo) =>
    saldo > 0 ? "text-red-600" : "text-green-600";

export const claseDeudaEmpleado = (saldo) =>
    saldo > 0 ? "text-red-500" : "text-green-500";

export const tieneDeudaDePrestamos = (empleado) => empleado.saldo_prestamos > 0;

export const puedeAbonarAPrestamos = (empleado) => empleado.saldo_prestamos !== 0;

export const hayBusquedaDeHistorial = (busqueda) => busqueda.trim() !== "";

export const filtrarHistorialNomina = (historial, busqueda) =>
    hayBusquedaDeHistorial(busqueda)
        ? historial.filter((pago) =>
            pago.profesor.toLowerCase().includes(busqueda.toLowerCase())
        )
        : [];

// El historial nombra a cada persona "Apellido Nombre", igual que la tabla.
export const busquedaHistorialDeEmpleado = (empleado) =>
    `${empleado.apellido ?? ""} ${empleado.nombre ?? ""}`.trim();

// Los mensajes escriben los pesos como ya lo hacen las confirmaciones de
// egresos y préstamos: formato colombiano con dos decimales.
const pesos = (valor) =>
    `$${aNumero(valor).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

// "ana pérez" → "Ana Pérez". La tabla y el modal ponen las mayúsculas con CSS,
// pero una ventana de aviso muestra el texto tal cual llega.
const nombreParaMensaje = (empleado) =>
    `${empleado.nombre ?? ""} ${empleado.apellido ?? ""}`
        .trim()
        .split(/\s+/)
        .map((palabra) => palabra.charAt(0).toLocaleUpperCase("es-CO") + palabra.slice(1))
        .join(" ");

export const mensajeConfirmacionPagoNomina = ({
    empleado,
    salarioBase,
    bonificaciones,
    abonoPrestamo,
    otrosDescuentos,
}) =>
    [
        nombreParaMensaje(empleado),
        "",
        `Salario base: ${pesos(salarioBase)}`,
        `Bonos: ${pesos(bonificaciones)}`,
        `Abono a préstamos: ${pesos(abonoPrestamo)}`,
        `Otras deducciones: ${pesos(otrosDescuentos)}`,
        `Total neto a depositar: ${pesos(
            calcularTotalNomina({ salarioBase, bonificaciones, abonoPrestamo, otrosDescuentos })
        )}`,
        "",
        "No se puede anular desde la aplicación y también quedará registrado como egreso.",
    ].join("\n");

export const mensajeExitoPagoNomina = ({
    empleado,
    nominaId,
    salarioBase,
    bonificaciones,
    abonoPrestamo,
    otrosDescuentos,
}) => {
    const total = calcularTotalNomina({
        salarioBase,
        bonificaciones,
        abonoPrestamo,
        otrosDescuentos,
    });
    const referencia = nominaId ? `Pago #N-${nominaId}` : "Pago";
    const lineas = [`${referencia} a ${nombreParaMensaje(empleado)} por ${pesos(total)}.`];
    if (aNumero(abonoPrestamo) > 0) {
        lineas.push(`Se abonaron ${pesos(abonoPrestamo)} a sus préstamos.`);
    }
    lineas.push("También quedó registrado como egreso.");
    return lineas.join("\n");
};

// El pago es una sola transacción en el backend: si respondió con un error, no
// se guardó nada. Si no respondió, o contestó un intermediario porque el
// servidor no lo hizo, no se sabe: el pago pudo quedar guardado.
const ESTADOS_SIN_CERTEZA = [502, 503, 504];

const MENSAJE_RECHAZO_GENERICO =
    "El servidor no pudo registrar el pago. No se guardó nada; puedes intentarlo de nuevo.";

export const avisoErrorPagoNomina = (error) => {
    const respuesta = error?.response;
    if (!respuesta || ESTADOS_SIN_CERTEZA.includes(respuesta.status)) {
        return {
            incierto: true,
            titulo: "No sabemos si el pago quedó registrado",
            texto:
                "Se perdió la comunicación con el servidor antes de recibir su respuesta.\n\n" +
                "Antes de intentarlo de nuevo, revisa en el historial si el pago ya aparece.",
        };
    }

    // Un 500 trae el texto interno del error: no se le muestra al usuario.
    const detalle = respuesta.data?.detail;
    const explicacion =
        respuesta.status < 500 && typeof detalle === "string" && detalle.trim()
            ? `${detalle}\n\nNo se guardó nada.`
            : MENSAJE_RECHAZO_GENERICO;

    return { incierto: false, titulo: "No se registró el pago", texto: explicacion };
};
