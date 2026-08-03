import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import usePrintConfig from "../../hooks/certificadosImpresion/usePrintConfig";

vi.mock("../../hooks/certificadosImpresion/usePrintConfig", () => ({
  default: vi.fn(),
}));

import DocumentoImprimible from "./DocumentoImprimible";

describe("DocumentoImprimible", () => {
  beforeEach(() => {
    document.body.className = "";
    Object.defineProperty(window, "print", {
      configurable: true,
      value: vi.fn(),
    });
    usePrintConfig.mockReturnValue({
      loading: false,
      error: null,
      branding: {
        nombre_institucion: "Colegio Central",
        eslogan: "Aprender para crecer",
        direccion: "Calle 1",
        telefono: "300 000 0000",
        email: "info@colegio.test",
        nit: "900.123",
        codigo_dane: "12345",
        sitio_web: "colegio.test",
        logo_principal_url: "https://assets.test/principal.png",
        logo_secundario_url: "https://assets.test/secundario.png",
        color_primario: "#112233",
        color_secundario: "#445566",
      },
      plantilla: {
        config_json: {
          fuente: "Georgia, serif",
          tamano_fuente_base: 13,
          margen_top: 11,
          margen_right: 12,
          margen_bottom: 13,
          margen_left: 14,
          encabezado_alineacion: "left",
          posicion_logo: "derecha",
          mostrar_logo_secundario: true,
          mostrar_eslogan: true,
          mostrar_pie: true,
          mostrar_firmas: true,
          borde_documento: true,
        },
      },
    });
  });

  it("aplica branding, plantilla, scroll móvil y ambos comandos de impresión", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <DocumentoImprimible
        tipo="reporte_estudiante"
        titulo="Reporte Académico Parcial"
        subtitulo="Periodo 1"
        className="di-documento--certificado"
        firmas={[{ nombre: "Laura Gómez", cargo: "Rectora" }]}
      >
        <p>Contenido protegido</p>
      </DocumentoImprimible>,
    );

    expect(usePrintConfig).toHaveBeenCalledWith("reporte_estudiante");
    expect(document.body).toHaveClass("di-printing-mode");
    const root = screen.getByText("Contenido protegido").closest(".di-print-root");
    const article = screen.getByRole("article");
    expect(root).toHaveClass("di-print-root--scroll-mobile");
    expect(article).toHaveClass(
      "di-documento--certificado",
      "di-documento--bordeado",
    );
    expect(root.style.getPropertyValue("--di-color-primario")).toBe("#112233");
    expect(root.style.getPropertyValue("--di-color-secundario")).toBe("#445566");
    expect(root.style.getPropertyValue("--di-fuente")).toBe("Georgia, serif");
    expect(root.style.getPropertyValue("--di-fuente-base")).toBe("13px");
    expect(root.style.getPropertyValue("--di-margen")).toBe(
      "11mm 12mm 13mm 14mm",
    );
    expect(screen.getByText("Colegio Central")).toBeInTheDocument();
    expect(screen.getByText("Aprender para crecer")).toBeInTheDocument();
    expect(screen.getByAltText("logo")).toHaveAttribute(
      "src",
      "https://assets.test/principal.png",
    );
    expect(screen.getByAltText("logo secundario")).toHaveAttribute(
      "src",
      "https://assets.test/secundario.png",
    );
    expect(screen.getByText("Laura Gómez")).toBeInTheDocument();
    expect(screen.getByText("Rectora")).toBeInTheDocument();
    expect(screen.getByText(/Documento generado el/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descargar PDF" }));
    await user.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(window.print).toHaveBeenCalledTimes(2);

    unmount();
    expect(document.body).not.toHaveClass("di-printing-mode");
  });

  it("mantiene el contenido imprimible con valores por defecto si falla la configuración", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = new Error("sin configuración");
    usePrintConfig.mockReturnValue({
      loading: false,
      error,
      branding: null,
      plantilla: null,
    });

    render(
      <DocumentoImprimible tipo="reporte_estudiante">
        <p>Contenido disponible</p>
      </DocumentoImprimible>,
    );

    expect(screen.getByText("Contenido disponible")).toBeInTheDocument();
    expect(screen.getByText("Institucion")).toBeInTheDocument();
    expect(screen.getByText(/Documento generado el/)).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      "Error cargando branding/plantilla, usando defaults",
      error,
    );
  });
});
