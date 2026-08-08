import { describe, expect, it } from "vitest";
import {
    claseEstadoPrestamo,
    construirParametrosPrestamos,
    construirPayloadPrestamo,
    ESTADO_PRESTAMO_PAGADO,
    ESTADO_PRESTAMO_PENDIENTE,
    fechaPrestamoPorDefecto,
    mensajeConfirmacionEstadoPrestamo,
    mensajeConfirmacionPrestamo,
    mensajeErrorCrearPrestamo,
    normalizarListaPrestamos,
    obtenerNombreProfesor,
    puedeSaldarPrestamo,
    totalPrestamosPendientes,
    validarPrestamo,
} from "./prestamos";

const profesores = [
    { id: 3, nombre: "Ana", apellido: "Pérez" },
    { id: 4, nombre: "Luis", apellido: "Gómez" },
];

const prestamos = [
    { id: 90, monto: 500000, estado: "Pendiente" },
    { id: 91, monto: 200000, estado: "Pagado" },
    { id: 92, monto: 300000, estado: "Pendiente" },
];

describe("utilidades de préstamos", () => {
    it("conserva los dos estados del dominio", () => {
        expect(ESTADO_PRESTAMO_PENDIENTE).toBe("Pendiente");
        expect(ESTADO_PRESTAMO_PAGADO).toBe("Pagado");
    });

    it("protege la lista contra respuestas que no son arreglos", () => {
        expect(normalizarListaPrestamos(prestamos)).toEqual(prestamos);
        expect(normalizarListaPrestamos(null)).toEqual([]);
    });

    it("envía el identificador del profesor tal como lo entrega el selector", () => {
        expect(construirParametrosPrestamos("3")).toEqual({ profesor_id: "3" });
    });

    it("resuelve el nombre del profesor comparando identificadores como texto", () => {
        expect(obtenerNombreProfesor(profesores, "3")).toBe("Pérez Ana");
        expect(obtenerNombreProfesor(profesores, 4)).toBe("Gómez Luis");
        expect(obtenerNombreProfesor(profesores, "99")).toBe("Profesor seleccionado");
        expect(obtenerNombreProfesor([], "3")).toBe("Profesor seleccionado");
    });

    it("conserva la fecha por defecto en UTC", () => {
        expect(fechaPrestamoPorDefecto(new Date("2026-08-08T02:30:00.000Z"))).toBe(
            "2026-08-08"
        );
    });

    it("exige profesor antes que monto", () => {
        expect(validarPrestamo({ profesorId: "", monto: 0 })).toBe(
            "Por favor, selecciona un profesor o trabajador."
        );
        expect(validarPrestamo({ profesorId: "3", monto: 0 })).toBe(
            "El monto del préstamo debe ser mayor que 0."
        );
        expect(validarPrestamo({ profesorId: "3", monto: Number("abc") })).toBe(
            "El monto del préstamo debe ser mayor que 0."
        );
        expect(validarPrestamo({ profesorId: "3", monto: 1000 })).toBeNull();
    });

    it("construye el payload con el profesor como entero y las notas recortadas", () => {
        expect(
            construirPayloadPrestamo({
                profesorId: "3",
                monto: 500000,
                fecha: "2026-08-01",
                notas: "  Quincena de agosto  ",
            })
        ).toEqual({
            profesor_id: 3,
            monto: 500000,
            fecha: "2026-08-01",
            estado: "Pendiente",
            notas: "Quincena de agosto",
        });
    });

    it("advierte en la confirmación que el préstamo no se puede eliminar", () => {
        const montoEsperado = (500000).toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        expect(
            mensajeConfirmacionPrestamo({
                nombreProfesor: "Pérez Ana",
                monto: 500000,
                fecha: "2026-08-01",
            })
        ).toBe(
            `¿Seguro que deseas registrar este préstamo?\n\nProfesor o trabajador: Pérez Ana\nMonto: $${montoEsperado}\nFecha: 2026-08-01\n\nUna vez creado no se puede eliminar; solo se podrá saldar.`
        );
    });

    it("conserva el texto de la confirmación de saldado", () => {
        expect(mensajeConfirmacionEstadoPrestamo(ESTADO_PRESTAMO_PAGADO)).toBe(
            "¿Marcar este préstamo como Pagado?"
        );
    });

    it("solo permite saldar préstamos pendientes", () => {
        expect(puedeSaldarPrestamo(prestamos[0])).toBe(true);
        expect(puedeSaldarPrestamo(prestamos[1])).toBe(false);
    });

    it("pinta la insignia en amarillo solo mientras el préstamo está pendiente", () => {
        expect(claseEstadoPrestamo("Pendiente")).toBe("bg-yellow-100 text-yellow-800");
        expect(claseEstadoPrestamo("Pagado")).toBe("bg-green-100 text-green-800");
    });

    it("suma únicamente los préstamos pendientes", () => {
        expect(totalPrestamosPendientes(prestamos)).toBe(800000);
        expect(totalPrestamosPendientes([])).toBe(0);
    });

    it("prefiere el detalle del backend al mensaje genérico", () => {
        expect(
            mensajeErrorCrearPrestamo({ response: { data: { detail: "Monto no permitido" } } })
        ).toBe("Monto no permitido");
        expect(mensajeErrorCrearPrestamo(new Error("timeout"))).toBe(
            "No se pudo registrar el préstamo."
        );
    });
});
