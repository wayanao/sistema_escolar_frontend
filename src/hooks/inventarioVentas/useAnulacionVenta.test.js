import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAnulacionVenta from "./useAnulacionVenta";
import { opcionesVentanaExito } from "../ventanaExito";

const { serviceMock, swalFireMock } = vi.hoisted(() => ({
    serviceMock: { anularVenta: vi.fn() },
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/inventarioVentasApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const venta = { id: 501, estado: "Pendiente" };

describe("useAnulacionVenta", () => {
    const cargarDatos = vi.fn();

    beforeEach(() => {
        swalFireMock.mockResolvedValue({
            isConfirmed: true,
            value: "  Cargo equivocado  ",
        });
        serviceMock.anularVenta.mockResolvedValue({ mensaje: "anulada" });
    });

    it("pide el motivo, envía el texto recortado y refresca los datos", async () => {
        const { result } = renderHook(() => useAnulacionVenta(cargarDatos));

        await act(async () => {
            await result.current.anularVenta(venta);
        });

        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Anular venta #501",
                input: "textarea",
                inputAttributes: { maxlength: 300 },
            })
        );
        expect(serviceMock.anularVenta).toHaveBeenCalledWith(501, {
            motivo: "Cargo equivocado",
        });
        expect(swalFireMock).toHaveBeenCalledWith(opcionesVentanaExito({ title: "Venta anulada", text: "El stock, la cartera y los pagos asociados fueron actualizados." }));
        expect(cargarDatos).toHaveBeenCalled();
    });

    it("ignora las ventas ya anuladas", async () => {
        const { result } = renderHook(() => useAnulacionVenta(cargarDatos));

        await act(async () => {
            await result.current.anularVenta({ id: 502, estado: "Anulada" });
        });

        expect(swalFireMock).not.toHaveBeenCalled();
        expect(serviceMock.anularVenta).not.toHaveBeenCalled();
    });

    it("respeta la cancelación del diálogo", async () => {
        swalFireMock.mockResolvedValue({ isConfirmed: false });
        const { result } = renderHook(() => useAnulacionVenta(cargarDatos));

        await act(async () => {
            await result.current.anularVenta(venta);
        });

        expect(serviceMock.anularVenta).not.toHaveBeenCalled();
        expect(cargarDatos).not.toHaveBeenCalled();
    });

    it("muestra el detalle del backend cuando la anulación falla", async () => {
        const error = { response: { data: { detail: "La venta ya está anulada" } } };
        serviceMock.anularVenta.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderHook(() => useAnulacionVenta(cargarDatos));

        await act(async () => {
            await result.current.anularVenta(venta);
        });

        expect(swalFireMock).toHaveBeenCalledWith(
            "Error",
            "La venta ya está anulada",
            "error"
        );
        expect(cargarDatos).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith("Error anulando venta:", error);
        consoleError.mockRestore();
    });
});
