import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { normalizarMiCurso } from "../../utils/boletines/miCurso";
import MiCursoDirector from "./MiCursoDirector";

const datos = normalizarMiCurso({
  curso: { id: 5, nombre: "QUINTO A" },
  periodo: 2,
  total_rankeados: 2,
  materias: [
    { asignacion_id: 55, materia: "LENGUAJE", profesor: "Lina Torres", tipo_evaluacion: "numerica", guardados: 2, total: 3 },
    { asignacion_id: 60, materia: "INGLÉS", profesor: "Raúl", tipo_evaluacion: "numerica", guardados: 3, total: 3 },
  ],
  estudiantes: [
    {
      estudiante_id: 101, nombre: "Ana", apellido: "Pérez", puesto: 1, promedio: 4.65,
      notas: { 55: { definitiva: 4.8, guardada: true }, 60: { definitiva: 4.5, guardada: true } },
      inasistencias: { periodo: 0, anio: 2 },
    },
    {
      estudiante_id: 103, nombre: "Carla", apellido: "Ruiz", puesto: null, promedio: null,
      notas: { 55: { definitiva: 2.95, guardada: false } },
      inasistencias: { periodo: 3, anio: 7 },
    },
  ],
});

const renderizar = (props = {}) =>
  render(
    <MiCursoDirector
      cursos={[{ id: 5, nombre: "QUINTO A" }]}
      cursoId={5}
      datos={datos}
      cargando={false}
      error={null}
      periodo="2"
      onCambiarCurso={vi.fn()}
      onReintentar={vi.fn()}
      {...props}
    />,
  );

describe("MiCursoDirector", () => {
  it("muestra el ranking del curso en orden, con promedio, notas e inasistencias", () => {
    renderizar();

    expect(screen.getByRole("heading", { name: "QUINTO A · Periodo 2" })).toBeInTheDocument();
    const tabla = screen.getByRole("table");
    const filas = within(tabla).getAllByRole("row").slice(1);
    expect(filas.map((fila) => within(fila).getByRole("rowheader").textContent)).toEqual([
      "Pérez Ana",
      "Ruiz Carla",
    ]);
    expect(within(filas[0]).getByText("1°")).toBeInTheDocument();
    expect(within(filas[0]).getByText("4.7")).toBeInTheDocument();
    expect(within(filas[0]).getByText("4.8")).toBeInTheDocument();
    expect(within(filas[1]).getByText("3")).toBeInTheDocument();
    expect(within(filas[1]).getByText("en el año: 7")).toBeInTheDocument();
    // La nota sin guardar se marca, y sale de la planilla.
    expect(within(filas[1]).getByTitle("Todavía no guardada en el boletín")).toHaveTextContent("3.0");
    expect(within(tabla).getAllByRole("columnheader").map((c) => c.textContent)).toEqual([
      "Puesto", "Estudiante", "Promedio", "LENGUAJE", "INGLÉS", "Inasistencias",
    ]);
  });

  it("avisa qué materias faltan por guardar y de quién son", () => {
    renderizar();
    expect(screen.getByText("Hay materias sin guardar: el puesto todavía puede cambiar.")).toBeInTheDocument();
    expect(screen.getByText(/LENGUAJE: falta 1 por guardar/)).toHaveTextContent("(Lina Torres)");
    expect(screen.queryByText(/INGLÉS: /)).not.toBeInTheDocument();
  });

  it("si todo está guardado, lo dice", () => {
    renderizar({
      datos: { ...datos, materias: datos.materias.map((m) => ({ ...m, guardados: m.total })) },
    });
    expect(screen.getByText(/Todas las materias están guardadas/)).toBeInTheDocument();
  });

  it("con más de un curso deja escoger; con uno solo, no", async () => {
    const user = userEvent.setup();
    const onCambiarCurso = vi.fn();
    const { unmount } = renderizar({
      cursos: [{ id: 5, nombre: "QUINTO A" }, { id: 8, nombre: "SEXTO B" }],
      onCambiarCurso,
    });
    await user.selectOptions(screen.getByLabelText("Curso que diriges"), "8");
    expect(onCambiarCurso).toHaveBeenCalledWith("8");
    unmount();

    renderizar();
    expect(screen.queryByLabelText("Curso que diriges")).not.toBeInTheDocument();
  });

  it("mientras carga lo dice, y si falla deja reintentar", async () => {
    const user = userEvent.setup();
    const { unmount } = renderizar({ cargando: true, datos: null });
    expect(screen.getByText("Cargando tu curso…")).toBeInTheDocument();
    unmount();

    const onReintentar = vi.fn();
    renderizar({ error: new Error("x"), datos: null, onReintentar });
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el ranking de tu curso");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it("un curso sin estudiantes lo dice", () => {
    renderizar({ datos: { ...datos, estudiantes: [] } });
    expect(screen.getByText("Este curso no tiene estudiantes activos.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
