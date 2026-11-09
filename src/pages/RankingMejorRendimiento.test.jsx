import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RankingMejorRendimiento from "./RankingMejorRendimiento";

const { apiMock, navigateMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    navigateMock: vi.fn(),
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
    Navigate: ({ to }) => <div data-testid="redirect" data-to={to} />,
}));

const ranking = [
    { id: 11, nombre: "Ana Arias", promedio: 4.987 },
    { id: 12, nombre: "Beto Bravo", promedio: 4.5 },
    { id: 13, nombre: "Zoe Zapata", promedio: 4.1 },
    { id: 14, nombre: "Iván Ibáñez", promedio: 3.9 },
];

// La página pide también la lista de clases para su selector.
const CLASES = [
    { id: 44, materia: "MATEMÁTICAS", curso: "5A", curso_id: 1 },
    { id: 45, materia: "ESPAÑOL", curso: "5A", curso_id: 1 },
];

function simularServidor({ datosRanking = ranking, fallaRanking = null } = {}) {
    apiMock.get.mockImplementation((url) => {
        if (url === "/mis-clases/7") return Promise.resolve({ data: CLASES });
        if (fallaRanking) return Promise.reject(fallaRanking);
        return Promise.resolve({ data: datosRanking });
    });
}

const llamadasRanking = () =>
    apiMock.get.mock.calls.filter(([url]) => url.startsWith("/dashboard/")).length;

const iniciarSesionProfesor = ({ asignacionId = "44", periodo = "2" } = {}) => {
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "Ana" }));
    if (asignacionId) localStorage.setItem("asignacionId", asignacionId);
    if (periodo) localStorage.setItem("periodo_profesor_7", periodo);
};

describe("RankingMejorRendimiento", () => {
    beforeEach(() => {
        localStorage.clear();
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        vi.spyOn(console, "error").mockImplementation(() => {});
        simularServidor();
    });

    it("redirige a login y no consulta cuando no hay profesor", () => {
        render(<RankingMejorRendimiento />);

        // Redirect del router, sin recargar la aplicación.
        expect(screen.getByTestId("redirect")).toHaveAttribute("data-to", "/login");
        expect(apiMock.get).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it("sin clase guardada pide elegirla en la misma pantalla y al elegirla consulta", async () => {
        iniciarSesionProfesor({ asignacionId: "" });

        render(<RankingMejorRendimiento />);

        expect(await screen.findByText("Elige arriba la clase")).toBeInTheDocument();
        expect(swalFireMock).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
        expect(llamadasRanking()).toBe(0);

        fireEvent.change(screen.getByLabelText("Clase / grupo"), { target: { value: "44" } });

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/dashboard/ranking-mejor/44/2");
        });
        expect(localStorage.getItem("asignacionId")).toBe("44");
    });

    it("cambiar el período en la misma pantalla consulta ese período y lo recuerda", async () => {
        iniciarSesionProfesor();

        render(<RankingMejorRendimiento />);
        await screen.findByDisplayValue("MATEMÁTICAS - 5A");

        fireEvent.change(screen.getByLabelText("Período"), { target: { value: "4" } });

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/dashboard/ranking-mejor/44/4");
        });
        expect(localStorage.getItem("periodo_profesor_7")).toBe("4");
    });

    it("consulta el ranking de mejores con la asignación y el período", async () => {
        iniciarSesionProfesor();

        render(<RankingMejorRendimiento />);

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/dashboard/ranking-mejor/44/2");
        });
        // Una sola consulta del ranking (y una de la lista de clases).
        expect(llamadasRanking()).toBe(1);
    });

    it("marca el podio con medallas y numera al resto", async () => {
        iniciarSesionProfesor();

        render(<RankingMejorRendimiento />);

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "🏆 Ranking de Mejores Estudiantes",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Estudiantes con un promedio de excelencia (entre 3.0 y 5.0) en el período 2.",
            ),
        ).toBeInTheDocument();

        const filas = screen.getAllByRole("row").slice(1);
        expect(filas).toHaveLength(4);
        expect(filas[0].textContent).toContain("🥇 1");
        expect(filas[0].textContent).toContain("4.99");
        expect(filas[1].textContent).toContain("🥈 2");
        expect(filas[2].textContent).toContain("🥉 3");
        expect(filas[3].textContent).toContain("4");
        expect(filas[3].textContent).not.toContain("🥉");
        expect(screen.getAllByText("Excelente")).toHaveLength(4);
    });

    it("muestra el estado vacío cuando no hay promedios de excelencia", async () => {
        iniciarSesionProfesor();
        simularServidor({ datosRanking: [] });

        render(<RankingMejorRendimiento />);

        expect(
            await screen.findByText(
                "No hay estudiantes con promedio entre 3.0 y 5.0 en esta clase para el periodo seleccionado.",
            ),
        ).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("avisa del fallo en vez de mostrar el estado vacío", async () => {
        iniciarSesionProfesor();
        simularServidor({ fallaRanking: new Error("500") });

        render(<RankingMejorRendimiento />);

        expect(await screen.findByText("No se pudo cargar el ranking.")).toBeInTheDocument();
        expect(
            screen.queryByText(
                "No hay estudiantes con promedio entre 3.0 y 5.0 en esta clase para el periodo seleccionado.",
            ),
        ).not.toBeInTheDocument();
    });

    it("vuelve al dashboard desde el botón del encabezado", async () => {
        iniciarSesionProfesor();

        render(<RankingMejorRendimiento />);

        fireEvent.click(await screen.findByRole("button", { name: "Volver al Dashboard" }));

        expect(navigateMock).toHaveBeenCalledWith("/");
    });
});
