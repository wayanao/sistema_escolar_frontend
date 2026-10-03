import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ListaCursos from "./ListaCursos";

const CURSOS = [
    { id: 21, nombre: "6A", jornada: "Mañana", estado: "activo" },
    { id: 22, nombre: "7B", jornada: "Tarde", estado: "inactivo" },
    { id: 23, nombre: "Transición A", jornada: "Mañana", estado: "activo", nivel: "preescolar" },
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
        expect(within(filaManana).getByText("Sin definir")).toBeInTheDocument();
        expect(within(filaTarde).getByText("Sin definir")).toBeInTheDocument();
    });

    it("muestra el nivel del curso cuando está definido", () => {
        render(<ListaCursos {...PROPS_BASE} />);

        const filaPreescolar = screen.getByRole("row", { name: /Transición A/ });
        expect(within(filaPreescolar).getByText("Preescolar")).toBeInTheDocument();
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

describe("ListaCursos en un año cerrado", () => {
    it("queda solo para consultar: sin columna de acciones, sin Editar y sin cambiar estado", () => {
        render(<ListaCursos {...PROPS_BASE} puedeEditar={false} />);

        expect(screen.getByRole("row", { name: /6A/ })).toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
        // Solo queda el filtro de estado de la lista, no el de cada curso.
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
    });
});
