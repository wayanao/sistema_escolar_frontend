import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecuadroFirma from "./RecuadroFirma";
import { IMAGEN_FALSA, instalarLienzoFalso } from "../../test/lienzoFalso";

let contexto;

beforeEach(() => {
  contexto = instalarLienzoFalso();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function trazar(lienzo) {
  fireEvent.pointerDown(lienzo, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(lienzo, { pointerId: 1, clientX: 40, clientY: 20 });
  fireEvent.pointerUp(lienzo, { pointerId: 1, clientX: 40, clientY: 20 });
}

describe("RecuadroFirma", () => {
  it("empieza en blanco, con fondo blanco y sin poder borrar", () => {
    render(<RecuadroFirma onCambio={vi.fn()} />);

    expect(contexto.fillRect).toHaveBeenCalled();
    expect(screen.getByText("Firme aquí con el dedo, un lápiz o el mouse.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Borrar" })).toBeDisabled();
  });

  it("al terminar un trazo entrega la firma como imagen", () => {
    const onCambio = vi.fn();
    render(<RecuadroFirma onCambio={onCambio} />);

    trazar(screen.getByRole("img", { name: "Recuadro para la firma del acudiente" }));

    expect(contexto.stroke).toHaveBeenCalled();
    expect(onCambio).toHaveBeenLastCalledWith(IMAGEN_FALSA);
    expect(screen.getByText("Firma lista.")).toBeInTheDocument();
  });

  it("borrar deja el recuadro en blanco y avisa que ya no hay firma", async () => {
    const user = userEvent.setup();
    const onCambio = vi.fn();
    render(<RecuadroFirma onCambio={onCambio} />);
    trazar(screen.getByRole("img"));

    await user.click(screen.getByRole("button", { name: "Borrar" }));

    expect(onCambio).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("button", { name: "Borrar" })).toBeDisabled();
  });

  it("deshabilitado no dibuja ni entrega nada", () => {
    const onCambio = vi.fn();
    render(<RecuadroFirma onCambio={onCambio} deshabilitado />);

    trazar(screen.getByRole("img"));

    expect(contexto.stroke).not.toHaveBeenCalled();
    expect(onCambio).not.toHaveBeenCalled();
  });
});
