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
      datos={datos}
      cargando={false}
      error={null}
      periodo="2"
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

  describe("observación general", () => {
    const observaciones = (estados = {}, extra = {}) => ({
      estadoDe: (id) => ({
        texto: "",
        sinGuardar: false,
        guardando: false,
        error: false,
        guardadaEn: null,
        ...(estados[id] || {}),
      }),
      onCambiar: vi.fn(),
      onGuardar: vi.fn(),
      recuperadas: 0,
      ...extra,
    });

    it("cada estudiante tiene su caja con un solo botón que dice a quién guarda", async () => {
      const user = userEvent.setup();
      const valores = observaciones({ 101: { texto: "Hola", sinGuardar: true } });
      renderizar({ observaciones: valores });

      const caja = screen.getAllByLabelText("Observación general del boletín · Pérez Ana")[0];
      expect(caja).toHaveValue("Hola");
      expect(caja).toHaveAttribute("maxLength", "500");
      expect(screen.getAllByText("4 / 500").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Sin guardar").length).toBeGreaterThan(0);

      await user.type(caja, "!");
      expect(valores.onCambiar).toHaveBeenLastCalledWith(101, "Hola!");

      await user.click(screen.getAllByRole("button", { name: "Guardar observación de Pérez Ana" })[0]);
      expect(valores.onGuardar).toHaveBeenCalledWith(101);
    });

    it("sin cambios el botón no se puede oprimir, y muestra el estado de cada una", () => {
      renderizar({
        observaciones: observaciones({
          101: { texto: "Guardada antes" },
          103: { texto: "x", sinGuardar: true, error: true },
        }),
      });

      // Ya guardada: lo dice, en gris, y no se oprime.
      for (const boton of screen.getAllByRole("button", { name: "Observación guardada" })) {
        expect(boton).toBeDisabled();
      }
      expect(screen.queryByRole("button", { name: "Guardar observación de Pérez Ana" })).not.toBeInTheDocument();
      expect(screen.getAllByText("Guardada").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/No se pudo guardar/).length).toBeGreaterThan(0);
    });

    it("cada caja se ve distinta: lista, falta, sin guardar o no se guardó", () => {
      const { container } = renderizar({
        observaciones: observaciones({
          101: { texto: "Guardada antes" },
          103: { texto: "", sinGuardar: false },
        }),
      });
      const etiquetaDe = (nombre) =>
        within(screen.getAllByLabelText(`Observación general del boletín · ${nombre}`)[0].closest(".border-2"));
      expect(etiquetaDe("Pérez Ana").getByText("✓ Lista")).toBeInTheDocument();
      expect(etiquetaDe("Ruiz Carla").getByText("Falta")).toBeInTheDocument();
      expect(container.querySelectorAll(".border-emerald-300").length).toBeGreaterThan(0);
      expect(container.querySelectorAll(".border-amber-300").length).toBeGreaterThan(0);
    });

    it("sin guardar y con error también se distinguen", () => {
      const { unmount } = renderizar({
        observaciones: observaciones({ 101: { texto: "Nueva", sinGuardar: true } }),
      });
      expect(screen.getAllByText("Sin guardar", { selector: "span.rounded-full" }).length).toBeGreaterThan(0);
      unmount();

      renderizar({
        observaciones: observaciones({ 101: { texto: "Nueva", sinGuardar: true, error: true } }),
      });
      expect(screen.getAllByText("No se guardó").length).toBeGreaterThan(0);
    });

    it("arriba cuenta cuántas observaciones están listas", () => {
      const { unmount } = renderizar({
        observaciones: observaciones({ 101: { texto: "Lista" } }),
      });
      expect(screen.getByText("Observaciones del boletín listas: 1 de 2 · faltan 1")).toBeInTheDocument();
      unmount();

      renderizar({
        observaciones: observaciones({ 101: { texto: "Lista" }, 103: { texto: "También" } }),
      });
      expect(screen.getByText("Observaciones del boletín listas: 2 de 2 ✓")).toBeInTheDocument();
    });

    it("avisa si recuperó observaciones sin guardar", () => {
      renderizar({ observaciones: observaciones({}, { recuperadas: 2 }) });
      expect(screen.getByRole("status")).toHaveTextContent(
        "Recuperamos observaciones que no habías guardado (2 estudiantes)",
      );
    });

    it("sin observaciones conectadas no hay cajas", () => {
      renderizar();
      expect(screen.queryByLabelText(/Observación general del boletín/)).not.toBeInTheDocument();
    });
  });
});
