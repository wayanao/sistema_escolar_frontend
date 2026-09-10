import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AnotacionObservador from "./AnotacionObservador";
import {
  COLOR_SIN_PROFESOR,
  colorDeProfesor,
} from "../../utils/observador/coloresProfesor";

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

describe("AnotacionObservador", () => {
  it("muestra profesor, fecha y periodo junto al texto de la dimensión", () => {
    render(
      <AnotacionObservador anotacion={anotacion()} texto="Se para mucho." />,
    );

    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("· 20/mar · P1")).toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
  });

  it("pinta el nombre del profesor con su color, y la fecha no", () => {
    render(
      <AnotacionObservador anotacion={anotacion()} texto="Se para mucho." />,
    );

    // El color acompaña al nombre; el nombre sigue escrito, así que quien no
    // distinga dos tonos lee exactamente lo mismo.
    expect(screen.getByText("Ana Gómez").className)
      .toBe(`font-semibold ${colorDeProfesor(7)}`);
    expect(screen.getByText("· 20/mar · P1").className).toBe("text-slate-500");
  });

  it("dos profesores distintos salen de colores distintos", () => {
    const { container } = render(
      <div>
        <AnotacionObservador
          anotacion={anotacion({ profesor_id: 7, profesor: "Ana Gómez" })}
          texto="Una."
        />
        <AnotacionObservador
          anotacion={anotacion({ id: 13, profesor_id: 8, profesor: "Luis Díaz" })}
          texto="Otra."
        />
      </div>,
    );

    expect(screen.getByText("Ana Gómez").className)
      .not.toBe(screen.getByText("Luis Díaz").className);
    expect(container).toBeTruthy();
  });

  it("una anotación sin autor reconocible no se queda sin clase", () => {
    render(
      <AnotacionObservador
        anotacion={anotacion({ profesor: "", profesor_id: null })}
        texto="Se para mucho."
      />,
    );

    expect(screen.getByText("Profesor sin nombre").className)
      .toBe(`font-semibold ${COLOR_SIN_PROFESOR}`);
  });

  it("no muestra si la observación es buena o mala", () => {
    // Se quito el 2026-09-09. La columna sigue en la base y el endpoint la
    // sigue devolviendo, pero la pantalla no la enseña.
    render(
      <AnotacionObservador
        anotacion={anotacion({ positiva: false })}
        texto="Se para mucho."
      />,
    );

    expect(screen.queryByText("Negativa")).not.toBeInTheDocument();
    expect(screen.queryByText("Positiva")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin marcar")).not.toBeInTheDocument();
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
        anotacion={anotacion({ creada_en: null })}
        texto="Anotación vieja."
      />,
    );

    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("· Sin fecha · P1")).toBeInTheDocument();
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
