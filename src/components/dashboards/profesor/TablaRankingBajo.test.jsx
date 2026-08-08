import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TablaRankingBajo from "./TablaRankingBajo";

const ranking = [
    { id: 11, nombre: "Ana Arias", promedio: 2.456 },
    { id: 12, nombre: "Beto Bravo", promedio: 1.8 },
];

describe("TablaRankingBajo", () => {
    it("numera los puestos y pinta el promedio a dos decimales", () => {
        render(<TablaRankingBajo ranking={ranking} />);

        const filas = screen.getAllByRole("row").slice(1);
        expect(filas).toHaveLength(2);
        expect(filas[0].textContent).toContain("1");
        expect(filas[0].textContent).toContain("Ana Arias");
        expect(filas[0].textContent).toContain("2.46");
        expect(filas[1].textContent).toContain("1.80");
    });

    it("marca cada fila como crítica", () => {
        render(<TablaRankingBajo ranking={ranking} />);

        expect(screen.getAllByText("Critico")).toHaveLength(2);
    });

    it("muestra el estado vacío sin tabla", () => {
        render(<TablaRankingBajo ranking={[]} />);

        expect(
            screen.getByText(
                "No hay estudiantes con bajo rendimiento (promedio menor a 3) en esta clase para el periodo seleccionado.",
            ),
        ).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
