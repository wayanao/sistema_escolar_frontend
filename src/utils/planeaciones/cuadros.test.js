import { describe, expect, it } from "vitest";
import {
  armarEnvioCuadros,
  AVISO_RENOMBRAR_CUADROS,
  crearBorradorCuadros,
  CUADROS_PLAN,
  LARGO_AYUDA_CUADRO,
  LARGO_NOMBRE_CUADRO,
  NOMBRES_CUADROS_ORIGINALES,
  nombresCuadrosPlan,
  normalizarCuadrosPersonalizados,
  RECIBE_CUADRO,
  validarBorradorCuadros,
} from "./cuadros";
import { ESTADO_INICIAL_PLAN } from "./profesor";

describe("los cuadros del plan", () => {
  it("son los siete de texto y los dos archivos, en el orden del formulario", () => {
    expect(CUADROS_PLAN.map(({ clave, tipo }) => [clave, tipo])).toEqual([
      ["unidad", "texto"],
      ["estandar", "texto"],
      ["tema", "texto"],
      ["proposito", "texto"],
      ["clase", "texto"],
      ["dba", "texto"],
      ["actividad_casa", "texto"],
      ["imagen1", "archivo"],
      ["imagen2", "archivo"],
    ]);
  });

  it("los de texto son campos del formulario, sin Actividad en clase", () => {
    const deTexto = CUADROS_PLAN.filter(({ tipo }) => tipo === "texto").map(({ clave }) => clave);

    expect(Object.keys(ESTADO_INICIAL_PLAN)).toEqual(expect.arrayContaining(deTexto));
    expect(deTexto).not.toContain("competencias");
  });

  it("el original es el nombre del formulario del profesor (P1)", () => {
    expect(NOMBRES_CUADROS_ORIGINALES.estandar.nombre).toBe("Estándar / Lineamientos curriculares");
    expect(NOMBRES_CUADROS_ORIGINALES.imagen1.nombre).toBe("Actividad a desarrollar");
    expect(NOMBRES_CUADROS_ORIGINALES.proposito).toMatchObject({
      nombre: "Logro",
      ayuda: "Qué se espera que logren los estudiantes",
    });
  });

  it("dice qué recibe cada tipo, con los tamaños de las evidencias", () => {
    expect(RECIBE_CUADRO.texto).toMatch(/YouTube/);
    expect(RECIBE_CUADRO.archivo).toBe(
      "Un archivo: imagen PNG, JPG o WEBP de hasta 5 MB, o un PDF de hasta 15 MB.",
    );
    expect(AVISO_RENOMBRAR_CUADROS).toMatch(/no cambia lo que recibe el cuadro ni borra lo escrito/);
  });
});

describe("normalizarCuadrosPersonalizados", () => {
  it("recorta y descarta claves desconocidas, nombres vacíos y ayudas de archivos", () => {
    expect(normalizarCuadrosPersonalizados({
      cuadros: [
        { clave: "proposito", nombre: " Objetivo ", ayuda: " Meta " },
        { clave: "competencias", nombre: "Actividad", ayuda: "" },
        { clave: "tema", nombre: "   ", ayuda: "" },
        { clave: "imagen1", nombre: "Guía", ayuda: "no aplica" },
        null,
      ],
    })).toEqual([
      { clave: "proposito", nombre: "Objetivo", ayuda: "Meta" },
      { clave: "imagen1", nombre: "Guía", ayuda: "" },
    ]);
  });

  it("una respuesta sin lista es como no tener renombrados", () => {
    expect(normalizarCuadrosPersonalizados(undefined)).toEqual([]);
    expect(normalizarCuadrosPersonalizados({ cuadros: "x" })).toEqual([]);
    expect(normalizarCuadrosPersonalizados([])).toEqual([]);
  });
});

describe("nombresCuadrosPlan", () => {
  it("usa el nombre del colegio y conserva el original al lado", () => {
    const cuadros = nombresCuadrosPlan([{ clave: "proposito", nombre: "Objetivo", ayuda: "" }]);

    expect(cuadros.proposito).toEqual({
      clave: "proposito",
      tipo: "texto",
      nombre: "Objetivo",
      ayuda: "",
      nombreOriginal: "Logro",
      ayudaOriginal: "Qué se espera que logren los estudiantes",
    });
    expect(cuadros.unidad.nombre).toBe("Unidad");
    expect(Object.keys(cuadros)).toHaveLength(9);
  });
});

describe("validarBorradorCuadros", () => {
  const borrador = (cambios) => {
    const base = crearBorradorCuadros();
    Object.entries(cambios).forEach(([clave, valor]) => {
      base[clave] = { ...base[clave], ...valor };
    });
    return base;
  };

  it("los originales se pueden guardar", () => {
    expect(validarBorradorCuadros(crearBorradorCuadros())).toEqual({});
  });

  it("marca el nombre vacío, el largo y la ayuda larga", () => {
    expect(validarBorradorCuadros(borrador({
      tema: { nombre: "   " },
      unidad: { nombre: "x".repeat(LARGO_NOMBRE_CUADRO + 1) },
      dba: { ayuda: "y".repeat(LARGO_AYUDA_CUADRO + 1) },
    }))).toEqual({
      tema: { nombre: "Escribe un nombre." },
      unidad: { nombre: "Máximo 60 caracteres." },
      dba: { ayuda: "Máximo 150 caracteres." },
    });
  });

  it("dos cuadros no pueden llamarse igual, sin mirar mayúsculas ni espacios", () => {
    expect(validarBorradorCuadros(borrador({ tema: { nombre: "  unidad " } }))).toEqual({
      unidad: { nombre: "Otro cuadro ya se llama así." },
      tema: { nombre: "Otro cuadro ya se llama así." },
    });
  });

  it("los largos exactos se aceptan", () => {
    expect(validarBorradorCuadros(borrador({
      tema: { nombre: "x".repeat(LARGO_NOMBRE_CUADRO), ayuda: "y".repeat(LARGO_AYUDA_CUADRO) },
    }))).toEqual({});
  });
});

describe("armarEnvioCuadros", () => {
  it("manda solo los distintos del original, recortados", () => {
    const borrador = crearBorradorCuadros();
    borrador.proposito = { nombre: " Objetivo ", ayuda: borrador.proposito.ayuda };
    borrador.imagen2 = { nombre: "Tarea", ayuda: "" };
    borrador.tema = { nombre: " Tema ", ayuda: "Tema central de la clase " };

    expect(armarEnvioCuadros(borrador)).toEqual({
      cuadros: [
        { clave: "proposito", nombre: "Objetivo", ayuda: "Qué se espera que logren los estudiantes" },
        { clave: "imagen2", nombre: "Tarea", ayuda: "" },
      ],
    });
  });

  it("cambiar solo la ayuda también cuenta", () => {
    const borrador = crearBorradorCuadros();
    borrador.clase = { ...borrador.clase, ayuda: "" };

    expect(armarEnvioCuadros(borrador).cuadros).toEqual([
      { clave: "clase", nombre: "Actividad inicial", ayuda: "" },
    ]);
  });

  it("con todo original, la lista va vacía: volver a los originales", () => {
    expect(armarEnvioCuadros(crearBorradorCuadros())).toEqual({ cuadros: [] });
  });
});
