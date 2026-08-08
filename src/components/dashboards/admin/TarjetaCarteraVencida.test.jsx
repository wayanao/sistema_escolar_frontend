import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TarjetaCarteraVencida from "./TarjetaCarteraVencida";

const resumenConMora = { total_deuda: 1250000, total_estudiantes: 3, total_mora: 80000 };

const tarjeta = () => screen.getByRole("button", { name: "Abrir cartera vencida" });

describe("TarjetaCarteraVencida", () => {
    it("muestra la deuda, la mora y el conteo cuando hay estudiantes en mora", () => {
        render(<TarjetaCarteraVencida resumen={resumenConMora} onAbrir={vi.fn()} />);

        expect(tarjeta().textContent).toContain("1.250.000");
        expect(tarjeta().textContent).toContain("3 estudiantes en mora");
        expect(tarjeta().textContent).toContain("80.000");
        expect(screen.getByText("3 en mora")).toBeInTheDocument();
        expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("muestra la cartera al día sin insignia de conteo", () => {
        render(
            <TarjetaCarteraVencida
                resumen={{ total_deuda: 0, total_estudiantes: 0, total_mora: 0 }}
                onAbrir={vi.fn()}
            />,
        );

        expect(screen.getByText("Cartera al día")).toBeInTheDocument();
        expect(screen.getByText("No hay estudiantes en mora actualmente.")).toBeInTheDocument();
        expect(screen.getByText("✅")).toBeInTheDocument();
        expect(screen.queryByText(/en mora$/)).not.toBeInTheDocument();
    });

    it("trata el resumen ausente como cartera al día", () => {
        render(<TarjetaCarteraVencida resumen={null} onAbrir={vi.fn()} />);

        expect(screen.getByText("Cartera al día")).toBeInTheDocument();
    });

    it("muestra el fallo de carga con su propia paleta, sin decir Cartera al día", () => {
        render(
            <TarjetaCarteraVencida
                resumen={null}
                error="No se pudo cargar la cartera vencida."
                onAbrir={vi.fn()}
            />,
        );

        expect(screen.getByText("Sin datos")).toBeInTheDocument();
        expect(screen.getByText("No se pudo cargar la cartera vencida.")).toBeInTheDocument();
        expect(screen.getByText("⛔")).toBeInTheDocument();
        expect(screen.queryByText("Cartera al día")).not.toBeInTheDocument();
        expect(screen.queryByText("✅")).not.toBeInTheDocument();
    });

    it("el error gana sobre un resumen con mora", () => {
        render(
            <TarjetaCarteraVencida
                resumen={resumenConMora}
                error="No se pudo cargar la cartera vencida."
                onAbrir={vi.fn()}
            />,
        );

        expect(screen.getByText("Sin datos")).toBeInTheDocument();
        expect(screen.queryByText("3 en mora")).not.toBeInTheDocument();
    });

    it("informa la apertura con clic, Enter y espacio, e ignora otras teclas", () => {
        const onAbrir = vi.fn();
        render(<TarjetaCarteraVencida resumen={resumenConMora} onAbrir={onAbrir} />);

        fireEvent.click(tarjeta());
        fireEvent.keyDown(tarjeta(), { key: "Enter" });
        fireEvent.keyDown(tarjeta(), { key: " " });
        expect(onAbrir).toHaveBeenCalledTimes(3);

        fireEvent.keyDown(tarjeta(), { key: "Tab" });
        expect(onAbrir).toHaveBeenCalledTimes(3);
    });
});
