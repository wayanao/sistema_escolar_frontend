import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  generarBoletinAdministrativo,
  guardarBoletinProfesor,
  guardarOrdenBoletin,
  listarClasesProfesorBoletines,
  listarCursosBoletines,
  listarEstudiantesBoletines,
  obtenerOrdenBoletin,
  obtenerReferenciaBoletin,
} from "./boletinesApi";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de generación administrativa de boletines", () => {
  it("lista cursos y estudiantes y genera con las rutas actuales", async () => {
    const cursos = [{ id: 3 }];
    const estudiantes = [{ id: 8 }];
    const boletin = { estudiante_nombre: "Sara", periodo: 2 };
    apiMock.get
      .mockResolvedValueOnce({ data: cursos })
      .mockResolvedValueOnce({ data: estudiantes })
      .mockResolvedValueOnce({ data: boletin });

    await expect(listarCursosBoletines()).resolves.toBe(cursos);
    await expect(listarEstudiantesBoletines()).resolves.toBe(estudiantes);
    await expect(generarBoletinAdministrativo(8, 2)).resolves.toBe(boletin);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/cursos");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/estudiantes");
    expect(apiMock.get).toHaveBeenNthCalledWith(
      3,
      "/boletines/admin/generar/8/2",
    );
  });

  it("permite cancelar consultas sin alterar las llamadas sin señal", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: [] });

    await listarCursosBoletines({ signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
      signal: controller.signal,
    });
  });
});

describe("contrato HTTP de ingreso docente a boletines", () => {
  it("consulta clases y referencia y conserva el payload de guardado", async () => {
    const clases = [{ id: 55 }];
    const referencia = [{ estudiante_id: 101 }];
    const payload = {
      estudiante_id: 101,
      asignacion_id: 55,
      periodo: 1,
      definitiva: 4,
      detalles: [],
    };
    const guardado = { mensaje: "Boletín guardado" };
    apiMock.get
      .mockResolvedValueOnce({ data: clases })
      .mockResolvedValueOnce({ data: referencia });
    apiMock.post.mockResolvedValue({ data: guardado });

    await expect(listarClasesProfesorBoletines(7)).resolves.toBe(clases);
    await expect(obtenerReferenciaBoletin(55, 1)).resolves.toBe(referencia);
    await expect(guardarBoletinProfesor(payload)).resolves.toBe(guardado);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/mis-clases/7");
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      "/boletines/referencia/55/1",
    );
    expect(apiMock.post).toHaveBeenCalledWith("/boletines/guardar", payload);
    expect(apiMock.post.mock.calls[0][1]).toBe(payload);
  });
});

describe("contrato HTTP del orden del boletín", () => {
  it("consulta y guarda por curso sin alterar el payload", async () => {
    const orden = { items: [{ materia_id: 20 }] };
    const payload = { materias: [{ materia_id: 20 }] };
    const guardado = { items: [{ materia_id: 20, orden_boletin: 1 }] };
    apiMock.get.mockResolvedValue({ data: orden });
    apiMock.put.mockResolvedValue({ data: guardado });

    await expect(obtenerOrdenBoletin(4)).resolves.toBe(orden);
    await expect(guardarOrdenBoletin(4, payload)).resolves.toBe(guardado);

    expect(apiMock.get).toHaveBeenCalledWith("/cursos/4/orden-boletin");
    expect(apiMock.put).toHaveBeenCalledWith(
      "/cursos/4/orden-boletin",
      payload,
    );
    expect(apiMock.put.mock.calls[0][1]).toBe(payload);
  });

  it("propaga los errores sin decidir mensajes visuales", async () => {
    const error = { response: { status: 409, data: { detail: "Conflicto" } } };
    apiMock.get.mockRejectedValue(error);

    await expect(obtenerOrdenBoletin(4)).rejects.toBe(error);
  });
});
