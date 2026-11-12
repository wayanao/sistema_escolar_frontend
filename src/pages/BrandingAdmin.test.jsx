import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheMock, firmasMock, prepararFirmaMock, serviceMock, sweet } = vi.hoisted(() => ({
  cacheMock: vi.fn(),
  // Firma del rector(a) para el boletín (FIRMAS_BOLETIN.md, paso 2).
  firmasMock: {
    obtenerFirmaInstitucional: vi.fn(),
    guardarFirmaInstitucional: vi.fn(),
    quitarFirmaInstitucional: vi.fn(),
    obtenerMiFirma: vi.fn(),
    guardarMiFirma: vi.fn(),
    quitarMiFirma: vi.fn(),
  },
  prepararFirmaMock: vi.fn(),
  sweet: {
    fire: vi.fn(),
    update: vi.fn(),
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
  serviceMock: {
    activarPlantilla: vi.fn(),
    actualizarPlantilla: vi.fn(),
    deleteLogo: vi.fn(),
    duplicarPlantilla: vi.fn(),
    eliminarPlantilla: vi.fn(),
    getBranding: vi.fn(),
    listarPlantillas: vi.fn(),
    updateBranding: vi.fn(),
    uploadLogo: vi.fn(),
  },
}));

vi.mock("../services/printingService", () => serviceMock);
vi.mock("../services/firmasApi", () => firmasMock);
// jsdom no abre imágenes ni dibuja: la foto ya "limpia" sale de aquí.
vi.mock("../hooks/firmas/lienzoFirma", () => ({ prepararFirma: prepararFirmaMock }));
vi.mock("sweetalert2", () => ({ default: sweet }));
vi.mock("../hooks/certificadosImpresion/usePrintConfig", () => ({
  invalidatePrintCache: cacheMock,
}));

import BrandingAdmin from "./BrandingAdmin";

const branding = {
  nombre_institucion: "Colegio Central",
  eslogan: "Aprender para crecer",
  direccion: "Calle 1",
  telefono: "300 000 0000",
  email: "info@colegio.test",
  nit: "900.123",
  codigo_dane: "123",
  sitio_web: "colegio.test",
  color_primario: "#112233",
  color_secundario: "#445566",
  logo_principal_url: "https://assets.test/principal.png",
  logo_secundario_url: null,
};

const plantillas = [
  {
    id: 1,
    nombre: "Plantilla base",
    activa: true,
    es_predefinida: true,
    config_json: { mostrar_pie: true },
  },
  {
    id: 2,
    nombre: "Mi plantilla",
    activa: false,
    es_predefinida: false,
    config_json: { mostrar_pie: true, posicion_logo: "izquierda" },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  serviceMock.getBranding.mockResolvedValue(branding);
  serviceMock.updateBranding.mockImplementation((payload) => Promise.resolve(payload));
  serviceMock.uploadLogo.mockResolvedValue({ url: "https://assets.test/nuevo.png" });
  serviceMock.deleteLogo.mockResolvedValue({ ok: true });
  serviceMock.listarPlantillas.mockResolvedValue(plantillas);
  serviceMock.activarPlantilla.mockResolvedValue({ ok: true });
  serviceMock.actualizarPlantilla.mockResolvedValue({ ok: true });
  serviceMock.duplicarPlantilla.mockResolvedValue({ ok: true });
  serviceMock.eliminarPlantilla.mockResolvedValue({ ok: true });
  firmasMock.obtenerFirmaInstitucional.mockResolvedValue({ imagen: null, actualizado_en: null });
  firmasMock.guardarFirmaInstitucional.mockImplementation((imagen) =>
    Promise.resolve({ imagen, actualizado_en: "2026-11-12T15:30:00+00:00" }),
  );
  prepararFirmaMock.mockResolvedValue("data:image/png;base64,limpia");
  vi.stubGlobal("prompt", vi.fn(() => "Copia personalizada"));
  vi.stubGlobal("confirm", vi.fn(() => true));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("BrandingAdmin", () => {
  it("monta identidad inicialmente y plantillas solo al cambiar de pestaña", async () => {
    const user = userEvent.setup();
    render(<BrandingAdmin />);

    expect(await screen.findByDisplayValue("Colegio Central")).toBeInTheDocument();
    expect(serviceMock.getBranding).toHaveBeenCalledTimes(1);
    expect(serviceMock.listarPlantillas).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Plantillas de impresión" }));
    expect(await screen.findByText("Mi plantilla")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Colegio Central")).not.toBeInTheDocument();
    expect(serviceMock.listarPlantillas).toHaveBeenCalledWith("boletin");
  });

  it("conserva edición institucional, payload, logo e invalidación", async () => {
    const user = userEvent.setup();
    const { container } = render(<BrandingAdmin />);
    expect(await screen.findByDisplayValue("Colegio Central")).toBeInTheDocument();

    const codigoDane = screen.getByDisplayValue("123");
    await user.clear(codigoDane);
    await user.type(codigoDane, "10a20-30");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(serviceMock.updateBranding).toHaveBeenCalledWith(
      expect.objectContaining({ codigo_dane: "102030" }),
    );

    const archivo = new File(["logo"], "logo.png", { type: "image/png" });
    await user.upload(container.querySelector('input[type="file"]'), archivo);
    expect(serviceMock.uploadLogo).toHaveBeenCalledWith(archivo, "principal");
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    expect(confirm).toHaveBeenCalledWith("¿Eliminar el logo principal?");
    expect(serviceMock.deleteLogo).toHaveBeenCalledWith("principal");
    await waitFor(() => expect(cacheMock).toHaveBeenCalledTimes(3));
  });

  it("la firma del rector(a) se sube con una foto y se guarda sola, sin «Guardar cambios»", async () => {
    const user = userEvent.setup();
    render(<BrandingAdmin />);

    expect(await screen.findByRole("heading", { name: "Firma del rector(a)" })).toBeInTheDocument();
    expect(firmasMock.obtenerFirmaInstitucional).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Sin firma")).toBeInTheDocument();

    const foto = new File(["foto"], "firma.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByTestId("entrada-foto-firma"), foto);
    expect(prepararFirmaMock).toHaveBeenCalledWith(foto, undefined);
    expect(await screen.findByText("Así va a salir:")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar firma" }));

    expect(firmasMock.guardarFirmaInstitucional).toHaveBeenCalledWith("data:image/png;base64,limpia");
    expect(serviceMock.updateBranding).not.toHaveBeenCalled();
    expect(await screen.findByText("Guardada el 12 de noviembre de 2026.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar firma" })).toBeInTheDocument();
  });

  it("conserva comandos y configuración de plantillas desde la página", async () => {
    const user = userEvent.setup();
    render(<BrandingAdmin />);
    await user.click(screen.getByRole("button", { name: "Plantillas de impresión" }));

    expect(await screen.findByText("Mi plantilla")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Activar" }));
    expect(serviceMock.activarPlantilla).toHaveBeenCalledWith(2);

    await user.click(screen.getAllByRole("button", { name: "Duplicar" })[1]);
    expect(serviceMock.duplicarPlantilla).toHaveBeenCalledWith(2, "Copia personalizada");

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(serviceMock.eliminarPlantilla).toHaveBeenCalledWith(2);

    await user.click(screen.getByText("Mi plantilla"));
    await user.click(screen.getByRole("checkbox", { name: "Mostrar pie de página" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(serviceMock.actualizarPlantilla).toHaveBeenCalledWith(2, {
      config_json: expect.objectContaining({ mostrar_pie: false }),
    });
    expect(cacheMock).toHaveBeenCalledTimes(3);
  });
});
