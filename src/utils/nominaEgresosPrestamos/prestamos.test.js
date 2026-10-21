import { describe, expect, it } from "vitest";
import {
    avisoErrorCrearPrestamo,
    avisoErrorSaldar,
    claseEstadoPrestamo,
    construirParametrosPrestamos,
    construirPayloadPrestamo,
    ESTADO_PRESTAMO_PAGADO,
    ESTADO_PRESTAMO_PENDIENTE,
    fechaPrestamoPorDefecto,
    mensajeConfirmacionPrestamo,
    mensajeConfirmacionSaldar,
    mensajeExitoPrestamo,
    mensajeExitoSaldar,
    normalizarListaPrestamos,
    obtenerNombreProfesor,
    puedeSaldarPrestamo,
    totalPrestamosPendientes,
    validarPrestamo,
} from "./prestamos";

// Así escribe Colombia los pesos en los mensajes: "500.000,00".
const pesos = (valor) =>
    `$${valor.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const prestamoDeAna = { id: 90, profesor_nombre: "Pérez Ana", monto: 500000, fecha: "2026-07-10" };

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

    it("usa la fecha de Colombia: a las 9:30 p. m. del 7 sigue siendo 7", () => {
        // 02:30 UTC del 8 son las 21:30 del 7 en Colombia. Antes daba "2026-08-08".
        expect(fechaPrestamoPorDefecto(new Date("2026-08-08T02:30:00.000Z"))).toBe(
            "2026-08-07"
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
        expect(
            mensajeConfirmacionPrestamo({
                nombreProfesor: "Pérez Ana",
                monto: 500000,
                fecha: "2026-08-01",
            })
        ).toBe(
            `Profesor o trabajador: Pérez Ana\nMonto: ${pesos(500000)}\nFecha: 2026-08-01\n\nUna vez creado no se puede eliminar; solo se podrá saldar.`
        );
    });

    it("dice al registrar a quién, cuánto, con qué fecha y cómo quedó", () => {
        expect(
            mensajeExitoPrestamo({ nombreProfesor: "Pérez Ana", monto: 500000, fecha: "2026-08-01" })
        ).toBe(
            `Préstamo de ${pesos(500000)} a Pérez Ana, con fecha 2026-08-01.\nQuedó como Pendiente en su historial.`
        );
    });

    it("antes de saldar dice de quién es, cuánto, qué cambia y que no se deshace", () => {
        expect(mensajeConfirmacionSaldar(prestamoDeAna)).toBe(
            `Préstamo de ${pesos(500000)} a Pérez Ana, del 2026-07-10.\n\nQuedará como Pagado y ya no se descontará en la nómina. No se puede deshacer.`
        );
    });

    it("al saldar confirma cómo quedó el préstamo", () => {
        expect(mensajeExitoSaldar(prestamoDeAna)).toBe(
            `El préstamo de ${pesos(500000)} a Pérez Ana quedó como Pagado.`
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

    it("al fallar el registro sin respuesta, no se sabe si quedó: hay que revisar el historial", () => {
        expect(avisoErrorCrearPrestamo(new Error("Network Error"))).toEqual({
            incierto: true,
            titulo: "No sabemos si el préstamo quedó registrado",
            texto:
                "Se perdió la comunicación con el servidor antes de recibir su respuesta.\n\n" +
                "Abajo ves el historial de esa persona: revisa si el préstamo ya aparece antes de intentarlo de nuevo.",
        });
    });

    it("al rechazar el registro, muestra la explicación del backend y que no se guardó nada", () => {
        expect(
            avisoErrorCrearPrestamo({
                response: { status: 400, data: { detail: "Monto no permitido" } },
            })
        ).toEqual({
            incierto: false,
            titulo: "No se registró el préstamo",
            texto: "Monto no permitido\n\nNo se guardó nada.",
        });
        expect(avisoErrorCrearPrestamo({ response: { status: 500, data: {} } }).texto).toBe(
            "El servidor no pudo registrar el préstamo. No se guardó nada; puedes intentarlo de nuevo."
        );
    });

    it("al fallar el saldado separa no saber de no haber cambiado nada", () => {
        expect(avisoErrorSaldar(new Error("Network Error"))).toEqual({
            incierto: true,
            titulo: "No sabemos si el préstamo quedó saldado",
            texto:
                "Se perdió la comunicación con el servidor antes de recibir su respuesta.\n\n" +
                "Recargamos el historial: revisa si ya aparece como Pagado.",
        });
        expect(
            avisoErrorSaldar({ response: { status: 404, data: { detail: "Prestamo no encontrado." } } })
        ).toEqual({
            incierto: false,
            titulo: "No se saldó el préstamo",
            texto: "Prestamo no encontrado.\n\nNo cambió nada.",
        });
        expect(avisoErrorSaldar({ response: { status: 500 } }).texto).toBe(
            "El servidor no pudo saldar el préstamo. No cambió nada; puedes intentarlo de nuevo."
        );
    });
});
