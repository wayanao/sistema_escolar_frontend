import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCumpleanosProfesor from "./useCumpleanosProfesor";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { obtenerCumpleanosProfesor: vi.fn() },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const cumpleanos = [{ estudiante_id: 5, nombre: "Ana", fecha_nacimiento: "2012-08-07" }];

describe("useCumpleanosProfesor", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerCumpleanosProfesor.mockResolvedValue(cumpleanos);
    });

    it("no consulta cuando no hay profesor", () => {
        renderHook(() => useCumpleanosProfesor(undefined));

        expect(serviceMock.obtenerCumpleanosProfesor).not.toHaveBeenCalled();
    });

    it("consulta los cumpleaños de los cursos asignados con su rango", async () => {
        const { result } = renderHook(() => useCumpleanosProfesor(7));

        expect(result.current.loadingCumpleanos).toBe(true);

        await waitFor(() => expect(result.current.loadingCumpleanos).toBe(false));

        expect(serviceMock.obtenerCumpleanosProfesor).toHaveBeenCalledWith(7, { dias: 7 });
        expect(result.current.cumpleanos).toEqual(cumpleanos);
        expect(result.current.errorCumpleanos).toBe("");
        // El rango que se consulta es el mismo que se pinta.
        expect(result.current.diasRangoCumpleanos).toBe(7);
    });

    it("protege la lista ante una respuesta que no es arreglo", async () => {
        serviceMock.obtenerCumpleanosProfesor.mockResolvedValue(null);

        const { result } = renderHook(() => useCumpleanosProfesor(7));

        await waitFor(() => expect(result.current.loadingCumpleanos).toBe(false));
        expect(result.current.cumpleanos).toEqual([]);
    });

    it("publica el error cuando la consulta falla", async () => {
        serviceMock.obtenerCumpleanosProfesor.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useCumpleanosProfesor(7));

        await waitFor(() =>
            expect(result.current.errorCumpleanos).toBe(
                "No se pudieron cargar los cumpleaños de la semana.",
            ),
        );
        expect(result.current.cumpleanos).toEqual([]);
    });
});
