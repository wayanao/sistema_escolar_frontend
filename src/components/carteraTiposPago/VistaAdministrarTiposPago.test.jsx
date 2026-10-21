import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CONFIG_DEFAULT } from "../../utils/carteraTiposPago/tiposPago";
import VistaAdministrarTiposPago from "./VistaAdministrarTiposPago";

const tipoPago = {
    id: 1,
    nombre: "Matrícula",
    valor: 350000,
    tipo_cobro: "mensual",
    activo: true,
    cursos: [{ curso_id: 10 }],
};

const crearProps = () => ({
    tiposPagos: [tipoPago],
    cursos: [],
    estadoFiltro: "activo",
    setEstadoFiltro: vi.fn(),
    selectedTipoId: null,
    detalle: null,
    loadingDetalle: false,
    cerrarDetalle: vi.fn(),
    resumenEstados: { activo: 1, inactivo: 0, todos: 1 },
    tiposPagosFiltrados: [tipoPago],
    mensajeConceptosVacios: "No hay conceptos activos.",
    nuevoTipoPago: "",
    setNuevoTipoPago: vi.fn(),
    valorTipoPago: "",
    setValorTipoPago: vi.fn(),
    editingTipoId: null,
    handleSubmit: vi.fn((event) => event.preventDefault()),
    handleEdit: vi.fn(),
    cancelarEdicion: vi.fn(),
    config: { tipo_cobro: "unico", activo: true },
    guardandoConfig: false,
    handleConfigChange: vi.fn(),
    guardarConfiguracion: vi.fn(),
    cursosAsignados: [],
    cursoAAgregar: "",
    setCursoAAgregar: vi.fn(),
    valorCursoAAgregar: "",
    setValorCursoAAgregar: vi.fn(),
    guardandoCursos: false,
    cursosAsignadosDirty: false,
    cursosDisponibles: [],
    cursosAsignadosActivos: 0,
    totalCursosActivos: 0,
    cursosPendientes: 0,
    agregarCursoLocal: vi.fn(),
    agregarTodosLosCursos: vi.fn(),
    actualizarValorCurso: vi.fn(),
    toggleActivoCurso: vi.fn(),
    quitarCurso: vi.fn(),
    guardarAsignacionCursos: vi.fn(),
    seleccionarTipoParaConfigurar: vi.fn(),
});

describe("VistaAdministrarTiposPago", () => {
    it("presenta el formulario y listado sin administrar estado de dominio", () => {
        const props = crearProps();
        render(<VistaAdministrarTiposPago {...props} />);

        expect(screen.getByText("Matrícula")).toBeInTheDocument();
        expect(screen.getByText("✓ Publicado")).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Ej: Matrícula, Copias..."), {
            target: { value: "Transporte" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Inactivos (0)" }));
        fireEvent.click(screen.getByRole("button", { name: "⚙️ Configurar" }));
        fireEvent.click(screen.getByTitle("Editar nombre/valor"));

        expect(props.setNuevoTipoPago).toHaveBeenCalledWith("Transporte");
        expect(props.setEstadoFiltro).toHaveBeenCalledWith("inactivo");
        expect(props.seleccionarTipoParaConfigurar).toHaveBeenCalledWith(tipoPago);
        expect(props.handleEdit).toHaveBeenCalledWith(tipoPago);
    });

    it("mientras carga la lista la primera vez lo dice, en vez de decir que no hay conceptos", () => {
        render(
            <VistaAdministrarTiposPago
                {...crearProps()}
                tiposPagos={[]}
                tiposPagosFiltrados={[]}
                cargandoConceptos
            />
        );

        expect(screen.getByText("Cargando conceptos...")).toBeInTheDocument();
        expect(screen.queryByText("No hay conceptos registrados")).not.toBeInTheDocument();
    });

    it("si falla la lista sin datos, muestra el error con Reintentar", () => {
        const onReintentarConceptos = vi.fn();
        render(
            <VistaAdministrarTiposPago
                {...crearProps()}
                tiposPagos={[]}
                tiposPagosFiltrados={[]}
                errorConceptos="No se pudieron cargar los conceptos de pago."
                onReintentarConceptos={onReintentarConceptos}
            />
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "No se pudieron cargar los conceptos de pago."
        );
        expect(screen.queryByText("No hay conceptos registrados")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(onReintentarConceptos).toHaveBeenCalledTimes(1);
    });

    it("al recargar la lista la conserva y avisa que actualiza", () => {
        render(<VistaAdministrarTiposPago {...crearProps()} actualizandoConceptos />);

        expect(screen.getByRole("status")).toHaveTextContent("Actualizando...");
        expect(screen.getByText("Matrícula")).toBeInTheDocument();
    });

    it("el formulario dice si es un concepto nuevo o cuál se está editando", () => {
        const props = crearProps();
        const { rerender } = render(<VistaAdministrarTiposPago {...props} />);

        expect(screen.getByRole("heading", { name: "Nuevo concepto" })).toBeInTheDocument();

        rerender(<VistaAdministrarTiposPago {...props} editingTipoId={1} />);

        expect(screen.getByRole("heading", { name: "Editar concepto" })).toBeInTheDocument();
        expect(
            screen.getByText("Estás cambiando el nombre o el valor base de «Matrícula».")
        ).toBeInTheDocument();
    });

    it("mientras guarda el concepto, el botón lo dice y el formulario espera", () => {
        render(<VistaAdministrarTiposPago {...crearProps()} guardandoConcepto />);

        expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
        expect(screen.getByPlaceholderText("Ej: Matrícula, Copias...")).toBeDisabled();
    });

    it("resalta el concepto recién guardado y marca cada fila con su número", () => {
        const { container } = render(
            <VistaAdministrarTiposPago {...crearProps()} conceptoResaltadoId={1} />
        );

        expect(container.querySelector('[data-concepto-id="1"]')).toHaveClass("bg-green-50");
    });

    it("muestra el mes final únicamente para cobros mensuales", () => {
        const props = {
            ...crearProps(),
            selectedTipoId: 1,
            detalle: tipoPago,
            config: {
                ...CONFIG_DEFAULT,
                tipo_cobro: "mensual",
                mes_inicial: 2,
                mes_final: 11,
            },
        };
        const { rerender } = render(<VistaAdministrarTiposPago {...props} />);

        expect(screen.getByText("Mes final", { selector: "label" })).toBeInTheDocument();

        rerender(
            <VistaAdministrarTiposPago
                {...props}
                config={{ ...props.config, tipo_cobro: "anual" }}
            />
        );

        expect(screen.queryByText("Mes final", { selector: "label" })).not.toBeInTheDocument();
    });
});

describe("VistaAdministrarTiposPago según el año que se mira", () => {
    const conPanelAbierto = (props) => ({
        ...props,
        selectedTipoId: 1,
        detalle: tipoPago,
        config: { ...CONFIG_DEFAULT, tipo_cobro: "mensual", mes_inicial: 2, mes_final: 11 },
        cursosAsignados: [{ curso_id: 10, curso_nombre: "5A", valor: 350000, activo: true }],
        cursosDisponibles: [{ id: 20, nombre: "6B" }],
        cursoAAgregar: "20",
        cursosAsignadosDirty: true,
    });

    it("sin poder crear, el formulario solo aparece para editar un concepto", () => {
        const props = { ...crearProps(), puedeCrear: false };
        const { rerender } = render(<VistaAdministrarTiposPago {...props} />);

        expect(screen.queryByRole("button", { name: "Guardar Concepto" })).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText("Ej: Matrícula, Copias...")).not.toBeInTheDocument();

        fireEvent.click(screen.getByTitle("Editar nombre/valor"));
        expect(props.handleEdit).toHaveBeenCalledWith(tipoPago);

        rerender(<VistaAdministrarTiposPago {...props} editingTipoId={1} />);
        expect(screen.getByRole("button", { name: "Actualizar Concepto" })).toBeInTheDocument();
    });

    it("mientras carga el detalle dice qué está cargando", () => {
        render(
            <VistaAdministrarTiposPago
                {...conPanelAbierto(crearProps())}
                loadingDetalle
            />
        );

        expect(screen.getByText("Cargando configuración...")).toBeInTheDocument();
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("avisa cuando hay cambios de configuración sin guardar", () => {
        render(
            <VistaAdministrarTiposPago
                {...conPanelAbierto(crearProps())}
                configSinGuardar
            />
        );

        expect(screen.getByText("Hay cambios de configuración sin guardar.")).toBeInTheDocument();
    });

    it("mientras guarda configuración o cursos, cada botón lo dice con el círculo", () => {
        const props = conPanelAbierto(crearProps());
        const { rerender } = render(
            <VistaAdministrarTiposPago {...props} guardandoConfig />
        );

        expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
        expect(screen.getByTestId("spinner")).toBeInTheDocument();

        rerender(<VistaAdministrarTiposPago {...props} guardandoCursos />);

        expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    });

    it("si fallan los cursos, lo dice con Reintentar en vez de mostrar 0 de 0", () => {
        const onReintentarCursos = vi.fn();
        render(
            <VistaAdministrarTiposPago
                {...conPanelAbierto(crearProps())}
                errorCursos="No se pudieron cargar los cursos."
                onReintentarCursos={onReintentarCursos}
            />
        );

        expect(screen.getByText("No se pudieron cargar los cursos.")).toBeInTheDocument();
        expect(screen.queryByText(/cursos activos asignados/)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(onReintentarCursos).toHaveBeenCalledTimes(1);
    });

    it("en un año que se edita, la configuración y los precios se pueden guardar", () => {
        const props = conPanelAbierto({ ...crearProps(), puedeCrear: false, puedeEditar: true });
        render(<VistaAdministrarTiposPago {...props} />);

        expect(screen.getByText("Tipo de cobro", { selector: "label" }).parentElement.querySelector("select"))
            .not.toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Guardar configuración" }));
        fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
        fireEvent.click(screen.getByRole("button", { name: "Guardar asignación de cursos" }));

        expect(props.guardarConfiguracion).toHaveBeenCalledTimes(1);
        expect(props.agregarCursoLocal).toHaveBeenCalledTimes(1);
        expect(props.guardarAsignacionCursos).toHaveBeenCalledTimes(1);
    });

    it("en un año cerrado solo se consulta: sin crear, sin ✏️ y la configuración bloqueada", () => {
        const props = conPanelAbierto({ ...crearProps(), puedeCrear: false, puedeEditar: false });
        render(<VistaAdministrarTiposPago {...props} />);

        expect(screen.queryByRole("button", { name: "Guardar Concepto" })).not.toBeInTheDocument();
        expect(screen.queryByTitle("Editar nombre/valor")).not.toBeInTheDocument();
        // Configurar sigue abriendo el concepto, para mirarlo.
        expect(screen.getByRole("button", { name: "⚙️ Configurar" })).toBeEnabled();

        expect(screen.getByText("Tipo de cobro", { selector: "label" }).parentElement.querySelector("select"))
            .toBeDisabled();
        expect(screen.getByText("Mes final", { selector: "label" }).parentElement.querySelector("select"))
            .toBeDisabled();
        expect(screen.getByDisplayValue("350000")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Quitar" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "+ Agregar todos los cursos" })).toBeDisabled();
        expect(screen.queryByRole("button", { name: "Guardar configuración" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Guardar asignación de cursos" })).not.toBeInTheDocument();
        // Cerrar el panel sí se puede.
        expect(screen.getByRole("button", { name: "✕ Cerrar" })).toBeEnabled();
    });
});
