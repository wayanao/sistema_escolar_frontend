import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useFormularioTipoPago from "./useFormularioTipoPago";

const { serviceMock, swalFireMock } = vi.hoisted(() => ({
    serviceMock: {
        crearTipoPago: vi.fn(),
        actualizarTipoPago: vi.fn(),
    },
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/carteraTiposPagoApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

describe("useFormularioTipoPago", () => {
    const cargarTiposPagos = vi.fn();

    beforeEach(() => {
        serviceMock.crearTipoPago.mockResolvedValue({ status: 201, data: {} });
        serviceMock.actualizarTipoPago.mockResolvedValue({ status: 200, data: {} });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        cargarTiposPagos.mockReset();
    });

    it("crea un concepto, limpia el formulario y recarga el listado", async () => {
        const { result } = renderHook(() => useFormularioTipoPago({ cargarTiposPagos }));
        const event = { preventDefault: vi.fn() };

        act(() => {
            result.current.setNuevoTipoPago("  Transporte  ");
            result.current.setValorTipoPago("125000.50");
        });
        await act(async () => result.current.handleSubmit(event));

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(serviceMock.crearTipoPago).toHaveBeenCalledWith({
            nombre: "Transporte",
            valor: 125000.5,
        });
        expect(swalFireMock).toHaveBeenCalledWith("Éxito", "Tipo de pago creado", "success");
        expect(cargarTiposPagos).toHaveBeenCalledTimes(1);
        expect(result.current.nuevoTipoPago).toBe("");
        expect(result.current.valorTipoPago).toBe("");
        expect(result.current.editingTipoId).toBeNull();
    });

    it("precarga y actualiza un concepto existente", async () => {
        const { result } = renderHook(() => useFormularioTipoPago({ cargarTiposPagos }));

        act(() => result.current.handleEdit({ id: 7, nombre: "Matrícula", valor: 300000 }));
        await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));

        expect(serviceMock.actualizarTipoPago).toHaveBeenCalledWith(7, {
            nombre: "Matrícula",
            valor: 300000,
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            "Éxito",
            "Tipo de pago actualizado",
            "success"
        );
    });

    it("agrega el año únicamente al crear un concepto en preparación", async () => {
        const { result } = renderHook(() => useFormularioTipoPago({
            cargarTiposPagos,
            anioLectivoIdCreacion: 2,
        }));

        act(() => {
            result.current.setNuevoTipoPago("Transporte");
            result.current.setValorTipoPago("125000");
        });
        await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));

        expect(serviceMock.crearTipoPago).toHaveBeenCalledWith({
            nombre: "Transporte",
            valor: 125000,
            anio_lectivo_id: 2,
        });
        expect(serviceMock.actualizarTipoPago).not.toHaveBeenCalled();
    });

    it("conserva el aviso de conflicto duplicado", async () => {
        const error = { response: { status: 409, data: { detail: "Nombre repetido" } } };
        serviceMock.crearTipoPago.mockRejectedValue(error);
        const { result } = renderHook(() => useFormularioTipoPago({ cargarTiposPagos }));

        act(() => result.current.setNuevoTipoPago("Matrícula"));
        await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));

        expect(swalFireMock).toHaveBeenCalledWith(
            "Concepto duplicado",
            "Nombre repetido",
            "warning"
        );
        expect(cargarTiposPagos).not.toHaveBeenCalled();
    });

    it("el 409 de año cerrado sale con su propio título (año lectivo, paso 6.9)", async () => {
        const mensaje = "El año lectivo 2026 está cerrado. Solo se puede consultar.";
        serviceMock.actualizarTipoPago.mockRejectedValue({
            response: { status: 409, data: { detail: mensaje } },
        });
        const { result } = renderHook(() => useFormularioTipoPago({ cargarTiposPagos }));

        act(() => result.current.handleEdit({ id: 7, nombre: "MATRICULA", valor: 300000 }));
        await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));

        expect(swalFireMock).toHaveBeenCalledWith("Año cerrado", mensaje, "warning");
        expect(swalFireMock).not.toHaveBeenCalledWith(
            "Concepto duplicado",
            expect.anything(),
            expect.anything()
        );
        expect(cargarTiposPagos).not.toHaveBeenCalled();
    });
});
