import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SelectorTipoEvaluacion from "./SelectorTipoEvaluacion";

describe("SelectorTipoEvaluacion", () => {
    it("muestra ambas opciones y notifica el valor elegido", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SelectorTipoEvaluacion value="numerica" onChange={onChange} />);

        const select = screen.getByRole("combobox");
        expect(select).toHaveValue("numerica");
        expect(screen.getByRole("option", { name: "Numérica (1 a 5)" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Caritas / Desarrollo infantil" })).toBeInTheDocument();

        await user.selectOptions(select, "desarrollo");
        expect(onChange).toHaveBeenCalledWith("desarrollo");
    });
});
