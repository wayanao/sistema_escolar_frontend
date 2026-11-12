import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ManitoSaludo from "./ManitoSaludo";

describe("ManitoSaludo", () => {
    it("es un adorno: los lectores de pantalla la saltan", () => {
        render(<ManitoSaludo className="ml-2" />);

        const manito = screen.getByTestId("manito-saludo");
        expect(manito).toHaveAttribute("aria-hidden", "true");
        expect(manito).toHaveAttribute("focusable", "false");
        expect(manito).toHaveClass("ml-2");
        // La mano que gira y las rayitas de movimiento, por separado.
        expect(manito.querySelector(".manito-saludo")).toBeInTheDocument();
        expect(manito.querySelector(".manito-rayas")).toBeInTheDocument();
    });

    it("al pasarle el ratón (o tocarla) vuelve a saludar", () => {
        render(<ManitoSaludo />);
        const antes = screen.getByTestId("manito-saludo");

        fireEvent.mouseEnter(antes);

        // Se vuelve a montar el dibujo, y con él empieza otra vez el saludo.
        const despues = screen.getByTestId("manito-saludo");
        expect(despues).not.toBe(antes);
        expect(antes).not.toBeInTheDocument();
    });
});
