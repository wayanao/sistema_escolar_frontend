import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DetalleEstudianteAdmin from "./DetalleEstudianteAdmin";

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
          observaciones: [
            {
              periodo: 2,
              materia: "Matemáticas",
              profesor: "Sara Díaz",
              fecha: "2026-08-02",
              conductual: "Participa",
              cognitivo: "Avanza",
              lenguaje: "Expone",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Resumen de Rojas Ana")).toBeInTheDocument();
    expect(screen.getByText("Matemáticas")).toBeInTheDocument();
    expect(screen.getByText("Sara Díaz")).toBeInTheDocument();
    expect(screen.getByText("Participa")).toBeInTheDocument();
    expect(screen.getByText("Sin deudas pendientes.")).toBeInTheDocument();

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
});
