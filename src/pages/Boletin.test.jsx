import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../utils/api";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../components/impresion/DocumentoImprimible", () => ({
  default: ({ children, tipo, className, titulo }) => (
    <div
      data-testid="documento-imprimible"
      data-tipo={tipo}
      data-class-name={className}
      data-titulo={titulo}
    >
      {children}
    </div>
  ),
}));

import Boletin from "./Boletin";

describe("Boletin administrativo", () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === "/cursos") {
        return Promise.resolve({
          data: [{ id: 3, nombre: "Transición", jornada: "Mañana" }],
        });
      }

      if (url === "/estudiantes") {
        return Promise.resolve({
          data: [
            {
              id: 8,
              nombre: "Sara",
              apellido: "López",
              identificacion: "TI-123",
              curso_id: 3,
            },
          ],
        });
      }

      if (url === "/boletines/admin/generar/8/1") {
        return Promise.resolve({
          data: {
            estudiante_nombre: "Sara",
            estudiante_apellido: "López",
            curso: "Transición",
            periodo: 1,
            puesto: 1,
            total_estudiantes: 20,
            materias: [
              {
                materia_id: 12,
                boletin_id: 90,
                materia: "Dimensión comunicativa",
                profesor_nombre: "Lina",
                profesor_apellido: "Pérez",
                definitiva: null,
                detalles: [
                  {
                    tipo_evaluacion: "desarrollo",
                    observacion: "Expresa sus ideas con claridad",
                    valoraciones_por_periodo: { 1: "destacado" },
                  },
                ],
              },
              {
                materia_id: 12,
                boletin_id: 91,
                materia: "Dimensión comunicativa",
                profesor_nombre: "Lina",
                profesor_apellido: "Pérez",
                definitiva: null,
                detalles: [
                  {
                    tipo_evaluacion: "desarrollo",
                    observacion: "Escucha a sus compañeros",
                    valoraciones_por_periodo: { 1: "logrado" },
                  },
                ],
              },
            ],
          },
        });
      }

      return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
  });

  it("conserva búsqueda por documento, endpoint, consolidación e impresión del boletín", async () => {
    const user = userEvent.setup();
    render(<Boletin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(
        "Buscar alumno por nombre, apellido o documento...",
      ),
      "TI-123",
    );
    expect(screen.getByText("López, Sara")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "📄 Generar Boletín" }),
    );

    expect(
      await screen.findByText("Expresa sus ideas con claridad"),
    ).toBeInTheDocument();
    expect(screen.getByText("Escucha a sus compañeros")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Dimensión comunicativa" }),
    ).toHaveLength(1);
    expect(screen.getAllByText("⭐")).toHaveLength(2);
    expect(screen.getAllByText("😀")).toHaveLength(2);

    expect(api.get).toHaveBeenCalledWith(
      "/boletines/admin/generar/8/1",
      { signal: expect.any(AbortSignal) },
    );
    expect(screen.getByTestId("documento-imprimible")).toHaveAttribute(
      "data-tipo",
      "boletin",
    );
    expect(screen.getByTestId("documento-imprimible")).toHaveAttribute(
      "data-class-name",
      "di-documento--boletin",
    );
    expect(screen.getByTestId("documento-imprimible")).toHaveAttribute(
      "data-titulo",
      "Boletín Académico Informativo",
    );
  });
});
