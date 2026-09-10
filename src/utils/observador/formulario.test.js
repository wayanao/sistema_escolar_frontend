import { describe, expect, it } from "vitest";
import {
  CAMPOS_ANOTACION,
  construirPayloadAnotacionNueva,
  construirPayloadEdicionAnotacion,
  crearFormularioAnotacion,
  esAnotacionPropia,
  puedeGuardarAnotacion,
  tieneContenidoAnotacion,
} from "./formulario";

describe("estado inicial del formulario", () => {
  it("arranca vacío, y solo con los tres textos", () => {
    expect(crearFormularioAnotacion()).toStrictEqual({
      conductual: "",
      cognitivo: "",
      lenguaje: "",
    });
  });

  it("se precarga con la anotación que se va a corregir", () => {
    expect(crearFormularioAnotacion({
      conductual: "Se para mucho.",
      cognitivo: "",
      lenguaje: "Habla claro.",
      positiva: false,
    })).toStrictEqual({
      conductual: "Se para mucho.",
      cognitivo: "",
      lenguaje: "Habla claro.",
    });
  });

  it("corregir una heredada ya no obliga a marcarla", () => {
    // Antes el formulario arrancaba sin marca y el servidor la exigia, asi que
    // corregir una tilde de una anotacion vieja obligaba a inventarle una.
    const formulario = crearFormularioAnotacion({ conductual: "Anotación vieja." });

    expect(formulario).not.toHaveProperty("positiva");
    expect(puedeGuardarAnotacion(formulario)).toBe(true);
  });
});

describe("cuándo se puede guardar", () => {
  it("exige al menos una dimensión con contenido", () => {
    expect(tieneContenidoAnotacion({ conductual: "", cognitivo: "", lenguaje: "" }))
      .toBe(false);
    expect(tieneContenidoAnotacion({ conductual: "   ", cognitivo: "", lenguaje: "" }))
      .toBe(false);
    expect(tieneContenidoAnotacion({ conductual: "", cognitivo: "Bien.", lenguaje: "" }))
      .toBe(true);
  });

  it("no exige nada más: la marca de positiva o negativa se quitó", () => {
    expect(puedeGuardarAnotacion({ conductual: "Bien." })).toBe(true);
    expect(puedeGuardarAnotacion({ conductual: "" })).toBe(false);
  });

  it("conserva los tres campos de siempre", () => {
    expect(CAMPOS_ANOTACION).toStrictEqual(["conductual", "cognitivo", "lenguaje"]);
  });
});

describe("cuerpo de las peticiones", () => {
  const formulario = {
    conductual: "se para mucho.hace desorden",
    cognitivo: "",
    lenguaje: "  ",
  };

  it("el de crear lleva estudiante y periodo, y el texto ya corregido", () => {
    expect(construirPayloadAnotacionNueva(formulario, {
      estudianteId: "42",
      periodo: "3",
    })).toStrictEqual({
      estudiante_id: 42,
      periodo: 3,
      conductual: "Se para mucho. Hace desorden",
      cognitivo: "",
      lenguaje: "",
    });
  });

  it("el de crear NO lleva quién firma, ni materia, ni asignación", () => {
    const payload = construirPayloadAnotacionNueva(formulario, {
      estudianteId: 42,
      periodo: 3,
    });

    // El autor sale del token del profesor. Si viajara desde aquí, uno podría
    // firmar con el nombre de otro en un documento pensado para una
    // reclamación.
    expect(payload).not.toHaveProperty("profesor_id");
    expect(payload).not.toHaveProperty("materia");
    expect(payload).not.toHaveProperty("asignacion_id");
    expect(payload).not.toHaveProperty("positiva");
  });

  it("el de corregir NO lleva estudiante ni periodo", () => {
    const payload = construirPayloadEdicionAnotacion(formulario);

    // Mover una anotación de periodo sería reescribir cuándo pasó, no corregir
    // cómo se contó.
    // Tampoco `positiva`: el servidor conserva la que la fila tuviera.
    expect(payload).toStrictEqual({
      conductual: "Se para mucho. Hace desorden",
      cognitivo: "",
      lenguaje: "",
    });
  });
});

describe("de quién es la anotación", () => {
  it("es propia solo si coincide el profesor de la sesión", () => {
    expect(esAnotacionPropia({ profesor_id: 7 }, 7)).toBe(true);
    expect(esAnotacionPropia({ profesor_id: 7 }, "7")).toBe(true);
    expect(esAnotacionPropia({ profesor_id: 7 }, 8)).toBe(false);
  });

  it("sin profesor en la sesión no es de nadie", () => {
    // Un admin mirando la bitácora no es autor de nada: ve todo y no edita.
    expect(esAnotacionPropia({ profesor_id: 7 }, null)).toBe(false);
    expect(esAnotacionPropia({ profesor_id: 7 }, undefined)).toBe(false);
    expect(esAnotacionPropia({ profesor_id: 7 }, "")).toBe(false);
    expect(esAnotacionPropia({}, 7)).toBe(false);
  });
});
