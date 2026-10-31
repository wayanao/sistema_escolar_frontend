import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AVISO_RENOMBRAR_CUADROS,
  crearBorradorCuadros,
  nombresCuadrosPlan,
  RECIBE_CUADRO,
} from "../../../utils/planeaciones/cuadros";
import VentanaCuadrosPlanAdmin from "./VentanaCuadrosPlanAdmin";

const CUADROS = nombresCuadrosPlan([{ clave: "proposito", nombre: "Objetivo", ayuda: "" }]);

function renderizar(props = {}) {
  const acciones = {
    onCambiar: vi.fn(),
    onVolverAOriginales: vi.fn(),
    onGuardar: vi.fn(),
    onReintentar: vi.fn(),
    onCerrar: vi.fn(),
  };
  render(
    <VentanaCuadrosPlanAdmin
      cuadros={CUADROS}
      valores={crearBorradorCuadros(CUADROS)}
      {...acciones}
      {...props}
    />,
  );
  return acciones;
}

const fila = (original) => screen.getByRole("group", { name: `Cuadro ${original}` });

describe("VentanaCuadrosPlanAdmin", () => {
  it("avisa qué no cambia y muestra una fila por cuadro con lo que recibe", () => {
    renderizar();

    expect(screen.getByRole("dialog", { name: "Nombres de los cuadros" })).toBeInTheDocument();
    expect(screen.getByText(AVISO_RENOMBRAR_CUADROS)).toBeInTheDocument();
    expect(screen.getAllByRole("group", { name: /^Cuadro / })).toHaveLength(9);

    const logro = fila("Logro");
    expect(within(logro).getByText("Original: Logro")).toBeInTheDocument();
    expect(within(logro).getByLabelText("Nombre")).toHaveValue("Objetivo");
    expect(within(logro).getByLabelText(/Texto de ayuda/)).toHaveValue("");
    expect(within(logro).getByText(RECIBE_CUADRO.texto)).toBeInTheDocument();
  });

  it("los archivos no tienen texto de ayuda y dicen qué archivos aceptan", () => {
    renderizar();

    const archivo = fila("Actividad a desarrollar");
    expect(within(archivo).queryByLabelText(/Texto de ayuda/)).not.toBeInTheDocument();
    expect(within(archivo).getByText(RECIBE_CUADRO.archivo)).toBeInTheDocument();
  });

  it("avisa cada cambio con la clave y el campo", () => {
    const { onCambiar } = renderizar();

    fireEvent.change(within(fila("Unidad")).getByLabelText("Nombre"), {
      target: { value: "Eje temático" },
    });
    fireEvent.change(within(fila("Tema")).getByLabelText(/Texto de ayuda/), {
      target: { value: "De qué trata la clase" },
    });

    expect(onCambiar).toHaveBeenCalledWith("unidad", "nombre", "Eje temático");
    expect(onCambiar).toHaveBeenCalledWith("tema", "ayuda", "De qué trata la clase");
  });

  it("muestra el error de cada campo junto a él", () => {
    renderizar({
      errores: { tema: { nombre: "Otro cuadro ya se llama así." } },
      error: "Revisa los cuadros marcados.",
    });

    const nombre = within(fila("Tema")).getByLabelText("Nombre");
    expect(nombre).toHaveAttribute("aria-invalid", "true");
    expect(nombre).toHaveAccessibleDescription(/Otro cuadro ya se llama así\./);
    expect(screen.getByRole("alert")).toHaveTextContent("Revisa los cuadros marcados.");
  });

  it("sin haber leído los nombres, no hay campos ni se puede guardar, y deja reintentar", () => {
    const { onReintentar } = renderizar({
      errorLectura: "No se pudieron leer los nombres de los cuadros.",
    });

    expect(screen.queryAllByRole("group", { name: /^Cuadro / })).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Volver a los originales" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it("mientras carga, avisa y no deja guardar", () => {
    renderizar({ cargando: true });

    expect(screen.getByRole("status")).toHaveTextContent("Cargando los nombres actuales...");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("guardar, volver a los originales y cancelar llaman a su acción", () => {
    const acciones = renderizar();

    fireEvent.click(screen.getByRole("button", { name: "Volver a los originales" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(acciones.onVolverAOriginales).toHaveBeenCalledTimes(1);
    expect(acciones.onGuardar).toHaveBeenCalledTimes(1);
    expect(acciones.onCerrar).toHaveBeenCalledTimes(1);
  });

  it("se cierra con Esc, pero no mientras guarda", () => {
    const { onCerrar } = renderizar();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("mientras guarda, todo queda bloqueado", () => {
    const { onCerrar } = renderizar({ guardando: true });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCerrar).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(within(fila("Unidad")).getByLabelText("Nombre")).toBeDisabled();
  });
});
