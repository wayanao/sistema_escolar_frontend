import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useRankingProfesor, {
    useRankingBajoRendimiento,
    useRankingMejorRendimiento,
} from "./useRankingProfesor";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerRankingBajoRendimiento: vi.fn(),
        obtenerRankingMejorRendimiento: vi.fn(),
    },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

const ranking = [{ id: 11, nombre: "Ana", promedio: 2.3 }];

const consultarRanking = vi.fn();

const iniciarSesionProfesor = () => {
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "Ana" }));
};

function diferido() {
    let resolve;
    const promise = new Promise((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

// La clase y el período los elige la página (useClaseRankingProfesor).
describe("useRankingProfesor", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});
        consultarRanking.mockReset();
        consultarRanking.mockResolvedValue(ranking);
    });

    it("informa que no hay sesión y no consulta", () => {
        const { result } = renderHook(() =>
            useRankingProfesor(consultarRanking, { asignacionId: "44", periodo: "3" }));

        expect(result.current.sesionInvalida).toBe(true);
        expect(consultarRanking).not.toHaveBeenCalled();
    });

    it("sin clase elegida no consulta ni avisa: la página pide elegirla", () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() =>
            useRankingProfesor(consultarRanking, { asignacionId: "", periodo: "3" }));

        expect(result.current.loading).toBe(false);
        expect(result.current.ranking).toEqual([]);
        expect(consultarRanking).not.toHaveBeenCalled();
    });

    it("consulta con la clase y el período recibidos, cargando desde el primer momento", async () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() =>
            useRankingProfesor(consultarRanking, { asignacionId: "44", periodo: "3" }));

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(consultarRanking).toHaveBeenCalledWith("44", "3");
        expect(result.current.ranking).toEqual(ranking);
    });

    it("al cambiar el período vuelve a consultar y descarta la respuesta anterior", async () => {
        iniciarSesionProfesor();
        const lenta = diferido();
        consultarRanking
            .mockImplementationOnce(() => lenta.promise)
            .mockResolvedValueOnce([{ id: 99, nombre: "Nuevo", promedio: 2 }]);

        const { result, rerender } = renderHook(
            ({ periodo }) => useRankingProfesor(consultarRanking, { asignacionId: "44", periodo }),
            { initialProps: { periodo: "3" } },
        );

        rerender({ periodo: "4" });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.ranking).toEqual([{ id: 99, nombre: "Nuevo", promedio: 2 }]);

        lenta.resolve(ranking);
        await lenta.promise;
        expect(result.current.ranking).toEqual([{ id: 99, nombre: "Nuevo", promedio: 2 }]);
        expect(consultarRanking).toHaveBeenLastCalledWith("44", "4");
    });

    it("deja el ranking vacío cuando la consulta falla", async () => {
        iniciarSesionProfesor();
        consultarRanking.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() =>
            useRankingProfesor(consultarRanking, { asignacionId: "44", periodo: "3" }));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.ranking).toEqual([]);
        expect(result.current.error).toBe("No se pudo cargar el ranking.");
    });

    it("cada pantalla usa su propio contrato sin conocer el servicio", async () => {
        iniciarSesionProfesor();
        serviceMock.obtenerRankingBajoRendimiento.mockResolvedValue(ranking);
        serviceMock.obtenerRankingMejorRendimiento.mockResolvedValue([]);
        const seleccion = { asignacionId: "44", periodo: "3" };

        const bajo = renderHook(() => useRankingBajoRendimiento(seleccion));
        await waitFor(() => expect(bajo.result.current.loading).toBe(false));
        expect(serviceMock.obtenerRankingBajoRendimiento).toHaveBeenCalledWith("44", "3");
        expect(serviceMock.obtenerRankingMejorRendimiento).not.toHaveBeenCalled();
        expect(bajo.result.current.ranking).toEqual(ranking);

        const mejor = renderHook(() => useRankingMejorRendimiento(seleccion));
        await waitFor(() => expect(mejor.result.current.loading).toBe(false));
        expect(serviceMock.obtenerRankingMejorRendimiento).toHaveBeenCalledWith("44", "3");
    });
});
