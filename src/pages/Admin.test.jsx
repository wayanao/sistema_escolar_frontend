import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/administracionAcademica/profesores/CrearProfesor", () => ({
    default: () => <div>Contenido de profesores</div>,
}));
vi.mock("../components/administracionAcademica/cursos/CrearCurso", () => ({
    default: () => <div>Contenido de cursos</div>,
}));
vi.mock("../components/administracionAcademica/materias/CrearMateria", () => ({
    default: () => <div>Contenido de materias</div>,
}));
vi.mock("../components/administracionAcademica/asignaciones/AsignarClase", () => ({
    default: () => <div>Contenido de asignaciones</div>,
}));
vi.mock("./OrdenBoletin", () => ({
    default: () => <div>Contenido de orden boletín</div>,
}));

import Admin from "./Admin";

describe("composición de administración académica", () => {
    it("conserva pestañas, selección inicial y carga diferida de los módulos académicos", async () => {
        const user = userEvent.setup();
        render(<Admin />);

        expect(screen.getByRole("heading", { name: "Administración académica" })).toBeInTheDocument();
        expect(await screen.findByText("Contenido de profesores")).toBeInTheDocument();

        const profesores = screen.getByRole("button", { name: "Profesores" });
        const cursos = screen.getByRole("button", { name: "Cursos" });
        const materias = screen.getByRole("button", { name: "Materias" });
        const asignaciones = screen.getByRole("button", { name: "Asignaciones" });
        const ordenBoletin = screen.getByRole("button", { name: "Orden boletín" });
        expect(profesores).toHaveAttribute("aria-current", "page");
        expect(cursos).not.toHaveAttribute("aria-current");
        expect(materias).not.toHaveAttribute("aria-current");
        expect(asignaciones).not.toHaveAttribute("aria-current");
        expect(ordenBoletin).not.toHaveAttribute("aria-current");

        await user.click(cursos);

        expect(await screen.findByText("Contenido de cursos")).toBeInTheDocument();
        expect(cursos).toHaveAttribute("aria-current", "page");
        expect(profesores).not.toHaveAttribute("aria-current");

        await user.click(materias);

        expect(await screen.findByText("Contenido de materias")).toBeInTheDocument();
        expect(materias).toHaveAttribute("aria-current", "page");
        expect(cursos).not.toHaveAttribute("aria-current");
        expect(profesores).not.toHaveAttribute("aria-current");

        await user.click(asignaciones);

        expect(await screen.findByText("Contenido de asignaciones")).toBeInTheDocument();
        expect(asignaciones).toHaveAttribute("aria-current", "page");
        expect(materias).not.toHaveAttribute("aria-current");
        expect(cursos).not.toHaveAttribute("aria-current");
        expect(profesores).not.toHaveAttribute("aria-current");
        expect(screen.getByRole("navigation", { name: "Módulos de administración" })).toBeInTheDocument();

        await user.click(ordenBoletin);

        expect(await screen.findByText("Contenido de orden boletín")).toBeInTheDocument();
        expect(ordenBoletin).toHaveAttribute("aria-current", "page");
        expect(asignaciones).not.toHaveAttribute("aria-current");
    });
});
