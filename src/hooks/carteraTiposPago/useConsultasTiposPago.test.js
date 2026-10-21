import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useConsultasTiposPago from "./useConsultasTiposPago";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerTiposPagoDetallados: vi.fn(),
        obtenerTiposPago: vi.fn(),
        obtenerCursosParaTiposPago: vi.fn(),
        obtenerDetalleTipoPago: vi.fn(),
    },
}));

vi.mock("../../services/carteraTiposPagoApi", () => serviceMock);

const tiposPagos = [
    { id: 1, nombre: "Matrícula", activo: true, cursos: [] },
    { id: 2, nombre: "Histórico", activo: false, cursos: [] },
];

const cursos = [{ id: 10, nombre: "5A", estado: "activo" }];

describe("useConsultasTiposPago", () => {
    beforeEach(() => {
        serviceMock.obtenerTiposPagoDetallados.mockResolvedValue(tiposPagos);
        serviceMock.obtenerTiposPago.mockResolvedValue(tiposPagos);
        serviceMock.obtenerCursosParaTiposPago.mockResolvedValue(cursos);
        serviceMock.obtenerDetalleTipoPago.mockResolvedValue({
            id: 1,
            descripcion: "Cobro ordinario",
            tipo_cobro: "mensual",
        });
    });

    it("carga conceptos y cursos y conserva el filtro inicial de activos", async () => {
        const { result } = renderHook(() => useConsultasTiposPago());

        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));
        await waitFor(() => expect(result.current.cursos).toEqual(cursos));

        expect(result.current.estadoFiltro).toBe("activo");
        expect(result.current.tiposPagosFiltrados).toEqual([tiposPagos[0]]);
        expect(result.current.resumenEstados).toEqual({ activo: 1, inactivo: 1, todos: 2 });

        act(() => result.current.setEstadoFiltro("inactivo"));
        expect(result.current.tiposPagosFiltrados).toEqual([tiposPagos[1]]);
    });

    it("mantiene el fallback al listado básico cuando falla el detallado", async () => {
        const error = new Error("Detallado no disponible");
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerTiposPagoDetallados.mockRejectedValue(error);

        const { result } = renderHook(() => useConsultasTiposPago());
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        expect(serviceMock.obtenerTiposPago).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(
            "Error cargando tipos de pagos detallado, fallback a básico",
            error
        );
    });

    it("precarga el concepto y combina su detalle remoto", async () => {
        const { result } = renderHook(() => useConsultasTiposPago());
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        let detalle;
        await act(async () => {
            detalle = await result.current.seleccionarTipo(tiposPagos[0]);
        });

        expect(serviceMock.obtenerDetalleTipoPago).toHaveBeenCalledWith(1);
        expect(detalle).toEqual({
            ...tiposPagos[0],
            descripcion: "Cobro ordinario",
            tipo_cobro: "mensual",
        });
        expect(result.current.selectedTipoId).toBe(1);
        expect(result.current.detalle).toEqual(detalle);
        expect(result.current.loadingDetalle).toBe(false);

        act(() => result.current.actualizarDetalle({ activo: false }));
        expect(result.current.detalle).toEqual({ ...detalle, activo: false });

        act(() => result.current.cerrarDetalle());
        expect(result.current.selectedTipoId).toBeNull();
        expect(result.current.detalle).toBeNull();
    });

    it("sin año elegido, conceptos y cursos se piden sin año", async () => {
        const { result } = renderHook(() => useConsultasTiposPago());
        await waitFor(() => expect(result.current.cursos).toEqual(cursos));

        expect(serviceMock.obtenerTiposPagoDetallados).toHaveBeenCalledWith({});
        expect(serviceMock.obtenerCursosParaTiposPago).toHaveBeenCalledWith({});
    });

    it("dice que carga la lista solo la primera vez; al recargar, que actualiza", async () => {
        const { result } = renderHook(() => useConsultasTiposPago());

        expect(result.current.cargandoConceptos).toBe(true);
        expect(result.current.cargandoCursos).toBe(true);
        await waitFor(() => expect(result.current.cargandoConceptos).toBe(false));
        await waitFor(() => expect(result.current.cargandoCursos).toBe(false));

        let terminar;
        serviceMock.obtenerTiposPagoDetallados.mockReturnValueOnce(
            new Promise((resolve) => {
                terminar = () => resolve(tiposPagos);
            })
        );
        let recarga;
        act(() => {
            recarga = result.current.cargarTiposPagos();
        });

        expect(result.current.actualizandoConceptos).toBe(true);
        expect(result.current.cargandoConceptos).toBe(false);
        expect(result.current.tiposPagos).toEqual(tiposPagos);

        await act(async () => {
            terminar();
            await recarga;
        });

        expect(result.current.actualizandoConceptos).toBe(false);
    });

    it("si fallan el listado detallado y el de respaldo, publica el error de conceptos", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerTiposPagoDetallados.mockRejectedValueOnce(new Error("No disponible"));
        serviceMock.obtenerTiposPago.mockRejectedValueOnce(new Error("Sin conexión"));

        const { result } = renderHook(() => useConsultasTiposPago());

        await waitFor(() => expect(result.current.cargandoConceptos).toBe(false));
        expect(result.current.errorConceptos).toBe("No se pudieron cargar los conceptos de pago.");
        expect(result.current.tiposPagos).toEqual([]);

        await act(() => result.current.cargarTiposPagos());

        expect(result.current.errorConceptos).toBeNull();
        expect(result.current.tiposPagos).toEqual(tiposPagos);
        consoleError.mockRestore();
    });

    it("si fallan los cursos, publica su error y se pueden volver a pedir", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerCursosParaTiposPago.mockRejectedValueOnce(new Error("Sin conexión"));

        const { result } = renderHook(() => useConsultasTiposPago());

        await waitFor(() => expect(result.current.cargandoCursos).toBe(false));
        expect(result.current.errorCursos).toBe("No se pudieron cargar los cursos.");

        await act(() => result.current.cargarCursos());

        expect(result.current.errorCursos).toBeNull();
        expect(result.current.cursos).toEqual(cursos);
        consoleError.mockRestore();
    });

    it("propaga el error de detalle y siempre finaliza su carga", async () => {
        const error = new Error("Detalle no disponible");
        serviceMock.obtenerDetalleTipoPago.mockRejectedValue(error);
        const { result } = renderHook(() => useConsultasTiposPago());
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        await act(async () => {
            await expect(result.current.seleccionarTipo(tiposPagos[0])).rejects.toBe(error);
        });

        expect(result.current.detalle).toEqual(tiposPagos[0]);
        expect(result.current.loadingDetalle).toBe(false);
    });
});

describe("useConsultasTiposPago con un año elegido", () => {
    const parametrosAnio = { anio_lectivo_id: 2 };

    beforeEach(() => {
        serviceMock.obtenerTiposPagoDetallados.mockResolvedValue(tiposPagos);
        serviceMock.obtenerTiposPago.mockResolvedValue(tiposPagos);
        serviceMock.obtenerCursosParaTiposPago.mockResolvedValue(cursos);
        serviceMock.obtenerDetalleTipoPago.mockResolvedValue({ id: 1 });
    });

    it("pide conceptos y cursos de ese año, también al recargar después de guardar", async () => {
        const { result } = renderHook(() => useConsultasTiposPago({ parametrosAnio }));
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));
        await waitFor(() => expect(result.current.cursos).toEqual(cursos));

        expect(serviceMock.obtenerTiposPagoDetallados).toHaveBeenCalledWith({ parametrosAnio });
        expect(serviceMock.obtenerCursosParaTiposPago).toHaveBeenCalledWith({ parametrosAnio });

        // `cargarTiposPagos` es lo que llaman los guardados para refrescar.
        serviceMock.obtenerTiposPagoDetallados.mockClear();
        await act(() => result.current.cargarTiposPagos());
        expect(serviceMock.obtenerTiposPagoDetallados).toHaveBeenCalledTimes(1);
        expect(serviceMock.obtenerTiposPagoDetallados).toHaveBeenCalledWith({ parametrosAnio });
    });

    it("si cambia el año, vuelve a pedir conceptos y cursos con el año nuevo", async () => {
        const { result, rerender } = renderHook(
            ({ anio }) => useConsultasTiposPago({ parametrosAnio: anio }),
            { initialProps: { anio: parametrosAnio } },
        );
        await waitFor(() => expect(result.current.cursos).toEqual(cursos));

        const otroAnio = { anio_lectivo_id: 3 };
        rerender({ anio: otroAnio });

        await waitFor(() => expect(serviceMock.obtenerTiposPagoDetallados)
            .toHaveBeenLastCalledWith({ parametrosAnio: otroAnio }));
        expect(serviceMock.obtenerCursosParaTiposPago)
            .toHaveBeenLastCalledWith({ parametrosAnio: otroAnio });
    });

    it("el listado de respaldo también es de ese año", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerTiposPagoDetallados.mockRejectedValue(new Error("No disponible"));

        const { result } = renderHook(() => useConsultasTiposPago({ parametrosAnio }));
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        expect(serviceMock.obtenerTiposPago).toHaveBeenCalledWith({ parametrosAnio });
    });

    it("el detalle de un concepto parte de su id, sin año", async () => {
        const { result } = renderHook(() => useConsultasTiposPago({ parametrosAnio }));
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        await act(() => result.current.seleccionarTipo(tiposPagos[0]));

        expect(serviceMock.obtenerDetalleTipoPago).toHaveBeenCalledWith(1);
    });
});
