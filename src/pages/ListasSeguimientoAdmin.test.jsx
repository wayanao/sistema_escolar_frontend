import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerCursosMock,
  obtenerListaMock,
  crearColumnaMock,
  crearEnTodosMock,
  eliminarColumnaMock,
  guardarMarcasMock,
  swalFireMock,
} = vi.hoisted(() => ({
  obtenerCursosMock: vi.fn(),
  obtenerListaMock: vi.fn(),
  crearColumnaMock: vi.fn(),
  crearEnTodosMock: vi.fn(),
  eliminarColumnaMock: vi.fn(),
  guardarMarcasMock: vi.fn(),
  swalFireMock: vi.fn(),
}));

vi.mock("../services/listasSeguimientoApi", () => ({
  obtenerCursosListasSeguimiento: obtenerCursosMock,
  obtenerListaSeguimiento: obtenerListaMock,
  crearColumnaEnTodosLosCursos: crearEnTodosMock,
  crearColumnaSeguimiento: crearColumnaMock,
  eliminarColumnaSeguimiento: eliminarColumnaMock,
  guardarMarcasSeguimiento: guardarMarcasMock,
}));

vi.mock("sweetalert2", () => ({
  default: { fire: swalFireMock },
}));

import ListasSeguimientoAdmin from "./ListasSeguimientoAdmin";

const CURSOS = [
  { id: 12, nombre: "1A" },
  { id: 13, nombre: "2B" },
];

const LISTA = {
  curso_id: 12,
  columnas: [{ id: 5, nombre: "Asistió a la cumbre" }],
  estudiantes: [
    { estudiante_id: 101, nombre: "Juan", apellido: "Pérez", marcas: {} },
    {
      estudiante_id: 102,
      nombre: "Ana",
      apellido: "Rojas",
      marcas: { 5: { marcado: true, nota: "Llegó tarde" } },
    },
  ],
};

/**
 * El check de una celda. El `[0]` viene de cuando también se pintaba la
 * tarjeta móvil; desde el 2026-10-07 solo hay tabla y hay un único check.
 */
const checkDe = (nombre) => screen.getAllByRole("checkbox", { name: nombre })[0];

async function elegirCurso(user, valor = "12") {
  await user.selectOptions(screen.getByLabelText("Curso"), valor);
  await waitFor(() =>
    expect(screen.getByRole("columnheader", { name: "Asistió a la cumbre" }))
      .toBeInTheDocument(),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  obtenerCursosMock.mockResolvedValue(CURSOS);
  obtenerListaMock.mockResolvedValue(LISTA);
  guardarMarcasMock.mockResolvedValue({ mensaje: "Cambios guardados", guardadas: 1 });
  swalFireMock.mockResolvedValue({ isConfirmed: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ListasSeguimientoAdmin", () => {
  it("al entrar pide los cursos y espera a que se elija uno", async () => {
    render(<ListasSeguimientoAdmin />);

    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Elige un curso/i)).toBeInTheDocument();
    expect(obtenerListaMock).not.toHaveBeenCalled();
  });

  it("el flujo crítico: elegir curso, marcar una celda y guardar", async () => {
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );

    await elegirCurso(user);

    // Lo guardado se ve desde el principio.
    expect(checkDe("Asistió a la cumbre: Rojas Ana")).toBeChecked();
    expect(checkDe("Asistió a la cumbre: Pérez Juan")).not.toBeChecked();
    expect(screen.getByText("No hay cambios sin guardar.")).toBeInTheDocument();

    await user.click(checkDe("Asistió a la cumbre: Pérez Juan"));

    expect(screen.getByText("1 cambio sin guardar.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(guardarMarcasMock).toHaveBeenCalledWith(12, [
        { columna_id: 5, estudiante_id: 101, marcado: true, nota: "" },
      ]),
    );
    await waitFor(() =>
      expect(screen.getByText("No hay cambios sin guardar.")).toBeInTheDocument(),
    );
  });

  it("tocar la misma celda varias veces manda una sola entrada", async () => {
    // El backend rechaza el lote ENTERO si una celda viene repetida.
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    const check = checkDe("Asistió a la cumbre: Pérez Juan");
    await user.click(check);
    await user.type(
      screen.getAllByLabelText("Nota de Asistió a la cumbre para Pérez Juan")[0],
      "ok",
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(guardarMarcasMock).toHaveBeenCalled());
    const [, payload] = guardarMarcasMock.mock.calls[0];
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ estudiante_id: 101, nota: "ok" });
  });

  it("marcar y desmarcar deja el botón apagado otra vez", async () => {
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    await user.click(checkDe("Asistió a la cumbre: Pérez Juan"));
    await user.click(checkDe("Asistió a la cumbre: Pérez Juan"));

    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });

  it("avisa antes de cambiar de curso con cambios sin guardar", async () => {
    // El hook los descarta a propósito, pero descartarlos en silencio sería
    // una trampa. Preguntar es trabajo de la pantalla.
    swalFireMock.mockResolvedValue({ isConfirmed: false });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);
    await user.click(checkDe("Asistió a la cumbre: Pérez Juan"));

    obtenerListaMock.mockClear();
    await user.selectOptions(screen.getByLabelText("Curso"), "13");

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Tienes cambios sin guardar" }),
    );
    expect(obtenerListaMock).not.toHaveBeenCalled();
    expect(screen.getByText("1 cambio sin guardar.")).toBeInTheDocument();
  });

  it("sin cambios cambia de curso sin preguntar", async () => {
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    swalFireMock.mockClear();
    obtenerListaMock.mockClear();
    await user.selectOptions(screen.getByLabelText("Curso"), "13");

    await waitFor(() => expect(obtenerListaMock).toHaveBeenCalledWith(13, expect.anything()));
    expect(swalFireMock).not.toHaveBeenCalled();
  });

  it("crear una columna la agrega a la grilla", async () => {
    crearColumnaMock.mockResolvedValue({ id: 7, nombre: "Compró el libro" });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    await user.type(screen.getByLabelText("Nueva columna"), "Compró el libro");
    await user.click(screen.getByRole("button", { name: "Agregar columna" }));

    await waitFor(() =>
      expect(crearColumnaMock).toHaveBeenCalledWith(12, "Compró el libro"),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("columnheader", { name: "Compró el libro" }),
      ).toBeInTheDocument(),
    );
  });

  it("un curso sin columnas muestra los alumnos y esconde la barra", async () => {
    obtenerListaMock.mockResolvedValue({ ...LISTA, columnas: [] });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );

    await user.selectOptions(screen.getByLabelText("Curso"), "12");

    await waitFor(() =>
      expect(screen.getByText(/todavía no tiene columnas/i)).toBeInTheDocument(),
    );
    expect(screen.getAllByText("Pérez Juan").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();
  });

  it("un error del backend se anuncia en vez de dejar la pantalla en blanco", async () => {
    obtenerListaMock.mockRejectedValue({
      response: { status: 404, data: { detail: "Ese curso no existe." } },
    });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );

    await user.selectOptions(screen.getByLabelText("Curso"), "12");

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Ese curso no existe."),
    );
  });

  it("borrar una columna la quita y recarga", async () => {
    eliminarColumnaMock.mockResolvedValue({ mensaje: "Columna eliminada" });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    obtenerListaMock.mockResolvedValue({ ...LISTA, columnas: [] });
    await user.click(
      screen.getByRole("button", { name: "Borrar columna Asistió a la cumbre" }),
    );

    await waitFor(() => expect(eliminarColumnaMock).toHaveBeenCalledWith(12, 5));
    await waitFor(() =>
      expect(screen.getByText(/todavía no tiene columnas/i)).toBeInTheDocument(),
    );
  });
});

// Hasta el 2026-11-04 la entrada vivía también, escrita a mano, en el menú
// móvil de NavAdminView. El menú lateral arma PC, tablet y celular con esta
// misma lista: basta con declararla aquí.
describe("la entrada de menú vive en navegacion.js", () => {
  it("navegacion.js la declara en el grupo académico", async () => {
    const { ADMIN_DESKTOP_ITEMS } = await import("../utils/autenticacion/navegacion");
    const academica = ADMIN_DESKTOP_ITEMS.find((item) => item.id === "academica");

    expect(academica.children).toContainEqual({
      id: "listas-seguimiento",
      label: "Listas de Seguimiento",
      to: "/admin/listas-seguimiento",
    });
  });

});

describe("crear una columna en todos los cursos", () => {
  it("la opción viaja de la casilla al servicio sin pasar por la página", async () => {
    // La página no cablea nada nuevo: pasa `crearColumna` tal cual y las
    // opciones fluyen solas. Esta prueba es lo que lo confirma.
    crearEnTodosMock.mockResolvedValue({ creadas: 24, omitidas: 1, total: 25 });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    await user.click(screen.getByRole("checkbox", { name: /todos los cursos/i }));
    await user.type(screen.getByLabelText("Nueva columna"), "Pagó la excursión");
    await user.click(
      screen.getByRole("button", { name: "Agregar en todos los cursos" }),
    );

    await waitFor(() =>
      expect(crearEnTodosMock).toHaveBeenCalledWith("Pagó la excursión"),
    );
    expect(crearColumnaMock).not.toHaveBeenCalled();
  });

  it("un nombre que este curso ya tiene sí se manda", async () => {
    // Con la casilla marcada significa "créala en los demás". Sin ella, la
    // pantalla lo bloquearía.
    crearEnTodosMock.mockResolvedValue({ creadas: 24, omitidas: 1, total: 25 });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    await user.click(screen.getByRole("checkbox", { name: /todos los cursos/i }));
    await user.type(
      screen.getByLabelText("Nueva columna"),
      "Asistió a la cumbre",
    );
    await user.click(
      screen.getByRole("button", { name: "Agregar en todos los cursos" }),
    );

    await waitFor(() =>
      expect(crearEnTodosMock).toHaveBeenCalledWith("Asistió a la cumbre"),
    );
  });

  it("después de crear vuelve a pedir la lista", async () => {
    crearEnTodosMock.mockResolvedValue({ creadas: 24, omitidas: 1, total: 25 });
    const user = userEvent.setup();
    render(<ListasSeguimientoAdmin />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "1A" })).toBeInTheDocument(),
    );
    await elegirCurso(user);

    obtenerListaMock.mockClear();
    await user.click(screen.getByRole("checkbox", { name: /todos los cursos/i }));
    await user.type(screen.getByLabelText("Nueva columna"), "Nueva");
    await user.click(
      screen.getByRole("button", { name: "Agregar en todos los cursos" }),
    );

    await waitFor(() => expect(obtenerListaMock).toHaveBeenCalled());
  });
});
