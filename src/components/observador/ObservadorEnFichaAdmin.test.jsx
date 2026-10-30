import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  firmarAnotacionMock,
  firmarAnotacionesDelPeriodoMock,
  obtenerFirmantesSugeridosMock,
  obtenerObservadorMock,
  usePrintConfigMock,
} = vi.hoisted(() => ({
  firmarAnotacionMock: vi.fn(),
  firmarAnotacionesDelPeriodoMock: vi.fn(),
  obtenerFirmantesSugeridosMock: vi.fn(),
  obtenerObservadorMock: vi.fn(),
  usePrintConfigMock: vi.fn(),
}));

vi.mock("../../services/observadorApi", () => ({
  firmarAnotacion: firmarAnotacionMock,
  firmarAnotacionesDelPeriodo: firmarAnotacionesDelPeriodoMock,
  obtenerFirmantesSugeridos: obtenerFirmantesSugeridosMock,
  obtenerObservador: obtenerObservadorMock,
}));

vi.mock("../../hooks/certificadosImpresion/usePrintConfig", () => ({
  default: usePrintConfigMock,
}));

import ObservadorEnFichaAdmin from "./ObservadorEnFichaAdmin";
import { instalarLienzoFalso } from "../../test/lienzoFalso";

const ESTUDIANTE = { id: 11, nombre: "Ana", apellido: "Rojas" };

const BITACORA = {
  nivel: "primaria",
  anotaciones: [
    {
      id: 12,
      profesor_id: 7,
      profesor: "Sara Díaz",
      periodo: 2,
      conductual: "Participa mucho.",
      cognitivo: "",
      lenguaje: "",
      creada_en: "2026-08-02T12:00:00Z",
      editada_en: null,
      editada_por: null,
    },
    {
      id: 13,
      profesor_id: 8,
      profesor: "Luis Pardo",
      periodo: 2,
      conductual: "",
      cognitivo: "Avanza bien.",
      lenguaje: "",
      creada_en: "2026-07-30T12:00:00Z",
      editada_en: null,
      editada_por: null,
    },
  ],
};

beforeEach(() => {
  obtenerObservadorMock.mockReset().mockResolvedValue(BITACORA);
  usePrintConfigMock.mockReturnValue({
    branding: { nombre_institucion: "Colegio de Prueba" },
    plantilla: { config_json: {} },
    loading: false,
    error: null,
  });
});

describe("ObservadorEnFichaAdmin", () => {
  it("monta la misma vista que ve la profesora, con todos los profesores", async () => {
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);

    expect(await screen.findByText("Participa mucho.")).toBeInTheDocument();
    // Agrupada por dimension, igual que la del profesor.
    expect(screen.getByRole("heading", { name: "Conductual" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cognitivo" })).toBeInTheDocument();
    // La bitacora completa: las de todos los profesores, no las de uno.
    expect(screen.getByText("Sara Díaz")).toBeInTheDocument();
    expect(screen.getByText("Luis Pardo")).toBeInTheDocument();
  });

  it("cada profesor conserva su color", async () => {
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    await screen.findByText("Participa mucho.");

    expect(screen.getByText("Sara Díaz").className)
      .not.toBe(screen.getByText("Luis Pardo").className);
  });

  it("el admin NO puede escribir ni editar", async () => {
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    await screen.findByText("Participa mucho.");

    // El servidor responde 403 a las dos cosas -es la decision 9-, asi que ni
    // siquiera se le ensenan los botones.
    expect(screen.queryByRole("button", { name: "Nueva anotación" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("no ofrece borrar, como en ninguna vista", async () => {
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    await screen.findByText("Participa mucho.");

    const botones = screen.getAllByRole("button").map((b) => b.textContent);
    expect(botones.some((t) => /borrar|eliminar/i.test(t))).toBe(false);
  });

  it("solo puede imprimir el documento general", async () => {
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    await screen.findByText("Participa mucho.");

    const menu = screen.getByRole("combobox", { name: /Imprimir/ });
    const opciones = Array.from(menu.options).map((o) => o.textContent);

    // "Solo mis anotaciones" le saldria siempre en blanco: no tiene ninguna.
    expect(opciones).toStrictEqual(["Elige qué imprimir", "Todo el observador"]);
  });

  it("el impreso sale con todas las anotaciones y lo firma el director de grupo", async () => {
    const user = userEvent.setup();
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    await screen.findByText("Participa mucho.");

    await user.selectOptions(screen.getByRole("combobox", { name: /Imprimir/ }), "todo");

    expect(
      await screen.findByText("Estudiante: Ana Rojas · Primaria · Año completo"),
    ).toBeInTheDocument();
    expect(screen.getByText("Director de grupo")).toBeInTheDocument();
    expect(screen.getByText("Participa mucho.")).toBeInTheDocument();
    expect(screen.getByText("Avanza bien.")).toBeInTheDocument();
  });

  it("conserva el cambio de vista y el selector de periodo", async () => {
    const user = userEvent.setup();
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    await screen.findByText("Participa mucho.");

    await user.click(screen.getByRole("button", { name: "Por fecha" }));
    expect(screen.getByText("Conductual:")).toBeInTheDocument();
    // Cambiar de vista no vuelve a consultar.
    expect(obtenerObservadorMock).toHaveBeenCalledTimes(1);

    await user.selectOptions(screen.getByRole("combobox", { name: /Periodo/ }), "2");
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));
    expect(obtenerObservadorMock.mock.calls[1][1].periodo).toBe(2);
  });

  it("no pinta el título ni el botón de volver: la ficha ya dice de quién es", async () => {
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    await screen.findByText("Participa mucho.");

    expect(screen.queryByText(/Observador de Ana Rojas/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "← Volver a la lista" }))
      .not.toBeInTheDocument();
  });

  it("cuenta los registros y dice cuando no hay ninguno", async () => {
    const { rerender } = render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);
    expect(await screen.findByText("2 registros")).toBeInTheDocument();

    obtenerObservadorMock.mockResolvedValue({ nivel: "primaria", anotaciones: [] });
    rerender(<ObservadorEnFichaAdmin estudiante={{ ...ESTUDIANTE, id: 12 }} />);

    expect(
      await screen.findByText("Todavía nadie le ha escrito nada a este estudiante."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 registros")).toBeInTheDocument();
  });
});

describe("ObservadorEnFichaAdmin: firma del acudiente", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("el admin no escribe, pero sí toma la firma donde el servidor lo permite", async () => {
    instalarLienzoFalso();
    obtenerFirmantesSugeridosMock.mockResolvedValue([]);
    obtenerObservadorMock.mockResolvedValue({
      ...BITACORA,
      anotaciones: [
        { ...BITACORA.anotaciones[0], puede_firmar: true, firma: null, version: "v12" },
        { ...BITACORA.anotaciones[1], puede_firmar: false, firma: null },
      ],
    });
    const user = userEvent.setup();
    render(<ObservadorEnFichaAdmin estudiante={ESTUDIANTE} />);

    await user.click(await screen.findByRole("button", { name: "Firmar con el acudiente" }));

    // Sigue sin poder escribir ni editar: firmar no cambia el texto de nadie.
    expect(screen.queryByRole("button", { name: "Nueva anotación" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    const ventana = screen.getByRole("dialog", { name: "Firma del acudiente" });
    expect(within(ventana).getByText("Participa mucho.")).toBeInTheDocument();
    await waitFor(() => expect(obtenerFirmantesSugeridosMock).toHaveBeenCalledWith(11, {
      signal: expect.any(AbortSignal),
    }));
  });
});
