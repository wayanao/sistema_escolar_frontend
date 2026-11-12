import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EncabezadoPanelProfesor from "./EncabezadoPanelProfesor";

const propiedades = (extra = {}) => ({
    nombreProfesor: "Ana",
    fechaDeHoy: "Martes, 10 de noviembre",
    periodo: "4",
    ...extra,
});

describe("EncabezadoPanelProfesor", () => {
    it("saluda, dice el día y el período de trabajo", () => {
        render(<EncabezadoPanelProfesor {...propiedades()} />);

        expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana" })).toBeInTheDocument();
        expect(screen.getByText("Martes, 10 de noviembre")).toBeInTheDocument();
        expect(screen.getByText("Período 4")).toBeInTheDocument();
    });

    it("ya no trae los cumpleaños: van en el muro, al final del panel", () => {
        render(<EncabezadoPanelProfesor {...propiedades()} />);

        expect(screen.queryByText(/cumpleaños/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
});
