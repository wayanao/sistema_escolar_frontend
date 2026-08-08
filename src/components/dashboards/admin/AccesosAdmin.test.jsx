import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AccesosAdmin from "./AccesosAdmin";

describe("AccesosAdmin", () => {
    it("pinta los cuatro accesos con su descripción", () => {
        render(<AccesosAdmin onAbrir={vi.fn()} />);

        expect(screen.getByRole("heading", { level: 2, name: "Accesos principales" })).toBeInTheDocument();
        expect(
            screen.getAllByRole("heading", { level: 3 }).map((titulo) => titulo.textContent),
        ).toEqual([
            "Gestión de Pagos",
            "Gestión de Estudiantes",
            "Gestión Académica",
            "Reportes",
        ]);
        expect(screen.getByText("Administrar pagos y finanzas del sistema")).toBeInTheDocument();
    });

    it("informa la ruta de cada acceso al hacer clic", () => {
        const onAbrir = vi.fn();
        render(<AccesosAdmin onAbrir={onAbrir} />);

        const accesos = [
            ["Abrir Gestión de Pagos", "/admin/pagos"],
            ["Abrir Gestión de Estudiantes", "/admin/estudiantes"],
            ["Abrir Gestión Académica", "/admin"],
            ["Abrir Reportes", "/admin/reportes"],
        ];

        accesos.forEach(([etiqueta, ruta]) => {
            onAbrir.mockClear();
            fireEvent.click(screen.getByRole("button", { name: etiqueta }));
            expect(onAbrir).toHaveBeenCalledWith(ruta);
        });
    });

    it("responde a Enter y espacio, e ignora otras teclas", () => {
        const onAbrir = vi.fn();
        render(<AccesosAdmin onAbrir={onAbrir} />);
        const acceso = screen.getByRole("button", { name: "Abrir Reportes" });

        fireEvent.keyDown(acceso, { key: "Enter" });
        fireEvent.keyDown(acceso, { key: " " });
        expect(onAbrir).toHaveBeenCalledTimes(2);
        expect(onAbrir).toHaveBeenCalledWith("/admin/reportes");

        fireEvent.keyDown(acceso, { key: "Escape" });
        expect(onAbrir).toHaveBeenCalledTimes(2);
    });

    it("escalona la animación de las tarjetas", () => {
        render(<AccesosAdmin onAbrir={vi.fn()} />);

        const tarjetas = screen.getAllByRole("button");
        expect(tarjetas[0]).toHaveStyle({ animationDelay: "0ms" });
        expect(tarjetas[3]).toHaveStyle({ animationDelay: "240ms" });
    });
});
