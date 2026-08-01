import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ListaMaterias from "./ListaMaterias";

const MATERIAS = [
    { id: 31, nombre: "MATEMÁTICAS", estado: "activo" },
    { id: 32, nombre: "BIOLOGÍA", estado: "inactivo" },
];

const PROPS_BASE = {
    materias: MATERIAS,
    estadoFiltro: "todos",
    onCambiarEstadoFiltro: vi.fn(),
    onCambiarEstado: vi.fn(),
    onEditar: vi.fn(),
};

describe("ListaMaterias", () => {
    it("presenta materias e insignias con la tabla vigente", () => {
        render(<ListaMaterias {...PROPS_BASE} />);

        expect(screen.getByText("Lista de Materias")).toBeInTheDocument();
        const filaActiva = screen.getByRole("row", { name: /MATEMÁTICAS/ });
        const filaInactiva = screen.getByRole("row", { name: /BIOLOGÍA/ });
        expect(within(filaActiva).getByText("Activo", { selector: "span" })).toBeInTheDocument();
        expect(within(filaInactiva).getByText("Inactivo", { selector: "span" })).toBeInTheDocument();
    });

    it("delega filtro, edición y cambio de estado", async () => {
        const onCambiarEstadoFiltro = vi.fn();
        const onCambiarEstado = vi.fn();
        const onEditar = vi.fn();
        const user = userEvent.setup();
        render(
            <ListaMaterias
                {...PROPS_BASE}
                onCambiarEstadoFiltro={onCambiarEstadoFiltro}
                onCambiarEstado={onCambiarEstado}
                onEditar={onEditar}
            />,
        );

        const selectores = screen.getAllByRole("combobox");
        await user.selectOptions(selectores[0], "inactivo");
        const fila = screen.getByRole("row", { name: /MATEMÁTICAS/ });
        await user.selectOptions(within(fila).getByRole("combobox"), "inactivo");
        await user.click(within(fila).getByRole("button", { name: "Editar" }));

        expect(onCambiarEstadoFiltro).toHaveBeenCalledWith("inactivo");
        expect(onCambiarEstado).toHaveBeenCalledWith(MATERIAS[0], "inactivo");
        expect(onEditar).toHaveBeenCalledWith(MATERIAS[0]);
    });
});
