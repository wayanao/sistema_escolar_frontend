import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("pinta [Editar] solo en las propias", async () => {
    const user = userEvent.setup();
    const onEditar = vi.fn();
    const propia = anotacion();

    const { rerender } = render(
      <AnotacionObservador
        anotacion={propia}
        texto="Se para mucho."
        esPropia={false}
        onEditar={onEditar}
      />,
    );
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();

    rerender(
      <AnotacionObservador
        anotacion={propia}
        texto="Se para mucho."
        esPropia
        onEditar={onEditar}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(onEditar).toHaveBeenCalledWith(propia);
  });

  it("no pinta ningún botón de borrar, ni siquiera en la propia", () => {
    render(
      <AnotacionObservador
        anotacion={anotacion()}
        texto="Se para mucho."
        esPropia
        onEditar={vi.fn()}
      />,
    );

    // Nadie borra una anotación, en ninguna vista y para nadie.
    const botones = screen.getAllByRole("button").map((boton) => boton.textContent);
    expect(botones).toStrictEqual(["Editar"]);
  });
});
