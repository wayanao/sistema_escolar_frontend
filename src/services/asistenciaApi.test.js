import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  guardarAsistenciaProfesor,
  listarClasesProfesorAsistencia,
  listarHistorialAsistencia,
  obtenerPlanillaAsistencia,
} from "./asistenciaApi";

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
});

describe("contrato HTTP de asistencia del profesor", () => {
  it("consulta planilla, clases e historial con las rutas vigentes", async () => {
    const planilla = { data: [{ estudiante_id: 101 }] };
    const clases = [{ id: 44, materia: "Matemáticas" }];
    const historial = [{ estudiante_id: 101, historial: [] }];
    apiMock.get
      .mockResolvedValueOnce({ data: planilla })
      .mockResolvedValueOnce({ data: clases })
      .mockResolvedValueOnce({ data: historial });

    await expect(obtenerPlanillaAsistencia(44, 2)).resolves.toBe(planilla);
    await expect(listarClasesProfesorAsistencia(7)).resolves.toBe(clases);
    await expect(listarHistorialAsistencia(44, 2)).resolves.toBe(historial);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/planilla-excel/44/2");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/mis-clases/7");
    expect(apiMock.get).toHaveBeenNthCalledWith(3, "/asistencia/historial/44/2");
  });

  it("envía el arreglo completo al endpoint de guardado sin alterar el payload", async () => {
    const payload = [
      {
        estudiante_id: 101,
        asignacion_id: 44,
        fecha: "2026-07-31",
        estado: "presente",
        periodo: 2,
      },
    ];
    const respuesta = { mensaje: "Asistencia guardada" };
    apiMock.post.mockResolvedValue({ data: respuesta });

    await expect(guardarAsistenciaProfesor(payload)).resolves.toBe(respuesta);

    expect(apiMock.post).toHaveBeenCalledWith("/asistencia", payload);
    expect(apiMock.post.mock.calls[0][1]).toBe(payload);
  });

  it("propaga señales de cancelación y errores sin reinterpretarlos", async () => {
    const controller = new AbortController();
    const error = new Error("Historial no disponible");
    apiMock.get
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(error);

    await listarHistorialAsistencia(44, 2, { signal: controller.signal });
    await expect(listarClasesProfesorAsistencia(7)).rejects.toBe(error);

    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      "/asistencia/historial/44/2",
      { signal: controller.signal },
    );
  });
});
