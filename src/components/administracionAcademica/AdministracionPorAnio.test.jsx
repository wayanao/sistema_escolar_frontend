import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Cursos, Asignaciones y Horarios mirando un año que no es el activo (paso 4.2
// del año lectivo). Con el año activo, sus pruebas de siempre siguen iguales:
// fuera del proveedor, `useAnioLectivo` devuelve el año activo.
const mocks = vi.hoisted(() => ({
    apiMock: {
        delete: vi.fn(),
        get: vi.fn(),
        patch: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
    anioLectivo: null,
}));

vi.mock("../../utils/api", () => ({
    default: mocks.apiMock,
}));
vi.mock("../../hooks/anioLectivo/useAnioLectivo", () => ({
    default: () => mocks.anioLectivo,
}));

import AsignarClase from "./asignaciones/AsignarClase";
import CrearCurso from "./cursos/CrearCurso";
import HorariosPorCurso from "./horarios/HorariosPorCurso";
import HorariosProfesores from "./horarios/HorariosProfesores";

const { apiMock } = mocks;
const PARAMETROS_2027 = { anio_lectivo_id: 2 };
const EN_PREPARACION = {
    parametros: PARAMETROS_2027,
    permisos: { esAnioActivo: false, puedeEditar: true },
};
const CERRADO = {
    parametros: { anio_lectivo_id: 3 },
    permisos: { esAnioActivo: false, puedeEditar: false },
};

const CURSO_2027 = { id: 50, nombre: "PRIMERO A", jornada: "Mañana", estado: "activo" };
const CLASE_2027 = {
    id: 41,
    curso_id: 50,
    profesor_id: 11,
    materia_id: 31,
    dia: "Lunes",
    hora_inicio: "08:00",
    hora_fin: "09:00",
    profesor_nombre: "ANA RUIZ",
    materia_nombre: "MATEMÁTICAS",
};

function prepararApi({ clases = [] } = {}) {
    apiMock.get.mockImplementation((url) => {
        if (url === "/cursos") return Promise.resolve({ data: [CURSO_2027] });
        if (url === "/profesores") {
            return Promise.resolve({ data: [{ id: 11, nombre: "ANA", apellido: "RUIZ" }] });
        }
        if (url === "/materias") return Promise.resolve({ data: [{ id: 31, nombre: "MATEMÁTICAS" }] });
        if (url === "/asignaciones/lista") return Promise.resolve({ data: clases });
        if (url === "/profesores/11/disponibilidad") return Promise.resolve({ data: { jornadas: [] } });
        if (url === "/hora/horarios-admin") return Promise.resolve({ data: [] });
        return Promise.reject(new Error(`Consulta no simulada: ${url}`));
    });
    apiMock.put.mockResolvedValue({ data: {} });
}

async function seleccionarOpcion(user, nombre, valor) {
    const opcion = screen.getByRole("option", { name: nombre });
    await user.selectOptions(opcion.parentElement, valor);
}

beforeEach(() => {
    Object.values(apiMock).forEach((mock) => mock.mockReset());
    vi.spyOn(window, "alert").mockImplementation(() => {});
    window.scrollTo = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Cursos mirando otro año", () => {
    it("en preparación pide los cursos de ese año, no ofrece crear y deja editar", async () => {
        mocks.anioLectivo = EN_PREPARACION;
        prepararApi();
        const user = userEvent.setup();

        render(<CrearCurso />);

        expect(await screen.findByText("PRIMERO A")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
            params: { estado: "activo", anio_lectivo_id: 2 },
            signal: expect.any(AbortSignal),
        });
        // Un curso nuevo nacería en el año activo: mirando otro año no se crea.
        expect(screen.queryByRole("button", { name: "Crear Curso" })).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Editar" }));
        await user.click(screen.getByRole("button", { name: "Actualizar Curso" }));

        await waitFor(() => expect(apiMock.put).toHaveBeenCalledWith(
            "/cursos/50",
            expect.objectContaining({ nombre: "PRIMERO A" }),
        ));
    });

    it("en un año cerrado solo se consulta: sin formulario y sin acciones", async () => {
        mocks.anioLectivo = CERRADO;
        prepararApi();

        render(<CrearCurso />);

        expect(await screen.findByText("PRIMERO A")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Crear Curso" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
    });
});

describe("Asignaciones mirando otro año", () => {
    it("en preparación pide cursos, clases y disponibilidad de ese año, y deja asignar", async () => {
        mocks.anioLectivo = EN_PREPARACION;
        prepararApi();
        const user = userEvent.setup();

        render(<AsignarClase />);
        await screen.findByRole("option", { name: "PRIMERO A (Mañana)" });

        const conAnio = { params: PARAMETROS_2027, signal: expect.any(AbortSignal) };
        const sinAnio = { signal: expect.any(AbortSignal) };
        expect(apiMock.get).toHaveBeenCalledWith("/cursos", conAnio);
        expect(apiMock.get).toHaveBeenCalledWith("/asignaciones/lista", conAnio);
        expect(apiMock.get).toHaveBeenCalledWith("/profesores", sinAnio);
        expect(apiMock.get).toHaveBeenCalledWith("/materias", sinAnio);

        await seleccionarOpcion(user, "PRIMERO A (Mañana)", "50");
        await seleccionarOpcion(user, "ANA RUIZ", "11");
        await seleccionarOpcion(user, "Lunes", "Lunes");

        await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith(
            "/profesores/11/disponibilidad",
            { params: { dia: "Lunes", anio_lectivo_id: 2 }, signal: expect.any(AbortSignal) },
        ));
        expect(screen.getByRole("button", { name: "Asignar clase" })).toBeInTheDocument();
    });

    it("en un año cerrado muestra el horario sin formulario, sin Editar y sin Desactivar", async () => {
        mocks.anioLectivo = CERRADO;
        prepararApi({ clases: [CLASE_2027] });
        const user = userEvent.setup();

        render(<AsignarClase />);
        await screen.findByRole("option", { name: "PRIMERO A (Mañana)" });
        await seleccionarOpcion(user, "PRIMERO A (Mañana)", "50");

        expect(screen.getByText("MATEMÁTICAS", { selector: "div" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Asignar clase" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
    });
});

describe("Horarios mirando otro año", () => {
    const horariosDelAnio = { params: PARAMETROS_2027, signal: expect.any(AbortSignal) };

    it("los horarios por curso son los de ese año", async () => {
        mocks.anioLectivo = EN_PREPARACION;
        prepararApi();

        render(<HorariosPorCurso />);

        await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith(
            "/hora/horarios-admin",
            horariosDelAnio,
        ));
    });

    it("los horarios por profesor son los de ese año", async () => {
        mocks.anioLectivo = EN_PREPARACION;
        prepararApi();

        render(<HorariosProfesores />);

        await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith(
            "/hora/horarios-admin",
            horariosDelAnio,
        ));
    });
});
