import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PorcentajesPlanilla from "./PorcentajesPlanilla";

const etiqueta = (valor) => ({ quiz: "Quiz", taller: "Taller" }[valor] ?? valor);

function renderizar(props = {}) {
    const onGuardar = props.onGuardar ?? vi.fn().mockResolvedValue(true);
    render(
        <PorcentajesPlanilla
            columnas={["quiz", "taller"]}
            porcentajesPorTipo={{}}
            suma={0}
            activos={false}
            tipoGuardando={null}
            formatearEtiquetaColumna={etiqueta}
            onGuardar={onGuardar}
            {...props}
        />,
    );
    return { onGuardar };
}

describe("PorcentajesPlanilla (parte B, paso B4b)", () => {
    it("sin ningún porcentaje ofrece ponerlos, sin suma ni aviso", () => {
        renderizar();

        expect(screen.getByRole("button", { name: "Poner porcentaje a Quiz" })).toHaveTextContent("Quiz · + %");
        expect(screen.getByRole("button", { name: "Poner porcentaje a Taller" })).toBeInTheDocument();
        expect(screen.queryByText(/de 100 %/)).not.toBeInTheDocument();
        expect(screen.queryByText("Faltan porcentajes: se usa el promedio simple.")).not.toBeInTheDocument();
    });

    it("con porcentajes incompletos muestra la suma y el aviso", () => {
        renderizar({ porcentajesPorTipo: { quiz: 70 }, suma: 70 });

        expect(screen.getByRole("button", { name: "Cambiar el porcentaje de Quiz: 70 %" })).toHaveTextContent("Quiz · 70 %");
        expect(screen.getByText("Porcentajes: 70 % de 100 %")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Faltan porcentajes: se usa el promedio simple.");
    });

    it("con porcentajes completos dice que el promedio es ponderado, sin aviso", () => {
        renderizar({ porcentajesPorTipo: { quiz: 60, taller: 40 }, suma: 100, activos: true });

        expect(screen.getByText("Porcentajes: 100 % de 100 %")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Porcentajes completos: el promedio es ponderado.");
        expect(screen.queryByText("Faltan porcentajes: se usa el promedio simple.")).not.toBeInTheDocument();
    });

    it("sin columnas no muestra nada", () => {
        const { container } = render(
            <PorcentajesPlanilla
                columnas={[]}
                porcentajesPorTipo={{}}
                suma={0}
                activos={false}
                tipoGuardando={null}
                formatearEtiquetaColumna={etiqueta}
                onGuardar={vi.fn()}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("cambia un porcentaje en el mismo lugar: Enter guarda y se cierra", async () => {
        const usuario = userEvent.setup();
        const { onGuardar } = renderizar({ porcentajesPorTipo: { quiz: 70 }, suma: 70 });

        await usuario.click(screen.getByRole("button", { name: "Cambiar el porcentaje de Quiz: 70 %" }));
        const campo = screen.getByRole("textbox", { name: "Porcentaje de Quiz" });
        expect(campo).toHaveValue("70");
        expect(campo).toHaveFocus();

        await usuario.clear(campo);
        await usuario.type(campo, "60{Enter}");

        expect(onGuardar).toHaveBeenCalledWith("quiz", "60");
        expect(screen.queryByRole("textbox", { name: "Porcentaje de Quiz" })).not.toBeInTheDocument();
    });

    it("si no se guarda, el campo sigue abierto con lo escrito", async () => {
        const usuario = userEvent.setup();
        renderizar({ onGuardar: vi.fn().mockResolvedValue(false) });

        await usuario.click(screen.getByRole("button", { name: "Poner porcentaje a Taller" }));
        await usuario.type(screen.getByRole("textbox", { name: "Porcentaje de Taller" }), "150{Enter}");

        expect(screen.getByRole("textbox", { name: "Porcentaje de Taller" })).toHaveValue("150");
    });

    it("Escape cancela sin guardar, y el botón de guardar hace lo mismo que Enter", async () => {
        const usuario = userEvent.setup();
        const { onGuardar } = renderizar();

        await usuario.click(screen.getByRole("button", { name: "Poner porcentaje a Quiz" }));
        await usuario.type(screen.getByRole("textbox", { name: "Porcentaje de Quiz" }), "40{Escape}");
        expect(onGuardar).not.toHaveBeenCalled();
        expect(screen.queryByRole("textbox", { name: "Porcentaje de Quiz" })).not.toBeInTheDocument();

        await usuario.click(screen.getByRole("button", { name: "Poner porcentaje a Quiz" }));
        await usuario.type(screen.getByRole("textbox", { name: "Porcentaje de Quiz" }), "40");
        await usuario.click(screen.getByRole("button", { name: "Guardar el porcentaje de Quiz" }));
        expect(onGuardar).toHaveBeenCalledWith("quiz", "40");
    });

    it("mientras se guarda uno, ninguno se puede tocar y el que se guarda lo dice", () => {
        renderizar({ porcentajesPorTipo: { quiz: 70 }, suma: 70, tipoGuardando: "quiz" });

        const grupo = screen.getByRole("group", { name: "Porcentajes por tipo de nota" });
        within(grupo).getAllByRole("button").forEach((boton) => expect(boton).toBeDisabled());
        expect(screen.getByRole("button", { name: "Cambiar el porcentaje de Quiz: 70 %" })).toHaveAttribute("aria-busy", "true");
    });
});
