import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formularioDesdeAdmision, resultadoDesdeAdmision } from "../../utils/admisiones/formularios";
import FichaAdmisionView from "./FichaAdmisionView";

const ADMISION = {
  id: 7,
  nombre: "Lina",
  apellido: "Díaz",
  curso_id: 20,
  autoriza_datos: true,
  autoriza_nombre: "Marta Díaz",
  resultado: "pendiente",
  motivo_resultado: null,
  editable: true,
  matriculada: false,
  aviso_documento: null,
};

function pintar(cambios = {}, props = {}) {
  const admision = { ...ADMISION, ...cambios };
  const propiedades = {
    admision,
    formulario: formularioDesdeAdmision(admision),
    errores: {},
    cursos: [{ id: 20, nombre: "PRIMERO A", jornada: "Mañana" }],
    resultado: resultadoDesdeAdmision(admision),
    erroresResultado: {},
    guardando: false,
    guardandoResultado: false,
    borrando: false,
    onCambiar: vi.fn(),
    onGuardar: vi.fn((event) => event?.preventDefault?.()),
    onCambiarResultado: vi.fn(),
    onGuardarResultado: vi.fn(),
    onBorrar: vi.fn(),
    onCerrar: vi.fn(),
    onMatricular: vi.fn(),
    abriendoMatricula: false,
    ...props,
  };
  render(<FichaAdmisionView {...propiedades} />);
  return propiedades;
}

describe("FichaAdmisionView", () => {
  it("muestra aspirante, entrevista y resultado, y deja guardar", async () => {
    const user = userEvent.setup();
    const props = pintar();

    expect(screen.getByRole("heading", { name: "Lina Díaz" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toHaveValue("Lina");
    expect(screen.getByLabelText("Quién entrevistó")).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Pendiente" })).toBeChecked();

    await user.type(screen.getByLabelText("Quién entrevistó"), "R");
    expect(props.onCambiar).toHaveBeenCalledWith("entrevistador", "R");

    await user.click(screen.getByRole("button", { name: "Guardar datos y entrevista" }));
    expect(props.onGuardar).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("radio", { name: "No aprobado" }));
    expect(props.onCambiarResultado).toHaveBeenCalledWith("resultado", "no_aprobado");

    await user.click(screen.getByRole("button", { name: "Guardar resultado" }));
    expect(props.onGuardarResultado).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Borrar aspirante" }));
    expect(props.onBorrar).toHaveBeenCalledTimes(1);
  });

  it("pide un motivo objetivo para no aprobar y muestra el error", () => {
    pintar({}, { erroresResultado: { motivo_resultado: 'Para marcar "No aprobado" escribe el motivo.' } });

    expect(screen.getByText('Para marcar "No aprobado" escribe el motivo.')).toBeInTheDocument();
    expect(
      screen.getByText(/no puede negarse por religión, origen o composición de la familia/),
    ).toBeInTheDocument();
  });

  it("una matriculada es de solo consulta", () => {
    pintar({ resultado: "aprobado", matriculada: true, editable: false });

    expect(screen.getByText("Matriculado. Esta admisión es de solo consulta.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Aprobado" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Guardar datos y entrevista" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar resultado" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Borrar aspirante" })).not.toBeInTheDocument();
  });

  it("de un año que ya no está en preparación, también solo consulta", () => {
    pintar({ editable: false });

    expect(
      screen.getByText("El año ya no está en preparación. Esta admisión es de solo consulta."),
    ).toBeInTheDocument();
  });

  it("avisa si el documento ya es de un estudiante del colegio", () => {
    pintar({
      aviso_documento: {
        estudiante_id: 55,
        mensaje: "El documento 2001 ya es de un estudiante del colegio: Lina Díaz (retirado).",
      },
    });

    expect(screen.getByRole("note")).toHaveTextContent(
      "El documento 2001 ya es de un estudiante del colegio: Lina Díaz (retirado).",
    );
  });

  it("mientras guarda, los botones lo dicen", () => {
    pintar({}, { guardando: true, guardandoResultado: true, borrando: true });

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando resultado..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Borrando..." })).toBeDisabled();
  });
});

describe("matricular desde la ficha (paso E5)", () => {
  it("un aprobado sin matricular ofrece matricular en el año de la admisión", async () => {
    const user = userEvent.setup();
    const props = pintar({ resultado: "aprobado", anio: 2027 });

    expect(screen.getByRole("heading", { name: "Matricular en 2027" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Matricular" }));

    expect(props.onMatricular).toHaveBeenCalledTimes(1);
  });

  it("si es un exalumno, dice que se usa su mismo registro", () => {
    pintar({
      resultado: "aprobado",
      anio: 2027,
      aviso_documento: { estudiante_id: 55, mensaje: "Ya es de un estudiante." },
    });

    expect(
      screen.getByText(/ya fue estudiante del colegio: se usa su mismo registro/),
    ).toBeInTheDocument();
  });

  it("un pendiente no ofrece matricular", () => {
    pintar({ resultado: "pendiente", anio: 2027 });
    expect(screen.queryByRole("button", { name: "Matricular" })).not.toBeInTheDocument();
  });

  it("un no aprobado tampoco", () => {
    pintar({ resultado: "no_aprobado", motivo_resultado: "Cupo", anio: 2027 });
    expect(screen.queryByRole("button", { name: "Matricular" })).not.toBeInTheDocument();
  });

  it("uno ya matriculado tampoco", () => {
    pintar({ resultado: "aprobado", matriculada: true, editable: false, anio: 2027 });
    expect(screen.queryByRole("button", { name: "Matricular" })).not.toBeInTheDocument();
  });

  it("matricular mira el resultado guardado, no el que se está eligiendo", () => {
    pintar(
      { resultado: "pendiente", anio: 2027 },
      { resultado: { resultado: "aprobado", motivo_resultado: "" } },
    );
    expect(screen.queryByRole("button", { name: "Matricular" })).not.toBeInTheDocument();
  });

  it("mientras abre la ficha, el botón lo dice", () => {
    pintar({ resultado: "aprobado", anio: 2027 }, { abriendoMatricula: true });

    expect(screen.getByRole("button", { name: "Abriendo la ficha..." })).toBeDisabled();
  });

});

describe("preguntas del anexo (paso E11)", () => {
  const CUESTIONARIO = [
    {
      clave: "salud",
      titulo: "Salud",
      preguntas: [
        {
          numero: 18,
          clave: "usa_panal",
          texto: "¿Usa pañal desechable?",
          tipo: "si_no",
          opciones: [
            { valor: "si", etiqueta: "Sí" },
            { valor: "no", etiqueta: "No" },
          ],
        },
      ],
    },
  ];

  it("las preguntas del anexo van dentro del formulario, antes de guardar", async () => {
    const user = userEvent.setup();
    const onCambiarRespuesta = vi.fn();
    pintar({}, { cuestionario: CUESTIONARIO, respuestas: {}, onCambiarRespuesta });

    expect(screen.getByRole("heading", { name: "Preguntas del anexo" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Salud/ }));
    await user.click(screen.getByRole("radio", { name: "No" }));

    expect(onCambiarRespuesta).toHaveBeenCalledWith(CUESTIONARIO[0].preguntas[0], "elegir", "no");
  });

  it("sin la lista de preguntas, la ficha queda como antes", () => {
    pintar();

    expect(screen.queryByRole("heading", { name: "Preguntas del anexo" })).not.toBeInTheDocument();
  });

  it("de solo consulta, las respuestas del anexo tampoco se tocan", async () => {
    const user = userEvent.setup();
    pintar(
      { resultado: "aprobado", matriculada: true, editable: false },
      { cuestionario: CUESTIONARIO, respuestas: { usa_panal: { respuesta: "no" } } },
    );

    await user.click(screen.getByRole("button", { name: /^Salud/ }));

    expect(screen.getByRole("radio", { name: "No" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "No" })).toBeDisabled();
  });

  it("la ayuda de No aprobado también nombra diagnóstico, discapacidad, salud y familia", () => {
    pintar();

    expect(
      screen.getByText(
        /ni por un diagnóstico, una discapacidad, la salud o la situación familiar/,
      ),
    ).toBeInTheDocument();
  });
});

describe("imprimir la entrevista (paso E12)", () => {
  it("el botón avisa a quien imprime", async () => {
    const user = userEvent.setup();
    const onImprimir = vi.fn();
    pintar({}, { onImprimir });

    await user.click(screen.getByRole("button", { name: "Imprimir entrevista" }));

    expect(onImprimir).toHaveBeenCalledTimes(1);
  });

  it("también se imprime una de solo consulta", () => {
    pintar({ resultado: "aprobado", matriculada: true, editable: false }, { onImprimir: vi.fn() });

    expect(screen.getByRole("button", { name: "Imprimir entrevista" })).toBeEnabled();
  });

  it("sin quien imprima, no hay botón", () => {
    pintar();

    expect(screen.queryByRole("button", { name: "Imprimir entrevista" })).not.toBeInTheDocument();
  });
});
