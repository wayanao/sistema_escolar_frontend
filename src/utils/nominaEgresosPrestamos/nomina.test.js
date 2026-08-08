import { describe, expect, it } from "vitest";
import {
    calcularTotalNomina,
    claseDeudaEmpleado,
    claseSaldoEmpleado,
    construirPayloadNomina,
    estadoInicialPagoNomina,
    filtrarHistorialNomina,
    hayBusquedaDeHistorial,
    puedeAbonarAPrestamos,
    tieneDeudaDePrestamos,
    validarPagoNomina,
} from "./nomina";

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

    it("rechaza un abono mayor que la deuda pendiente e interpola los montos sin formatear", () => {
        expect(
            validarPagoNomina({
                empleado,
                salarioBase: "1500",
                bonificaciones: "0",
                abonoPrestamo: "500",
                otrosDescuentos: "0",
            })
        ).toBe(
            "El abono al préstamo ($500) no puede ser mayor que su deuda pendiente ($400)."
        );
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
