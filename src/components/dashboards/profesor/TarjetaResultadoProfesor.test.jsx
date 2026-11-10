import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TarjetaResultadoProfesor from "./TarjetaResultadoProfesor";

const filas = Array.from({ length: 7 }, (_, i) => ({
    clave: String(i),
    posicion: i + 1,
    nombre: `Estudiante ${i + 1}`,
    detalle: "Curso: 5A",
    valor: "2.50",
}));

describe("TarjetaResultadoProfesor", () => {
    it("muestra cinco filas y deja ver todas o menos", () => {
        render(<TarjetaResultadoProfesor tono="ambar" icono="📉" titulo="Necesitan refuerzo" descripcion="x" filas={filas} />);

        expect(screen.getAllByRole("listitem")).toHaveLength(5);
        fireEvent.click(screen.getByRole("button", { name: "Ver todos (7)" }));
        expect(screen.getAllByRole("listitem")).toHaveLength(7);
        fireEvent.click(screen.getByRole("button", { name: "Ver menos" }));
        expect(screen.getAllByRole("listitem")).toHaveLength(5);
    });

    it("con un estado no muestra la lista y la acción sigue disponible", () => {
        const onClick = vi.fn();
        render(
            <TarjetaResultadoProfesor
                tono="verde"
                icono="🏆"
                titulo="Mejores promedios"
                descripcion="x"
                filas={filas}
                estado="Cargando rendimiento..."
                accion={{ texto: "Ver ranking por clase", onClick }}
            />,
        );

        expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Ver todos/ })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Ver ranking por clase" }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
