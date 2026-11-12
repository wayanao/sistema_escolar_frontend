import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  guardarFirmaInstitucional,
  guardarMiFirma,
  obtenerFirmaInstitucional,
  obtenerMiFirma,
  quitarFirmaInstitucional,
  quitarMiFirma,
} from "./firmasApi";

const IMAGEN = "data:image/png;base64,iVBORw0KGgo=";
const RESPUESTA = { imagen: IMAGEN, actualizado_en: "2026-11-12T15:30:00+00:00" };
const VACIA = { imagen: null, actualizado_en: null };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de las firmas guardadas", () => {
  it("la del rector(a) se lee, guarda y quita en /firmas/institucional", async () => {
    apiMock.get.mockResolvedValue({ data: RESPUESTA });
    apiMock.put.mockResolvedValue({ data: RESPUESTA });
    apiMock.delete.mockResolvedValue({ data: VACIA });

    await expect(obtenerFirmaInstitucional()).resolves.toEqual(RESPUESTA);
    await expect(guardarFirmaInstitucional(IMAGEN)).resolves.toEqual(RESPUESTA);
    await expect(quitarFirmaInstitucional()).resolves.toEqual(VACIA);

    expect(apiMock.get).toHaveBeenCalledWith("/firmas/institucional");
    expect(apiMock.put).toHaveBeenCalledWith("/firmas/institucional", { imagen: IMAGEN });
    expect(apiMock.delete).toHaveBeenCalledWith("/firmas/institucional");
  });

  it("la del profesor va a /firmas/mia y nunca manda un id", async () => {
    apiMock.get.mockResolvedValue({ data: VACIA });
    apiMock.put.mockResolvedValue({ data: RESPUESTA });
    apiMock.delete.mockResolvedValue({ data: VACIA });

    await obtenerMiFirma();
    await guardarMiFirma(IMAGEN);
    await quitarMiFirma();

    expect(apiMock.get).toHaveBeenCalledWith("/firmas/mia");
    expect(apiMock.put).toHaveBeenCalledWith("/firmas/mia", { imagen: IMAGEN });
    expect(apiMock.delete).toHaveBeenCalledWith("/firmas/mia");
  });

  it("las lecturas se pueden cancelar", async () => {
    const { signal } = new AbortController();
    apiMock.get.mockResolvedValue({ data: VACIA });

    await obtenerFirmaInstitucional({ signal });
    await obtenerMiFirma({ signal });

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/firmas/institucional", { signal });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/firmas/mia", { signal });
  });
});
