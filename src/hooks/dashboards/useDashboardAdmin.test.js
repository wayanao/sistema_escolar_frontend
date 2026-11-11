import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useDashboardAdmin from "./useDashboardAdmin";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerResumenCarteraParaDashboard: vi.fn(),
        obtenerCumpleanosAdmin: vi.fn(),
    },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const resumen = { total_estudiantes: 3, total_deuda: 1250000, total_mora: 80000 };
const cumpleanos = [{ estudiante_id: 5, nombre: "Ana" }];

describe("useDashboardAdmin", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerResumenCarteraParaDashboard.mockResolvedValue(resumen);
        serviceMock.obtenerCumpleanosAdmin.mockResolvedValue(cumpleanos);
    });

    it("no consulta nada cuando no hay usuario", async () => {
        const { result } = renderHook(() => useDashboardAdmin());

        expect(result.current.esAdministrador).toBe(false);
        expect(serviceMock.obtenerResumenCarteraParaDashboard).not.toHaveBeenCalled();
        expect(serviceMock.obtenerCumpleanosAdmin).not.toHaveBeenCalled();
    });

    it("no consulta nada cuando el rol no es admin", () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 2, rol: "profesor" }));

        const { result } = renderHook(() => useDashboardAdmin());

        expect(result.current.esAdministrador).toBe(false);
        expect(serviceMock.obtenerResumenCarteraParaDashboard).not.toHaveBeenCalled();
        expect(serviceMock.obtenerCumpleanosAdmin).not.toHaveBeenCalled();
    });

    it("expone el saludo del administrador y el rango de cumpleaños", () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, nombre: "carlos gómez", rol: "admin" }));

        const { result } = renderHook(() => useDashboardAdmin());

        expect(result.current.esAdministrador).toBe(true);
        expect(result.current.nombreAdmin).toBe("Carlos");
        expect(result.current.diasRangoCumpleanos).toBe(7);
    });

    it("carga cartera y cumpleaños del administrador", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, nombre: "Carlos", rol: "admin" }));

        const { result } = renderHook(() => useDashboardAdmin());

        expect(result.current.loadingCumpleanos).toBe(true);

        await waitFor(() => expect(result.current.loadingCumpleanos).toBe(false));

        expect(result.current.resumenCartera).toEqual(resumen);
        expect(result.current.cumpleanos).toEqual(cumpleanos);
        expect(result.current.errorCumpleanos).toBe("");
        expect(serviceMock.obtenerCumpleanosAdmin).toHaveBeenCalledWith({ dias: 7 });
    });

    it("marca la cartera como cargando hasta que llega el resumen", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));

        const { result } = renderHook(() => useDashboardAdmin());

        // Mientras carga no se sabe si hay deuda: no puede leerse como «al día».
        expect(result.current.cargandoCartera).toBe(true);
        expect(result.current.resumenCartera).toBeNull();

        await waitFor(() => expect(result.current.cargandoCartera).toBe(false));
        expect(result.current.resumenCartera).toEqual(resumen);
    });

    it("deja de cargar también cuando falla la cartera", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
        serviceMock.obtenerResumenCarteraParaDashboard.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useDashboardAdmin());

        await waitFor(() => expect(result.current.cargandoCartera).toBe(false));
        expect(result.current.errorCartera).toBe("No se pudo cargar la cartera vencida.");
    });

    it("no vuelve a consultar aunque el componente se rerenderice", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));

        const { result, rerender } = renderHook(() => useDashboardAdmin());
        await waitFor(() => expect(result.current.loadingCumpleanos).toBe(false));

        // `usuario` se relee del almacenamiento en cada render y es un objeto
        // nuevo cada vez. Si los efectos dependieran de él, cada render
        // dispararía otra petición.
        rerender();
        rerender();
        rerender();

        expect(serviceMock.obtenerResumenCarteraParaDashboard).toHaveBeenCalledTimes(1);
        expect(serviceMock.obtenerCumpleanosAdmin).toHaveBeenCalledTimes(1);
    });

    it("protege la lista de cumpleaños ante una respuesta que no es arreglo", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
        serviceMock.obtenerCumpleanosAdmin.mockResolvedValue(null);

        const { result } = renderHook(() => useDashboardAdmin());

        await waitFor(() => expect(result.current.loadingCumpleanos).toBe(false));
        expect(result.current.cumpleanos).toEqual([]);
    });

    it("el fallo de cartera no impide cargar los cumpleaños", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
        serviceMock.obtenerResumenCarteraParaDashboard.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useDashboardAdmin());

        await waitFor(() => expect(result.current.cumpleanos).toEqual(cumpleanos));
        expect(result.current.resumenCartera).toBeNull();
        expect(result.current.errorCartera).toBe("No se pudo cargar la cartera vencida.");
        expect(result.current.errorCumpleanos).toBe("");
    });

    it("el fallo de cumpleaños publica su error y no toca cartera", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
        serviceMock.obtenerCumpleanosAdmin.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useDashboardAdmin());

        await waitFor(() =>
            expect(result.current.errorCumpleanos).toBe(
                "No se pudieron cargar los cumpleaños de la semana.",
            ),
        );
        expect(result.current.loadingCumpleanos).toBe(false);
        expect(result.current.resumenCartera).toEqual(resumen);
    });
});
