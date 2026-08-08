import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CumpleanosSemana from "./CumpleanosSemana";

// El componente calcula los días restantes contra el reloj del sistema, así que
// la caracterización fija la fecha para que las etiquetas sean deterministas.
const HOY = new Date(2026, 7, 7, 9, 0, 0);

const titulos = () =>
    screen.getAllByRole("heading", { level: 3 }).map((titulo) => titulo.textContent);

describe("CumpleanosSemana", () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(HOY);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("muestra el indicador de carga y oculta la lista", () => {
        render(<CumpleanosSemana loading estudiantes={[{ id: 1, nombre: "Ana" }]} />);

        expect(screen.getByText("Consultando cumpleaños...")).toBeInTheDocument();
        expect(screen.getByText("🎂 Consultando...")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    });

    it("muestra el error por encima de la lista recibida", () => {
        render(
            <CumpleanosSemana
                error="No se pudieron cargar los cumpleaños de la semana."
                estudiantes={[{ id: 1, nombre: "Ana", fecha_nacimiento: "2010-08-07" }]}
            />,
        );

        expect(
            screen.getByText("No se pudieron cargar los cumpleaños de la semana."),
        ).toBeInTheDocument();
        expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    });

    it("muestra el texto vacío recibido y el total en el rango de días", () => {
        render(
            <CumpleanosSemana
                estudiantes={[]}
                diasRango={7}
                emptyText="Esta semana no hay estudiantes activos de cumpleaños."
            />,
        );

        expect(
            screen.getByText("Esta semana no hay estudiantes activos de cumpleaños."),
        ).toBeInTheDocument();
        expect(screen.getByText("🎂 0 en 7 días")).toBeInTheDocument();
    });

    it("ordena por días restantes y desempata por nombre completo", () => {
        render(
            <CumpleanosSemana
                estudiantes={[
                    { id: 1, nombre: "Zoe", apellido: "Zapata", fecha_nacimiento: "2015-08-10" },
                    { id: 2, nombre: "Beto", apellido: "Bravo", fecha_nacimiento: "2012-08-08" },
                    { id: 3, nombre: "Ana", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
                    { id: 4, nombre: "Aldo", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
                ]}
            />,
        );

        expect(titulos()).toEqual([
            "Aldo Arias",
            "Ana Arias",
            "Beto Bravo",
            "Zoe Zapata",
        ]);
        expect(screen.getByText("🎂 4 en 7 días")).toBeInTheDocument();
    });

    it("etiqueta hoy, mañana y los días siguientes con la edad que cumple", () => {
        render(
            <CumpleanosSemana
                estudiantes={[
                    { id: 1, nombre: "Ana", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
                    { id: 2, nombre: "Beto", apellido: "Bravo", fecha_nacimiento: "2012-08-08" },
                    { id: 3, nombre: "Zoe", apellido: "Zapata", fecha_nacimiento: "2015-08-10" },
                ]}
            />,
        );

        expect(screen.getByText("Hoy · Cumple 16 años")).toBeInTheDocument();
        expect(screen.getByText("Mañana · Cumple 14 años")).toBeInTheDocument();
        expect(screen.getByText("En 3 días · Cumple 11 años")).toBeInTheDocument();
    });

    it("coloca al final a quien no tiene fecha y no le pinta etiqueta", () => {
        render(
            <CumpleanosSemana
                estudiantes={[
                    { id: 1, nombre: "Sin", apellido: "Fecha" },
                    { id: 2, nombre: "Ana", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
                ]}
            />,
        );

        expect(titulos()).toEqual(["Ana Arias", "Sin Fecha"]);
        const tarjetaSinFecha = screen.getByText("Sin Fecha").closest("article");
        expect(within(tarjetaSinFecha).queryByText(/Cumple/)).not.toBeInTheDocument();
    });

    it("usa textos de respaldo para el nombre y el curso", () => {
        render(<CumpleanosSemana estudiantes={[{ estudiante_id: 7 }]} />);

        expect(screen.getByRole("heading", { level: 3, name: "Estudiante" })).toBeInTheDocument();
        expect(screen.getByText("Curso: Sin curso")).toBeInTheDocument();
    });
});
