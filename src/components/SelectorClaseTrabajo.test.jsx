import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SelectorClaseTrabajo from "./SelectorClaseTrabajo";

const OPCIONES = [
    { valor: "10", etiqueta: "MATEMÁTICAS - 5A" },
    { valor: "11", etiqueta: "ESPAÑOL - 5A" },
];

const propiedades = (extra = {}) => ({
    idPrefijo: "prueba",
    opciones: OPCIONES,
    asignacionId: "10",
    onCambiarAsignacion: vi.fn(),
    periodo: "2",
    onCambiarPeriodo: vi.fn(),
    ...extra,
});

describe("SelectorClaseTrabajo", () => {
    it("muestra la clase y el período elegidos y avisa cada cambio", async () => {
        const user = userEvent.setup();
        const onCambiarAsignacion = vi.fn();
        const onCambiarPeriodo = vi.fn();
        render(<SelectorClaseTrabajo {...propiedades({ onCambiarAsignacion, onCambiarPeriodo })} />);

        expect(screen.getByLabelText("Clase / grupo")).toHaveDisplayValue("MATEMÁTICAS - 5A");
        expect(screen.getByLabelText("Período")).toHaveValue("2");

        await user.selectOptions(screen.getByLabelText("Clase / grupo"), "11");
        expect(onCambiarAsignacion).toHaveBeenCalledWith("11");

        await user.selectOptions(screen.getByLabelText("Período"), "4");
        expect(onCambiarPeriodo).toHaveBeenCalledWith("4");
    });

    it("sin clase elegida pide elegir una", () => {
        render(<SelectorClaseTrabajo {...propiedades({ asignacionId: "" })} />);

        expect(screen.getByLabelText("Clase / grupo")).toHaveDisplayValue("Elige una clase");
    });

    it("mientras carga lo dice y no deja elegir", () => {
        render(<SelectorClaseTrabajo {...propiedades({ opciones: [], cargando: true })} />);

        expect(screen.getByLabelText("Clase / grupo")).toBeDisabled();
        expect(
            within(screen.getByLabelText("Clase / grupo")).getByRole("option", { name: "Cargando clases…" }),
        ).toBeInTheDocument();
    });

    it("con error lo explica y ofrece reintentar", async () => {
        const user = userEvent.setup();
        const onReintentar = vi.fn();
        render(
            <SelectorClaseTrabajo
                {...propiedades({ opciones: [], error: "No se pudieron cargar tus clases.", onReintentar })}
            />,
        );

        expect(screen.getByText("No se pudieron cargar tus clases.")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(onReintentar).toHaveBeenCalledTimes(1);
    });

    it("muestra la ayuda de la clase y los campos propios de la pantalla", () => {
        render(
            <SelectorClaseTrabajo {...propiedades({ ayudaClase: "En preescolar…" })}>
                <label htmlFor="extra">Fecha</label>
                <input id="extra" />
            </SelectorClaseTrabajo>,
        );

        expect(screen.getByText("En preescolar…")).toBeInTheDocument();
        expect(screen.getByLabelText("Fecha")).toBeInTheDocument();
    });
});
