import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
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

function UbicacionActual() {
    const { pathname, search } = useLocation();
    const navegar = useNavigate();
    return (
        <>
            <p data-testid="ubicacion">{`${pathname}${search}`}</p>
            <button type="button" onClick={() => navegar(-1)}>Atrás</button>
        </>
    );
}

// Desde el paso 4.2 del año lectivo, la pestaña vive en la dirección
// (`?modulo=`), así que la página necesita un router.
function renderAdmin(entradas = ["/admin"]) {
    return render(
        <MemoryRouter initialEntries={entradas} initialIndex={entradas.length - 1}>
            <Admin />
            <UbicacionActual />
        </MemoryRouter>,
    );
}

describe("composición de administración académica", () => {
    it("conserva pestañas, selección inicial y carga diferida de los módulos académicos", async () => {
        const user = userEvent.setup();
        renderAdmin();

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

    it("escribe en la dirección la pestaña elegida, con los ids que usa el año lectivo", async () => {
        const user = userEvent.setup();
        renderAdmin();
        await screen.findByText("Contenido de profesores");

        await user.click(screen.getByRole("button", { name: "Cursos" }));
        expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin?modulo=cursos");

        await user.click(screen.getByRole("button", { name: "Asignaciones" }));
        expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin?modulo=asignar-clases");

        await user.click(screen.getByRole("button", { name: "Orden boletín" }));
        expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin?modulo=orden-boletin");
    });

    it("abre la pestaña que dice la dirección, y Profesores si no dice una válida", async () => {
        const { unmount } = renderAdmin(["/admin?modulo=cursos"]);

        expect(await screen.findByText("Contenido de cursos")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cursos" })).toHaveAttribute("aria-current", "page");
        unmount();

        renderAdmin(["/admin?modulo=inventada"]);

        expect(await screen.findByText("Contenido de profesores")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Profesores" })).toHaveAttribute("aria-current", "page");
    });

    it("cambiar de pestaña no suma pasos al botón Atrás", async () => {
        const user = userEvent.setup();
        renderAdmin(["/inicio", "/admin"]);
        await screen.findByText("Contenido de profesores");

        await user.click(screen.getByRole("button", { name: "Cursos" }));
        await user.click(screen.getByRole("button", { name: "Materias" }));
        await user.click(screen.getByRole("button", { name: "Atrás" }));

        expect(screen.getByTestId("ubicacion")).toHaveTextContent("/inicio");
    });
});
