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
