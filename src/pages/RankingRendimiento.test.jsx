import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RankingRendimiento from "./RankingRendimiento";

const { apiMock, navigateMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    navigateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
}));

const ranking = [
    { id: 11, nombre: "Ana Arias", promedio: 2.456 },
    { id: 12, nombre: "Beto Bravo", promedio: 1.8 },
];

const locationOriginal = window.location;

const iniciarSesionProfesor = ({ asignacionId = "44", periodo = "3" } = {}) => {
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "Ana" }));
    if (asignacionId) localStorage.setItem("asignacionId", asignacionId);
    if (periodo) localStorage.setItem("periodo_profesor_7", periodo);
};

describe("RankingRendimiento", () => {
    beforeEach(() => {
        localStorage.clear();
        window.alert = vi.fn();
        vi.spyOn(console, "error").mockImplementation(() => {});
        delete window.location;
        window.location = { href: "" };
        apiMock.get.mockResolvedValue({ data: ranking });
    });

    afterEach(() => {
        window.location = locationOriginal;
    });

    it("redirige a login y no consulta cuando no hay profesor", () => {
        render(<RankingRendimiento />);

        expect(window.location.href).toBe("/login");
        expect(apiMock.get).not.toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it("avisa y vuelve al dashboard cuando no hay clase seleccionada", () => {
        iniciarSesionProfesor({ asignacionId: "" });

        render(<RankingRendimiento />);

        expect(window.alert).toHaveBeenCalledWith(
            "Selecciona una clase en el Dashboard para ver el ranking.",
        );
        expect(navigateMock).toHaveBeenCalledWith("/");
        expect(apiMock.get).not.toHaveBeenCalled();
    });

    it("consulta el ranking con la asignación y el período del profesor", async () => {
        iniciarSesionProfesor();

        render(<RankingRendimiento />);

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/dashboard/ranking/44/3");
        });
        expect(apiMock.get).toHaveBeenCalledTimes(1);
    });

    it("usa el período de respaldo cuando el profesor no tiene uno guardado", async () => {
        iniciarSesionProfesor({ periodo: "" });

        render(<RankingRendimiento />);

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/dashboard/ranking/44/1");
        });
    });

    it("lista el ranking con puesto, promedio a dos decimales y estado crítico", async () => {
        iniciarSesionProfesor();

        render(<RankingRendimiento />);

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "📉 Ranking de Bajo Rendimiento",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Estudiantes con un promedio inferior a 3.0 en el período 3."),
        ).toBeInTheDocument();

        const filas = screen.getAllByRole("row").slice(1);
        expect(filas).toHaveLength(2);
        expect(filas[0].textContent).toContain("1");
        expect(filas[0].textContent).toContain("Ana Arias");
        expect(filas[0].textContent).toContain("2.46");
        expect(filas[1].textContent).toContain("1.80");
        expect(screen.getAllByText("Critico")).toHaveLength(2);
    });

    it("muestra el estado vacío cuando no hay estudiantes en riesgo", async () => {
        iniciarSesionProfesor();
        apiMock.get.mockResolvedValue({ data: [] });

        render(<RankingRendimiento />);

        expect(
            await screen.findByText(
                "No hay estudiantes con bajo rendimiento (promedio menor a 3) en esta clase para el periodo seleccionado.",
            ),
        ).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("deja el estado vacío cuando la consulta falla", async () => {
        iniciarSesionProfesor();
        apiMock.get.mockRejectedValue(new Error("500"));

        render(<RankingRendimiento />);

        expect(
            await screen.findByText(
                "No hay estudiantes con bajo rendimiento (promedio menor a 3) en esta clase para el periodo seleccionado.",
            ),
        ).toBeInTheDocument();
    });

    it("vuelve al dashboard desde el botón del encabezado", async () => {
        iniciarSesionProfesor();

        render(<RankingRendimiento />);

        fireEvent.click(await screen.findByRole("button", { name: "Volver al Dashboard" }));

        expect(navigateMock).toHaveBeenCalledWith("/");
    });
});
