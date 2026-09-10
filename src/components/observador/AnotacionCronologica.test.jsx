import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AnotacionCronologica from "./AnotacionCronologica";
import { colorDeProfesor } from "../../utils/observador/coloresProfesor";

function anotacion(extra = {}) {
  return {
    id: 12,
    profesor_id: 7,
    profesor: "Ana Gómez",
    periodo: 1,
    conductual: "Se para mucho.",
    cognitivo: "",
    lenguaje: "",
    creada_en: "2026-03-20T12:00:00Z",
    editada_en: null,
    editada_por: null,
    ...extra,
  };
}

describe("AnotacionCronologica", () => {
  it("pone la fecha delante, que es lo que manda en esta vista", () => {
    render(<AnotacionCronologica anotacion={anotacion()} />);

    expect(screen.getByText("20/mar ·")).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("· P1")).toBeInTheDocument();
  });

  it("junta todas las dimensiones en una sola tarjeta, con su nombre delante", () => {
    // Es al reves que la vista por dimension, donde la anotacion se reparte
    // entre varios bloques.
    render(
      <AnotacionCronologica
        anotacion={anotacion({ cognitivo: "Muy creativo.", lenguaje: "Habla claro." })}
      />,
    );

    expect(screen.getByText("Conductual:")).toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
    expect(screen.getByText("Cognitivo:")).toBeInTheDocument();
    expect(screen.getByText("Muy creativo.")).toBeInTheDocument();
    expect(screen.getByText("Lenguaje:")).toBeInTheDocument();
  });

  it("no nombra las dimensiones que están vacías", () => {
    render(<AnotacionCronologica anotacion={anotacion()} />);

    expect(screen.queryByText("Cognitivo:")).not.toBeInTheDocument();
    expect(screen.queryByText("Lenguaje:")).not.toBeInTheDocument();
  });

  it("conserva el color del profesor, igual que la otra vista", () => {
    render(<AnotacionCronologica anotacion={anotacion()} />);

    expect(screen.getByText("Ana Gómez").className)
      .toBe(`font-semibold ${colorDeProfesor(7)}`);
  });

  it("deja editar solo las propias, y no ofrece borrar", async () => {
    const user = userEvent.setup();
    const onEditar = vi.fn();
    const propia = anotacion();

    const { rerender } = render(
      <AnotacionCronologica anotacion={propia} esPropia={false} onEditar={onEditar} />,
    );
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();

    rerender(<AnotacionCronologica anotacion={propia} esPropia onEditar={onEditar} />);
    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(onEditar).toHaveBeenCalledWith(propia);
    expect(screen.getAllByRole("button").map((b) => b.textContent))
      .toStrictEqual(["Editar"]);
  });

  it("dice «Sin fecha» en una heredada y deja constancia de la edición", () => {
    render(
      <AnotacionCronologica
        anotacion={anotacion({ creada_en: null, editada_en: "2026-04-02T12:00:00Z" })}
      />,
    );

    expect(screen.getByText("Sin fecha ·")).toBeInTheDocument();
    expect(screen.getByText("Editada el 2/abr")).toBeInTheDocument();
  });
});
