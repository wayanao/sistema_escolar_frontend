import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  crearColumnaMock,
  crearEnTodosMock,
  eliminarColumnaMock,
  guardarMarcasMock,
  swalFireMock,
} =
  vi.hoisted(() => ({
    crearColumnaMock: vi.fn(),
    crearEnTodosMock: vi.fn(),
    eliminarColumnaMock: vi.fn(),
    guardarMarcasMock: vi.fn(),
    swalFireMock: vi.fn(),
  }));

vi.mock("../../services/listasSeguimientoApi", () => ({
  crearColumnaEnTodosLosCursos: crearEnTodosMock,
  crearColumnaSeguimiento: crearColumnaMock,
  eliminarColumnaSeguimiento: eliminarColumnaMock,
  guardarMarcasSeguimiento: guardarMarcasMock,
}));

vi.mock("sweetalert2", () => ({
  default: { fire: swalFireMock },
}));

import useComandosListasSeguimiento from "./useComandosListasSeguimiento";

const LISTA = {
  cursoId: 12,
  columnas: [
    { id: 5, nombre: "Asistió a la cumbre" },
    { id: 6, nombre: "Compró el libro" },
  ],
  estudiantes: [
    {
      estudianteId: 101,
      nombre: "Juan",
      apellido: "Pérez",
      marcas: { 5: { marcado: true, nota: "Llegó tarde" } },
    },
    { estudianteId: 102, nombre: "Ana", apellido: "Rojas", marcas: {} },
  ],
};

function montar(overrides = {}) {
  const parametros = {
    cursoId: 12,
    lista: LISTA,
    setLista: vi.fn(),
    recargar: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const utilidades = renderHook((props) => useComandosListasSeguimiento(props), {
    initialProps: parametros,
  });
  return { ...utilidades, parametros };
}

const confirmar = () => swalFireMock.mockResolvedValue({ isConfirmed: true });
const cancelar = () => swalFireMock.mockResolvedValue({ isConfirmed: false });

beforeEach(() => {
  vi.clearAllMocks();
  swalFireMock.mockResolvedValue({ isConfirmed: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("estado editable de las celdas", () => {
  it("una celda sin cambios muestra lo guardado", () => {
    const { result } = montar();

    expect(result.current.valorDeCelda(101, 5)).toEqual({
      marcado: true,
      nota: "Llegó tarde",
    });
    expect(result.current.valorDeCelda(102, 5)).toEqual({ marcado: false, nota: "" });
  });

  it("marcar una casilla deja un cambio pendiente", () => {
    const { result } = montar();

    act(() => result.current.alternarMarca(102, 5));

    expect(result.current.hayCambios).toBe(true);
    expect(result.current.valorDeCelda(102, 5)).toEqual({ marcado: true, nota: "" });
  });

  it("escribir una nota conserva el check", () => {
    const { result } = montar();

    act(() => result.current.escribirNota(101, 5, "Nueva nota"));

    expect(result.current.valorDeCelda(101, 5)).toEqual({
      marcado: true,
      nota: "Nueva nota",
    });
  });

  it("volver al valor guardado retira el cambio, no lo apunta", () => {
    // Sin esto, marcar y desmarcar la misma casilla dejaría el botón
    // "Guardar cambios" encendido sin nada que guardar.
    const { result } = montar();

    act(() => result.current.alternarMarca(102, 5));
    expect(result.current.hayCambios).toBe(true);

    act(() => result.current.alternarMarca(102, 5));
    expect(result.current.hayCambios).toBe(false);
  });

  it("el botón se habilita con un solo cambio, no con la grilla completa", () => {
    // El documento avisa de no copiar de Asistencia la regla de "no se puede
    // guardar hasta marcar a todos": aquí lo normal es que casi todas las
    // celdas queden sin marcar.
    const { result } = montar();

    expect(result.current.hayCambios).toBe(false);
    act(() => result.current.alternarMarca(102, 6));
    expect(result.current.hayCambios).toBe(true);
  });

  it("descartar limpia lo pendiente", () => {
    const { result } = montar();
    act(() => result.current.alternarMarca(102, 5));

    act(() => result.current.descartarCambios());

    expect(result.current.hayCambios).toBe(false);
    expect(result.current.valorDeCelda(102, 5)).toEqual({ marcado: false, nota: "" });
  });

  it("cambiar de curso descarta lo pendiente", () => {
    // Conservarlo aplicaría las marcas de un curso sobre otro, que es peor
    // que perderlas.
    const { result, rerender, parametros } = montar();
    act(() => result.current.alternarMarca(102, 5));
    expect(result.current.hayCambios).toBe(true);

    rerender({ ...parametros, cursoId: 13 });

    expect(result.current.hayCambios).toBe(false);
  });
});

describe("guardar el lote", () => {
  it("manda una sola celda por cruce, aunque se toque varias veces", async () => {
    const { result } = montar();
    act(() => result.current.alternarMarca(102, 5));
    act(() => result.current.escribirNota(102, 5, "una"));
    act(() => result.current.escribirNota(102, 5, "otra"));

    await act(async () => {
      await result.current.guardarCambios();
    });

    expect(guardarMarcasMock).toHaveBeenCalledWith(12, [
      { columna_id: 5, estudiante_id: 102, marcado: true, nota: "otra" },
    ]);
  });

  it("pide confirmación antes de guardar", async () => {
    const { result } = montar();
    act(() => result.current.alternarMarca(102, 5));

    await act(async () => {
      await result.current.guardarCambios();
    });

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("Guardar") }),
    );
  });

  it("si se cancela la confirmación no se guarda nada", async () => {
    cancelar();
    const { result } = montar();
    act(() => result.current.alternarMarca(102, 5));

    await act(async () => {
      await result.current.guardarCambios();
    });

    expect(guardarMarcasMock).not.toHaveBeenCalled();
    expect(result.current.hayCambios).toBe(true);
  });

  it("sin cambios no se llama al backend: un lote vacío sería 422", async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.guardarCambios();
    });

    expect(guardarMarcasMock).not.toHaveBeenCalled();
    expect(swalFireMock).not.toHaveBeenCalled();
  });

  it("al guardar bien, limpia lo pendiente y recarga", async () => {
    confirmar();
    const { result, parametros } = montar();
    act(() => result.current.alternarMarca(102, 5));

    await act(async () => {
      await result.current.guardarCambios();
    });

    expect(result.current.hayCambios).toBe(false);
    expect(parametros.recargar).toHaveBeenCalled();
  });

  it("si falla, conserva lo pendiente y muestra el mensaje del backend", async () => {
    guardarMarcasMock.mockRejectedValue({
      response: { status: 422, data: { detail: "El lote incluye una columna ajena." } },
    });
    const { result } = montar();
    act(() => result.current.alternarMarca(102, 5));

    await act(async () => {
      await result.current.guardarCambios();
    });

    expect(result.current.hayCambios).toBe(true);
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: "El lote incluye una columna ajena." }),
    );
  });
});

describe("crear columna", () => {
  it("crea con el nombre recortado y la agrega a la grilla sin recargar", async () => {
    crearColumnaMock.mockResolvedValue({ id: 7, nombre: "Fue a la salida" });
    const { result, parametros } = montar();

    await act(async () => {
      await result.current.crearColumna("  Fue a la salida  ");
    });

    expect(crearColumnaMock).toHaveBeenCalledWith(12, "Fue a la salida");
    expect(parametros.setLista).toHaveBeenCalled();
    expect(parametros.recargar).not.toHaveBeenCalled();
  });

  it("un nombre duplicado ni llega al backend", async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("compró EL libro");
    });

    expect(crearColumnaMock).not.toHaveBeenCalled();
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "warning" }),
    );
  });

  it("un duplicado con espacios de sobra tampoco", async () => {
    // El caso que la regla de planilla dejaría pasar.
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("Compró  el  libro");
    });

    expect(crearColumnaMock).not.toHaveBeenCalled();
  });

  it("un nombre vacío ni llega al backend", async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("   ");
    });

    expect(crearColumnaMock).not.toHaveBeenCalled();
  });

  it("el 409 se trata aunque el chequeo local dijera que estaba libre", async () => {
    // Entre la comprobación y la petición, otra pestaña puede haber creado la
    // misma columna. La regla de verdad es el índice único del backend.
    crearColumnaMock.mockRejectedValue({
      response: { status: 409, data: { detail: "Ya existe una columna con ese nombre." } },
    });
    const { result } = montar();

    let creada;
    await act(async () => {
      creada = await result.current.crearColumna("Nombre nuevo");
    });

    expect(creada).toBe(false);
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        text: "Ya existe una columna con ese nombre.",
      }),
    );
  });
});

describe("borrar columna", () => {
  it("pide confirmación y avisa de que se borran las marcas", async () => {
    confirmar();
    const { result } = montar();

    await act(async () => {
      await result.current.eliminarColumna({ id: 5, nombre: "Asistió a la cumbre" });
    });

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("marcas") }),
    );
    expect(eliminarColumnaMock).toHaveBeenCalledWith(12, 5);
  });

  it("si se cancela no se borra nada", async () => {
    cancelar();
    const { result } = montar();

    await act(async () => {
      await result.current.eliminarColumna({ id: 5, nombre: "Asistió a la cumbre" });
    });

    expect(eliminarColumnaMock).not.toHaveBeenCalled();
  });

  it("descarta los cambios pendientes de esa columna, y solo de esa", async () => {
    // Si se quedaran, el siguiente "Guardar cambios" mandaría celdas de una
    // columna que ya no existe y el backend rechazaría el lote ENTERO con
    // 422, incluidas las celdas buenas.
    confirmar();
    const { result } = montar();
    act(() => result.current.alternarMarca(102, 5));
    act(() => result.current.alternarMarca(102, 6));

    await act(async () => {
      await result.current.eliminarColumna({ id: 5, nombre: "Asistió a la cumbre" });
    });

    expect(result.current.hayCambios).toBe(true);
    expect(result.current.valorDeCelda(102, 6).marcado).toBe(true);
    expect(result.current.valorDeCelda(102, 5).marcado).toBe(false);
  });

  it("recarga la lista después de borrar", async () => {
    confirmar();
    const { result, parametros } = montar();

    await act(async () => {
      await result.current.eliminarColumna({ id: 5, nombre: "Asistió a la cumbre" });
    });

    expect(parametros.recargar).toHaveBeenCalled();
  });

  it("si falla, muestra el mensaje del backend", async () => {
    confirmar();
    eliminarColumnaMock.mockRejectedValue({
      response: { status: 404, data: { detail: "Esa columna ya no existe." } },
    });
    const { result } = montar();

    await act(async () => {
      await result.current.eliminarColumna({ id: 5, nombre: "Asistió a la cumbre" });
    });

    await waitFor(() =>
      expect(swalFireMock).toHaveBeenCalledWith(
        expect.objectContaining({ text: "Esa columna ya no existe." }),
      ),
    );
  });
});

describe("sin curso elegido", () => {
  it("no se puede crear, borrar ni guardar", async () => {
    const { result } = montar({ cursoId: null });

    await act(async () => {
      await result.current.crearColumna("Nueva");
      await result.current.eliminarColumna({ id: 5, nombre: "X" });
      await result.current.guardarCambios();
    });

    expect(crearColumnaMock).not.toHaveBeenCalled();
    expect(eliminarColumnaMock).not.toHaveBeenCalled();
    expect(guardarMarcasMock).not.toHaveBeenCalled();
  });
});

describe("crear columna en todos los cursos", () => {
  const resumen = { creadas: 9, omitidas: 16, total: 25 };

  it("usa el endpoint masivo y no el del curso actual", async () => {
    crearEnTodosMock.mockResolvedValue(resumen);
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("Pagó la excursión", {
        enTodosLosCursos: true,
      });
    });

    expect(crearEnTodosMock).toHaveBeenCalledWith("Pagó la excursión");
    expect(crearColumnaMock).not.toHaveBeenCalled();
  });

  it("un nombre que el curso actual ya tiene SÍ se manda", async () => {
    // Es lo contrario que en el alta suelta, y es el punto de toda la
    // ampliación: escribir un nombre que 1A ya tiene significa "créala en los
    // demás". El backend salta los que ya la tengan.
    crearEnTodosMock.mockResolvedValue(resumen);
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("Compró el libro", {
        enTodosLosCursos: true,
      });
    });

    expect(crearEnTodosMock).toHaveBeenCalledWith("Compró el libro");
  });

  it("pero un nombre vacío o larguísimo se sigue bloqueando", async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("   ", { enTodosLosCursos: true });
      await result.current.crearColumna("A".repeat(101), {
        enTodosLosCursos: true,
      });
    });

    expect(crearEnTodosMock).not.toHaveBeenCalled();
  });

  it("recarga la lista en vez de agregar a mano", async () => {
    // La respuesta son conteos, no la columna de este curso: no hay nada que
    // agregar a la grilla.
    crearEnTodosMock.mockResolvedValue(resumen);
    const { result, parametros } = montar();

    await act(async () => {
      await result.current.crearColumna("Nueva", { enTodosLosCursos: true });
    });

    expect(parametros.recargar).toHaveBeenCalled();
    expect(parametros.setLista).not.toHaveBeenCalled();
  });

  it("avisa con los conteos que devolvió el backend", async () => {
    crearEnTodosMock.mockResolvedValue(resumen);
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("Nueva", { enTodosLosCursos: true });
    });

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        text: "Creada en 9 cursos. 16 ya la tenían.",
      }),
    );
  });

  it("no crear ninguna se anuncia como éxito, no como fallo", async () => {
    crearEnTodosMock.mockResolvedValue({ creadas: 0, omitidas: 25, total: 25 });
    const { result } = montar();

    let creada;
    await act(async () => {
      creada = await result.current.crearColumna("Nueva", {
        enTodosLosCursos: true,
      });
    });

    expect(creada).toBe(true);
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        text: "Todos los cursos ya la tenían (25 cursos).",
      }),
    );
  });

  it("el 409 de la carrera se muestra con el mensaje del backend", async () => {
    crearEnTodosMock.mockRejectedValue({
      response: {
        status: 409,
        data: { detail: "Otra persona estaba creando esa misma columna." },
      },
    });
    const { result } = montar();

    let creada;
    await act(async () => {
      creada = await result.current.crearColumna("Nueva", {
        enTodosLosCursos: true,
      });
    });

    expect(creada).toBe(false);
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Otra persona estaba creando esa misma columna.",
      }),
    );
  });

  it("sin la opción sigue creando solo en el curso actual", async () => {
    crearColumnaMock.mockResolvedValue({ id: 7, nombre: "Nueva" });
    const { result } = montar();

    await act(async () => {
      await result.current.crearColumna("Nueva");
    });

    expect(crearColumnaMock).toHaveBeenCalledWith(12, "Nueva");
    expect(crearEnTodosMock).not.toHaveBeenCalled();
  });
});
