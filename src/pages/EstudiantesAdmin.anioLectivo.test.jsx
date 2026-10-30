import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Estudiantes mirando un año que no es el activo (paso 4.4 del año lectivo).
// Con el año activo, `EstudiantesAdmin.test.jsx` sigue igual: fuera del
// proveedor, `useAnioLectivo` devuelve el año activo.
const mocks = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
  navigateMock: vi.fn(),
  anioLectivo: null,
  usaEntrevista: true,
}));

vi.mock("../utils/api", () => ({ default: mocks.apiMock }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigateMock,
}));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => mocks.anioLectivo,
}));

import EstudiantesAdmin from "./EstudiantesAdmin";

const { apiMock } = mocks;
const EN_PREPARACION = {
  parametros: { anio_lectivo_id: 2 },
  permisos: { esAnioActivo: false, puedeEditar: true },
  anioSeleccionado: { id: 2, anio: 2027, estado: "preparacion" },
};
const CERRADO = {
  parametros: { anio_lectivo_id: 3 },
  permisos: { esAnioActivo: false, puedeEditar: false },
  anioSeleccionado: { id: 3, anio: 2025, estado: "cerrado" },
};

// Los matriculados de ese año, cada uno con su curso de ese año. Luis se
// retiró después: solo sale filtrando "Todos".
const CURSOS_DEL_ANIO = [{ id: 50, nombre: "PRIMERO A" }];
const ANA = { id: 11, nombre: "Ana", apellido: "Rojas", estado: "activo", curso_id: 50 };
const LUIS = { id: 12, nombre: "Luis", apellido: "Pardo", estado: "retirado", curso_id: 50 };

const controlDe = (contenedor, etiqueta) =>
  within(contenedor)
    .getByText(etiqueta, { selector: "label" })
    .parentElement.querySelector("input, select, textarea");

beforeEach(() => {
  Object.values(apiMock).forEach((mock) => mock.mockReset());
  mocks.usaEntrevista = true;
  apiMock.get.mockImplementation((url, opciones) => {
    // 2026-10-30: si el colegio usa la entrevista de admisión.
    if (url === "/tenant/status") {
      return Promise.resolve({
        data: {
          estado: "activo",
          mostrar_aviso: false,
          mensaje: "",
          usa_entrevista_admision: mocks.usaEntrevista,
        },
      });
    }
    if (url === "/estudiantes") {
      return Promise.resolve({
        data: opciones?.params?.estado === "todos" ? [ANA, LUIS] : [ANA],
      });
    }
    if (url === "/cursos") return Promise.resolve({ data: CURSOS_DEL_ANIO });
    if (url === "/estudiantes/11/detalles") {
      return Promise.resolve({
        data: { promedio_general: 3.8, inasistencias: 5, notas: [], productos_inventario: [] },
      });
    }
    if (url === "/estudiantes/11/deudas") {
      return Promise.resolve({
        data: {
          deudas: [{ concepto: "MENSUALIDAD", deuda: 400000, valor_total: 400000, pagado: 0 }],
          total_deuda: 400000,
          deuda_anios_anteriores: [],
        },
      });
    }
    if (url === "/observador/11") {
      return Promise.resolve({ data: { nivel: "primaria", anotaciones: [] } });
    }
    return Promise.reject(new Error(`GET inesperado: ${url}`));
  });
  apiMock.post.mockResolvedValue({ data: { id: 30, anio_lectivo_id: 2 } });
  localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Estudiantes mirando otro año", () => {
  // Hasta el paso E5 de la entrevista de admisión, aquí había un alta directa
  // en preparación ("Nuevo Estudiante" creaba por POST /anios-lectivos/{id}/
  // estudiantes). Desde el E5, un estudiante nuevo del año en preparación solo
  // entra desde una admisión aprobada (decisión 3 de ENTREVISTA_ADMISION.md).
  it("en preparación solo consulta: un estudiante nuevo entra por Admisiones", async () => {
    mocks.anioLectivo = EN_PREPARACION;

    render(<EstudiantesAdmin />);

    expect(await screen.findByText("Rojas Ana")).toBeInTheDocument();
    // Desde el 2026-10-30 también pregunta si el colegio usa la entrevista.
    expect(
      await screen.findByText(/Un estudiante nuevo de 2027 se matricula desde Admisiones/),
    ).toBeInTheDocument();
    expect(apiMock.get.mock.calls).toEqual([
      ["/estudiantes", { params: { estado: "activo", anio_lectivo_id: 2 } }],
      ["/cursos", { params: { anio_lectivo_id: 2 } }],
      ["/tenant/status"],
    ]);
    // El curso que se ve es el de ese año.
    expect(within(screen.getByText("Rojas Ana").closest("tr")).getByText("PRIMERO A"))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nuevo Estudiante" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ir a admisiones" }));

    expect(mocks.navigateMock).toHaveBeenCalledWith("/admin/anios-lectivos/admisiones");
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
  });

  // 2026-10-30: en un colegio que no usa la entrevista vuelve el alta directa
  // de antes del E5 (prueba recuperada de esa versión).
  it("sin entrevista, en preparación permite solo el alta directa con los cursos de ese año", async () => {
    mocks.anioLectivo = EN_PREPARACION;
    mocks.usaEntrevista = false;

    render(<EstudiantesAdmin />);

    expect(await screen.findByText("Rojas Ana")).toBeInTheDocument();
    // El alta crea los datos globales y solo la matrícula de 2027. Editar o
    // cambiar el estado global sigue prohibido fuera del año activo.
    fireEvent.click(await screen.findByRole("button", { name: "Nuevo Estudiante" }));
    expect(screen.queryByRole("button", { name: "Ir a admisiones" })).not.toBeInTheDocument();
    const formulario = screen.getByText("🎓 Crear Nuevo Estudiante").parentElement;
    fireEvent.change(controlDe(formulario, "Nombre *"), { target: { value: "Carla" } });
    fireEvent.change(controlDe(formulario, "Apellidos *"), { target: { value: "Gómez" } });
    fireEvent.change(controlDe(formulario, "Tipo de Documento *"), {
      target: { value: "Registro Civil" },
    });
    fireEvent.change(controlDe(formulario, "Documento de Identidad *"), {
      target: { value: "2002" },
    });
    fireEvent.change(controlDe(formulario, "Curso *"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear Estudiante" }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledWith(
      "/anios-lectivos/2/estudiantes",
      expect.objectContaining({
        nombre: "Carla",
        apellido: "Gómez",
        documento_identidad: "2002",
        curso_id: "50",
      }),
    ));
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
  });

  it("en un año cerrado no hay aviso de admisiones ni alta", async () => {
    mocks.anioLectivo = CERRADO;

    render(<EstudiantesAdmin />);

    expect(await screen.findByText("Rojas Ana")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ir a admisiones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nuevo Estudiante" })).not.toBeInTheDocument();
  });

  it("en un año cerrado, el filtro de estado sigue pidiendo ese año", async () => {
    mocks.anioLectivo = CERRADO;
    render(<EstudiantesAdmin />);
    await screen.findByText("Rojas Ana");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "todos" } });

    expect(await screen.findByText("Pardo Luis")).toBeInTheDocument();
    expect(apiMock.get.mock.calls.slice(2)).toEqual([
      ["/estudiantes", { params: { estado: "todos", anio_lectivo_id: 3 } }],
      ["/cursos", { params: { anio_lectivo_id: 3 } }],
    ]);
  });

  it("en un año cerrado, la ficha pide el resumen, las deudas y el observador de ese año", async () => {
    mocks.anioLectivo = CERRADO;
    render(<EstudiantesAdmin />);
    fireEvent.click(await screen.findByText("Rojas Ana"));

    expect(await screen.findByText("Resumen de Rojas Ana")).toBeInTheDocument();
    expect(
      await screen.findByText("Todavía nadie le ha escrito nada a este estudiante."),
    ).toBeInTheDocument();
    const conAnio = { params: { anio_lectivo_id: 3 } };
    expect(apiMock.get.mock.calls.slice(2)).toEqual([
      ["/estudiantes/11/detalles", conAnio],
      ["/estudiantes/11/deudas", conAnio],
      ["/observador/11", { ...conAnio, signal: expect.any(AbortSignal) }],
    ]);

    const ficha = screen.getByText("Resumen de Rojas Ana").closest(".bg-white");
    expect(within(ficha).getByText("PRIMERO A")).toBeInTheDocument();
    expect(within(ficha).getByText("MENSUALIDAD")).toBeInTheDocument();
    expect(within(ficha).getAllByText(`$${(400000).toLocaleString()}`)).toHaveLength(2);
  });
});
