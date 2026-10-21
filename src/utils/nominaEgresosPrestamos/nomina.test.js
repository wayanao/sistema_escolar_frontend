import { describe, expect, it } from "vitest";
import { formatearPesos } from "../formatoPesos";
import {
    avisoErrorPagoNomina,
    busquedaHistorialDeEmpleado,
    calcularTotalNomina,
    claseDeudaEmpleado,
    claseSaldoEmpleado,
    construirPayloadNomina,
    estadoInicialPagoNomina,
    filtrarHistorialNomina,
    hayBusquedaDeHistorial,
    mensajeConfirmacionPagoNomina,
    mensajeExitoPagoNomina,
    problemasPagoNomina,
    puedeAbonarAPrestamos,
    tieneDeudaDePrestamos,
    validarPagoNomina,
} from "./nomina";

// Los mensajes escriben los pesos sin centavos (decisión del 2026-10-21).
const pesos = formatearPesos;

const empleado = { id: 1, nombre: "ana", apellido: "pérez", sueldo: 1500, saldo_prestamos: 400 };

const formulario = {
    salarioBase: "1500",
    bonificaciones: "100",
    abonoPrestamo: "50",
    otrosDescuentos: "25",
    notas: "Marzo 2026",
};

describe("utilidades de nómina", () => {
    it("usa el sueldo del empleado como salario base inicial", () => {
        expect(estadoInicialPagoNomina(empleado)).toEqual({
            salarioBase: "1500",
            bonificaciones: "0",
            abonoPrestamo: "0",
            otrosDescuentos: "0",
            notas: "",
        });
    });

    it("respalda con cero un sueldo ausente o nulo", () => {
        expect(estadoInicialPagoNomina({ sueldo: null }).salarioBase).toBe("0");
        expect(estadoInicialPagoNomina({}).salarioBase).toBe("0");
        expect(estadoInicialPagoNomina({ sueldo: 0 }).salarioBase).toBe("0");
    });

    it("suma bonos y resta abono y deducciones", () => {
        expect(calcularTotalNomina(formulario)).toBe(1525);
    });

    it("trata como cero cualquier campo vacío o no numérico", () => {
        expect(
            calcularTotalNomina({
                salarioBase: "1000",
                bonificaciones: "",
                abonoPrestamo: "abc",
                otrosDescuentos: undefined,
            })
        ).toBe(1000);
    });

    it("rechaza un neto negativo", () => {
        expect(
            validarPagoNomina({
                empleado,
                salarioBase: "100",
                bonificaciones: "0",
                abonoPrestamo: "0",
                otrosDescuentos: "500",
            })
        ).toBe("El total a pagar no puede ser negativo.");
    });

    it("rechaza un abono mayor que la deuda pendiente, con los montos en pesos", () => {
        expect(
            validarPagoNomina({
                empleado,
                salarioBase: "1500",
                bonificaciones: "0",
                abonoPrestamo: "500",
                otrosDescuentos: "0",
            })
        ).toBe(
            `El abono al préstamo (${pesos(500)}) no puede ser mayor que su deuda pendiente (${pesos(400)}).`
        );
    });

    it("dice campo por campo lo que hoy impide pagar, para avisarlo mientras se escribe", () => {
        expect(problemasPagoNomina({ empleado, ...formulario })).toEqual({
            abono: null,
            total: null,
        });
        expect(
            problemasPagoNomina({
                empleado,
                salarioBase: "100",
                bonificaciones: "0",
                abonoPrestamo: "500",
                otrosDescuentos: "0",
            })
        ).toEqual({
            abono: `No puede ser mayor que la deuda (${pesos(400)}).`,
            total: "El total a pagar no puede ser negativo.",
        });
    });

    it("acepta un abono igual a la deuda pendiente", () => {
        expect(
            validarPagoNomina({
                empleado,
                salarioBase: "1500",
                bonificaciones: "0",
                abonoPrestamo: "400",
                otrosDescuentos: "0",
            })
        ).toBeNull();
    });

    it("acepta un pago válido", () => {
        expect(validarPagoNomina({ empleado, ...formulario })).toBeNull();
    });

    it("construye el payload del pago con los nombres del backend", () => {
        expect(construirPayloadNomina({ empleado, ...formulario })).toEqual({
            profesor_id: 1,
            salario_base: 1500,
            deduccion_prestamos: 50,
            otros_descuentos: 25,
            bonificaciones: 100,
            notas: "Marzo 2026",
        });
    });

    it("conserva que solo el salario base viaja sin respaldo numérico", () => {
        const payload = construirPayloadNomina({
            empleado,
            salarioBase: "",
            bonificaciones: "",
            abonoPrestamo: "",
            otrosDescuentos: "",
            notas: "",
        });

        expect(payload.salario_base).toBeNaN();
        expect(payload.deduccion_prestamos).toBe(0);
        expect(payload.otros_descuentos).toBe(0);
        expect(payload.bonificaciones).toBe(0);
    });

    it("oculta el historial mientras no haya texto buscado", () => {
        const historial = [{ id: 1, profesor: "Pérez Ana" }];

        expect(hayBusquedaDeHistorial("   ")).toBe(false);
        expect(filtrarHistorialNomina(historial, "")).toEqual([]);
        expect(filtrarHistorialNomina(historial, "   ")).toEqual([]);
    });

    it("pinta el saldo con dos paletas distintas en la tabla y en el modal", () => {
        expect(claseSaldoEmpleado(400)).toBe("text-red-600");
        expect(claseSaldoEmpleado(0)).toBe("text-green-600");
        expect(claseDeudaEmpleado(400)).toBe("text-red-500");
        expect(claseDeudaEmpleado(0)).toBe("text-green-500");
    });

    it("solo ofrece la ayuda de máximo y el abono cuando hay deuda", () => {
        expect(tieneDeudaDePrestamos({ saldo_prestamos: 400 })).toBe(true);
        expect(tieneDeudaDePrestamos({ saldo_prestamos: 0 })).toBe(false);
        expect(puedeAbonarAPrestamos({ saldo_prestamos: 400 })).toBe(true);
        expect(puedeAbonarAPrestamos({ saldo_prestamos: 0 })).toBe(false);
    });

    it("filtra el historial sin distinguir mayúsculas y sin recortar la búsqueda", () => {
        const historial = [
            { id: 1, profesor: "Pérez Ana" },
            { id: 2, profesor: "Gómez Luis" },
        ];

        expect(filtrarHistorialNomina(historial, "PÉREZ")).toEqual([historial[0]]);
        expect(filtrarHistorialNomina(historial, "zzz")).toEqual([]);
        expect(filtrarHistorialNomina(historial, " ana")).toEqual([historial[0]]);
        expect(filtrarHistorialNomina(historial, "ana ")).toEqual([]);
    });
});

describe("mensajes al registrar un pago de nómina", () => {
    it("resume el pago antes de confirmarlo, con el nombre en mayúsculas y los pesos colombianos", () => {
        expect(mensajeConfirmacionPagoNomina({ empleado, ...formulario })).toBe(
            [
                "Ana Pérez",
                "",
                `Salario base: ${pesos(1500)}`,
                `Bonos: ${pesos(100)}`,
                `Abono a préstamos: ${pesos(50)}`,
                `Otras deducciones: ${pesos(25)}`,
                `Total neto a depositar: ${pesos(1525)}`,
                "",
                "No se puede anular desde la aplicación y también quedará registrado como egreso.",
            ].join("\n")
        );
    });

    it("muestra en cero los campos vacíos del resumen", () => {
        const texto = mensajeConfirmacionPagoNomina({
            empleado,
            salarioBase: "1500",
            bonificaciones: "",
            abonoPrestamo: "",
            otrosDescuentos: "",
        });

        expect(texto).toContain(`Bonos: ${pesos(0)}`);
        expect(texto).toContain(`Total neto a depositar: ${pesos(1500)}`);
    });

    it("dice al terminar el número del pago, a quién, cuánto y cuánto se abonó", () => {
        expect(mensajeExitoPagoNomina({ empleado, nominaId: 77, ...formulario })).toBe(
            [
                `Pago #N-77 a Ana Pérez por ${pesos(1525)}.`,
                `Se abonaron ${pesos(50)} a sus préstamos.`,
                "También quedó registrado como egreso.",
            ].join("\n")
        );
    });

    it("no habla de préstamos cuando no hubo abono, ni de número si el backend no lo envió", () => {
        const texto = mensajeExitoPagoNomina({
            empleado,
            nominaId: null,
            ...formulario,
            abonoPrestamo: "0",
        });

        expect(texto).toBe(
            [`Pago a Ana Pérez por ${pesos(1575)}.`, "También quedó registrado como egreso."].join("\n")
        );
    });

    it("sin respuesta del servidor no se sabe si el pago quedó guardado", () => {
        const aviso = avisoErrorPagoNomina(new Error("Network Error"));

        expect(aviso.incierto).toBe(true);
        expect(aviso.titulo).toBe("No sabemos si el pago quedó registrado");
        expect(aviso.texto).toContain("revisa en el historial");
    });

    it("tampoco se sabe cuando responde un intermediario porque el servidor no contestó", () => {
        for (const status of [502, 503, 504]) {
            expect(avisoErrorPagoNomina({ response: { status } }).incierto).toBe(true);
        }
    });

    it("un error del servidor dice que no se guardó nada y no muestra su texto interno", () => {
        const aviso = avisoErrorPagoNomina({
            response: { status: 500, data: { detail: "Error al procesar pago: psycopg2 boom" } },
        });

        expect(aviso.incierto).toBe(false);
        expect(aviso.titulo).toBe("No se registró el pago");
        expect(aviso.texto).toBe(
            "El servidor no pudo registrar el pago. No se guardó nada; puedes intentarlo de nuevo."
        );
        expect(aviso.texto).not.toContain("psycopg2");
    });

    it("un rechazo con explicación del backend la muestra y aclara que no se guardó nada", () => {
        const aviso = avisoErrorPagoNomina({
            response: { status: 403, data: { detail: "El colegio está suspendido." } },
        });

        expect(aviso).toEqual({
            incierto: false,
            titulo: "No se registró el pago",
            texto: "El colegio está suspendido.\n\nNo se guardó nada.",
        });
    });

    it("un rechazo con una lista de errores de formato no la muestra cruda", () => {
        const aviso = avisoErrorPagoNomina({
            response: { status: 422, data: { detail: [{ loc: ["body"], msg: "x" }] } },
        });

        expect(aviso.texto).toBe(
            "El servidor no pudo registrar el pago. No se guardó nada; puedes intentarlo de nuevo."
        );
    });

    it("busca a la persona en el historial como la nombra el historial: Apellido Nombre", () => {
        const historial = [
            { id: 55, profesor: "pérez ana" },
            { id: 56, profesor: "gómez luis" },
        ];

        expect(busquedaHistorialDeEmpleado(empleado)).toBe("pérez ana");
        expect(filtrarHistorialNomina(historial, busquedaHistorialDeEmpleado(empleado))).toEqual([
            historial[0],
        ]);
    });
});
