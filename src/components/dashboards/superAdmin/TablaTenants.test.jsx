import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TablaTenants from "./TablaTenants";

const tenants = [
    {
        id: 1,
        nombre: "Colegio Uno",
        subdominio: "colegio_uno",
        esquema_db: "tenant_uno",
        fecha_proximo_pago: "2026-09-01",
        dias_gracia: 5,
        estado: "activo",
    },
    {
        id: 2,
        nombre: "Colegio Dos",
        subdominio: "colegio_dos",
        esquema_db: "tenant_dos",
        fecha_proximo_pago: null,
        estado: "en_mora",
        estado_manual: "activo",
    },
];

const propiedades = (extra = {}) => ({
    tenants,
    loading: false,
    error: "",
    savingId: null,
    pagandoId: null,
    onCambiarEstado: vi.fn(),
    onRegistrarPago: vi.fn(),
    onVerHistorial: vi.fn(),
    ...extra,
});

const filaDe = (nombre) => screen.getByRole("cell", { name: nombre }).closest("tr");

describe("TablaTenants", () => {
    it("muestra el indicador de carga sin tabla", () => {
        render(<TablaTenants {...propiedades({ loading: true })} />);

        expect(screen.getByText("Cargando...")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("muestra el error por encima de la lista", () => {
        render(
            <TablaTenants
                {...propiedades({ error: "No se pudieron cargar los colegios." })}
            />,
        );

        expect(screen.getByText("No se pudieron cargar los colegios.")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("muestra el estado vacío sin tenants", () => {
        render(<TablaTenants {...propiedades({ tenants: [] })} />);

        expect(screen.getByText("No hay tenants registrados.")).toBeInTheDocument();
    });

    it("pinta cada fila con sus respaldos y el estado manual divergente", () => {
        render(<TablaTenants {...propiedades()} />);

        const filaDos = filaDe("Colegio Dos");
        expect(within(filaDos).getByText("Sin fecha")).toBeInTheDocument();
        expect(within(filaDos).getByText("0 dias")).toBeInTheDocument();
        expect(within(filaDos).getByText("Manual: activo")).toBeInTheDocument();
        expect(within(filaDos).getByRole("combobox")).toHaveValue("activo");

        const filaUno = filaDe("Colegio Uno");
        expect(within(filaUno).getByText("2026-09-01")).toBeInTheDocument();
        expect(within(filaUno).getByText("5 dias")).toBeInTheDocument();
        expect(within(filaUno).queryByText(/^Manual:/)).not.toBeInTheDocument();
    });

    it("informa el cambio de estado y la consulta del historial", () => {
        const onCambiarEstado = vi.fn();
        const onVerHistorial = vi.fn();
        render(<TablaTenants {...propiedades({ onCambiarEstado, onVerHistorial })} />);

        fireEvent.change(within(filaDe("Colegio Uno")).getByRole("combobox"), {
            target: { value: "suspendido" },
        });
        expect(onCambiarEstado).toHaveBeenCalledWith(tenants[0], "suspendido");

        fireEvent.click(within(filaDe("Colegio Dos")).getByRole("button", { name: "Ver" }));
        expect(onVerHistorial).toHaveBeenCalledWith(tenants[1]);
    });

    it("deshabilita solo el selector de la fila que se está guardando", () => {
        render(<TablaTenants {...propiedades({ savingId: 1 })} />);

        expect(within(filaDe("Colegio Uno")).getByRole("combobox")).toBeDisabled();
        expect(within(filaDe("Colegio Dos")).getByRole("combobox")).toBeEnabled();
    });

    it("informa el registro de pago de la fila", () => {
        const onRegistrarPago = vi.fn();
        render(<TablaTenants {...propiedades({ onRegistrarPago })} />);

        fireEvent.click(
            within(filaDe("Colegio Dos")).getByRole("button", { name: "Registrar pago" }),
        );

        expect(onRegistrarPago).toHaveBeenCalledWith(tenants[1]);
    });

    it("deshabilita solo el botón de pago de la fila que se está guardando", () => {
        render(<TablaTenants {...propiedades({ pagandoId: 2 })} />);

        expect(
            within(filaDe("Colegio Dos")).getByRole("button", { name: "Registrar pago" }),
        ).toBeDisabled();
        expect(
            within(filaDe("Colegio Uno")).getByRole("button", { name: "Registrar pago" }),
        ).toBeEnabled();
    });
});
