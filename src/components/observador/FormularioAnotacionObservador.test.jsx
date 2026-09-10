import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FormularioAnotacionObservador from "./FormularioAnotacionObservador";

const VACIO = { conductual: "", cognitivo: "", lenguaje: "" };

function pintar(props = {}) {
  return render(
    <FormularioAnotacionObservador
      titulo="Nueva anotación"
      valores={VACIO}
      onCambiarTexto={vi.fn()}
      onSalirDeCampo={vi.fn()}
      onGuardar={vi.fn()}
      onCancelar={vi.fn()}
      guardando={false}
      puedeGuardar
      error={null}
      periodoTexto="Se guardará en el Periodo 3, el que tienes activo."
      {...props}
    />,
  );
}

describe("FormularioAnotacionObservador", () => {
  it("conserva los tres campos de siempre", () => {
    pintar();

    expect(screen.getByLabelText("Conductual")).toBeInTheDocument();
    expect(screen.getByLabelText("Cognitivo")).toBeInTheDocument();
    expect(screen.getByLabelText("Lenguaje")).toBeInTheDocument();
  });

  it("avisa en qué periodo va a quedar guardada", () => {
    // El periodo se le queda pegado para siempre: editar no lo cambia y borrar
    // no existe, así que la profesora tiene que poder verlo antes.
    pintar();

    expect(
      screen.getByText("Se guardará en el Periodo 3, el que tienes activo."),
    ).toBeInTheDocument();
  });

  it("no pregunta si la observación es buena o mala", () => {
    // Se quito el 2026-09-09, a peticion del usuario.
    pintar();

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByText(/positiva o negativa/i)).not.toBeInTheDocument();
  });

  it("avisa del texto al escribir y pide la corrección al salir del campo", async () => {
    const user = userEvent.setup();
    const onCambiarTexto = vi.fn();
    const onSalirDeCampo = vi.fn();
    pintar({ onCambiarTexto, onSalirDeCampo });

    await user.type(screen.getByLabelText("Conductual"), "a");
    expect(onCambiarTexto).toHaveBeenCalledWith("conductual", "a");
    // Al teclear no se corrige nada; la corrección se pide al salir.
    expect(onSalirDeCampo).not.toHaveBeenCalled();

    await user.tab();
    expect(onSalirDeCampo).toHaveBeenCalledWith("conductual");
  });

  it("no deja guardar mientras el formulario esté incompleto", () => {
    pintar({ puedeGuardar: false });

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("bloquea todo y lo dice mientras guarda", () => {
    pintar({ guardando: true });

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(screen.getByLabelText("Conductual")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("enseña el error que devolvió el servidor", () => {
    pintar({ error: "Solo quien escribio una anotacion puede editarla." });

    expect(
      screen.getByText("Solo quien escribio una anotacion puede editarla."),
    ).toBeInTheDocument();
  });

  it("guarda y cancela avisando a quien lo montó", async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn();
    const onCancelar = vi.fn();
    pintar({ onGuardar, onCancelar });

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onGuardar).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("no ofrece borrar", () => {
    pintar();

    const botones = screen.getAllByRole("button").map((boton) => boton.textContent);
    expect(botones.some((texto) => /borrar|eliminar/i.test(texto))).toBe(false);
  });
});
