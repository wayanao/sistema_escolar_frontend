import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import VistaObservadorEstudiante from "./VistaObservadorEstudiante";
import {
  AGRUPACION_DIMENSION,
  AGRUPACION_FECHA,
} from "../../utils/observador/anotaciones";
import { IMPRIMIR_MIAS, IMPRIMIR_TODO } from "../../utils/observador/impresion";

function anotacion(extra = {}) {
  return {
    id: 12,
    profesor_id: 7,
    profesor: "Ana Gómez",
    periodo: 1,
    conductual: "",
    cognitivo: "",
    lenguaje: "",
    creada_en: "2026-03-20T12:00:00Z",
    editada_en: null,
    editada_por: null,
    ...extra,
  };
}

function pintar(props = {}) {
  return render(
    <VistaObservadorEstudiante
      titulo="Pepito Pérez · Primaria"
      periodo="todos"
      onCambiarPeriodo={vi.fn()}
      anotaciones={[]}
      cargando={false}
      error={null}
      onReintentar={vi.fn()}
      onVolver={vi.fn()}
      agrupacion={AGRUPACION_DIMENSION}
      onCambiarAgrupacion={vi.fn()}
      {...props}
    />,
  );
}

describe("VistaObservadorEstudiante", () => {
  it("pone el nivel del curso una sola vez, en el título", () => {
    pintar({
      anotaciones: [
        anotacion({ conductual: "Se para mucho." }),
        anotacion({ id: 13, profesor: "Luis Díaz", cognitivo: "Muy creativo." }),
      ],
    });

    expect(
      screen.getByRole("heading", { name: "Observador de Pepito Pérez · Primaria" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Primaria/)).toHaveLength(1);
  });

  it("agrupa por dimensión y repite la anotación en cada campo con texto", () => {
    pintar({
      anotaciones: [
        anotacion({ conductual: "Se para mucho.", cognitivo: "Muy creativo." }),
      ],
    });

    expect(screen.getByRole("heading", { name: "Conductual" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cognitivo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lenguaje" })).not.toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
    expect(screen.getByText("Muy creativo.")).toBeInTheDocument();
  });

  it("ofrece «Todos» en el selector de periodo y avisa cuándo usarlo", async () => {
    const user = userEvent.setup();
    const onCambiarPeriodo = vi.fn();
    pintar({ periodo: "2", onCambiarPeriodo });

    // Filtrar por periodo nunca oculta historial: si no hay nada en el
    // periodo elegido, hay que decir en voz alta cómo ver el año entero.
    expect(
      screen.getByText(/Elige «Todos» para ver el año entero/),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: /Periodo/ }), "todos");
    expect(onCambiarPeriodo).toHaveBeenCalledWith("todos");
  });

  it("distingue «no tiene nada escrito» de un fallo de la consulta", () => {
    const { rerender } = pintar({ anotaciones: [] });

    expect(
      screen.getByText("Todavía nadie le ha escrito nada a este estudiante."),
    ).toBeInTheDocument();

    rerender(
      <VistaObservadorEstudiante
        titulo="Pepito Pérez · Primaria"
        periodo="todos"
        onCambiarPeriodo={vi.fn()}
        anotaciones={[]}
        cargando={false}
        error="No encontramos a ese estudiante."
        onReintentar={vi.fn()}
        onVolver={vi.fn()}
      />,
    );

    expect(screen.getByText("No encontramos a ese estudiante.")).toBeInTheDocument();
    expect(
      screen.queryByText("Todavía nadie le ha escrito nada a este estudiante."),
    ).not.toBeInTheDocument();
  });

  it("deja reintentar cuando la consulta falla", async () => {
    const user = userEvent.setup();
    const onReintentar = vi.fn();
    pintar({ error: "No se pudo consultar el observador. Intenta de nuevo.", onReintentar });

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it("mientras carga no enseña anotaciones a medias", () => {
    pintar({ cargando: true, anotaciones: [anotacion({ conductual: "Se para mucho." })] });

    expect(screen.getByText("Cargando el observador...")).toBeInTheDocument();
    expect(screen.queryByText("Se para mucho.")).not.toBeInTheDocument();
  });

  it("permite volver a la lista de alumnos", async () => {
    const user = userEvent.setup();
    const onVolver = vi.fn();
    pintar({ onVolver });

    await user.click(screen.getByRole("button", { name: "← Volver a la lista" }));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });

  it("ofrece anotar, y esconde el botón mientras el formulario está abierto", async () => {
    const user = userEvent.setup();
    const onNuevaAnotacion = vi.fn();
    const { rerender } = pintar({ onNuevaAnotacion });

    await user.click(screen.getByRole("button", { name: "Nueva anotación" }));
    expect(onNuevaAnotacion).toHaveBeenCalledTimes(1);

    rerender(
      <VistaObservadorEstudiante
        titulo="Pepito Pérez · Primaria"
        periodo="todos"
        onCambiarPeriodo={vi.fn()}
        anotaciones={[]}
        cargando={false}
        error={null}
        onReintentar={vi.fn()}
        onVolver={vi.fn()}
        onNuevaAnotacion={onNuevaAnotacion}
        formulario={<div>Formulario abierto</div>}
      />,
    );

    expect(screen.getByText("Formulario abierto")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nueva anotación" })).not.toBeInTheDocument();
  });

  it("pinta [Editar] solo en las anotaciones del profesor de la sesión", () => {
    pintar({
      profesorId: 7,
      onEditar: vi.fn(),
      anotaciones: [
        anotacion({ id: 12, profesor_id: 7, conductual: "Mía." }),
        anotacion({ id: 13, profesor_id: 8, profesor: "Luis Díaz", conductual: "De otro." }),
      ],
    });

    // Es comodidad visual: la regla de verdad la impone el servidor con un 403.
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1);
  });

  it("el formulario va una sola vez aunque la anotación esté bajo varias dimensiones", () => {
    pintar({
      formulario: <div>Formulario abierto</div>,
      anotaciones: [anotacion({ conductual: "Se para.", cognitivo: "Creativo." })],
    });

    expect(screen.getAllByText("Formulario abierto")).toHaveLength(1);
  });

  it("cambia de agrupación sin pedir nada al servidor", async () => {
    const user = userEvent.setup();
    const onCambiarAgrupacion = vi.fn();
    pintar({
      onCambiarAgrupacion,
      anotaciones: [anotacion({ conductual: "Se para mucho." })],
    });

    // Es un cambio de presentacion, no de datos: la vista recibe las
    // anotaciones ya cargadas y no pide nada.
    await user.click(screen.getByRole("button", { name: "Por fecha" }));
    expect(onCambiarAgrupacion).toHaveBeenCalledWith(AGRUPACION_FECHA);

    await user.click(screen.getByRole("button", { name: "Por dimensión" }));
    expect(onCambiarAgrupacion).toHaveBeenCalledWith(AGRUPACION_DIMENSION);
  });

  it("pinta el mismo dato de dos maneras", () => {
    const anotaciones = [
      anotacion({ conductual: "Se para mucho.", cognitivo: "Muy creativo." }),
    ];
    const { rerender } = pintar({ agrupacion: AGRUPACION_DIMENSION, anotaciones });

    // Por dimension: la anotacion se reparte en dos bloques con encabezado.
    expect(screen.getByRole("heading", { name: "Conductual" })).toBeInTheDocument();

    rerender(
      <VistaObservadorEstudiante
        titulo="Pepito Pérez · Primaria"
        periodo="todos"
        onCambiarPeriodo={vi.fn()}
        anotaciones={anotaciones}
        cargando={false}
        error={null}
        onReintentar={vi.fn()}
        onVolver={vi.fn()}
        agrupacion={AGRUPACION_FECHA}
        onCambiarAgrupacion={vi.fn()}
      />,
    );

    // Por fecha: una sola tarjeta que enumera sus dimensiones.
    expect(screen.queryByRole("heading", { name: "Conductual" })).not.toBeInTheDocument();
    expect(screen.getByText("Conductual:")).toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
    expect(screen.getByText("Muy creativo.")).toBeInTheDocument();
  });

  it("dice que no hay nada también en la vista por fecha", () => {
    pintar({ agrupacion: AGRUPACION_FECHA, anotaciones: [] });

    expect(
      screen.getByText("Todavía nadie le ha escrito nada a este estudiante."),
    ).toBeInTheDocument();
  });

  it("ofrece las dos impresiones y avisa cuál se pidió", async () => {
    const user = userEvent.setup();
    const onImprimir = vi.fn();
    pintar({ onImprimir });

    const menu = screen.getByRole("combobox", { name: /Imprimir/ });
    await user.selectOptions(menu, IMPRIMIR_TODO);
    expect(onImprimir).toHaveBeenCalledWith(IMPRIMIR_TODO);

    await user.selectOptions(menu, IMPRIMIR_MIAS);
    expect(onImprimir).toHaveBeenCalledWith(IMPRIMIR_MIAS);
  });

  it("no ofrece borrar en ninguna vista", () => {
    pintar({ anotaciones: [anotacion({ conductual: "Se para mucho." })] });

    const botones = screen.getAllByRole("button").map((boton) => boton.textContent);
    expect(botones.some((texto) => /borrar|eliminar/i.test(texto))).toBe(false);
  });
});
