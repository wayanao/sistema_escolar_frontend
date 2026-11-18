import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// El impreso de verdad lee el branding; aquí las firmas reciben uno fijo y se
// dejan en `data-firmas` (FIRMAS_BOLETIN.md, paso 4).
const BRANDING_FALSO = {
  configuracion_extra: { firmante_nombre: "Ana Ruiz", firmante_cargo: "Rectora" },
};

vi.mock("../impresion/DocumentoImprimible", () => ({
  default: ({ children, tipo, className, titulo, firmas }) => (
    <div
      data-testid="documento-imprimible"
      data-tipo={tipo}
      data-class-name={className}
      data-titulo={titulo}
      data-firmas={JSON.stringify(typeof firmas === "function" ? firmas(BRANDING_FALSO) : firmas)}
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
    // Las caritas de preescolar se ven más grandes que las notas numéricas.
    expect(screen.getByText("Expresa sus ideas").closest("tr").cells[1]).toHaveClass(
      "text-base",
      "leading-none",
    );
    expect(screen.getByText("Fecha")).toBeInTheDocument();
    expect(screen.getByText(new Date().toLocaleDateString("es-CO"))).toBeInTheDocument();
    expect(screen.queryByText("Año")).not.toBeInTheDocument();
    expect(screen.queryByText("Director de grupo")).not.toBeInTheDocument();
    expect(screen.queryByText("Jornada")).not.toBeInTheDocument();
    expect(screen.getByTestId("documento-imprimible")).toHaveAttribute(
      "data-class-name",
      "di-documento--boletin",
    );
    const atras = screen.getByRole("button", { name: "← Atrás" });
    // Dentro de la página y no fijo en la esquina, donde tapaba el menú lateral.
    expect(atras.parentElement).not.toHaveClass("fixed");
    await user.click(atras);
    expect(onVolver).toHaveBeenCalledTimes(1);
  });

  it("muestra el director de grupo como dato aparte cuando el curso tiene uno asignado", () => {
    render(
      <BoletinImprimible
        boletinData={{
          estudiante_nombre: "Sara",
          estudiante_apellido: "López",
          curso: "Transición",
          periodo: 1,
          director_grupo: "Ana Gómez",
          materias: [],
        }}
        onVolver={vi.fn()}
      />,
    );

    expect(screen.getByText("Director de grupo")).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
  });

  it("el puesto sale solo, sin «de» y el total de estudiantes", () => {
    render(
      <BoletinImprimible
        boletinData={{
          estudiante_nombre: "Sara",
          estudiante_apellido: "López",
          curso: "Quinto",
          periodo: 1,
          puesto: 12,
          total_estudiantes: 12,
          materias: [],
        }}
        onVolver={vi.fn()}
      />,
    );

    const puesto = screen.getByText("Puesto").parentElement;
    expect(puesto).toHaveTextContent("12");
    expect(puesto.textContent).not.toMatch(/de\s*12/);
  });

  it("muestra la jornada del curso cuando llega en los datos del boletín", () => {
    render(
      <BoletinImprimible
        boletinData={{
          estudiante_nombre: "Sara",
          estudiante_apellido: "López",
          curso: "Transición",
          periodo: 1,
          jornada: "Tarde",
          materias: [],
        }}
        onVolver={vi.fn()}
      />,
    );

    expect(screen.getByText("Jornada")).toBeInTheDocument();
    expect(screen.getByText("Tarde")).toBeInTheDocument();
  });

  it("la observación general sale con la que guardó el director, y avisa que retocarla no se guarda", () => {
    const { container } = render(
      <BoletinImprimible
        boletinData={{
          estudiante_id: 7,
          estudiante_nombre: "Sara",
          estudiante_apellido: "López",
          curso: "Quinto",
          periodo: 2,
          observacion_general: "Muy buen periodo.",
          materias: [],
        }}
        onVolver={vi.fn()}
      />,
    );

    const caja = container.querySelector(".di-observacion-editable");
    expect(caja).toHaveTextContent("Muy buen periodo.");
    expect(caja).toHaveAttribute("contenteditable", "true");
    expect(screen.getByText(/el cambio sale solo en esta impresión y no se guarda/)).toHaveClass("no-print");
  });

  it("sin observación guardada la caja queda vacía, como antes", () => {
    const { container } = render(
      <BoletinImprimible
        boletinData={{ estudiante_nombre: "Sara", estudiante_apellido: "López", curso: "Quinto", periodo: 1, materias: [] }}
        onVolver={vi.fn()}
      />,
    );
    expect(container.querySelector(".di-observacion-editable")).toBeEmptyDOMElement();
  });

  describe("firmas guardadas (FIRMAS_BOLETIN.md, paso 4)", () => {
    const BASE = { estudiante_nombre: "Sara", estudiante_apellido: "López", curso: "Quinto", periodo: 1, materias: [] };
    const firmasPasadas = () =>
      JSON.parse(screen.getByTestId("documento-imprimible").getAttribute("data-firmas"));

    it("cada firma va sobre su raya, con el nombre y el cargo debajo, y no hay avisos", () => {
      render(
        <BoletinImprimible
          boletinData={{
            ...BASE,
            director_grupo: "Ana Gómez",
            firma_institucional: "data:image/png;base64,rector",
            firma_director_grupo: "data:image/png;base64,director",
          }}
          onVolver={vi.fn()}
        />,
      );

      expect(firmasPasadas()).toEqual([
        { nombre: "Ana Ruiz", cargo: "Rectora", imagen: "data:image/png;base64,rector" },
        { nombre: "Ana Gómez", cargo: "Director(a) de grupo", imagen: "data:image/png;base64,director" },
      ]);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("sin firmas, las rayas quedan vacías y arriba avisa qué falta, solo en pantalla", () => {
      render(
        <BoletinImprimible boletinData={{ ...BASE, director_grupo: "Ana Gómez" }} onVolver={vi.fn()} />,
      );

      expect(firmasPasadas().map((firma) => firma.imagen)).toEqual([null, null]);
      const aviso = screen.getByRole("status");
      expect(aviso).toHaveClass("no-print");
      expect(aviso).toHaveTextContent("sin la firma del rector(a)");
      expect(aviso).toHaveTextContent("sin la firma del director de grupo (Ana Gómez)");
    });

    it("sin director de grupo asignado, solo avisa la del rector(a)", () => {
      render(<BoletinImprimible boletinData={BASE} onVolver={vi.fn()} />);

      expect(firmasPasadas()[1]).toEqual({ nombre: "Director de Grupo", imagen: null });
      expect(screen.getByRole("status")).not.toHaveTextContent("director de grupo");
    });
  });
});
