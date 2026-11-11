import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EncabezadoPanelAdmin from "./EncabezadoPanelAdmin";

describe("EncabezadoPanelAdmin", () => {
    it("saluda al administrador y muestra la fecha de hoy", () => {
        render(
            <EncabezadoPanelAdmin
                nombreAdmin="Carlos"
                fechaDeHoy="Miércoles, 11 de noviembre"
                onAlternarValores={vi.fn()}
            />,
        );

        expect(screen.getByRole("heading", { level: 1, name: "Hola, Carlos" })).toBeInTheDocument();
        expect(screen.getByText("Panel de administración")).toBeInTheDocument();
        expect(screen.getByText("Miércoles, 11 de noviembre")).toBeInTheDocument();
    });

    it("el botón dice lo que va a hacer y avisa al tocarlo", () => {
        const onAlternarValores = vi.fn();
        const { rerender } = render(
            <EncabezadoPanelAdmin nombreAdmin="Carlos" fechaDeHoy="Hoy" onAlternarValores={onAlternarValores} />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Ocultar valores" }));
        expect(onAlternarValores).toHaveBeenCalledTimes(1);

        rerender(
            <EncabezadoPanelAdmin
                nombreAdmin="Carlos"
                fechaDeHoy="Hoy"
                valoresOcultos
                onAlternarValores={onAlternarValores}
            />,
        );
        expect(screen.getByRole("button", { name: "Mostrar valores" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Ocultar valores" })).not.toBeInTheDocument();
    });
});
