import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TarjetaPuntualidad from "./TarjetaPuntualidad";

const region = () => screen.getByRole("region", { name: "Pagan siempre a tiempo" });

describe("TarjetaPuntualidad", () => {
    it("muestra el porcentaje y cuántos de cuántos no se atrasan", () => {
        render(<TarjetaPuntualidad puntualidad={{ totalEstudiantes: 286, siempreATiempo: 142 }} />);

        expect(region()).toHaveTextContent("50 %");
        expect(region()).toHaveTextContent("del colegio");
        expect(region()).toHaveTextContent("142 de 286estudiantes sin atrasarse ni un mes este año.");
        expect(screen.getByTestId("anillo-puntualidad")).toBeInTheDocument();
    });

    it("con nadie a tiempo dice 0 % y no pinta el arco", () => {
        render(<TarjetaPuntualidad puntualidad={{ totalEstudiantes: 10, siempreATiempo: 0 }} />);

        expect(region()).toHaveTextContent("0 %");
        expect(region()).toHaveTextContent("0 de 10");
        expect(screen.queryByTestId("anillo-puntualidad")).not.toBeInTheDocument();
    });

    it("cargando, error y «todavía no vence nada» son estados distintos", () => {
        const { rerender } = render(<TarjetaPuntualidad puntualidad={null} cargando />);
        expect(screen.getByText("Calculando quién paga a tiempo…")).toBeInTheDocument();
        expect(region()).not.toHaveTextContent("%");

        rerender(<TarjetaPuntualidad puntualidad={null} error="No se pudo cargar quién paga a tiempo." />);
        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar quién paga a tiempo.");
        expect(region()).not.toHaveTextContent("%");

        rerender(<TarjetaPuntualidad puntualidad={{ totalEstudiantes: 0, siempreATiempo: 0 }} />);
        expect(screen.getByText("Todavía no se ha vencido ninguna mensualidad este año.")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
