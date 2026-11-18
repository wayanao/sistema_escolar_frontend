import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ModalSubnotasPlanilla from "./ModalSubnotasPlanilla";

const SUBNOTAS = [
    { id: 7, nombre: "Taller 1" },
    { id: 8, nombre: "Quiz" },
    { id: 9, nombre: "Parcial" },
];

const ANA = {
    estudiante_id: 501,
    nombre: "Ana",
    apellido: "Gómez",
    notas: { Cognitivo: 4 },
    valoraciones: {},
    subnotas: {},
};

function renderModal(props = {}) {
    const callbacks = {
        onCambiarCalificacion: vi.fn(),
        onGuardar: vi.fn(),
        onSiguiente: vi.fn(),
        onAnterior: vi.fn(),
        onCerrar: vi.fn(),
        onCrearSubnota: vi.fn().mockResolvedValue(true),
        onRenombrarSubnota: vi.fn().mockResolvedValue(true),
        onBorrarSubnota: vi.fn(),
    };
    const todas = {
        estudiante: ANA,
        tipo: "Cognitivo",
        tipoEvaluacion: "numerica",
        subnotas: SUBNOTAS,
        borrador: { 7: "4", 8: "3", 9: "4.4" },
        invalidas: [],
        vistaPrevia: { nota: 3.8 },
        hayCambios: true,
        notaAMano: false,
        quedaraVacia: false,
        limiteAlcanzado: false,
        posicion: 1,
        total: 30,
        hayAnterior: false,
        haySiguiente: true,
        accionEnCurso: null,
        ...callbacks,
        ...props,
    };
    render(<ModalSubnotasPlanilla {...todas} />);
    return { ...callbacks, ...props };
}

describe("ModalSubnotasPlanilla", () => {
    it("es un diálogo con el estudiante, el tipo y su posición en el curso", () => {
        renderModal();

        const dialogo = screen.getByRole("dialog", { name: "Gómez Ana · Cognitivo" });
        expect(dialogo).toHaveAttribute("aria-modal", "true");
        expect(within(dialogo).getByText("Estudiante 1 de 30")).toBeInTheDocument();
    });

    it("muestra cada subnota con lo escrito y el promedio que pasa a la celda", () => {
        renderModal();

        expect(screen.getByLabelText("Taller 1")).toHaveValue("4");
        expect(screen.getByLabelText("Quiz")).toHaveValue("3");
        expect(screen.getByLabelText("Parcial")).toHaveValue("4.4");
        expect(screen.getByText("3.80")).toBeInTheDocument();
        expect(screen.getByText("→ pasa a la celda")).toBeInTheDocument();
    });

    it("el foco entra en la primera subnota", () => {
        renderModal();

        expect(screen.getByLabelText("Taller 1")).toHaveFocus();
    });

    it("avisa lo que escribe el profesor", () => {
        const { onCambiarCalificacion } = renderModal();

        fireEvent.change(screen.getByLabelText("Quiz"), { target: { value: "4,5" } });

        expect(onCambiarCalificacion).toHaveBeenCalledWith(8, "4,5");
    });

    it("Enter pasa a la subnota de abajo y en la última pasa al estudiante siguiente", () => {
        const { onSiguiente, onGuardar } = renderModal();

        fireEvent.keyDown(screen.getByLabelText("Taller 1"), { key: "Enter" });
        expect(screen.getByLabelText("Quiz")).toHaveFocus();

        fireEvent.keyDown(screen.getByLabelText("Parcial"), { key: "Enter" });
        expect(onSiguiente).toHaveBeenCalledTimes(1);
        expect(onGuardar).not.toHaveBeenCalled();
    });

    it("en el último estudiante, Enter en la última subnota guarda", () => {
        const { onSiguiente, onGuardar } = renderModal({ haySiguiente: false, hayAnterior: true });

        fireEvent.keyDown(screen.getByLabelText("Parcial"), { key: "Enter" });

        expect(onGuardar).toHaveBeenCalledTimes(1);
        expect(onSiguiente).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Siguiente →" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "← Anterior" })).toBeEnabled();
    });

    it("los botones de abajo guardan y mueven; Guardar espera cambios", async () => {
        const usuario = userEvent.setup();
        const { onGuardar, onSiguiente } = renderModal();

        await usuario.click(screen.getByRole("button", { name: "Guardar" }));
        await usuario.click(screen.getByRole("button", { name: "Siguiente →" }));

        expect(onGuardar).toHaveBeenCalledTimes(1);
        expect(onSiguiente).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: "← Anterior" })).toBeDisabled();
    });

    it("sin cambios, Guardar queda apagado", () => {
        renderModal({ hayCambios: false });

        expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    });

    it("Esc y la X cierran", async () => {
        const usuario = userEvent.setup();
        const { onCerrar } = renderModal();

        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        await usuario.click(screen.getByRole("button", { name: "Cerrar" }));

        expect(onCerrar).toHaveBeenCalledTimes(2);
    });

    it("un clic en el fondo cierra; un clic dentro del diálogo no", () => {
        const { onCerrar } = renderModal();

        fireEvent.click(screen.getByRole("dialog"));
        expect(onCerrar).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId("fondo-modal-subnotas"));
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    it("mientras guarda, nada se puede tocar y Esc no cierra", () => {
        const { onCerrar } = renderModal({ accionEnCurso: "guardar" });

        expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
        expect(screen.getByLabelText("Taller 1")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
        // La barra de abajo ya no está dentro del fieldset: se apaga por su cuenta.
        expect(screen.getByRole("button", { name: "Siguiente →" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "← Anterior" })).toBeDisabled();
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        fireEvent.click(screen.getByTestId("fondo-modal-subnotas"));
        expect(onCerrar).not.toHaveBeenCalled();
    });

    it("marca la nota mal escrita", () => {
        renderModal({ borrador: { 7: "6", 8: "3", 9: "" }, invalidas: ["7"] });

        const campo = screen.getByLabelText("Taller 1");
        expect(campo).toHaveAttribute("aria-invalid", "true");
        expect(campo).toHaveAccessibleDescription("Debe ser un número entre 1 y 5.");
        expect(screen.getByLabelText("Quiz")).toHaveAttribute("aria-invalid", "false");
    });

    it("P3 y P4: avisa la nota escrita a mano y la celda que queda vacía", () => {
        renderModal({ notaAMano: true, quedaraVacia: true });

        const avisos = screen.getAllByRole("note");
        expect(avisos[0]).toHaveTextContent(
            "Nota escrita a mano: 4.00. Al guardar subnotas se reemplaza por su promedio.",
        );
        expect(avisos[1]).toHaveTextContent(
            "Sin subnotas calificadas, la celda queda vacía para escribirla a mano.",
        );
    });

    it("sin subnotas invita a agregar la primera y el foco queda en el diálogo", () => {
        renderModal({ subnotas: [], borrador: {}, vistaPrevia: null });

        expect(screen.getByText(/todavía no tiene subnotas/)).toBeInTheDocument();
        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toHaveFocus();
    });

    it("agrega una subnota y limpia el nombre si salió bien", async () => {
        const usuario = userEvent.setup();
        const { onCrearSubnota } = renderModal();
        const campo = screen.getByLabelText("Nueva subnota (para todo el curso)");

        expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
        await usuario.type(campo, "Taller 2");
        await usuario.click(screen.getByRole("button", { name: "Agregar" }));

        expect(onCrearSubnota).toHaveBeenCalledWith("Taller 2");
        expect(campo).toHaveValue("");
    });

    it("en el límite no deja agregar más", () => {
        renderModal({ limiteAlcanzado: true });

        expect(screen.getByLabelText("Nueva subnota (para todo el curso)")).toBeDisabled();
        expect(screen.getByText("Ya tiene el máximo de 20 subnotas.")).toBeInTheDocument();
    });

    it("renombra en el mismo lugar, con Enter, y Esc cancela sin cerrar el modal", async () => {
        const usuario = userEvent.setup();
        const { onRenombrarSubnota, onCerrar } = renderModal();

        await usuario.click(screen.getByRole("button", { name: "Renombrar Quiz" }));
        const nombre = screen.getByLabelText("Nuevo nombre de Quiz");
        await usuario.clear(nombre);
        await usuario.type(nombre, "Quiz final{Enter}");
        expect(onRenombrarSubnota).toHaveBeenCalledWith(8, "Quiz final");

        await usuario.click(screen.getByRole("button", { name: "Renombrar Taller 1" }));
        fireEvent.keyDown(screen.getByLabelText("Nuevo nombre de Taller 1"), { key: "Escape" });
        expect(screen.queryByLabelText("Nuevo nombre de Taller 1")).not.toBeInTheDocument();
        expect(onCerrar).not.toHaveBeenCalled();
    });

    it("borrar pide al gancho que confirme", async () => {
        const usuario = userEvent.setup();
        const { onBorrarSubnota } = renderModal();

        await usuario.click(screen.getByRole("button", { name: "Borrar Parcial" }));

        expect(onBorrarSubnota).toHaveBeenCalledWith(9);
    });

    it("en preescolar cada subnota se califica con caritas; pulsar la activa la deja vacía", async () => {
        const usuario = userEvent.setup();
        const { onCambiarCalificacion } = renderModal({
            tipoEvaluacion: "desarrollo",
            borrador: { 7: "logrado", 8: "", 9: "" },
            vistaPrevia: { valoracion: { value: "logrado", label: "Logrado", emoji: "😀" } },
        });

        const taller = screen.getByRole("group", { name: "Valoración de Taller 1" });
        expect(within(taller).getByRole("button", { name: "Logrado en Taller 1" }))
            .toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText("😀 Logrado")).toBeInTheDocument();

        await usuario.click(within(taller).getByRole("button", { name: "Logrado en Taller 1" }));
        await usuario.click(screen.getByRole("button", { name: "Destacado en Quiz" }));

        expect(onCambiarCalificacion).toHaveBeenNthCalledWith(1, 7, "");
        expect(onCambiarCalificacion).toHaveBeenNthCalledWith(2, 8, "destacado");
    });

    it("mientras agrega una subnota lo dice aparte, sin cambiar el botón Guardar", () => {
        renderModal({ accionEnCurso: "crear" });

        expect(screen.getByRole("status")).toHaveTextContent("Agregando...");
        expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    });
});

describe("ModalSubnotasPlanilla con muchas subnotas (tablet, 2026-11-18)", () => {
    afterEach(() => {
        delete Element.prototype.scrollIntoView;
    });

    it("las subnotas se desplazan por dentro y la barra de abajo queda siempre a la vista", () => {
        renderModal();

        // El fieldset ya no reparte el alto: con varias subnotas el diálogo
        // crecía por debajo de la pantalla y no dejaba desplazarse.
        const cuerpo = screen.getByLabelText("Taller 1").closest(".overflow-y-auto");
        expect(cuerpo).toHaveClass("min-h-0", "flex-1");
        expect(cuerpo.parentElement).toBe(screen.getByRole("dialog"));

        const guardar = screen.getByRole("button", { name: "Guardar" });
        expect(guardar.closest("fieldset")).toBeNull();
        expect(cuerpo).not.toContainElement(guardar);
        // Red de seguridad: el fondo también se desplaza.
        expect(screen.getByTestId("fondo-modal-subnotas")).toHaveClass("overflow-y-auto");
    });

    it("al agregar una subnota baja hasta «Nueva subnota» para seguir agregando", () => {
        const scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView;
        const props = {
            estudiante: ANA,
            tipo: "Cognitivo",
            tipoEvaluacion: "numerica",
            subnotas: SUBNOTAS,
            borrador: {},
            posicion: 1,
            total: 30,
            onCambiarCalificacion: vi.fn(),
            onGuardar: vi.fn(),
            onSiguiente: vi.fn(),
            onAnterior: vi.fn(),
            onCerrar: vi.fn(),
            onCrearSubnota: vi.fn(),
            onRenombrarSubnota: vi.fn(),
            onBorrarSubnota: vi.fn(),
        };
        const { rerender } = render(<ModalSubnotasPlanilla {...props} />);
        // Abrir la ventana no mueve nada.
        expect(scrollIntoView).not.toHaveBeenCalled();

        rerender(<ModalSubnotasPlanilla {...props} subnotas={[...SUBNOTAS, { id: 10, nombre: "Taller 2" }]} />);

        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
        expect(scrollIntoView.mock.contexts[0]).toBe(
            screen.getByLabelText("Nueva subnota (para todo el curso)").closest("form"),
        );

        // Borrar una no mueve la vista.
        rerender(<ModalSubnotasPlanilla {...props} subnotas={SUBNOTAS} />);
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });
});
