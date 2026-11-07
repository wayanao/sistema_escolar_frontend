import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
    guardarNotaPlanillaMock,
    eliminarTipoEvaluacionPlanillaMock,
    guardarPorcentajeTipoMock,
    swalFireMock,
    swalUpdateMock,
} = vi.hoisted(() => ({
    guardarNotaPlanillaMock: vi.fn(),
    eliminarTipoEvaluacionPlanillaMock: vi.fn(),
    guardarPorcentajeTipoMock: vi.fn(),
    swalFireMock: vi.fn(),
    swalUpdateMock: vi.fn(),
}));

vi.mock("../../services/planillaApi", () => ({
    guardarNotaPlanilla: guardarNotaPlanillaMock,
    eliminarTipoEvaluacionPlanilla: eliminarTipoEvaluacionPlanillaMock,
    guardarPorcentajeTipo: guardarPorcentajeTipoMock,
}));

// Agregar y eliminar tipos usan la espera que pasa a éxito en la misma ventana
// (ventanaExito.js): por eso hacen falta más partes de SweetAlert.
vi.mock("sweetalert2", () => ({
    default: {
        fire: swalFireMock,
        update: swalUpdateMock,
        getFooter: vi.fn(),
        getPopup: vi.fn(),
        isVisible: vi.fn(),
        close: vi.fn(),
    },
}));

import useComandosPlanillaProfesor from "./useComandosPlanillaProfesor";
import { opcionesExitoTrasEspera, opcionesVentanaEspera } from "../ventanaExito";

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
    it("guarda una nota numérica válida, actualiza el estudiante localmente y no recarga la planilla", async () => {
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
        // La pantalla ya quedó al día sola: pedir la planilla entera era la
        // segunda petición de cada nota.
        expect(params.cargarPlanilla).not.toHaveBeenCalled();
        expect(guardarNotaPlanillaMock).toHaveBeenCalledTimes(1);
    });

    it("no gasta una petición cuando el profesor sale de la celda sin cambiar la nota", async () => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        let exito;
        await act(async () => {
            exito = await result.current.guardarNota(502, "quiz", "2.00");
        });

        expect(exito).toBe(true);
        expect(guardarNotaPlanillaMock).not.toHaveBeenCalled();
        expect(params.setEstudiantes).not.toHaveBeenCalled();
        expect(params.cargarPlanilla).not.toHaveBeenCalled();
    });

    it("no gasta una petición al volver a pulsar la carita que ya estaba puesta", async () => {
        const estudiantes = [
            { estudiante_id: 501, nombre: "Ana", apellido: "Ruiz", notas: {}, valoraciones: { quiz: "logrado" } },
        ];
        const params = crearParametros({ tipoEvaluacion: "desarrollo", estudiantes });
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        await act(async () => {
            await result.current.guardarNota(501, "quiz", "logrado");
        });
        expect(guardarNotaPlanillaMock).not.toHaveBeenCalled();

        await act(async () => {
            await result.current.guardarNota(501, "quiz", "destacado");
        });
        expect(guardarNotaPlanillaMock).toHaveBeenCalledTimes(1);
    });

    it("marca la nota como pendiente cuando el guardado falla y la reintenta aunque el valor no cambie", async () => {
        guardarNotaPlanillaMock.mockRejectedValueOnce(new Error("sin red"));
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        let exito;
        await act(async () => {
            exito = await result.current.guardarNota(502, "quiz", "5");
        });

        // El valor se queda en pantalla: `false` lo habría borrado de la celda.
        expect(exito).toBe(true);
        expect(result.current.notasSinGuardar).toEqual({ "502|quiz": true });
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
            icon: "error",
            title: "No se guardó",
        }));

        // Mismo valor que ya se ve en pantalla: sin la marca de pendiente esto
        // no volvería a intentarse y la nota se perdería.
        await act(async () => {
            await result.current.guardarNota(502, "quiz", "5");
        });

        expect(guardarNotaPlanillaMock).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(result.current.notasSinGuardar).toEqual({}));
    });

    it("encola dos guardados de la misma celda en vez de lanzarlos a la vez", async () => {
        const resolvers = [];
        guardarNotaPlanillaMock.mockImplementation(
            () => new Promise((resolve) => resolvers.push(resolve)),
        );
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPlanillaProfesor(params));

        let primero;
        let segundo;
        act(() => {
            primero = result.current.guardarNota(502, "quiz", "4");
            segundo = result.current.guardarNota(502, "quiz", "5");
        });

        await waitFor(() => expect(guardarNotaPlanillaMock).toHaveBeenCalledTimes(1));
        expect(resolvers).toHaveLength(1);

        await act(async () => {
            resolvers[0]({});
            await primero;
        });

        await waitFor(() => expect(guardarNotaPlanillaMock).toHaveBeenCalledTimes(2));
        await act(async () => {
            resolvers[1]({});
            await segundo;
        });

        // El último valor es el que llega de último al servidor.
        expect(guardarNotaPlanillaMock.mock.calls.at(-1)[0]).toEqual(
            expect.objectContaining({ nota: 5 }),
        );
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
        // Una sola espera: la tarjeta sale al oprimir y pasa a éxito sin cerrarse.
        expect(swalFireMock).toHaveBeenCalledWith(
            opcionesVentanaEspera({ title: "Agregando el tipo de evaluación…" }),
        );
        expect(swalUpdateMock).toHaveBeenCalledWith(opcionesExitoTrasEspera({
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
        // La confirmación se queda; después, una sola espera que pasa a éxito.
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({ title: "¿Estás seguro?" }));
        expect(swalFireMock).toHaveBeenLastCalledWith(
            opcionesVentanaEspera({ title: "Eliminando el tipo de evaluación…" }),
        );
        expect(swalUpdateMock).toHaveBeenCalledWith(opcionesExitoTrasEspera({
            title: "Eliminado",
            text: "El tipo de evaluación fue eliminado",
        }));
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

    describe("subnotas (paso A3)", () => {
        const errorConDetalle = (status, detail) =>
            Object.assign(new Error(String(status)), { response: { status, data: { detail } } });

        it("una celda que ya es calculada avisa con el mensaje del servidor y recarga, sin quedar pendiente", async () => {
            guardarNotaPlanillaMock.mockRejectedValueOnce(
                errorConDetalle(409, "Esta nota se calcula con sus subnotas. Cámbiala desde las subnotas."),
            );
            const params = crearParametros();
            const { result } = renderHook(() => useComandosPlanillaProfesor(params));

            let exito;
            await act(async () => {
                exito = await result.current.guardarNota(501, "quiz", "5");
            });

            // false restaura en la celda lo que habia; la recarga trae el promedio.
            expect(exito).toBe(false);
            expect(swalFireMock).toHaveBeenCalledWith({
                icon: "info",
                title: "Nota calculada",
                text: "Esta nota se calcula con sus subnotas. Cámbiala desde las subnotas.",
            });
            expect(params.cargarPlanilla).toHaveBeenCalledTimes(1);
            expect(result.current.notasSinGuardar).toEqual({});
        });

        it("otro 409, como el del año cerrado, sigue como siempre: queda pendiente", async () => {
            guardarNotaPlanillaMock.mockRejectedValueOnce(
                errorConDetalle(409, "El año 2026 está cerrado."),
            );
            const params = crearParametros();
            const { result } = renderHook(() => useComandosPlanillaProfesor(params));

            let exito;
            await act(async () => {
                exito = await result.current.guardarNota(501, "quiz", "5");
            });

            expect(exito).toBe(true);
            expect(result.current.notasSinGuardar).toEqual({ "501|quiz": true });
            expect(params.cargarPlanilla).not.toHaveBeenCalled();
        });

        it("el aviso de eliminar un tipo dice que se van sus subnotas cuando las tiene", async () => {
            const params = crearParametros({
                subnotasPorTipo: { quiz: [{ id: 7, nombre: "Taller 1" }] },
            });
            const { result } = renderHook(() => useComandosPlanillaProfesor(params));

            act(() => result.current.setTipoEliminar("quiz"));
            swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
            await act(async () => {
                await result.current.eliminarTipoEvaluacion();
            });
            act(() => result.current.setTipoEliminar("trabajo grupal"));
            swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
            await act(async () => {
                await result.current.eliminarTipoEvaluacion();
            });

            expect(swalFireMock.mock.calls[0][0].text).toBe(
                "Esta acción eliminará el tipo de evaluación y sus subnotas para todos los estudiantes",
            );
            expect(swalFireMock.mock.calls[1][0].text).toBe(
                "Esta acción eliminará el tipo de evaluación para todos los estudiantes",
            );
        });
    });

    describe("porcentaje al crear un tipo (parte B, paso B4a)", () => {
        const crearCuaderno = async (result, porcentaje) => {
            act(() => result.current.setNuevoTipo("Cuaderno"));
            act(() => result.current.setNuevoPorcentaje(porcentaje));
            await act(async () => {
                await result.current.agregarTipoEvaluacion();
            });
        };

        it("sin porcentaje crea el tipo como siempre y no pide nada más", async () => {
            const params = crearParametros();
            const { result } = renderHook(() => useComandosPlanillaProfesor(params));

            await crearCuaderno(result, "");

            expect(guardarNotaPlanillaMock).toHaveBeenCalledTimes(1);
            expect(guardarPorcentajeTipoMock).not.toHaveBeenCalled();
        });

        it("con porcentaje crea el tipo, guarda su porcentaje y después recarga", async () => {
            const params = crearParametros({ porcentajesPorTipo: { quiz: 60 } });
            const orden = [];
            guardarNotaPlanillaMock.mockImplementation(async () => orden.push("tipo"));
            guardarPorcentajeTipoMock.mockImplementation(async () => orden.push("porcentaje"));
            params.cargarPlanilla.mockImplementation(async () => orden.push("recarga"));
            const { result } = renderHook(() => useComandosPlanillaProfesor(params));

            await crearCuaderno(result, "40");

            expect(orden).toEqual(["tipo", "porcentaje", "recarga"]);
            expect(guardarPorcentajeTipoMock).toHaveBeenCalledWith({
                asignacion_id: 88,
                periodo: 3,
                tipo_nota: "Cuaderno",
                porcentaje: 40,
            });
            expect(result.current.nuevoPorcentaje).toBe("");
            // El éxito sale en la misma tarjeta de espera (ventanaExito.js).
            expect(swalUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
        });

        it.each([
            ["0", "El porcentaje debe ser un número entero de 1 a 100."],
            ["45", "Los porcentajes de esta planilla no pueden sumar más de 100 %."],
        ])("un porcentaje que no sirve (%s) avisa y no crea nada", async (porcentaje, mensaje) => {
            const params = crearParametros({ porcentajesPorTipo: { quiz: 60 } });
            const { result } = renderHook(() => useComandosPlanillaProfesor(params));

            await crearCuaderno(result, porcentaje);

            expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({ text: mensaje }));
            expect(guardarNotaPlanillaMock).not.toHaveBeenCalled();
            expect(guardarPorcentajeTipoMock).not.toHaveBeenCalled();
        });

        it("si el porcentaje no se guarda, el tipo queda creado y lo dice", async () => {
            const params = crearParametros();
            guardarPorcentajeTipoMock.mockRejectedValue(Object.assign(new Error("422"), {
                response: { status: 422, data: { detail: "Los porcentajes de esta planilla no pueden sumar más de 100 %." } },
            }));
            const { result } = renderHook(() => useComandosPlanillaProfesor(params));

            await crearCuaderno(result, "40");

            expect(params.cargarPlanilla).toHaveBeenCalledTimes(1);
            expect(result.current.nuevoTipo).toBe("");
            expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
                icon: "warning",
                text: expect.stringContaining("no pueden sumar más de 100 %"),
            }));
            expect(swalFireMock).not.toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
        });
    });
});
