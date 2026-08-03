import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import { API_BASE_URL } from "../config/env";
import {
  activarPlantilla,
  actualizarPlantilla,
  crearPlantilla,
  deleteLogo,
  duplicarPlantilla,
  eliminarPlantilla,
  getBranding,
  getPlantillaActiva,
  listarPlantillas,
  updateBranding,
  uploadLogo,
} from "./printingService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de branding", () => {
  it("consulta y actualiza el payload exacto normalizando URLs de respuesta", async () => {
    const respuesta = {
      nombre_institucion: "Colegio Central",
      logo_principal_url: "/uploads/principal.png",
      logo_secundario_url: "https://cdn.test/secundario.png",
    };
    const payload = { nombre_institucion: "Colegio Central" };
    apiMock.get.mockResolvedValue({ data: respuesta });
    apiMock.put.mockResolvedValue({ data: respuesta });

    await expect(getBranding()).resolves.toEqual({
      ...respuesta,
      logo_principal_url: `${API_BASE_URL}/uploads/principal.png`,
    });
    await expect(updateBranding(payload)).resolves.toEqual({
      ...respuesta,
      logo_principal_url: `${API_BASE_URL}/uploads/principal.png`,
    });

    expect(apiMock.get).toHaveBeenCalledWith("/branding");
    expect(apiMock.put).toHaveBeenCalledWith("/branding", payload);
    expect(apiMock.put.mock.calls[0][1]).toBe(payload);
  });

  it("conserva multipart, slot y eliminación de logos", async () => {
    const archivo = new File(["logo"], "logo.png", { type: "image/png" });
    apiMock.post.mockResolvedValue({ data: { url: "/uploads/logo.png" } });
    apiMock.delete.mockResolvedValue({ data: { ok: true } });

    await expect(uploadLogo(archivo, "secundario")).resolves.toEqual({
      url: `${API_BASE_URL}/uploads/logo.png`,
    });
    await expect(deleteLogo("secundario")).resolves.toEqual({ ok: true });

    expect(apiMock.post).toHaveBeenCalledWith(
      "/branding/logo?slot=secundario",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect(apiMock.post.mock.calls[0][1].get("archivo")).toBe(archivo);
    expect(apiMock.delete).toHaveBeenCalledWith(
      "/branding/logo?slot=secundario",
    );
  });
});

describe("contrato HTTP de plantillas de impresión", () => {
  it("lista por tipo y obtiene la plantilla activa", async () => {
    const plantillas = [{ id: 5, tipo: "reporte_estudiante" }];
    const activa = plantillas[0];
    apiMock.get
      .mockResolvedValueOnce({ data: plantillas })
      .mockResolvedValueOnce({ data: activa });

    await expect(listarPlantillas("reporte_estudiante")).resolves.toBe(
      plantillas,
    );
    await expect(getPlantillaActiva("reporte_estudiante")).resolves.toBe(
      activa,
    );

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/plantillas", {
      params: { tipo: "reporte_estudiante" },
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      "/plantillas/activa/reporte_estudiante",
    );
  });

  it("conserva rutas, parámetros y payloads de los comandos", async () => {
    const config = { config_json: { mostrar_pie: false } };
    const creada = { nombre: "Nueva", tipo: "reporte_estudiante" };
    apiMock.post.mockResolvedValue({ data: { ok: true } });
    apiMock.put.mockResolvedValue({ data: { ok: true } });
    apiMock.delete.mockResolvedValue({ data: { ok: true } });

    await activarPlantilla(5);
    await duplicarPlantilla(5, "Copia");
    await actualizarPlantilla(5, config);
    await eliminarPlantilla(5);
    await crearPlantilla(creada);

    expect(apiMock.post).toHaveBeenNthCalledWith(1, "/plantillas/5/activar");
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      "/plantillas/5/duplicar",
      null,
      { params: { nuevo_nombre: "Copia" } },
    );
    expect(apiMock.put).toHaveBeenCalledWith("/plantillas/5", config);
    expect(apiMock.delete).toHaveBeenCalledWith("/plantillas/5");
    expect(apiMock.post).toHaveBeenNthCalledWith(3, "/plantillas", creada);
    expect(apiMock.put.mock.calls[0][1]).toBe(config);
    expect(apiMock.post.mock.calls[2][1]).toBe(creada);
  });

  it("propaga errores de transporte sin reinterpretarlos", async () => {
    const error = { response: { status: 409, data: { detail: "Conflicto" } } };
    apiMock.get.mockRejectedValue(error);

    await expect(getPlantillaActiva("reporte_estudiante")).rejects.toBe(error);
  });
});
