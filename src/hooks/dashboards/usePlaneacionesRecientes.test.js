import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import usePlaneacionesRecientes from "./usePlaneacionesRecientes";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { obtenerPlaneacionesRecientes: vi.fn() },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const clase = { id: 10, materia: "Matemáticas" };

const planeaciones = [
    { id: 900, tema: "Fracciones", fecha: "2026-08-05" },
    { id: 901, tema: "Decimales", fecha: "2026-08-03" },
];

describe("usePlaneacionesRecientes", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerPlaneacionesRecientes.mockResolvedValue(planeaciones);
    });

    it("no consulta mientras las clases están cargando", () => {
        renderHook(() => usePlaneacionesRecientes("10", clase, true));

        expect(serviceMock.obtenerPlaneacionesRecientes).not.toHaveBeenCalled();
    });

    it("no consulta sin clase elegida", () => {
        const { result } = renderHook(() => usePlaneacionesRecientes("", null, false));

        expect(serviceMock.obtenerPlaneacionesRecientes).not.toHaveBeenCalled();
        expect(result.current.planeacionesRecientes).toEqual([]);
        expect(result.current.loadingPlaneacionesRecientes).toBe(false);
        expect(result.current.errorPlaneacionesRecientes).toBe("");
    });

    it("consulta las planeaciones de la clase elegida con su límite", async () => {
        const { result } = renderHook(() => usePlaneacionesRecientes("10", clase, false));

        await waitFor(() =>
            expect(result.current.planeacionesRecientes).toEqual(planeaciones),
        );

        expect(serviceMock.obtenerPlaneacionesRecientes).toHaveBeenCalledWith("10", {
            limit: 5,
            offset: 0,
        });
        expect(result.current.errorPlaneacionesRecientes).toBe("");
    });

    it("recorta la respuesta a cinco planeaciones", async () => {
        serviceMock.obtenerPlaneacionesRecientes.mockResolvedValue(
            Array.from({ length: 8 }, (_, index) => ({ id: index })),
        );

        const { result } = renderHook(() => usePlaneacionesRecientes("10", clase, false));

        await waitFor(() => expect(result.current.planeacionesRecientes).toHaveLength(5));
    });

    it("cachea por asignación y no vuelve a consultar la misma clase", async () => {
        const { result, rerender } = renderHook(
            ({ asignacionId }) => usePlaneacionesRecientes(asignacionId, clase, false),
            { initialProps: { asignacionId: "10" } },
        );

        await waitFor(() =>
            expect(result.current.planeacionesRecientes).toEqual(planeaciones),
        );

        rerender({ asignacionId: "11" });
        await waitFor(() =>
            expect(serviceMock.obtenerPlaneacionesRecientes).toHaveBeenCalledTimes(2),
        );

        rerender({ asignacionId: "10" });
        await waitFor(() =>
            expect(result.current.planeacionesRecientes).toEqual(planeaciones),
        );
        expect(serviceMock.obtenerPlaneacionesRecientes).toHaveBeenCalledTimes(2);
    });

    it("arma la ruta en modo presentación de una planeación de la lista", async () => {
        const { result } = renderHook(() => usePlaneacionesRecientes("10", clase, false));

        await waitFor(() =>
            expect(result.current.planeacionesRecientes).toEqual(planeaciones),
        );

        expect(result.current.rutaDePlaneacion("900")).toBe(
            "/plan-de-clases?asignacion_id=10&fecha=2026-08-05&presentacion=1",
        );
        expect(result.current.rutaDePlaneacion(900)).toContain("fecha=2026-08-05");
    });

    it("no arma ruta para una planeación inexistente o sin identificador", async () => {
        const { result } = renderHook(() => usePlaneacionesRecientes("10", clase, false));

        await waitFor(() =>
            expect(result.current.planeacionesRecientes).toEqual(planeaciones),
        );

        expect(result.current.rutaDePlaneacion("")).toBe("");
        expect(result.current.rutaDePlaneacion("999")).toBe("");
    });

    it("publica el error cuando la consulta falla", async () => {
        serviceMock.obtenerPlaneacionesRecientes.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => usePlaneacionesRecientes("10", clase, false));

        await waitFor(() =>
            expect(result.current.errorPlaneacionesRecientes).toBe(
                "No se pudieron cargar las planeaciones recientes.",
            ),
        );
        expect(result.current.planeacionesRecientes).toEqual([]);
        expect(result.current.loadingPlaneacionesRecientes).toBe(false);
    });
});
