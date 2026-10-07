import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerObservadorMock } = vi.hoisted(() => ({
  obtenerObservadorMock: vi.fn(),
}));

// La seccion «Observador» ya no sale de `detalles.observaciones`: monta la
// misma vista que ve la profesora, que pide la bitacora al servidor.
vi.mock("../../../services/observadorApi", () => ({
  obtenerObservador: obtenerObservadorMock,
}));

import DetalleEstudianteAdmin from "./DetalleEstudianteAdmin";

beforeEach(() => {
  obtenerObservadorMock.mockReset().mockResolvedValue({
    nivel: "primaria",
    anotaciones: [
      {
        id: 12,
        profesor_id: 7,
        profesor: "Sara Díaz",
        periodo: 2,
        conductual: "Participa",
        cognitivo: "Avanza",
        lenguaje: "Expone",
        creada_en: "2026-08-02T12:00:00Z",
        editada_en: null,
        editada_por: null,
      },
    ],
  });
});

const estudiante = {
  id: 11,
  nombre: "Ana",
  apellido: "Rojas",
  curso_id: 4,
};

describe("DetalleEstudianteAdmin", () => {
  it("presenta resumen parcial, chips y dimensiones y permite cerrar", async () => {
    const user = userEvent.setup();
    const onCerrar = vi.fn();
    render(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[{ id: 4, nombre: "5A" }]}
        cargando={false}
        onCerrar={onCerrar}
        detalles={{
          promedio_general: 4.2,
          inasistencias: 1,
          notas: [],
          deudas: [],
          total_deuda: 0,
          productos_inventario: [],
        }}
      />,
    );

    expect(screen.getByText("Resumen de Rojas Ana")).toBeInTheDocument();
    expect(screen.getByText("Sin deudas pendientes.")).toBeInTheDocument();

    // La bitacora, con la misma forma que ve la profesora: agrupada por
    // dimension y con el nombre del profesor a color.
    // Sale una vez bajo cada dimension que tiene texto, que son las tres.
    expect(await screen.findAllByText("Sara Díaz")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Conductual" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cognitivo" })).toBeInTheDocument();
    expect(screen.getByText("Participa")).toBeInTheDocument();
    expect(obtenerObservadorMock.mock.calls[0][0]).toBe(11);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("conserva estados de carga y fallo total", () => {
    const { rerender, container } = render(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[]}
        detalles={null}
        cargando
        onCerrar={vi.fn()}
      />,
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    rerender(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[]}
        detalles={null}
        cargando={false}
        onCerrar={vi.fn()}
      />,
    );
    expect(screen.getByText("No se pudo cargar la información.")).toBeInTheDocument();
  });

  it("muestra aparte la deuda de años anteriores aunque el año consultado esté al día", async () => {
    render(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[{ id: 4, nombre: "5A" }]}
        cargando={false}
        onCerrar={vi.fn()}
        detalles={{
          promedio_general: 4.2,
          inasistencias: 1,
          notas: [],
          deudas: [],
          total_deuda: 0,
          deuda_anios_anteriores: [{
            anio_lectivo_id: 9,
            anio: 2025,
            total_deuda: 75000,
            deudas: [{ concepto: "Pensión", deuda: 75000 }],
          }],
          productos_inventario: [],
        }}
      />,
    );

    expect(screen.getByText("Sin deudas pendientes en el año consultado.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Deudas de años anteriores" })).toBeInTheDocument();
    expect(screen.getByText("Año 2025")).toBeInTheDocument();
    expect(screen.getAllByText("$75.000")).toHaveLength(2);
  });
});
