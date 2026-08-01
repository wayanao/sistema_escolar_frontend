import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
    },
}));

vi.mock("../utils/api", () => ({
    default: apiMock,
}));

import { listarHorariosAdmin } from "./horariosApi";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("contrato HTTP de horarios administrativos", () => {
    it("lista horarios por la ruta vigente y devuelve los datos sin reinterpretarlos", async () => {
        const horarios = [
            {
                profesor: "Ana Torres",
                curso: "7B",
                materia: "MATEMÁTICAS",
                dia: "Lunes",
                hora_inicio: "08:00",
                hora_fin: "09:00",
            },
        ];
        apiMock.get.mockResolvedValue({ data: horarios });

        await expect(listarHorariosAdmin()).resolves.toBe(horarios);

        expect(apiMock.get).toHaveBeenCalledWith("/hora/horarios-admin");
    });

    it("propaga el error original sin reinterpretarlo", async () => {
        const error = { response: { status: 500, data: { detail: "Error interno" } } };
        apiMock.get.mockRejectedValue(error);

        await expect(listarHorariosAdmin()).rejects.toBe(error);
    });

    it("acepta una señal opcional sin alterar la ruta", async () => {
        const controller = new AbortController();
        apiMock.get.mockResolvedValue({ data: [] });

        await listarHorariosAdmin({ signal: controller.signal });

        expect(apiMock.get).toHaveBeenCalledWith("/hora/horarios-admin", {
            signal: controller.signal,
        });
    });
});
