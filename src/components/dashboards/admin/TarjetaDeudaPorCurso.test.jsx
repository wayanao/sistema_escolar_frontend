import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VALOR_OCULTO } from "../../../utils/dashboards/admin";
import TarjetaDeudaPorCurso from "./TarjetaDeudaPorCurso";

const cursos = [
    { cursoId: 9, nombre: "NOVENO", estudiantes: 6, total: 3150000, porcentaje: 100 },
    { cursoId: 5, nombre: "QUINTO", estudiantes: 1, total: 1575000, porcentaje: 50 },
];

describe("TarjetaDeudaPorCurso", () => {
    it("pinta cada curso con cuántos deben y cuánto", () => {
        render(<TarjetaDeudaPorCurso cursos={cursos} />);

        const filas = screen.getAllByRole("listitem");
        expect(filas[0]).toHaveTextContent("NOVENO · 6 estudiantes");
        expect(filas[0]).toHaveTextContent("3.150.000");
        expect(filas[1]).toHaveTextContent("QUINTO · 1 estudiante");
    });

    it("tapa los montos con «Ocultar valores»", () => {
        render(<TarjetaDeudaPorCurso cursos={cursos} valoresOcultos />);

        expect(screen.queryByText(/3\.150\.000/)).not.toBeInTheDocument();
        expect(screen.getAllByText(VALOR_OCULTO)).toHaveLength(2);
    });

    it("mientras carga muestra el caminito, sin letras", () => {
        render(<TarjetaDeudaPorCurso cursos={[]} cargando />);

        expect(screen.getByRole("progressbar", { name: "Cargando la cartera" })).toBeInTheDocument();
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
        expect(screen.queryByText("Ningún curso debe este año.")).not.toBeInTheDocument();
    });

    it("dice cuando ningún curso debe, y distingue el error", () => {
        const { unmount } = render(<TarjetaDeudaPorCurso cursos={[]} />);
        expect(screen.getByText("Ningún curso debe este año.")).toBeInTheDocument();
        unmount();

        render(<TarjetaDeudaPorCurso cursos={[]} error="No se pudo cargar la cartera vencida." />);
        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar la cartera vencida.");
        expect(screen.queryByText("Ningún curso debe este año.")).not.toBeInTheDocument();
    });
});
