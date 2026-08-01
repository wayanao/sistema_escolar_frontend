import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ListaProfesores from "./ListaProfesores";

const PROFESORES = [
    {
        id: 11,
        nombre: "ANA",
        apellido: "RUIZ",
        documento: "102030",
        email: "ana@ejemplo.com",
        estado: "activo",
    },
    {
        id: 12,
        nombre: "LUIS",
        apellido: "PÉREZ",
        documento: "405060",
        email: "luis@ejemplo.com",
        estado: "inactivo",
    },
];

const PROPS_BASE = {
    profesores: PROFESORES,
    estadoFiltro: "todos",
    onCambiarEstadoFiltro: vi.fn(),
    onCambiarEstado: vi.fn(),
    onEditar: vi.fn(),
};

describe("ListaProfesores", () => {
    it("presenta la tabla y conserva la búsqueda local", async () => {
        const user = userEvent.setup();
        render(<ListaProfesores {...PROPS_BASE} />);

        expect(screen.getByText("Lista de Profesores")).toBeInTheDocument();
        expect(screen.getByText("ANA RUIZ")).toBeInTheDocument();
        expect(screen.getByText("LUIS PÉREZ")).toBeInTheDocument();
        expect(within(screen.getByRole("row", { name: /ANA RUIZ/ })).getByText(
            "Activo",
            { selector: "span" },
        )).toBeInTheDocument();
        expect(within(screen.getByRole("row", { name: /LUIS PÉREZ/ })).getByText(
            "Inactivo",
            { selector: "span" },
        )).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText("🔍 Buscar profesor..."), "4050");

        expect(screen.queryByText("ANA RUIZ")).not.toBeInTheDocument();
        expect(screen.getByText("LUIS PÉREZ")).toBeInTheDocument();
    });

    it("delega filtro, edición y cambio de estado", async () => {
        const onCambiarEstadoFiltro = vi.fn();
        const onCambiarEstado = vi.fn();
        const onEditar = vi.fn();
        const user = userEvent.setup();
        render(
            <ListaProfesores
                {...PROPS_BASE}
                onCambiarEstadoFiltro={onCambiarEstadoFiltro}
                onCambiarEstado={onCambiarEstado}
                onEditar={onEditar}
            />,
        );

        const selectores = screen.getAllByRole("combobox");
        await user.selectOptions(selectores[0], "inactivo");
        const filaAna = screen.getByRole("row", { name: /ANA RUIZ/ });
        await user.selectOptions(within(filaAna).getByRole("combobox"), "inactivo");
        await user.click(within(filaAna).getByRole("button", { name: "Editar" }));

        expect(onCambiarEstadoFiltro).toHaveBeenCalledWith("inactivo");
        expect(onCambiarEstado).toHaveBeenCalledWith(PROFESORES[0], "inactivo");
        expect(onEditar).toHaveBeenCalledWith(PROFESORES[0]);
    });
});
