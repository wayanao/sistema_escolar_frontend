import { describe, expect, it } from "vitest";
import {
  construirUrlIncrustadaYoutube,
  obtenerVideoYoutube,
  partirTextoConEnlaces,
} from "./enlaces";

describe("detección de enlaces en el texto de una planeación", () => {
  it("devuelve una lista vacía cuando no hay texto", () => {
    expect(partirTextoConEnlaces("")).toEqual([]);
    expect(partirTextoConEnlaces(null)).toEqual([]);
    expect(partirTextoConEnlaces(undefined)).toEqual([]);
  });

  it("deja el texto sin enlaces en un solo tramo", () => {
    expect(partirTextoConEnlaces("Ver el cuaderno y resolver la guía")).toEqual([
      { tipo: "texto", valor: "Ver el cuaderno y resolver la guía" },
    ]);
  });

  it("separa un enlace de YouTube del texto que lo rodea", () => {
    expect(
      partirTextoConEnlaces("Video: https://youtu.be/dQw4w9WgXcQ para la clase"),
    ).toEqual([
      { tipo: "texto", valor: "Video: " },
      { tipo: "enlace", valor: "https://youtu.be/dQw4w9WgXcQ" },
      { tipo: "texto", valor: " para la clase" },
    ]);
  });

  it("reconoce varios enlaces en el mismo texto", () => {
    const partes = partirTextoConEnlaces(
      "https://youtu.be/uno\nhttps://www.youtube.com/watch?v=dos",
    );
    expect(partes).toEqual([
      { tipo: "enlace", valor: "https://youtu.be/uno" },
      { tipo: "texto", valor: "\n" },
      { tipo: "enlace", valor: "https://www.youtube.com/watch?v=dos" },
    ]);
  });

  it("no se traga la puntuación final de la frase", () => {
    expect(partirTextoConEnlaces("Míralo en https://youtu.be/abc.")).toEqual([
      { tipo: "texto", valor: "Míralo en " },
      { tipo: "enlace", valor: "https://youtu.be/abc" },
      { tipo: "texto", valor: "." },
    ]);
    expect(partirTextoConEnlaces("(https://youtu.be/abc)")).toEqual([
      { tipo: "texto", valor: "(" },
      { tipo: "enlace", valor: "https://youtu.be/abc" },
      { tipo: "texto", valor: ")" },
    ]);
  });

  it("conserva los paréntesis que pertenecen al enlace", () => {
    expect(
      partirTextoConEnlaces("https://es.wikipedia.org/wiki/Algebra_(matematicas)"),
    ).toEqual([
      { tipo: "enlace", valor: "https://es.wikipedia.org/wiki/Algebra_(matematicas)" },
    ]);
  });

  it("conserva la consulta y el fragmento del enlace", () => {
    expect(
      partirTextoConEnlaces("https://www.youtube.com/watch?v=abc&t=30s#inicio"),
    ).toEqual([
      { tipo: "enlace", valor: "https://www.youtube.com/watch?v=abc&t=30s#inicio" },
    ]);
  });

  it("ignora esquemas distintos de http y https", () => {
    const texto = "javascript:alert(1) y ftp://archivo.test/video.mp4";
    expect(partirTextoConEnlaces(texto)).toEqual([{ tipo: "texto", valor: texto }]);
  });

  it("ignora un enlace sin dominio", () => {
    expect(partirTextoConEnlaces("https:// y listo")).toEqual([
      { tipo: "texto", valor: "https:// y listo" },
    ]);
  });
});

describe("reconocimiento de videos de YouTube", () => {
  it("reconoce las formas habituales de un enlace de YouTube", () => {
    const esperado = { id: "dQw4w9WgXcQ", inicio: 0 };

    expect(obtenerVideoYoutube("https://youtu.be/dQw4w9WgXcQ")).toEqual(esperado);
    expect(
      obtenerVideoYoutube("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toEqual(esperado);
    expect(
      obtenerVideoYoutube("https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc"),
    ).toEqual(esperado);
    expect(obtenerVideoYoutube("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual(
      esperado,
    );
    expect(obtenerVideoYoutube("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual(
      esperado,
    );
    expect(obtenerVideoYoutube("https://www.youtube.com/live/dQw4w9WgXcQ")).toEqual(
      esperado,
    );
  });

  it("conserva el segundo de inicio en sus distintos formatos", () => {
    expect(obtenerVideoYoutube("https://youtu.be/dQw4w9WgXcQ?t=90").inicio).toBe(90);
    expect(obtenerVideoYoutube("https://youtu.be/dQw4w9WgXcQ?t=90s").inicio).toBe(90);
    expect(obtenerVideoYoutube("https://youtu.be/dQw4w9WgXcQ?t=1m30s").inicio).toBe(90);
    expect(obtenerVideoYoutube("https://youtu.be/dQw4w9WgXcQ?t=1h2m3s").inicio).toBe(
      3723,
    );
    expect(
      obtenerVideoYoutube("https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=45")
        .inicio,
    ).toBe(45);
  });

  it("rechaza lo que no sea un video de YouTube", () => {
    expect(obtenerVideoYoutube("https://vimeo.com/123456")).toBeNull();
    expect(obtenerVideoYoutube("https://www.youtube.com/results?q=fracciones")).toBeNull();
    expect(obtenerVideoYoutube("https://youtu.be/corto")).toBeNull();
    expect(obtenerVideoYoutube("https://no-es-youtube.test/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(obtenerVideoYoutube("")).toBeNull();
    expect(obtenerVideoYoutube(null)).toBeNull();
  });

  it("construye la URL del reproductor sin cookies", () => {
    expect(construirUrlIncrustadaYoutube({ id: "dQw4w9WgXcQ", inicio: 0 })).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    );
    expect(construirUrlIncrustadaYoutube({ id: "dQw4w9WgXcQ", inicio: 90 })).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&start=90",
    );
    expect(construirUrlIncrustadaYoutube(null)).toBe("");
  });
});
