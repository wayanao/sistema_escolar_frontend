import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DialogoCambioNombreMateria from "./DialogoCambioNombreMateria";

describe("DialogoCambioNombreMateria", () => {
    it("muestra el mensaje del backend y delega las dos decisiones", async () => {
        const onCambiarIgual = vi.fn();
        const onCrearNueva = vi.fn();
        const user = userEvent.setup();

        render(
            <DialogoCambioNombreMateria
                mensaje="Esta materia se usa en 2026."
                onCambiarIgual={onCambiarIgual}
                onCrearNueva={onCrearNueva}
            />,
        );

        const dialogo = screen.getByRole("dialog", {
            name: "La materia se usa en otro año",
        });
        expect(dialogo).toHaveTextContent("Esta materia se usa en 2026.");

        await user.click(screen.getByRole("button", { name: "Cambiar igual" }));
        await user.click(screen.getByRole("button", { name: "Crear una materia nueva" }));

        expect(onCambiarIgual).toHaveBeenCalledTimes(1);
        expect(onCrearNueva).toHaveBeenCalledTimes(1);
    });

    it("mientras guarda, «Cambiar igual» dice «Guardando...» y nada se puede pulsar", async () => {
        const onCambiarIgual = vi.fn();
        const onCrearNueva = vi.fn();
        const user = userEvent.setup();
        render(
            <DialogoCambioNombreMateria
                mensaje="Esta materia se usa en 2026."
                guardando
                onCambiarIgual={onCambiarIgual}
                onCrearNueva={onCrearNueva}
            />,
        );

        const guardando = screen.getByRole("button", { name: "Guardando..." });
        const crearNueva = screen.getByRole("button", { name: "Crear una materia nueva" });
        expect(guardando).toBeDisabled();
        expect(crearNueva).toBeDisabled();
        await user.click(guardando);
        await user.click(crearNueva);
        expect(onCambiarIgual).not.toHaveBeenCalled();
        expect(onCrearNueva).not.toHaveBeenCalled();
    });
});
