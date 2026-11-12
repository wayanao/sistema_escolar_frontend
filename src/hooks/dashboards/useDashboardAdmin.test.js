import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useDashboardAdmin from "./useDashboardAdmin";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerResumenCarteraParaDashboard: vi.fn(),
        obtenerPuntualidadParaDashboard: vi.fn(),
        obtenerCumpleanosAdmin: vi.fn(),
    },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const resumen = { total_estudiantes: 3, total_deuda: 1250000, total_mora: 80000 };
const cumpleanos = [{ estudiante_id: 5, nombre: "Ana" }];
const puntualidad = {
    total_estudiantes: 4,
    siempre_a_tiempo: 3,
    mejores: [{ estudiante_id: 8, nombre: "luz", apellido: "mar", curso_nombre: "1A", cuotas_vencidas: 9, cuotas_a_tiempo: 9 }],
    cursos: [],
};

describe("useDashboardAdmin", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerResumenCarteraParaDashboard.mockResolvedValue(resumen);
        serviceMock.obtenerPuntualidadParaDashboard.mockResolvedValue(puntualidad);
        serviceMock.obtenerCumpleanosAdmin.mockResolvedValue(cumpleanos);
    });

    it("no consulta nada cuando no hay usuario", async () => {
        const { result } = renderHook(() => useDashboardAdmin());

        expect(result.current.esAdministrador).toBe(false);
        expect(serviceMock.obtenerResumenCarteraParaDashboard).not.toHaveBeenCalled();
        expect(serviceMock.obtenerPuntualidadParaDashboard).not.toHaveBeenCalled();
        expect(serviceMock.obtenerCumpleanosAdmin).not.toHaveBeenCalled();
    });

    it("no consulta nada cuando el rol no es admin", () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 2, rol: "profesor" }));

        const { result } = renderHook(() => useDashboardAdmin());

        expect(result.current.esAdministrador).toBe(false);
        expect(serviceMock.obtenerResumenCarteraParaDashboard).not.toHaveBeenCalled();
        expect(serviceMock.obtenerPuntualidadParaDashboard).not.toHaveBeenCalled();
        expect(serviceMock.obtenerCumpleanosAdmin).not.toHaveBeenCalled();
    });

    it("carga quién paga a tiempo, ya normalizado", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));

        const { result } = renderHook(() => useDashboardAdmin());

        // Mientras carga no se sabe nada: no puede leerse como «nadie».
        expect(result.current.cargandoPuntualidad).toBe(true);
        expect(result.current.puntualidad).toBeNull();

        await waitFor(() => expect(result.current.cargandoPuntualidad).toBe(false));
        expect(result.current.puntualidad.totalEstudiantes).toBe(4);
        expect(result.current.puntualidad.siempreATiempo).toBe(3);
        expect(result.current.puntualidad.mejores[0].nombre).toBe("Luz Mar");
        expect(result.current.errorPuntualidad).toBe("");
        expect(serviceMock.obtenerPuntualidadParaDashboard).toHaveBeenCalledWith();
    });

    it("el fallo de la puntualidad publica su error y no toca cartera ni cumpleaños", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
        serviceMock.obtenerPuntualidadParaDashboard.mockRejectedValue(new Error("404"));

        const { result } = renderHook(() => useDashboardAdmin());

        await waitFor(() => expect(result.current.cargandoPuntualidad).toBe(false));
        expect(result.current.errorPuntualidad).toBe("No se pudo cargar quién paga a tiempo.");
        expect(result.current.puntualidad).toBeNull();
        await waitFor(() => expect(result.current.loadingCumpleanos).toBe(false));
        expect(result.current.resumenCartera).toEqual(resumen);
        expect(result.current.errorCartera).toBe("");
        expect(result.current.cumpleanos).toEqual(cumpleanos);
    });

    it("el fallo de la cartera no impide cargar la puntualidad", async () => {
        localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
        serviceMock.obtenerResumenCarteraParaDashboard.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useDashboardAdmin());

        await waitFor(() => expect(result.current.cargandoPuntualidad).toBe(false));
        expect(result.current.puntualidad.totalEstudiantes).toBe(4);
        expect(result.current.errorPuntualidad).toBe("");
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
        expect(serviceMock.obtenerPuntualidadParaDashboard).toHaveBeenCalledTimes(1);
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
