import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CuestionarioAdmisionView from "./CuestionarioAdmisionView";

const SI_NO = [
  { valor: "si", etiqueta: "Sí" },
  { valor: "no", etiqueta: "No" },
];

const P = {
  numero_hermanos: { numero: 2, clave: "numero_hermanos", texto: "Número de hermanos", tipo: "numero", minimo: 0, maximo: 20 },
  como_lo_llaman: { numero: 1, clave: "como_lo_llaman", texto: "¿Cómo lo llaman en casa?", tipo: "texto", maximo: 150 },
  situaciones_familia: {
    numero: 5,
    clave: "situaciones_familia",
    texto: "En la familia, ¿hay algún caso de…?",
    tipo: "varias",
    opciones: [
      { valor: "violencia", etiqueta: "Violencia" },
      { valor: "ninguno", etiqueta: "Ninguno" },
      { valor: "otro", etiqueta: "Otro" },
    ],
    otro: { texto: "¿Cuál?", maximo: 250 },
    exclusiva: "ninguno",
  },
  solucion_conflictos: {
    numero: 6,
    clave: "solucion_conflictos",
    texto: "¿Cómo solucionan sus conflictos familiares?",
    tipo: "texto_largo",
    maximo: 1000,
  },
  lateralidad: {
    numero: 22,
    clave: "lateralidad",
    texto: "¿Qué lado predomina más?",
    tipo: "una",
    opciones: [
      { valor: "izquierdo", etiqueta: "Izquierdo" },
      { valor: "derecho", etiqueta: "Derecho" },
    ],
  },
  dificultad_motora: {
    numero: 19,
    clave: "dificultad_motora",
    texto: "¿Tiene alguna dificultad motora?",
    tipo: "si_no",
    opciones: SI_NO,
    detalle: { con: "si", texto: "¿Cuál?", maximo: 250 },
  },
  seguimiento_profesional: {
    numero: 25,
    clave: "seguimiento_profesional",
    texto: "¿Ha recibido seguimiento profesional?",
    tipo: "si_no",
    opciones: SI_NO,
  },
  profesionales: {
    numero: 26,
    clave: "profesionales",
    texto: "En caso afirmativo, indique cuál",
    tipo: "varias",
    opciones: [{ valor: "psicologia", etiqueta: "Psicología" }],
    depende_de: { pregunta: "seguimiento_profesional", respuesta: "si" },
  },
};

const SECCIONES = [
  {
    clave: "familia",
    titulo: "Familia",
    preguntas: [P.como_lo_llaman, P.numero_hermanos, P.situaciones_familia, P.solucion_conflictos],
  },
  {
    clave: "salud",
    titulo: "Salud",
    preguntas: [P.dificultad_motora, P.lateralidad, P.seguimiento_profesional, P.profesionales],
  },
];

function pintar(props = {}) {
  const onCambiarRespuesta = vi.fn();
  render(
    <CuestionarioAdmisionView
      secciones={SECCIONES}
      respuestas={{}}
      errores={{}}
      error=""
      deshabilitado={false}
      onCambiarRespuesta={onCambiarRespuesta}
      {...props}
    />,
  );
  return { onCambiarRespuesta, user: userEvent.setup() };
}

const seccion = (nombre) => screen.getByRole("button", { name: new RegExp(`^${nombre}`) });

describe("CuestionarioAdmisionView", () => {
  it("muestra las secciones cerradas, cada una con cuántas van respondidas", () => {
    pintar({ respuestas: { como_lo_llaman: "Juancho" } });

    expect(screen.getByRole("heading", { name: "Preguntas del anexo" })).toBeInTheDocument();
    expect(seccion("Familia")).toHaveAttribute("aria-expanded", "false");
    expect(seccion("Familia")).toHaveTextContent("1 de 4");
    // La 26 no cuenta mientras no se vea.
    expect(seccion("Salud")).toHaveTextContent("0 de 3");
    expect(screen.queryByRole("group", { name: /dificultad motora/ })).not.toBeInTheDocument();
  });

  it("al abrir una sección se ven sus preguntas, con su número", async () => {
    const { user } = pintar();

    await user.click(seccion("Salud"));

    expect(seccion("Salud")).toHaveAttribute("aria-expanded", "true");
    const pregunta = screen.getByRole("group", { name: "19. ¿Tiene alguna dificultad motora?" });
    expect(within(pregunta).getByRole("radio", { name: "Sí" })).not.toBeChecked();
    expect(within(pregunta).getByRole("radio", { name: "No" })).not.toBeChecked();
  });

  it("chulear Sí avisa con la pregunta y el valor", async () => {
    const { user, onCambiarRespuesta } = pintar();
    await user.click(seccion("Salud"));

    const pregunta = screen.getByRole("group", { name: /dificultad motora/ });
    await user.click(within(pregunta).getByRole("radio", { name: "Sí" }));

    expect(onCambiarRespuesta).toHaveBeenCalledWith(P.dificultad_motora, "elegir", "si");
  });

  it("tocar otra vez la casilla marcada también avisa, para desmarcarla", async () => {
    const { user, onCambiarRespuesta } = pintar({
      respuestas: { lateralidad: { opcion: "derecho" } },
    });
    await user.click(seccion("Salud"));

    const pregunta = screen.getByRole("group", { name: /lado predomina/ });
    const derecho = within(pregunta).getByRole("radio", { name: "Derecho" });
    expect(derecho).toBeChecked();
    await user.click(derecho);

    expect(onCambiarRespuesta).toHaveBeenCalledTimes(1);
    expect(onCambiarRespuesta).toHaveBeenCalledWith(P.lateralidad, "elegir", "derecho");
  });

  it("con la respuesta que lo pide aparece el cuadro del detalle", async () => {
    const { user, onCambiarRespuesta } = pintar({
      respuestas: { dificultad_motora: { respuesta: "si" } },
    });
    await user.click(seccion("Salud"));

    const pregunta = screen.getByRole("group", { name: /dificultad motora/ });
    await user.type(within(pregunta).getByRole("textbox", { name: "¿Cuál?" }), "P");

    expect(onCambiarRespuesta).toHaveBeenCalledWith(P.dificultad_motora, "aparte", "P");
  });

  it("con No no hay cuadro de detalle", async () => {
    const { user } = pintar({ respuestas: { dificultad_motora: { respuesta: "no" } } });
    await user.click(seccion("Salud"));

    const pregunta = screen.getByRole("group", { name: /dificultad motora/ });
    expect(within(pregunta).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("varias: cada casilla avisa y Otro abre su cuadro", async () => {
    const { user, onCambiarRespuesta } = pintar({
      respuestas: { situaciones_familia: { marcadas: ["otro"] } },
    });
    await user.click(seccion("Familia"));

    const pregunta = screen.getByRole("group", { name: /algún caso de/ });
    expect(within(pregunta).getByRole("checkbox", { name: "Otro" })).toBeChecked();
    await user.click(within(pregunta).getByRole("checkbox", { name: "Violencia" }));
    await user.type(within(pregunta).getByRole("textbox", { name: "¿Cuál?" }), "L");

    expect(onCambiarRespuesta).toHaveBeenCalledWith(P.situaciones_familia, "marcar", "violencia");
    expect(onCambiarRespuesta).toHaveBeenCalledWith(P.situaciones_familia, "aparte", "L");
  });

  it("sin Otro marcado no hay cuadro de Otro", async () => {
    const { user } = pintar();
    await user.click(seccion("Familia"));

    const pregunta = screen.getByRole("group", { name: /algún caso de/ });
    expect(within(pregunta).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("números y textos avisan lo que se escribe, con sus límites", async () => {
    const { user, onCambiarRespuesta } = pintar();
    await user.click(seccion("Familia"));

    const hermanos = screen.getByRole("spinbutton", { name: "2. Número de hermanos" });
    expect(hermanos).toHaveAttribute("min", "0");
    expect(hermanos).toHaveAttribute("max", "20");
    await user.type(hermanos, "3");
    const apodo = screen.getByRole("textbox", { name: "1. ¿Cómo lo llaman en casa?" });
    expect(apodo).toHaveAttribute("maxLength", "150");
    await user.type(apodo, "J");
    const conflictos = screen.getByRole("textbox", { name: /conflictos familiares/ });
    expect(conflictos.tagName).toBe("TEXTAREA");
    expect(conflictos).toHaveAttribute("maxLength", "1000");

    expect(onCambiarRespuesta).toHaveBeenCalledWith(P.numero_hermanos, "escribir", "3");
    expect(onCambiarRespuesta).toHaveBeenCalledWith(P.como_lo_llaman, "escribir", "J");
  });

  it("la 26 solo aparece si la 25 es Sí", async () => {
    const { user } = pintar({ respuestas: { seguimiento_profesional: { respuesta: "si" } } });
    await user.click(seccion("Salud"));

    expect(screen.getByRole("group", { name: /indique cuál/ })).toBeInTheDocument();
  });

  it("de solo consulta, las casillas no se pueden tocar", async () => {
    const { user } = pintar({ deshabilitado: true, respuestas: { lateralidad: { opcion: "derecho" } } });
    await user.click(seccion("Salud"));

    expect(screen.getByRole("radio", { name: "Derecho" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Derecho" })).toBeChecked();
  });

  it("una sección con un error se abre sola y muestra el error", () => {
    pintar({
      respuestas: { numero_hermanos: "25" },
      errores: { numero_hermanos: "Pregunta 2: escribe un número entero entre 0 y 20." },
    });

    expect(seccion("Familia")).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("Pregunta 2: escribe un número entero entre 0 y 20."),
    ).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "2. Número de hermanos" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("si la lista no llegó, lo dice", () => {
    pintar({ secciones: [], error: "No se pudieron cargar las preguntas del anexo." });

    expect(screen.getByText("No se pudieron cargar las preguntas del anexo.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("sin lista y sin error, no muestra nada", () => {
    const { container } = render(
      <CuestionarioAdmisionView
        secciones={[]}
        respuestas={{}}
        errores={{}}
        error=""
        deshabilitado={false}
        onCambiarRespuesta={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
