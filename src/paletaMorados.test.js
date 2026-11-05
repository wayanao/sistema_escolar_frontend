import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Las páginas del admin y del profesor usan un solo morado: el del botón
// «Nuevo Estudiante» (pedido del usuario el 2026-11-05: «la única página que
// tiene el color que yo quiero es la de Estudiante»). El más oscuro de la
// paleta es el fondo del menú lateral, que escribe su color a mano: esto avisa
// si uno cambia y el otro no.
// Rutas desde la raíz del proyecto, que es desde donde corre vitest.
const css = readFileSync("src/index.css", "utf8");
const menu = readFileSync("src/components/autenticacion/MenuLateralView.jsx", "utf8");

const TONOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const MORADO_PAGINAS = "#603b9b";
const MORADO_MENU = "#2a1150";

function bloque(selector) {
  const inicio = css.indexOf(`${selector} {`);
  return css.slice(inicio, css.indexOf("}", inicio));
}

function valor(texto, familia, tono) {
  return texto.match(new RegExp(`--${familia}-${tono}:\\s*([0-9 ]+);`))?.[1];
}

const aRgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

const luz = (rgb) => rgb.split(" ").map(Number).reduce((suma, canal) => suma + canal, 0);

describe("paleta de morados", () => {
  const tema = bloque(".tema-menu-lateral");

  it("botones, letras moradas y anillos llevan el morado de Estudiantes", () => {
    [500, 600, 700].forEach((tono) => {
      expect(valor(tema, "purple", tono)).toBe(aRgb(MORADO_PAGINAS));
    });
  });

  it("al pasar el mouse los botones se oscurecen: 800 es más oscuro", () => {
    expect(luz(valor(tema, "purple", 800))).toBeLessThan(luz(aRgb(MORADO_PAGINAS)));
  });

  it("el tono más oscuro es el fondo del menú", () => {
    expect(menu).toContain(`bg-[${MORADO_MENU}]`);
    expect(valor(tema, "purple", 950)).toBe(aRgb(MORADO_MENU));
  });

  it("purple y violet son una sola paleta, con todos sus tonos", () => {
    TONOS.forEach((tono) => {
      expect(valor(tema, "purple", tono)).toBeDefined();
      expect(valor(tema, "violet", tono)).toBe(valor(tema, "purple", tono));
    });
  });

  it("ningún botón morado se queda igual al pasar el mouse", () => {
    // 500, 600 y 700 son el mismo morado: un botón de uno de ellos con hover a
    // otro no cambiaría de color. Su hover va a 800. La landing queda fuera:
    // ahí siguen los morados de Tailwind.
    const archivos = readdirSync("src", { recursive: true }).filter(
      (ruta) => /\.jsx?$/.test(ruta) && !/\.test\./.test(ruta) && !/landing/i.test(ruta),
    );
    const sinCambio = archivos.flatMap((ruta) =>
      readFileSync(`src/${ruta}`, "utf8")
        .split("\n")
        .filter(
          (linea) =>
            /(^|[^:\w-])(bg|from|to)-(purple|violet)-(500|600|700)\b/.test(linea) &&
            /hover:(bg|from|to)-(purple|violet)-(500|600|700)\b/.test(linea),
        )
        .map((linea) => `${ruta}: ${linea.trim().slice(0, 80)}`),
    );

    expect(sinCambio).toEqual([]);
  });

  it("fuera del menú (landing, login, super admin) siguen los de Tailwind", () => {
    const raiz = bloque(":root");

    expect(valor(raiz, "purple", 600)).toBe("147 51 234");
    expect(valor(raiz, "violet", 600)).toBe("124 58 237");
  });
});
