import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useInasistenciasProfesor from "./useInasistenciasProfesor";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { obtenerInasistenciasProfesor: vi.fn() },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const inasistencias = [
    { curso_id: 100, estudiante_id: 1, posicion: 1, nombre: "Ana", total_fallas: 9 },
];

describe("useInasistenciasProfesor", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerInasistenciasProfesor.mockResolvedValue(inasistencias);
    });

    it("no consulta cuando no hay profesor", () => {
        renderHook(() => useInasistenciasProfesor(undefined));

        expect(serviceMock.obtenerInasistenciasProfesor).not.toHaveBeenCalled();
    });

    it("carga el ranking de inasistencias del profesor", async () => {
        const { result } = renderHook(() => useInasistenciasProfesor(7));

        expect(result.current.loadingInasistencias).toBe(true);

        await waitFor(() => expect(result.current.loadingInasistencias).toBe(false));

        expect(serviceMock.obtenerInasistenciasProfesor).toHaveBeenCalledWith(7);
        expect(result.current.inasistencias).toEqual(inasistencias);
    });

    it("envuelve la inasistencia devuelta como objeto suelto", async () => {
        serviceMock.obtenerInasistenciasProfesor.mockResolvedValue(inasistencias[0]);

        const { result } = renderHook(() => useInasistenciasProfesor(7));

        await waitFor(() => expect(result.current.inasistencias).toEqual([inasistencias[0]]));
    });

    it("deja la lista vacía cuando la consulta falla", async () => {
        serviceMock.obtenerInasistenciasProfesor.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useInasistenciasProfesor(7));

        await waitFor(() => expect(result.current.loadingInasistencias).toBe(false));
        expect(result.current.inasistencias).toEqual([]);
    });
});
