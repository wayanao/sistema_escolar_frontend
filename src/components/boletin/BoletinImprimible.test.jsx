import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../impresion/DocumentoImprimible", () => ({
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

import BoletinImprimible from "./BoletinImprimible";

describe("BoletinImprimible", () => {
  it("conserva consolidación, desarrollo, contrato de impresión y regreso", async () => {
    const user = userEvent.setup();
    const onVolver = vi.fn();
    render(
      <BoletinImprimible
        boletinData={{
          estudiante_nombre: "Sara",
          estudiante_apellido: "López",
          curso: "Transición",
          periodo: 1,
          materias: [
            {
              materia_id: 12,
              boletin_id: 90,
              materia: "Dimensión comunicativa",
              profesor_nombre: "Lina",
              definitiva: null,
              detalles: [
                {
                  tipo_evaluacion: "desarrollo",
                  observacion: "Expresa sus ideas",
                  valoraciones_por_periodo: { 1: "destacado" },
                },
              ],
            },
            {
              materia_id: 12,
              boletin_id: 91,
              materia: "Dimensión comunicativa",
              profesor_nombre: "Lina",
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
        }}
        onVolver={onVolver}
      />,
    );

    expect(screen.getAllByRole("heading", { name: "Dimensión comunicativa" })).toHaveLength(1);
    expect(screen.getByText("Expresa sus ideas")).toBeInTheDocument();
    expect(screen.getByText("Escucha a sus compañeros")).toBeInTheDocument();
    expect(screen.getByText("Fecha")).toBeInTheDocument();
    expect(screen.getByText(new Date().toLocaleDateString("es-CO"))).toBeInTheDocument();
    expect(screen.queryByText("Año")).not.toBeInTheDocument();
    expect(screen.getByTestId("documento-imprimible")).toHaveAttribute(
      "data-class-name",
      "di-documento--boletin",
    );
    await user.click(screen.getByRole("button", { name: "← Atrás" }));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });
});
