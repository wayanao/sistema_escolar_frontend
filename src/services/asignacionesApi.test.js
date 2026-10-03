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

import {
    actualizarAsignacion,
    crearAsignacion,
    desactivarAsignacion,
    listarAsignaciones,
    listarCursosAsignacion,
    listarMateriasAsignacion,
    listarProfesoresAsignacion,
    obtenerDisponibilidadProfesor,
} from "./asignacionesApi";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("contrato HTTP de asignaciones académicas", () => {
    it("consulta los cuatro catálogos con las rutas vigentes", async () => {
        const profesores = [{ id: 11 }];
        const cursos = [{ id: 21 }];
        const materias = [{ id: 31 }];
        const asignaciones = [{ id: 41 }];
        apiMock.get
            .mockResolvedValueOnce({ data: profesores })
            .mockResolvedValueOnce({ data: cursos })
            .mockResolvedValueOnce({ data: materias })
            .mockResolvedValueOnce({ data: asignaciones });

        await expect(listarProfesoresAsignacion()).resolves.toBe(profesores);
        await expect(listarCursosAsignacion()).resolves.toBe(cursos);
        await expect(listarMateriasAsignacion()).resolves.toBe(materias);
        await expect(listarAsignaciones()).resolves.toBe(asignaciones);

        expect(apiMock.get).toHaveBeenNthCalledWith(1, "/profesores");
        expect(apiMock.get).toHaveBeenNthCalledWith(2, "/cursos");
        expect(apiMock.get).toHaveBeenNthCalledWith(3, "/materias");
        expect(apiMock.get).toHaveBeenNthCalledWith(4, "/asignaciones/lista");
    });

    it("consulta disponibilidad sin alterar los parámetros", async () => {
        const params = { dia: "Lunes", excluir_asignacion_id: 41 };
        const disponibilidad = { jornadas: [] };
        const controller = new AbortController();
        apiMock.get.mockResolvedValue({ data: disponibilidad });

        await expect(obtenerDisponibilidadProfesor(11, params, {
            signal: controller.signal,
        })).resolves.toBe(disponibilidad);

        expect(apiMock.get).toHaveBeenCalledWith("/profesores/11/disponibilidad", {
            params,
            signal: controller.signal,
        });
        expect(apiMock.get.mock.calls[0][1].params).toBe(params);
    });

    it("mirando otro año, cursos, clases y disponibilidad llevan anio_lectivo_id", async () => {
        const controller = new AbortController();
        const parametrosAnio = { anio_lectivo_id: 2 };
        apiMock.get.mockResolvedValue({ data: [] });

        await listarCursosAsignacion({ signal: controller.signal, parametrosAnio });
        await listarAsignaciones({ signal: controller.signal, parametrosAnio });
        await obtenerDisponibilidadProfesor(
            11,
            { dia: "Lunes" },
            { signal: controller.signal, parametrosAnio },
        );

        expect(apiMock.get).toHaveBeenNthCalledWith(1, "/cursos", {
            params: parametrosAnio,
            signal: controller.signal,
        });
        expect(apiMock.get).toHaveBeenNthCalledWith(2, "/asignaciones/lista", {
            params: parametrosAnio,
            signal: controller.signal,
        });
        expect(apiMock.get).toHaveBeenNthCalledWith(3, "/profesores/11/disponibilidad", {
            params: { dia: "Lunes", anio_lectivo_id: 2 },
            signal: controller.signal,
        });
    });

    it("crea y actualiza conservando el payload exacto", async () => {
        const payload = {
            profesor_id: 11,
            curso_id: 21,
            materia_id: 31,
            dia: "Lunes",
            hora_inicio: "08:00",
            hora_fin: "09:00",
        };
        const creada = { id: 41 };
        const actualizada = { id: 41, hora_fin: "10:00" };
        apiMock.post.mockResolvedValue({ data: creada });
        apiMock.put.mockResolvedValue({ data: actualizada });

        await expect(crearAsignacion(payload)).resolves.toBe(creada);
        await expect(actualizarAsignacion(41, payload)).resolves.toBe(actualizada);

        expect(apiMock.post).toHaveBeenCalledWith("/asignaciones", payload);
        expect(apiMock.put).toHaveBeenCalledWith("/asignaciones/41", payload);
        expect(apiMock.post.mock.calls[0][1]).toBe(payload);
        expect(apiMock.put.mock.calls[0][1]).toBe(payload);
    });

    it("desactiva con DELETE y propaga errores sin reinterpretarlos", async () => {
        const respuesta = { mensaje: "Asignación desactivada" };
        const error = { response: { status: 409, data: { detail: "Conflicto" } } };
        apiMock.delete.mockResolvedValue({ data: respuesta });
        apiMock.get.mockRejectedValue(error);

        await expect(desactivarAsignacion(41)).resolves.toBe(respuesta);
        expect(apiMock.delete).toHaveBeenCalledWith("/asignaciones/41");
        await expect(listarAsignaciones()).rejects.toBe(error);
    });
});
