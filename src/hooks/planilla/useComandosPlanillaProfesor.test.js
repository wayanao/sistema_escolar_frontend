import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
    guardarNotaPlanillaMock,
    eliminarTipoEvaluacionPlanillaMock,
    swalFireMock,
} = vi.hoisted(() => ({
    guardarNotaPlanillaMock: vi.fn(),
    eliminarTipoEvaluacionPlanillaMock: vi.fn(),
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/planillaApi", () => ({
    guardarNotaPlanilla: guardarNotaPlanillaMock,
    eliminarTipoEvaluacionPlanilla: eliminarTipoEvaluacionPlanillaMock,
}));

vi.mock("sweetalert2", () => ({
    default: {
        fire: swalFireMock,
    },
}));

import useComandosPlanillaProfesor from "./useComandosPlanillaProfesor";

const ESTUDIANTES = [
    { estudiante_id: 501, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4 } },
    { estudiante_id: 502, nombre: "Luis", apellido: "Pérez", notas: { quiz: 2, "trabajo grupal": 3 } },
];
const COLUMNAS = ["quiz", "trabajo grupal"];

function crearParametros(overrides = {}) {
    return {
        asignacionId: "88",
        periodo: "3",
        tipoEvaluacion: "numerica",
        estudiantes: ESTUDIANTES,
        columnas: COLUMNAS,
        setEstudiantes: vi.fn(),
        setColumnas: vi.fn(),
        cargarPlanilla: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function aplicarActualizacion(setterMock, valorPrevio, llamada = 0) {
    const actualizador = setterMock.mock.calls[llamada][0];
    return typeof actualizador === "function" ? actualizador(valorPrevio) : actualizador;
}

beforeEach(() => {
    vi.clearAllMocks();
    guardarNotaPlanillaMock.mockResolvedValue({});
    eliminarTipoEvaluacionPlanillaMock.mockResolvedValue({});
    swalFireMock.mockResolvedValue({ isConfirmed: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useComandosPlanillaProfesor", () => {
    it("guarda una nota numérica válida, actualiza el estudiante localmente y recarga", async () => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        let exito;
        await act(async () => {
            exito = await result.current.guardarNota(502, "quiz", "5");
        });

        expect(exito).toBe(true);
        expect(guardarNotaPlanillaMock).toHaveBeenCalledWith({
            estudiante_id: 502,
            asignacion_id: 88,
            nota: 5,
            descripcion: "quiz",
            periodo: 3,
            tipo_evaluacion: "numerica",
            valoracion: null,
        });
        const actualizado = aplicarActualizacion(params.setEstudiantes, ESTUDIANTES);
        expect(actualizado.find((e) => e.estudiante_id === 502)).toEqual({
            estudiante_id: 502,
            nombre: "Luis",
            apellido: "Pérez",
            notas: { quiz: 5, "trabajo grupal": 3 },
            promedio: "4.00",
        });
        expect(params.cargarPlanilla).toHaveBeenCalledTimes(1);
    });

    it("rechaza una nota fuera de rango, avisa y no llama al backend", async () => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        let exito;
        await act(async () => {
            exito = await result.current.guardarNota(502, "quiz", "9");
        });

        expect(exito).toBe(false);
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
            title: "Nota inválida",
            text: "La nota debe estar entre 1 y 5",
        }));
        expect(guardarNotaPlanillaMock).not.toHaveBeenCalled();
        expect(params.setEstudiantes).not.toHaveBeenCalled();
        expect(params.cargarPlanilla).not.toHaveBeenCalled();
    });

    it("limpia una nota numérica existente enviando nota null", async () => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        await act(async () => {
            await result.current.guardarNota(502, "quiz", "");
        });

        expect(guardarNotaPlanillaMock).toHaveBeenCalledWith({
            estudiante_id: 502,
            asignacion_id: 88,
            nota: null,
            descripcion: "quiz",
            periodo: 3,
            tipo_evaluacion: "numerica",
            valoracion: null,
        });
        const actualizado = aplicarActualizacion(params.setEstudiantes, ESTUDIANTES);
        expect(actualizado.find((e) => e.estudiante_id === 502).notas).toEqual({ "trabajo grupal": 3 });
    });

    it("guarda una valoración de desarrollo sin validar rango numérico", async () => {
        const params = crearParametros({ tipoEvaluacion: "desarrollo" });
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        await act(async () => {
            await result.current.guardarNota(501, "quiz", "logrado");
        });

        expect(guardarNotaPlanillaMock).toHaveBeenCalledWith({
            estudiante_id: 501,
            asignacion_id: 88,
            nota: null,
            descripcion: "quiz",
            periodo: 3,
            tipo_evaluacion: "desarrollo",
            valoracion: "logrado",
        });
        const actualizado = aplicarActualizacion(params.setEstudiantes, ESTUDIANTES);
        expect(actualizado.find((e) => e.estudiante_id === 501).valoraciones).toEqual({ quiz: "logrado" });
        expect(swalFireMock).not.toHaveBeenCalled();
    });

    it("agrega un tipo de evaluación nuevo y bloquea nombres reservados o duplicados", async () => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        act(() => result.current.setNuevoTipo("Mas_Alto"));
        await act(async () => {
            await result.current.agregarTipoEvaluacion();
        });
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
            text: "Ese nombre está reservado por el sistema.",
        }));
        expect(guardarNotaPlanillaMock).not.toHaveBeenCalled();

        act(() => result.current.setNuevoTipo("QUIZ"));
        await act(async () => {
            await result.current.agregarTipoEvaluacion();
        });
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
            text: "El tipo de evaluación ya existe",
        }));
        expect(guardarNotaPlanillaMock).not.toHaveBeenCalled();

        act(() => result.current.setNuevoTipo("Cuaderno"));
        await act(async () => {
            await result.current.agregarTipoEvaluacion();
        });
        expect(guardarNotaPlanillaMock).toHaveBeenCalledWith({
            estudiante_id: 501,
            asignacion_id: 88,
            nota: null,
            descripcion: "Cuaderno",
            periodo: 3,
            tipo_evaluacion: "numerica",
            valoracion: null,
        });
        expect(result.current.nuevoTipo).toBe("");
        expect(params.cargarPlanilla).toHaveBeenCalledTimes(1);
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
            icon: "success",
            title: "Guardado",
            text: 'El tipo de evaluación "Cuaderno" fue agregado correctamente.',
        }));
    });

    it("elimina un tipo de evaluación tras confirmar y no hace nada si se cancela", async () => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        act(() => result.current.setTipoEliminar("trabajo grupal"));

        swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
        await act(async () => {
            await result.current.eliminarTipoEvaluacion();
        });
        expect(eliminarTipoEvaluacionPlanillaMock).not.toHaveBeenCalled();

        swalFireMock.mockResolvedValue({ isConfirmed: true });
        await act(async () => {
            await result.current.eliminarTipoEvaluacion();
        });

        expect(eliminarTipoEvaluacionPlanillaMock).toHaveBeenCalledWith({
            asignacionId: "88",
            descripcion: "trabajo grupal",
            periodo: "3",
        });
        expect(params.setColumnas).toHaveBeenCalledWith(["quiz"]);
        const actualizado = aplicarActualizacion(params.setEstudiantes, ESTUDIANTES);
        expect(actualizado.find((e) => e.estudiante_id === 502).notas).toEqual({ quiz: 2 });
        expect(result.current.tipoEliminar).toBe("");
        expect(params.cargarPlanilla).toHaveBeenCalledTimes(1);
    });

    it("bloquea una segunda acción de tipo mientras la primera sigue en curso", async () => {
        let resolverGuardado;
        guardarNotaPlanillaMock.mockImplementationOnce(() => new Promise((resolve) => {
            resolverGuardado = resolve;
        }));
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        act(() => result.current.setNuevoTipo("Cuaderno"));

        let primeraLlamada;
        act(() => {
            primeraLlamada = result.current.agregarTipoEvaluacion();
        });
        await waitFor(() => expect(result.current.accionTipoEnCurso).toBe("agregar"));

        await act(async () => {
            await result.current.agregarTipoEvaluacion();
        });
        expect(guardarNotaPlanillaMock).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolverGuardado({});
            await primeraLlamada;
        });
        expect(result.current.accionTipoEnCurso).toBe(null);
    });
});
