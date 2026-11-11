import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VALOR_OCULTO } from "../../../utils/dashboards/admin";
import TarjetaPorCobrar from "./TarjetaPorCobrar";

// La deuda académica del backend ya trae la mora: 1.170.000 = 1.100.000 + 70.000.
const resumen = {
    total_deuda: 1250000,
    total_academico: 1170000,
    total_inventario: 80000,
    total_mora: 70000,
    total_anios_anteriores: 0,
    total_estudiantes: 3,
};

const tarjeta = () => screen.getByRole("region", { name: "Por cobrar este año" });

describe("TarjetaPorCobrar", () => {
    it("muestra el total, entre cuántos estudiantes y de dónde sale", () => {
        render(<TarjetaPorCobrar resumen={resumen} />);

        const texto = tarjeta().textContent;
        expect(texto).toContain("1.250.000");
        expect(texto).toContain("entre 3 estudiantes que deben");
        expect(texto).toContain("Mensualidades y cobros");
        expect(texto).toContain("1.100.000");
        expect(texto).toContain("Ventas sin pagar");
        expect(texto).toContain("80.000");
        expect(texto).toContain("Mora por pagar tarde");
        expect(texto).toContain("70.000");
        expect(texto).not.toContain("años anteriores");
    });

    it("muestra aparte la deuda de años anteriores", () => {
        render(<TarjetaPorCobrar resumen={{ ...resumen, total_anios_anteriores: 300000 }} />);

        expect(tarjeta().textContent).toContain("Aparte, de años anteriores:");
        expect(tarjeta().textContent).toContain("300.000");
    });

    it("tapa todos los montos con «Ocultar valores»", () => {
        render(<TarjetaPorCobrar resumen={{ ...resumen, total_anios_anteriores: 300000 }} valoresOcultos />);

        expect(tarjeta().textContent).not.toContain("1.250.000");
        expect(tarjeta().textContent).not.toContain("300.000");
        // El total, las tres partes y los años anteriores.
        expect(screen.getAllByText(VALOR_OCULTO)).toHaveLength(5);
    });

    it("mientras carga no dice que la cartera está al día", () => {
        render(<TarjetaPorCobrar resumen={null} cargando />);

        expect(screen.getByText("Cargando la cartera…")).toBeInTheDocument();
        expect(screen.queryByText("Cartera al día")).not.toBeInTheDocument();
    });

    it("el error se distingue de una cartera sana", () => {
        render(<TarjetaPorCobrar resumen={null} error="No se pudo cargar la cartera vencida." />);

        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar la cartera vencida.");
        expect(screen.queryByText("Cartera al día")).not.toBeInTheDocument();
    });

    it("dice «Cartera al día» cuando nadie debe", () => {
        render(<TarjetaPorCobrar resumen={{ total_deuda: 0, total_estudiantes: 0 }} />);

        expect(screen.getByText("Cartera al día")).toBeInTheDocument();
        expect(screen.getByText("Ningún estudiante debe por ahora.")).toBeInTheDocument();
    });

    it("si solo queda deuda de años anteriores, lo dice así", () => {
        render(
            <TarjetaPorCobrar
                resumen={{ total_deuda: 0, total_estudiantes: 2, total_anios_anteriores: 500000 }}
            />,
        );

        expect(screen.getByText("Este año nadie debe")).toBeInTheDocument();
        expect(tarjeta().textContent).toContain("Solo queda deuda de años anteriores:");
        expect(tarjeta().textContent).toContain("500.000");
        expect(screen.queryByText("Cartera al día")).not.toBeInTheDocument();
    });
});
