import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardProfesor from "./DashboardProfesor";

const { apiMock, navigateMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    navigateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
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

const planeaciones = [
    { id: 900, tema: "Fracciones", fecha: "2026-08-05T00:00:00" },
    { id: 901, tema: "", fecha: "2026-08-03" },
];

const locationOriginal = window.location;

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
    planeacionesResueltas = planeaciones,
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
        if (url.startsWith("/plan-de-clases/")) return Promise.resolve({ data: planeacionesResueltas });
        throw new Error(`GET inesperado: ${url}`);
    });
};

const selectClase = () => screen.getByLabelText("Clase / grupo");
const selectCurso = () => within(screen.getByText("Curso").closest("div")).getByRole("combobox");
const selectMateria = () => within(screen.getByText("Materia").closest("div")).getByRole("combobox");

const esperarClasesCargadas = () =>
    screen.findByRole("option", { name: "Matemáticas - 5A - ☀ Mañana" });

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
        window.alert = vi.fn();
        vi.spyOn(console, "error").mockImplementation(() => {});
        delete window.location;
        window.location = { href: "" };
        responder();
    });

    afterEach(() => {
        window.location = locationOriginal;
    });

    it("redirige a login y no consulta nada cuando no hay profesor", () => {
        render(<DashboardProfesor />);

        expect(window.location.href).toBe("/login");
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
        expect(
            screen.getByRole("heading", { level: 1, name: "Panel del Profesor" }),
        ).toBeInTheDocument();
        await esperarClasesCargadas();
    });

    it("deduplica el selector de clases por curso y materia", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        const opciones = within(selectClase())
            .getAllByRole("option")
            .map((opcion) => opcion.textContent);
        expect(opciones).toEqual([
            "Vista general de clases",
            "Matemáticas - 5A - ☀ Mañana",
            "Español - 5A - ☀ Mañana",
            "Sociales - 6B - ◐ Tarde",
        ]);
    });

    it("guarda el contexto de trabajo en el almacenamiento local", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        fireEvent.change(selectClase(), { target: { value: "11" } });
        expect(localStorage.getItem("asignacionId")).toBe("11");

        fireEvent.change(screen.getByLabelText("Período"), { target: { value: "3" } });
        expect(localStorage.getItem("periodo")).toBe("3");
        expect(localStorage.getItem(`periodo_profesor_${PROFESOR_ID}`)).toBe("3");

        fireEvent.change(screen.getByLabelText("Fecha de trabajo"), {
            target: { value: "2026-08-07" },
        });
        expect(localStorage.getItem("fechaAsistencia")).toBe("2026-08-07");
    });

    it("descarta la clase guardada que ya no está asignada", async () => {
        iniciarSesionProfesor();
        localStorage.setItem("asignacionId", "999");

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        await waitFor(() => expect(localStorage.getItem("asignacionId")).toBeNull());
        expect(selectClase()).toHaveValue("");
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
        expect(screen.getByText("No hay datos disponibles")).toBeInTheDocument();
        expect(await screen.findByText("2.35")).toBeInTheDocument();
    });

    it("no consulta el rendimiento cuando el profesor no tiene cursos", async () => {
        iniciarSesionProfesor();
        responder({ clasesResueltas: [] });

        render(<DashboardProfesor />);

        expect(await screen.findByRole("option", { name: "Sin clases asignadas" })).toBeInTheDocument();
        expect(screen.getByText("No tienes clases con horario asignado todavía.")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Sin cursos asignados" })).toBeInTheDocument();
        expect(llamadasA(`/dashboard/notas-bajas/${PROFESOR_ID}`)).toHaveLength(0);
        expect(llamadasA(`/dashboard/notas-altas/${PROFESOR_ID}`)).toHaveLength(0);
    });

    it("agrupa el horario por jornada y ofrece el filtro cuando hay dos", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        expect(screen.getByText("4 clases")).toBeInTheDocument();
        expect(screen.getByText("3 en la mañana · 1 en la tarde")).toBeInTheDocument();
        expect(screen.getByRole("group", { name: "Filtrar horario por jornada" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Jornada mañana" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Jornada tarde" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Tarde" }));

        expect(screen.queryByRole("heading", { name: "Jornada mañana" })).not.toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Jornada tarde" })).toBeInTheDocument();
    });

    it("deduce la jornada por la hora cuando la asignación no la trae", async () => {
        iniciarSesionProfesor();
        responder({
            clasesResueltas: [
                { id: 20, horario_id: 601, materia: "Arte", curso: "7C", curso_id: 300, jornada: "", dia: "Lunes", hora_inicio: "14:00", hora_fin: "15:00" },
                { id: 21, horario_id: 602, materia: "Música", curso: "7C", curso_id: 300, jornada: "manana", dia: "Martes", hora_inicio: "16:00", hora_fin: "17:00" },
            ],
        });

        render(<DashboardProfesor />);

        expect(await screen.findByRole("option", { name: "Arte - 7C - ◐ Tarde" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Música - 7C - ☀ Mañana" })).toBeInTheDocument();
    });

    it("muestra la insignia de jornada única cuando no hay dos jornadas", async () => {
        iniciarSesionProfesor();
        responder({
            clasesResueltas: [
                { id: 20, horario_id: 601, materia: "Arte", curso: "7C", curso_id: 300, jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
            ],
        });

        render(<DashboardProfesor />);
        await screen.findByRole("option", { name: "Arte - 7C - ☀ Mañana" });

        expect(
            screen.queryByRole("group", { name: "Filtrar horario por jornada" }),
        ).not.toBeInTheDocument();
        // La insignia del encabezado más el título del único panel de jornada.
        expect(screen.getAllByText("Jornada mañana")).toHaveLength(2);
        expect(screen.queryByRole("heading", { name: "Jornada tarde" })).not.toBeInTheDocument();
    });

    it("muestra las franjas del horario en formato de 12 horas", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        expect(screen.getAllByText("7:00 AM - 8:00 AM").length).toBeGreaterThan(0);
        expect(screen.getAllByText("1:00 PM - 2:00 PM").length).toBeGreaterThan(0);
    });

    it("consulta las planeaciones recientes de la clase elegida y las cachea", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        fireEvent.change(selectClase(), { target: { value: "10" } });

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/plan-de-clases/10", {
                params: { limit: 5, offset: 0 },
            });
        });
        expect(
            await screen.findByRole("option", { name: "Fracciones — 5 de ago de 2026" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("option", { name: "Sin tema registrado — 3 de ago de 2026" }),
        ).toBeInTheDocument();

        fireEvent.change(selectClase(), { target: { value: "11" } });
        await waitFor(() => expect(llamadasA("/plan-de-clases/11")).toHaveLength(1));

        fireEvent.change(selectClase(), { target: { value: "10" } });
        await waitFor(() =>
            expect(screen.getByRole("option", { name: "Fracciones — 5 de ago de 2026" })).toBeInTheDocument(),
        );
        expect(llamadasA("/plan-de-clases/10")).toHaveLength(1);
    });

    it("no consulta planeaciones sin clase elegida", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        expect(apiMock.get.mock.calls.some(([url]) => url.startsWith("/plan-de-clases/"))).toBe(false);
        expect(screen.queryByLabelText(/Planeaciones recientes/)).not.toBeInTheDocument();
    });

    it("avisa cuando las planeaciones recientes fallan", async () => {
        iniciarSesionProfesor();
        apiMock.get.mockImplementation((url) => {
            if (url === `/mis-clases/${PROFESOR_ID}`) return Promise.resolve({ data: clases });
            if (url === `/dashboard/inasistencias/${PROFESOR_ID}`) return Promise.resolve({ data: inasistencias });
            if (url === `/dashboard/cumpleanos/profesor/${PROFESOR_ID}`) return Promise.resolve({ data: [] });
            if (url === `/dashboard/notas-bajas/${PROFESOR_ID}`) return Promise.resolve({ data: notasBajas });
            if (url === `/dashboard/notas-altas/${PROFESOR_ID}`) return Promise.resolve({ data: notasAltas });
            if (url.startsWith("/plan-de-clases/")) return Promise.reject(new Error("500"));
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        fireEvent.change(selectClase(), { target: { value: "10" } });

        expect(
            await screen.findByText("No se pudieron cargar las planeaciones recientes."),
        ).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "No se pudieron cargar" })).toBeInTheDocument();
    });

    it("abre la planeación reciente en modo presentación", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        fireEvent.change(selectClase(), { target: { value: "10" } });
        const selectPlaneacion = await screen.findByLabelText(/Planeaciones recientes/);

        fireEvent.change(selectPlaneacion, { target: { value: "900" } });

        expect(navigateMock).toHaveBeenCalledWith(
            "/plan-de-clases?asignacion_id=10&fecha=2026-08-05&presentacion=1",
        );
    });

    it("exige una clase antes de abrir los rankings", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);
        await esperarClasesCargadas();

        const [rankingBajo, rankingAlto] = screen.getAllByRole("button", {
            name: "Ver ranking por materia",
        });

        fireEvent.click(rankingBajo);
        expect(window.alert).toHaveBeenCalledWith(
            "Por favor, selecciona un salón (materia) primero para ver el ranking.",
        );
        expect(navigateMock).not.toHaveBeenCalled();

        fireEvent.change(selectClase(), { target: { value: "10" } });
        fireEvent.click(rankingBajo);
        expect(navigateMock).toHaveBeenCalledWith("/ranking-rendimiento");

        fireEvent.click(rankingAlto);
        expect(navigateMock).toHaveBeenCalledWith("/ranking-mejor-rendimiento");
    });

    it("pasa a cumpleaños el texto vacío propio del profesor", async () => {
        iniciarSesionProfesor();

        render(<DashboardProfesor />);

        expect(
            await screen.findByText(
                "Esta semana no hay estudiantes de tus cursos asignados cumpliendo años.",
            ),
        ).toBeInTheDocument();
    });
});
