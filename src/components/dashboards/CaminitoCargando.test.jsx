import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CaminitoCargando from "./CaminitoCargando";

describe("CaminitoCargando", () => {
    it("es una barrita que se llena, sin letras: el texto solo lo leen los lectores de pantalla", () => {
        const { container } = render(<CaminitoCargando etiqueta="Cargando la cartera" className="mt-5" />);

        const caminito = screen.getByRole("progressbar", { name: "Cargando la cartera" });
        expect(caminito).toHaveClass("caminito-cargando", "mt-5");
        // Sin `aria-valuenow`: no se sabe cuánto falta.
        expect(caminito).not.toHaveAttribute("aria-valuenow");
        expect(caminito.firstElementChild).toBeInTheDocument();
        expect(container.textContent).toBe("");
    });
});
