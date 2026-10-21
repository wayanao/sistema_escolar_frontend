import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import usePanelConfiguracion from "./usePanelConfiguracion";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const matricula = { id: 1, nombre: "Matrícula" };
const transporte = { id: 2, nombre: "Transporte" };
const detalleTransporte = { ...transporte, tipo_cobro: "mensual", cursos: [] };

// `abierto`: el concepto que está en el panel. `configSinGuardar` y
// `cursosSinGuardar`: lo que el usuario cambió y no guardó.
const montar = ({ abierto = null, configSinGuardar = false, cursosSinGuardar = false } = {}) => {
    const consultas = {
        selectedTipoId: abierto?.id ?? null,
        detalle: abierto,
        seleccionarTipo: vi.fn().mockResolvedValue(detalleTransporte),
        cerrarDetalle: vi.fn(),
    };
    const configuracion = { configSinGuardar, inicializarConfiguracion: vi.fn() };
    const asignacion = {
        cursosAsignadosDirty: cursosSinGuardar,
        inicializarAsignacion: vi.fn(),
    };
    const hook = renderHook(() => usePanelConfiguracion({ consultas, configuracion, asignacion }));
    return { ...hook, consultas, configuracion, asignacion };
};

// Simula que el usuario cerró la última ventana de aviso.
const cerrarUltimaVentana = async () => {
    const { didClose } = Swal.fire.mock.calls.at(-1)[0];
    await act(async () => {
        didClose();
    });
};

describe("usePanelConfiguracion", () => {
    beforeEach(() => {
        Swal.fire.mockResolvedValue({ isConfirmed: true });
    });

    it("sin cambios pendientes abre el concepto sin preguntar y pide bajar al panel", async () => {
        const { result, consultas, configuracion, asignacion } = montar();

        await act(async () => {
            await result.current.configurar(transporte);
        });

        expect(Swal.fire).not.toHaveBeenCalled();
        expect(consultas.seleccionarTipo).toHaveBeenCalledWith(transporte);
        expect(configuracion.inicializarConfiguracion).toHaveBeenCalledWith(detalleTransporte);
        expect(asignacion.inicializarAsignacion).toHaveBeenCalledWith(detalleTransporte);
        expect(result.current.hayCambiosSinGuardar).toBe(false);
        expect(result.current.panelPorMostrar).toEqual({ id: 2, vez: 1 });
    });

    it("con cambios sin guardar pregunta antes; Seguir editando no cambia nada", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
        const { result, consultas } = montar({ abierto: matricula, configSinGuardar: true });

        expect(result.current.hayCambiosSinGuardar).toBe(true);

        await act(async () => {
            await result.current.configurar(transporte);
        });

        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "warning",
                title: "Hay cambios sin guardar",
                text: "Los cambios de «Matrícula» que no guardaste se van a perder.",
                confirmButtonText: "Descartar cambios",
                cancelButtonText: "Seguir editando",
            })
        );
        expect(consultas.seleccionarTipo).not.toHaveBeenCalled();
        expect(result.current.panelPorMostrar).toBeNull();
    });

    it("al descartar abre el otro concepto y baja al panel cuando la ventana termina de cerrarse", async () => {
        const { result, consultas } = montar({ abierto: matricula, cursosSinGuardar: true });

        await act(async () => {
            await result.current.configurar(transporte);
        });

        expect(consultas.seleccionarTipo).toHaveBeenCalledWith(transporte);
        expect(result.current.panelPorMostrar).toBeNull();

        await cerrarUltimaVentana();

        expect(result.current.panelPorMostrar).toEqual({ id: 2, vez: 1 });
    });

    it("cerrar sin cambios cierra sin preguntar", async () => {
        const { result, consultas } = montar({ abierto: matricula });

        await act(async () => {
            await result.current.cerrar();
        });

        expect(Swal.fire).not.toHaveBeenCalled();
        expect(consultas.cerrarDetalle).toHaveBeenCalledTimes(1);
    });

    it("cerrar con cambios pregunta; Seguir editando deja el panel abierto", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
        const { result, consultas } = montar({ abierto: matricula, configSinGuardar: true });

        await act(async () => {
            await result.current.cerrar();
        });

        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Hay cambios sin guardar" })
        );
        expect(consultas.cerrarDetalle).not.toHaveBeenCalled();
    });

    it("cerrar con cambios y Descartar cambios cierra el panel", async () => {
        const { result, consultas } = montar({ abierto: matricula, configSinGuardar: true });

        await act(async () => {
            await result.current.cerrar();
        });

        expect(consultas.cerrarDetalle).toHaveBeenCalledTimes(1);
    });

    it("si falla el detalle, avisa y cierra el panel para no guardar sobre el concepto equivocado", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, consultas, configuracion, asignacion } = montar();
        const error = new Error("Detalle no disponible");
        consultas.seleccionarTipo.mockRejectedValueOnce(error);

        await act(async () => {
            await result.current.configurar(transporte);
        });

        expect(consoleError).toHaveBeenCalledWith(error);
        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "error",
                title: "No se pudo abrir «Transporte»",
            })
        );
        expect(consultas.cerrarDetalle).toHaveBeenCalledTimes(1);
        expect(configuracion.inicializarConfiguracion).not.toHaveBeenCalled();
        expect(asignacion.inicializarAsignacion).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
