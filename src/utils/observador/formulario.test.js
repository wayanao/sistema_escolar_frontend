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
  it("arranca vacío y sin marca elegida", () => {
    expect(crearFormularioAnotacion()).toStrictEqual({
      conductual: "",
      cognitivo: "",
      lenguaje: "",
      positiva: null,
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
      positiva: false,
    });
  });

  it("una heredada sin marca obliga a elegirla antes de guardar", () => {
    // Las copiadas de la tabla vieja llegan con `positiva` en null, y el
    // servidor la exige al editar.
    const formulario = crearFormularioAnotacion({
      conductual: "Anotación vieja.",
      positiva: null,
    });

    expect(formulario.positiva).toBeNull();
    expect(puedeGuardarAnotacion(formulario)).toBe(false);
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

  it("exige además elegir positiva o negativa", () => {
    expect(puedeGuardarAnotacion({ conductual: "Bien.", positiva: null })).toBe(false);
    expect(puedeGuardarAnotacion({ conductual: "Bien.", positiva: true })).toBe(true);
    // `false` es una elección válida, no un «sin elegir».
    expect(puedeGuardarAnotacion({ conductual: "Bien.", positiva: false })).toBe(true);
    expect(puedeGuardarAnotacion({ conductual: "", positiva: true })).toBe(false);
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
    positiva: false,
  };

  it("el de crear lleva estudiante y periodo, y el texto ya corregido", () => {
    expect(construirPayloadAnotacionNueva(formulario, {
      estudianteId: "42",
      periodo: "3",
    })).toStrictEqual({
      estudiante_id: 42,
      periodo: 3,
      positiva: false,
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
  });

  it("el de corregir NO lleva estudiante ni periodo", () => {
    const payload = construirPayloadEdicionAnotacion(formulario);

    // Mover una anotación de periodo sería reescribir cuándo pasó, no corregir
    // cómo se contó.
    expect(payload).toStrictEqual({
      positiva: false,
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
