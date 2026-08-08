import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useRankingProfesor, {
    useRankingBajoRendimiento,
    useRankingMejorRendimiento,
} from "./useRankingProfesor";

const { navigateMock, serviceMock, swalFireMock } = vi.hoisted(() => ({
    navigateMock: vi.fn(),
    swalFireMock: vi.fn(),
    serviceMock: {
        obtenerRankingBajoRendimiento: vi.fn(),
        obtenerRankingMejorRendimiento: vi.fn(),
    },
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);

vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
}));

const ranking = [{ id: 11, nombre: "Ana", promedio: 2.3 }];

const consultarRanking = vi.fn();

const iniciarSesionProfesor = ({ asignacionId = "44", periodo = "3" } = {}) => {
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "Ana" }));
    if (asignacionId) localStorage.setItem("asignacionId", asignacionId);
    if (periodo) localStorage.setItem("periodo_profesor_7", periodo);
};

describe("useRankingProfesor", () => {
    beforeEach(() => {
        localStorage.clear();
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        vi.spyOn(console, "error").mockImplementation(() => {});
        consultarRanking.mockReset();
        consultarRanking.mockResolvedValue(ranking);
    });

    it("informa que no hay sesión y no consulta", () => {
        const { result } = renderHook(() => useRankingProfesor(consultarRanking));

        expect(result.current.sesionInvalida).toBe(true);
        expect(consultarRanking).not.toHaveBeenCalled();
        expect(swalFireMock).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it("avisa y vuelve al dashboard cuando no hay clase elegida", async () => {
        iniciarSesionProfesor({ asignacionId: "" });

        renderHook(() => useRankingProfesor(consultarRanking));

        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "warning",
                text: "Selecciona una clase en el Dashboard para ver el ranking.",
            }),
        );
        // Se navega solo después de que el aviso se cierra.
        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
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
        expect(result.current.error).toBe("No se pudo cargar el ranking.");
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
