import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VALOR_OCULTO } from "../../../utils/dashboards/admin";
import TarjetaMayoresDeudores from "./TarjetaMayoresDeudores";

const deudores = [
    {
        estudianteId: 7,
        puesto: 1,
        nombre: "Samuel Ortiz",
        iniciales: "SO",
        curso: "NOVENO",
        detalle: "4 cuotas vencidas",
        total: 800000,
        porcentaje: 100,
    },
    {
        estudianteId: 9,
        puesto: 2,
        nombre: "Valeria Gómez",
        iniciales: "VG",
        curso: "QUINTO",
        detalle: "",
        total: 400000,
        porcentaje: 50,
    },
];

const pintar = (props = {}) => {
    const acciones = { onCobrar: vi.fn(), onVerCartera: vi.fn() };
    render(<TarjetaMayoresDeudores deudores={deudores} {...acciones} {...props} />);
    return acciones;
};

describe("TarjetaMayoresDeudores", () => {
    it("pinta cada deudor en orden, con su curso, su detalle y su monto", () => {
        pintar();

        const filas = screen.getAllByRole("listitem");
        expect(filas).toHaveLength(2);
        expect(filas[0]).toHaveTextContent("Samuel Ortiz");
        expect(filas[0]).toHaveTextContent("NOVENO · 4 cuotas vencidas");
        expect(filas[0]).toHaveTextContent("800.000");
        expect(filas[1]).toHaveTextContent("Valeria Gómez");
        // Sin detalle no queda un punto suelto: la línea dice solo el curso.
        expect(within(filas[1]).getByText("QUINTO")).toBeInTheDocument();
    });

    it("«Cobrar» avisa con el estudiante de esa fila", () => {
        const { onCobrar } = pintar();

        fireEvent.click(screen.getByRole("button", { name: "Cobrar a Valeria Gómez" }));

        expect(onCobrar).toHaveBeenCalledWith(9);
    });

    it("lleva a la cartera vencida completa", () => {
        const { onVerCartera } = pintar();

        fireEvent.click(screen.getByRole("button", { name: "Ver toda la cartera vencida" }));

        expect(onVerCartera).toHaveBeenCalledTimes(1);
    });

    it("tapa los montos con «Ocultar valores»", () => {
        pintar({ valoresOcultos: true });

        expect(screen.queryByText(/800\.000/)).not.toBeInTheDocument();
        expect(screen.getAllByText(VALOR_OCULTO)).toHaveLength(2);
    });

    it("dice cuando nadie debe y conserva el acceso a la cartera", () => {
        pintar({ deudores: [] });

        expect(screen.getByText("Nadie debe este año.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Ver toda la cartera vencida" })).toBeInTheDocument();
    });

    it("distingue la carga y el error de una lista vacía", () => {
        const { unmount } = render(
            <TarjetaMayoresDeudores deudores={[]} cargando onCobrar={vi.fn()} onVerCartera={vi.fn()} />,
        );
        expect(screen.getByRole("progressbar", { name: "Cargando la cartera" })).toBeInTheDocument();
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
        expect(screen.queryByText("Nadie debe este año.")).not.toBeInTheDocument();
        unmount();

        render(
            <TarjetaMayoresDeudores
                deudores={[]}
                error="No se pudo cargar la cartera vencida."
                onCobrar={vi.fn()}
                onVerCartera={vi.fn()}
            />,
        );
        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar la cartera vencida.");
        expect(screen.queryByText("Nadie debe este año.")).not.toBeInTheDocument();
    });
});
