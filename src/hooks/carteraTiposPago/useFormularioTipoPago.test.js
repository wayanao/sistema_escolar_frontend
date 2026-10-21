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

// Simula que el usuario cerró la última ventana de aviso.
const cerrarUltimaVentana = async () => {
    const { didClose } = swalFireMock.mock.calls.at(-1)[0];
    await act(async () => {
        didClose();
    });
};

describe("useFormularioTipoPago", () => {
    const cargarTiposPagos = vi.fn();

    beforeEach(() => {
        serviceMock.crearTipoPago.mockResolvedValue({
            status: 201,
            data: { id: 9, nombre: "Transporte", valor: 125000.5 },
        });
        serviceMock.actualizarTipoPago.mockResolvedValue({ status: 200, data: {} });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        cargarTiposPagos.mockReset();
    });

    it("crea un concepto, limpia el formulario, recarga el listado y guía al siguiente paso", async () => {
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
        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Concepto creado",
                text: "«Transporte» quedó como Borrador. Para que genere cobros, ábrelo con ⚙️ Configurar y asígnale cursos.",
            })
        );
        expect(cargarTiposPagos).toHaveBeenCalledTimes(1);
        expect(result.current.nuevoTipoPago).toBe("");
        expect(result.current.valorTipoPago).toBe("");
        expect(result.current.editingTipoId).toBeNull();
        expect(result.current.guardandoConcepto).toBe(false);
        expect(result.current.conceptoResaltadoId).toBe(9);
        // Se lleva el concepto a la vista solo cuando la ventana termina de cerrarse.
        expect(result.current.conceptoPorMostrar).toBeNull();

        await cerrarUltimaVentana();

        expect(result.current.conceptoPorMostrar).toEqual({ id: 9, vez: 1 });
    });

    it("precarga y actualiza un concepto existente, y lo resalta", async () => {
        const { result } = renderHook(() => useFormularioTipoPago({ cargarTiposPagos }));

        act(() => result.current.handleEdit({ id: 7, nombre: "Matrícula", valor: 300000 }));
        await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));

        expect(serviceMock.actualizarTipoPago).toHaveBeenCalledWith(7, {
            nombre: "Matrícula",
            valor: 300000,
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Concepto actualizado",
                text: "«Matrícula» quedó actualizado.",
            })
        );
        expect(result.current.conceptoResaltadoId).toBe(7);
    });

    it("mientras guarda lo avisa e ignora un segundo envío", async () => {
        let responder;
        serviceMock.crearTipoPago.mockReturnValueOnce(
            new Promise((resolve) => {
                responder = () => resolve({ status: 201, data: { id: 9 } });
            })
        );
        const { result } = renderHook(() => useFormularioTipoPago({ cargarTiposPagos }));
        act(() => result.current.setNuevoTipoPago("Transporte"));

        let primerEnvio;
        await act(async () => {
            primerEnvio = result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        expect(result.current.guardandoConcepto).toBe(true);

        await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));
        expect(serviceMock.crearTipoPago).toHaveBeenCalledTimes(1);

        await act(async () => {
            responder();
            await primerEnvio;
        });

        expect(result.current.guardandoConcepto).toBe(false);
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
