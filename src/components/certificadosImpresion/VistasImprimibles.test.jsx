import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// `firmas` y `children` pueden ser funciones del branding (ver
// DocumentoImprimible): el doble las llama con `mocks.branding`.
const mocks = vi.hoisted(() => ({ branding: null }));

vi.mock("../impresion/DocumentoImprimible", () => ({
  default: ({ children, titulo, subtitulo, firmas = [] }) => {
    const lista = typeof firmas === "function" ? firmas(mocks.branding) : firmas;
    const contenido = typeof children === "function" ? children(mocks.branding) : children;
    return (
      <div data-testid="documento" data-titulo={titulo} data-subtitulo={subtitulo}>
        {contenido}
        {lista.map((f) => (
          <div key={f.cargo} data-testid="firma" data-imagen={f.imagen || ""}>
            {[f.nombre, f.documento, f.cargo].filter(Boolean).join(" | ")}
          </div>
        ))}
      </div>
    );
  },
}));

import CertificadoAprobadoPreview from "./CertificadoAprobadoPreview";
import CertificadoConductaPreview from "./CertificadoConductaPreview";
import CertificadoCostosPreview from "./CertificadoCostosPreview";
import CertificadoMatriculaPreview from "./CertificadoMatriculaPreview";
import CertificadoNotasPreview from "./CertificadoNotasPreview";
import ReporteParcialPreview from "./ReporteParcialPreview";

const BRANDING_CON_FIRMA = {
  configuracion_extra: {
    certificado_encabezado: "LA SUSCRITA DIRECTORA\n\"COLEGIO CENTRAL\"",
    firmante_nombre: "MARÍA PÉREZ",
    firmante_documento: "C.C. 123 de Galapa",
    firmante_cargo: "Directora",
    ciudad_expedicion: "Galapa",
  },
};

const CERTIFICADO = {
  estudiante_nombre_completo: "Sara López",
  tipo_documento: "Tarjeta de Identidad",
  documento_identidad: "1.042.268.729",
  curso: "Tercero",
  nivel: "primaria",
  anio_lectivo: "2026",
  en_pasado: false,
};

function textoParrafo() {
  return screen.getByText((_, elemento) =>
    elemento?.tagName === "P" && elemento.textContent.startsWith("Que ")).textContent;
}

beforeEach(() => {
  mocks.branding = null;
});

describe("vistas imprimibles de certificados", () => {
  it("presenta notas y conserva el comando para volver", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <CertificadoNotasPreview
        certificado={{
          estudiante_nombre_completo: "Sara López",
          documento_identidad: "TI-123",
          curso: "Quinto",
          periodo: 1,
          materias: [],
        }}
        onBack={onBack}
      />,
    );

    expect(screen.getByTestId("documento")).toHaveAttribute("data-titulo", "Certificado de Notas");
    expect(screen.getByText("No hay notas registradas para la seleccion actual.")).toBeInTheDocument();
    const atras = screen.getByRole("button", { name: "← Atrás" });
    // Dentro de la página y no fijo en la esquina, donde tapaba el menú.
    expect(atras.parentElement).not.toHaveClass("fixed");
    await user.click(atras);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("firma las notas con quien se configuró, y sin configurar, con la línea de antes", () => {
    const certificado = { estudiante_nombre_completo: "Sara López", periodo: 1, materias: [] };
    const { unmount } = render(<CertificadoNotasPreview certificado={certificado} onBack={vi.fn()} />);
    expect(screen.getAllByTestId("firma").map((f) => f.textContent)).toEqual([
      "Director(a)",
      "Secretaria academica",
    ]);
    unmount();

    mocks.branding = BRANDING_CON_FIRMA;
    render(<CertificadoNotasPreview certificado={certificado} onBack={vi.fn()} />);
    expect(screen.getAllByTestId("firma").map((f) => f.textContent)).toEqual([
      "MARÍA PÉREZ | C.C. 123 de Galapa | Directora",
      "Secretaria academica",
    ]);
  });

  it("presenta la matrícula con el formato de los modelos y la firma configurada", () => {
    mocks.branding = BRANDING_CON_FIRMA;
    render(<CertificadoMatriculaPreview certificado={CERTIFICADO} onBack={vi.fn()} />);

    expect(screen.getByText("CERTIFICA:")).toBeInTheDocument();
    expect(screen.getByText(/LA SUSCRITA DIRECTORA/)).toHaveTextContent(
      "LA SUSCRITA DIRECTORA \"COLEGIO CENTRAL\"",
    );
    expect(textoParrafo()).toBe(
      "Que el(la) estudiante SARA LÓPEZ, identificado(a) con T.I. No. 1.042.268.729, "
        + "se encuentra matriculado(a) en esta institución en el grado TERCERO del nivel de "
        + "Educación Básica Primaria del año lectivo 2026.",
    );
    expect(screen.getByText("SARA LÓPEZ").tagName).toBe("STRONG");
    expect(screen.getByText(/^Se expide la presente certificación a solicitud del interesado en Galapa, /))
      .toBeInTheDocument();
    expect(screen.getByText("Atentamente,")).toBeInTheDocument();
    expect(screen.getAllByTestId("firma").map((f) => f.textContent)).toEqual([
      "MARÍA PÉREZ | C.C. 123 de Galapa | Directora",
    ]);
  });

  it("firma la matrícula solo dirección, sin secretaría académica", () => {
    render(<CertificadoMatriculaPreview certificado={CERTIFICADO} onBack={vi.fn()} />);

    expect(screen.getAllByTestId("firma").map((f) => f.textContent)).toEqual(["Director(a)"]);
    // Sin frase configurada, la hoja empieza en «CERTIFICA:».
    expect(screen.queryByText(/SUSCRITA/)).not.toBeInTheDocument();
  });

  describe("«Con la firma del rector(a)» (FIRMAS_BOLETIN.md, paso 5)", () => {
    const FIRMA = { imagen: "data:image/png;base64,rector", cargando: false, error: false };
    const imagenes = () => screen.getAllByTestId("firma").map((f) => f.getAttribute("data-imagen"));

    it("en un certificado formal sale desmarcada y la firma solo va al marcarla", async () => {
      const user = userEvent.setup();
      render(<CertificadoMatriculaPreview certificado={CERTIFICADO} firmaRector={FIRMA} onBack={vi.fn()} />);

      const casilla = screen.getByRole("checkbox", { name: "Con la firma del rector(a)" });
      expect(casilla).not.toBeChecked();
      expect(imagenes()).toEqual([""]);

      await user.click(casilla);
      expect(imagenes()).toEqual(["data:image/png;base64,rector"]);

      await user.click(casilla);
      expect(imagenes()).toEqual([""]);
    });

    it("en el de notas, solo la raya del rector(a) lleva la firma, no la de secretaría", async () => {
      const user = userEvent.setup();
      render(
        <CertificadoNotasPreview
          certificado={{ estudiante_nombre: "Sara", materias: [], periodo: 1 }}
          firmaRector={FIRMA}
          onBack={vi.fn()}
        />,
      );

      await user.click(screen.getByRole("checkbox", { name: "Con la firma del rector(a)" }));

      expect(imagenes()).toEqual(["data:image/png;base64,rector", ""]);
    });

    it("sin firma guardada no se puede marcar y dice dónde subirla", () => {
      render(
        <CertificadoMatriculaPreview
          certificado={CERTIFICADO}
          firmaRector={{ imagen: null, cargando: false, error: false }}
          onBack={vi.fn()}
        />,
      );

      expect(screen.getByRole("checkbox", { name: "Con la firma del rector(a)" })).toBeDisabled();
      expect(screen.getByText(/No hay firma guardada\. Súbela en Diseño de impresos/)).toBeInTheDocument();
    });

    it("mientras la trae no dice nada; si no la pudo traer, lo dice", () => {
      const { rerender } = render(
        <CertificadoMatriculaPreview
          certificado={CERTIFICADO}
          firmaRector={{ imagen: null, cargando: true, error: false }}
          onBack={vi.fn()}
        />,
      );
      expect(screen.queryByText(/firma guardada/)).not.toBeInTheDocument();

      rerender(
        <CertificadoMatriculaPreview
          certificado={CERTIFICADO}
          firmaRector={{ imagen: null, cargando: false, error: true }}
          onBack={vi.fn()}
        />,
      );
      expect(screen.getByText("No se pudo cargar la firma guardada.")).toBeInTheDocument();
    });
  });

  it("cambia el texto con «En el texto decir», sin imprimir la opción", async () => {
    const user = userEvent.setup();
    render(<CertificadoAprobadoPreview certificado={CERTIFICADO} onBack={vi.fn()} />);

    const opcion = screen.getByRole("combobox", { name: "En el texto decir" });
    expect(opcion.closest(".no-print")).not.toBeNull();
    await user.selectOptions(opcion, "nina");

    expect(textoParrafo()).toBe(
      "Que la niña SARA LÓPEZ, identificada con T.I. No. 1.042.268.729, cursó y aprobó en "
        + "esta institución el grado TERCERO del nivel de Educación Básica Primaria del año "
        + "lectivo 2026.",
    );
  });

  it("deja el desempeño de conducta en raya hasta elegirlo", async () => {
    const user = userEvent.setup();
    render(<CertificadoConductaPreview certificado={CERTIFICADO} onBack={vi.fn()} />);

    expect(textoParrafo()).toContain("cursa en esta institución el grado TERCERO");
    expect(textoParrafo()).toContain("con una conducta descriptiva en DESEMPEÑO ________.");

    await user.selectOptions(screen.getByRole("combobox", { name: "Desempeño" }), "ALTO");
    expect(textoParrafo()).toContain("con una conducta descriptiva en DESEMPEÑO ALTO.");
  });

  it("edita los costos sobre la hoja: en el papel solo sale el texto", async () => {
    const user = userEvent.setup();
    render(
      <CertificadoCostosPreview
        certificado={{
          ...CERTIFICADO,
          costos: [
            { id: "concepto-1", concepto: "Matrícula", valor: "280000" },
            { id: "concepto-2", concepto: "Pensión", valor: "130000" },
          ],
        }}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Con los siguientes costos educativos:")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Valor 1" })).toHaveValue("280.000");
    // Lo que se imprime: el texto; los campos llevan `print:hidden`.
    const impreso = () => [...document.querySelectorAll("li > span.print\\:inline")]
      .map((span) => span.textContent);
    expect(impreso()).toEqual(["Matrícula: $\u00a0280.000", "Pensión: $\u00a0130.000"]);
    expect(screen.getByRole("textbox", { name: "Concepto 1" }).closest("span")).toHaveClass("print:hidden");

    await user.clear(screen.getByRole("textbox", { name: "Valor 2" }));
    await user.type(screen.getByRole("textbox", { name: "Valor 2" }), "150000");
    await user.click(screen.getByRole("button", { name: "Quitar costo 1" }));
    await user.click(screen.getByRole("button", { name: "+ Agregar costo" }));
    expect(impreso()).toEqual(["Pensión: $\u00a0150.000", ""]);
    // La fila nueva, vacía, no se imprime.
    expect(screen.getByRole("textbox", { name: "Concepto 2" }).closest("li")).toHaveClass("print:hidden");

    await user.type(screen.getByRole("textbox", { name: "Concepto 2" }), "Uniforme");
    await user.type(screen.getByRole("textbox", { name: "Valor 2" }), "45000");
    expect(impreso()).toEqual(["Pensión: $\u00a0150.000", "Uniforme: $\u00a045.000"]);
  });

  it("sin ningún costo, la lista no se imprime", async () => {
    const user = userEvent.setup();
    render(
      <CertificadoCostosPreview
        certificado={{ ...CERTIFICADO, costos: [{ id: "c", concepto: "Matrícula", valor: "1" }] }}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quitar costo 1" }));
    expect(screen.getByText("Con los siguientes costos educativos:").parentElement)
      .toHaveClass("print:hidden");
  });

  it("presenta el estado vacío del reporte parcial individual", () => {
    render(
      <ReporteParcialPreview
        reporte={{
          alcance: "estudiante",
          curso: "Quinto",
          periodo: 1,
          materia: "Todas las materias",
          estudiantes: [],
          errores: 0,
        }}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByTestId("documento")).toHaveAttribute("data-titulo", "Reporte Académico Parcial");
    expect(screen.getByText("No hay datos para mostrar.")).toBeInTheDocument();
  });
});
