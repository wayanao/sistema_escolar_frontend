import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VentanaFirmaAnotacion from "./VentanaFirmaAnotacion";
import { instalarLienzoFalso } from "../../test/lienzoFalso";
import { FIRMANTE_VACIO } from "../../utils/observador/firma";

const ANOTACION = {
  id: 12,
  profesor_id: 7,
  profesor: "Ana Gómez",
  periodo: 1,
  conductual: "Se para mucho.",
  cognitivo: "",
  lenguaje: "Habla claro.",
  creada_en: "2026-03-20T12:00:00Z",
  version: "v12",
  puede_firmar: true,
  firma: null,
};
const MADRE = {
  parentesco: "Madre",
  nombre: "Maria Lopez",
  tipo_documento: "Cédula",
  documento: "52123456",
};

function pintar(props = {}) {
  const callbacks = {
    onCambiarFirmante: vi.fn(),
    onElegirSugerido: vi.fn(),
    onCambiarImagen: vi.fn(),
    onCambiarLeida: vi.fn(),
    onGuardar: vi.fn(),
    onFirmarSiguiente: vi.fn(),
    onCerrar: vi.fn(),
  };
  render(
    <VentanaFirmaAnotacion
      titulo="Pepito Pérez · Primaria"
      anotaciones={[ANOTACION]}
      firmante={FIRMANTE_VACIO}
      sugeridos={[MADRE]}
      leida={false}
      falta="Escribe el nombre de quien firma."
      {...callbacks}
      {...props}
    />,
  );
  return callbacks;
}

beforeEach(() => {
  instalarLienzoFalso();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VentanaFirmaAnotacion", () => {
  it("es un diálogo con el texto completo de lo que el acudiente firma", () => {
    pintar();

    expect(screen.getByRole("dialog", { name: "Firma del acudiente" })).toBeInTheDocument();
    expect(screen.getByText("Pepito Pérez · Primaria")).toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
    expect(screen.getByText("Habla claro.")).toBeInTheDocument();
    expect(screen.getByText("20/mar · Ana Gómez · P1")).toBeInTheDocument();
  });

  it("ofrece al papá o la mamá de la ficha", async () => {
    const user = userEvent.setup();
    const { onElegirSugerido } = pintar();

    await user.click(screen.getByRole("button", { name: "Madre: Maria Lopez" }));

    expect(onElegirSugerido).toHaveBeenCalledWith(MADRE);
  });

  it("los datos de quien firma se pueden escribir a mano", async () => {
    const user = userEvent.setup();
    const { onCambiarFirmante } = pintar();

    await user.type(screen.getByLabelText("Nombre completo"), "R");
    await user.type(screen.getByLabelText("Número de documento"), "7");
    await user.type(screen.getByLabelText("Parentesco"), "A");

    expect(onCambiarFirmante).toHaveBeenCalledWith("nombre", "R");
    expect(onCambiarFirmante).toHaveBeenCalledWith("documento", "7");
    expect(onCambiarFirmante).toHaveBeenCalledWith("parentesco", "A");
  });

  it("los botones quedan fuera de la zona que se desplaza, siempre a la vista", () => {
    pintar();

    // El 2026-10-27, con el <fieldset> repartiendo el alto, la ventana creció
    // por debajo de la pantalla y "Guardar firma" quedó fuera de la vista. Los
    // botones van en su propia barra, fuera del fieldset y del desplazamiento.
    const guardar = screen.getByRole("button", { name: "Guardar firma" });
    expect(guardar.closest("fieldset")).toBeNull();
    expect(guardar.closest(".overflow-y-auto")).toBe(
      screen.getByRole("dialog").parentElement,
    );
  });

  it("no deja guardar mientras falte algo, y dice qué falta", () => {
    pintar();

    expect(screen.getByRole("button", { name: "Guardar firma" })).toBeDisabled();
    expect(screen.getByText("Escribe el nombre de quien firma.")).toBeInTheDocument();
  });

  it("con todo completo guarda", async () => {
    const user = userEvent.setup();
    const { onGuardar, onCambiarLeida } = pintar({ falta: null });

    await user.click(screen.getByLabelText("El acudiente leyó esta anotación."));
    await user.click(screen.getByRole("button", { name: "Guardar firma" }));

    expect(onCambiarLeida).toHaveBeenCalledWith(true);
    expect(onGuardar).toHaveBeenCalledTimes(1);
  });

  it("enseña el error del servidor", () => {
    pintar({ error: "Esta anotacion ya tiene la firma del acudiente." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Esta anotacion ya tiene la firma del acudiente.",
    );
  });

  it("se cierra con Esc, pero no mientras guarda", async () => {
    const user = userEvent.setup();
    const { onCerrar } = pintar();

    await user.keyboard("{Escape}");
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("mientras guarda no se puede cerrar ni volver a guardar", () => {
    pintar({ guardando: true, falta: null });

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
  });

  it("después de guardar confirma la firma y ofrece la siguiente", async () => {
    const user = userEvent.setup();
    const { onFirmarSiguiente } = pintar({
      firmada: {
        firmante_nombre: "Maria Lopez",
        firmante_parentesco: "Madre",
        firmante_tipo_documento: "Cédula",
        firmante_documento_enmascarado: "****3456",
        firmada_en: null,
        tomada_por_nombre: "Ana Gómez",
      },
      haySiguiente: true,
    });

    expect(screen.getByRole("status")).toHaveTextContent("Firma guardada.");
    expect(screen.queryByRole("button", { name: "Guardar firma" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Firmar la siguiente" }));
    expect(onFirmarSiguiente).toHaveBeenCalledTimes(1);
  });

  it("al firmar un periodo muestra todo lo que se firma, con una sola firma", () => {
    const otra = { ...ANOTACION, id: 13, conductual: "Otra cosa del periodo.", lenguaje: "" };
    pintar({ anotaciones: [ANOTACION, otra], periodo: 1, falta: null });

    expect(
      screen.getByText("Periodo 1: 2 anotaciones por firmar, con una sola firma."),
    ).toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
    expect(screen.getByText("Otra cosa del periodo.")).toBeInTheDocument();
    expect(screen.getByLabelText("El acudiente leyó estas 2 anotaciones.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar firma (2)" })).toBeEnabled();
  });

  it("con varios periodos pendientes se puede cambiar de periodo", async () => {
    const user = userEvent.setup();
    const onCambiarPeriodo = vi.fn();
    pintar({
      anotaciones: [ANOTACION],
      periodo: 1,
      periodos: [{ periodo: 1, cantidad: 1 }, { periodo: 3, cantidad: 2 }],
      onCambiarPeriodo,
    });

    expect(screen.getByRole("button", { name: "Periodo 1 (1)" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Periodo 3 (2)" }));

    expect(onCambiarPeriodo).toHaveBeenCalledWith(3);
  });

  it("después de firmar un periodo dice en cuántas anotaciones quedó la firma", () => {
    pintar({
      periodo: 1,
      firmada: [
        { anotacion_id: 12, firmante_nombre: "Maria Lopez", firmante_parentesco: "Madre" },
        { anotacion_id: 13, firmante_nombre: "Maria Lopez", firmante_parentesco: "Madre" },
      ],
    });

    expect(screen.getByRole("status")).toHaveTextContent("Firma guardada en 2 anotaciones.");
    expect(screen.queryByRole("button", { name: "Firmar la siguiente" })).not.toBeInTheDocument();
  });

  it("sin pendientes, después de guardar solo queda cerrar", () => {
    pintar({ firmada: { firmante_nombre: "Maria Lopez" }, haySiguiente: false });

    expect(screen.queryByRole("button", { name: "Firmar la siguiente" })).not.toBeInTheDocument();
    expect(
      screen.getByText("No quedan anotaciones de este estudiante que puedas firmar."),
    ).toBeInTheDocument();
  });
});
