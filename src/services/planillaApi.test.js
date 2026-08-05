import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  eliminarTipoEvaluacionPlanilla,
  guardarNotaPlanilla,
  listarClasesProfesorPlanilla,
  obtenerPlanillaNotas,
} from "./planillaApi";

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.delete.mockReset();
});

describe("contrato HTTP de la planilla de notas", () => {
  it("consulta clases y planilla con las rutas vigentes", async () => {
    const clases = [{ id: 88, materia: "Ciencias Naturales" }];
    const planilla = { columnas: ["quiz"], data: [{ estudiante_id: 501 }] };
    apiMock.get
      .mockResolvedValueOnce({ data: clases })
      .mockResolvedValueOnce({ data: planilla });

    await expect(listarClasesProfesorPlanilla(12)).resolves.toBe(clases);
    await expect(obtenerPlanillaNotas(88, 3)).resolves.toBe(planilla);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/mis-clases/12");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/planilla-excel/88/3");
  });

  it("guarda una nota enviando el payload sin alterarlo", async () => {
    const payload = {
      estudiante_id: 501,
      asignacion_id: 88,
      nota: 5,
      descripcion: "quiz",
      periodo: 3,
      tipo_evaluacion: "numerica",
      valoracion: null,
    };
    const respuesta = { mensaje: "Nota guardada" };
    apiMock.post.mockResolvedValue({ data: respuesta });

    await expect(guardarNotaPlanilla(payload)).resolves.toBe(respuesta);

    expect(apiMock.post).toHaveBeenCalledWith("/planilla/nota", payload);
    expect(apiMock.post.mock.calls[0][1]).toBe(payload);
  });

  it("elimina un tipo de evaluación codificando la descripción en la URL", async () => {
    const respuesta = { mensaje: "Tipo eliminado" };
    apiMock.delete.mockResolvedValue({ data: respuesta });

    await expect(eliminarTipoEvaluacionPlanilla({
      asignacionId: 88,
      descripcion: "trabajo grupal",
      periodo: 3,
    })).resolves.toBe(respuesta);

    expect(apiMock.delete).toHaveBeenCalledWith(
      "/planilla/tipo?asignacion_id=88&descripcion=trabajo%20grupal&periodo=3",
    );
  });

  it("propaga señales de cancelación y errores sin reinterpretarlos", async () => {
    const controller = new AbortController();
    const error = new Error("Planilla no disponible");
    apiMock.get
      .mockResolvedValueOnce({ data: { columnas: [], data: [] } })
      .mockRejectedValueOnce(error);

    await obtenerPlanillaNotas(88, 3, { signal: controller.signal });
    await expect(listarClasesProfesorPlanilla(12)).rejects.toBe(error);

    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      "/planilla-excel/88/3",
      { signal: controller.signal },
    );
  });
});
