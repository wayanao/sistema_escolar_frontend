import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePrintConfigMock } = vi.hoisted(() => ({
  usePrintConfigMock: vi.fn(),
}));

vi.mock("../../hooks/certificadosImpresion/usePrintConfig", () => ({
  default: usePrintConfigMock,
}));

import ObservadorImprimible from "./ObservadorImprimible";
import {
  AGRUPACION_DIMENSION,
  AGRUPACION_FECHA,
} from "../../utils/observador/anotaciones";
import { IMPRIMIR_MIAS, IMPRIMIR_TODO } from "../../utils/observador/impresion";

const ANOTACIONES = [
  {
    id: 12,
    profesor_id: 7,
    profesor: "Ana Gómez",
    periodo: 1,
    conductual: "Se para mucho.",
    cognitivo: "Muy creativo.",
    lenguaje: "",
    creada_en: "2026-03-20T12:00:00Z",
  },
  {
    id: 13,
    profesor_id: 8,
    profesor: "Luis Díaz",
    periodo: 1,
    conductual: "Hace desorden.",
    cognitivo: "",
    lenguaje: "",
    creada_en: "2026-03-18T12:00:00Z",
  },
];

function pintar(props = {}) {
  return render(
    <ObservadorImprimible
      alumno="Ana Rojas · Primaria"
      periodo="todos"
      agrupacion={AGRUPACION_DIMENSION}
      anotaciones={ANOTACIONES}
      opcion={IMPRIMIR_TODO}
      profesor={{ nombre: "Ana", apellido: "Gómez" }}
      onVolver={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  usePrintConfigMock.mockReturnValue({
    branding: { nombre_institucion: "Colegio de Prueba" },
    plantilla: { config_json: {} },
    loading: false,
    error: null,
  });
});

describe("ObservadorImprimible", () => {
  it("reutiliza el impreso del colegio, con su identidad", () => {
    pintar();

    // No hay que construir ningun impreso nuevo: DocumentoImprimible ya aplica
    // logo, colores y plantilla activa para tipo="observaciones".
    expect(usePrintConfigMock).toHaveBeenCalledWith("observaciones");
    expect(screen.getByText("Colegio de Prueba")).toBeInTheDocument();
  });

  it("escribe de quién es y qué trozo del año sale", () => {
    pintar({ periodo: "2" });

    expect(screen.getByRole("heading", { name: "Observador del Estudiante" }))
      .toBeInTheDocument();
    expect(
      screen.getByText("Estudiante: Ana Rojas · Primaria · Periodo 2"),
    ).toBeInTheDocument();
  });

  it("el reporte propio lo dice en el título y lo firma ese profesor", () => {
    pintar({ opcion: IMPRIMIR_MIAS });

    expect(
      screen.getByRole("heading", {
        name: "Observador del Estudiante — Anotaciones del docente",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("Firma del Profesor")).toBeInTheDocument();
  });

  it("el reporte general lo firma el director de grupo", () => {
    pintar();

    expect(screen.getByText("Director de grupo")).toBeInTheDocument();
    expect(screen.getByText("Firma del Director de Grupo")).toBeInTheDocument();
    expect(screen.getByText("Acudiente")).toBeInTheDocument();
  });

  it("sale con la agrupación que estaba puesta en pantalla", () => {
    const { rerender } = pintar({ agrupacion: AGRUPACION_DIMENSION });
    expect(screen.getByRole("heading", { name: "Conductual" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cognitivo" })).toBeInTheDocument();

    rerender(
      <ObservadorImprimible
        alumno="Ana Rojas"
        periodo="todos"
        agrupacion={AGRUPACION_FECHA}
        anotaciones={ANOTACIONES}
        opcion={IMPRIMIR_TODO}
        profesor={{}}
        onVolver={vi.fn()}
      />,
    );

    // Por fecha no hay encabezados de dimension: van dentro de cada anotacion.
    expect(screen.queryByRole("heading", { name: "Conductual" })).not.toBeInTheDocument();
    // Las dos anotaciones tienen conductual, asi que la etiqueta sale dos veces.
    expect(screen.getAllByText("Conductual:")).toHaveLength(2);
  });

  it("no pinta el color del profesor en papel", () => {
    // Un documento que puede acabar fotocopiado en blanco y negro no puede
    // apoyarse en el color, y no hace falta: el nombre esta escrito.
    const { container } = pintar();

    expect(container.querySelector("[class*='text-purple-']")).toBeNull();
    expect(container.querySelector("[class*='text-emerald-']")).toBeNull();
    expect(screen.getAllByText(/Ana Gómez/).length).toBeGreaterThan(0);
  });

  it("dice que no hay nada en vez de imprimir una hoja vacía", () => {
    pintar({ anotaciones: [], opcion: IMPRIMIR_MIAS });

    expect(screen.getByText("No hay anotaciones para este reporte."))
      .toBeInTheDocument();
  });

  it("deja volver sin imprimir", async () => {
    const user = userEvent.setup();
    const onVolver = vi.fn();
    pintar({ onVolver });

    await user.click(screen.getByRole("button", { name: "← Volver" }));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });

  it("no ofrece borrar ni editar: es un documento", () => {
    pintar();

    const botones = screen.getAllByRole("button").map((b) => b.textContent);
    expect(botones.some((t) => /borrar|eliminar|editar/i.test(t))).toBe(false);
  });
});
