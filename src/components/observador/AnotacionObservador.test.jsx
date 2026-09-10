import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AnotacionObservador from "./AnotacionObservador";

function anotacion(extra = {}) {
  return {
    id: 12,
    profesor_id: 7,
    profesor: "Ana Gómez",
    periodo: 1,
    positiva: false,
    conductual: "Se para mucho.",
    cognitivo: "",
    lenguaje: "",
    creada_en: "2026-03-20T12:00:00Z",
    editada_en: null,
    editada_por: null,
    ...extra,
  };
}

describe("AnotacionObservador", () => {
  it("muestra profesor, fecha y periodo junto al texto de la dimensión", () => {
    render(
      <AnotacionObservador anotacion={anotacion()} texto="Se para mucho." />,
    );

    expect(screen.getByText("Ana Gómez · 20/mar · P1")).toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
    expect(screen.getByText("Negativa")).toBeInTheDocument();
  });

  it("no muestra la materia, que se decidió no enseñar ni pedir", () => {
    render(
      <AnotacionObservador
        anotacion={anotacion({ materia: "Matemáticas" })}
        texto="Se para mucho."
      />,
    );

    expect(screen.queryByText(/Matemáticas/)).not.toBeInTheDocument();
  });

  it("dice «Sin fecha» en una heredada, en vez de inventarle una", () => {
    render(
      <AnotacionObservador
        anotacion={anotacion({ creada_en: null, positiva: null })}
        texto="Anotación vieja."
      />,
    );

    expect(screen.getByText("Ana Gómez · Sin fecha · P1")).toBeInTheDocument();
    expect(screen.getByText("Sin marcar")).toBeInTheDocument();
  });

  it("deja constancia de que la anotación fue editada", () => {
    render(
      <AnotacionObservador
        anotacion={anotacion({ editada_en: "2026-04-02T12:00:00Z" })}
        texto="Se para mucho."
      />,
    );

    expect(screen.getByText("Editada el 2/abr")).toBeInTheDocument();
  });

  it("no pinta ningún botón: ni borrar, ni editar todavía", () => {
    render(
      <AnotacionObservador anotacion={anotacion()} texto="Se para mucho." />,
    );

    // Nadie borra una anotación, en ninguna vista y para nadie. El botón de
    // editar llega en la fase 2 y solo en las propias.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
