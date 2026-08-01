import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ListaCursos from "./ListaCursos";

const CURSOS = [
    { id: 21, nombre: "6A", jornada: "Mañana", estado: "activo" },
    { id: 22, nombre: "7B", jornada: "Tarde", estado: "inactivo" },
];

const PROPS_BASE = {
    cursos: CURSOS,
    estadoFiltro: "todos",
    onCambiarEstadoFiltro: vi.fn(),
    onCambiarEstado: vi.fn(),
    onEditar: vi.fn(),
};

describe("ListaCursos", () => {
    it("presenta cursos, jornadas e insignias con la tabla vigente", () => {
        render(<ListaCursos {...PROPS_BASE} />);

        expect(screen.getByText("Lista de Cursos")).toBeInTheDocument();
        const filaManana = screen.getByRole("row", { name: /6A/ });
        const filaTarde = screen.getByRole("row", { name: /7B/ });
        expect(within(filaManana).getByText("Mañana")).toBeInTheDocument();
        expect(within(filaTarde).getByText("Tarde")).toBeInTheDocument();
        expect(within(filaManana).getByText("Activo", { selector: "span" })).toBeInTheDocument();
        expect(within(filaTarde).getByText("Inactivo", { selector: "span" })).toBeInTheDocument();
    });

    it("delega filtro, edición y cambio de estado", async () => {
        const onCambiarEstadoFiltro = vi.fn();
        const onCambiarEstado = vi.fn();
        const onEditar = vi.fn();
        const user = userEvent.setup();
        render(
            <ListaCursos
                {...PROPS_BASE}
                onCambiarEstadoFiltro={onCambiarEstadoFiltro}
                onCambiarEstado={onCambiarEstado}
                onEditar={onEditar}
            />,
        );

        const selectores = screen.getAllByRole("combobox");
        await user.selectOptions(selectores[0], "inactivo");
        const fila = screen.getByRole("row", { name: /6A/ });
        await user.selectOptions(within(fila).getByRole("combobox"), "inactivo");
        await user.click(within(fila).getByRole("button", { name: "Editar" }));

        expect(onCambiarEstadoFiltro).toHaveBeenCalledWith("inactivo");
        expect(onCambiarEstado).toHaveBeenCalledWith(CURSOS[0], "inactivo");
        expect(onEditar).toHaveBeenCalledWith(CURSOS[0]);
    });
});
