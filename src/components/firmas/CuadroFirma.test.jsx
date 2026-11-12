import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { instalarLienzoFalso } from "../../test/lienzoFalso";
import CuadroFirma from "./CuadroFirma";

const IMAGEN = "data:image/png;base64,firma";
const GUARDADA = { imagen: IMAGEN, actualizado_en: "2026-11-12T15:30:00+00:00" };
const EDITOR_CERRADO = { modo: null, imagen: null, preparando: false, error: "" };

let acciones;

beforeEach(() => {
  acciones = {
    onElegirFoto: vi.fn(),
    onAbrirDibujo: vi.fn(),
    onCambiarDibujo: vi.fn(),
    onGuardar: vi.fn(),
    onCancelar: vi.fn(),
    onQuitar: vi.fn(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

function pintar(props = {}) {
  return render(
    <CuadroFirma
      titulo="Firma del rector(a)"
      descripcion="Sale en los boletines."
      firma={null}
      editor={EDITOR_CERRADO}
      {...acciones}
      {...props}
    />,
  );
}

describe("CuadroFirma", () => {
  it("sin firma guardada ofrece subir una foto o firmar con el dedo", () => {
    pintar();

    expect(screen.getByRole("heading", { name: "Firma del rector(a)" })).toBeInTheDocument();
    expect(screen.getByText("Sin firma")).toBeInTheDocument();
    expect(screen.getByText(/los boletines salen con la raya vacía/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir foto de la firma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Firmar aquí con el dedo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar firma" })).not.toBeInTheDocument();
  });

  it("con firma la muestra sobre la raya, con su fecha, y deja cambiarla o quitarla", async () => {
    pintar({ firma: GUARDADA });

    expect(screen.getByRole("img", { name: "Firma" })).toHaveAttribute("src", IMAGEN);
    expect(screen.getByText("Guardada el 12 de noviembre de 2026.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar con una foto" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cambiar firmando aquí" }));
    expect(acciones.onAbrirDibujo).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Quitar firma" }));
    expect(acciones.onQuitar).toHaveBeenCalled();
  });

  it("la foto elegida pasa tal cual a quien la prepara", async () => {
    pintar();
    const archivo = new File(["x"], "firma.jpg", { type: "image/jpeg" });

    await userEvent.upload(screen.getByTestId("entrada-foto-firma"), archivo);

    expect(acciones.onElegirFoto).toHaveBeenCalledWith(archivo);
  });

  it("mientras carga, el caminito y nada más", () => {
    pintar({ cargando: true });

    expect(screen.getByRole("progressbar", { name: "Cargando la firma" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("enseña el error de guardar o de cargar", () => {
    pintar({ mensajeError: "No se pudo guardar la firma." });

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar la firma.");
  });

  describe("firmando con el dedo", () => {
    beforeEach(() => {
      instalarLienzoFalso();
    });

    it("sin trazo no deja guardar", () => {
      pintar({ editor: { ...EDITOR_CERRADO, modo: "dibujo" } });

      expect(screen.getByRole("img", { name: "Recuadro para firmar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Guardar firma" })).toBeDisabled();
    });

    it("con el trazo listo guarda, y Cancelar vuelve atrás", async () => {
      pintar({ editor: { ...EDITOR_CERRADO, modo: "dibujo", imagen: IMAGEN } });

      await userEvent.click(screen.getByRole("button", { name: "Guardar firma" }));
      expect(acciones.onGuardar).toHaveBeenCalled();

      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(acciones.onCancelar).toHaveBeenCalled();
    });

    it("mientras guarda, el botón no se puede oprimir otra vez", () => {
      pintar({ guardando: true, editor: { ...EDITOR_CERRADO, modo: "dibujo", imagen: IMAGEN } });

      expect(screen.getByRole("button", { name: "Guardar firma" })).toBeDisabled();
    });
  });

  describe("con una foto", () => {
    it("mientras la prepara, el caminito y sin guardar", () => {
      pintar({ editor: { ...EDITOR_CERRADO, modo: "foto", preparando: true } });

      expect(screen.getByRole("progressbar", { name: "Preparando la foto" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Guardar firma" })).toBeDisabled();
    });

    it("enseña cómo va a salir antes de guardarla", async () => {
      pintar({ editor: { ...EDITOR_CERRADO, modo: "foto", imagen: IMAGEN } });

      expect(screen.getByText("Así va a salir:")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Firma" })).toHaveAttribute("src", IMAGEN);

      await userEvent.click(screen.getByRole("button", { name: "Guardar firma" }));
      expect(acciones.onGuardar).toHaveBeenCalled();
    });

    it("si la foto no sirve, lo dice y deja elegir otra", async () => {
      pintar({
        editor: { ...EDITOR_CERRADO, modo: "foto", error: "No se ve ninguna firma en la foto." },
      });

      expect(screen.getByRole("alert")).toHaveTextContent("No se ve ninguna firma en la foto.");
      expect(screen.getByRole("button", { name: "Guardar firma" })).toBeDisabled();

      const entrada = screen.getByTestId("entrada-foto-firma");
      const abrir = vi.spyOn(entrada, "click");
      await userEvent.click(screen.getByRole("button", { name: "Elegir otra foto" }));
      expect(abrir).toHaveBeenCalled();
    });
  });
});
