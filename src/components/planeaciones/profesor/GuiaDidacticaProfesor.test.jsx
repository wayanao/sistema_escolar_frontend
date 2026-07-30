import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../ImagenProtegida", () => ({
  useImagenProtegida: () => ({
    url: "https://auligo.test/evidencia.webp",
    cargando: false,
    error: "",
  }),
}));

import GuiaDidacticaProfesor from "./GuiaDidacticaProfesor";

const form = {
  unidad: "Números",
  proposito: "",
  clase: "",
  estandar: "",
  dba: "",
  competencias: "",
  actividad_casa: "",
  tema: "Fracciones",
};

function crearPropiedades(overrides = {}) {
  return {
    asignacion: {
      materia: "Matemáticas",
      curso: "5A",
      jornada: "Mañana",
    },
    cargando: false,
    form,
    imagenesSeleccionadas: {},
    imagenesGuardadas: { imagen1: null, imagen2: null },
    onActualizarCampo: vi.fn(),
    onRegistrarInputImagen: vi.fn(),
    onManejarImagen: vi.fn(),
    onEliminarImagen: vi.fn(),
    onAbrirPresentacion: vi.fn(),
    ...overrides,
  };
}

describe("GuiaDidacticaProfesor", () => {
  it("muestra la carga sin montar los campos editables", () => {
    render(<GuiaDidacticaProfesor {...crearPropiedades({ cargando: true })} />);

    expect(screen.getByText("Cargando datos de la guía...")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Tema central de la clase"),
    ).not.toBeInTheDocument();
  });

  it("entrega los cambios de campos y abre la presentación", async () => {
    const props = crearPropiedades();
    const user = userEvent.setup();
    render(<GuiaDidacticaProfesor {...props} />);

    fireEvent.change(screen.getByPlaceholderText("Tema central de la clase"), {
      target: { value: "Fracciones equivalentes" },
    });
    await user.click(
      screen.getByRole("button", { name: "Presentación de clase" }),
    );

    expect(props.onActualizarCampo).toHaveBeenCalledWith(
      "tema",
      "Fracciones equivalentes",
    );
    expect(props.onAbrirPresentacion).toHaveBeenCalledTimes(1);
  });

  it("conecta la evidencia guardada con la acción de borrado", async () => {
    const props = crearPropiedades({
      imagenesGuardadas: {
        imagen1: "/evidencia.webp",
        imagen2: null,
      },
    });
    const user = userEvent.setup();
    render(<GuiaDidacticaProfesor {...props} />);

    await user.click(screen.getByRole("button", { name: "Borrar" }));
    expect(props.onEliminarImagen).toHaveBeenCalledWith("imagen1");
  });
});
