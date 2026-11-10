import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TarjetaInasistencias from "./TarjetaInasistencias";

const inasistencias = [
    { curso_id: 100, estudiante_id: 1, posicion: 1, nombre: "Ana Arias", curso: "5A", total_fallas: 9 },
    { curso_id: 100, estudiante_id: 2, posicion: 2, nombre: "Beto Bravo", curso: "5A", total_fallas: 4 },
];

describe("TarjetaInasistencias", () => {
    it("lista cada estudiante con su posición, curso y total de fallas", () => {
        render(<TarjetaInasistencias inasistencias={inasistencias} loading={false} />);

        expect(
            screen.getByRole("heading", { name: "Los que más faltan" }),
        ).toBeInTheDocument();
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("Ana Arias")).toBeInTheDocument();
        expect(screen.getByText("9")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getAllByText("Curso: 5A")).toHaveLength(2);
    });

    it("muestra el indicador de carga sin la lista", () => {
        render(<TarjetaInasistencias inasistencias={inasistencias} loading />);

        expect(screen.getByText("Cargando inasistencias...")).toBeInTheDocument();
        expect(screen.queryByText("#1")).not.toBeInTheDocument();
    });

    it("muestra el estado vacío sin inasistencias", () => {
        render(<TarjetaInasistencias inasistencias={[]} loading={false} />);

        expect(screen.getByText("Nadie tiene fallas registradas.")).toBeInTheDocument();
    });

    it("distingue el fallo de carga del estado vacío", () => {
        render(
            <TarjetaInasistencias
                inasistencias={[]}
                loading={false}
                error="No se pudieron cargar las inasistencias."
            />,
        );

        expect(screen.getByText("No se pudieron cargar las inasistencias.")).toBeInTheDocument();
        expect(screen.queryByText("Nadie tiene fallas registradas.")).not.toBeInTheDocument();
    });
});
