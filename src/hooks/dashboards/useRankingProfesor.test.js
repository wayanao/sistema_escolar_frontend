import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useRankingProfesor, {
    useRankingBajoRendimiento,
    useRankingMejorRendimiento,
} from "./useRankingProfesor";

const { navigateMock, serviceMock } = vi.hoisted(() => ({
    navigateMock: vi.fn(),
    serviceMock: {
        obtenerRankingBajoRendimiento: vi.fn(),
        obtenerRankingMejorRendimiento: vi.fn(),
    },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
}));

const ranking = [{ id: 11, nombre: "Ana", promedio: 2.3 }];

const locationOriginal = window.location;

const consultarRanking = vi.fn();

const iniciarSesionProfesor = ({ asignacionId = "44", periodo = "3" } = {}) => {
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "Ana" }));
    if (asignacionId) localStorage.setItem("asignacionId", asignacionId);
    if (periodo) localStorage.setItem("periodo_profesor_7", periodo);
};

describe("useRankingProfesor", () => {
    beforeEach(() => {
        localStorage.clear();
        window.alert = vi.fn();
        vi.spyOn(console, "error").mockImplementation(() => {});
        delete window.location;
        window.location = { href: "" };
        consultarRanking.mockReset();
        consultarRanking.mockResolvedValue(ranking);
    });

    afterEach(() => {
        window.location = locationOriginal;
    });

    it("redirige a login y no consulta cuando no hay profesor", () => {
        renderHook(() => useRankingProfesor(consultarRanking));

        expect(window.location.href).toBe("/login");
        expect(consultarRanking).not.toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it("avisa y vuelve al dashboard cuando no hay clase elegida", () => {
        iniciarSesionProfesor({ asignacionId: "" });

        renderHook(() => useRankingProfesor(consultarRanking));

        expect(window.alert).toHaveBeenCalledWith(
            "Selecciona una clase en el Dashboard para ver el ranking.",
        );
        expect(navigateMock).toHaveBeenCalledWith("/");
        expect(consultarRanking).not.toHaveBeenCalled();
    });

    it("consulta con la asignación y el período del profesor", async () => {
        iniciarSesionProfesor();

        const { result } = renderHook(() => useRankingProfesor(consultarRanking));

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(consultarRanking).toHaveBeenCalledWith("44", "3");
        expect(result.current.ranking).toEqual(ranking);
        expect(result.current.periodo).toBe("3");
    });

    it("usa el período de respaldo cuando no hay uno guardado", async () => {
        iniciarSesionProfesor({ periodo: "" });

        const { result } = renderHook(() => useRankingProfesor(consultarRanking));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(consultarRanking).toHaveBeenCalledWith("44", "1");
        expect(result.current.periodo).toBe("1");
    });

    it("deja el ranking vacío cuando la consulta falla", async () => {
        iniciarSesionProfesor();
        consultarRanking.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useRankingProfesor(consultarRanking));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.ranking).toEqual([]);
    });

    it("cada pantalla usa su propio contrato sin conocer el servicio", async () => {
        iniciarSesionProfesor();
        serviceMock.obtenerRankingBajoRendimiento.mockResolvedValue(ranking);
        serviceMock.obtenerRankingMejorRendimiento.mockResolvedValue([]);

        const bajo = renderHook(() => useRankingBajoRendimiento());
        await waitFor(() => expect(bajo.result.current.loading).toBe(false));
        expect(serviceMock.obtenerRankingBajoRendimiento).toHaveBeenCalledWith("44", "3");
        expect(serviceMock.obtenerRankingMejorRendimiento).not.toHaveBeenCalled();
        expect(bajo.result.current.ranking).toEqual(ranking);

        const mejor = renderHook(() => useRankingMejorRendimiento());
        await waitFor(() => expect(mejor.result.current.loading).toBe(false));
        expect(serviceMock.obtenerRankingMejorRendimiento).toHaveBeenCalledWith("44", "3");
    });
});
