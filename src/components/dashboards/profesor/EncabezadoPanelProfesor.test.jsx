import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EncabezadoPanelProfesor from "./EncabezadoPanelProfesor";

// 10 de noviembre de 2026, a mediodía.
const AHORA = new Date(2026, 10, 10, 12, 0);

const propiedades = (extra = {}) => ({
    nombreProfesor: "Ana",
    fechaDeHoy: "Martes, 10 de noviembre",
    periodo: "4",
    cumpleanos: [],
    ahora: AHORA,
    ...extra,
});

describe("EncabezadoPanelProfesor", () => {
    it("saluda, dice el día y el período de trabajo", () => {
        render(<EncabezadoPanelProfesor {...propiedades()} />);

        expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana" })).toBeInTheDocument();
        expect(screen.getByText("Martes, 10 de noviembre")).toBeInTheDocument();
        expect(screen.getByText("Período 4")).toBeInTheDocument();
    });

    it("lista los cumpleaños de la semana, primero el de hoy y resaltado", () => {
        render(
            <EncabezadoPanelProfesor
                {...propiedades({
                    cumpleanos: [
                        { estudiante_id: 2, nombre: "Tomás", apellido: "Ruiz", curso: "4B", fecha_nacimiento: "2017-11-13" },
                        { estudiante_id: 1, nombre: "Sara", apellido: "Pérez", curso: "5A", fecha_nacimiento: "2016-11-10" },
                    ],
                })}
            />,
        );

        const items = within(screen.getByRole("list", { name: "Cumpleaños de la semana" })).getAllByRole("listitem");
        expect(items.map((item) => item.textContent)).toEqual([
            "🎉Sara Pérez5A · Hoy · 10 años",
            "🎈Tomás Ruiz4B · En 3 días · 9 años",
        ]);
        expect(items[0]).toHaveClass("bg-amber-100");
    });

    it("dice cuando no hay cumpleaños, mientras busca y si falla", () => {
        const { rerender } = render(<EncabezadoPanelProfesor {...propiedades()} />);
        expect(screen.getByText("Esta semana no hay cumpleaños en tus cursos.")).toBeInTheDocument();

        rerender(<EncabezadoPanelProfesor {...propiedades({ loadingCumpleanos: true })} />);
        expect(screen.getByText("Buscando cumpleaños de la semana…")).toBeInTheDocument();

        rerender(<EncabezadoPanelProfesor {...propiedades({ errorCumpleanos: "No se pudieron cargar." })} />);
        expect(screen.getByText("No se pudieron cargar.")).toBeInTheDocument();
    });
});
