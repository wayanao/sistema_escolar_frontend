import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TablaRankingMejor from "./TablaRankingMejor";

const ranking = [
    { id: 11, nombre: "Ana Arias", promedio: 4.987 },
    { id: 12, nombre: "Beto Bravo", promedio: 4.5 },
    { id: 13, nombre: "Zoe Zapata", promedio: 4.1 },
    { id: 14, nombre: "Iván Ibáñez", promedio: 3.9 },
];

describe("TablaRankingMejor", () => {
    it("marca el podio con medallas y numera al resto", () => {
        render(<TablaRankingMejor ranking={ranking} />);

        const filas = screen.getAllByRole("row").slice(1);
        expect(filas).toHaveLength(4);
        expect(filas[0].textContent).toContain("🥇 1");
        expect(filas[1].textContent).toContain("🥈 2");
        expect(filas[2].textContent).toContain("🥉 3");
        expect(filas[3].textContent).toContain("4");
        expect(filas[3].textContent).not.toContain("🥉");
    });

    it("pinta el promedio a dos decimales y la insignia de excelencia", () => {
        render(<TablaRankingMejor ranking={ranking} />);

        expect(screen.getByText("4.99")).toBeInTheDocument();
        expect(screen.getByText("3.90")).toBeInTheDocument();
        expect(screen.getAllByText("Excelente")).toHaveLength(4);
    });

    it("distingue el fallo de carga del estado vacío", () => {
        render(<TablaRankingMejor ranking={[]} error="No se pudo cargar el ranking." />);

        expect(screen.getByText("No se pudo cargar el ranking.")).toBeInTheDocument();
        expect(screen.getByText("⛔")).toBeInTheDocument();
        expect(screen.queryByText(/No hay estudiantes con promedio/)).not.toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("muestra el estado vacío sin tabla", () => {
        render(<TablaRankingMejor ranking={[]} />);

        expect(
            screen.getByText(
                "No hay estudiantes con promedio entre 3.0 y 5.0 en esta clase para el periodo seleccionado.",
            ),
        ).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
