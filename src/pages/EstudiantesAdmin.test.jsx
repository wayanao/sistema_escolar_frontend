import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    // Paso E11b: Ana no entró por una admisión.
    if (url === "/estudiantes/11/admision") {
      return Promise.resolve({
        data: { admision_id: null, anio: null, fecha_entrevista: null, cuestionario: {} },
      });
    }
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
      // Sin los campos en pantalla, el alta sigue enviando los descuentos en
      // 0, como siempre: el cuerpo no cambia.
      descuento_matricula: 0,
      descuento_mensualidad: 0,
    });
    expect(window.alert).toHaveBeenCalledWith("Estudiante creado correctamente");
  });

  it("editar conserva un descuento ya guardado aunque no se vea en el formulario", async () => {
    const getOriginal = apiMock.get.getMockImplementation();
    apiMock.get.mockImplementation((url, opciones) =>
      url === "/estudiantes/11"
        ? Promise.resolve({ data: { ...ANA_COMPLETA, descuento_mensualidad: 50000 } })
        : getOriginal(url, opciones),
    );
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.click(within(filaDe("Rojas Ana")).getByRole("button", { name: "Editar" }));
    await screen.findByText("✏️ Editar Estudiante");
    fireEvent.click(screen.getByRole("button", { name: "Actualizar Estudiante" }));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledTimes(1));
    expect(apiMock.put.mock.calls[0][1]).toMatchObject({ descuento_mensualidad: 50000 });
  });

  // Paso E6 de la entrevista de admisión: estudios anteriores y ocupación de
  // los padres salieron del formulario, pero editar devuelve lo que ya tenía.
  it("editar conserva los datos de admisión aunque el formulario no los muestre", async () => {
    const getOriginal = apiMock.get.getMockImplementation();
    apiMock.get.mockImplementation((url, opciones) =>
      url === "/estudiantes/11"
        ? Promise.resolve({
            data: { ...ANA_COMPLETA, colegio_anterior: "Colegio Uno", ocupacion_padre: "Médico" },
          })
        : getOriginal(url, opciones),
    );
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.click(within(filaDe("Rojas Ana")).getByRole("button", { name: "Editar" }));
    await screen.findByText("✏️ Editar Estudiante");
    expect(screen.queryByText("Nombre Colegio Anterior")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actualizar Estudiante" }));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledTimes(1));
    expect(apiMock.put.mock.calls[0][1]).toMatchObject({
      colegio_anterior: "Colegio Uno",
      ocupacion_padre: "Médico",
    });
  });

  // Ajustada a propósito en el paso E11b: ahora son dos peticiones (la ficha
  // y su admisión), y la lista de preguntas solo si hay respuestas.
  it("la ficha muestra los datos de admisión solo si se piden (dos peticiones más)", async () => {
    const getOriginal = apiMock.get.getMockImplementation();
    apiMock.get.mockImplementation((url, opciones) =>
      url === "/estudiantes/11"
        ? Promise.resolve({ data: { ...ANA_COMPLETA, colegio_anterior: "Colegio Uno" } })
        : getOriginal(url, opciones),
    );
    render(<EstudiantesAdmin />);
    fireEvent.click(await screen.findByText("Rojas Ana"));
    await screen.findByText("Resumen de Rojas Ana");
    expect(apiMock.get).not.toHaveBeenCalledWith("/estudiantes/11");

    fireEvent.click(await screen.findByRole("button", { name: "Ver datos de admisión" }));

    expect(await screen.findByText("Colegio Uno")).toBeInTheDocument();
    expect(await screen.findByText("Sin entrevista de admisión.")).toBeInTheDocument();
    expect(apiMock.get.mock.calls.filter(([url]) => url === "/estudiantes/11")).toHaveLength(1);
    expect(
      apiMock.get.mock.calls.filter(([url]) => url === "/estudiantes/11/admision"),
    ).toHaveLength(1);
    expect(apiMock.get).not.toHaveBeenCalledWith("/admisiones/cuestionario");
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

// Crear y editar dicen qué pasa y llevan la pantalla a lo que cambió (pedido
// del usuario el 2026-10-21: "auto scroll al crear un nuevo estudiante y que
// muestre la espera de creando").
describe("EstudiantesAdmin: espera al crear y pantalla que se mueve sola", () => {
  const CARLA = { id: 30, nombre: "Carla", apellido: "Gómez", estado: "activo", curso_id: 4 };

  beforeEach(() => {
    // JSDOM no trae matchMedia ni scrollIntoView; se simulan solo aquí.
    window.matchMedia = vi.fn(() => ({ matches: false }));
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    delete window.matchMedia;
    delete Element.prototype.scrollIntoView;
  });

  const fichaNueva = () => screen.getByText("🎓 Crear Nuevo Estudiante").parentElement;

  const llenarAlta = () => {
    const formulario = fichaNueva();
    fireEvent.change(controlDe(formulario, "Nombre *"), { target: { value: "Carla" } });
    fireEvent.change(controlDe(formulario, "Apellidos *"), { target: { value: "Gómez" } });
    fireEvent.change(controlDe(formulario, "Tipo de Documento *"), {
      target: { value: "Registro Civil" },
    });
    fireEvent.change(controlDe(formulario, "Documento de Identidad *"), {
      target: { value: "2002" },
    });
    fireEvent.change(controlDe(formulario, "Curso *"), { target: { value: "4" } });
  };

  it("Nuevo Estudiante lleva la ficha a la vista y le pasa el foco a su título", async () => {
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.click(screen.getByRole("button", { name: "Nuevo Estudiante" }));

    const titulo = screen.getByRole("heading", { name: "🎓 Crear Nuevo Estudiante" });
    expect(titulo).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    const [ficha] = Element.prototype.scrollIntoView.mock.contexts;
    expect(ficha).toContainElement(titulo);
  });

  it("mientras crea, el botón dice Creando estudiante... con el círculo y no deja cancelar", async () => {
    let responder;
    apiMock.post.mockReturnValue(
      new Promise((resolve) => {
        responder = () => resolve({ data: { id: 30 } });
      }),
    );
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo Estudiante" }));
    llenarAlta();

    fireEvent.click(screen.getByRole("button", { name: "Crear Estudiante" }));

    const boton = await screen.findByRole("button", { name: "Creando estudiante..." });
    expect(boton).toBeDisabled();
    expect(within(fichaNueva()).getByTestId("spinner")).toBeInTheDocument();
    expect(within(fichaNueva()).getByRole("button", { name: "Cancelar" })).toBeDisabled();
    fireEvent.click(boton);
    expect(apiMock.post).toHaveBeenCalledTimes(1);

    await act(async () => {
      responder();
    });
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Estudiante creado correctamente"),
    );
  });

  it("después de crear no esconde la página y baja al estudiante nuevo, resaltado", async () => {
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo Estudiante" }));
    llenarAlta();

    let terminarRecarga;
    const getOriginal = apiMock.get.getMockImplementation();
    apiMock.get.mockImplementation((url, opciones) => {
      if (url === "/estudiantes") {
        return new Promise((resolve) => {
          terminarRecarga = () => resolve({ data: [ANA, LUIS, CARLA] });
        });
      }
      return getOriginal(url, opciones);
    });
    Element.prototype.scrollIntoView.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Crear Estudiante" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Estudiante creado correctamente"),
    );
    // Mientras vuelve a pedir la lista, la página sigue a la vista.
    expect(await screen.findByText("Actualizando...")).toBeInTheDocument();
    expect(screen.getByText("Gestión de Estudiantes")).toBeInTheDocument();
    expect(screen.getByText("Rojas Ana")).toBeInTheDocument();

    await act(async () => {
      terminarRecarga();
    });

    const filaCarla = (await screen.findByText("Gómez Carla")).closest("tr");
    expect(filaCarla).toHaveClass("bg-green-50");
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      }),
    );
    expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)).toBe(filaCarla);
  });

  it("Editar sube a la ficha con su título enfocado y, al guardar, vuelve a la fila", async () => {
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.click(within(filaDe("Rojas Ana")).getByRole("button", { name: "Editar" }));

    const titulo = await screen.findByRole("heading", { name: "✏️ Editar Estudiante" });
    await waitFor(() => expect(titulo).toHaveFocus());
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });

    Element.prototype.scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Actualizar Estudiante" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Estudiante actualizado correctamente"),
    );
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      }),
    );
    expect(filaDe("Rojas Ana")).toHaveClass("bg-green-50");
  });
});
