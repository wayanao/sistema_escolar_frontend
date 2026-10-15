import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actualizarAdmision: vi.fn(),
  borrarAdmision: vi.fn(),
  cambiarResultadoAdmision: vi.fn(),
  matricularAdmision: vi.fn(),
  obtenerAdmision: vi.fn(),
  registrarAdmision: vi.fn(),
}));

vi.mock("../../services/admisionesApi", () => mocks);

import useComandosAdmision from "./useComandosAdmision";

const DETALLE = {
  id: 7,
  anio_lectivo_id: 3,
  nombre: "Lina",
  apellido: "Díaz",
  documento_identidad: "2001",
  curso_id: 20,
  autoriza_datos: true,
  autoriza_nombre: "Marta Díaz",
  entrevistador: null,
  resultado: "pendiente",
  motivo_resultado: null,
  editable: true,
  matriculada: false,
  aviso_documento: null,
};

const recargar = vi.fn();

function montar(anioLectivoId = 3) {
  return renderHook(({ anio }) => useComandosAdmision({ anioLectivoId: anio, recargar }), {
    initialProps: { anio: anioLectivoId },
  });
}

function llenarAspirante(result) {
  act(() => {
    result.current.cambiarCampo("nombre", " Lina ");
    result.current.cambiarCampo("apellido", "Díaz");
    result.current.cambiarCampo("autoriza_datos", true);
    result.current.cambiarCampo("autoriza_nombre", "Marta Díaz");
  });
}

async function abrirFicha(result) {
  await act(() => result.current.abrirFicha(7));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.obtenerAdmision.mockResolvedValue(DETALLE);
});

describe("nuevo aspirante", () => {
  it("abre un formulario vacío", () => {
    const { result } = montar();

    act(() => result.current.abrirNuevo());

    expect(result.current.modo).toBe("nuevo");
    expect(result.current.formulario.nombre).toBe("");
    expect(result.current.formulario.autoriza_datos).toBe(false);
  });

  it("sin los obligatorios no llama al backend y dice qué falta", async () => {
    const { result } = montar();
    act(() => result.current.abrirNuevo());

    let respuesta;
    await act(async () => {
      respuesta = await result.current.registrar();
    });

    expect(respuesta).toEqual({ estado: "validacion" });
    expect(mocks.registrarAdmision).not.toHaveBeenCalled();
    expect(result.current.errores.autoriza_datos).toBe(
      "Sin la autorización de datos no se puede registrar al aspirante.",
    );
  });

  it("escribir en un campo quita su error", async () => {
    const { result } = montar();
    act(() => result.current.abrirNuevo());
    await act(() => result.current.registrar());

    act(() => result.current.cambiarCampo("nombre", "Lina"));

    expect(result.current.errores.nombre).toBeUndefined();
    expect(result.current.errores.apellido).toBe("Escribe los apellidos.");
  });

  it("registra y deja abierta la ficha para escribir la entrevista", async () => {
    mocks.registrarAdmision.mockResolvedValue(DETALLE);
    const { result } = montar();
    act(() => result.current.abrirNuevo());
    llenarAspirante(result);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.registrar();
    });

    expect(respuesta).toEqual({ estado: "exito" });
    expect(mocks.registrarAdmision).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ nombre: "Lina", autoriza_datos: true, curso_id: null }),
    );
    expect(result.current.modo).toBe("ficha");
    expect(result.current.admision).toBe(DETALLE);
    expect(result.current.mensaje).toBe(
      "Se registró a Lina Díaz como aspirante. Ahora puedes escribir la entrevista.",
    );
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("si el backend lo rechaza, muestra su mensaje y no cierra el formulario", async () => {
    mocks.registrarAdmision.mockRejectedValue({
      response: { data: { detail: "Ya hay un aspirante con el documento 2001 en 2027." } },
    });
    const { result } = montar();
    act(() => result.current.abrirNuevo());
    llenarAspirante(result);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.registrar();
    });

    expect(respuesta).toEqual({ estado: "error" });
    expect(result.current.error).toBe("Ya hay un aspirante con el documento 2001 en 2027.");
    expect(result.current.modo).toBe("nuevo");
    expect(recargar).not.toHaveBeenCalled();
  });
});

describe("ficha del aspirante", () => {
  it("se abre con la admisión completa", async () => {
    const { result } = montar();

    await abrirFicha(result);

    expect(mocks.obtenerAdmision).toHaveBeenCalledWith(7, { signal: expect.any(AbortSignal) });
    expect(result.current.modo).toBe("ficha");
    expect(result.current.admision).toBe(DETALLE);
    expect(result.current.formulario.curso_id).toBe("20");
    expect(result.current.resultado).toEqual({ resultado: "pendiente", motivo_resultado: "" });
  });

  it("si no se puede abrir, lo dice y no deja una ficha a medias", async () => {
    mocks.obtenerAdmision.mockRejectedValue({ response: { data: { detail: "La admisión no existe." } } });
    const { result } = montar();

    await abrirFicha(result);

    expect(result.current.error).toBe("La admisión no existe.");
    expect(result.current.modo).toBeNull();
    expect(result.current.admision).toBeNull();
  });

  it("guarda aspirante y entrevista juntos", async () => {
    const guardado = { ...DETALLE, entrevistador: "Psicóloga Ruiz" };
    mocks.actualizarAdmision.mockResolvedValue(guardado);
    const { result } = montar();
    await abrirFicha(result);
    act(() => result.current.cambiarCampo("entrevistador", "Psicóloga Ruiz"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardarFicha();
    });

    expect(respuesta).toEqual({ estado: "exito" });
    expect(mocks.actualizarAdmision).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ nombre: "Lina", entrevistador: "Psicóloga Ruiz" }),
    );
    expect(result.current.admision).toBe(guardado);
    expect(result.current.mensaje).toBe("Se guardaron los datos y la entrevista de Lina Díaz.");
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("no aprobado sin motivo no llama al backend", async () => {
    const { result } = montar();
    await abrirFicha(result);
    act(() => result.current.cambiarResultado("resultado", "no_aprobado"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardarResultado();
    });

    expect(respuesta).toEqual({ estado: "validacion" });
    expect(mocks.cambiarResultadoAdmision).not.toHaveBeenCalled();
    expect(result.current.erroresResultado.motivo_resultado).toBe(
      'Para marcar "No aprobado" escribe el motivo.',
    );
  });

  it("guarda el resultado con su motivo", async () => {
    mocks.cambiarResultadoAdmision.mockResolvedValue({
      ...DETALLE,
      resultado: "no_aprobado",
      motivo_resultado: "Cupo lleno",
    });
    const { result } = montar();
    await abrirFicha(result);
    act(() => {
      result.current.cambiarResultado("resultado", "no_aprobado");
      result.current.cambiarResultado("motivo_resultado", " Cupo lleno ");
    });

    await act(() => result.current.guardarResultado());

    expect(mocks.cambiarResultadoAdmision).toHaveBeenCalledWith(7, {
      resultado: "no_aprobado",
      motivo_resultado: "Cupo lleno",
    });
    expect(result.current.mensaje).toBe("Resultado de Lina Díaz: No aprobado.");
    expect(result.current.resultado.motivo_resultado).toBe("Cupo lleno");
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("borrar cierra la ficha y recarga la lista", async () => {
    mocks.borrarAdmision.mockResolvedValue({ mensaje: "Admisión borrada", id: 7 });
    const { result } = montar();
    await abrirFicha(result);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.borrar();
    });

    expect(respuesta).toEqual({ estado: "exito" });
    expect(mocks.borrarAdmision).toHaveBeenCalledWith(7);
    expect(result.current.modo).toBeNull();
    expect(result.current.mensaje).toBe("Se borró la admisión de Lina Díaz.");
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("si borrar falla, la ficha sigue abierta con el mensaje del backend", async () => {
    mocks.borrarAdmision.mockRejectedValue({
      response: { data: { detail: "Esta admisión ya está matriculada. Solo se puede consultar." } },
    });
    const { result } = montar();
    await abrirFicha(result);

    await act(() => result.current.borrar());

    expect(result.current.modo).toBe("ficha");
    expect(result.current.error).toBe("Esta admisión ya está matriculada. Solo se puede consultar.");
  });

  it("cambiar de año cierra lo que estaba abierto", async () => {
    const { result, rerender } = montar();
    await abrirFicha(result);

    rerender({ anio: 4 });

    await waitFor(() => expect(result.current.modo).toBeNull());
    expect(result.current.admision).toBeNull();
  });
});

describe("matricular desde la ficha (paso E5)", () => {
  it("matricula con la ficha del estudiante y deja la admisión de solo consulta", async () => {
    const matriculada = {
      ...DETALLE,
      resultado: "aprobado",
      estudiante_id: 55,
      matriculada: true,
      editable: false,
    };
    mocks.obtenerAdmision.mockResolvedValue({ ...DETALLE, resultado: "aprobado" });
    mocks.matricularAdmision.mockResolvedValue({
      mensaje: "Matrícula creada en 2027 para Lina Díaz.",
      estudiante_id: 55,
      admision: matriculada,
    });
    const { result } = montar();
    await abrirFicha(result);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.matricularConFicha({ nombre: "Lina", curso_id: "20" });
    });

    expect(mocks.matricularAdmision).toHaveBeenCalledWith(7, { nombre: "Lina", curso_id: "20" });
    expect(respuesta.estudiante_id).toBe(55);
    expect(result.current.admision).toBe(matriculada);
    expect(result.current.mensaje).toBe("Matrícula creada en 2027 para Lina Díaz.");
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("si el backend lo rechaza, muestra su mensaje y vuelve a lanzar el error", async () => {
    const error = {
      response: { data: { detail: "Lina Díaz estudia en 2026: pásalo a 2027 desde la promoción." } },
    };
    mocks.matricularAdmision.mockRejectedValue(error);
    const { result } = montar();
    await abrirFicha(result);

    await act(async () => {
      await expect(result.current.matricularConFicha({})).rejects.toBe(error);
    });

    expect(result.current.error).toBe(
      "Lina Díaz estudia en 2026: pásalo a 2027 desde la promoción.",
    );
    expect(result.current.modo).toBe("ficha");
    expect(recargar).not.toHaveBeenCalled();
  });

  it("la pantalla puede mostrar su propio aviso", () => {
    const { result } = montar();

    act(() => result.current.avisarError("Completa los campos obligatorios."));

    expect(result.current.error).toBe("Completa los campos obligatorios.");
    expect(result.current.mensaje).toBe("");
  });
});

describe("preguntas del anexo (paso E11)", () => {
  const NUMERO_HERMANOS = {
    numero: 2,
    clave: "numero_hermanos",
    texto: "Número de hermanos",
    tipo: "numero",
    minimo: 0,
    maximo: 20,
  };
  const USA_PANAL = {
    numero: 18,
    clave: "usa_panal",
    texto: "¿Usa pañal desechable?",
    tipo: "si_no",
    opciones: [
      { valor: "si", etiqueta: "Sí" },
      { valor: "no", etiqueta: "No" },
    ],
  };
  const SECCIONES = [
    { clave: "familia", titulo: "Familia", preguntas: [NUMERO_HERMANOS] },
    { clave: "salud", titulo: "Salud", preguntas: [USA_PANAL] },
  ];

  function montarConPreguntas() {
    return renderHook(() =>
      useComandosAdmision({ anioLectivoId: 3, recargar, cuestionario: SECCIONES }),
    );
  }

  it("al abrir, trae las respuestas guardadas de la admisión", async () => {
    mocks.obtenerAdmision.mockResolvedValue({
      ...DETALLE,
      cuestionario: { numero_hermanos: 2 },
    });
    const { result } = montarConPreguntas();

    await abrirFicha(result);

    expect(result.current.respuestas).toEqual({ numero_hermanos: "2" });
    expect(result.current.erroresCuestionario).toEqual({});
  });

  it("si no se tocan las preguntas, el cuerpo es el de siempre: sin cuestionario", async () => {
    mocks.obtenerAdmision.mockResolvedValue({ ...DETALLE, cuestionario: { numero_hermanos: 2 } });
    mocks.actualizarAdmision.mockResolvedValue(DETALLE);
    const { result } = montarConPreguntas();
    await abrirFicha(result);
    act(() => result.current.cambiarCampo("entrevistador", "Psicóloga Ruiz"));

    await act(() => result.current.guardarFicha());

    const [, cuerpo] = mocks.actualizarAdmision.mock.calls[0];
    expect("cuestionario" in cuerpo).toBe(false);
  });

  it("si se tocan, envía el bloque entero y limpio", async () => {
    mocks.obtenerAdmision.mockResolvedValue({ ...DETALLE, cuestionario: { numero_hermanos: 2 } });
    const guardado = {
      ...DETALLE,
      cuestionario: { numero_hermanos: 2, usa_panal: { respuesta: "no" } },
    };
    mocks.actualizarAdmision.mockResolvedValue(guardado);
    const { result } = montarConPreguntas();
    await abrirFicha(result);

    act(() => result.current.cambiarRespuesta(USA_PANAL, "elegir", "no"));
    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardarFicha();
    });

    expect(respuesta).toEqual({ estado: "exito" });
    expect(mocks.actualizarAdmision).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        nombre: "Lina",
        cuestionario: { numero_hermanos: 2, usa_panal: { respuesta: "no" } },
      }),
    );
    expect(result.current.respuestas).toEqual({
      numero_hermanos: "2",
      usa_panal: { respuesta: "no" },
    });
  });

  it("después de guardar, volver a guardar sin tocar no lo manda otra vez", async () => {
    mocks.actualizarAdmision.mockResolvedValue({ ...DETALLE, cuestionario: { usa_panal: { respuesta: "si" } } });
    const { result } = montarConPreguntas();
    await abrirFicha(result);
    act(() => result.current.cambiarRespuesta(USA_PANAL, "elegir", "si"));
    await act(() => result.current.guardarFicha());

    await act(() => result.current.guardarFicha());

    const [, segundo] = mocks.actualizarAdmision.mock.calls[1];
    expect("cuestionario" in segundo).toBe(false);
  });

  it("un número fuera de rango no llama al backend y dice cuál pregunta", async () => {
    const { result } = montarConPreguntas();
    await abrirFicha(result);
    act(() => result.current.cambiarRespuesta(NUMERO_HERMANOS, "escribir", "25"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardarFicha();
    });

    expect(respuesta).toEqual({ estado: "validacion" });
    expect(mocks.actualizarAdmision).not.toHaveBeenCalled();
    expect(result.current.erroresCuestionario).toEqual({
      numero_hermanos: "Pregunta 2: escribe un número entero entre 0 y 20.",
    });
    expect(result.current.error).toBe("Pregunta 2: escribe un número entero entre 0 y 20.");
  });

  it("corregir la respuesta quita su error", async () => {
    const { result } = montarConPreguntas();
    await abrirFicha(result);
    act(() => result.current.cambiarRespuesta(NUMERO_HERMANOS, "escribir", "25"));
    await act(() => result.current.guardarFicha());

    act(() => result.current.cambiarRespuesta(NUMERO_HERMANOS, "escribir", "2"));

    expect(result.current.erroresCuestionario).toEqual({});
  });

  it("cerrar olvida las respuestas", async () => {
    mocks.obtenerAdmision.mockResolvedValue({ ...DETALLE, cuestionario: { numero_hermanos: 2 } });
    const { result } = montarConPreguntas();
    await abrirFicha(result);

    act(() => result.current.cerrar());

    expect(result.current.respuestas).toEqual({});
  });
});
