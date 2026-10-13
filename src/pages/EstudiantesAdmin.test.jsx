import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearEstudianteInicial } from "../utils/estudiantesObservador/estudiantes";

// Caracterización de la página de Estudiantes del admin (año lectivo, paso
// 4.4): fija las peticiones y lo que se ve hoy, antes de conectarla al año.
const { apiMock, navigateMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
  navigateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

import EstudiantesAdmin from "./EstudiantesAdmin";

const CURSOS = [
  { id: 4, nombre: "5A" },
  { id: 5, nombre: "6B" },
];
const ANA = { id: 11, nombre: "Ana", apellido: "Rojas", estado: "activo", curso_id: 4 };
const LUIS = { id: 12, nombre: "Luis", apellido: "Pardo", estado: "activo", curso_id: 5 };
const SARA = { id: 20, nombre: "Sara", apellido: "Díaz", estado: "retirado", curso_id: 4 };
const ANA_COMPLETA = {
  ...crearEstudianteInicial(),
  ...ANA,
  tipo_documento: "Tarjeta de Identidad",
  documento_identidad: "1001",
  email: null,
};
const DEUDAS_ANA = {
  deudas: [{ concepto: "MENSUALIDAD", deuda: 200000, valor_total: 200000, pagado: 0 }],
  total_deuda: 200000,
  deuda_anios_anteriores: [],
};

function prepararApi() {
  apiMock.get.mockImplementation((url, opciones) => {
    if (url === "/estudiantes") {
      const estado = opciones?.params?.estado;
      return Promise.resolve({ data: estado === "retirado" ? [SARA] : [ANA, LUIS] });
    }
    if (url === "/cursos") return Promise.resolve({ data: CURSOS });
    if (url === "/estudiantes/11") return Promise.resolve({ data: ANA_COMPLETA });
    if (url === "/estudiantes/11/detalles") {
      return Promise.resolve({
        data: {
          promedio_general: 4.2,
          inasistencias: 3,
          notas: [{ materia: "MATEMÁTICAS", promedio: 4.2 }],
          productos_inventario: [],
        },
      });
    }
    if (url === "/estudiantes/11/deudas") return Promise.resolve({ data: DEUDAS_ANA });
    if (url === "/observador/11") {
      return Promise.resolve({ data: { nivel: "primaria", anotaciones: [] } });
    }
    return Promise.reject(new Error(`GET inesperado: ${url}`));
  });
  apiMock.post.mockResolvedValue({ data: { id: 30 } });
  apiMock.put.mockResolvedValue({ data: { id: 11 } });
  apiMock.patch.mockResolvedValue({ data: { estado: "retirado" } });
}

const controlDe = (contenedor, etiqueta) =>
  within(contenedor)
    .getByText(etiqueta, { selector: "label" })
    .parentElement.querySelector("input, select, textarea");

const filaDe = (nombre) => screen.getByText(nombre).closest("tr");

beforeEach(() => {
  Object.values(apiMock).forEach((mock) => mock.mockReset());
  navigateMock.mockReset();
  prepararApi();
  localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("EstudiantesAdmin", () => {
  it("carga los activos y los cursos con las peticiones de siempre", async () => {
    render(<EstudiantesAdmin />);

    expect(await screen.findByText("Rojas Ana")).toBeInTheDocument();
    expect(apiMock.get.mock.calls).toEqual([
      ["/estudiantes", { params: { estado: "activo" } }],
      ["/cursos"],
    ]);
    expect(within(filaDe("Rojas Ana")).getByText("5A")).toBeInTheDocument();
    expect(within(filaDe("Pardo Luis")).getByText("6B")).toBeInTheDocument();
    expect(screen.getByText("Lista de Estudiantes (2)")).toBeInTheDocument();

    // Hoy, todas las acciones del admin están a la vista.
    expect(screen.getByRole("button", { name: "Nuevo Estudiante" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(2);
    expect(within(filaDe("Rojas Ana")).getByRole("combobox")).toHaveValue("activo");
  });

  it("cambiar el filtro de estado vuelve a pedir la lista con ese estado", async () => {
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "retirado" } });

    expect(await screen.findByText("Díaz Sara")).toBeInTheDocument();
    expect(apiMock.get.mock.calls.slice(2)).toEqual([
      ["/estudiantes", { params: { estado: "retirado" } }],
      ["/cursos"],
    ]);
  });

  it("la ficha pide el resumen, las deudas y el observador, y los muestra", async () => {
    render(<EstudiantesAdmin />);
    fireEvent.click(await screen.findByText("Rojas Ana"));

    expect(await screen.findByText("Resumen de Rojas Ana")).toBeInTheDocument();
    expect(
      await screen.findByText("Todavía nadie le ha escrito nada a este estudiante."),
    ).toBeInTheDocument();
    expect(apiMock.get.mock.calls.slice(2)).toEqual([
      ["/estudiantes/11/detalles"],
      ["/estudiantes/11/deudas"],
      ["/observador/11", { signal: expect.any(AbortSignal) }],
    ]);

    const ficha = screen.getByText("Resumen de Rojas Ana").closest(".bg-white");
    expect(within(ficha).getByText("5A")).toBeInTheDocument();
    expect(within(ficha).getByText("MATEMÁTICAS")).toBeInTheDocument();
    expect(within(ficha).getByText("MENSUALIDAD")).toBeInTheDocument();
    expect(within(ficha).getByText("Deuda Total:")).toBeInTheDocument();
    expect(within(ficha).getAllByText(`$${(200000).toLocaleString()}`)).toHaveLength(2);
  });

  it("editar carga al estudiante, guarda con PUT y recarga la lista", async () => {
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.click(within(filaDe("Rojas Ana")).getByRole("button", { name: "Editar" }));
    expect(await screen.findByText("✏️ Editar Estudiante")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes/11");

    fireEvent.click(screen.getByRole("button", { name: "Actualizar Estudiante" }));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledTimes(1));
    const [url, payload] = apiMock.put.mock.calls[0];
    expect(url).toBe("/estudiantes/11");
    expect(payload).toMatchObject({
      nombre: "Ana",
      apellido: "Rojas",
      documento_identidad: "1001",
      curso_id: 4,
      email: null,
    });
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("estado");
    expect(window.alert).toHaveBeenCalledWith("Estudiante actualizado correctamente");
    await waitFor(() => expect(
      apiMock.get.mock.calls.filter(([ruta]) => ruta === "/estudiantes"),
    ).toHaveLength(2));
  });

  it("mientras guarda, el botón dice Guardando... y no se puede pulsar otra vez", async () => {
    let resolver;
    apiMock.put.mockReturnValue(new Promise((resolve) => {
      resolver = resolve;
    }));
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");
    fireEvent.click(within(filaDe("Rojas Ana")).getByRole("button", { name: "Editar" }));
    await screen.findByText("✏️ Editar Estudiante");

    fireEvent.click(screen.getByRole("button", { name: "Actualizar Estudiante" }));

    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled();
    resolver({ data: { id: 11 } });
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Estudiante actualizado correctamente"),
    );
    expect(apiMock.put).toHaveBeenCalledTimes(1);
  });

  it("Nuevo Estudiante ofrece los cursos de la lista y crea con POST", async () => {
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.click(screen.getByRole("button", { name: "Nuevo Estudiante" }));
    const formulario = screen.getByText("🎓 Crear Nuevo Estudiante").parentElement;
    const selectorCurso = controlDe(formulario, "Curso *");
    expect(Array.from(selectorCurso.options).map((opcion) => opcion.textContent)).toEqual([
      "Seleccionar curso",
      "5A",
      "6B",
    ]);

    fireEvent.change(controlDe(formulario, "Nombre *"), { target: { value: "Carla" } });
    fireEvent.change(controlDe(formulario, "Apellidos *"), { target: { value: "Gómez" } });
    fireEvent.change(controlDe(formulario, "Tipo de Documento *"), {
      target: { value: "Registro Civil" },
    });
    fireEvent.change(controlDe(formulario, "Documento de Identidad *"), {
      target: { value: "2002" },
    });
    fireEvent.change(selectorCurso, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear Estudiante" }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post.mock.calls[0][0]).toBe("/estudiantes");
    expect(apiMock.post.mock.calls[0][1]).toMatchObject({
      nombre: "Carla",
      apellido: "Gómez",
      documento_identidad: "2002",
      curso_id: "4",
    });
    expect(window.alert).toHaveBeenCalledWith("Estudiante creado correctamente");
  });

  it("cambiar el estado desde la fila pide confirmación y guarda con PATCH", async () => {
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.change(within(filaDe("Rojas Ana")).getByRole("combobox"), {
      target: { value: "retirado" },
    });

    await waitFor(() => expect(apiMock.patch).toHaveBeenCalledWith(
      "/estudiantes/11/estado",
      { estado: "retirado" },
    ));
    expect(window.confirm).toHaveBeenCalledWith("¿Deseas marcar como retirado a Ana Rojas?");
    // Mirando los activos, quien pasa a retirado sale de la lista.
    await waitFor(() => expect(screen.queryByText("Rojas Ana")).not.toBeInTheDocument());
    expect(screen.getByText("Pardo Luis")).toBeInTheDocument();
  });

  it("si quien entra no es admin, vuelve al inicio de sesión sin pedir nada", () => {
    localStorage.setItem("usuario", JSON.stringify({ id: 7, rol: "profesor" }));

    render(<EstudiantesAdmin />);

    expect(navigateMock).toHaveBeenCalledWith("/login");
    expect(apiMock.get).not.toHaveBeenCalled();
  });
});
