import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardProfesor from "./DashboardProfesor";

const { apiMock, navigateMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    navigateMock: vi.fn(),
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
    Navigate: ({ to }) => <div data-testid="redirect" data-to={to} />,
}));

const PROFESOR_ID = 7;

// La segunda fila repite la asignación 10 en otro día: el selector la deduplica
// por curso y materia, pero el horario semanal sí pinta las dos franjas.
const clases = [
    { id: 10, horario_id: 501, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
    { id: 10, horario_id: 502, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Miércoles", hora_inicio: "09:00", hora_fin: "10:00" },
    { id: 11, horario_id: 503, materia: "Español", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Martes", hora_inicio: "08:00", hora_fin: "09:00" },
    { id: 12, horario_id: 504, materia: "Sociales", curso: "6B", curso_id: 200, jornada: "Tarde", dia: "Jueves", hora_inicio: "13:00", hora_fin: "14:00" },
];

const inasistencias = [
    { curso_id: 100, estudiante_id: 1, posicion: 1, nombre: "Ana Arias", curso: "5A", total_fallas: 9 },
    { curso_id: 100, estudiante_id: 2, posicion: 2, nombre: "Beto Bravo", curso: "5A", total_fallas: 4 },
];

const notasBajas = [
    { nombre: "Ana Arias", promedio: 2.345, curso: "5A", materia: "Matemáticas", color: "red" },
];

const notasAltas = [
    { nombre: "Zoe Zapata", promedio: 4.876, curso: "5A", materia: "Matemáticas" },
];

const iniciarSesionProfesor = () => {
    localStorage.setItem(
        "profesor",
        JSON.stringify({ id: PROFESOR_ID, nombre: "ana maría", apellido: "Arias" }),
    );
};

const responder = ({
    clasesResueltas = clases,
    inasistenciasResueltas = inasistencias,
    cumpleanosResueltos = [],
} = {}) => {
    apiMock.get.mockImplementation((url) => {
        if (url === `/mis-clases/${PROFESOR_ID}`) return Promise.resolve({ data: clasesResueltas });
        if (url === `/dashboard/inasistencias/${PROFESOR_ID}`) {
            return Promise.resolve({ data: inasistenciasResueltas });
        }
        if (url === `/dashboard/cumpleanos/profesor/${PROFESOR_ID}`) {
            return Promise.resolve({ data: cumpleanosResueltos });
        }
        if (url === `/dashboard/notas-bajas/${PROFESOR_ID}`) return Promise.resolve({ data: notasBajas });
        if (url === `/dashboard/notas-altas/${PROFESOR_ID}`) return Promise.resolve({ data: notasAltas });
        throw new Error(`GET inesperado: ${url}`);
    });
};

const selectCurso = () => within(screen.getByText("Curso").closest("div")).getByRole("combobox");
const selectMateria = () => within(screen.getByText("Materia").closest("div")).getByRole("combobox");

// Las clases ya cargaron cuando el filtro de rendimiento ofrece sus cursos.
const esperarClasesCargadas = () =>
    screen.findByRole("option", { name: "5A - Mañana" });

const esperarRendimiento = () =>
    waitFor(() => {
        expect(apiMock.get).toHaveBeenCalledWith(`/dashboard/notas-bajas/${PROFESOR_ID}`, {
            params: { curso_id: "100" },
        });
    });

const llamadasA = (url) => apiMock.get.mock.calls.filter(([ruta]) => ruta === url);

describe("DashboardProfesor", () => {
    beforeEach(() => {
        localStorage.clear();
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        vi.spyOn(console, "error").mockImplementation(() => {});
        responder();
    });

    it("redirige a login y no consulta nada cuando no hay profesor", () => {
        render(<DashboardProfesor />);

        // Redirect del router, sin recargar la aplicación.
        expect(screen.getByTestId("redirect")).toHaveAttribute("data-to", "/login");
        expect(apiMock.get).not.toHaveBeenCalled();
    });

    it("carga las tres secciones del profesor al montar", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);

        await esperarClasesCargadas();
        expect(apiMock.get).toHaveBeenCalledWith(`/mis-clases/${PROFESOR_ID}`);
        expect(apiMock.get).toHaveBeenCalledWith(`/dashboard/inasistencias/${PROFESOR_ID}`);
        expect(apiMock.get).toHaveBeenCalledWith(`/dashboard/cumpleanos/profesor/${PROFESOR_ID}`, {
            params: { dias: 7 },
        });
    });

    it("saluda con el primer nombre capitalizado", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);

        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana" })).toBeInTheDocument();
        expect(screen.getByText("Panel del profesor")).toBeInTheDocument();
        await esperarClasesCargadas();
    });

    it("selecciona el primer curso y consulta el rendimiento sin materia", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarRendimiento();

        expect(apiMock.get).toHaveBeenCalledWith(`/dashboard/notas-altas/${PROFESOR_ID}`, {
            params: { curso_id: "100" },
        });
        expect(selectCurso()).toHaveValue("100");
        expect(selectMateria()).toHaveValue("todas");
        // La opción del selector de curso más las insignias de las dos tarjetas.
        expect(screen.getAllByText("5A - Mañana")).toHaveLength(3);
        expect(screen.getAllByText("Todas las materias")).toHaveLength(2);
    });

    it("agrega la asignación cuando se elige una materia concreta", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarRendimiento();

        fireEvent.change(selectMateria(), { target: { value: "10" } });

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith(`/dashboard/notas-bajas/${PROFESOR_ID}`, {
                params: { curso_id: "100", asignacion_id: "10" },
            });
        });
        expect(apiMock.get).toHaveBeenCalledWith(`/dashboard/notas-altas/${PROFESOR_ID}`, {
            params: { curso_id: "100", asignacion_id: "10" },
        });
    });

    it("limita las materias al curso elegido y vuelve a todas al cambiarlo", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarRendimiento();

        expect(
            within(selectMateria())
                .getAllByRole("option")
                .map((opcion) => opcion.textContent),
        ).toEqual(["Todas las materias del curso", "Español", "Matemáticas"]);

        fireEvent.change(selectMateria(), { target: { value: "10" } });
        fireEvent.change(selectCurso(), { target: { value: "200" } });

        expect(selectMateria()).toHaveValue("todas");
        expect(
            within(selectMateria())
                .getAllByRole("option")
                .map((opcion) => opcion.textContent),
        ).toEqual(["Todas las materias del curso", "Sociales"]);
    });

    it("lista las inasistencias con posición y total de fallas", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);

        expect(await screen.findByText("Ana Arias")).toBeInTheDocument();
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("9")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("envuelve en lista la inasistencia devuelta como objeto", async () => {
        iniciarSesionProfesor();
        responder({ inasistenciasResueltas: inasistencias[0] });

        render(<DashboardProfesor />);

        expect(await screen.findByText("#1")).toBeInTheDocument();
        expect(screen.queryByText("#2")).not.toBeInTheDocument();
    });

    it("pinta los promedios de rendimiento con dos decimales", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarRendimiento();

        expect(await screen.findByText("2.35")).toBeInTheDocument();
        expect(screen.getByText("4.88")).toBeInTheDocument();
        expect(screen.getByText("Zoe Zapata")).toBeInTheDocument();
    });

    it("conserva las demás secciones cuando falla una consulta", async () => {
        iniciarSesionProfesor();
        apiMock.get.mockImplementation((url) => {
            if (url === `/mis-clases/${PROFESOR_ID}`) return Promise.resolve({ data: clases });
            if (url === `/dashboard/inasistencias/${PROFESOR_ID}`) return Promise.reject(new Error("500"));
            if (url === `/dashboard/cumpleanos/profesor/${PROFESOR_ID}`) return Promise.reject(new Error("500"));
            if (url === `/dashboard/notas-bajas/${PROFESOR_ID}`) return Promise.resolve({ data: notasBajas });
            if (url === `/dashboard/notas-altas/${PROFESOR_ID}`) return Promise.resolve({ data: notasAltas });
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        expect(
            await screen.findByText("No se pudieron cargar los cumpleaños de la semana."),
        ).toBeInTheDocument();
        // El fallo de inasistencias se distingue de la ausencia de datos.
        expect(screen.getByText("No se pudieron cargar las inasistencias.")).toBeInTheDocument();
        expect(screen.queryByText("No hay datos disponibles")).not.toBeInTheDocument();
        expect(await screen.findByText("2.35")).toBeInTheDocument();
    });

    it("no consulta el rendimiento cuando el profesor no tiene cursos", async () => {
        iniciarSesionProfesor();
        responder({ clasesResueltas: [] });

        render(<DashboardProfesor />);

        expect(await screen.findByText("No tienes clases con horario asignado todavía.")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Sin cursos asignados" })).toBeInTheDocument();
        expect(llamadasA(`/dashboard/notas-bajas/${PROFESOR_ID}`)).toHaveLength(0);
        expect(llamadasA(`/dashboard/notas-altas/${PROFESOR_ID}`)).toHaveLength(0);
    });

    it("ya no tiene la tarjeta de clase ni las planeaciones recientes, y no toca la clase guardada", async () => {
        iniciarSesionProfesor();
        localStorage.setItem("asignacionId", "999");

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        expect(screen.queryByText("¿Con qué clase vas a trabajar?")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Clase / grupo")).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Planeaciones recientes/)).not.toBeInTheDocument();
        expect(apiMock.get.mock.calls.some(([url]) => url.startsWith("/plan-de-clases/"))).toBe(false);
        expect(localStorage.getItem("asignacionId")).toBe("999");
    });

    it("abre los rankings aunque no haya clase elegida: allí se elige", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        const [rankingBajo, rankingAlto] = screen.getAllByRole("button", {
            name: "Ver ranking por clase",
        });

        fireEvent.click(rankingBajo);
        expect(swalFireMock).not.toHaveBeenCalled();
        expect(navigateMock).toHaveBeenCalledWith("/ranking-rendimiento");

        fireEvent.click(rankingAlto);
        expect(navigateMock).toHaveBeenCalledWith("/ranking-mejor-rendimiento");
    });

    it("pasa a cumpleaños el texto vacío propio del profesor", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);

        expect(
            await screen.findByText("Esta semana no hay cumpleaños en tus cursos."),
        ).toBeInTheDocument();
    });
});

// El horario muestra un día a la vez y entra a la clase (2026-11-10). La
// hora se fija para no depender del día en que corran las pruebas.
describe("DashboardProfesor: horario en tarjetas", () => {
    const LUNES_7_30 = new Date("2026-11-09T12:30:00Z");

    beforeEach(() => {
        localStorage.clear();
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        vi.spyOn(console, "error").mockImplementation(() => {});
        navigateMock.mockClear();
        responder();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const abrirEl = async (fecha) => {
        vi.useFakeTimers({ now: fecha, shouldAdvanceTime: true });
        iniciarSesionProfesor();
        render(<DashboardProfesor />);
        await esperarClasesCargadas();
    };

    it("al entrar muestra hoy, marca la clase en curso y entra directo a ella", async () => {
        await abrirEl(LUNES_7_30);

        expect(screen.getByRole("heading", { name: "Tus clases de hoy" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Lunes, hoy: 1 clase" })).toHaveAttribute("aria-selected", "true");
        const tarjeta = screen.getByRole("article", { name: /Matemáticas, curso 5A/ });
        expect(within(tarjeta).getByText("7:00 AM – 8:00 AM")).toBeInTheDocument();
        expect(within(tarjeta).getByText("Ahora")).toBeInTheDocument();

        fireEvent.click(within(tarjeta).getByRole("button", { name: "Tomar asistencia" }));
        expect(localStorage.getItem("asignacionId")).toBe("10");
        expect(navigateMock).toHaveBeenLastCalledWith("/asistencia");

        fireEvent.click(within(tarjeta).getByRole("button", { name: "Planilla" }));
        expect(navigateMock).toHaveBeenLastCalledWith("/planilla");
    });

    it("cambiar de día muestra sus clases, con la jornada cuando el profesor tiene las dos", async () => {
        await abrirEl(LUNES_7_30);

        fireEvent.click(screen.getByRole("tab", { name: "Jueves: 1 clase" }));

        expect(screen.getByRole("heading", { name: "Tus clases del jueves" })).toBeInTheDocument();
        expect(screen.getByRole("article", { name: /Sociales, curso 6B/ })).toBeInTheDocument();
        expect(screen.getByText("Jornada tarde")).toBeInTheDocument();
        // Otro día no marca «Ahora» ni «Siguiente».
        expect(screen.queryByText("Ahora")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("tab", { name: "Viernes: 0 clases" }));
        expect(screen.getByText("No tienes clases el viernes")).toBeInTheDocument();
    });

    it("con una sola jornada no pone títulos de jornada", async () => {
        responder({
            clasesResueltas: [
                { id: 20, horario_id: 601, materia: "Arte", curso: "7C", curso_id: 300, jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
            ],
        });
        vi.useFakeTimers({ now: LUNES_7_30, shouldAdvanceTime: true });
        iniciarSesionProfesor();
        render(<DashboardProfesor />);
        await screen.findByRole("option", { name: "7C - Mañana" });

        expect(screen.getByRole("article", { name: /Arte, curso 7C/ })).toBeInTheDocument();
        expect(screen.queryByText(/^Jornada /)).not.toBeInTheDocument();
    });

    it("en la tarde la jornada de la tarde va primero y la clase de la mañana sale como «Ya se dio»", async () => {
        responder({
            clasesResueltas: [
                { id: 10, horario_id: 501, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
                { id: 12, horario_id: 504, materia: "Sociales", curso: "6B", curso_id: 200, jornada: "Tarde", dia: "Lunes", hora_inicio: "13:00", hora_fin: "14:00" },
            ],
        });
        // Lunes 1:30 p. m. en Colombia.
        await abrirEl(new Date("2026-11-09T18:30:00Z"));

        const titulos = screen.getAllByText(/^Jornada (mañana|tarde)$/).map((nodo) => nodo.textContent);
        expect(titulos).toEqual(["Jornada tarde", "Jornada mañana"]);
        expect(screen.getByText("En curso")).toBeInTheDocument();

        const ya = screen.getByRole("article", { name: /Matemáticas, curso 5A/ });
        expect(ya).toHaveAttribute("data-estado", "terminada");
        expect(ya).toHaveClass("bg-rose-100");
        expect(within(ya).getByText("Ya se dio")).toBeInTheDocument();
        const ahora = screen.getByRole("article", { name: /Sociales, curso 6B/ });
        expect(ahora).toHaveAttribute("data-estado", "ahora");
        // La de «Ahora» late para que se vea de lejos.
        expect(ahora).toHaveClass("tarjeta-clase-ahora");
        expect(ya).not.toHaveClass("tarjeta-clase-ahora");
    });

    it("en fin de semana muestra el lunes y lo avisa", async () => {
        await abrirEl(new Date("2026-11-14T15:00:00Z"));

        expect(screen.getByRole("tab", { name: "Lunes: 1 clase" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Hoy es sábado: no hay clases. Te mostramos el horario del lunes.")).toBeInTheDocument();
    });

    it("en preescolar, «Asistencia diaria» solo toma asistencia y sus materias solo abren la planilla", async () => {
        responder({
            clasesResueltas: [
                { id: 30, horario_id: 701, materia: "ASISTENCIA DIARIA", curso: "Transición A", curso_id: 400, jornada: "Mañana", dia: "Lunes", hora_inicio: "06:30", hora_fin: "12:30", nivel: "preescolar" },
                { id: 31, horario_id: 702, materia: "DIMENSIÓN COMUNICATIVA", curso: "Transición A", curso_id: 400, jornada: "Mañana", dia: "Lunes", hora_inicio: "08:00", hora_fin: "09:00", nivel: "preescolar" },
            ],
        });
        vi.useFakeTimers({ now: LUNES_7_30, shouldAdvanceTime: true });
        iniciarSesionProfesor();
        render(<DashboardProfesor />);
        const jornada = await screen.findByRole("article", { name: /ASISTENCIA DIARIA/ });
        const materia = screen.getByRole("article", { name: /DIMENSIÓN COMUNICATIVA/ });

        expect(within(jornada).getByRole("button", { name: "Tomar asistencia del día" })).toBeInTheDocument();
        expect(within(jornada).queryByRole("button", { name: "Planilla" })).not.toBeInTheDocument();
        expect(within(materia).getByRole("button", { name: "Planilla" })).toBeInTheDocument();
        expect(within(materia).queryByRole("button", { name: /asistencia/i })).not.toBeInTheDocument();
        expect(within(materia).getByText("Siguiente")).toBeInTheDocument();
    });
});
