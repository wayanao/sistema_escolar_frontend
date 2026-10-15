import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePrintConfigMock } = vi.hoisted(() => ({
  usePrintConfigMock: vi.fn(),
}));

vi.mock("../../hooks/certificadosImpresion/usePrintConfig", () => ({
  default: usePrintConfigMock,
}));

import EntrevistaImprimible from "./EntrevistaImprimible";

const SI_NO = [
  { valor: "si", etiqueta: "Sí" },
  { valor: "no", etiqueta: "No" },
];

const SECCIONES = [
  {
    clave: "salud",
    titulo: "Salud",
    preguntas: [
      {
        numero: 18,
        clave: "usa_panal",
        texto: "¿Usa pañal desechable?",
        tipo: "si_no",
        opciones: SI_NO,
      },
      {
        numero: 19,
        clave: "dificultad_motora",
        texto: "¿Tiene alguna dificultad motora?",
        tipo: "si_no",
        opciones: SI_NO,
        detalle: { con: "si", texto: "¿Cuál?", maximo: 250 },
      },
      { numero: 23, clave: "miedos_texto", texto: "¿A qué le tiene miedo?", tipo: "texto" },
    ],
  },
];

const ADMISION = {
  id: 7,
  anio: 2027,
  nombre: "Lina",
  apellido: "Díaz",
  autoriza_datos: true,
  autoriza_nombre: "Marta Díaz",
  entrevistador: "Psicóloga Ruiz",
  observaciones: "Familia puntual",
  resultado: "no_aprobado",
  motivo_resultado: "Cupo lleno",
  cuestionario: { usa_panal: { respuesta: "no" } },
};

function pintar(props = {}) {
  const onVolver = vi.fn();
  render(
    <EntrevistaImprimible admision={ADMISION} secciones={SECCIONES} onVolver={onVolver} {...props} />,
  );
  return { onVolver, user: userEvent.setup() };
}

beforeEach(() => {
  usePrintConfigMock.mockReturnValue({
    branding: { nombre_institucion: "Colegio de Prueba" },
    plantilla: { config_json: {} },
    loading: false,
    error: null,
  });
});

describe("EntrevistaImprimible", () => {
  it("usa el impreso del colegio, con la plantilla de reporte de estudiante", () => {
    pintar();

    expect(usePrintConfigMock).toHaveBeenCalledWith("reporte_estudiante");
    expect(screen.getByRole("heading", { name: "Colegio de Prueba" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrevista de admisión" })).toBeInTheDocument();
    expect(screen.getByText("Lina Díaz · Admisión 2027")).toBeInTheDocument();
  });

  it("trae los datos del aspirante y la autorización", () => {
    pintar();

    expect(screen.getByRole("heading", { name: "Aspirante" })).toBeInTheDocument();
    expect(screen.getByText("Lina Díaz")).toBeInTheDocument();
    expect(screen.getByText("Sí, autorizó Marta Díaz")).toBeInTheDocument();
  });

  it("las preguntas del anexo salen todas: la respondida marcada, las demás en blanco", () => {
    pintar();

    const panal = screen.getByRole("group", { name: "18. ¿Usa pañal desechable?" });
    expect(within(panal).getByRole("img", { name: "No, marcada" })).toBeInTheDocument();
    expect(within(panal).getByRole("img", { name: "Sí, sin marcar" })).toBeInTheDocument();

    const motora = screen.getByRole("group", { name: "19. ¿Tiene alguna dificultad motora?" });
    expect(within(motora).getByRole("img", { name: "Sí, sin marcar" })).toBeInTheDocument();
    expect(within(motora).getByText("¿Cuál?")).toBeInTheDocument();

    expect(screen.getByText("23. ¿A qué le tiene miedo?")).toBeInTheDocument();
  });

  it("las observaciones van al final y firman la familia y quien entrevistó", () => {
    pintar();

    expect(screen.getByRole("heading", { name: "Observaciones de quien entrevista" })).toBeInTheDocument();
    expect(screen.getByText("Familia puntual")).toBeInTheDocument();
    expect(screen.getByText("Padre, madre o acudiente")).toBeInTheDocument();
    expect(screen.getByText("Quien entrevistó")).toBeInTheDocument();
    // En la fila "Quién entrevistó" y en su firma.
    expect(screen.getAllByText("Psicóloga Ruiz")).toHaveLength(2);
  });

  it("no imprime el resultado ni su motivo", () => {
    pintar();

    expect(screen.queryByText(/No aprobado/)).not.toBeInTheDocument();
    expect(screen.queryByText("Cupo lleno")).not.toBeInTheDocument();
  });

  it("sin la lista de preguntas, avisa en pantalla y sale lo demás", () => {
    pintar({ secciones: [] });

    expect(
      screen.getByText("No se pudieron cargar las preguntas del anexo: el impreso sale sin ellas."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preguntas del anexo" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aspirante" })).toBeInTheDocument();
  });

  it("volver cierra el impreso", async () => {
    const { user, onVolver } = pintar();

    await user.click(screen.getByRole("button", { name: "← Volver" }));

    expect(onVolver).toHaveBeenCalledTimes(1);
  });
});
