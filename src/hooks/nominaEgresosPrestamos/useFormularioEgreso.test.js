import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import useFormularioEgreso from "./useFormularioEgreso";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { actualizarEgreso: vi.fn(), crearEgreso: vi.fn() },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const eventoFalso = { preventDefault: vi.fn() };

const egresoManual = {
    id: 10,
    concepto: "Papelería",
    monto: 150.5,
    fecha: "2026-08-05T00:00:00",
    categoria: "Compras Institucionales",
    notas: "Factura 12",
    origen: "manual",
    editable: true,
};

const egresoAutomatico = { ...egresoManual, id: 11, origen: "nomina", editable: false };

const montar = () => {
    const recargarRangoVigente = vi.fn().mockResolvedValue(undefined);
    const mostrarRangoDeUnDia = vi.fn().mockResolvedValue(undefined);
    const irAlHistorial = vi.fn();
    const hook = renderHook(() =>
        useFormularioEgreso({ recargarRangoVigente, mostrarRangoDeUnDia, irAlHistorial })
    );
    return { ...hook, recargarRangoVigente, mostrarRangoDeUnDia, irAlHistorial };
};

const escribir = (result, campos) => {
    Object.entries(campos).forEach(([campo, valor]) => {
        act(() => result.current.cambiarCampo(campo, valor));
    });
};

// Simula que el usuario cerró la última ventana de aviso.
const cerrarUltimaVentana = async () => {
    const { didClose } = Swal.fire.mock.calls.at(-1)[0];
    await act(async () => {
        didClose();
    });
};

describe("useFormularioEgreso", () => {
    beforeEach(() => {
        Swal.fire.mockResolvedValue({ isConfirmed: true });
        serviceMock.crearEgreso.mockResolvedValue({ id: 12 });
        serviceMock.actualizarEgreso.mockResolvedValue({ id: 10 });
    });

    it("arranca vacío con la categoría inicial y sin egreso en edición", () => {
        const { result } = montar();

        expect(result.current.formulario).toEqual({
            concepto: "",
            monto: "",
            fecha: "",
            categoria: "Compras Institucionales",
            notas: "",
        });
        expect(result.current.egresoEditando).toBeNull();
        expect(result.current.guardando).toBe(false);
    });

    it("registra tras confirmar, mueve el filtro a su fecha, avisa y resalta el egreso nuevo", async () => {
        const { result, mostrarRangoDeUnDia, recargarRangoVigente } = montar();
        escribir(result, {
            concepto: "  Aseo general  ",
            monto: "80000",
            fecha: "2026-08-01",
            categoria: "Mantenimiento",
        });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                icon: "question",
                title: "¿Registrar este egreso?",
                text: expect.stringContaining("Concepto: Aseo general"),
                confirmButtonText: "Sí, registrar egreso",
                cancelButtonText: "Revisar",
            })
        );
        expect(serviceMock.crearEgreso).toHaveBeenCalledWith({
            concepto: "Aseo general",
            monto: 80000,
            fecha: "2026-08-01",
            categoria: "Mantenimiento",
            notas: "",
        });
        expect(mostrarRangoDeUnDia).toHaveBeenCalledWith("2026-08-01");
        expect(recargarRangoVigente).not.toHaveBeenCalled();
        expect(result.current.formulario.concepto).toBe("");
        expect(result.current.formulario.categoria).toBe("Compras Institucionales");
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Egreso registrado",
                text: expect.stringContaining("«Aseo general»"),
            })
        );
        expect(result.current.egresoResaltadoId).toBe(12);
        expect(result.current.guardando).toBe(false);
        expect(result.current.egresoPorMostrar).toBeNull();

        await cerrarUltimaVentana();

        expect(result.current.egresoPorMostrar).toEqual({ id: 12, vez: 1 });
    });

    it("carga un egreso manual y lo actualiza conservando el rango vigente", async () => {
        const { result, mostrarRangoDeUnDia, recargarRangoVigente } = montar();

        let empezo;
        act(() => {
            empezo = result.current.editarEgreso(egresoManual);
        });

        expect(empezo).toBe(true);
        expect(result.current.egresoEditando).toBe(egresoManual);
        expect(result.current.formulario).toEqual({
            concepto: "Papelería",
            monto: "150.5",
            fecha: "2026-08-05",
            categoria: "Compras Institucionales",
            notas: "Factura 12",
        });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                title: "¿Actualizar este egreso?",
                confirmButtonText: "Sí, actualizar",
            })
        );
        expect(serviceMock.actualizarEgreso).toHaveBeenCalledWith(10, {
            concepto: "Papelería",
            monto: 150.5,
            fecha: "2026-08-05",
            categoria: "Compras Institucionales",
            notas: "Factura 12",
        });
        expect(recargarRangoVigente).toHaveBeenCalledTimes(1);
        expect(mostrarRangoDeUnDia).not.toHaveBeenCalled();
        expect(result.current.egresoEditando).toBeNull();
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({ icon: "success", title: "Egreso actualizado" })
        );
        expect(result.current.egresoResaltadoId).toBe(10);

        await cerrarUltimaVentana();

        expect(result.current.egresoPorMostrar).toEqual({ id: 10, vez: 1 });
    });

    it("rechaza cargar un egreso automático", () => {
        const { result } = montar();

        let empezo;
        act(() => {
            empezo = result.current.editarEgreso(egresoAutomatico);
        });

        expect(empezo).toBe(false);
        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
                text: "Solo puedes editar egresos creados manualmente en esta pantalla.",
            })
        );
        expect(result.current.egresoEditando).toBeNull();
        expect(result.current.formulario.concepto).toBe("");
    });

    it("valida antes de confirmar y no envía nada", async () => {
        const { result } = montar();
        escribir(result, { concepto: "   ", monto: "100" });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenCalledTimes(1);
        expect(Swal.fire).toHaveBeenCalledWith({
            icon: "warning",
            title: "Revisa el egreso",
            text: "Debes escribir el concepto del egreso.",
        });
        expect(serviceMock.crearEgreso).not.toHaveBeenCalled();
    });

    it("Revisar en la confirmación no envía nada y conserva lo escrito", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
        const { result } = montar();
        escribir(result, { concepto: "Aseo", monto: "1000" });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(serviceMock.crearEgreso).not.toHaveBeenCalled();
        expect(result.current.formulario.concepto).toBe("Aseo");
        expect(result.current.guardando).toBe(false);
    });

    it("mientras guarda lo avisa, ignora un segundo envío y no deja editar otra fila", async () => {
        let responder;
        serviceMock.crearEgreso.mockReturnValueOnce(
            new Promise((resolve) => {
                responder = () => resolve({ id: 13 });
            })
        );
        const { result } = montar();
        escribir(result, { concepto: "Aseo", monto: "1000" });

        let primerEnvio;
        await act(async () => {
            primerEnvio = result.current.guardarEgreso(eventoFalso);
        });

        expect(result.current.guardando).toBe(true);

        let empezo;
        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
            empezo = result.current.editarEgreso(egresoManual);
        });

        expect(serviceMock.crearEgreso).toHaveBeenCalledTimes(1);
        expect(empezo).toBe(false);
        expect(result.current.egresoEditando).toBeNull();

        await act(async () => {
            responder();
            await primerEnvio;
        });

        expect(result.current.guardando).toBe(false);
    });

    it("limpiar la edición devuelve el formulario a su estado inicial", () => {
        const { result } = montar();
        act(() => {
            result.current.editarEgreso(egresoManual);
        });

        act(() => result.current.limpiarFormulario());

        expect(result.current.egresoEditando).toBeNull();
        expect(result.current.formulario.concepto).toBe("");
        expect(result.current.formulario.categoria).toBe("Compras Institucionales");
    });

    it("si el backend rechaza el guardado, lo explica y conserva lo escrito", async () => {
        serviceMock.crearEgreso.mockRejectedValueOnce({
            response: { status: 400, data: { detail: "Concepto duplicado" } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, mostrarRangoDeUnDia } = montar();
        escribir(result, { concepto: "Aseo", monto: "1000" });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "error",
                title: "No se registró el egreso",
                text: "Concepto duplicado\n\nNo se guardó nada.",
            })
        );
        expect(mostrarRangoDeUnDia).not.toHaveBeenCalled();
        expect(result.current.formulario.concepto).toBe("Aseo");
        consoleError.mockRestore();
    });

    it("sin respuesta al registrar, muestra los egresos de ese día y lleva al historial si se pide", async () => {
        serviceMock.crearEgreso.mockRejectedValueOnce(new Error("Network Error"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, mostrarRangoDeUnDia, irAlHistorial } = montar();
        escribir(result, { concepto: "Aseo", monto: "1000", fecha: "2026-08-03" });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(mostrarRangoDeUnDia).toHaveBeenCalledWith("2026-08-03");
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "warning",
                title: "No sabemos si el egreso quedó registrado",
                confirmButtonText: "Revisar el historial",
                cancelButtonText: "Seguir aquí",
            })
        );
        expect(result.current.formulario.concepto).toBe("Aseo");
        expect(irAlHistorial).not.toHaveBeenCalled();

        await cerrarUltimaVentana();

        expect(irAlHistorial).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("sin respuesta al actualizar, recarga el rango vigente para revisar el egreso", async () => {
        serviceMock.actualizarEgreso.mockRejectedValueOnce(new Error("Network Error"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, recargarRangoVigente } = montar();
        act(() => {
            result.current.editarEgreso(egresoManual);
        });

        await act(async () => {
            await result.current.guardarEgreso(eventoFalso);
        });

        expect(recargarRangoVigente).toHaveBeenCalledTimes(1);
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({ title: "No sabemos si el cambio quedó guardado" })
        );
        expect(result.current.egresoEditando).toBe(egresoManual);
        consoleError.mockRestore();
    });
});
