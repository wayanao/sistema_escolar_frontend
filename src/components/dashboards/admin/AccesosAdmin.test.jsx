import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AccesosAdmin from "./AccesosAdmin";

describe("AccesosAdmin", () => {
    it("pinta los cuatro accesos, en su orden y con su descripción", () => {
        render(<AccesosAdmin onAbrir={vi.fn()} />);

        expect(screen.getByRole("heading", { level: 2, name: "Accesos rápidos" })).toBeInTheDocument();
        expect(screen.getAllByRole("button").map((boton) => boton.getAttribute("aria-label"))).toEqual([
            "Abrir Gestión de Pagos",
            "Abrir Gestión de Estudiantes",
            "Abrir Gestión Académica",
            "Abrir Reportes",
        ]);
        expect(screen.getByText("Administrar pagos y finanzas del sistema")).toBeInTheDocument();
    });

    it("son botones de verdad", () => {
        render(<AccesosAdmin onAbrir={vi.fn()} />);

        screen.getAllByRole("button").forEach((boton) => {
            expect(boton.tagName).toBe("BUTTON");
            expect(boton).toHaveAttribute("type", "button");
        });
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
});
