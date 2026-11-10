import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DibujosJornada from "./DibujosJornada";

describe("DibujosJornada", () => {
    it("es solo adorno: los lectores de pantalla no lo leen", () => {
        const { container } = render(<DibujosJornada jornada="Mañana" />);
        const adorno = container.firstChild;

        expect(adorno).toHaveAttribute("aria-hidden", "true");
        expect(adorno).toHaveClass("pointer-events-none");
        // Una escena corta para pantallas angostas y la completa desde xl.
        expect(adorno.querySelectorAll("svg")).toHaveLength(2);
    });

    it("cada jornada tiene su propia escena", () => {
        const manana = render(<DibujosJornada jornada="Mañana" />).container.innerHTML;
        const tarde = render(<DibujosJornada jornada="Tarde" />).container.innerHTML;

        expect(manana).not.toBe(tarde);
        // La mañana lleva el cubo «A»; la tarde, no.
        expect(manana).toContain(">A<");
        expect(tarde).not.toContain(">A<");
    });
});
