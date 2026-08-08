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
